package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class FinanceDataService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 你的真实 API Key
    private final String FMP_API_KEY = "r13kuhwxQSgxImZvW1YhDmbvuPihqeU9";
    // 👇 核心修复：全面切换到官方文档最新的 stable 基地址
    private final String BASE_URL = "https://financialmodelingprep.com/stable";

    @Cacheable(value = "stockPrices", key = "#ticker")
    public List<Double> getPriceHistory(String ticker) {
        List<Double> prices = new ArrayList<>();
        try {
            String cleanTicker = ticker.toUpperCase().replace(".US", "");
            // 👇 核心修复：使用最新的 historical-price-eod/full 接口格式
            String url = BASE_URL + "/historical-price-eod/full?symbol=" + cleanTicker + "&apikey=" + FMP_API_KEY;

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            // 兼容最新版 API 的数组结构
            JsonNode historical = root.has("historical") ? root.path("historical") : root;

            if (historical.isArray()) {
                int count = 0;
                for (JsonNode node : historical) {
                    if (count >= 30) break; // 只取最近 30 个交易日
                    // 倒序插入，确保图表从左到右是时间正序
                    prices.add(0, node.path("adjClose").asDouble(node.path("close").asDouble()));
                    count++;
                }
            }
            return prices;
        } catch (Exception e) {
            System.err.println("❌ 获取价格走势失败: " + ticker + "，原因: " + e.getMessage());
            return prices;
        }
    }

    @Cacheable(value = "rawQuote", key = "#ticker")
    public String fetchQuote(String ticker) {
        String cleanTicker = ticker.toUpperCase().replace(".US", "");
        // 👇 核心修复：使用最新的 quote?symbol= 接口格式
        String url = BASE_URL + "/quote?symbol=" + cleanTicker + "&apikey=" + FMP_API_KEY;
        return restTemplate.getForObject(url, String.class);
    }

    public void populateFundamentals(String ticker, String assetType, PortfolioItemDTO dto) {
        try {
            String quoteResponse = fetchQuote(ticker);
            JsonNode quoteArray = objectMapper.readTree(quoteResponse);

            // 新版 API 如果查不到，通常返回空数组 []
            if (quoteArray.isArray() && quoteArray.size() > 0) {
                JsonNode quote = quoteArray.get(0);

                // 绑定真实价格！
                dto.setCurrentPrice(quote.path("price").asDouble(0.0));

                if ("STOCK".equalsIgnoreCase(assetType)) {
                    dto.setPeRatio(quote.path("pe").asDouble(0.0));
                    dto.setMarketCap(quote.path("marketCap").asLong(0L));
                    dto.setFiftyTwoWeekHigh(quote.path("yearHigh").asDouble(0.0));
                    dto.setFiftyTwoWeekLow(quote.path("yearLow").asDouble(0.0));
                    dto.setDividendYield(null);
                } else if ("ETF".equalsIgnoreCase(assetType)) {
                    dto.setMarketCap(quote.path("marketCap").asLong(0L));
                    dto.setFiftyTwoWeekHigh(quote.path("yearHigh").asDouble(0.0));
                }
            } else {
                System.err.println("⚠️ 接口返回为空，未找到资产: " + ticker);
            }
        } catch (Exception e) {
            System.err.println("❌ 解析基本面失败: " + ticker + "，原因: " + e.getMessage());
        }
    }

    @CacheEvict(value = {"stockPrices", "rawQuote"}, allEntries = true)
    public void flushCache() {
        System.out.println("<<< 交易发生，已清空数据缓存！");
    }
}