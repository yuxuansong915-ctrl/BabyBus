/*
  资金流水弹窗组件 LedgerModal
  作用：打开弹窗后自动从后端获取所有交易记录，按时间倒序展示
  包含加载状态、空数据提示、表格展示、买入/卖出样式区分，支持关闭与滚动查看
*/
import React, { useState, useEffect } from 'react';

const LedgerModal = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 组件一出现，立刻去后端拉取流水账数据
  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio/ledger')
      .then(res => res.json())
      .then(data => {
        // 将数据按时间倒序排列（最新的交易在最上面）
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setTransactions(sortedData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("获取流水账失败:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    // 外层半透明黑色遮罩背景
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      
      // 内层白色弹窗面板
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '800px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        {/* 弹窗头部：标题和关闭按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>📜 资金流转审计 (Transaction Ledger)</h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d' }}
          >
            ✖
          </button>
        </div>

        {/* 弹窗主体：滚动表格 */}
        <div style={{ overflowY: 'auto', flex: '1' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>正在从服务器调取档案...</p>
          ) : transactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>暂无交易记录。</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr style={{ color: '#34495e' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>交易时间</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>股票代码</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>操作类型</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>成交数量</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>成交单价</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    {/* 将后端传来的时间戳格式化为人类可读的时间 */}
                    <td style={{ padding: '12px', color: '#7f8c8d', fontSize: '14px' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.ticker}</td>
                    
                    {/* 根据 BUY 和 SELL 显示不同的颜色标签 */}
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: tx.actionType === 'BUY' ? '#e8f8f5' : '#fdedec',
                        color: tx.actionType === 'BUY' ? '#27ae60' : '#e74c3c'
                      }}>
                        {tx.actionType === 'BUY' ? '买入 (BUY)' : '卖出 (SELL)'}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px' }}>{tx.shares} 股</td>
                    <td style={{ padding: '12px' }}>${tx.price?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default LedgerModal;