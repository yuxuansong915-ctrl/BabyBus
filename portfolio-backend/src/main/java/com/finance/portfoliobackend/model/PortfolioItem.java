package com.finance.portfoliobackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticker;      // 资产代码 (如 AAPL, SPY)

    // 👇 新增：资产类型标识 (例如: "STOCK" 代表股票, "ETF" 代表基金, "CRYPTO" 代表加密货币)
    private String assetType;

    private Integer shares;     // 持有数量
}