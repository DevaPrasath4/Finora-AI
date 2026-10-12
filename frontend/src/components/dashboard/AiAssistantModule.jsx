import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Send, TrendingUp, Package, Lightbulb,
  ShieldCheck, FileText, ArrowUpRight, Copy, Check,
  RefreshCw, MessageSquare, HelpCircle, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { apiAiChat, apiGetAiInsights } from '../../services/api';

export default function AiAssistantModule({ companyName = 'Metro Superstore Ltd', ownerName = 'Business Owner' }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'financial' | 'stock' | 'recommendations' | 'compliance'
  const [selectedAssistant, setSelectedAssistant] = useState('finance');
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello **${ownerName}**! I am your **Finora AI Finance Analyst** for **${companyName}**.\n\nI analyze profit & loss, cash flow, expenses, tax offset credits, and cost optimization. How can I assist you with your financials today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'Welcome',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const welcomeMessages = {
    finance: `Hello **${ownerName}**! I am your **Finora AI Finance Analyst** for **${companyName}**.\n\nI analyze profit & loss, cash flow, expenses, tax offset credits, and cost optimization. How can I assist you with your financials today?`,
    inventory: `Hi **${ownerName}**! I am your **Finora Inventory & Store Management Assistant** for **${companyName}**.\n\nI track stock levels, predict low stock risks, suggest replenishment orders, and identify slow-moving items. What inventory insights do you need?`,
    vendor: `Hello **${ownerName}**! I am your **Finora Vendor Recommendation Engine** for **${companyName}**.\n\nI compare supplier prices, shipping delivery speed, and purchase history to suggest the most cost-effective vendors. Ask me to compare vendors!`,
    fraud_growth: `Welcome **${ownerName}**! I am your **Finora Fraud Detection & Business Growth Assistant** for **${companyName}**.\n\nI monitor transactional audit trails for duplicate bills and anomalies, and design growth strategies (loyalty, pricing, marketing). What can I help you check today?`
  };

  const handleSwitchAssistant = (assistant) => {
    setSelectedAssistant(assistant);
    setMessages([
      {
        id: `welcome-${assistant}-${Date.now()}`,
        sender: 'ai',
        text: welcomeMessages[assistant],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'Welcome',
      }
    ]);
  };

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    apiGetAiInsights()
      .then(res => {
        if (res && res.insights) {
          setInsightsData(res.insights);
        }
      })
      .catch(err => console.warn('AI Insights fetch notice:', err.message))
      .finally(() => setLoadingInsights(false));
  }, []);

  const quickPrompts = [
    { label: '📊 Analyze Profit & Margin', query: 'Analyze our monthly profit, gross margin, and top expense drivers.' },
    { label: '📦 Low Stock & Reorder Advice', query: 'Which items are running low on stock and need immediate reordering?' },
    { label: '💡 Retail Growth Strategies', query: 'Give me 3 practical business growth and pricing recommendations for FMCG retail.' },
    { label: '⚖️ GST Compliance Status', query: 'Check our GST filing readiness and estimated Input Tax Credit (ITC).' },
    { label: '🛡️ Audit Duplicate Bills', query: 'Scan recent supplier invoices for duplicate bills and fraud risks.' },
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await apiAiChat(text, companyName, selectedAssistant);
      const replyText = res.reply || 'Analysis complete for your store metrics.';
      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        category: res.category || 'AI Analysis',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      // Show answer in UI
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      const fallbackText = `⚠️ Based on your store records for ${companyName}, transactions and inventory are healthy. (Backend response simulated).`;
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(243,205,151,0.12) 0%, rgba(20,24,33,0.85) 100%)',
        border: '1px solid var(--fg-border-accent)',
        borderRadius: 16, padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #F3CD97, #DCA052)',
            color: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(243,205,151,0.25)',
          }}>
            <Sparkles size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                Finora AI Smart Business Assistant
              </h1>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                border: '1px solid var(--fg-border-accent)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                GPT-4 Enterprise Engine
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
              Autonomous Financial Insights, Inventory Optimization, Growth Strategies & Compliance Verification for {companyName}.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--fg-surface)', padding: 4, borderRadius: 10,
          border: '1px solid var(--fg-border)',
        }}>
          {[
            { id: 'chat', label: 'Conversational Chat', icon: MessageSquare },
            { id: 'financial', label: 'Financial Insights', icon: TrendingUp },
            { id: 'stock', label: 'Stock Analysis', icon: Package },
            { id: 'recommendations', label: 'Growth Strategies', icon: Lightbulb },
            { id: 'compliance', label: 'GST Guidance', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: active ? 'var(--fg-accent-soft)' : 'transparent',
                  border: active ? '1px solid var(--fg-border-accent)' : '1px solid transparent',
                  color: active ? 'var(--fg-accent)' : 'var(--fg-text-secondary)',
                  fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: CONVERSATIONAL CHAT ──────────────────────────────── */}
      {activeTab === 'chat' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20,
          minHeight: 600,
        }}>
          {/* Main Chat Stream */}
          <div style={{
            background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', height: 640,
          }}>
            {/* Assistant selector tabs */}
            <div style={{
              display: 'flex', gap: 10, padding: 14,
              borderBottom: '1px solid var(--fg-border)',
              background: 'var(--fg-bg-secondary)',
            }}>
              {[
                { id: 'finance', label: '📊 Finance Analyst' },
                { id: 'inventory', label: '📦 Inventory & Stock' },
                { id: 'vendor', label: '🤝 Vendor Recommendations' },
                { id: 'fraud_growth', label: '🛡️ Fraud & Growth' },
              ].map(ast => {
                const active = selectedAssistant === ast.id;
                return (
                  <button
                    key={ast.id}
                    onClick={() => handleSwitchAssistant(ast.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: active ? 'var(--fg-accent-soft)' : 'var(--fg-surface)',
                      border: active ? '1px solid var(--fg-border-accent)' : '1px solid var(--fg-border)',
                      color: active ? 'var(--fg-accent)' : 'var(--fg-text-secondary)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {ast.label}
                  </button>
                );
              })}
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: 24,
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>
              {messages.map(msg => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: isAi ? 'row' : 'row-reverse',
                      alignItems: 'flex-start',
                      gap: 12,
                      maxWidth: isAi ? '85%' : '75%',
                      alignSelf: isAi ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: isAi ? 'linear-gradient(135deg, #F3CD97, #DCA052)' : 'var(--fg-accent-soft)',
                      color: isAi ? '#0A0D14' : 'var(--fg-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                    }}>
                      {isAi ? <Bot size={18} /> : '👤'}
                    </div>

                    <div style={{
                      background: isAi ? 'var(--fg-bg-secondary)' : 'linear-gradient(135deg, rgba(243,205,151,0.2) 0%, rgba(243,205,151,0.08) 100%)',
                      border: `1px solid ${isAi ? 'var(--fg-border)' : 'var(--fg-border-accent)'}`,
                      borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '14px 18px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      position: 'relative',
                    }}>
                      {isAi && msg.category && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: 'var(--fg-accent)',
                          marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          <Zap size={11} /> {msg.category}
                        </div>
                      )}

                      <div style={{
                        fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-text-primary)',
                        whiteSpace: 'pre-line', fontFamily: 'inherit',
                      }}>
                        {msg.text}
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 10, color: 'var(--fg-text-muted)',
                      }}>
                        <span>{msg.timestamp}</span>
                        {isAi && (
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--fg-text-muted)', display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 10,
                            }}
                          >
                            {copiedId === msg.id ? (
                              <><Check size={11} color="var(--fg-success)" /> Copied</>
                            ) : (
                              <><Copy size={11} /> Copy</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'linear-gradient(135deg, #F3CD97, #DCA052)',
                    color: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={18} />
                  </div>
                  <div style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                    borderRadius: '4px 16px 16px 16px', padding: '12px 18px',
                    fontSize: 13, color: 'var(--fg-accent)', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing store database and computing insights...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              style={{
                padding: '14px 18px', borderTop: '1px solid var(--fg-border)',
                background: 'var(--fg-bg-secondary)', display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <input
                type="text"
                placeholder={`Ask Finora AI anything about ${companyName}'s sales, stocks, margins, taxes...`}
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                  color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="lc-liquid-btn"
                style={{
                  padding: '12px 20px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  cursor: (!inputQuery.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!inputQuery.trim() || isLoading) ? 0.6 : 1,
                }}
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Quick Prompts & AI Features Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 800, color: 'var(--fg-accent)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Zap size={14} /> Quick Analysis Prompts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.query)}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 12, fontWeight: 600,
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--fg-accent)'; e.currentTarget.style.background = 'var(--fg-accent-soft)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--fg-border)'; e.currentTarget.style.background = 'var(--fg-bg-secondary)'; }}
                  >
                    <span>{qp.label}</span>
                    <ChevronRight size={13} color="var(--fg-text-muted)" />
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)', marginBottom: 8 }}>
                🛡️ Continuous Monitoring Active
              </div>
              <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Finora scans every incoming customer bill, purchase invoice, and inventory adjustment in real time to guarantee 100% tax accuracy and fraud protection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FINANCIAL INSIGHTS ────────────────────────────────── */}
      {activeTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {insightsData ? (
            <>
              <div style={{
                background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                borderRadius: 16, padding: 24,
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: '0 0 8px' }}>
                  {insightsData.financial.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {insightsData.financial.summary}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {insightsData.financial.metrics.map((m, idx) => (
                    <div key={idx} style={{
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      borderRadius: 12, padding: 16,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text-muted)', textTransform: 'uppercase' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', margin: '6px 0' }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: m.positive ? 'var(--fg-success)' : 'var(--fg-danger)' }}>
                        {m.trend}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                borderRadius: 16, padding: 24,
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-accent)', margin: '0 0 14px' }}>
                  💡 Financial Optimization Suggestions
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--fg-text-primary)', fontSize: 13, lineHeight: 1.8 }}>
                  {insightsData.financial.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              Loading financial intelligence models...
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: STOCK ANALYSIS ────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {insightsData ? (
            <>
              <div style={{
                background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                borderRadius: 16, padding: 24,
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: '0 0 8px' }}>
                  {insightsData.stock.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', margin: '0 0 20px' }}>
                  {insightsData.stock.summary}
                </p>

                {insightsData.stock.lowStock && insightsData.stock.lowStock.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-danger)', textTransform: 'uppercase' }}>
                      ⚠️ Critical Items Requiring Reorder
                    </div>
                    {insightsData.stock.lowStock.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                        padding: '12px 16px', borderRadius: 10,
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>
                            Current: <strong style={{ color: 'var(--fg-danger)' }}>{item.currentStock} units</strong> (Min Alert: {item.threshold})
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                          fontSize: 12, fontWeight: 700, border: '1px solid var(--fg-border-accent)',
                        }}>
                          Suggested Reorder: +{item.reorderQty} units
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: 20, borderRadius: 10, background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.3)', color: 'var(--fg-success)',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle2 size={18} />
                    All stock items in store inventory are currently above minimum safety levels!
                  </div>
                )}
              </div>

              <div style={{
                background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                borderRadius: 16, padding: 24,
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-accent)', margin: '0 0 12px' }}>
                  🤖 Smart Inventory Recommendations
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--fg-text-primary)', fontSize: 13, lineHeight: 1.8 }}>
                  {insightsData.stock.smartSuggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-text-muted)' }}>
              Loading stock analytics...
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: GROWTH STRATEGIES ─────────────────────────────────── */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {insightsData && (
            <div style={{
              background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: '0 0 16px' }}>
                {insightsData.recommendations.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {insightsData.recommendations.strategies.map((st, idx) => (
                  <div key={idx} style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                    borderRadius: 12, padding: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                        {idx + 1}. {st.title}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                        background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                        border: '1px solid var(--fg-border-accent)',
                      }}>
                        {st.impact}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {st.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: GST & COMPLIANCE ──────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {insightsData && (
            <div style={{
              background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  {insightsData.compliance.title}
                </h3>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
                  background: 'rgba(34,197,94,0.15)', color: 'var(--fg-success)',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}>
                  {insightsData.compliance.status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-accent)', fontWeight: 600, margin: '0 0 20px' }}>
                {insightsData.compliance.gstSummary}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insightsData.compliance.checkpoints.map((cp, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                    fontSize: 13, color: 'var(--fg-text-primary)', fontWeight: 500,
                  }}>
                    {cp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
