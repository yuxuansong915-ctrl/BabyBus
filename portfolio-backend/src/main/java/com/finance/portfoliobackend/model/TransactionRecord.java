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
public class TransactionRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticker;      // 资产代码
    private String actionType;  // 动作: "ADD" (加仓) 或 "SELL" (减仓)
    private Double shares;     // 交易数量
    private Double price;       // 交易单价

    // 👇 核心修复：增加总金额字段，解决 N/A 问题
    private Double totalCost;

    private String currency;    // 结算货币 (如 "USD", "CNY")
    private String emotion;     // 交易情绪/行为标签
    private LocalDateTime timestamp; // 交易时间
}