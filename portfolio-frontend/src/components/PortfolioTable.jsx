import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- Mini sparkline chart ---
const Sparkline = ({ priceData }) => {
  if (!priceData || priceData.length === 0) return <span style={{ color: '#999', fontSize: '12px' }}>No trend</span>;

  const chartData = priceData.map((price, index) => ({ index, price }));

  return (
    <div style={{ width: '100px', height: '35px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['auto', 'auto']} hide />
          <Line type="monotone" dataKey="price" stroke="#2980b9" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Main portfolio table ---
const PortfolioTable = ({ data, refreshData }) => {

  const handleSell = (id, ticker) => {
    if (window.confirm(`Are you sure you want to liquidate [${ticker}]? This action is irreversible!`)) {
      fetch(`http://localhost:8080/api/portfolio/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            refreshData();
          } else {
            alert('Trade failed. Check backend status.');
          }
        })
        .catch(err => console.error('Delete request failed:', err));
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>Portfolio Holdings</h2>

      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px 0' }}>No holdings. Buy assets above.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', color: '#34495e' }}>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>Ticker</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>Shares</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>Price</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>Trend</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6' }}>Total Value</th>
              <th style={{ padding: '15px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ecf0f1', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px' }}>{item.ticker}</td>
                <td style={{ padding: '15px' }}>{item.shares}</td>
                <td style={{ padding: '15px' }}>${item.currentPrice?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: '10px 15px' }}>
                  <Sparkline priceData={item.priceTrend} />
                </td>
                <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold', fontSize: '16px' }}>
                  ${item.totalValue?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleSell(item.id, item.ticker)}
                    style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PortfolioTable;
