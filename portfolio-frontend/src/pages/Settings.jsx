import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Save, Lock } from 'lucide-react';

// ==========================================
// 资产类型 UI 配置字典 (方便未来无限扩展)
// ==========================================
const ASSET_TYPE_CONFIG = {
  STOCK: { label: 'Stocks', color: '#8b5cf6', defaultLimit: 70 },
  ETF: { label: 'Funds / ETFs', color: '#10b981', defaultLimit: 50 },
  CRYPTO: { label: 'Crypto', color: '#f59e0b', defaultLimit: 20 },
  FOREX: { label: 'Forex', color: '#3b82f6', defaultLimit: 30 },
  COMMODITIES: { label: 'Commodities', color: '#ef4444', defaultLimit: 30 },
};

const Settings = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 核心改造：使用一个对象来统一管理所有资产的红线状态
  const [maxRatios, setMaxRatios] = useState(() => {
    const saved = localStorage.getItem('maxAssetRatios');
    if (saved) return JSON.parse(saved);
    // 向下兼容：如果以前存过旧版的单据，无缝继承过来
    return {
      STOCK: Number(localStorage.getItem('maxStockRatio')) || 70,
      ETF: Number(localStorage.getItem('maxEtfRatio')) || 50,
      CRYPTO: 20, FOREX: 30, COMMODITIES: 30
    };
  });

  const [enableFomoAlert, setEnableFomoAlert] = useState(() => localStorage.getItem('enableFomoAlert') !== 'false');
  const [enableLossCooldown, setEnableLossCooldown] = useState(() => localStorage.getItem('enableLossCooldown') === 'true');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 强制走 IPv4 协议，避免连接拒绝
    fetch('http://127.0.0.1:8080/api/portfolio')
      .then(res => res.json())
      .then(data => { setPortfolio(data); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  }, []);

  // ==========================================
  // 动态数据计算引擎
  // ==========================================
  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  
  // 魔法 1：动态提取当前持仓中真正包含的资产类型 (去重)
  const activeTypes = [...new Set(portfolio.map(item => item.assetType))].filter(Boolean);
  
  let isRiskBreached = false;
  
  // 魔法 2：动态生成顶部警告文字和计算超标状态
  const statusTexts = activeTypes.map(type => {
    const typeBalance = portfolio.filter(item => item.assetType === type).reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const currentRatio = totalBalance > 0 ? ((typeBalance / totalBalance) * 100).toFixed(1) : 0;
    const limit = maxRatios[type] ?? ASSET_TYPE_CONFIG[type]?.defaultLimit ?? 100;

    if (parseFloat(currentRatio) > limit) {
      isRiskBreached = true;
    }

    const label = ASSET_TYPE_CONFIG[type]?.label || type;
    return `${label}: ${currentRatio}% (limit: ${limit}%)`;
  });

  const handleSave = () => {
    setIsSaving(true);
    // 写入本地存储新的动态配置字典
    localStorage.setItem('maxAssetRatios', JSON.stringify(maxRatios));
    
    // 兼容全局代码，保留原本的 key 以防 Dashboard 读取失败
    if (maxRatios.STOCK !== undefined) localStorage.setItem('maxStockRatio', maxRatios.STOCK);
    if (maxRatios.ETF !== undefined) localStorage.setItem('maxEtfRatio', maxRatios.ETF);
    
    localStorage.setItem('enableFomoAlert', enableFomoAlert);
    localStorage.setItem('enableLossCooldown', enableLossCooldown);
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Risk rules saved and applied globally! Check the Dashboard.');
    }, 600);
  };

  if (isLoading) return <div style={{ textAlign:'center', marginTop:'50px', color: '#64748b' }}>Scanning portfolio risk...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={32} color="#3b82f6" /> Risk Control & Behavioral Interventions</h2>
      </div>

      {/* 动态警报面板 */}
      <div style={{ backgroundColor: isRiskBreached ? '#fef2f2' : '#ecfdf5', border: `2px solid ${isRiskBreached ? '#fecaca' : '#a7f3d0'}`, borderRadius: '16px', padding: '25px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: isRiskBreached ? '#fee2e2' : '#d1fae5', borderRadius: '50%' }}>
          {isRiskBreached ? <ShieldAlert size={40} color="#ef4444" /> : <ShieldCheck size={40} color="#10b981" />}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: isRiskBreached ? '#991b1b' : '#065f46' }}>
            {activeTypes.length === 0 ? 'No holdings detected' : (isRiskBreached ? 'Warning: Some positions exceed limits!' : 'Portfolio risk status is healthy')}
          </h3>
          <p style={{ margin: 0, color: isRiskBreached ? '#b91c1c' : '#047857', fontSize: '15px' }}>
            {activeTypes.length > 0 ? statusTexts.join(' | ') : 'Add assets on the Holdings page to activate the risk engine.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 动态仓位红线设置面板 */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>Position Limits</h3>
          
          {activeTypes.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No holdings detected. No settings to configure.</div>
          ) : (
            activeTypes.map(type => {
              const config = ASSET_TYPE_CONFIG[type] || { label: type, color: '#94a3b8', defaultLimit: 100 };
              const currentLimit = maxRatios[type] ?? config.defaultLimit;

              return (
                <div key={type} style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{config.label} Max Allocation</span>
                    <span style={{ color: config.color, fontWeight: 'bold' }}>{currentLimit}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="5" 
                    value={currentLimit} 
                    onChange={e => setMaxRatios({ ...maxRatios, [type]: parseInt(e.target.value) })} 
                    style={{ width: '100%', accentColor: config.color }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* 行为金融学干预保持不变 */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>Behavioral Interventions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 'bold', marginBottom: '4px' }}>FOMO Trade Warning</div><div style={{ fontSize: '12px', color: '#64748b' }}>Require confirmation when buying on FOMO.</div></div>
              <input type="checkbox" checked={enableFomoAlert} onChange={() => setEnableFomoAlert(!enableFomoAlert)} style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}/>
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Loss Cooldown Lock</div><div style={{ fontSize: '12px', color: '#64748b' }}>Lock the system after consecutive stop-losses.</div></div>
              <input type="checkbox" checked={enableLossCooldown} onChange={() => setEnableLossCooldown(!enableLossCooldown)} style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}/>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', opacity: isSaving ? 0.7 : 1 }}>
          <Save size={20} /> {isSaving ? 'Syncing to all nodes...' : 'Save Risk Rules'}
        </button>
      </div>
    </div>
  );
};

export default Settings;