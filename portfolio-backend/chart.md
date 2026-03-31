graph TD
    %% 样式定义
    classDef frontend fill:#e3f2fd,stroke:#2196f3,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef database fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,stroke-dasharray: 5 5;

    %% 前端层
    subgraph 💻 前端交互层 (React 18)
        App[App.js 总控制台]
        subgraph 组件阵列
            C1(持仓数据表<br/>带 Sparkline 折线图)
            C2(资产占比饼图<br/>动态重绘)
            C3(买入交易表单<br/>容错拦截)
            C4(历史流水弹窗<br/>资金留痕)
        end
        App --> C1 & C2 & C3 & C4
    end

    %% 后端层
    subgraph ⚙️ 后端调度层 (Spring Boot 3)
        Controller[Controller 层<br/>RESTful API 暴露]
        
        subgraph 核心业务逻辑
            Service[Service 层<br/>数据缝合与校验]
            Cache[(Spring Cache<br/>5分钟价格缓存)]
            Scheduler((定时任务<br/>每日资产快照))
        end
        
        Repository[Repository 层<br/>Spring Data JPA]

        Controller <--> Service
        Service <--> Cache
        Controller <--> Repository
        Scheduler --> Repository
        Scheduler -. 触发 .-> Service
    end

    %% 数据库层
    subgraph 🗄️ 数据持久层 (MySQL)
        DB1[(portfolio_item<br/>当前持仓表)]
        DB2[(transaction_record<br/>交易流水表)]
        DB3[(portfolio_history<br/>资产历史快照表)]
        
        Repository <--> DB1 & DB2 & DB3
    end

    %% 外部数据源
    subgraph ☁️ 外部金融数据网络
        AWS((AWS EODHD API<br/>实时行情 & 基本面数据))
    end

    %% 跨层调用连线
    C1 & C2 & C4 -- "HTTP GET (获取数据)" --> Controller
    C3 -- "HTTP POST/DELETE (交易动作)" --> Controller
    Service -- "HTTP GET (抓取 JSON)" --> AWS

    %% 应用样式
    class App,C1,C2,C3,C4 frontend;
    class Controller,Service,Repository,Cache,Scheduler backend;
    class DB1,DB2,DB3 database;
    class AWS external;
