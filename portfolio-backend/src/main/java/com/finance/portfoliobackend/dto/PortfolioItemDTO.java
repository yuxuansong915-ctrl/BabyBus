package com.finance.portfoliobackend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class PortfolioItemDTO {
    private Long id;
    private String ticker;
    private String assetType;    // 新增：资产类型 (STOCK, ETF等)
    private Integer shares;
    private Double currentPrice;
    private Double totalValue;
    private List<Double> priceTrend;

    // --- 📈 股票专属基本面数据 ---
    private Double peRatio;           // 市盈率
    private Long marketCap;           // 市值
    private Double dividendYield;     // 股息率
    private Double fiftyTwoWeekHigh;  // 52周最高价
    private Double fiftyTwoWeekLow;   // 52周最低价

    // --- 🧺 基金 (ETF) 专属基本面数据 ---
    private Double expenseRatio;      // 管理费率
    private Map<String, Double> topHoldings; // 前十大重仓股及其占比 (例如: {"AAPL": 5.2, "MSFT": 4.8})
}