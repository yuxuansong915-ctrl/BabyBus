import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LineChart, History, Settings as SettingsIcon } from 'lucide-react';

// ==========================================
// 临时占位页面 (之后我们会逐个替换它们)
// ==========================================
const Dashboard = () => <div style={{ padding: '50px', textAlign: 'center', fontSize: '24px', color: '#7f8c8d' }}>📊 Dashboard 首页 (建设中...)</div>;
const Holdings = () => <div style={{ padding: '50px', textAlign: 'center', fontSize: '24px', color: '#7f8c8d' }}>💼 我的持仓记录 (建设中...)</div>;
const Market = () => <div style={{ padding: '50px', textAlign: 'center', fontSize: '24px', color: '#7f8c8d' }}>🌍 发现与行情筛选 (建设中...)</div>;
const Transactions = () => <div style={{ padding: '50px', textAlign: 'center', fontSize: '24px', color: '#7f8c8d' }}>📜 行为金融学交易日志 (建设中...)</div>;
const Settings = () => <div style={{ padding: '50px', textAlign: 'center', fontSize: '24px', color: '#7f8c8d' }}>⚙️ 风险控制与设置 (建设中...)</div>;

// ==========================================
// 专业级顶部导航栏组件
// ==========================================
const Navbar = () => {
  const location = useLocation(); // 获取当前所在的路由路径

  // 导航栏按钮数据配置
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/holdings', name: 'Holdings', icon: <Briefcase size={20} /> },
    { path: '/market', name: 'Market', icon: <LineChart size={20} /> },
    { path: '/transactions', name: 'Transactions', icon: <History size={20} /> },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon size={20} /> } // <-- 这里改成了 SettingsIcon
  ];

  return (
    <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', display: 'flex', alignItems: 'center', height: '70px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      {/* Logo 区 */}
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '60px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', marginRight: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>P</div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>PortfolioPro</h1>
      </div>

      {/* 导航链接区 */}
      <div style={{ display: 'flex', gap: '10px', height: '100%' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', textDecoration: 'none', fontWeight: '600', fontSize: '15px', transition: 'all 0.2s', height: '100%',
                color: isActive ? '#2563eb' : '#64748b',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent'
              }}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* 右侧用户头像区 */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: '500', color: '#475569', fontSize: '14px' }}>Hi, 投资人</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix")', backgroundSize: 'cover' }}></div>
      </div>
    </nav>
  );
};

// ==========================================
// 主应用路由外壳
// ==========================================
function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {/* 全局导航栏 */}
        <Navbar />
        
        {/* 页面内容渲染区 */}
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/market" element={<Market />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;