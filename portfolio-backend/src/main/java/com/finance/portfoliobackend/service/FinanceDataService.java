package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceDataService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String AWS_API_URL = "https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData?ticker=";

    /**
     * 获取完整价格历史 (对应优化 5: Sparkline 折线图)
     * 加入缓存 (对应优化 6): 相同代码在5分钟内不再重复请求外部 API
     */
    @Cacheable(value = "stockPrices", key = "#ticker")
    public List<Double> getPriceHistory(String ticker) {
        List<Double> prices = new ArrayList<>();
        try {
            String url = AWS_API_URL + ticker.toUpperCase();
            String response = restTemplate.getForObject(url, String.class);
            JsonNode rootNode = objectMapper.readTree(response);

            // 容错处理 (对应优化 1): 如果找不到 price_data，说明代码不存在
            if (rootNode.has("error") || !rootNode.has("price_data")) {
                return null; // 返回 null 代表股票代码无效
            }

            JsonNode closeArray = rootNode.path("price_data").path("close");
            if (closeArray.isArray()) {
                for (JsonNode node : closeArray) {
                    prices.add(node.asDouble());
                }
            }
            System.out.println(">>> 真正从 AWS 拉取了数据: " + ticker);
            return prices;
        } catch (Exception e) {
            System.err.println("获取价格失败，股票代码: " + ticker);
            return null; // 网络或代码错误，返回 null
        }
    }

    /**
     * 手动操作时，强制清空缓存 (对应优化 6)
     */
    @CacheEvict(value = "stockPrices", allEntries = true)
    public void flushCache() {
        System.out.println("<<< 手动交易触发，已清空所有价格缓存！");
    }
}