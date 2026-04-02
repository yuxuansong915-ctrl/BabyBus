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

    @PostMapping("/add")
    public PortfolioItem addRecord(@RequestBody AddRecordRequest request) {
        // 使用无参构造器，严格匹配 Double 类型
        PortfolioItem item = repository.findByTicker(request.getTicker())
                .orElseGet(() -> {
                    PortfolioItem newItem = new PortfolioItem();
                    newItem.setTicker(request.getTicker());
                    newItem.setAssetType(request.getAssetType());
                    newItem.setShares(0); // 严格使用 0.0 (Double)
                    return newItem;
                });

        // 获取原有的 shares (Double) 并加上新增的 shares (Double)
        item.setShares(item.getShares() + request.getShares());
        PortfolioItem savedItem = repository.save(item);

        TransactionRecord record = new TransactionRecord();
        record.setTicker(request.getTicker());
        record.setActionType("ADD");
        record.setShares(request.getShares()); // 类型为 Double
        record.setPrice(request.getPrice());   // 类型为 Double
        record.setCurrency(request.getCurrency());
        record.setEmotion(request.getEmotion());
        record.setTimestamp(LocalDateTime.now());
        transactionRepo.save(record);

        return savedItem;
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