package com.finance.portfoliobackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class YahooFinanceClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

    // ========== 核心：伪装请求头以避免 429/403 错误 ==========
    private String fetchFromYahoo(String url) {
        HttpHeaders headers = new HttpHeaders();
        // 伪装成 Chrome 浏览器
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        headers.set("Accept", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("⚠️ Yahoo 请求失败: " + e.getMessage());
            return null;
        }
    }

    /**
     * 获取历史日K线（收盘价）- 默认30天
     */
    public List<Double> getDailyPrices(String symbol) {
        return getDailyPrices(symbol, 30);
    }

    /**
     * 获取历史日K线（收盘价）- 自定义天数
     */
    public List<Double> getDailyPrices(String symbol, int days) {
        List<Double> prices = new ArrayList<>();
        try {
            String sym = normalizeSymbol(symbol);
            String url = BASE_URL + sym + "?interval=1d&range=" + days + "d";
            String response = fetchFromYahoo(url);
            if (response == null) return prices;

            JsonNode root = objectMapper.readTree(response);
            JsonNode resultNode = root.path("chart").path("result").get(0);
            if (resultNode != null) {
                JsonNode closeNode = resultNode.path("indicators").path("quote").get(0).path("close");
                if (closeNode.isArray()) {
                    for (JsonNode priceNode : closeNode) {
                        if (!priceNode.isNull()) prices.add(priceNode.asDouble());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Yahoo K线获取失败: " + symbol + "，原因: " + e.getMessage());
        }
        return prices;
    }

    /**
     * 获取单个资产实时报价（兜底用）
     */
    public AssetQuote getQuote(String symbol) {
        try {
            String sym = normalizeSymbol(symbol);
            String url = BASE_URL + sym + "?interval=1d&range=1d";
            String response = fetchFromYahoo(url);

            if (response == null) return null;

            JsonNode root = objectMapper.readTree(response);
            JsonNode resultNode = root.path("chart").path("result").get(0);
            if (resultNode != null) {
                JsonNode metaNode = resultNode.path("meta");
                AssetQuote quote = new AssetQuote();
                quote.setRegularMarketPrice(metaNode.path("regularMarketPrice").asDouble(0.0));
                // 确保这里读取并设置了昨收价
                quote.setPreviousClose(metaNode.path("chartPreviousClose").asDouble(0.0));
                return quote;
            }
        } catch (Exception e) {
            System.err.println("⚠️ Yahoo Quote获取失败: " + symbol + "，原因: " + e.getMessage());
        }
        return null;
    }

    /**
     * 获取带有时间戳的历史 K 线数据 (用于 Market 页面大图表)
     */
    public List<double[]> getMarketKlineData(String symbol, int days) {
        List<double[]> klineData = new ArrayList<>();
        try {
            String sym = normalizeSymbol(symbol);
            String url = BASE_URL + sym + "?interval=1d&range=" + days + "d";
            String response = fetchFromYahoo(url);
            if (response == null) return klineData;

            JsonNode root = objectMapper.readTree(response);
            JsonNode resultNode = root.path("chart").path("result").get(0);
            if (resultNode != null) {
                JsonNode timestampNode = resultNode.path("timestamp");
                JsonNode closeNode = resultNode.path("indicators").path("quote").get(0).path("close");
                if (timestampNode != null && timestampNode.isArray() && closeNode != null && closeNode.isArray()) {
                    int len = Math.min(timestampNode.size(), closeNode.size());
                    for (int i = 0; i < len; i++) {
                        if (!closeNode.get(i).isNull()) {
                            klineData.add(new double[]{closeNode.get(i).asDouble(), timestampNode.get(i).asLong()});
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Yahoo 完整K线获取失败: " + symbol + "，原因: " + e.getMessage());
        }
        return klineData;
    }

    /**
     * 批量获取实时行情 (Market 列表展示使用，极大提高效率并避开限流)
     */
// ==========================================
    // 终极替换：基于 v8/chart 接口的并发批量查询
    // (完全避开 v7 接口的 Crumb 验证机制)
    // ==========================================
    public List<AssetQuote> getBulkQuotes(List<String> symbols) {
        List<AssetQuote> results = new ArrayList<>();
        if (symbols == null || symbols.isEmpty()) return results;

        // 使用 Java 8 并发流，瞬间并行发出几十个请求，速度极快且不触发 v7 的封锁
        symbols.parallelStream().forEach(originalSymbol -> {
            try {
                String sym = normalizeSymbol(originalSymbol);
                // 使用我们确信能通的 v8/chart 接口，只查 1 天的数据来提取现价
                String url = BASE_URL + sym + "?interval=1d&range=1d";
                String response = fetchFromYahoo(url);

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode resultNode = root.path("chart").path("result").get(0);

                    if (resultNode != null) {
                        JsonNode metaNode = resultNode.path("meta");
                        AssetQuote quote = new AssetQuote();

                        // 关键：必须把前端传来的原始 Symbol 塞回去，确保前端能匹配上
                        quote.setSymbol(originalSymbol);
                        quote.setName(metaNode.path("symbol").asText(originalSymbol));

                        double price = metaNode.path("regularMarketPrice").asDouble(0.0);
                        double prevClose = metaNode.path("chartPreviousClose").asDouble(0.0);

                        quote.setRegularMarketPrice(price);
                        quote.setPreviousClose(prevClose);

                        // 手动计算涨跌额和涨跌幅
                        if (prevClose > 0) {
                            quote.setRegularMarketChange(price - prevClose);
                            quote.setRegularMarketChangePercent(((price - prevClose) / prevClose) * 100);
                        }

                        quote.setRegularMarketVolume(metaNode.path("regularMarketVolume").asLong(0));

                        // v8/meta 通常不带当日高低，这里使用现价兜底，保证数据结构完整
                        quote.setRegularMarketDayHigh(metaNode.path("regularMarketDayHigh").asDouble(price));
                        quote.setRegularMarketDayLow(metaNode.path("regularMarketDayLow").asDouble(price));

                        // 线程安全的写入
                        synchronized (results) {
                            results.add(quote);
                        }
                    }
                }
            } catch (Exception e) {
                // 如果个别资产（比如特殊的加密货币对）查询失败，仅打印日志，不影响大局
                System.err.println("⚠️ Yahoo 并发单点获取失败: " + originalSymbol + "，原因: " + e.getMessage());
            }
        });

        return results;
    }

    public static class AssetQuote {
        private String symbol;
        private String name;
        private double regularMarketPrice;
        private double previousClose; // <--- 补上缺失的昨收价字段
        private double regularMarketChange;
        private double regularMarketChangePercent;
        private long regularMarketVolume;
        private double regularMarketDayHigh;
        private double regularMarketDayLow;

        // Getters and Setters
        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public double getRegularMarketPrice() { return regularMarketPrice; }
        public void setRegularMarketPrice(double regularMarketPrice) { this.regularMarketPrice = regularMarketPrice; }
        public double getPreviousClose() { return previousClose; } // <--- 补上 Getter
        public void setPreviousClose(double previousClose) { this.previousClose = previousClose; } // <--- 补上 Setter
        public double getRegularMarketChange() { return regularMarketChange; }
        public void setRegularMarketChange(double regularMarketChange) { this.regularMarketChange = regularMarketChange; }
        public double getRegularMarketChangePercent() { return regularMarketChangePercent; }
        public void setRegularMarketChangePercent(double regularMarketChangePercent) { this.regularMarketChangePercent = regularMarketChangePercent; }
        public long getRegularMarketVolume() { return regularMarketVolume; }
        public void setRegularMarketVolume(long regularMarketVolume) { this.regularMarketVolume = regularMarketVolume; }
        public double getRegularMarketDayHigh() { return regularMarketDayHigh; }
        public void setRegularMarketDayHigh(double regularMarketDayHigh) { this.regularMarketDayHigh = regularMarketDayHigh; }
        public double getRegularMarketDayLow() { return regularMarketDayLow; }
        public void setRegularMarketDayLow(double regularMarketDayLow) { this.regularMarketDayLow = regularMarketDayLow; }
    }

    private String normalizeSymbol(String code) {
        if (code == null) return "";
        code = code.trim().toUpperCase();

        // 1. 处理美股 (.US -> 去掉后缀)
        if (code.endsWith(".US")) return code.substring(0, code.length() - 3);

        // 2. 处理大宗商品
        if (code.equals("GOLD")) return "GC=F";
        if (code.equals("SILVER")) return "SI=F";

        // 3. 处理加密货币 (BTCUSDT -> BTC-USD)
        if (code.endsWith("USDT")) return code.replace("USDT", "-USD");

        // 4. 【核心修复】：处理外汇 (如 EURUSD -> EURUSD=X)
        // 逻辑：如果是6位纯字母（标准的货币对格式），补上 =X
        if (code.matches("^[A-Z]{6}$")) {
            return code + "=X";
        }

        return code;
    }

    // ==========================================
    // 新增：专门用于前端绘制专业 K线/蜡烛图的 OHLC 数据接口
    // 返回格式: [时间戳, 开盘价, 最高价, 最低价, 收盘价, 成交量]
    // ==========================================
    public List<double[]> getCandlestickData(String symbol, int days) {
        List<double[]> klineData = new ArrayList<>();
        try {
            String sym = normalizeSymbol(symbol);
            String url = BASE_URL + sym + "?interval=1d&range=" + days + "d";
            String response = fetchFromYahoo(url);
            if (response == null) return klineData;

            JsonNode root = objectMapper.readTree(response);
            JsonNode resultNode = root.path("chart").path("result").get(0);

            if (resultNode != null) {
                JsonNode timestampNode = resultNode.path("timestamp");
                JsonNode quoteNode = resultNode.path("indicators").path("quote").get(0);

                if (timestampNode != null && timestampNode.isArray() && quoteNode != null) {
                    JsonNode openNode = quoteNode.path("open");
                    JsonNode highNode = quoteNode.path("high");
                    JsonNode lowNode = quoteNode.path("low");
                    JsonNode closeNode = quoteNode.path("close");
                    JsonNode volumeNode = quoteNode.path("volume");

                    int len = timestampNode.size();
                    for (int i = 0; i < len; i++) {
                        // 过滤掉因为休市等原因产生的 null 节点
                        if (!closeNode.get(i).isNull() && !openNode.get(i).isNull()) {
                            // 统一转为 double，格式：[timestamp, open, high, low, close, volume]
                            double t = timestampNode.get(i).asDouble();
                            double o = openNode.get(i).asDouble();
                            double h = highNode.get(i).asDouble();
                            double l = lowNode.get(i).asDouble();
                            double c = closeNode.get(i).asDouble();
                            double v = volumeNode.get(i).asDouble();

                            klineData.add(new double[]{t, o, h, l, c, v});
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Yahoo 蜡烛图 OHLC 数据获取失败: " + symbol + "，原因: " + e.getMessage());
        }
        return klineData;
    }
}