import React, { useState, useEffect } from 'react';
import { aiApi } from '../api';
import { Bot, Send, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Merhaba! Ben ALFAI yapay zeka asistanınızım. 🤖\n\nSize satış, stok, müşteri ve abonelik konularında yardımcı olabilirim.\n\n"Yardım" yazarak tüm komutları görebilirsiniz.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [cfoAnalysis, setCfoAnalysis] = useState(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const [insightsRes, cfoRes] = await Promise.all([
        aiApi.getInsights(),
        aiApi.getCFOAnalysis()
      ]);
      
      if (insightsRes.data.success) setInsights(insightsRes.data.data.insights);
      if (cfoRes.data.success) setCfoAnalysis(cfoRes.data.data);
    } catch (error) {
      console.error('AI verileri yüklenemedi:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.chat(input);
      if (response.data.success) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: response.data.data.response,
          timestamp: response.data.data.timestamp
        }]);
      }
    } catch (error) {
      toast.error('AI yanıt veremedi');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>AI Asistan</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Yapay zeka destekli iş asistanınız</p>
      </div>

      <div className="ai-container">
        {/* Chat Section */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.type}`}>
                <div className={`chat-avatar ${message.type}`}>
                  {message.type === 'ai' ? <Bot size={18} /> : 'S'}
                </div>
                <div className="chat-bubble">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message ai">
                <div className="chat-avatar ai">
                  <Bot size={18} />
                </div>
                <div className="chat-bubble">
                  <span style={{ opacity: 0.7 }}>Düşünüyorum...</span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Bir şey sorun..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="insights-panel">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Hızlı Sorular</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['Satışlarım nasıl?', 'Stok durumum nedir?', 'Öneriler ver', 'Yardım'].map((q) => (
                <button
                  key={q}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setInput(q);
                    setTimeout(handleSend, 100);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                💡 Öngörüler
              </h4>
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`insight-card ${insight.type}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {insight.type === 'warning' ? (
                      <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                    ) : insight.type === 'success' ? (
                      <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                    ) : (
                      <Lightbulb size={16} style={{ color: 'var(--primary)' }} />
                    )}
                    <strong style={{ fontSize: '0.875rem' }}>{insight.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CFO Summary */}
          {cfoAnalysis && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} />
                  CFO Özeti
                </h3>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Toplam Gelir</span>
                  <strong>{formatCurrency(cfoAnalysis.financialSummary?.totalRevenue)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Brüt Kar</span>
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(cfoAnalysis.financialSummary?.grossProfit)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Net Kar</span>
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(cfoAnalysis.financialSummary?.netProfit)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span>Kar Marjı</span>
                  <strong>{cfoAnalysis.kpis?.profitMargin}</strong>
                </div>
              </div>

              {cfoAnalysis.recommendations?.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Öneriler:</div>
                  <ul style={{ fontSize: '0.75rem', paddingLeft: '1rem', margin: 0 }}>
                    {cfoAnalysis.recommendations.map((rec, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
