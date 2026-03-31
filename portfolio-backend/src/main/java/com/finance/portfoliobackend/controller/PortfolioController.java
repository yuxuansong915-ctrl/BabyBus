package com.finance.portfoliobackend.controller;

import com.finance.portfoliobackend.dto.PortfolioItemDTO;
import com.finance.portfoliobackend.model.PortfolioItem;
import com.finance.portfoliobackend.model.PortfolioHistory;
import com.finance.portfoliobackend.model.TransactionRecord;
import com.finance.portfoliobackend.repository.PortfolioItemRepository;
import com.finance.portfoliobackend.repository.PortfolioHistoryRepository;
import com.finance.portfoliobackend.repository.TransactionRecordRepository;
import com.finance.portfoliobackend.service.FinanceDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioController {

    @Autowired private PortfolioItemRepository repository;
    @Autowired private TransactionRecordRepository transactionRepo;
    @Autowired private PortfolioHistoryRepository historyRepo;
    @Autowired private FinanceDataService financeService;

    // --- 1. 获取当前持仓 (包含折线图数据) ---
    @GetMapping
    public List<PortfolioItemDTO> getAllItems() {
        List<PortfolioItem> items = repository.findAll();
        List<PortfolioItemDTO> resultList = new ArrayList<>();

        for (PortfolioItem item : items) {
            PortfolioItemDTO dto = new PortfolioItemDTO();
            dto.setId(item.getId());
            dto.setTicker(item.getTicker());
            dto.setShares(item.getShares());

            // 获取整个价格数组 (走缓存)
            List<Double> priceHistory = financeService.getPriceHistory(item.getTicker());

            if (priceHistory != null && !priceHistory.isEmpty()) {
                Double latestPrice = priceHistory.get(priceHistory.size() - 1);
                dto.setCurrentPrice(latestPrice);
                dto.setTotalValue(latestPrice * item.getShares());
                dto.setPriceTrend(priceHistory); // 塞入走势数据供前端画图
            } else {
                dto.setCurrentPrice(0.0);
                dto.setTotalValue(0.0);
            }
            resultList.add(dto);
        }
        return resultList;
    }

    // --- 2. 获取交易流水账 (对应优化 4) ---
    @GetMapping("/ledger")
    public List<TransactionRecord> getLedger() {
        return transactionRepo.findAll();
    }

    // --- 3. 获取历史总资产走势 (对应优化 2) ---
    @GetMapping("/history")
    public List<PortfolioHistory> getHistory() {
        return historyRepo.findAll();
    }

    // --- 4. 买入资产 (带容错校验 & 记流水 & 清缓存) ---
    @PostMapping
    public ResponseEntity<?> addPortfolioItem(@RequestBody PortfolioItem item) {
        // 校验 1: 验证 AWS 是否能查到这只股票 (对应优化 1)
        List<Double> prices = financeService.getPriceHistory(item.getTicker());
        if (prices == null || prices.isEmpty()) {
            return ResponseEntity.badRequest().body("校验失败：股票代码 " + item.getTicker() + " 不存在！");
        }

        // 保存持仓
        PortfolioItem savedItem = repository.save(item);

        // 记流水账 (对应优化 4)
        Double currentPrice = prices.get(prices.size() - 1);
        TransactionRecord tx = new TransactionRecord();
        tx.setTicker(item.getTicker());
        tx.setActionType("BUY");
        tx.setShares(item.getShares());
        tx.setPrice(currentPrice);
        tx.setTimestamp(LocalDateTime.now());
        transactionRepo.save(tx);

        // 手动操作，清空价格缓存 (对应优化 6)
        financeService.flushCache();

        return ResponseEntity.ok(savedItem);
    }

    // --- 5. 卖出资产 (记流水 & 清缓存) ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePortfolioItem(@PathVariable Long id) {
        PortfolioItem item = repository.findById(id).orElse(null);
        if (item != null) {
            // 获取最新价格用于记账
            List<Double> prices = financeService.getPriceHistory(item.getTicker());
            Double currentPrice = (prices != null && !prices.isEmpty()) ? prices.get(prices.size() - 1) : 0.0;

            // 记流水账
            TransactionRecord tx = new TransactionRecord();
            tx.setTicker(item.getTicker());
            tx.setActionType("SELL");
            tx.setShares(item.getShares());
            tx.setPrice(currentPrice);
            tx.setTimestamp(LocalDateTime.now());
            transactionRepo.save(tx);

            repository.deleteById(id);
            financeService.flushCache(); // 清缓存
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // --- 6. 每日定时记录总资产快照 (对应优化 2) ---
    // 为了方便答辩演示，这里设置为每 5 分钟 (300000毫秒) 自动记录一次。真实情况可用 @Scheduled(cron = "0 0 17 * * ?")
    @Scheduled(fixedRate = 300000)
    public void recordTotalValueSnapshot() {
        List<PortfolioItemDTO> currentPortfolio = this.getAllItems();
        double totalSum = currentPortfolio.stream().mapToDouble(dto -> dto.getTotalValue() != null ? dto.getTotalValue() : 0.0).sum();

        if (totalSum > 0) {
            PortfolioHistory history = new PortfolioHistory();
            history.setRecordDate(LocalDate.now()); // 如果是按分钟存，可以改存 LocalDateTime
            history.setTotalValue(totalSum);
            historyRepo.save(history);
            System.out.println("🕒 定时任务执行：已记录当前总资产 " + totalSum);
        }
    }
}