import React, { useState } from 'react';
import { Search, Globe, TrendingUp, TrendingDown, Star, BarChart2, ArrowRight } from 'lucide-react';

// --- 模拟的全市场蓝筹股数据 ---
const MOCK_MARKET_DATA = [
  { ticker: 'NVDA.US', name: 'NVIDIA Corp', price: 875.28, change: 2.45, changePct: 0.28, volume: '45.2M', marketCap: '2.18T' },
  { ticker: 'MSFT.US', name: 'Microsoft Corp', price: 420.55, change: 5.12, changePct: 1.23, volume: '22.1M', marketCap: '3.12T' },
  { ticker: 'AMZN.US', name: 'Amazon.com Inc', price: 178.15, change: -1.20, changePct: -0.67, volume: '38.5M', marketCap: '1.85T' },
  { ticker: 'GOOGL.US', name: 'Alphabet Inc', price: 155.40, change: 1.80, changePct: 1.17, volume: '25.3M', marketCap: '1.93T' },
  { ticker: 'META.US', name: 'Meta Platforms', price: 510.92, change: 12.50, changePct: 2.51, volume: '18.7M', marketCap: '1.30T' },
  { ticker: 'TSLA.US', name: 'Tesla Inc', price: 175.22, change: -4.30, changePct: -2.39, volume: '88.1M', marketCap: '558B' },
  { ticker: 'BRK.B.US', name: 'Berkshire Hathaway', price: 410.88, change: 2.15, changePct: 0.52, volume: '3.2M', marketCap: '880B' },
  { ticker: 'LLY.US', name: 'Eli Lilly and Co', price: 765.20, change: 15.40, changePct: 2.05, volume: '4.1M', marketCap: '725B' },
];

// --- 模拟的大盘指数 ---
const INDICES = [
  { name: 'S&P 500', value: '5,234.18', change: '+0.85%', isUp: true },
  { name: 'NASDAQ', value: '16,401.84', change: '+1.12%', isUp: true },
  { name: 'DOW JONES', value: '39,475.90', change: '-0.15%', isUp: false },
  { name: 'VIX (恐慌指数)', value: '13.20', change: '-4.50%', isUp: false },
];

const Market = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // 简单的本地搜索过滤
  const filteredStocks = MOCK_MARKET_DATA.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* 头部：大标题与搜索框 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={32} color="#3b82f6" /> 发现与行情 (Market Screener)
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px' }}>
            扫描全球优质资产，寻找您的下一个投资目标。
          </p>
        </div>
        
        {/* 极其精致的搜索框 */}
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="搜索股票代码或公司名称..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '25px', border: '1px solid #cbd5e1', backgroundColor: 'white', boxSizing: 'border-box', fontSize: '14px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* 模块 1：全球大盘指数看板 */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {INDICES.map((index, i) => (
          <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{index.name}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '5px' }}>{index.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold', color: index.name.includes('VIX') ? (index.isUp ? '#ef4444' : '#10b981') : (index.isUp ? '#10b981' : '#ef4444') }}>
              {index.isUp ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
              {index.change}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* 模块 2：蓝筹股精选表格 */}
      {/* ========================================== */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} color="#8b5cf6" /> 市场焦点关注 (Watchlist)
          </h3>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>*行情数据存在 15 分钟延迟</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 8px' }}>资产</th>
                <th style={{ padding: '16px 8px' }}>最新价 (USD)</th>
                <th style={{ padding: '16px 8px' }}>涨跌额</th>
                <th style={{ padding: '16px 8px' }}>涨跌幅</th>
                <th style={{ padding: '16px 8px' }}>成交量</th>
                <th style={{ padding: '16px 8px' }}>总市值</th>
                <th style={{ padding: '16px 8px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>未找到相关资产，请尝试搜索其它代码</td></tr>
              ) : filteredStocks.map((stock, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{stock.ticker}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{stock.name}</div>
                  </td>
                  <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#334155' }}>${stock.price.toFixed(2)}</td>
                  <td style={{ padding: '16px 8px', fontWeight: '500', color: stock.change >= 0 ? '#10b981' : '#ef4444' }}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ backgroundColor: stock.change >= 0 ? '#dcfce7' : '#fee2e2', color: stock.change >= 0 ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      {stock.change >= 0 ? '↑' : '↓'} {Math.abs(stock.changePct).toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#64748b', fontSize: '14px' }}>{stock.volume}</td>
                  <td style={{ padding: '16px 8px', color: '#64748b', fontSize: '14px' }}>{stock.marketCap}</td>
                  
                  {/* 操作列：引导去 Holdings 添加 */}
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <button 
                      onClick={() => alert(`请前往 "Holdings (我的持仓)" 页面点击 [➕ 记录新交易] 来买入 ${stock.ticker}。`)}
                      style={{ backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      加入自选 <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Market;