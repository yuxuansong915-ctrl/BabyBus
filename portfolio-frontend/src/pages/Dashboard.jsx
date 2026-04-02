/*
  资产概览仪表盘组件 Dashboard
  从后端获取持仓数据，展示今日领涨资产排名、资产配置环形图、总资产净值走势；
  支持时间范围切换、涨跌颜色区分、股票仓位风控预警，整体呈现专业的投资组合可视化效果
*/

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, Trophy } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

// 辅助函数：根据天数生成过去的真实日期 (跳过周末，模拟交易日)
const generateTradingDates = (daysCount) => {
  let dates = [];
  let currentDate = new Date();
  while (dates.length < daysCount) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0是周日，6是周六
      dates.unshift(currentDate.toISOString().split('T')[0]); // 放入数组开头
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return dates;
};

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M'); // 默认选中 1个月

  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("获取概览数据失败:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b' }}>正在聚合资产数据...</div>;
  }

  // ==========================================
  // 1. 左侧：计算今日领涨 Top 5 (Best Performers)
  // ==========================================
  const topPerformers = portfolio.map(item => {
    const prices = item.priceTrend || [];
    let changePct = 0;
    let changeAmt = 0;
    if (prices.length >= 2) {
      const today = prices[prices.length - 1];
      const yesterday = prices[prices.length - 2];
      changePct = ((today - yesterday) / yesterday) * 100;
      changeAmt = (today - yesterday) * item.shares;
    }
    return { ...item, changePct, changeAmt };
  })
  .sort((a, b) => b.changePct - a.changePct) // 按涨幅降序
  .slice(0, 5); // 只取前 5 名

// ==========================================
  // 2. 右侧上方：计算环形图数据 (Donut Chart) 
  // ==========================================
  const allocationMap = {};
  portfolio.forEach(item => {
    const type = item.assetType || 'OTHER';
    allocationMap[type] = (allocationMap[type] || 0) + (item.totalValue || 0);
  });

  // 👇 修复报错：在这里补上 totalBalance 的计算
  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  // --- 读取红线风控参数 ---
  const maxStockRatio = Number(localStorage.getItem('maxStockRatio')) || 70;
  const currentStockRatio = totalBalance > 0 ? (allocationMap['STOCK'] || 0) / totalBalance * 100 : 0;
  const isStockBreached = currentStockRatio > maxStockRatio;

  // 构造资产占比饼图数据，如果违规，将股票切片的颜色标记出来
  const allocationData = Object.keys(allocationMap).map(key => ({
    name: key === 'STOCK' ? '股票' : key === 'ETF' ? '基金' : key,
    value: allocationMap[key],
    fillColor: (key === 'STOCK' && isStockBreached) ? '#ef4444' : undefined 
  })).filter(item => item.value > 0);

  // ==========================================
  // 3. 右侧下方：计算总资产走势 & 时间筛选逻辑
  // ==========================================
  // 确定需要截取的数据点数量 (假设 1周=5交易日, 1月=22交易日, 1年=252交易日, 3年=756)
  let pointsNeeded = 22; 
  if (timeRange === '1W') pointsNeeded = 5;
  if (timeRange === '1Y') pointsNeeded = 252;
  if (timeRange === '3Y') pointsNeeded = 756;
  if (timeRange === 'ALL') pointsNeeded = 99999;

  // 聚合所有资产每天的总值
  let aggregatedTrend = [];
  const maxHistory = portfolio.length > 0 && portfolio[0].priceTrend ? portfolio[0].priceTrend.length : 0;
  
  // 为了防止页面卡死，限制最大处理天数
  const actualPoints = Math.min(pointsNeeded, maxHistory);
  const startIndex = Math.max(0, maxHistory - actualPoints);

  const dates = generateTradingDates(maxHistory - startIndex);

  for (let i = startIndex; i < maxHistory; i++) {
    let dailyTotal = 0;
    portfolio.forEach(item => {
      if (item.priceTrend && item.priceTrend[i]) {
        dailyTotal += item.priceTrend[i] * item.shares;
      }
    });
    aggregatedTrend.push({ 
      date: dates[i - startIndex] || `Day ${i}`, 
      balance: dailyTotal 
    });
  }

  // 动态计算基于所选时间范围的总收益
  let periodPnL = 0;
  let periodPnLPercent = 0;
  let currentBalance = 0;
  
  if (aggregatedTrend.length > 0) {
    currentBalance = aggregatedTrend[aggregatedTrend.length - 1].balance;
    const startBalance = aggregatedTrend[0].balance;
    if (startBalance > 0) {
      periodPnL = currentBalance - startBalance;
      periodPnLPercent = (periodPnL / startBalance) * 100;
    }
  }

  // 渲染时间选择按钮组件
  const TimeButton = ({ label, value }) => (
    <button 
      onClick={() => setTimeRange(value)}
      style={{
        padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer',
        backgroundColor: timeRange === value ? '#2563eb' : '#f1f5f9',
        color: timeRange === value ? 'white' : '#64748b',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      {/* ========================================== */}
      {/* 左侧区域 (2/3宽)：今日领涨 Top 5 */}
      {/* ========================================== */}
      <div style={{ flex: '2', backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={24} color="#f59e0b" /> 今日领涨资产 (Top Performers)
        </h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0', fontSize: '14px' }}>
              <th style={{ padding: '16px 8px' }}>资产代码</th>
              <th style={{ padding: '16px 8px' }}>当前市值</th>
              <th style={{ padding: '16px 8px' }}>今日涨跌额</th>
              <th style={{ padding: '16px 8px' }}>今日涨跌幅</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>暂无资产数据</td></tr>
            ) : topPerformers.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#0f172a' }}>{item.ticker}</td>
                <td style={{ padding: '16px 8px', color: '#334155' }}>${item.totalValue?.toFixed(2)}</td>
                <td style={{ padding: '16px 8px', fontWeight: 'bold', color: item.changeAmt >= 0 ? '#10b981' : '#ef4444' }}>
                  {item.changeAmt >= 0 ? '+' : ''}${item.changeAmt.toFixed(2)}
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span style={{ backgroundColor: item.changePct >= 0 ? '#dcfce7' : '#fee2e2', color: item.changePct >= 0 ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    {item.changePct >= 0 ? '↑' : '↓'} {Math.abs(item.changePct).toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* 右侧区域 (1/3宽)：环形图 + 核心走势 */}
      {/* ========================================== */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 上方：资产配置环形图 */}
        {/* <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={18} color="#8b5cf6"/> 资产配置结构
          </h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, '价值']} />
                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        {/* 在右侧上方环形图容器内，加上风控提示条 */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={18} color="#8b5cf6"/> 资产配置结构
          </h3>
          
          {/* 🚨 越界警报条 */}
          {isStockBreached && (
             <div style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center'}}>
               ⚠️ 股票仓位 ({currentStockRatio.toFixed(1)}%) 已超标风控红线 ({maxStockRatio}%)!
             </div>
          )}

          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {/* 使用刚刚算好的 fillColor，如果没有就按正常顺序取色 */}
                  {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fillColor || PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, '价值']} />
                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 下方：总资产走势与详情 */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={18} color="#3b82f6"/> 组合净值走势
          </h3>
          
          {/* 动态核心数据 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: periodPnL >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
              {periodPnL >= 0 ? '+' : ''}${periodPnL.toFixed(2)} ({periodPnLPercent.toFixed(2)}%) <span style={{color: '#94a3b8', fontWeight: 'normal'}}>区间收益</span>
            </div>
          </div>

          {/* 时间选择器 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <TimeButton label="1周" value="1W" />
            <TimeButton label="1月" value="1M" />
            <TimeButton label="1年" value="1Y" />
            <TimeButton label="3年" value="3Y" />
          </div>

          {/* 折线图 (X轴已换为日期) */}
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={aggregatedTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                {/* X 轴现在显示真实日期，且通过 minTickGap 防止拥挤 */}
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} minTickGap={30} />
                <RechartsTooltip 
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value) => [`$${value.toFixed(2)}`, '总净值']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;