package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class FinanceDataService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper(); // Spring Boot 内置的 JSON 解析神器
    private final String AWS_API_URL = "https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData?ticker=";

    /**
     * 根据股票代码获取最新价格
     */
    public Double getLatestPrice(String ticker) {
        try {
            String url = AWS_API_URL + ticker.toUpperCase();
            String response = restTemplate.getForObject(url, String.class);

            // 1. 把长长的字符串解析成 JSON 树结构
            JsonNode rootNode = objectMapper.readTree(response);

            // 2. 顺藤摸瓜，找到 price_data 下面的 close 数组
            JsonNode closeArray = rootNode.path("price_data").path("close");

            // 3. 获取数组的最后一个元素（也就是最新收盘价）
            if (closeArray.isArray() && closeArray.size() > 0) {
                return closeArray.get(closeArray.size() - 1).asDouble();
            }
        } catch (Exception e) {
            System.err.println("获取价格失败，股票代码: " + ticker);
        }

        // 如果获取失败（比如代码输错了），默认返回 0.0，防止程序崩溃
        return 0.0;
    }
}