import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// Custom SVG candlestick shape
// ==========================================
const CustomCandlestick = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;

  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444';

  const diff = Math.abs(close - open);
  const ratio = diff === 0 ? 0 : height / diff;

  const yTop = y - (high - Math.max(open, close)) * ratio;
  const yBottom = y + height + (Math.min(open, close) - low) * ratio;

  return (
    <g stroke={color} fill={color} strokeWidth="2">
      <path d={`M ${x + width / 2}, ${yTop} L ${x + width / 2}, ${yBottom}`} />
      <rect x={x} y={y} width={width} height={Math.max(height, 1)} />
    </g>
  );
};

const KLineChart = ({ symbol, height = 300 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8080/api/portfolio/market/candlestick?symbol=${encodeURIComponent(symbol)}&days=90`)
      .then(res => res.json())
      .then(resData => {
        if (Array.isArray(resData)) {
          const formatted = resData.map(item => ({
            date: new Date(item[0] * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            openClose: [item[1], item[4]],
            volume: item[5]
          }));
          setData(formatted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Syncing candlestick data from Wall Street...</div>;
  if (data.length === 0) return <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No chart data available</div>;

  const minLow = Math.min(...data.map(d => d.low));
  const maxHigh = Math.max(...data.map(d => d.high));
  const padding = (maxHigh - minLow) * 0.1;

  return (
    <div style={{ height: `${height}px`, width: '100%', padding: '10px 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis domain={[minLow - padding, maxHigh + padding]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip
            cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                const isUp = d.close >= d.open;
                const color = isUp ? '#10b981' : '#ef4444';
                return (
                  <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>{d.date}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x 15px', fontSize: '13px' }}>
                      <div style={{ color: '#64748b' }}>Open: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{d.open.toFixed(2)}</span></div>
                      <div style={{ color: '#64748b' }}>High: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{d.high.toFixed(2)}</span></div>
                      <div style={{ color: '#64748b' }}>Low: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{d.low.toFixed(2)}</span></div>
                      <div style={{ color: '#64748b' }}>Close: <span style={{ color, fontWeight: 'bold' }}>{d.close.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="openClose" shape={<CustomCandlestick />} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KLineChart;
