import React, { useState } from 'react';

const AddAssetForm = ({ refreshData }) => {
  // 定义表单的内部状态：代码、数量、以及一个防抖用的加载状态
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 拦截并处理表单提交事件
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止浏览器默认的刷新页面行为
    
    // 前端基础容错拦截
    if (!ticker || !shares) return alert('请输入股票代码和数量！');
    if (shares <= 0) return alert('买入数量必须大于 0！');

    setIsLoading(true); // 按钮变为“处理中...”

    // 向后端发起买入请求
    fetch('http://localhost:8080/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), shares: parseInt(shares) })
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) {
        // 买入成功：清空输入框，并大喊一声通知主板 (App.js) 刷新数据
        setTicker('');
        setShares('');
        refreshData(); 
      } else {
        // 买入失败：大概率是咱们后端做的容错生效了（股票代码不存在）
        const errorText = await res.text();
        alert(`❌ 交易失败: ${errorText}`);
      }
    })
    .catch(err => {
      setIsLoading(false);
      console.error('网络请求出错:', err);
      alert('网络连接异常，请检查后端服务。');
    });
  };

  return (
    <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>➕ 买入新资产</h2>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', color: '#34495e', display: 'block', marginBottom: '5px' }}>股票代码 (Ticker)</label>
          <input 
            type="text" 
            value={ticker} 
            onChange={e => setTicker(e.target.value)} 
            placeholder="例如: AAPL, TSLA" 
            required 
            style={{ width: '90%', padding: '10px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', textTransform: 'uppercase' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#34495e', display: 'block', marginBottom: '5px' }}>买入数量 (Shares)</label>
          <input 
            type="number" 
            value={shares} 
            onChange={e => setShares(e.target.value)} 
            placeholder="请输入整数" 
            min="1" 
            required 
            style={{ width: '90%', padding: '10px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '95%', 
            padding: '12px', 
            backgroundColor: isLoading ? '#95a5a6' : '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isLoading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
        >
          {isLoading ? '交易处理中...' : '确认买入'}
        </button>
      </form>
    </div>
  );
};

export default AddAssetForm;