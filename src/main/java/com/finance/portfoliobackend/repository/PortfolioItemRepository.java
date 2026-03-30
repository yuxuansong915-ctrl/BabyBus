package com.finance.portfoliobackend.repository;

import com.finance.portfoliobackend.model.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, Long> {
    // 神奇的地方就在这里：只要继承了 JpaRepository，
    // Spring Boot 就已经自动帮我们写好了 findAll(), save(), deleteById() 等方法。
    // 我们一行代码都不用写！
}