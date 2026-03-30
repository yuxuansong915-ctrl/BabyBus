## 后端架构与功能总结 (Backend Milestone Review)

### 一、 整体架构与技术栈

本项目后端采用标准的**三层架构 (Controller - Service - Repository)**，实现高内聚低耦合，符合企业级开发规范：

* **基础框架：** Spring Boot (快速整合，内置 Tomcat 服务器)
* **依赖管理：** Maven
* **数据库交互：** Spring Data JPA + Hibernate (自动化 ORM 映射)
* **数据解析：** Jackson (强大的 JSON 处理工具)
* **外部通信：** RestTemplate (HTTP 客户端，负责向外部获取实时行情)

---

### 二、 REST API 接口清单 (API Endpoints)

已完整实现核心 MVP 需求，涵盖投资组合的增、删、查功能，并完美解决跨域 (CORS) 问题。

| 请求方法 (Method) | 接口路径 (URL) | 核心功能 | 参数说明 | 返回结果 |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/api/portfolio` | **浏览投资组合** | 无 | 包含实时单价 (`currentPrice`) 和总价值 (`totalValue`) 的 JSON 数组 |
| **`POST`** | `/api/portfolio` | **添加资产** | JSON 格式: `{ "ticker": "AAPL", "shares": 10 }` | 存入数据库后，返回带有自增主键 `id` 的 JSON 数据 |
| **`DELETE`**| `/api/portfolio/{id}`| **移除资产** | 路径参数 `id` (例如: `/api/portfolio/1`) | 成功返回 `200 OK`，失败返回 `404 Not Found` |

---

### 三、 核心架构亮点 (Key Features)

#### 1. 数据模型与解耦 (Entity vs. DTO)
系统实现了数据库持久层与前端传输层的严格解耦：
* **`PortfolioItem` (Entity):** 严格对应 MySQL 数据库表结构，仅包含基础属性 (`id`, `ticker`, `shares`)。
* **`PortfolioItemDTO` (DTO):** 专为前端定制的数据传输对象，动态计算并增加了 `currentPrice` 和 `totalValue` 字段，极大减轻了前端的计算压力。

#### 2. 外部金融数据集成 (`FinanceDataService`)
负责与真实金融数据源（AWS 缓存接口）交互，具备容错机制。

```java
// 核心逻辑：使用 Jackson 精准解析多层嵌套 JSON 提取最新收盘价
public Double getLatestPrice(String ticker) {
    String response = restTemplate.getForObject(AWS_API_URL + ticker.toUpperCase(), String.class);
    JsonNode rootNode = objectMapper.readTree(response);
    JsonNode closeArray = rootNode.path("price_data").path("close");
    // 提取数组的最后一个元素作为实时价格
    return closeArray.get(closeArray.size() - 1).asDouble();
}
```

#### 3. 业务调度与组装 (PortfolioController)
Controller 层负责调度底层数据库与外部 Service，拼装最终响应。

```java
// 核心逻辑：数据缝合与业务计算
@GetMapping
public List<PortfolioItemDTO> getAllItems() {
List<PortfolioItem> items = repository.findAll();
List<PortfolioItemDTO> resultList = new ArrayList<>();

    for (PortfolioItem item : items) {
        PortfolioItemDTO dto = new PortfolioItemDTO();
        dto.setId(item.getId());
        dto.setTicker(item.getTicker());
        dto.setShares(item.getShares());

        // 获取实时单价并计算总价值
        Double latestPrice = financeService.getLatestPrice(item.getTicker());
        dto.setCurrentPrice(latestPrice);
        dto.setTotalValue(latestPrice * item.getShares());

        resultList.add(dto);
    }
    return resultList;
}
```