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
                dto.setTotalValue(dto.getCurrentPrice() * item.getShares());
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
    @PostMapping("/add")
    public ResponseEntity<?> addRecord(@RequestBody AddRecordRequest request) {
        return processTrade(request, "ADD");
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

            Integer execShares = request.getShares();
            Double totalCost = request.getTotalCost();

            // 智能算账：如果只填了总投入没填股数，或者填了股数没填总投入，系统自动反推
            if (execShares == null && totalCost != null && execPrice > 0) {
                execShares = (int) (totalCost / execPrice);
            } else if (totalCost == null && execShares != null && execPrice > 0) {
                totalCost = execShares * execPrice;
            }
            if (execShares == null) execShares = 0;
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
                    item.setShares(0);
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
    // 升级版：缓存优先 (Cache-First) + 异步静默更新
    // ==========================================
    @GetMapping("/market/quotes")
    public List<AssetSearchResult> getBatchQuotes(@RequestParam String tickers) {
        List<String> tickerList = Arrays.asList(tickers.split(","));

        // 1. 第一步：直接去 MySQL 数据库里查缓存
        List<MarketCache> cachedData = (List<MarketCache>) marketCacheRepo.findAllById(tickerList);

        // 2. 如果数据库里完全没数据（比如项目刚部署第一次运行），只能阻塞等待同步获取
        if (cachedData.isEmpty()) {
            System.out.println("⚠️ 数据库为空，首次阻塞拉取 EODHD 数据...");
            return fetchAndCacheMissingTickers(tickerList);
        }

        // 3. 将数据库里的缓存数据转换为前端需要的 DTO 格式
        List<AssetSearchResult> results = new ArrayList<>();
        for (MarketCache cache : cachedData) {
            AssetSearchResult r = new AssetSearchResult();
            r.setTicker(cache.getTicker());
            r.setName(cache.getName());
            r.setPrice(cache.getPrice());
            r.setChange(cache.getChange());
            r.setChangePercent(cache.getChangePercent());
            r.setVolume(cache.getVolume());
            r.setDayHigh(cache.getDayHigh());
            r.setDayLow(cache.getDayLow());
            results.add(r);
        }

        // 4. 【核心魔法】：开启一个后台独立线程，偷偷去 EODHD 拉取最新数据并写入数据库
        // 这样前端不会卡顿等待，下次刷新就能看到最新数据了！
        CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🔄 [后台静默任务] 正在从 EODHD 同步最新行情...");
                fetchAndCacheMissingTickers(tickerList);
            } catch (Exception e) {
                System.err.println("⚠️ 后台静默更新失败: " + e.getMessage());
            }
        });

        // 5. 立刻将刚才查到的缓存数据返回给前端，实现页面秒开！
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
}