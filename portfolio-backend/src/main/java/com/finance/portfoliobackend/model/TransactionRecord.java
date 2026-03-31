package com.finance.portfoliobackend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class TransactionRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String ticker;      // 股票代码
    private String actionType;  // 买入(BUY) 或 卖出(SELL)
    private Integer shares;     // 交易数量
    private Double price;       // 交易时的单价
    private LocalDateTime timestamp; // 交易时间
}