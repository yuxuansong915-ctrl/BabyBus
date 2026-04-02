package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class FinnhubClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // TODO: 请在此处填入你的 Finnhub API Key
    private final String FINNHUB_API_KEY = "d76c1a9r01qm4b7tngr0d76c1a9r01qm4b7tngrg";

    private static final String BASE_URL = "https://finnhub.io/api/v1";

    // ========== 内部类：行情数据 ==========
    public static class AssetQuote {
        private String code;
        private double price;
        private double change;
        private double changePercent;
        private double high;
        private double low;
        private double open;
        private double prevClose;
        private long volume;
        private String name;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        public double getChange() { return change; }
        public void setChange(double change) { this.change = change; }
        public double getChangePercent() { return changePercent; }
        public void setChangePercent(double changePercent) { this.changePercent = changePercent; }
        public double getHigh() { return high; }
        public void setHigh(double high) { this.high = high; }
        public double getLow() { return low; }
        public void setLow(double low) { this.low = low; }
        public double getOpen() { return open; }
        public void setOpen(double open) { this.open = open; }
        public double getPrevClose() { return prevClose; }
        public void setPrevClose(double prevClose) { this.prevClose = prevClose; }
        public long getVolume() { return volume; }
        public void setVolume(long volume) { this.volume = volume; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    // ========== 批量获取实时行情 (quote) ==========
    /**
     * 批量获取实时报价
     * @param codes 资产代码数组，如 ["AAPL", "MSFT"]（不带 .US 后缀，Finnhub 自动识别美股）
     * @return List<AssetQuote> 实时行情列表
     */
    public List<AssetQuote> getQuote(String[] codes) {
        List<AssetQuote> results = new ArrayList<>();
        if (codes == null || codes.length == 0) return results;

        for (String code : codes) {
            AssetQuote quote = new AssetQuote();
            quote.setCode(normalizeSymbol(code));
            try {
                String symbol = normalizeSymbol(code);
                String url = BASE_URL + "/quote?symbol=" + symbol + "&token=" + FINNHUB_API_KEY;
                String response = restTemplate.getForObject(url, String.class);
                parseQuoteResponse(response, quote);
            } catch (Exception e) {
                System.err.println("⚠️ Finnhub quote 获取失败: " + code + "，原因: " + e.getMessage());
            }
            results.add(quote);
        }
        return results;
    }

    private void parseQuoteResponse(String response, AssetQuote quote) {
        try {
            JsonNode root = objectMapper.readTree(response);
            // s="no_data" 表示当日无交易（如美股节假日）
            if (root.path("c").isNull() || root.path("c").asDouble(0.0) == 0.0) {
                return;
            }
            double c = root.path("c").asDouble(0.0);   // current
            double pc = root.path("pc").asDouble(0.0); // previous close
            double h = root.path("h").asDouble(0.0);   // high
            double l = root.path("l").asDouble(0.0);   // low
            double o = root.path("o").asDouble(0.0);  // open

            quote.setPrice(c);
            quote.setPrevClose(pc);
            quote.setHigh(h);
            quote.setLow(l);
            quote.setOpen(o);
            quote.setChange(c - pc);
            quote.setChangePercent(pc > 0 ? ((c - pc) / pc) * 100 : 0.0);
        } catch (Exception e) {
            System.err.println("⚠️ 解析 Finnhub quote 响应失败: " + e.getMessage());
        }
    }

    // ========== 获取 K 线 / 历史价格 ==========
    /**
     * 获取历史 K 线数据
     * @param symbol 资产代码，如 "AAPL"
     * @param resolution K 线分辨率: 1, 5, 15, 30, 60, D, W, M
     * @param num 查询数量（默认返回最近 num 根 K 线）
     * @return List<double[]> 每根 K 线的 [收盘价, 时间戳(秒)]
     */
    public List<double[]> getCandles(String symbol, String resolution, int num) {
        List<double[]> result = new ArrayList<>();
        try {
            // Finnhub 不支持直接用数量查询，需要用 to/from 时间戳
            // to = 当前时间，from = 几个月前（根据 resolution 估算）
            long now = Instant.now().getEpochSecond();
            long from;
            switch (resolution) {
                case "D":
                    from = now - (long) num * 86400L * 2; // 粗估，每天最多一根
                    break;
                case "W":
                    from = now - (long) num * 86400L * 10;
                    break;
                case "M":
                    from = now - (long) num * 86400L * 35;
                    break;
                default: // 1, 5, 15, 30, 60 分钟
                    from = now - (long) num * 3600L;
                    break;
            }

            String sym = normalizeSymbol(symbol);
            String url = BASE_URL + "/stock/candle?symbol=" + sym
                    + "&resolution=" + resolution
                    + "&from=" + from
                    + "&to=" + now
                    + "&token=" + FINNHUB_API_KEY;

            String response = restTemplate.getForObject(url, String.class);
            result = parseCandleResponse(response);
        } catch (Exception e) {
            System.err.println("⚠️ Finnhub getCandles 失败: " + symbol + "，原因: " + e.getMessage());
        }
        return result;
    }

    private List<double[]> parseCandleResponse(String response) {
        List<double[]> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response);
            if (!"ok".equals(root.path("s").asText())) {
                return result;
            }
            JsonNode closeArr = root.path("c");  // close prices
            JsonNode tArr = root.path("t");        // timestamps
            JsonNode vArr = root.path("v");        // volumes (optional)

            if (closeArr.isArray() && tArr.isArray()) {
                int len = closeArr.size();
                for (int i = 0; i < len; i++) {
                    double closePrice = closeArr.get(i).asDouble();
                    long timestamp = tArr.get(i).asLong();
                    result.add(new double[]{closePrice, timestamp});
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ 解析 Finnhub candles 失败: " + e.getMessage());
        }
        return result;
    }

    // ========== 获取股票基础信息 (company profile) ==========
    /**
     * 批量获取股票基础信息（公司名称等）
     * @param codes 股票代码数组，如 ["AAPL", "MSFT"]
     * @return Map<code, name>
     */
    public Map<String, String> getCompanyProfile(String[] codes) {
        Map<String, String> result = new HashMap<>();
        if (codes == null || codes.length == 0) return result;

        for (String code : codes) {
            try {
                String sym = normalizeSymbol(code);
                String url = BASE_URL + "/stock/profile2?symbol=" + sym + "&token=" + FINNHUB_API_KEY;
                String response = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(response);
                String name = root.path("name").asText(code);
                result.put(sym, name);
            } catch (Exception e) {
                System.err.println("⚠️ Finnhub company profile 获取失败: " + code + "，原因: " + e.getMessage());
                result.put(normalizeSymbol(code), code);
            }
        }
        return result;
    }

    // ========== 符号规范化 ==========
    /**
     * Finnhub 美股使用无后缀符号（如 "AAPL" 而非 "AAPL.US"）
     * 加密货币使用 "BINANCE:BTCUSDT" 格式
     * 外汇/贵金属 Finnhub 不支持，返回原始代码
     */
    private String normalizeSymbol(String code) {
        if (code == null) return "";
        code = code.trim();
        // 移除 .US 后缀（Finnhub 默认就是美股）
        if (code.endsWith(".US")) {
            return code.substring(0, code.length() - 3);
        }
        // 加密货币转 Finnhub 格式: BTCUSDT -> BINANCE:BTCUSDT
        if (code.endsWith("USDT")) {
            return "BINANCE:" + code;
        }
        return code;
    }

    /**
     * 检查 Finnhub API Key 是否已配置（防止全零占位符）
     */
    public boolean isConfigured() {
        return FINNHUB_API_KEY != null
                && !FINNHUB_API_KEY.isEmpty()
                && !FINNHUB_API_KEY.equals("YOUR_FINNHUB_API_KEY")
                && !FINNHUB_API_KEY.equals("d76c1a9r01qm4b7tngr0d76c1a9r01qm4b7tngrg"); // 防止用户填错
    }
}
