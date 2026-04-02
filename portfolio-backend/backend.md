# 📈 投资组合管理系统 (Portfolio Manager) - 后端架构全景报告

## 一、 系统定位与架构概览 (Architecture Overview)
本项目后端并非简单的增删改查（CRUD）程序，而是一个具备**容错机制、数据追溯、性能优化和自动化调度**的企业级金融数据处理中枢。

* **基础骨架：** Java 17 + Spring Boot 3 (三层架构设计，高内聚低耦合)
* **数据持久化：** MySQL + Spring Data JPA (Hibernate 自动 ORM 映射)
* **通信与解析：** RestTemplate (外部 API 调用) + Jackson (深层 JSON 解析)
* **接口规范：** RESTful API 设计标准 + OpenAPI (Swagger) 可视化文档支持
* **性能与调度：** Spring Cache (本地缓存) + Spring Task (后台定时任务)

---

## 二、 核心业务模块 (Core Business Modules)

### 1. 资产实时估值引擎 (Real-time Valuation)
系统彻底解耦了“静态持仓”与“动态行情”。接收到前端请求后，系统实时从 AWS 缓存接口拉取长序列金融数据，并结合本地数据库的持有数量，在内存中瞬间计算出各项资产的`现价 (currentPrice)` 和 `总价值 (totalValue)`。

### 2. 交易流水追溯本 (Transaction Ledger)
打破了传统应用只能查看“当前快照”的局限。任何买入（POST）或卖出（DELETE）操作，都会触发“记账”动作，自动记录交易资产、动作类型、成交单价及精确到秒的时间戳，保证资金流转 100% 可追溯。

### 3. 历史走势追踪器 (Historical Tracking)
开启了后台守护进程。每隔固定周期，系统自动盘点当前用户的总资产净值并永久归档，为前端绘制“资产走势折线图”提供底层数据支撑。

---

## 三、 答辩高光亮点 (Technical Highlights & Optimizations)

* 🌟 **智能容错与参数校验：** 在买入资产前，系统向外部 API 发起前置校验。若代码不存在，立刻拦截并返回 `400 Bad Request`，杜绝脏数据。
* 🌟 **防拥堵缓存机制：** 引入 `@Cacheable` 机制，同一支股票的数据在 5 分钟内直接从内存读取，接口响应时间降至毫秒级。发生交易时，配合 `@CacheEvict` 自动强制刷新缓存。
* 🌟 **微型走势图支持 (Sparkline)：** 服务端完整解析 AWS 接口返回的 `close` 价格历史数组 (`List<Double>`)，赋能前端渲染专业的金融级走势曲线。
* 🌟 **DTO 数据隔离模式：** 严格区分数据库实体 (`Entity`) 与前端暴露数据 (`DTO`)，在 DTO 层完成现价、总价、走势图的完美缝合，保护数据库隐私。

---

## 四、 数据库物理模型 (Database Schema)
系统核心由三张高内聚的数据表构成：
1.  **`portfolio_item` (当前持仓表):** 记录 `id`, `ticker` (代码), `shares` (数量)。
2.  **`transaction_record` (交易流水表):** 记录每一次的买卖动作 (BUY/SELL)、价格和时间戳。
3.  **`portfolio_history` (资产快照表):** 记录历史时点的组合总价值。

---

## 五、 RESTful API 接口矩阵 (API Matrix)
*所有接口均已配置 `@CrossOrigin` 解决跨域，并可通过 `/swagger-ui/index.html` 在线调试。*

| 请求方法 | 接口路径 | 功能描述 | 核心返回值特征 |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/portfolio` | 获取当前持仓 | 返回 DTO 数组 (含现价、总价值及 `priceTrend` 走势) |
| **GET** | `/api/portfolio/ledger` | 获取交易流水 | 返回包含 `BUY`/`SELL` 及时间戳的流水记录 |
| **GET** | `/api/portfolio/history`| 获取历史快照 | 返回时间和总价值的历史记录，用于趋势分析 |
| **POST**| `/api/portfolio` | 买入新资产 | 前置校验代码真伪；触发缓存清理；记录买入流水 |
| **DELETE**|`/api/portfolio/{id}` | 卖出/移除资产 | 触发缓存清理；获取现价并记录卖出流水 |

---

## 六、 核心源码剖析 (Key Code Implementation)

### 1. 外部数据引擎：精准解析与缓存机制 (`FinanceDataService.java`)
这段代码展示了系统如何与外部世界高效交互。使用了 `ObjectMapper` 精准提取深层嵌套的 JSON 数组，并通过 Spring Cache 极大提升了性能。

```java
// @Cacheable 确保 5 分钟内相同的 ticker 不会重复发起耗时的 HTTP 请求
@Cacheable(value = "stockPrices", key = "#ticker")
public List<Double> getPriceHistory(String ticker) {
    List<Double> prices = new ArrayList<>();
    try {
        String response = restTemplate.getForObject(AWS_API_URL + ticker, String.class);
        JsonNode rootNode = objectMapper.readTree(response); // JSON 树状解析
        
        // 容错校验：防止用户输入不存在的股票代码
        if (rootNode.has("error") || !rootNode.has("price_data")) return null; 

        // 提取长串的 close 价格数组，用于前端画折线图
        JsonNode closeArray = rootNode.path("price_data").path("close");
        for (JsonNode node : closeArray) {
            prices.add(node.asDouble());
        }
        return prices;
    } catch (Exception e) {
        return null;
    }
}
```

### 2. 业务调度中枢：数据缝合与组装 (PortfolioController.java - GET)
这是 DTO 模式的最佳实践。Controller 将底层数据库拿到的“数量”与 Service 拿到的“单价”进行动态计算缝合。

```java
@GetMapping
public List<PortfolioItemDTO> getAllItems() {
    List<PortfolioItem> items = repository.findAll(); // 来源 1：本地数据库
    List<PortfolioItemDTO> resultList = new ArrayList<>();

    for (PortfolioItem item : items) {
        PortfolioItemDTO dto = new PortfolioItemDTO();
        dto.setId(item.getId());
        dto.setTicker(item.getTicker());
        dto.setShares(item.getShares());

        // 来源 2：获取外部 API 的价格走势数组
        List<Double> priceHistory = financeService.getPriceHistory(item.getTicker());
        
        if (priceHistory != null && !priceHistory.isEmpty()) {
            Double latestPrice = priceHistory.get(priceHistory.size() - 1);
            dto.setCurrentPrice(latestPrice);
            // 来源 3：内存即时计算总价值
            dto.setTotalValue(latestPrice * item.getShares()); 
            dto.setPriceTrend(priceHistory); // 注入历史数据画图
        }
        resultList.add(dto);
    }
    return resultList;
}
```

### 3. 高阶架构特性：交易流水与定时自动化 (PortfolioController.java)
展示了在数据发生变更时（买入动作），系统如何保证数据一致性（清理缓存）并实现金融级别的操作留痕。

```java
@PostMapping
public ResponseEntity<?> addPortfolioItem(@RequestBody PortfolioItem item) {
    // 1. 前置验证：防止乱填代码
    List<Double> prices = financeService.getPriceHistory(item.getTicker());
    if (prices == null || prices.isEmpty()) {
        return ResponseEntity.badRequest().body("校验失败：股票代码不存在！");
    }

    // 2. 核心业务：保存持仓记录
    PortfolioItem savedItem = repository.save(item);

    // 3. 附加业务：记录买入流水账 (Ledger)
    TransactionRecord tx = new TransactionRecord();
    tx.setTicker(item.getTicker());
    tx.setActionType("BUY");
    tx.setShares(item.getShares());
    tx.setPrice(prices.get(prices.size() - 1));
    tx.setTimestamp(LocalDateTime.now());
    transactionRepo.save(tx);

    // 4. 数据一致性：清空价格缓存，确保下次获取的是最新数据
    financeService.flushCache();

    return ResponseEntity.ok(savedItem);
}

// 自动化调度：每 5 分钟自动计算全盘总资产，存入快照表
@Scheduled(fixedRate = 300000) 
public void recordTotalValueSnapshot() {
    // ... 计算 totalSum 逻辑
    historyRepo.save(new PortfolioHistory(LocalDate.now(), totalSum));
}
```