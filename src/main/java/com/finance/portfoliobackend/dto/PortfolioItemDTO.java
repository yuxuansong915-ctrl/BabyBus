package com.finance.portfoliobackend.dto;

import lombok.Data;

@Data // 同样使用 Lombok 自动生成 Get/Set
public class PortfolioItemDTO {
    private Long id;
    private String ticker;
    private Integer shares;
    private Double currentPrice; // 新增：实时单价
    private Double totalValue;   // 新增：总价值 (数量 * 单价)
}