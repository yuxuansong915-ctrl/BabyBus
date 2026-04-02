package com.finance.portfoliobackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticker;      // 资产代码 (如 AAPL, SPY)

    // 资产类型标识 (例如: "STOCK" 代表股票, "ETF" 代表基金, "CRYPTO" 代表加密货币)
    private String assetType;

    private Double shares;     // 持有数量

    // === 行情缓存字段（API 调用成功后自动更新，用户无感知）===
    private Double cachedPrice;        // 缓存的当前价格
    private Double cachedPe;           // 缓存的 P/E 市盈率
    private Double cachedMarketCap;    // 缓存的市值
    private LocalDateTime cachedUpdated; // 缓存更新时间
}