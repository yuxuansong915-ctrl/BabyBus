import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 为饼图的切片准备一组专业的金融级配色
const COLORS = ['#2980b9', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#34495e'];

const AssetChart = ({ data }) => {
  // 如果没有任何持仓数据，显示占位提示
  if (!data || data.length === 0) {
    return (
      <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ alignSelf: 'flex-start', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0, width: '100%' }}>📊 资产占比分析</h2>
        <p style={{ color: '#7f8c8d', marginTop: '40px' }}>暂无资产，无法生成图表</p>
      </div>
    );
  }

/**
 * 资产占比饼图组件
 * 展示当前持仓中各个资产的价值占比（环形图样式）
 * @param {Array} data - 资产列表数据，包含 ticker 和 totalValue
 */

  // 计算总资产，用于在 Tooltip 中显示百分比
  const totalPortfolioValue = data.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  // 自定义鼠标悬浮时的提示框 (Tooltip)
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.totalValue / totalPortfolioValue) * 100).toFixed(1);
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.ticker}</p>
          <p style={{ margin: '5px 0', color: '#27ae60' }}>价值: ${data.totalValue.toFixed(2)}</p>
          <p style={{ margin: 0, color: '#7f8c8d' }}>占比: {percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>📊 资产占比分析</h2>
      
      <div style={{ width: '100%', height: '250px', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalValue" // 以总价值作为切片大小的依据
              nameKey="ticker"     // 以股票代码作为切片的名字
              cx="50%"             // 圆心 X 坐标
              cy="50%"             // 圆心 Y 坐标
              innerRadius={60}     // 内部留空，做成酷炫的“环形图”
              outerRadius={90}     // 外部半径
              paddingAngle={5}     // 切片之间的间距
              label              // 在图表外侧显示连线标签
            >
              {/* 遍历数据，给每个切片涂上不同的颜色 */}
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