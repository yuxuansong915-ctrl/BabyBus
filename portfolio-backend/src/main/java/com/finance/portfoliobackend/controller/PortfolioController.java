package com.finance.portfoliobackend.controller;

import com.finance.portfoliobackend.dto.AddRecordRequest;
import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import com.finance.portfoliobackend.model.MarketCache;
import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.model.TransactionRecord;
import com.finance.portfoliobackend.repository.MarketCacheRepository;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import com.finance.portfoliobackend.repository.TransactionRecordRepository;
import com.finance.portfoliobackend.service.FinanceDataService;
import com.finance.portfoliobackend.service.YahooFinanceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.concurrent.CompletableFuture;
import com.finance.portfoliobackend.service.DeepSeekAIService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {

    @Autowired private PortfolioItemRepository repository;
    @Autowired private TransactionRecordRepository transactionRepo;
    @Autowired private MarketCacheRepository marketCacheRepo;
    @Autowired private FinanceDataService financeService;
    @Autowired private YahooFinanceClient yahooClient; // 注入新客户端
    // 找到你原有的 @Autowired 代码块，加上这行：
    @Autowired private DeepSeekAIService aiService;

    @GetMapping
    public List<PortfolioItemDTO> getAllItems() {
        List<PortfolioItem> items = repository.findAll();
        List<PortfolioItemDTO> resultList = new ArrayList<>();

        for (PortfolioItem item : items) {
            PortfolioItemDTO dto = new PortfolioItemDTO();
            dto.setId(item.getId());
            dto.setTicker(item.getTicker());
            dto.setAssetType(item.getAssetType());
            dto.setShares(item.getShares());

            // 1. 调用 Service 方法（Yahoo 实时价 + DB 缓存基本面）
            financeService.populateFundamentals(item, dto);

            // ==========================================
            // 关键修复：防崩溃保护！
            // 强行把所有可能导致前端 React 崩溃的 null 转换为 0.0
            // ==========================================
            if (dto.getCurrentPrice() == null) dto.setCurrentPrice(0.0);
            if (dto.getChange() == null) dto.setChange(0.0);
            if (dto.getChangePercent() == null) dto.setChangePercent(0.0);
            if (dto.getTotalValue() == null) dto.setTotalValue(0.0);
            if (dto.getPeRatio() == null) dto.setPeRatio(0.0);
            if (dto.getDividendYield() == null) dto.setDividendYield(0.0);

            // 2. 重新计算总价值
            if (dto.getCurrentPrice() > 0) {
                // a. 计算该资产在其原始货币下的总价值 (Native Value)
                double nativeTotalValue = dto.getCurrentPrice() * item.getShares();

                // b. 识别该资产的原始货币
                String nativeCurrency = financeService.getCurrencyForTicker(item.getTicker());

                // c. 转换为统一基准货币 (USD) 并存入 DTO
                double unifiedValue = financeService.convertToUSD(nativeTotalValue, nativeCurrency);
                dto.setTotalValue(unifiedValue);
            }

            // 3. 后台异步刷新 Finnhub 缓存
            financeService.refreshAndCachePortfolioItem(item);

            resultList.add(dto);
        }
        return resultList;
    }

    // ==========================================
    // 1. 处理买入请求
    // ==========================================
// ==========================================
    // 终极修复版：支持小数 + 自动推算数量 + 自动抓取现价
    // ==========================================
    @PostMapping("/add")
    public ResponseEntity<?> addRecord(@RequestBody AddRecordRequest request) {
        try {
            Double execPrice = request.getPrice();

            // 1. 智能兜底：如果前端没传单价，自动去 Yahoo 抓取最新价！
            if (execPrice == null || execPrice <= 0) {
                YahooFinanceClient.AssetQuote quote = yahooClient.getQuote(request.getTicker());
                if (quote != null && quote.getRegularMarketPrice() > 0) {
                    execPrice = quote.getRegularMarketPrice();
                } else {
                    return ResponseEntity.badRequest().body("未能自动获取到现价，请手动输入成交单价！");
                }
            }

            Double execShares = request.getShares();
            Double totalCost = request.getTotalCost();

            // 2. 核心大脑：智能互相推算！(解决只填总金额时数量为 0 的 Bug)
            if (execShares == null && totalCost != null && execPrice > 0) {
                execShares = totalCost / execPrice; // 用总金额除以现价，算出精确的小数份额
            } else if (totalCost == null && execShares != null && execPrice > 0) {
                totalCost = execShares * execPrice;
            }

            // 兜底检查
            if (execShares == null || execShares <= 0) {
                return ResponseEntity.badRequest().body("交易数量计算异常，请检查输入参数");
            }

            // 3. 更新持仓表
            PortfolioItem item = repository.findByTicker(request.getTicker()).orElseGet(() -> {
                PortfolioItem newItem = new PortfolioItem();
                newItem.setTicker(request.getTicker());
                newItem.setAssetType(request.getAssetType());
                newItem.setShares(0.0); // 必须是 Double
                return newItem;
            });

            item.setShares(item.getShares() + execShares); // 累加小数份额
            PortfolioItem savedItem = repository.save(item);

            // 4. 记录流水
            TransactionRecord record = new TransactionRecord();
            record.setTicker(request.getTicker());
            record.setActionType("ADD");
            record.setShares(execShares);
            record.setPrice(execPrice);
            record.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
            record.setEmotion(request.getEmotion());
            record.setTimestamp(LocalDateTime.now());
            transactionRepo.save(record);

            return ResponseEntity.ok(savedItem);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("处理失败: " + e.getMessage());
        }
    }

    // ==========================================
    // 2. 处理卖出请求 (核心修复：前端之前调了这个接口但后端没有)
    // ==========================================
    @PostMapping("/sell")
    public ResponseEntity<?> sellRecord(@RequestBody AddRecordRequest request) {
        return processTrade(request, "SELL");
    }

    // ==========================================
    // 3. 统一交易处理引擎 (智能补全价格 + 算账 + 风控拦截)
    // ==========================================
    private ResponseEntity<?> processTrade(AddRecordRequest request, String action) {
        try {
            boolean isSell = action.equals("SELL");
            Double execPrice = request.getPrice();

            // 智能兜底：如果前端没传价格，自动去获取真实市场现价
            if (execPrice == null || execPrice <= 0) {
                YahooFinanceClient.AssetQuote quote = yahooClient.getQuote(request.getTicker());
                if (quote != null && quote.getRegularMarketPrice() > 0) {
                    execPrice = quote.getRegularMarketPrice();
                } else {
                    execPrice = 0.0;
                }
            }

            Double execShares = request.getShares();
            Double totalCost = request.getTotalCost();

            // 智能算账：如果只填了总投入没填股数，或者填了股数没填总投入，系统自动反推
            if (execShares == null && totalCost != null && execPrice > 0) {
                execShares = totalCost / execPrice;
            } else if (totalCost == null && execShares != null && execPrice > 0) {
                totalCost = execShares * execPrice;
            }
            if (execShares == null) execShares = 0.0;
            if (totalCost == null) totalCost = 0.0;

            // 获取当前持仓
            PortfolioItem item = repository.findByTicker(request.getTicker()).orElse(null);

            if (isSell) {
                // 【卖出风控】
                if (item == null) {
                    return ResponseEntity.badRequest().body("未找到该资产的持仓，无法卖出！");
                }
                if (item.getShares() < execShares) {
                    return ResponseEntity.badRequest().body("持仓不足，无法卖出！当前仅持有: " + item.getShares() + " 股");
                }

                item.setShares(item.getShares() - execShares); // 减去股数
                if (item.getShares() == 0) {
                    repository.delete(item); // 卖光了直接清仓
                    item = null;
                } else {
                    repository.save(item);
                }
            } else {
                // 【买入逻辑】
                if (item == null) {
                    item = new PortfolioItem();
                    item.setTicker(request.getTicker());
                    item.setAssetType(request.getAssetType());
                    item.setShares(0.0);
                }
                item.setShares(item.getShares() + execShares); // 加上股数
                repository.save(item);
            }

            // 保存完美无缺的交易流水
            TransactionRecord record = new TransactionRecord();
            record.setTicker(request.getTicker());
            record.setActionType(action);
            record.setShares(execShares);
            record.setPrice(execPrice);
            record.setTotalCost(totalCost); // 存入新增的总金额字段
            record.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
            record.setEmotion(request.getEmotion());
            record.setTimestamp(LocalDateTime.now());
            transactionRepo.save(record);

            return ResponseEntity.ok(record);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("服务器处理交易失败: " + e.getMessage());
        }
    }

    @GetMapping("/ledger")
    public List<TransactionRecord> getLedger() {
        return transactionRepo.findAll();
    }

    // ==========================================
    // 终极版：缓存优先 + 15分钟保质期 + 异步更新防并发
    // ==========================================
    @GetMapping("/market/quotes")
    public List<AssetSearchResult> getBatchQuotes(@RequestParam String tickers) {
        List<String> tickerList = Arrays.asList(tickers.split(","));

        // 1. 去 MySQL 里查缓存
        List<MarketCache> cachedData = (List<MarketCache>) marketCacheRepo.findAllById(tickerList);

        // 2. 如果完全没数据，阻塞等待（第一次运行）
        if (cachedData.isEmpty()) {
            System.out.println("⚠️ 数据库为空，首次阻塞拉取 EODHD 数据...");
            return fetchAndCacheMissingTickers(tickerList);
        }

        List<AssetSearchResult> results = new ArrayList<>();
        boolean needsUpdate = false;
        LocalDateTime expirationTime = LocalDateTime.now().minusMinutes(15); // 设置保质期为 15 分钟

        // 3. 组装数据并检查是否过期
        boolean weekendClosed = isWeekend(); // 探测今天是否休市

        for (MarketCache cache : cachedData) {
            AssetSearchResult r = convertToSearchResult(cache);
            results.add(r);

            // 【核心拦截】：如果是周末，强制跳过过期检查（不更新）！
            // 除非是第一次查（lastUpdated 为 null），否则周末绝对不触发 needsUpdate
            if (!weekendClosed) {
                if (cache.getLastUpdated() == null || cache.getLastUpdated().isBefore(expirationTime)) {
                    needsUpdate = true;
                }
            } else if (cache.getLastUpdated() == null) {
                // 即使是周末，如果连基础缓存都没有，还是得破例拉取一次
                needsUpdate = true;
            }
        }

        // 如果缓存的条数比请求的少（比如有新加的股票），也需要去拉取
        if (cachedData.size() < tickerList.size()) {
            needsUpdate = true;
        }

        // 4. 【核心魔法】：只有在数据真正过期时，才开启后台线程拉取！极大地保护了你的 API 额度！
        if (needsUpdate) {
            CompletableFuture.runAsync(() -> {
                try {
                    System.out.println("🔄 [后台静默任务] 数据已过期，正在从 EODHD 同步最新行情...");
                    fetchAndCacheMissingTickers(tickerList);
                } catch (Exception e) {
                    System.err.println("⚠️ 后台静默更新失败: " + e.getMessage());
                }
            });
        }

        // 5. 立刻返回缓存数据，页面秒开！
        return results;
    }

    // ==========================================
    // 将原本的 Yahoo 或 Finnhub 替换为 EODHD 接口
    // ==========================================
    private List<AssetSearchResult> fetchAndCacheMissingTickers(List<String> tickersToFetch) {
        // 调用我们刚刚写好的 EODHD 并发查询方法
        List<AssetSearchResult> freshResults = financeService.getEodhdBulkQuotes(tickersToFetch);

        // 将成功获取到的数据保存到你刚建好的 market_cache 表里
        for (AssetSearchResult r : freshResults) {
            saveToMarketCache(r);
        }

        return freshResults;
    }

    private void saveToMarketCache(AssetSearchResult r) {
        MarketCache cache = new MarketCache();
        cache.setTicker(r.getTicker());
        cache.setName(r.getName());
        cache.setPrice(r.getPrice());
        cache.setChange(r.getChange());
        cache.setChangePercent(r.getChangePercent());
        cache.setVolume(r.getVolume());
        cache.setDayHigh(r.getDayHigh());
        cache.setDayLow(r.getDayLow());
        cache.setLastUpdated(LocalDateTime.now());
        marketCacheRepo.save(cache);
    }

    private AssetSearchResult convertToSearchResult(MarketCache c) {
        AssetSearchResult r = new AssetSearchResult();
        r.setTicker(c.getTicker());
        r.setName(c.getName());
        r.setPrice(c.getPrice() != null ? c.getPrice() : 0.0);
        r.setChange(c.getChange() != null ? c.getChange() : 0.0);
        r.setChangePercent(c.getChangePercent() != null ? c.getChangePercent() : 0.0);
        r.setVolume(c.getVolume() != null ? c.getVolume() : 0);
        r.setDayHigh(c.getDayHigh() != null ? c.getDayHigh() : 0.0);
        r.setDayLow(c.getDayLow() != null ? c.getDayLow() : 0.0);
        return r;
    }

    @GetMapping("/market/kline")
    public List<double[]> getMarketKline(@RequestParam String symbol, @RequestParam(defaultValue = "30") int days) {
        return yahooClient.getMarketKlineData(symbol, days);
    }

    // ==========================================
    // 新增 API：前端 K线图表专属端点
    // ==========================================
    @GetMapping("/market/candlestick")
    public List<double[]> getCandlestickChartData(
            @RequestParam String symbol,
            @RequestParam(defaultValue = "90") int days) {
        // 默认拉取过去 90 天（约 3 个月）的数据，画出来的 K线图最丰满好看
        return yahooClient.getCandlestickData(symbol, days);
    }

    public static class AssetSearchResult {
        private String ticker;
        private String name;
        private double price;
        private double change;
        private double changePercent;
        private long volume;
        private double dayHigh;
        private double dayLow;

        // Getters and Setters
        public String getTicker() { return ticker; }
        public void setTicker(String ticker) { this.ticker = ticker; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        public double getChange() { return change; }
        public void setChange(double change) { this.change = change; }
        public double getChangePercent() { return changePercent; }
        public void setChangePercent(double changePercent) { this.changePercent = changePercent; }
        public long getVolume() { return volume; }
        public void setVolume(long volume) { this.volume = volume; }
        public double getDayHigh() { return dayHigh; }
        public void setDayHigh(double dayHigh) { this.dayHigh = dayHigh; }
        public double getDayLow() { return dayLow; }
        public void setDayLow(double dayLow) { this.dayLow = dayLow; }
    }

    // ==========================================
    // 新增：简单粗暴的周末休市探测器
    // ==========================================
    private boolean isWeekend() {
        java.time.DayOfWeek day = java.time.LocalDate.now().getDayOfWeek();
        // 如果是周六或周日，返回 true
        return day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY;
    }

    // ==========================================
    // 🤖 AI Agent 专属接口：生成投资组合深度研报
    // ==========================================
    @GetMapping("/ai/analyze")
    public ResponseEntity<?> getAiAnalysis() {
        try {
            // 1. 复用你之前写好的完美方法，拉取带最新行情的持仓 DTO
            List<PortfolioItemDTO> currentPortfolio = getAllItems();

            // 2. 组装喂给 AI 的上下文数据
            Map<String, Object> aiContext = new HashMap<>();
            aiContext.put("portfolio", currentPortfolio);
            // 还能加上用户的风控红线，让 AI 帮忙盯盘
            aiContext.put("maxStockRatioLimit", 70.0);

            // 3. 呼叫 DeepSeek 大脑
            String markdownReport = aiService.generatePortfolioInsights(aiContext);

            // 4. 返回给前端
            return ResponseEntity.ok(Map.of("report", markdownReport));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("AI Analysis Request Failed: " + e.getMessage());
        }
    }

    // 在 @GetMapping("/ai/analyze") 的下方新增这个 POST 接口
    @PostMapping("/ai/chat")
    public ResponseEntity<?> continueAiChat(@RequestBody Map<String, Object> request) {
        try {
            // 接收前端传来的完整聊天历史
            List<Map<String, String>> messages = (List<Map<String, String>>) request.get("messages");
            String reply = aiService.chatWithHistory(messages);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Chat failed: " + e.getMessage());
        }
    }
}