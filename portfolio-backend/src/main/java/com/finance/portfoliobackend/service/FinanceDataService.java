package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.portfoliobackend.controller.PortfolioController;
import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class FinanceDataService {

    @Autowired private YahooFinanceClient yahooClient;
    @Autowired private PortfolioItemRepository portfolioRepo;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String FINNHUB_API_KEY = "d76c1a9r01qm4b7tngr0d76c1a9r01qm4b7tngrg";
    private static final String FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

    // 你的 EODHD API Key
    private final String EODHD_API_KEY = "69cb69e8dcaac5.42407064";

    // ==========================================
    // 1. 价格走势 — Yahoo Finance (用于 Holdings 迷你图)
    // ==========================================
    public List<Double> getPriceHistory(String ticker) {
        List<Double> prices = new ArrayList<>();
        try {
            List<double[]> candles = yahooClient.getMarketKlineData(ticker, 35);
            if (candles == null || candles.isEmpty()) return prices;
            int start = Math.max(0, candles.size() - 30);
            for (int i = start; i < candles.size(); i++) {
                prices.add(candles.get(i)[0]);
            }
        } catch (Exception e) {
            System.err.println("❌ Yahoo Finance 走势失败: " + e.getMessage());
        }
        return prices;
    }

    // ==========================================
    // 2. 填充基本面数据 (Holdings 页面使用)
    // ==========================================
    public void populateFundamentals(PortfolioItem item, PortfolioItemDTO dto) {
        String ticker = item.getTicker();

        // 1. 实时价格：优先使用 Alpha Vantage (如果没有，使用之前教你的 getAlphaVantageQuote，这里为你简化兜底用 Yahoo)
        try {
            YahooFinanceClient.AssetQuote yq = yahooClient.getQuote(ticker);
            if (yq != null && yq.getRegularMarketPrice() > 0) {
                dto.setCurrentPrice(yq.getRegularMarketPrice());
                if (yq.getPreviousClose() > 0) {
                    double chg = yq.getRegularMarketPrice() - yq.getPreviousClose();
                    dto.setChange(chg);
                    dto.setChangePercent((chg / yq.getPreviousClose()) * 100);
                }
            } else {
                dto.setCurrentPrice(item.getCachedPrice() != null ? item.getCachedPrice() : 0.0);
            }
        } catch (Exception e) {
            dto.setCurrentPrice(item.getCachedPrice() != null ? item.getCachedPrice() : 0.0);
        }

        // 2. 核心修复：直接实时获取 Finnhub 基本面数据，不依赖数据库字段，解决全部横线问题！
        Map<String, Double> metrics = fetchFinnhubMetrics(ticker);
        if (metrics != null) {
            dto.setPeRatio(metrics.getOrDefault("peRatio", 0.0));
            dto.setMarketCap(metrics.getOrDefault("marketCap", 0.0).longValue());
            dto.setFiftyTwoWeekHigh(metrics.getOrDefault("fiftyTwoWeekHigh", 0.0));
            dto.setFiftyTwoWeekLow(metrics.getOrDefault("fiftyTwoWeekLow", 0.0));
            dto.setDividendYield(metrics.getOrDefault("dividendYield", 0.0));
        } else {
            // Finnhub 万一限流，降级使用数据库里仅有的 P/E 和 市值
            if (item.getCachedPe() != null) dto.setPeRatio(item.getCachedPe());
            if (item.getCachedMarketCap() != null) dto.setMarketCap(item.getCachedMarketCap().longValue());
        }

        // 3. 30 日走势
        List<Double> trend = getPriceHistory(ticker);
        dto.setPriceTrend(trend != null ? trend : new ArrayList<>());
    }

    @Async
    public void refreshAndCachePortfolioItem(PortfolioItem item) {
        // 简化异步刷新：只存价格，基本面在展示时实时查，减轻数据库压力
        try {
            YahooFinanceClient.AssetQuote yq = yahooClient.getQuote(item.getTicker());
            if (yq != null && yq.getRegularMarketPrice() > 0) {
                item.setCachedPrice(yq.getRegularMarketPrice());
                item.setCachedUpdated(LocalDateTime.now());
                portfolioRepo.save(item);
            }
        } catch (Exception ignored) {}
    }

    private Map<String, Double> fetchFinnhubMetrics(String ticker) {
        Map<String, Double> result = new HashMap<>();
        try {
            String sym = normalizeFinnhubSymbol(ticker);
            String url = FINNHUB_BASE_URL + "/stock/metric?symbol=" + sym + "&metric=all&token=" + FINNHUB_API_KEY;
            String response = restTemplate.getForObject(url, String.class);
            if(response == null) return result;

            JsonNode metrics = objectMapper.readTree(response).path("metric");

            if (metrics.path("peTTM").asDouble(0) > 0) result.put("peRatio", metrics.path("peTTM").asDouble());
            if (metrics.path("marketCapitalization").asDouble(0) > 0) result.put("marketCap", metrics.path("marketCapitalization").asDouble());
            if (metrics.path("52WeekHigh").asDouble(0) > 0) result.put("fiftyTwoWeekHigh", metrics.path("52WeekHigh").asDouble());
            if (metrics.path("52WeekLow").asDouble(0) > 0) result.put("fiftyTwoWeekLow", metrics.path("52WeekLow").asDouble());
            if (metrics.path("dividendYieldIndicatedAnnual").asDouble(0) > 0) result.put("dividendYield", metrics.path("dividendYieldIndicatedAnnual").asDouble());

        } catch (Exception ignored) {}
        return result;
    }

    private String normalizeFinnhubSymbol(String ticker) {
        if (ticker == null) return "";
        ticker = ticker.trim().toUpperCase();
        if (ticker.endsWith(".US")) return ticker.substring(0, ticker.length() - 3);
        if (ticker.endsWith("USDT")) return "BINANCE:" + ticker;
        return ticker;
    }

    public List<double[]> getMarketKline(String symbol, int days) {
        return yahooClient.getMarketKlineData(symbol, days);
    }

    // ==========================================
    // 3. 核心大招：接入 EODHD 并发获取 75 只股票数据！
    // ==========================================
    public List<PortfolioController.AssetSearchResult> getEodhdBulkQuotes(List<String> tickers) {
        List<PortfolioController.AssetSearchResult> results = Collections.synchronizedList(new ArrayList<>());

        tickers.parallelStream().forEach(originalTicker -> {
            try {
                // 转换成 EODHD 认识的后缀，例如 AAPL -> AAPL.US, EURUSD -> EURUSD.FOREX
                String eodhdSymbol = normalizeForEodhd(originalTicker);
                String url = "https://eodhd.com/api/real-time/" + eodhdSymbol + "?api_token=" + EODHD_API_KEY + "&fmt=json";

                String response = restTemplate.getForObject(url, String.class);

                if (response != null && !response.contains("NA") && !response.contains("Error")) {
                    JsonNode root = objectMapper.readTree(response);

                    if (root.has("close") && !root.path("close").asText().equals("NA")) {
                        PortfolioController.AssetSearchResult r = new PortfolioController.AssetSearchResult();
                        r.setTicker(originalTicker); // 关键：必须塞回前端传来的原始 Ticker，否则前端匹配不上！
                        r.setName(originalTicker);   // EODHD 实时接口不带名字，用 ticker 兜底，前端有写死的名字字典
                        r.setPrice(root.path("close").asDouble(0.0));
                        r.setChange(root.path("change").asDouble(0.0));
                        r.setChangePercent(root.path("change_p").asDouble(0.0));
                        r.setVolume(root.path("volume").asLong(0));
                        r.setDayHigh(root.path("high").asDouble(0.0));
                        r.setDayLow(root.path("low").asDouble(0.0));

                        results.add(r);
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ EODHD 获取失败: " + originalTicker + ", " + e.getMessage());
            }
        });

        return results;
    }

    private String normalizeForEodhd(String ticker) {
        if (ticker == null) return "";
        ticker = ticker.toUpperCase();
        if (ticker.endsWith("USDT")) return ticker.replace("USDT", "-USD.CC");
        if (ticker.length() == 6 && (ticker.endsWith("USD") || ticker.startsWith("EUR") || ticker.startsWith("GBP") || ticker.startsWith("AUD"))) {
            return ticker + ".FOREX";
        }
        if (ticker.equals("XAUUSD") || ticker.equals("XAGUSD") || ticker.equals("XPTUSD") || ticker.equals("XPDUSD")) {
            return ticker + ".FOREX";
        }
        if (!ticker.contains(".")) return ticker + ".US";
        return ticker;
    }
}