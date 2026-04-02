package com.finance.portfoliobackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AddRecordRequest {
    private String ticker;
    private String assetType;    // 资产类型 (STOCK, ETF等)
    private LocalDate date;      // 购入时间 (前端没传则默认今天)

    private Double price;        // 买入股价 (可选：如果不填，后端会自动去查当天的收盘价)
    private Integer shares;      // 买入股数 (可选)
    private Double totalCost;    // 总投入资金 (可选：股数和总资金填一个即可)

    private String currency;     // 结算货币 (如 USD, CNY)
    private String emotion;      // 决策情绪 (如 FOMO, 价值投资等)

    private String actionType;
}