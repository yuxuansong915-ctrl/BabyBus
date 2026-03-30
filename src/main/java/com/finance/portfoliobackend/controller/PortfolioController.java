package com.finance.portfoliobackend.controller;

import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import com.finance.portfoliobackend.service.FinanceDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioController {

    @Autowired
    private PortfolioItemRepository repository;

    @Autowired
    private FinanceDataService financeService; // 把获取价格的服务注入进来

    /**
     * API 1: 浏览投资组合 (现在带真实价格了！)
     */
    @GetMapping
    public List<PortfolioItemDTO> getAllItems() {
        // 1. 先从 MySQL 数据库里查出所有的股票和数量
        List<PortfolioItem> items = repository.findAll();
        List<PortfolioItemDTO> resultList = new ArrayList<>();

        // 2. 遍历每一项，去 AWS 接口查实时价格
        for (PortfolioItem item : items) {
            PortfolioItemDTO dto = new PortfolioItemDTO();
            dto.setId(item.getId());
            dto.setTicker(item.getTicker());
            dto.setShares(item.getShares());

            // 调用 Service 获取最新单价
            Double latestPrice = financeService.getLatestPrice(item.getTicker());
            dto.setCurrentPrice(latestPrice);

            // 计算总价值：单价 * 数量
            dto.setTotalValue(latestPrice * item.getShares());

            resultList.add(dto);
        }

        // 3. 返回包含丰富信息的数据列表给前端
        return resultList;
    }

    // ... POST 和 DELETE 接口保持不变，放在这里即可 ...
    @PostMapping
    public PortfolioItem addPortfolioItem(@RequestBody PortfolioItem item) {
        return repository.save(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePortfolioItem(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}