import React, { useState, useEffect } from 'react';
import { History, ArrowDownRight, ArrowUpRight, BrainCircuit, Filter } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 组件挂载时，去后端拉取所有的流水账
  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio/ledger')
      .then(res => res.json())
      .then(data => {
        // 按时间倒序排列（最新的交易在最上面）
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setTransactions(sortedData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("获取流水账失败:", err);
        setIsLoading(false);
      });
  }, []);

  // --- 辅助函数：根据不同的情绪标签，返回不同的颜色配置 ---
  const getEmotionStyle = (emotion) => {
    if (!emotion) return { bg: '#f1f5f9', text: '#64748b' };
    if (emotion.includes('计划内')) return { bg: '#dcfce7', text: '#166534' }; // 绿色
    if (emotion.includes('FOMO') || emotion.includes('追涨')) return { bg: '#fee2e2', text: '#991b1b' }; // 红色
    if (emotion.includes('恐慌')) return { bg: '#fef3c7', text: '#92400e' }; // 黄色
    if (emotion.includes('冲动')) return { bg: '#ffedd5', text: '#9a3412' }; // 橙色
    if (emotion.includes('对冲')) return { bg: '#e0f2fe', text: '#075985' }; // 蓝色
    return { bg: '#f3e8ff', text: '#6b21a8' }; // 紫色 (媒体驱动等)
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', minHeight: 'calc(100vh - 150px)' }}>
      
      {/* 头部区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={28} color="#3b82f6" /> 行为金融学审计台 (Trading Journal)
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            复盘您的每一笔交易，觉察情绪对投资决策的影响。
          </p>
        </div>
        
        {/* 预留的筛选按钮 */}
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>
          <Filter size={16} /> 筛选情绪
        </button>
      </div>

      {/* 核心表格区域 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>交易时间</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>动作</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>资产代码</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>成交价格</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>数量</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>总金额</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>决策情绪 (Behavioral Tag)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>正在调取档案...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>暂无交易记录，请先在 Holdings 页面添加。</td></tr>
            ) : (
              transactions.map((tx) => {
                const isAdd = tx.actionType === 'ADD';
                const emotionStyle = getEmotionStyle(tx.emotion);
                
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                    
                    {/* 时间 */}
                    <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                      {new Date(tx.timestamp).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    
                    {/* 动作 (买入/卖出 图标) */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: isAdd ? '#ecfdf5' : '#fef2f2', color: isAdd ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                        {isAdd ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                        {isAdd ? '买入' : '卖出'}
                      </div>
                    </td>
                    
                    {/* 代码 */}
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>{tx.ticker}</td>
                    
                    {/* 价格与货币 */}
                    <td style={{ padding: '16px', color: '#334155' }}>
                      {tx.price ? `${tx.price.toFixed(2)} ${tx.currency}` : 'N/A'}
                    </td>
                    
                    {/* 数量 */}
                    <td style={{ padding: '16px', color: '#334155' }}>{tx.shares} 股</td>
                    
                    {/* 总金额计算 */}
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      {tx.price && tx.shares ? `${(tx.price * tx.shares).toFixed(2)} ${tx.currency}` : 'N/A'}
                    </td>
                    
                    {/* 🎯 核心亮点：情绪标签 */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: emotionStyle.bg, color: emotionStyle.text, fontSize: '13px', fontWeight: 'bold' }}>
                        <BrainCircuit size={14} />
                        {tx.emotion}
                      </div>
                    </td>
                    
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;