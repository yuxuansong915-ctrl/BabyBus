import React, { useState } from 'react';
import { Search, Globe, TrendingUp, TrendingDown, BarChart2, Plus, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import AddRecordModal from '../components/AddRecordModal';

// --- 模拟标普500大盘近30天走势数据 ---
const SP500_TREND = [
  { date: '03-01', value: 5096 }, { date: '03-04', value: 5130 }, { date: '03-05', value: 5078 },
  { date: '03-06', value: 5104 }, { date: '03-07', value: 5157 }, { date: '03-08', value: 5123 },
  { date: '03-11', value: 5117 }, { date: '03-12', value: 5175 }, { date: '03-13', value: 5165 },
  { date: '03-14', value: 5150 }, { date: '03-15', value: 5117 }, { date: '03-18', value: 5149 },
  { date: '03-19', value: 5178 }, { date: '03-20', value: 5224 }, { date: '03-21', value: 5241 },
  { date: '03-22', value: 5234 }, { date: '03-25', value: 5218 }, { date: '03-26', value: 5203 },
  { date: '03-27', value: 5248 }, { date: '03-28', value: 5254 }, { date: '04-01', value: 5243 }
];

const MOCK_MARKET_DATA = [
  { ticker: 'NVDA.US', name: 'NVIDIA Corp', price: 875.28, change: 2.45, changePct: 0.28, volume: '45.2M', marketCap: '2.18T', type: 'STOCK' },
  { ticker: 'MSFT.US', name: 'Microsoft Corp', price: 420.55, change: 5.12, changePct: 1.23, volume: '22.1M', marketCap: '3.12T', type: 'STOCK' },
  { ticker: 'AMZN.US', name: 'Amazon.com Inc', price: 178.15, change: -1.20, changePct: -0.67, volume: '38.5M', marketCap: '1.85T', type: 'STOCK' },
  { ticker: 'SPY.US', name: 'SPDR S&P 500 ETF', price: 520.10, change: 4.20, changePct: 0.81, volume: '60.5M', marketCap: '500B', type: 'ETF' },
  { ticker: 'BTC-USD.CC', name: 'Bitcoin (Crypto)', price: 69420.00, change: 1200.50, changePct: 1.75, volume: '32.1B', marketCap: '1.36T', type: 'CRYPTO' }
];

const INDICES = [
  { name: 'S&P 500', value: '5,243.18', change: '+0.85%', isUp: true },
  { name: 'NASDAQ', value: '16,401.84', change: '+1.12%', isUp: true },
  { name: 'DOW JONES', value: '39,475.90', change: '-0.15%', isUp: false },
  { name: 'VIX (恐慌指数)', value: '13.20', change: '-4.50%', isUp: false }
];

const Market = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState(null);

  const filteredStocks = MOCK_MARKET_DATA.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* 头部搜索区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <Globe size={32} color="#3b82f6" /> 发现与行情 (Market Screener)
          </h2>
        </div>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
          <input type="text" placeholder="搜索资产..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none' }} />
        </div>
      </div>

      {/* ========================================== */}
      {/* 新增：大盘走势图 (S&P 500 Trend) */}
      {/* ========================================== */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
          <Activity size={20} color="#3b82f6" /> 标普 500 指数走势 (S&P 500 Index)
        </h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={SP500_TREND} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSp500" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} minTickGap={20} />
              {/* Y轴放在右侧，更符合金融软件习惯，并动态计算上下限 */}
              <YAxis domain={['dataMin - 50', 'dataMax + 50']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} orientation="right" />
              <RechartsTooltip 
                formatter={(value) => [value.toLocaleString(), '指数点位']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSp500)" isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 指数看板 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {INDICES.map((index, i) => (
          <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{index.name}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>{index.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold', color: index.name.includes('VIX') ? (index.isUp ? '#ef4444' : '#10b981') : (index.isUp ? '#10b981' : '#ef4444') }}>
              {index.isUp ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {index.change}
            </div>
          </div>
        ))}
      </div>

      {/* 蓝筹股列表 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#8b5cf6" /> 全球资产直达
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ color: '#64748b', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '16px 8px' }}>资产</th><th style={{ padding: '16px 8px' }}>最新价</th><th style={{ padding: '16px 8px' }}>涨跌幅</th><th style={{ padding: '16px 8px', textAlign: 'right' }}>操作</th></tr></thead>
          <tbody>
            {filteredStocks.map((stock, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '16px 8px' }}><div style={{ fontWeight: 'bold' }}>{stock.ticker}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{stock.name}</div></td>
                <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>${stock.price.toFixed(2)}</td>
                <td style={{ padding: '16px 8px' }}><span style={{ backgroundColor: stock.change >= 0 ? '#dcfce7' : '#fee2e2', color: stock.change >= 0 ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>{stock.change >= 0 ? '↑' : '↓'} {Math.abs(stock.changePct).toFixed(2)}%</span></td>
                <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                  <button onClick={() => { setModalPrefill({ ticker: stock.ticker, assetType: stock.type }); setIsModalOpen(true); }} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> 快捷买入
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddRecordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => alert('买入成功！去 Holdings 页面查看最新持仓吧。')} prefillData={modalPrefill} tradeMode="ADD" />
    </div>
  );
};

export default Market;