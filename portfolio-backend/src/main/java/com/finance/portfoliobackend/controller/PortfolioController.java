package com.finance.portfoliobackend.controller;

import com.finance.portfoliobackend.dto.AddRecordRequest;
import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.model.TransactionRecord;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import com.finance.portfoliobackend.repository.TransactionRecordRepository;
import com.finance.portfoliobackend.service.FinanceDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioController {

    @Autowired private PortfolioItemRepository repository;
    @Autowired private TransactionRecordRepository transactionRepo;
    @Autowired private FinanceDataService financeService;

    // ==========================================
    // 1. 获取全盘数据 (Dashboard & Holdings 页面使用)
    // ==========================================
    @GetMapping
    public List<PortfolioItemDTO> getAllItems() {
        List<PortfolioItem> items = repository.findAll();
        List<PortfolioItemDTO> resultList = new ArrayList<>();

        for (PortfolioItem item : items) {
            PortfolioItemDTO dto = new PortfolioItemDTO();
            dto.setId(item.getId());
            dto.setTicker(item.getTicker());
            dto.setAssetType(item.getAssetType());
            dto.setShares(item.getShares());

            // 1. 拉取价格走势
            List<Double> priceHistory = financeService.getPriceHistory(item.getTicker());
            if (priceHistory != null && !priceHistory.isEmpty()) {
                Double latestPrice = priceHistory.get(priceHistory.size() - 1);
                dto.setCurrentPrice(latestPrice);
                dto.setTotalValue(latestPrice * item.getShares());
                dto.setPriceTrend(priceHistory);
            } else {
                dto.setCurrentPrice(0.0);
                dto.setTotalValue(0.0);
            }

            // 2. 🚀 V2.0 核心：拉取多态基本面数据 (市盈率、费率等)
            financeService.populateFundamentals(item.getTicker(), item.getAssetType(), dto);

            resultList.add(dto);
        }
        return resultList;
    }

    // ==========================================
    // 2. 获取交易流水 (Transactions 页面使用)
    // ==========================================
    @GetMapping("/ledger")
    public List<TransactionRecord> getLedger() {
        return transactionRepo.findAll();
    }

    // ==========================================
    // 3. 🚀 V2.0 核心：添加记录 / 加仓 (Add)
    // ==========================================
    @PostMapping("/add")
    public ResponseEntity<?> addRecord(@RequestBody AddRecordRequest request) {
        // --- A. 智能处理“可选字段” (价格与数量计算) ---
        Double finalPrice = request.getPrice();

        // 如果用户没填价格，去 EODHD 查最新价作为默认买入价
        if (finalPrice == null || finalPrice <= 0) {
            List<Double> prices = financeService.getPriceHistory(request.getTicker());
            if (prices == null || prices.isEmpty()) {
                return ResponseEntity.badRequest().body("无法获取股票最新价格，请手动填写买入价！");
            }
            finalPrice = prices.get(prices.size() - 1);
        }

        // 计算最终股数：如果填了总资金没填股数，则 股数 = 总资金 / 单价
        Integer finalShares = request.getShares();
        if ((finalShares == null || finalShares <= 0) && request.getTotalCost() != null) {
            finalShares = (int) Math.floor(request.getTotalCost() / finalPrice);
        }
        if (finalShares == null || finalShares <= 0) {
            return ResponseEntity.badRequest().body("买入股数或总资金必须至少填写一项！");
        }

        // --- B. 更新或新增持仓表 ---
        // 查找是否已经持有该资产，有则累加，无则新建
        List<PortfolioItem> existingItems = repository.findAll();
        PortfolioItem itemToSave = existingItems.stream()
                .filter(item -> item.getTicker().equalsIgnoreCase(request.getTicker()))
                .findFirst()
                .orElse(new PortfolioItem());

        itemToSave.setTicker(request.getTicker().toUpperCase());
        itemToSave.setAssetType(request.getAssetType() != null ? request.getAssetType().toUpperCase() : "STOCK");
        itemToSave.setShares((itemToSave.getShares() == null ? 0 : itemToSave.getShares()) + finalShares);
        repository.save(itemToSave);

        // --- C. 记录专业的行为金融学流水 ---
        TransactionRecord tx = new TransactionRecord();
        tx.setTicker(request.getTicker().toUpperCase());
        tx.setActionType("ADD");
        tx.setShares(finalShares);
        tx.setPrice(finalPrice);
        tx.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        tx.setEmotion(request.getEmotion() != null ? request.getEmotion() : "未分类");
        tx.setTimestamp(request.getDate() != null ? request.getDate().atStartOfDay() : LocalDateTime.now());
        transactionRepo.save(tx);

        financeService.flushCache(); // 清空缓存保证数据最新
        return ResponseEntity.ok(itemToSave);
    }

    // ==========================================
    // 4. 移除记录 / 减仓 (Remove)
    // ==========================================
    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeRecord(@PathVariable Long id) {
        Optional<PortfolioItem> itemOpt = repository.findById(id);
        if (itemOpt.isPresent()) {
            PortfolioItem item = itemOpt.get();

            // 简单逻辑：这里一键清仓。如果是部分减仓，可以参考 Add 接口写一个复杂的 Remove 接口
            TransactionRecord tx = new TransactionRecord();
            tx.setTicker(item.getTicker());
            tx.setActionType("REMOVE");
            tx.setShares(item.getShares());

            List<Double> prices = financeService.getPriceHistory(item.getTicker());
            tx.setPrice((prices != null && !prices.isEmpty()) ? prices.get(prices.size() - 1) : 0.0);

            tx.setCurrency("USD");
            tx.setEmotion("清仓退出");
            tx.setTimestamp(LocalDateTime.now());
            transactionRepo.save(tx);

            repository.deleteById(id);
            financeService.flushCache();
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 5. 🚀 V2.0 核心：减仓/卖出 (Sell)
    // ==========================================
    @PostMapping("/sell")
    public ResponseEntity<?> sellRecord(@RequestBody AddRecordRequest request) {
        List<PortfolioItem> existingItems = repository.findAll();
        Optional<PortfolioItem> itemOpt = existingItems.stream()
                .filter(item -> item.getTicker().equalsIgnoreCase(request.getTicker()))
                .findFirst();

        if (itemOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("您当前并未持有该资产，无法卖出！");
        }
        PortfolioItem item = itemOpt.get();

        // 智能补全价格
        Double finalPrice = request.getPrice();
        if (finalPrice == null || finalPrice <= 0) {
            List<Double> prices = financeService.getPriceHistory(request.getTicker());
            finalPrice = prices.get(prices.size() - 1);
        }

        // 智能计算卖出数量
        Integer finalShares = request.getShares();
        if ((finalShares == null || finalShares <= 0) && request.getTotalCost() != null) {
            finalShares = (int) Math.floor(request.getTotalCost() / finalPrice);
        }
        if (finalShares == null || finalShares <= 0) {
            return ResponseEntity.badRequest().body("卖出股数或总金额必须至少填写一项！");
        }

        // 业务逻辑校验：不能卖出超过持有的数量
        if (finalShares > item.getShares()) {
            return ResponseEntity.badRequest().body("卖出数量（" + finalShares + "）超过了当前持有数量（" + item.getShares() + "）！");
        }

        // 扣减库存，如果全部卖光，则删除该记录
        if (finalShares.equals(item.getShares())) {
            repository.delete(item);
        } else {
            item.setShares(item.getShares() - finalShares);
            repository.save(item);
        }

        // 记录行为金融学流水
        TransactionRecord tx = new TransactionRecord();
        tx.setTicker(request.getTicker().toUpperCase());
        tx.setActionType("REMOVE"); // 标记为卖出
        tx.setShares(finalShares);
        tx.setPrice(finalPrice);
        tx.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        tx.setEmotion(request.getEmotion() != null ? request.getEmotion() : "卖出未分类");
        tx.setTimestamp(request.getDate() != null ? request.getDate().atStartOfDay() : LocalDateTime.now());
        transactionRepo.save(tx);

        financeService.flushCache();
        return ResponseEntity.ok().build();
    }
}