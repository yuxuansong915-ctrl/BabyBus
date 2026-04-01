import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Sliders, Bell, Save, AlertTriangle, Lock } from 'lucide-react';

const Settings = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- 风控参数状态 ---
  const [maxStockRatio, setMaxStockRatio] = useState(70); // 默认股票仓位上限 70%
  const [enableFomoAlert, setEnableFomoAlert] = useState(true);
  const [enableLossCooldown, setEnableLossCooldown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 拉取真实持仓数据以计算当前风险敞口
  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("获取持仓失败:", err);
        setIsLoading(false);
      });
  }, []);

  // --- 核心计算：当前真实仓位 ---
  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const stockBalance = portfolio
    .filter(item => item.assetType === 'STOCK')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0);
  
  const currentStockRatio = totalBalance > 0 ? ((stockBalance / totalBalance) * 100).toFixed(1) : 0;
  
  // 判断是否触发风控红线
  const isRiskBreached = parseFloat(currentStockRatio) > maxStockRatio;

  const handleSave = () => {
    setIsSaving(true);
    // 模拟保存到后端的延迟
    setTimeout(() => {
      setIsSaving(false);
      alert('✅ 风控规则已更新并生效！');
    }, 800);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b' }}>正在进行全盘风险扫描...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={32} color="#3b82f6" /> 风险控制与行为干预 (Risk & Nudges)
        </h2>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px' }}>
          投资最大的风险来源于失控的情绪。在这里设定硬性规则，让系统为您踩下刹车。
        </p>
      </div>

      {/* ========================================== */}
      {/* 模块 1：实时风控状态监控大屏 */}
      {/* ========================================== */}
      <div style={{ backgroundColor: isRiskBreached ? '#fef2f2' : '#ecfdf5', border: `2px solid ${isRiskBreached ? '#fecaca' : '#a7f3d0'}`, borderRadius: '16px', padding: '25px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}>
        <div style={{ padding: '15px', backgroundColor: isRiskBreached ? '#fee2e2' : '#d1fae5', borderRadius: '50%' }}>
          {isRiskBreached ? <ShieldAlert size={40} color="#ef4444" /> : <ShieldCheck size={40} color="#10b981" />}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: isRiskBreached ? '#991b1b' : '#065f46' }}>
            {isRiskBreached ? '⚠️ 警告：高风险资产仓位超标！' : '✅ 账户风控状态良好'}
          </h3>
          <p style={{ margin: 0, color: isRiskBreached ? '#b91c1c' : '#047857', fontSize: '15px' }}>
            当前股票资产占比为 <strong>{currentStockRatio}%</strong>。
            {isRiskBreached ? ` 已经突破了您设定的 ${maxStockRatio}% 红线，建议立即进行减仓或对冲操作！` : ` 处于您设定的 ${maxStockRatio}% 安全线以内。`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* ========================================== */}
        {/* 模块 2：资产配置红线设置 */}
        {/* ========================================== */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
            <Sliders size={20} color="#8b5cf6" /> 仓位红线设置 (Position Limits)
          </h3>
          
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#334155' }}>股票资产最大允许占比</span>
              <span style={{ fontWeight: '900', color: '#8b5cf6', fontSize: '18px' }}>{maxStockRatio}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" step="5"
              value={maxStockRatio}
              onChange={(e) => setMaxStockRatio(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#8b5cf6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#94a3b8', fontSize: '12px' }}>
              <span>保守 (0%)</span>
              <span>激进 (100%)</span>
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569', display: 'flex', gap: '10px' }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>当高风险资产（股票、期权）超过此比例时，系统将在 Dashboard 和此处发出最高级别的红色预警。</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* 模块 3：行为干预与冷切设置 */}
        {/* ========================================== */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
            <Bell size={20} color="#f59e0b" /> 行为金融学干预 (Nudges)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Toggle 1 */}
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>FOMO 交易拦截预警</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>当记录情绪为"追涨"时，强制要求阅读风险提示。</div>
              </div>
              <input 
                type="checkbox" 
                checked={enableFomoAlert} 
                onChange={() => setEnableFomoAlert(!enableFomoAlert)}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
            </label>

            {/* Toggle 2 */}
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>连续亏损强制冷切 (Cooldown)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>一周内发生3次"割肉止损"，系统将锁定加仓功能24小时。</div>
              </div>
              <input 
                type="checkbox" 
                checked={enableLossCooldown} 
                onChange={() => setEnableLossCooldown(!enableLossCooldown)}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
            </label>
          </div>
        </div>

      </div>

      {/* 底部保存按钮 */}
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isSaving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <Save size={20} />
          {isSaving ? '正在同步云端...' : '保存风控规则'}
        </button>
      </div>

    </div>
  );
};

export default Settings;