import React, { useState, useEffect } from 'react';
import { History, ArrowDownRight, ArrowUpRight, BrainCircuit, Filter } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState('All');

  // 1. 强力翻译器：将数据库中遗留的中文情绪，强制映射为纯英文
  const translateToEnglish = (emo) => {
    if (!emo) return 'Other';
    if (emo.includes('止盈') || emo.includes('计划内')) return 'Rational / Take Profit';
    if (emo.includes('止损') || emo.includes('逻辑破坏')) return 'Stop Loss / Thesis Broken';
    if (emo.includes('FOMO') || emo.includes('追涨')) return 'FOMO / Chasing';
    if (emo.includes('恐慌补仓') || emo.includes('摊低成本')) return 'Panic Buy / Averaging Down';
    if (emo.includes('恐慌抛售') || emo.includes('规避风险')) return 'Panic Sell / Risk Off';
    if (emo.includes('冲动交易') || emo.includes('纯凭直觉')) return 'Impulsive / Pure Instinct';
    if (emo.includes('冲动抛售') || emo.includes('缺乏耐心')) return 'Impulsive Sell / Impatient';
    if (emo.includes('清仓退出')) return 'Exit / Portfolio Clean-up';
    if (emo.includes('新闻或社交媒体驱动')) return 'News / Social Media Driven';
    return emo;
  };

  useEffect(() => {
    fetch('http://127.0.0.1:8080/api/portfolio/ledger')
      .then(res => res.json())
      .then(data => {
        // 在排序的同时，用翻译器把所有的中文洗成英文
        const processedData = data.map(tx => ({
          ...tx,
          emotion: translateToEnglish(tx.emotion) 
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setTransactions(processedData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Fetch failed:", err);
        setIsLoading(false);
      });
  }, []);

  // 2. 动态提取所有出现过的英文情绪（用于生成下拉菜单）
  const uniqueEmotions = ['All', ...new Set(transactions.map(tx => tx.emotion).filter(Boolean))];

  // 3. 过滤器核心逻辑
  const filteredTransactions = selectedEmotion === 'All' 
    ? transactions 
    : transactions.filter(tx => tx.emotion === selectedEmotion);

  // 纯英文的情绪颜色配置器
  const getEmotionStyle = (emotion) => {
    if (!emotion) return { bg: '#f1f5f9', text: '#64748b' };
    const em = emotion.toLowerCase();
    
    if (em.includes('rational') || em.includes('profit')) return { bg: '#dcfce7', text: '#166534' }; // 绿
    if (em.includes('fomo') || em.includes('stop loss')) return { bg: '#fee2e2', text: '#991b1b' }; // 红
    if (em.includes('panic') || em.includes('averaging')) return { bg: '#fef3c7', text: '#92400e' }; // 黄
    if (em.includes('impulsive')) return { bg: '#ffedd5', text: '#9a3412' }; // 橙
    return { bg: '#f3e8ff', text: '#6b21a8' }; // 紫
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', minHeight: 'calc(100vh - 150px)' }}>
      
      {/* 头部区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={28} color="#3b82f6" /> Trading Journal
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Review your trades and analyze the impact of behavioral finance.
          </p>
        </div>
        
        {/* 动态情绪下拉过滤器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px' }}>
          <Filter size={16} color="#475569" />
          <select 
            value={selectedEmotion} 
            onChange={(e) => setSelectedEmotion(e.target.value)}
            style={{ border: 'none', backgroundColor: 'transparent', color: '#0f172a', fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            {uniqueEmotions.map((emo, index) => (
              <option key={index} value={emo}>{emo === 'All' ? 'All Emotions' : emo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 表格区域 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Date</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Action</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Ticker</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Price</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Shares/Qty</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Total Value</th>
              <th style={{ padding: '16px', color: '#475569', fontSize: '14px', borderBottom: '2px solid #e2e8f0' }}>Behavioral Tag</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading ledger...</td></tr>
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No records found.</td></tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isAdd = tx.actionType === 'ADD';
                const emotionStyle = getEmotionStyle(tx.emotion);
                
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                      {new Date(tx.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: isAdd ? '#ecfdf5' : '#fef2f2', color: isAdd ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                        {isAdd ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                        {isAdd ? 'BUY' : 'SELL'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>{tx.ticker}</td>
                    <td style={{ padding: '16px', color: '#334155' }}>
                      {tx.price ? `${tx.price.toLocaleString('en-US', {maximumFractionDigits: 6})} ${tx.currency}` : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>{tx.shares}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      {tx.price && tx.shares ? `${(tx.price * tx.shares).toLocaleString('en-US', {maximumFractionDigits: 2})} ${tx.currency}` : 'N/A'}
                    </td>
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