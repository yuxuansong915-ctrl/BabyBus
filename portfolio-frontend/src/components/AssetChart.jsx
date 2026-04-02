import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2980b9', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#34495e'];

const AssetChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ alignSelf: 'flex-start', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0, width: '100%' }}>Asset Allocation</h2>
        <p style={{ color: '#7f8c8d', marginTop: '40px' }}>No assets. Add holdings to see the chart.</p>
      </div>
    );
  }

  const totalPortfolioValue = data.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.totalValue / totalPortfolioValue) * 100).toFixed(1);
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.ticker}</p>
          <p style={{ margin: '5px 0', color: '#27ae60' }}>Value: ${data.totalValue.toFixed(2)}</p>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Share: {percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>Asset Allocation</h2>

      <div style={{ width: '100%', height: '250px', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalValue"
              nameKey="ticker"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetChart;
