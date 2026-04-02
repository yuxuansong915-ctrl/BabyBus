import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LineChart, History, Settings as SettingsIcon } from 'lucide-react';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Market from './pages/Market';
// 🎯 修改点 1：引入你刚刚新建的 AIChat 页面组件
import AIChat from './pages/AIChat';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/holdings', name: 'Holdings', icon: <Briefcase size={20} /> },
    { path: '/market', name: 'Market', icon: <LineChart size={20} /> },
    { path: '/transactions', name: 'Transactions', icon: <History size={20} /> },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon size={20} /> }
  ];

  return (
    <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', display: 'flex', alignItems: 'center', height: '70px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: '60px', textDecoration: 'none' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', marginRight: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>P</div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>PortfolioPro</h1>
      </Link>

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

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: '500', color: '#475569', fontSize: '14px' }}>Hi, Investor</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix")', backgroundSize: 'cover' }}></div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        <Navbar />
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/market" element={<Market />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
            {/* 🎯 修改点 2：注册新的 /ai-chat 路由，并绑定到 AIChat 组件 */}
            <Route path="/ai-chat" element={<AIChat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;