import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Bot, User, Sparkles } from 'lucide-react';

// 复用你的 Markdown 渲染器
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    if (line.trim().startsWith('### ')) return <h4 key={index} style={{ color: 'inherit', fontSize: '16px', marginTop: '16px', marginBottom: '8px' }}>{line.replace('### ', '')}</h4>;
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      let content = line.trim().substring(2);
      const parts = content.split(/(\*\*.*?\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i} style={{ color: 'inherit' }}>{part.slice(2, -2)}</strong> : part));
      return <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', lineHeight: '1.6' }}><span>•</span> <div>{parts}</div></div>;
    }
    if (line.trim() !== '') {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i} style={{ color: 'inherit' }}>{part.slice(2, -2)}</strong> : part));
      return <p key={index} style={{ marginBottom: '10px', lineHeight: '1.6' }}>{parts}</p>;
    }
    return null;
  });
};

const AIChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const initialReport = location.state?.initialReport || "Welcome to the AI Investment Terminal. How can I assist with your portfolio today?";

  // 核心状态：保存多轮对话上下文
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a Wall Street Chief Investment Officer. Give sharp, data-driven financial advice.' },
    { role: 'assistant', content: initialReport } // 将 Dashboard 传过来的报告作为 AI 的第一句话
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = { role: 'user', content: inputMessage };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8080/api/portfolio/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }) // 把所有历史记录发给后端
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Network error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
      
      {/* 头部导航 */}
      <div style={{ padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#8b5cf6" /> DeepSeek Investment Copilot
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Session active • Context retained</p>
          </div>
        </div>
      </div>

      {/* 聊天消息区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#ffffff' }}>
        {messages.filter(m => m.role !== 'system').map((msg, index) => {
          const isAI = msg.role === 'assistant';
          return (
            <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexDirection: isAI ? 'row' : 'row-reverse' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: isAI ? '#f3e8ff' : '#dbeafe', color: isAI ? '#8b5cf6' : '#2563eb', flexShrink: 0 }}>
                {isAI ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div style={{ maxWidth: '75%', padding: '15px 20px', borderRadius: '12px', backgroundColor: isAI ? '#f8fafc' : '#2563eb', color: isAI ? '#334155' : 'white', border: isAI ? '1px solid #e2e8f0' : 'none', boxShadow: isAI ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                {renderMarkdown(msg.content)}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3e8ff', color: '#8b5cf6' }}><Bot size={20} /></div>
             <div style={{ padding: '15px 20px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#94a3b8', fontStyle: 'italic' }}>Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 输入框区 */}
      <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask AI to drill down into a specific stock or run a stress test..."
            style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
          <button 
            onClick={sendMessage}
            disabled={isTyping || !inputMessage.trim()}
            style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: inputMessage.trim() ? '#8b5cf6' : '#cbd5e1', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: inputMessage.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIChat;