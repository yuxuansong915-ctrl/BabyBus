import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Info, Activity, Briefcase } from 'lucide-react';
import AddRecordModal from '../components/AddRecordModal';
import KLineChart from '../components/KLineChart';

// --- Mini sparkline component ---
const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return <span style={{color: '#94a3b8', fontSize: '12px'}}>No data</span>;
  const chartData = data.map((price, i) => ({ index: i, price }));
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <div style={{ width: '100px', height: '40px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['auto', 'auto']} hide />
          <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Holdings = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [tradeMode, setTradeMode] = useState('ADD');

  const fetchData = () => {
    setIsLoading(true);
    fetch('http://127.0.0.1:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setIsLoading(false);

        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }

        if (selectedAsset && !data.find(item => item.id === selectedAsset.id)) {
           setSelectedAsset(null);
        }
      })
      .catch(err => {
        console.error('Failed to fetch holdings:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', gap: '30px', height: 'calc(100vh - 150px)' }}>

      <div style={{ flex: '2', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={24} color="#3b82f6" /> My Portfolio
          </h2>
          <button
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setModalPrefill(null);
              setTradeMode('ADD');
              setIsModalOpen(true);
            }}
          >
            New Trade
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: '1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0', fontSize: '14px' }}>
                <th style={{ padding: '16px 8px' }}>Ticker</th>
                <th style={{ padding: '16px 8px' }}>Shares</th>
                <th style={{ padding: '16px 8px' }}>Price</th>
                <th style={{ padding: '16px 8px' }}>30-Day Trend</th>
                <th style={{ padding: '16px 8px' }}>Total Value</th>
                <th style={{ padding: '16px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Syncing real-time data from Wall Street...</td></tr>
              ) : portfolio.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedAsset(item)}
                  style={{
                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: selectedAsset?.id === item.id ? '#eff6ff' : 'transparent'
                  }}
                >
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>{item.ticker}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'inline-block', padding: '2px 6px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>{item.assetType}</div>
                  </td>
                  <td style={{ padding: '16px 8px', fontWeight: '500' }}>{item.shares}</td>
                  <td style={{ padding: '16px 8px', fontWeight: '500' }}>${item.currentPrice?.toFixed(2)}</td>
                  <td style={{ padding: '16px 8px' }}><Sparkline data={item.priceTrend} /></td>
                  <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#0f172a' }}>${item.totalValue?.toFixed(2)}</td>

                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPrefill({ ticker: item.ticker, assetType: item.assetType });
                          setTradeMode('ADD');
                          setIsModalOpen(true);
                        }}
                        style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Add
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPrefill({ ticker: item.ticker, assetType: item.assetType });
                          setTradeMode('SELL');
                          setIsModalOpen(true);
                        }}
                        style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ flex: '1', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflowY: 'auto' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#8b5cf6" /> Deep Dive
        </h2>

        {!selectedAsset ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>
            <Info size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>Click an asset on the left<br/>to view fundamentals</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#0f172a' }}>{selectedAsset.ticker}</h3>
              <span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                {selectedAsset.assetType === 'ETF' ? 'ETF' : 'Stock'}
              </span>
            </div>

            <div style={{ marginBottom: '25px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#fcfcfc' }}>
               <KLineChart symbol={selectedAsset.ticker} height={220} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Current Price</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  ${selectedAsset.currentPrice ? selectedAsset.currentPrice.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Shares</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>{selectedAsset.shares}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Total Value</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  ${selectedAsset.totalValue ? selectedAsset.totalValue.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Market Cap</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  {selectedAsset.marketCap
                    ? selectedAsset.marketCap >= 1e12
                      ? `$${(selectedAsset.marketCap / 1e12).toFixed(2)}T`
                      : selectedAsset.marketCap >= 1e9
                        ? `$${(selectedAsset.marketCap / 1e9).toFixed(2)}B`
                        : `$${(selectedAsset.marketCap / 1e6).toFixed(2)}M`
                    : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>P/E Ratio</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  {selectedAsset.peRatio ? selectedAsset.peRatio.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>52W High</div>
                <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>
                  {selectedAsset.fiftyTwoWeekHigh ? `$${selectedAsset.fiftyTwoWeekHigh.toFixed(2)}` : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>52W Low</div>
                <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '18px' }}>
                  {selectedAsset.fiftyTwoWeekLow ? `$${selectedAsset.fiftyTwoWeekLow.toFixed(2)}` : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Dividend Yield</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  {selectedAsset.dividendYield ? `${selectedAsset.dividendYield.toFixed(2)}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalPrefill(null);
        }}
        onSuccess={fetchData}
        prefillData={modalPrefill}
        tradeMode={tradeMode}
      />

    </div>
  );
};

export default Holdings;
