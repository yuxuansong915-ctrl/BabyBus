package com.finance.portfoliobackend.repository;

import com.finance.portfoliobackend.model.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, Long> {
    // 神奇的地方就在这里：只要继承了 JpaRepository，
    // Spring Boot 就已经自动帮我们写好了 findAll(), save(), deleteById() 等方法。

    // 新增：告诉 Spring Boot，请帮我自动生成一段 "根据 ticker 查找持仓" 的 SQL 逻辑
    Optional<PortfolioItem> findByTicker(String ticker);
}