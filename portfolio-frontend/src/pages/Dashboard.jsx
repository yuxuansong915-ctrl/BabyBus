import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, Trophy, Sparkles, Bot, ArrowDownRight } from 'lucide-react';
import KLineChart from '../components/KLineChart';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

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

// 🎯 XIRR 计算引擎
const calculateXIRR = (cashFlows) => {
  if (!cashFlows || cashFlows.length < 2) return null;
  cashFlows.sort((a, b) => a.date - b.date);

  const hasPositive = cashFlows.some(cf => cf.amount > 0);
  const hasNegative = cashFlows.some(cf => cf.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  const xnpv = (rate) => {
    return cashFlows.reduce((sum, cf) => {
      const t = (cf.date - cashFlows[0].date) / (1000 * 60 * 60 * 24 * 365.25);
      return sum + cf.amount / Math.pow(1 + rate, t);
    }, 0);
  };

  const xnpvDerivative = (rate) => {
    return cashFlows.reduce((sum, cf) => {
      const t = (cf.date - cashFlows[0].date) / (1000 * 60 * 60 * 24 * 365.25);
      return sum - (t * cf.amount) / Math.pow(1 + rate, t + 1);
    }, 0);
  };

  let rate = 0.1; 
  for (let i = 0; i < 100; i++) {
    const npv = xnpv(rate);
    const dNpv = xnpvDerivative(rate);
    if (Math.abs(dNpv) < 1e-10) return null; 
    const nextRate = rate - npv / dNpv;
    if (Math.abs(nextRate - rate) < 1e-6) return nextRate;
    rate = nextRate;
  }
  return null; 
};

// 🎯 原生轻量级 Markdown 渲染器
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    // 渲染标题
    if (line.trim().startsWith('### ')) {
      return <h4 key={index} style={{ color: '#0f172a', fontSize: '18px', marginTop: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>{line.replace('### ', '')}</h4>;
    }
    // 渲染无序列表
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      let content = line.trim().substring(2);
      const parts = content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
        return part;
      });
      return <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: '#334155', lineHeight: '1.6' }}><span style={{color: '#8b5cf6'}}>•</span> <div>{parts}</div></div>;
    }
    // 渲染常规段落与加粗
    if (line.trim() !== '') {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
        return part;
      });
      return <p key={index} style={{ marginBottom: '10px', color: '#334155', lineHeight: '1.6' }}>{parts}</p>;
    }
    return null;
  });
};

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [ledger, setLedger] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M');
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 🎯 AI 专属状态
  const [aiReport, setAiReport] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:8080/api/portfolio').then(res => res.json()),
      fetch('http://127.0.0.1:8080/api/portfolio/ledger').then(res => res.json())
    ])
    .then(([portfolioData, ledgerData]) => {
      setPortfolio(portfolioData);
      setLedger(ledgerData);
      setIsLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch dashboard data:", err);
      setIsLoading(false);
    });
  }, []);

  // 🎯 AI 报告拉取函数
  const fetchAIAnalysis = () => {
    setIsAiLoading(true);
    fetch('http://127.0.0.1:8080/api/portfolio/ai/analyze')
      .then(res => res.json())
      .then(data => {
        setAiReport(data.report);
        setIsAiLoading(false);
      })
      .catch(err => {
        console.error(err);
        setAiReport("### ❌ Error\nFailed to reach the AI Agent. Please check your backend connection or API Key.");
        setIsAiLoading(false);
      });
  };

  const totalBalance = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  const calculatedXirr = useMemo(() => {
    if (ledger.length === 0) return 'NO_DATA';
    const cashFlows = ledger.map(tx => {
      const cost = tx.totalCost || (tx.price * tx.shares) || 0;
      return {
        amount: tx.actionType === 'ADD' ? -cost : cost,
        date: new Date(tx.timestamp)
      };
    }).filter(cf => cf.amount !== 0);

    if (totalBalance > 0) {
      cashFlows.push({ amount: totalBalance, date: new Date() });
    }

    if (cashFlows.length > 1) {
      const timeDiffHours = (cashFlows[cashFlows.length - 1].date - cashFlows[0].date) / (1000 * 60 * 60);
      if (timeDiffHours < 24) return 'SAME_DAY';
    }

    return calculateXIRR(cashFlows);
  }, [ledger, totalBalance]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#64748b' }}>Loading portfolio engine...</div>;
  }

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

  const allocationMap = {};
  portfolio.forEach(item => {
    const type = item.assetType || 'OTHER';
    allocationMap[type] = (allocationMap[type] || 0) + (item.totalValue || 0);
  });

  const maxStockRatio = Number(localStorage.getItem('maxStockRatio')) || 70;
  const currentStockRatio = totalBalance > 0 ? (allocationMap['STOCK'] || 0) / totalBalance * 100 : 0;
  const isStockBreached = currentStockRatio > maxStockRatio;

  const ASSET_LABELS = { STOCK: 'Stocks', ETF: 'Funds / ETFs', CRYPTO: 'Crypto', FOREX: 'Forex', COMMODITIES: 'Metals / Cmdt' };

  const allocationData = Object.keys(allocationMap).map(key => ({
    name: ASSET_LABELS[key] || key,
    value: allocationMap[key],
    fillColor: (key === 'STOCK' && isStockBreached) ? '#ef4444' : undefined
  })).filter(item => item.value > 0);

  let pointsNeeded = 22;
  if (timeRange === '1W') pointsNeeded = 5;
  if (timeRange === '1M') pointsNeeded = 22;
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
    aggregatedTrend.push({ date: dates[i - startIndex] || `Day ${i}`, balance: dailyTotal });
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
      style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: timeRange === value ? '#2563eb' : '#f1f5f9', color: timeRange === value ? 'white' : '#64748b', transition: 'all 0.2s' }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 🤖 AI 首席投资官 横幅面板 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
        {/* 背景装饰光晕 */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={26} color="#8b5cf6" /> AI Chief Investment Officer
            </h2>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Powered by DeepSeek. Get institutional-grade portfolio risk analysis and actionable strategies.
            </p>
          </div>
          
          <button 
            onClick={fetchAIAnalysis} 
            disabled={isAiLoading}
            style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: isAiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', opacity: isAiLoading ? 0.7 : 1, boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)' }}
          >
            {isAiLoading ? <><Activity size={18} /> Analyzing Data...</> : <><Bot size={20} /> Generate Insights</>}
          </button>
        </div>

        {/* AI 报告渲染区 */}
        {aiReport && (
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0', animation: 'fadeIn 0.5s ease-in-out' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '20px 25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {renderMarkdown(aiReport)}
            </div>
            {/* 🎯 新增的跳转按钮：携带报告数据，飞往专属对话室 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button 
                onClick={() => navigate('/ai-chat', { state: { initialReport: aiReport } })}
                style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                Continue Discussion <ArrowDownRight size={18} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 原有的图表布局 */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* 左侧区域：今日领涨 */}
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
                <React.Fragment key={item.ticker}>
                  <tr 
                    onClick={() => setExpandedRow(expandedRow === item.ticker ? null : item.ticker)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: expandedRow === item.ticker ? '#f8fafc' : 'transparent', transition: 'background-color 0.2s' }}
                  >
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
                  {expandedRow === item.ticker && (
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <td colSpan="4" style={{ padding: '0 20px 20px 20px' }}>
                        <div style={{ marginTop: '10px', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>90-Day Candlestick Chart</div>
                        <KLineChart symbol={item.ticker} height={250} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 右侧区域：资产分布 & 核心走势 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={18} color="#8b5cf6"/> Asset Allocation</h3>
            {isStockBreached && (
              <div style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center'}}>
                Stock allocation ({currentStockRatio.toFixed(1)}%) exceeds limit ({maxStockRatio}%)!
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
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Wallet size={18} color="#3b82f6"/> Portfolio Net Worth</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}>
                  ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: periodPnL >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                  {periodPnL >= 0 ? '+' : ''}${periodPnL.toFixed(2)} ({periodPnLPercent.toFixed(2)}%) <span style={{color: '#94a3b8', fontWeight: 'normal'}}> period return</span>
                </div>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', textAlign: 'right', minWidth: '90px' }}>
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Annualized XIRR</div>
                <div style={{ fontSize: '18px', color: '#166534', fontWeight: '900' }}>
                  {calculatedXirr === 'NO_DATA' ? 'N/A' : calculatedXirr === 'SAME_DAY' ? '< 1 Day' : calculatedXirr === null ? 'TBD' : calculatedXirr > 5 ? '>500%' : (calculatedXirr * 100).toFixed(2) + '%'}
                </div>
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
                  <RechartsTooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value) => [`$${value.toFixed(2)}`, 'Net Worth']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }}/>
                  <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;