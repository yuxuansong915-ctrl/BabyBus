import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Info, Activity, Briefcase } from 'lucide-react';
import AddRecordModal from '../components/AddRecordModal';
import KLineChart from '../components/KLineChart';

// --- 内部小组件：迷你走势图 ---
const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return <span style={{color: '#94a3b8', fontSize: '12px'}}>暂无数据</span>;
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
  
  // 弹窗状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [tradeMode, setTradeMode] = useState('ADD'); // 控制弹窗是买入还是卖出

  // 拉取后端数据
  const fetchData = () => {
    setIsLoading(true);
    // 【核心修改】：将 localhost 改为 127.0.0.1，强制走 IPv4 协议，彻底解决连接被拒绝的问题
    fetch('http://127.0.0.1:8080/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setIsLoading(false);
        
        // 如果数据加载完且右侧没有选中项，默认选中第一个
        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }
        
        // 如果某只股票被全部卖出了，它会从 data 里消失。我们需要清理一下右侧的详情页展示
        if (selectedAsset && !data.find(item => item.id === selectedAsset.id)) {
           setSelectedAsset(null);
        }
      })
      .catch(err => {
        console.error('获取持仓失败:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', gap: '30px', height: 'calc(100vh - 150px)' }}>
      
      {/* ========================================== */}
      {/* 左侧：持仓大表格 (占宽 2/3) */}
      {/* ========================================== */}
      <div style={{ flex: '2', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={24} color="#3b82f6" /> 我的核心持仓
          </h2>
          {/* 顶部按钮：新建一笔没有任何预填的加仓记录 */}
          <button 
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
            onClick={() => {
              setModalPrefill(null); // 清空预填
              setTradeMode('ADD');   // 设为买入模式
              setIsModalOpen(true);  // 打开弹窗
            }}
          >
            ➕ 记录新交易
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: '1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0', fontSize: '14px' }}>
                <th style={{ padding: '16px 8px' }}>资产代码</th>
                <th style={{ padding: '16px 8px' }}>持仓数量</th>
                <th style={{ padding: '16px 8px' }}>当前市价</th>
                <th style={{ padding: '16px 8px' }}>30日走势</th>
                <th style={{ padding: '16px 8px' }}>总价值</th>
                <th style={{ padding: '16px 8px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>正在同步华尔街实时数据...</td></tr>
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
                  
                  {/* ========================================== */}
                  {/* 行内操作按钮：加仓 与 卖出 */}
                  {/* ========================================== */}
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setModalPrefill({ ticker: item.ticker, assetType: item.assetType });
                          setTradeMode('ADD'); // 买入模式
                          setIsModalOpen(true);
                        }}
                        style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        加仓
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPrefill({ ticker: item.ticker, assetType: item.assetType });
                          setTradeMode('SELL'); // 卖出模式
                          setIsModalOpen(true);
                        }}
                        style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        减仓 / 卖出
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 右侧：多态资产详情面板 (占宽 1/3) */}
      {/* ========================================== */}
      <div style={{ flex: '1', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflowY: 'auto' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#8b5cf6" /> 深度分析 (Deep Dive)
        </h2>

        {!selectedAsset ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>
            <Info size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>请在左侧表格点击资产<br/>查看基本面数据</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ fontSize: '28px', margin: 0, color: '#0f172a' }}>{selectedAsset.ticker}</h3>
              <span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                {selectedAsset.assetType === 'ETF' ? '基金 / ETF' : '股票'}
              </span>
            </div>

            {/* ========================================== */}
            {/* 插入：置顶展示的专业 K线图 */}
            {/* ========================================== */}
            <div style={{ marginBottom: '25px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#fcfcfc' }}>
               <KLineChart symbol={selectedAsset.ticker} height={220} />
            </div>

            {/* 股票详情面板 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>当前价格</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  ${selectedAsset.currentPrice ? selectedAsset.currentPrice.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>持仓数量</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>{selectedAsset.shares}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>总价值</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  ${selectedAsset.totalValue ? selectedAsset.totalValue.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>市值</div>
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
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>市盈率 P/E</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  {selectedAsset.peRatio ? selectedAsset.peRatio.toFixed(2) : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>52周最高</div>
                <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>
                  {selectedAsset.fiftyTwoWeekHigh ? `$${selectedAsset.fiftyTwoWeekHigh.toFixed(2)}` : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>52周最低</div>
                <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '18px' }}>
                  {selectedAsset.fiftyTwoWeekLow ? `$${selectedAsset.fiftyTwoWeekLow.toFixed(2)}` : '—'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>股息率</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px' }}>
                  {selectedAsset.dividendYield ? `${selectedAsset.dividendYield.toFixed(2)}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 隐藏的双模态弹窗组件 */}
      {/* ========================================== */}
      <AddRecordModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setModalPrefill(null); // 关闭时清空预填数据
        }} 
        onSuccess={fetchData}
        prefillData={modalPrefill}
        tradeMode={tradeMode}    // 将买卖模式传递给弹窗
      />

    </div>
  );
};

export default Holdings;