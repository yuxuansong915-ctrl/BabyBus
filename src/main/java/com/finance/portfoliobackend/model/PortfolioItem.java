package com.finance.portfoliobackend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data // Lombok 注解，自动生成 Getter, Setter, toString 等
@Entity // 告诉 Spring JPA 这是一个数据库实体
@Table(name = "portfolio_item") // 对应数据库中的表名
public class PortfolioItem {

    @Id // 标明主键
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增策略
    private Long id;

    @Column(nullable = false, length = 10)
    private String ticker;

    @Column(nullable = false)
    private Integer shares;
}