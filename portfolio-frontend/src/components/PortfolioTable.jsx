import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- 内部小组件：迷你金融走势图 (Sparkline) ---
const Sparkline = ({ priceData }) => {
  // 如果后端没传历史数据，就不画图
  if (!priceData || priceData.length === 0) return <span style={{ color: '#999', fontSize: '12px' }}>暂无走势</span>;
  
  // 将后端的简单数组 [150, 151, 155...] 转换为 Recharts 需要的格式
  const chartData = priceData.map((price, index) => ({ index, price }));

  return (
    <div style={{ width: '100px', height: '35px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          {/* 隐藏 Y 轴，但设置为 auto 让线条波动幅度最大化，看起来更专业 */}
          <YAxis domain={['auto', 'auto']} hide />
          {/* 画一条平滑的蓝色曲线，去掉数据点，取消动画 */}
          <Line type="monotone" dataKey="price" stroke="#2980b9" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- 主组件：持仓明细表格 ---
const PortfolioTable = ({ data, refreshData }) => {

  // 处理卖出/删除逻辑
  const handleSell = (id, ticker) => {
    // 弹窗二次确认，防止误触
    if (window.confirm(`确定要清仓 [${ticker}] 吗？交易不可逆！`)) {
      fetch(`http://localhost:8080/api/portfolio/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            refreshData(); // 核心：卖出成功后，通知父组件 App.js 重新拉取数据
          } else {
            alert('交易失败，请检查后端状态。');
          }
        })
        .catch(err => console.error('删除请求出错:', err));
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>💼 我的持仓明细</h2>
      
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px 0' }}>当前空仓，请在上方买入资产。</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', color: '#34495e' }}>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>股票代码</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>持有数量</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>最新单价</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>近期走势</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>总价值</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>交易操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ecf0f1', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px' }}>{item.ticker}</td>
                <td style={{ padding: '15px' }}>{item.shares} 股</td>
                <td style={{ padding: '15px' }}>${item.currentPrice?.toFixed(2) || '0.00'}</td>
                
                {/* 重点：调用上面写的迷你图组件，传入 priceTrend 数组 */}
                <td style={{ padding: '10px 15px' }}>
                  <Sparkline priceData={item.priceTrend} />
                </td>
                
                <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold', fontSize: '16px' }}>
                  ${item.totalValue?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleSell(item.id, item.ticker)} 
                    style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    卖出
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PortfolioTable;