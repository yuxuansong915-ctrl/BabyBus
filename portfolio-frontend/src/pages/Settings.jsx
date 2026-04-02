import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Sliders, Bell, Save, AlertTriangle, Lock } from 'lucide-react';

const Settings = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 从 localStorage 读取配置，如果没有则使用默认值
  const [maxStockRatio, setMaxStockRatio] = useState(() => Number(localStorage.getItem('maxStockRatio')) || 70);
  const [maxEtfRatio, setMaxEtfRatio] = useState(() => Number(localStorage.getItem('maxEtfRatio')) || 50); // 新增 ETF 限制
  const [enableFomoAlert, setEnableFomoAlert] = useState(() => localStorage.getItem('enableFomoAlert') !== 'false');
  const [enableLossCooldown, setEnableLossCooldown] = useState(() => localStorage.getItem('enableLossCooldown') === 'true');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio')
      .then(res => res.json())
      .then(data => { setPortfolio(data); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  }, []);

  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const stockBalance = portfolio.filter(item => item.assetType === 'STOCK').reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const etfBalance = portfolio.filter(item => item.assetType === 'ETF').reduce((sum, item) => sum + (item.totalValue || 0), 0);
  
  const currentStockRatio = totalBalance > 0 ? ((stockBalance / totalBalance) * 100).toFixed(1) : 0;
  const currentEtfRatio = totalBalance > 0 ? ((etfBalance / totalBalance) * 100).toFixed(1) : 0;
  
  const isStockBreached = parseFloat(currentStockRatio) > maxStockRatio;
  const isEtfBreached = parseFloat(currentEtfRatio) > maxEtfRatio;
  const isRiskBreached = isStockBreached || isEtfBreached;

  const handleSave = () => {
    setIsSaving(true);
    // 写入本地存储，供全局读取
    localStorage.setItem('maxStockRatio', maxStockRatio);
    localStorage.setItem('maxEtfRatio', maxEtfRatio);
    localStorage.setItem('enableFomoAlert', enableFomoAlert);
    localStorage.setItem('enableLossCooldown', enableLossCooldown);
    
    setTimeout(() => {
      setIsSaving(false);
      alert('✅ 风控规则已全网同步并生效！去 Dashboard 看看图表的变化吧！');
    }, 600);
  };

  if (isLoading) return <div style={{ textAlign:'center', marginTop:'50px' }}>正在扫描风险...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={32} color="#3b82f6" /> 风险控制与行为干预</h2>
      </div>

      <div style={{ backgroundColor: isRiskBreached ? '#fef2f2' : '#ecfdf5', border: `2px solid ${isRiskBreached ? '#fecaca' : '#a7f3d0'}`, borderRadius: '16px', padding: '25px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: isRiskBreached ? '#fee2e2' : '#d1fae5', borderRadius: '50%' }}>
          {isRiskBreached ? <ShieldAlert size={40} color="#ef4444" /> : <ShieldCheck size={40} color="#10b981" />}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: isRiskBreached ? '#991b1b' : '#065f46' }}>{isRiskBreached ? '⚠️ 警告：仓位超标！' : '✅ 账户风控状态良好'}</h3>
          <p style={{ margin: 0, color: isRiskBreached ? '#b91c1c' : '#047857', fontSize: '15px' }}>
            股票占比: {currentStockRatio}% (红线: {maxStockRatio}%) | 基金占比: {currentEtfRatio}% (红线: {maxEtfRatio}%)
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>仓位红线设置</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontWeight:'bold'}}>股票最高占比</span><span style={{color:'#8b5cf6', fontWeight:'bold'}}>{maxStockRatio}%</span></div>
            <input type="range" min="0" max="100" step="5" value={maxStockRatio} onChange={e => setMaxStockRatio(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6' }}/>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontWeight:'bold'}}>基金最高占比</span><span style={{color:'#10b981', fontWeight:'bold'}}>{maxEtfRatio}%</span></div>
            <input type="range" min="0" max="100" step="5" value={maxEtfRatio} onChange={e => setMaxEtfRatio(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }}/>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>行为金融学干预</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 'bold', marginBottom: '4px' }}>FOMO 交易拦截预警</div><div style={{ fontSize: '12px', color: '#64748b' }}>追涨时强行弹窗要求二次确认。</div></div>
              <input type="checkbox" checked={enableFomoAlert} onChange={() => setEnableFomoAlert(!enableFomoAlert)} style={{ width: '18px', height: '18px' }}/>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Save size={20} /> {isSaving ? '正在同步...' : '保存风控规则'}
        </button>
      </div>
    </div>
  );
};

export default Settings;