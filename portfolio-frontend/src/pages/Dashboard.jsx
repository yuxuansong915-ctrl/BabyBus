import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, Trophy } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

// Generate trading dates (skip weekends)
const generateTradingDates = (daysCount) => {
  let dates = [];
  let currentDate = new Date();
  while (dates.length < daysCount) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.unshift(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return dates;
};

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M');

  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch overview:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b' }}>Aggregating asset data...</div>;
  }

  // Calculate top performers
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
  .sort((a, b) => b.changePct - a.changePct)
  .slice(0, 5);

  // Asset allocation donut chart data
  const allocationMap = {};
  portfolio.forEach(item => {
    const type = item.assetType || 'OTHER';
    allocationMap[type] = (allocationMap[type] || 0) + (item.totalValue || 0);
  });

  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  const maxStockRatio = Number(localStorage.getItem('maxStockRatio')) || 70;
  const currentStockRatio = totalBalance > 0 ? (allocationMap['STOCK'] || 0) / totalBalance * 100 : 0;
  const isStockBreached = currentStockRatio > maxStockRatio;

  const ASSET_LABELS = {
    STOCK: 'Stocks',
    ETF: 'Funds / ETFs',
    CRYPTO: 'Crypto',
    FOREX: 'Forex',
    COMMODITIES: 'Metals / Cmdt'
  };

  const allocationData = Object.keys(allocationMap).map(key => ({
    name: ASSET_LABELS[key] || key,
    value: allocationMap[key],
    fillColor: (key === 'STOCK' && isStockBreached) ? '#ef4444' : undefined
  })).filter(item => item.value > 0);

  // Portfolio trend data
  let pointsNeeded = 22;
  if (timeRange === '1W') pointsNeeded = 5;
  if (timeRange === '1Y') pointsNeeded = 252;
  if (timeRange === '3Y') pointsNeeded = 756;
  if (timeRange === 'ALL') pointsNeeded = 99999;

  let aggregatedTrend = [];
  const maxHistory = portfolio.length > 0 && portfolio[0].priceTrend ? portfolio[0].priceTrend.length : 0;
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

      <div style={{ flex: '2', backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={24} color="#f59e0b" /> Top Performers
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0', fontSize: '14px' }}>
              <th style={{ padding: '16px 8px' }}>Ticker</th>
              <th style={{ padding: '16px 8px' }}>Market Value</th>
              <th style={{ padding: '16px 8px' }}>Daily Change</th>
              <th style={{ padding: '16px 8px' }}>Daily %</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No assets yet</td></tr>
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

      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={18} color="#8b5cf6"/> Asset Allocation
          </h3>

          {isStockBreached && (
             <div style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center'}}>
               Stock allocation ({currentStockRatio.toFixed(1)}%) exceeds risk limit ({maxStockRatio}%)!
             </div>
          )}

          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fillColor || PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Value']} />
                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={18} color="#3b82f6"/> Portfolio Net Worth
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: periodPnL >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
              {periodPnL >= 0 ? '+' : ''}${periodPnL.toFixed(2)} ({periodPnLPercent.toFixed(2)}%) <span style={{color: '#94a3b8', fontWeight: 'normal'}}> period return</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <TimeButton label="1W" value="1W" />
            <TimeButton label="1M" value="1M" />
            <TimeButton label="1Y" value="1Y" />
            <TimeButton label="3Y" value="3Y" />
          </div>

          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={aggregatedTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} minTickGap={30} />
                <RechartsTooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Net Worth']}
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
