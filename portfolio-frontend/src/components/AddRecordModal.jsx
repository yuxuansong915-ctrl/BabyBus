import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Activity, BrainCircuit } from 'lucide-react';

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

  const isSell = tradeMode === 'SELL';
  const modalTitle = isSell ? '减仓 / 卖出资产' : '记录新交易 (加仓)';
  const themeColor = isSell ? '#ef4444' : '#2563eb';
  const apiEndpoint = isSell ? '/api/portfolio/sell' : '/api/portfolio/add';

  useEffect(() => {
    if (isOpen) {
      setTicker(prefillData?.ticker || '');
      setAssetType(prefillData?.assetType || 'STOCK');
      setPrice(''); setShares(''); setTotalCost('');
      setEmotion(isSell ? '止盈抛售 / 目标达成' : '计划内投资 / 价值低估');
    }
  }, [isOpen, prefillData, isSell]);

  if (!isOpen) return null;

  const handleSharesChange = (e) => { setShares(e.target.value); setTotalCost(''); };
  const handleTotalCostChange = (e) => { setTotalCost(e.target.value); setShares(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker) return alert('请输入资产代码！');
    if (!shares && !totalCost) return alert(isSell ? '请填写卖出数量或回笼资金总量！' : '【买入数量】和【总投入资金】请至少填写一项！');

    // ==========================================
    // 🧠 核心干预逻辑 1：止损冷静期温和预警
    // ==========================================
    const enableLossCooldown = localStorage.getItem('enableLossCooldown') === 'true';
    if (enableLossCooldown) {
      const cooldownUntil = localStorage.getItem('lossCooldownUntil');
      if (cooldownUntil && Date.now() < parseInt(cooldownUntil)) {
        const remainingHours = ((parseInt(cooldownUntil) - Date.now()) / (1000 * 60 * 60)).toFixed(1);
        
        // 使用 confirm 让用户自己做决定
        const confirmCooldown = window.confirm(
          `⏱️ 【冷静期预警】\n\n系统检测到您在不久前刚经历过一次止损割肉。\n目前您仍处于交易冷静期（剩余 ${remainingHours} 小时）。\n\n人在亏损后极易产生“复仇性交易”的冲动，导致错上加错。\n您确定自己现在的头脑是绝对清醒的，并且坚持要执行这笔交易吗？`
        );
        
        if (!confirmCooldown) return; // 如果用户点击“取消”，放弃交易
      }
    }

    // ==========================================
    // 🧠 核心干预逻辑 2：FOMO 拦截器
    // ==========================================
    const enableFomoAlert = localStorage.getItem('enableFomoAlert') !== 'false'; // 默认开启
    if (!isSell && enableFomoAlert && emotion.includes('FOMO')) {
      const confirmFomo = window.confirm(
        "🚨 【行为干预触发】🚨\n\n系统检测到您当前的决策情绪为“错失恐惧 (FOMO)”。\n巴菲特曾说：‘在别人贪婪时恐惧’。冲动追涨是亏损的根源。\n\n您是否已经做好了最坏的风险打算，并坚持要买入？"
      );
      if (!confirmFomo) return; // 如果用户点击取消，直接拦截交易！
    }

    setIsLoading(true);
    const payload = {
      ticker: ticker.toUpperCase(), assetType, date: date || null,
      price: price ? parseFloat(price) : null, 
      // 修复：把 parseInt 换成 parseFloat，不再生吞加密货币的小数！
      shares: shares ? parseFloat(shares) : null, 
      totalCost: totalCost ? parseFloat(totalCost) : null, currency, emotion
    };

    // 强制使用 127.0.0.1 避免 localhost 解析问题
    fetch(`http://127.0.0.1:8080${apiEndpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) { 
        // ==========================================
        // 🧠 核心干预逻辑 3：触发冷静期倒计时
        // ==========================================
        if (isSell && emotion.includes('止损割肉') && enableLossCooldown) {
          const lockTime = Date.now() + 24 * 60 * 60 * 1000; 
          localStorage.setItem('lossCooldownUntil', lockTime.toString());
          alert('⚠️ 止损指令已执行。\n\n系统已为您开启 24 小时交易冷静期。在接下来的 24 小时内，您发起新交易时系统将进行额外的高风险提示。');
        }

        onSuccess(); 
        onClose(); 
      } 
      else { alert(`❌ 操作失败: ${await res.text()}`); }
    })
    .catch(err => { setIsLoading(false); alert('网络请求失败'); });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color={themeColor} /> {modalTitle}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>资产代码 (Ticker)*</label>
              <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} required disabled={isSell} placeholder="如: AAPL.US" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', textTransform: 'uppercase', backgroundColor: isSell ? '#f1f5f9' : 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>资产类型*</label>
              <select value={assetType} onChange={e => setAssetType(e.target.value)} disabled={isSell} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: isSell ? '#f1f5f9' : 'white' }}>
                <option value="STOCK">股票 (Stock)</option>
                <option value="CRYPTO">加密货币 (Crypto)</option>
                <option value="FOREX">外汇 (Forex)</option>
                <option value="COMMODITIES">贵金属/大宗 (Commodities)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}><Calendar size={16}/> 交易时间</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}><DollarSign size={16}/> 成交单价 (选填)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="留空则调取当日收盘价" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>交易规模 (填写其中一项即可)*</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <input type="number" value={shares} onChange={handleSharesChange} placeholder={isSell ? "卖出数量" : "买入数量"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: totalCost ? 0.5 : 1 }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="HKD">HKD</option>
                </select>
                <input type="number" step="0.01" value={totalCost} onChange={handleTotalCostChange} placeholder={isSell ? "回笼资金总额" : "总投入资金"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: shares ? 0.5 : 1 }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: themeColor }}><BrainCircuit size={18}/> 决策情绪 (Behavioral Tag)*</label>
            <select value={emotion} onChange={e => setEmotion(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${isSell ? '#fca5a5' : '#ddd6fe'}`, boxSizing: 'border-box', backgroundColor: isSell ? '#fef2f2' : '#f5f3ff', color: isSell ? '#991b1b' : '#4c1d95', fontWeight: 'bold', fontSize: '15px' }}>
              {isSell ? (
                <>
                  <option value="止盈抛售 / 目标达成">🟢 止盈抛售 / 目标达成 (Take Profit)</option>
                  <option value="止损割肉 / 逻辑破坏">🔴 止损割肉 / 逻辑破坏 (Stop Loss)</option>
                  <option value="恐慌抛售 / 规避风险">🟡 恐慌抛售 / 规避风险 (Panic Sell)</option>
                  <option value="冲动抛售 / 缺乏耐心">🟠 冲动抛售 / 缺乏耐心 (Impulsive)</option>
                </>
              ) : (
                <>
                  <option value="计划内投资 / 价值低估">🟢 计划内投资 / 价值低估 (Rational)</option>
                  <option value="错失恐惧 / 追涨 (FOMO)">🔴 错失恐惧 / 追涨 (FOMO)</option>
                  <option value="恐慌补仓 / 摊低成本">🟡 恐慌补仓 / 摊低成本 (Averaging Down)</option>
                  <option value="冲动交易 / 纯凭直觉">🟠 冲动交易 / 纯凭直觉 (Impulsive)</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>取消</button>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#94a3b8' : themeColor, color: 'white', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? '正在处理...' : (isSell ? '💸 确认卖出' : '💾 保存交易')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;