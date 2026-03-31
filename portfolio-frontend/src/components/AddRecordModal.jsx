import React, { useState } from 'react';
import { X, Calendar, DollarSign, Activity, BrainCircuit } from 'lucide-react';

const AddRecordModal = ({ isOpen, onClose, onSuccess }) => {
  // --- 表单状态管理 ---
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // 默认今天
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [emotion, setEmotion] = useState('计划内投资 / 价值低估');
  
  const [isLoading, setIsLoading] = useState(false);

  // 如果弹窗没打开，直接返回 null (不渲染)
  if (!isOpen) return null;

  // --- 核心逻辑：股数与总资金的互斥输入 ---
  const handleSharesChange = (e) => {
    setShares(e.target.value);
    setTotalCost(''); // 清空另一项
  };
  const handleTotalCostChange = (e) => {
    setTotalCost(e.target.value);
    setShares(''); // 清空另一项
  };

  // --- 提交表单 ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker) return alert('请输入资产代码！');
    if (!shares && !totalCost) return alert('【买入股数】和【总投入资金】请至少填写一项！');

    setIsLoading(true);

    // 组装发给后端的超级数据包 (严格对应后端的 AddRecordRequest DTO)
    const payload = {
      ticker: ticker.toUpperCase(),
      assetType,
      date: date || null,
      price: price ? parseFloat(price) : null,
      shares: shares ? parseInt(shares) : null,
      totalCost: totalCost ? parseFloat(totalCost) : null,
      currency,
      emotion
    };

    fetch('http://localhost:8080/api/portfolio/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) {
        // 成功！通知父组件刷新数据，并关闭弹窗
        onSuccess();
        onClose();
        // 清空表单状态以备下次打开
        setTicker(''); setPrice(''); setShares(''); setTotalCost('');
      } else {
        const errText = await res.text();
        alert(`❌ 记录失败: ${errText}`);
      }
    })
    .catch(err => {
      setIsLoading(false);
      alert('网络请求失败，请检查后端状态。');
      console.error(err);
    });
  };

  return (
    // 外层黑色半透明遮罩
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      
      {/* 弹窗主体 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        {/* 头部 */}
        <div style={{ backgroundColor: '#f8fafc', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="#2563eb" /> 记录新交易 (Trade Journal)
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
            <X size={24} />
          </button>
        </div>

        {/* 表单区域 */}
        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>资产代码 (Ticker)*</label>
              <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} required placeholder="如: AAPL, SPY" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', textTransform: 'uppercase' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>资产类型*</label>
              <select value={assetType} onChange={e => setAssetType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: 'white' }}>
                <option value="STOCK">股票 (Stock)</option>
                <option value="ETF">基金 (ETF)</option>
                <option value="CRYPTO">加密货币 (Crypto)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}><Calendar size={16}/> 购入时间</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}><DollarSign size={16}/> 购入单价 (选填)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="留空则调取当日收盘价" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* 重点交互：股数与总投入 二选一 */}
          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>投入规模 (填写其中一项即可)*</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <input type="number" value={shares} onChange={handleSharesChange} placeholder="买入股数 (Shares)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: totalCost ? 0.5 : 1 }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>
                <input type="number" step="0.01" value={totalCost} onChange={handleTotalCostChange} placeholder="总资金 (Cost)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: shares ? 0.5 : 1 }} />
              </div>
            </div>
          </div>

          {/* 核心亮点：决策情绪标签 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#8b5cf6' }}><BrainCircuit size={18}/> 决策情绪 (Behavioral Tag)*</label>
            <select value={emotion} onChange={e => setEmotion(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd6fe', boxSizing: 'border-box', backgroundColor: '#f5f3ff', color: '#4c1d95', fontWeight: 'bold', fontSize: '15px' }}>
              <option value="计划内投资 / 价值低估">🟢 计划内投资 / 价值低估 (Rational)</option>
              <option value="错失恐惧 / 追涨 (FOMO)">🔴 错失恐惧 / 追涨 (FOMO)</option>
              <option value="恐慌补仓 / 摊低成本">🟡 恐慌补仓 / 摊低成本 (Averaging Down)</option>
              <option value="新闻或社交媒体驱动">🟣 新闻或社交媒体驱动 (Media Driven)</option>
              <option value="冲动交易 / 纯凭直觉">🟠 冲动交易 / 纯凭直觉 (Impulsive)</option>
              <option value="风险对冲 / 资产配置">🔵 风险对冲 / 资产配置 (Hedging)</option>
            </select>
          </div>

          {/* 底部按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>
              取消
            </button>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}>
              {isLoading ? '正在记录...' : '💾 保存交易记录'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;