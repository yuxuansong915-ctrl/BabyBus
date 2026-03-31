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

    // ⚠️ 注意：这里使用的是 EODHD 的测试 Key (demo)。
    // 免费版 demo 只能查询 AAPL.US, MSFT.US, TSLA.US, VTI.US 等极少数特定代码！
    private final String API_TOKEN = "demo";
    private final String BASE_URL = "https://eodhd.com/api";

    /**
     * 核心功能 1：获取价格走势 (用于画折线图和计算现价)
     */
    @Cacheable(value = "stockPrices", key = "#ticker")
    public List<Double> getPriceHistory(String ticker) {
        List<Double> prices = new ArrayList<>();
        try {
            // EODHD 的股票代码通常需要带后缀，例如 AAPL.US
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

    /**
     * 核心功能 2：深度挖掘基本面数据 (多态解析)
     * 根据 assetType 动态将解析到的数据塞入 DTO
     */
    @Cacheable(value = "fundamentals", key = "#ticker")
    public void populateFundamentals(String ticker, String assetType, PortfolioItemDTO dto) {
        try {
            String url = BASE_URL + "/fundamentals/" + ticker.toUpperCase() + "?api_token=" + API_TOKEN + "&fmt=json";
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            // 依据资产类型进行“多态解析”
            if ("STOCK".equalsIgnoreCase(assetType)) {
                // 解析股票专属数据 (使用了 path() 防止空指针异常)
                dto.setPeRatio(root.path("Valuation").path("TrailingPE").asDouble(0.0));
                dto.setMarketCap(root.path("Highlights").path("MarketCapitalization").asLong(0L));
                dto.setDividendYield(root.path("Valuation").path("ForwardAnnualDividendYield").asDouble(0.0));
                dto.setFiftyTwoWeekHigh(root.path("Technicals").path("52WeekHigh").asDouble(0.0));
                dto.setFiftyTwoWeekLow(root.path("Technicals").path("52WeekLow").asDouble(0.0));
            }
            else if ("ETF".equalsIgnoreCase(assetType) || "FUND".equalsIgnoreCase(assetType)) {
                // 解析基金专属数据
                dto.setExpenseRatio(root.path("ETF_Data").path("NetExpenseRatio").asDouble(0.0));

                // 深度解析前十大重仓股 JSON 结构
                Map<String, Double> topHoldings = new HashMap<>();
                JsonNode holdingsNode = root.path("ETF_Data").path("Top_10_Holdings");
                if (holdingsNode.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = holdingsNode.fields();
                    int count = 0;
                    while (fields.hasNext() && count < 5) { // 为了前端排版，只取前 5 大重仓
                        Map.Entry<String, JsonNode> field = fields.next();
                        String holdingName = field.getValue().path("Name").asText("Unknown");
                        Double holdingPercent = field.getValue().path("Assets_%").asDouble(0.0);
                        topHoldings.put(holdingName, holdingPercent);
                        count++;
                    }
                }
                dto.setTopHoldings(topHoldings);
            }
            System.out.println("✅ 成功拉取并解析基本面数据: " + ticker);
        } catch (Exception e) {
            System.err.println("获取基本面数据失败，标的: " + ticker);
        }
    }

    @CacheEvict(value = {"stockPrices", "fundamentals"}, allEntries = true)
    public void flushCache() {
        System.out.println("<<< 交易触发，已清空所有价格和基本面缓存！");
    }
}