package com.finance.portfoliobackend.controller;

import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // 告诉 Spring 这是一个处理 REST 请求的类，返回的数据会自动转成 JSON
@RequestMapping("/api/portfolio") // 统一这组接口的 URL 前缀
@CrossOrigin(origins = "*") // 🌟 非常关键：允许前端跨域访问，否则一会儿写 React 时会报错！
public class PortfolioController {

    @Autowired
    private PortfolioItemRepository repository; // 把刚才的数据访问层注入进来

    /**
     * API: 浏览投资组合 (获取所有资产)
     * URL: GET http://localhost:8080/api/portfolio
     * 对应项目需求优先级 1: Browse a portfolio
     */
    @GetMapping
    public List<PortfolioItem> getAllItems() {
        // 直接调用 repository 的 findAll 方法，它会去数据库查出所有数据并打包成 List 返回
        return repository.findAll();
    }
}