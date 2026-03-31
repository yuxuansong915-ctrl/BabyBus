import React, { useState, useEffect } from 'react';
// 提前引入我们即将创建的四大组件
// ⚠️ 预警：现在保存后浏览器肯定会报错，因为我们还没建这四个文件，这是正常的！
import AddAssetForm from './components/AddAssetForm';
import PortfolioTable from './components/PortfolioTable';
import AssetChart from './components/AssetChart';
import LedgerModal from './components/LedgerModal';
import './App.css';

function App() {
  // --- 全局状态管理 (State) ---
  const [portfolio, setPortfolio] = useState([]); // 存放当前的持仓数据
  const [isLedgerOpen, setIsLedgerOpen] = useState(false); // 控制“流水账弹窗”的开关

  // --- 核心数据拉取引擎 (连接后端) ---
  const fetchPortfolio = () => {
    fetch('http://localhost:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        console.log("成功拿到后端超级数据包:", data);
        setPortfolio(data); // 把后端的数据存入主板内存
      })
      .catch(err => console.error("获取数据失败，请检查后端是否启动:", err));
  };

  // 页面初次加载时，自动拉取一次数据
  useEffect(() => {
    fetchPortfolio();
  }, []);

  // --- 全局 UI 布局拼装 ---
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* 头部：标题与流水账按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>📈 投资组合专业控制台</h1>
        <button 
          onClick={() => setIsLedgerOpen(true)}
          style={{ padding: '10px 20px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📜 查看交易流水
        </button>
      </div>

      {/* 上半部分：交易台与资产饼图 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {/* 将刷新函数传给表单，买入成功后它能通知主板重新拉数据 */}
        <AddAssetForm refreshData={fetchPortfolio} />
        
        {/* 将持仓数据传给图表去渲染 */}
        <AssetChart data={portfolio} />
      </div>

      {/* 下半部分：带折线图的持仓明细表 */}
      <PortfolioTable data={portfolio} refreshData={fetchPortfolio} />

      {/* 隐藏的弹窗：流水账 (只有 isLedgerOpen 为 true 时才渲染并显示) */}
      {isLedgerOpen && (
        <LedgerModal onClose={() => setIsLedgerOpen(false)} />
      )}

    </div>
  );
}

export default App;