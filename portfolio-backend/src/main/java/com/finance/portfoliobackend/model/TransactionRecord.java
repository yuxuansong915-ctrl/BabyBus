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
    private String actionType;  // 动作: "ADD" (加仓) 或 "REMOVE" (减仓)
    private Integer shares;     // 交易数量
    private Double price;       // 交易单价

    // 👇 新增：结算货币 (如 "USD", "CNY")
    private String currency;

    // 👇 新增：核心亮点！交易情绪/行为标签
    private String emotion;

    private LocalDateTime timestamp; // 交易时间
}