package com.finance.portfoliobackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "market_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarketCache {

    @Id
    private String ticker;  // 资产代码作为主键

    private String name;              // 资产名称

    private Double price;             // 最新价格

    // ==========================================
    // 核心修复：避开 MySQL 的 'change' 关键字
    // ==========================================
    @Column(name = "change_val")
    private Double change;             // 涨跌额

    private Double changePercent;      // 涨跌幅 %
    private Long volume;              // 成交量

    private Double dayHigh;            // 日高
    private Double dayLow;             // 日低
    private Double yearHigh;           // 52周高
    private Double yearLow;           // 52周低

    private LocalDateTime lastUpdated; // 最后更新时间

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.lastUpdated = LocalDateTime.now();
    }
}