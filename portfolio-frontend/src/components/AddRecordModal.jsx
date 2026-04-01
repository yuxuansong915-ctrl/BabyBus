import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Activity, BrainCircuit } from 'lucide-react';

// 新增 tradeMode 属性：'ADD' 表示加仓/买入，'SELL' 表示减仓/卖出
const AddRecordModal = ({ isOpen, onClose, onSuccess, prefillData, tradeMode = 'ADD' }) => {
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [emotion, setEmotion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 动态配置 UI 文本和接口
  const isSell = tradeMode === 'SELL';
  const modalTitle = isSell ? '减仓 / 卖出资产' : '记录新交易 (加仓)';
  const themeColor = isSell ? '#ef4444' : '#2563eb'; // 卖出为红色，买入为蓝色
  const apiEndpoint = isSell ? '/api/portfolio/sell' : '/api/portfolio/add';

  useEffect(() => {
    if (isOpen) {
      setTicker(prefillData?.ticker || '');
      setAssetType(prefillData?.assetType || 'STOCK');
      setPrice(''); setShares(''); setTotalCost('');
      // 根据买卖模式，重置默认情绪
      setEmotion(isSell ? '止盈抛售 / 目标达成' : '计划内投资 / 价值低估');
    }
  }, [isOpen, prefillData, isSell]);

  if (!isOpen) return null;

  const handleSharesChange = (e) => { setShares(e.target.value); setTotalCost(''); };
  const handleTotalCostChange = (e) => { setTotalCost(e.target.value); setShares(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker) return alert('请输入资产代码！');
    if (!shares && !totalCost) return alert(isSell ? '请填写卖出股数或回笼资金总量！' : '【买入股数】和【总投入资金】请至少填写一项！');

    setIsLoading(true);
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

    fetch(`http://localhost:8080${apiEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errText = await res.text();
        alert(`❌ 操作失败: ${errText}`);
      }
    })
    .catch(err => {
      setIsLoading(false);
      alert('网络请求失败，请检查后端状态。');
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        <div style={{ backgroundColor: '#f8fafc', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color={themeColor} /> {modalTitle}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          {/* 代码与类型 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>资产代码 (Ticker)*</label>
              <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} required disabled={isSell} placeholder="如: AAPL.US" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', textTransform: 'uppercase', backgroundColor: isSell ? '#f1f5f9' : 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>资产类型*</label>
              <select value={assetType} onChange={e => setAssetType(e.target.value)} disabled={isSell} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: isSell ? '#f1f5f9' : 'white' }}>
                <option value="STOCK">股票 (Stock)</option>
                <option value="ETF">基金 (ETF)</option>
              </select>
            </div>
          </div>

          {/* 时间与单价 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}><Calendar size={16}/> 交易时间</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}><DollarSign size={16}/> 成交单价 (选填)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="留空则调取当日收盘价" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* 数量与金额 */}
          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>交易规模 (填写其中一项即可)*</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <input type="number" value={shares} onChange={handleSharesChange} placeholder={isSell ? "卖出股数" : "买入股数"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: totalCost ? 0.5 : 1 }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>
                <input type="number" step="0.01" value={totalCost} onChange={handleTotalCostChange} placeholder={isSell ? "回笼资金总额" : "总投入资金"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: shares ? 0.5 : 1 }} />
              </div>
            </div>
          </div>

          {/* 行为情绪标签 (根据买卖动态切换) */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: themeColor }}><BrainCircuit size={18}/> 决策情绪 (Behavioral Tag)*</label>
            {/* 👇 完美修复了三元运算符缺失冒号的 Bug */}
            <select value={emotion} onChange={e => setEmotion(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${isSell ? '#fca5a5' : '#ddd6fe'}`, boxSizing: 'border-box', backgroundColor: isSell ? '#fef2f2' : '#f5f3ff', color: isSell ? '#991b1b' : '#4c1d95', fontWeight: 'bold', fontSize: '15px' }}>
              {isSell ? (
                <>
                  <option value="止盈抛售 / 目标达成">🟢 止盈抛售 / 目标达成 (Take Profit)</option>
                  <option value="止损割肉 / 逻辑破坏">🔴 止损割肉 / 逻辑破坏 (Stop Loss)</option>
                  <option value="恐慌抛售 / 规避风险">🟡 恐慌抛售 / 规避风险 (Panic Sell)</option>
                  <option value="资金调仓 / 发现新机会">🟣 资金调仓 / 发现新机会 (Rebalancing)</option>
                  <option value="冲动抛售 / 缺乏耐心">🟠 冲动抛售 / 缺乏耐心 (Impulsive)</option>
                </>
              ) : (
                <>
                  <option value="计划内投资 / 价值低估">🟢 计划内投资 / 价值低估 (Rational)</option>
                  <option value="错失恐惧 / 追涨 (FOMO)">🔴 错失恐惧 / 追涨 (FOMO)</option>
                  <option value="恐慌补仓 / 摊低成本">🟡 恐慌补仓 / 摊低成本 (Averaging Down)</option>
                  <option value="新闻或社交媒体驱动">🟣 新闻或社交媒体驱动 (Media Driven)</option>
                  <option value="冲动交易 / 纯凭直觉">🟠 冲动交易 / 纯凭直觉 (Impulsive)</option>
                  <option value="风险对冲 / 资产配置">🔵 风险对冲 / 资产配置 (Hedging)</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>取消</button>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#94a3b8' : themeColor, color: 'white', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? '正在记录...' : (isSell ? '💸 确认卖出' : '💾 保存交易')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;