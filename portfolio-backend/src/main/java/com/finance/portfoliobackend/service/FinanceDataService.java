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
    private final String API_TOKEN = "demo";
    private final String BASE_URL = "https://eodhd.com/api";

    @Cacheable(value = "stockPrices", key = "#ticker")
    public List<Double> getPriceHistory(String ticker) {
        List<Double> prices = new ArrayList<>();
        try {
            String url = BASE_URL + "/eod/" + ticker.toUpperCase() + "?api_token=" + API_TOKEN + "&fmt=json&period=d&limit=30";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode rootArray = objectMapper.readTree(response);
            if (rootArray.isArray()) {
                for (JsonNode node : rootArray) {
                    prices.add(node.path("adjusted_close").asDouble());
                }
            }
            return prices;
        } catch (Exception e) {
            System.err.println("获取价格走势失败，标的: " + ticker);
            return null;
        }
    }

    // 🌟 完美修复：直接缓存 EODHD 返回的原始 JSON 字符串，既不会出现 N/A，又极其快速！
    @Cacheable(value = "rawFundamentals", key = "#ticker")
    public String fetchRawFundamentals(String ticker) {
        String url = BASE_URL + "/fundamentals/" + ticker.toUpperCase() + "?api_token=" + API_TOKEN + "&fmt=json";
        return restTemplate.getForObject(url, String.class);
    }

    public void populateFundamentals(String ticker, String assetType, PortfolioItemDTO dto) {
        try {
            // 每次从缓存或网络读取 JSON 字符串，然后实时解析塞入 DTO
            String response = fetchRawFundamentals(ticker);
            JsonNode root = objectMapper.readTree(response);

            if ("STOCK".equalsIgnoreCase(assetType)) {
                dto.setPeRatio(root.path("Valuation").path("TrailingPE").asDouble(0.0));
                dto.setMarketCap(root.path("Highlights").path("MarketCapitalization").asLong(0L));
                dto.setDividendYield(root.path("Valuation").path("ForwardAnnualDividendYield").asDouble(0.0));
                dto.setFiftyTwoWeekHigh(root.path("Technicals").path("52WeekHigh").asDouble(0.0));
                dto.setFiftyTwoWeekLow(root.path("Technicals").path("52WeekLow").asDouble(0.0));
            } else if ("ETF".equalsIgnoreCase(assetType) || "FUND".equalsIgnoreCase(assetType)) {
                dto.setExpenseRatio(root.path("ETF_Data").path("NetExpenseRatio").asDouble(0.0));
                Map<String, Double> topHoldings = new HashMap<>();
                JsonNode holdingsNode = root.path("ETF_Data").path("Top_10_Holdings");
                if (holdingsNode.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = holdingsNode.fields();
                    int count = 0;
                    while (fields.hasNext() && count < 5) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        topHoldings.put(field.getValue().path("Name").asText("Unknown"), field.getValue().path("Assets_%").asDouble(0.0));
                        count++;
                    }
                }
                dto.setTopHoldings(topHoldings);
            }
        } catch (Exception e) {
            System.err.println("解析基本面数据失败，标的: " + ticker);
        }
    }

    @CacheEvict(value = {"stockPrices", "rawFundamentals"}, allEntries = true)
    public void flushCache() {
        System.out.println("<<< 交易触发，已清空所有价格和基本面缓存！");
    }
}