package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekAIService {

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.api.url}")
    private String apiUrl;

    @Value("${deepseek.api.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generatePortfolioInsights(Object portfolioData) {
        try {
            // 1. 将持仓数据转换为 JSON 字符串喂给 AI
            String dataJson = objectMapper.writeValueAsString(portfolioData);

            // 2. 核心魔法：系统提示词 (System Prompt) 设定投行级人设
            String systemPrompt = "You are a top-tier Wall Street Chief Investment Officer and Risk Analyst. " +
                    "The user will provide their real-time portfolio data (in JSON format). " +
                    "Your task is to provide a highly professional, objective, and crisp analysis in pure Markdown format. \n" +
                    "Structure your response strictly as follows:\n" +
                    "### 📊 Portfolio Overview\n(Brief summary of the current net worth and health)\n" +
                    "### ⚠️ Risk Alert\n(Highlight critical risk exposures, limit breaches, or over-concentration)\n" +
                    "### 💡 Actionable Strategies\n(Provide 2-3 strictly rational adjustments like Take Profit, Stop Loss, or Rebalance)\n" +
                    "Tone: Institutional, data-driven, mercilessly objective. Output in English.";

            // 3. 组装发给 DeepSeek 的请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", "Here is my current portfolio data:\n" + dataJson));
            requestBody.put("messages", messages);

            // 4. 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 5. 发送请求并解析回复
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");

            return (String) message.get("content");

        } catch (Exception e) {
            e.printStackTrace();
            return "❌ AI Agent failed to generate insights: " + e.getMessage();
        }
    }

    // ==========================================
    // 新增：支持多轮对话的通用聊天方法
    // ==========================================
    public String chatWithHistory(List<Map<String, String>> messages) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages); // 直接将前端传来的历史记录发给 AI

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");

            return (String) message.get("content");
        } catch (Exception e) {
            e.printStackTrace();
            return "❌ Connection lost. Please try again.";
        }
    }
}