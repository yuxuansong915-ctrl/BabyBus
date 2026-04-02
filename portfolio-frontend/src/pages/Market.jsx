import React, { useState, useEffect } from 'react';
import { Search, Globe, TrendingUp, TrendingDown, BarChart2, Plus, Activity, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import AddRecordModal from '../components/AddRecordModal';
import KLineChart from '../components/KLineChart';

// --- 预定义各类别优质资产列表（Finnhub 兼容格式）---
const ASSET_LISTS = {
  // 美股：使用无后缀符号（Finnhub 格式）
  STOCK: [
    { ticker: 'AAPL', name: 'Apple Inc.', defaultType: 'STOCK' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', defaultType: 'STOCK' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', defaultType: 'STOCK' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', defaultType: 'STOCK' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', defaultType: 'STOCK' },
    { ticker: 'META', name: 'Meta Platforms', defaultType: 'STOCK' },
    { ticker: 'TSLA', name: 'Tesla Inc.', defaultType: 'STOCK' },
    { ticker: 'JPM', name: 'JPMorgan Chase', defaultType: 'STOCK' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', defaultType: 'STOCK' },
    { ticker: 'V', name: 'Visa Inc.', defaultType: 'STOCK' },
    { ticker: 'PG', name: 'Procter & Gamble', defaultType: 'STOCK' },
    { ticker: 'UNH', name: 'UnitedHealth Group', defaultType: 'STOCK' },
    { ticker: 'HD', name: 'Home Depot', defaultType: 'STOCK' },
    { ticker: 'BAC', name: 'Bank of America', defaultType: 'STOCK' },
    { ticker: 'XOM', name: 'Exxon Mobil', defaultType: 'STOCK' },
    { ticker: 'COST', name: 'Costco Wholesale', defaultType: 'STOCK' },
    { ticker: 'PFE', name: 'Pfizer Inc.', defaultType: 'STOCK' },
    { ticker: 'KO', name: 'Coca-Cola Co.', defaultType: 'STOCK' },
    { ticker: 'PEP', name: 'PepsiCo Inc.', defaultType: 'STOCK' },
    { ticker: 'NFLX', name: 'Netflix Inc.', defaultType: 'STOCK' },
    { ticker: 'DIS', name: 'Walt Disney', defaultType: 'STOCK' },
    { ticker: 'ADBE', name: 'Adobe Inc.', defaultType: 'STOCK' },
    { ticker: 'CRM', name: 'Salesforce', defaultType: 'STOCK' },
    { ticker: 'INTC', name: 'Intel Corp.', defaultType: 'STOCK' },
    { ticker: 'AMD', name: 'AMD Inc.', defaultType: 'STOCK' },
    { ticker: 'QCOM', name: 'Qualcomm', defaultType: 'STOCK' },
    { ticker: 'CSCO', name: 'Cisco Systems', defaultType: 'STOCK' },
    { ticker: 'ORCL', name: 'Oracle Corp.', defaultType: 'STOCK' },
    { ticker: 'AVGO', name: 'Broadcom Inc.', defaultType: 'STOCK' },
    { ticker: 'WMT', name: 'Walmart Inc.', defaultType: 'STOCK' },
    { ticker: 'NKE', name: 'Nike Inc.', defaultType: 'STOCK' },
    { ticker: 'SBUX', name: 'Starbucks', defaultType: 'STOCK' },
    { ticker: 'BA', name: 'Boeing Co.', defaultType: 'STOCK' },
    { ticker: 'CAT', name: 'Caterpillar', defaultType: 'STOCK' },
    { ticker: 'CVX', name: 'Chevron Corp.', defaultType: 'STOCK' },
    { ticker: 'LLY', name: 'Eli Lilly', defaultType: 'STOCK' },
    { ticker: 'MRK', name: 'Merck & Co.', defaultType: 'STOCK' },
    { ticker: 'ABBV', name: 'AbbVie Inc.', defaultType: 'STOCK' },
    { ticker: 'AMGN', name: 'Amgen Inc.', defaultType: 'STOCK' },
    { ticker: 'GILD', name: 'Gilead Sciences', defaultType: 'STOCK' },
    { ticker: 'UNP', name: 'Union Pacific', defaultType: 'STOCK' },
    { ticker: 'HON', name: 'Honeywell Intl.', defaultType: 'STOCK' },
    { ticker: 'LOW', name: "Lowe's", defaultType: 'STOCK' },
    { ticker: 'AXP', name: 'American Express', defaultType: 'STOCK' },
    { ticker: 'NOW', name: 'ServiceNow Inc.', defaultType: 'STOCK' },
    { ticker: 'INTU', name: 'Intuit Inc.', defaultType: 'STOCK' },
    { ticker: 'PANW', name: 'Palo Alto Networks', defaultType: 'STOCK' },
    { ticker: 'CRWD', name: 'CrowdStrike', defaultType: 'STOCK' },
    { ticker: 'SNOW', name: 'Snowflake Inc.', defaultType: 'STOCK' },
    { ticker: 'UBER', name: 'Uber Technologies', defaultType: 'STOCK' },
    { ticker: 'DASH', name: 'DoorDash Inc.', defaultType: 'STOCK' },
    { ticker: 'COIN', name: 'Coinbase Global', defaultType: 'STOCK' },
    { ticker: 'MU', name: 'Micron Technology', defaultType: 'STOCK' },
    { ticker: 'AMAT', name: 'Applied Materials', defaultType: 'STOCK' },
    { ticker: 'MSI', name: 'Motorola Solutions', defaultType: 'STOCK' },
    { ticker: 'RTX', name: 'RTX Corporation', defaultType: 'STOCK' },
    { ticker: 'GS', name: 'Goldman Sachs', defaultType: 'STOCK' },
    { ticker: 'MS', name: 'Morgan Stanley', defaultType: 'STOCK' },
    { ticker: 'BLK', name: 'BlackRock Inc.', defaultType: 'STOCK' },
    { ticker: 'SCHW', name: 'Charles Schwab', defaultType: 'STOCK' },
    { ticker: 'TMO', name: 'Thermo Fisher', defaultType: 'STOCK' },
    { ticker: 'SPGI', name: 'S&P Global', defaultType: 'STOCK' },
    { ticker: 'PLD', name: 'Prologis Inc.', defaultType: 'STOCK' },
    { ticker: 'EQIX', name: 'Equinix Inc.', defaultType: 'STOCK' },
    { ticker: 'AMT', name: 'American Tower', defaultType: 'STOCK' },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', defaultType: 'STOCK' },
    { ticker: 'MA', name: 'Mastercard Inc.', defaultType: 'STOCK' },
    { ticker: 'PYPL', name: 'PayPal Holdings', defaultType: 'STOCK' },
    { ticker: 'TXN', name: 'Texas Instruments', defaultType: 'STOCK' },
    { ticker: 'IBM', name: 'IBM Corp.', defaultType: 'STOCK' },
    { ticker: 'DDOG', name: 'Datadog Inc.', defaultType: 'STOCK' },
    { ticker: 'NET', name: 'Cloudflare Inc.', defaultType: 'STOCK' },
    { ticker: 'SQ', name: 'Block Inc.', defaultType: 'STOCK' },
    { ticker: 'HOOD', name: 'Robinhood Markets', defaultType: 'STOCK' },
    { ticker: 'RBLX', name: 'Roblox Corp.', defaultType: 'STOCK' },
  ],
  // Forex: 6-char currency pair codes
  FOREX: [
    { ticker: 'EURUSD', name: 'Euro / US Dollar', defaultType: 'FOREX' },
    { ticker: 'GBPUSD', name: 'British Pound / US Dollar', defaultType: 'FOREX' },
    { ticker: 'USDJPY', name: 'US Dollar / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'AUDUSD', name: 'Australian Dollar / US Dollar', defaultType: 'FOREX' },
    { ticker: 'USDCAD', name: 'US Dollar / Canadian Dollar', defaultType: 'FOREX' },
    { ticker: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', defaultType: 'FOREX' },
    { ticker: 'USDCHF', name: 'US Dollar / Swiss Franc', defaultType: 'FOREX' },
    { ticker: 'EURGBP', name: 'Euro / British Pound', defaultType: 'FOREX' },
    { ticker: 'EURJPY', name: 'Euro / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'GBPJPY', name: 'British Pound / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'EURAUD', name: 'Euro / Australian Dollar', defaultType: 'FOREX' },
    { ticker: 'EURCHF', name: 'Euro / Swiss Franc', defaultType: 'FOREX' },
    { ticker: 'USDCNH', name: 'US Dollar / CNH', defaultType: 'FOREX' },
    { ticker: 'USDHKD', name: 'US Dollar / Hong Kong Dollar', defaultType: 'FOREX' },
    { ticker: 'USDSGD', name: 'US Dollar / Singapore Dollar', defaultType: 'FOREX' },
    { ticker: 'USDKRW', name: 'US Dollar / South Korean Won', defaultType: 'FOREX' },
    { ticker: 'USDMXN', name: 'US Dollar / Mexican Peso', defaultType: 'FOREX' },
    { ticker: 'USDTRY', name: 'US Dollar / Turkish Lira', defaultType: 'FOREX' },
    { ticker: 'USDZAR', name: 'US Dollar / South African Rand', defaultType: 'FOREX' },
    { ticker: 'CADJPY', name: 'Canadian Dollar / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'CHFJPY', name: 'Swiss Franc / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'NZDJPY', name: 'New Zealand Dollar / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'SGDJPY', name: 'Singapore Dollar / Japanese Yen', defaultType: 'FOREX' },
    { ticker: 'HKDJPY', name: 'Hong Kong Dollar / Japanese Yen', defaultType: 'FOREX' },
  ],
  // Precious metals & commodities
  COMMODITIES: [
    { ticker: 'XAUUSD', name: 'Gold (XAU)', defaultType: 'COMMODITY' },
    { ticker: 'XAGUSD', name: 'Silver (XAG)', defaultType: 'COMMODITY' },
    { ticker: 'XPTUSD', name: 'Platinum (XPT)', defaultType: 'COMMODITY' },
    { ticker: 'XPDUSD', name: 'Palladium (XPD)', defaultType: 'COMMODITY' },
  ],
  // Crypto: USDT suffix
  CRYPTO: [
    { ticker: 'BTCUSDT', name: 'Bitcoin (BTC)', defaultType: 'CRYPTO' },
    { ticker: 'ETHUSDT', name: 'Ethereum (ETH)', defaultType: 'CRYPTO' },
    { ticker: 'BNBUSDT', name: 'Binance Coin (BNB)', defaultType: 'CRYPTO' },
    { ticker: 'SOLUSDT', name: 'Solana (SOL)', defaultType: 'CRYPTO' },
    { ticker: 'XRPUSDT', name: 'Ripple (XRP)', defaultType: 'CRYPTO' },
    { ticker: 'ADAUSDT', name: 'Cardano (ADA)', defaultType: 'CRYPTO' },
    { ticker: 'DOGEUSDT', name: 'Dogecoin (DOGE)', defaultType: 'CRYPTO' },
    { ticker: 'DOTUSDT', name: 'Polkadot (DOT)', defaultType: 'CRYPTO' },
    { ticker: 'AVAXUSDT', name: 'Avalanche (AVAX)', defaultType: 'CRYPTO' },
    { ticker: 'LINKUSDT', name: 'Chainlink (LINK)', defaultType: 'CRYPTO' },
    { ticker: 'MATICUSDT', name: 'Polygon (MATIC)', defaultType: 'CRYPTO' },
    { ticker: 'UNIUSDT', name: 'Uniswap (UNI)', defaultType: 'CRYPTO' },
    { ticker: 'ATOMUSDT', name: 'Cosmos (ATOM)', defaultType: 'CRYPTO' },
    { ticker: 'LTCUSDT', name: 'Litecoin (LTC)', defaultType: 'CRYPTO' },
    { ticker: 'BCHUSDT', name: 'Bitcoin Cash (BCH)', defaultType: 'CRYPTO' },
    { ticker: 'XLMUSDT', name: 'Stellar (XLM)', defaultType: 'CRYPTO' },
    { ticker: 'NEARUSDT', name: 'NEAR Protocol', defaultType: 'CRYPTO' },
    { ticker: 'APTUSDT', name: 'Aptos (APT)', defaultType: 'CRYPTO' },
    { ticker: 'ARBUSDT', name: 'Arbitrum (ARB)', defaultType: 'CRYPTO' },
    { ticker: 'OPUSDT', name: 'Optimism (OP)', defaultType: 'CRYPTO' },
    { ticker: 'INJUSDT', name: 'Injective (INJ)', defaultType: 'CRYPTO' },
    { ticker: 'FILUSDT', name: 'Filecoin (FIL)', defaultType: 'CRYPTO' },
    { ticker: 'ALGOUSDT', name: 'Algorand (ALGO)', defaultType: 'CRYPTO' },
    { ticker: 'VETUSDT', name: 'VeChain (VET)', defaultType: 'CRYPTO' },
    { ticker: 'ICPUSDT', name: 'Internet Computer (ICP)', defaultType: 'CRYPTO' },
  ],
};

// Index options (Yahoo Finance format)
const INDEX_OPTIONS = [
  { label: 'S&P 500 (SPY)', value: 'SPY' },
  { label: 'NASDAQ 100 (QQQ)', value: 'QQQ' },
  { label: 'Dow Jones (DIA)', value: 'DIA' },
  { label: 'Gold ETF (GLD)', value: 'GC=F' },
  { label: 'Bitcoin Trust (GBTC)', value: 'GBTC' },
];

const ASSET_TYPE_LABELS = {
  STOCK: 'Stocks',
  FOREX: 'Forex',
  COMMODITIES: 'Metals',
  CRYPTO: 'Crypto'
};

const ASSET_TYPE_COLORS = {
  STOCK: '#3b82f6',
  FOREX: '#10b981',
  COMMODITIES: '#f59e0b',
  CRYPTO: '#8b5cf6'
};

const PAGE_SIZE = 15;

const formatVolume = (num) => {
  if (!num || num === 0) return '—';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
};

const formatForexPrice = (price) => {
  if (!price || price === 0) return '—';
  if (price < 1) return price.toFixed(5);
  return price.toFixed(4);
};

const Market = () => {
  const [selectedIndex, setSelectedIndex] = useState('SPY');
  const [indexHistory, setIndexHistory] = useState([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [page, setPage] = useState(0);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // 加载指数历史走势（Yahoo Finance K 线）
  useEffect(() => {
    setIndexLoading(true);
    // 【核心修改】：将 localhost 改为 127.0.0.1
    fetch(`http://127.0.0.1:8080/api/portfolio/market/kline?symbol=${encodeURIComponent(selectedIndex)}&days=30`)
      .then(res => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.json();
              })
              .then(data => {
                if (Array.isArray(data)) {
                  // Yahoo Finance returns: [[close, timestamp(seconds)], ...]
                  const chartData = data.map((item) => ({
            value: item[0],
            date: new Date(item[1] * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          }));
          setIndexHistory(chartData);
        }
        setIndexLoading(false);
      })
      .catch(() => setIndexLoading(false));
  }, [selectedIndex]);

  // 加载资产列表（Finnhub 实时行情）
  useEffect(() => {
    setAssetsLoading(true);
    const list = ASSET_LISTS[assetType] || [];
    const query = searchQuery.toLowerCase();
    const filtered = list.filter(a =>
      a.ticker.toLowerCase().includes(query) || a.name.toLowerCase().includes(query)
    );
    const start = page * PAGE_SIZE;
    const pageAssets = filtered.slice(start, start + PAGE_SIZE);

    if (pageAssets.length === 0) {
      setAssets([]);
      setAssetsLoading(false);
      return;
    }

    const tickers = pageAssets.map(a => a.ticker).join(',');
    // 【核心修改】：将 localhost 改为 127.0.0.1
    fetch(`http://127.0.0.1:8080/api/portfolio/market/quotes?tickers=${encodeURIComponent(tickers)}`)
      .then(res => res.json())
      .then(data => {
        const dataMap = {};
        if (Array.isArray(data)) {
          data.forEach(item => { dataMap[item.ticker] = item; });
        }
        const merged = pageAssets.map(a => {
          const apiData = dataMap[a.ticker] || {};
          return {
            ...a,
            price: apiData.price ?? a.price,
            changePercent: apiData.changePercent ?? a.changePercent,
            volume: apiData.volume ?? a.volume,
            type: a.defaultType
          };
        });
        setAssets(merged);
        setAssetsLoading(false);
      })
      .catch(() => setAssetsLoading(false));
  }, [assetType, page, searchQuery]);

  // 当前选中的指数信息
  const selectedIndexInfo = INDEX_OPTIONS.find(i => i.value === selectedIndex);

  // 资产列表总数
  const totalAssets = (ASSET_LISTS[assetType] || []).filter(a =>
    searchQuery === '' || a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;
  const totalPages = Math.ceil(totalAssets / PAGE_SIZE);

  return (
    <div style={{ paddingBottom: '40px' }}>

      {/* 头部搜索区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <Globe size={32} color="#3b82f6" /> Market Screener
          </h2>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>
      </div>

      {/* 指数走势图 + 下拉选择器（Finnhub K线） */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <Activity size={20} color="#3b82f6" />
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={selectedIndex}
                onChange={(e) => { setSelectedIndex(e.target.value); }}
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  cursor: 'pointer',
                  paddingRight: '24px',
                  outline: 'none'
                }}
              >
                {INDEX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'normal' }}>Market Index Trend</span>
          </h3>
          {indexHistory.length > 1 && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
              <div>
                  <span style={{ color: '#64748b' }}>Now: </span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                  {selectedIndex === 'GC=F'
                    ? indexHistory[indexHistory.length - 1]?.value?.toFixed(2)
                    : `$${indexHistory[indexHistory.length - 1]?.value?.toFixed(2)}`}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>30D ago: </span>
                <span style={{ fontWeight: 'bold', color: '#64748b' }}>
                  {selectedIndex === 'GC=F'
                    ? indexHistory[0]?.value?.toFixed(2)
                    : `$${indexHistory[0]?.value?.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '250px', width: '100%' }}>
          {indexLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Loading...</div>
          ) : indexHistory.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              No data
            </div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={indexHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIdx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} minTickGap={20} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} orientation="right" />
                <RechartsTooltip
                  formatter={(value) => [
                    selectedIndex === 'GC=F' ? `$${value.toFixed(2)}` : `$${value.toFixed(2)}`,
                    selectedIndexInfo?.label?.split('(')[0] || 'Asset'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIdx)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 资产类型 Tab + 翻页控件 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(ASSET_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => { setAssetType(type); setPage(0); setSearchQuery(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                backgroundColor: assetType === type ? ASSET_TYPE_COLORS[type] : '#f1f5f9',
                color: assetType === type ? 'white' : '#64748b',
                transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 翻页控件 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 资产列表表格（Finnhub 实时行情） */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color={ASSET_TYPE_COLORS[assetType]} />
          Global Assets
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#94a3b8', marginLeft: '8px' }}>
            {ASSET_TYPE_LABELS[assetType]} · {totalAssets} assets
          </span>
        </h3>

        {assetsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading market data...</div>
            ) : assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No matching assets found</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px' }}>Ticker</th>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Price</th>
                  <th style={{ padding: '12px 8px' }}>Change</th>
                  <th style={{ padding: '12px 8px' }}>Volume</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, i) => (
                  <React.Fragment key={i}>
                    {/* 1. 给原本的行加上 onClick 和鼠标手势 */}
                    <tr 
                      style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', backgroundColor: expandedRow === asset.ticker ? '#f8fafc' : 'transparent', transition: 'background-color 0.2s' }}
                      onClick={() => setExpandedRow(expandedRow === asset.ticker ? null : asset.ticker)}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{asset.ticker}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontSize: '13px', color: '#475569' }}>{asset.name}</div>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                        {asset.price > 0 ? (
                          asset.ticker.match(/^[A-Z]{6}$/) || asset.ticker === 'XAUUSD' || asset.ticker === 'XAGUSD' || asset.ticker === 'XPTUSD' || asset.ticker === 'XPDUSD'
                            ? `$${formatForexPrice(asset.price)}`
                            : `$${asset.price.toFixed(2)}`
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {asset.changePercent !== 0 ? (
                          <span style={{ color: asset.changePercent >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {asset.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', color: '#64748b' }}>
                        {formatVolume(asset.volume)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 核心：防止点击买入按钮时触发展开行！
                            setModalPrefill({ ticker: asset.ticker, assetType: asset.defaultType || asset.type });
                            setIsModalOpen(true);
                          }}
                          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          Add 
                          {/* 自己人工手写 Made in China */}
                        </button>
                      </td>
                    </tr>
                    
                    {/* 2. 插入隐藏的 K线图行 */}
                    {expandedRow === asset.ticker && (
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <td colSpan="6" style={{ padding: '0 20px 20px 20px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                             <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>90-Day Price Chart</span>
                           </div>
                           {/* 召唤我们刚写好的专业 K线组件 */}
                           <KLineChart symbol={asset.ticker} height={280} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* 底部分页 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white',
                  cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {page + 1} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              >
                Prev
              </button>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {page + 1} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => alert('Trade saved! Go to Holdings to view your updated portfolio.')}
        prefillData={modalPrefill}
        tradeMode="ADD"
      />
    </div>
  );
};

export default Market;