import React, { useState } from 'react';
import { X, Building2, Users, FileText, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Shield, Bot, Layers, Check } from 'lucide-react';

const businessTypes = [
  'Retail Store & Grocery',
  'Hardware & Wholesale',
  'Manufacturing & Assembly',
  'Chartered Accountancy & Audit Firm',
  'Healthcare & Pharmacy',
  'E-Commerce & Digital Business',
  'Services & Consulting',
  'Other Business',
];

const employeeRanges = [
  { label: '1 - 5', desc: 'Micro Store / Solo' },
  { label: '6 - 20', desc: 'Growing Shop' },
  { label: '21 - 50', desc: 'Mid Store' },
  { label: '50+', desc: 'Multi-Branch' },
];

const coreModules = [
  { id: 'ocr', title: 'Bill Photo Scanner', desc: 'Extract line items & GST automatically', icon: FileText },
  { id: 'fraud', title: 'Duplicate Bill Alert', desc: 'Screen duplicate bills & wrong charges', icon: Shield },
  { id: 'stock', title: 'Demand & Stock Warning', desc: 'Forecast reorders & supplier Lead time', icon: Layers },
  { id: 'gemini', title: 'Finora 24/7 AI Helper', desc: 'Ask questions in plain English', icon: Bot },
];

export default function SetupModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState(businessTypes[0]);
  const [employees, setEmployees] = useState('6 - 20');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyInvoices, setMonthlyInvoices] = useState(250);
  const [selectedModules, setSelectedModules] = useState(['ocr', 'fraud', 'gemini']);
  const [subdomain, setSubdomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleModule = (id) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
  };

  const handleReset = () => {
    setStep(1);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.25s ease both',
    }}>
      <div className="gloss-card" style={{
        width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        border: '1px solid rgba(243,205,151,0.35)',
        boxShadow: '0 24px 60px rgba(15,23,42,0.22)',
        padding: 36,
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#FFFDF7', border: '1px solid rgba(243,205,151,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#0F172A',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FDF4E3'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFDF7'}
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Finora Workspace Created!
            </h2>
            <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 24px', fontWeight: 500 }}>
              Your workspace for <strong>{companyName || 'Your Business'}</strong> is ready at <strong>{subdomain || 'workspace'}.finora.app</strong>
            </p>

            <div style={{
              backgroundColor: '#FFFDF7', borderRadius: 16, padding: 20,
              border: '1px solid rgba(243,205,151,0.4)', textAlign: 'left',
              marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#334155' }}>Type:</span>
                <strong style={{ color: '#0F172A' }}>{industry}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#334155' }}>Team Size:</span>
                <strong style={{ color: '#0F172A' }}>{employees} Members</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#334155' }}>Monthly Bills:</span>
                <strong style={{ color: '#0F172A' }}>~{monthlyInvoices} Bills / mo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#334155' }}>Active Modules:</span>
                <strong style={{ color: '#B4781C' }}>{selectedModules.length} Modules Active</strong>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="liquid-btn liquid-btn-primary"
              style={{ width: '100%', padding: '14px 24px', fontSize: 15, borderRadius: 12, justifyContent: 'center' }}
            >
              <span style={{ color: '#0F172A', fontWeight: 800 }}>Open Finora Dashboard</span>
              <ArrowRight size={16} color="#0F172A" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header & Steps Indicator */}
            <div style={{ marginBottom: 28 }}>
              <div className="mono-badge" style={{ marginBottom: 10, display: 'inline-flex' }}>
                <Sparkles size={13} color="#9A620E" />
                SETUP WIZARD // STEP {step} OF 2
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                {step === 1 ? 'Set Up Finora for Your Business' : 'Configure Store Parameters'}
              </h2>
              <p style={{ color: '#334155', fontSize: 14, fontWeight: 500 }}>
                {step === 1 ? 'Enter your store details to set up your account.' : 'Tailor bill scanning, duplicate warnings, and team roles for your store.'}
              </p>
            </div>

            {/* Step 1: General Details */}
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 2x2 Grid Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid rgba(243,205,151,0.4)', backgroundColor: '#FFFFFF',
                        fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid rgba(243,205,151,0.4)', backgroundColor: '#FFFFFF',
                        fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      Company / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Superstore / Apex Hardware"
                      value={companyName}
                      onChange={e => {
                        setCompanyName(e.target.value);
                        setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid rgba(243,205,151,0.4)', backgroundColor: '#FFFFFF',
                        fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      Industry / Business Type
                    </label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid rgba(243,205,151,0.4)', backgroundColor: '#FFFFFF',
                        fontSize: 13, color: '#0F172A', outline: 'none', fontFamily: 'inherit',
                      }}
                    >
                      {businessTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Number of Employees / Team Members
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {employeeRanges.map(r => {
                      const selected = employees === r.label;
                      return (
                        <button
                          type="button"
                          key={r.label}
                          onClick={() => setEmployees(r.label)}
                          style={{
                            padding: '8px 6px', borderRadius: 8,
                            backgroundColor: selected ? '#0F172A' : '#FFFDF7',
                            border: `1px solid ${selected ? '#0F172A' : 'rgba(243,205,151,0.4)'}`,
                            color: selected ? '#FFFFFF' : '#0F172A',
                            textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{r.label}</div>
                          <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1 }}>{r.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="liquid-btn liquid-btn-primary"
                  style={{ width: '100%', padding: '12px 20px', fontSize: 14, borderRadius: 10, justifyContent: 'center', marginTop: 4 }}
                >
                  <span style={{ color: '#0F172A', fontWeight: 800 }}>Continue to Store Configuration</span>
                  <ArrowRight size={16} color="#0F172A" />
                </button>
              </form>
            )}

            {/* Step 2: Essential Operations Data */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      Estimated Monthly Invoices &amp; Receipts
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#B4781C' }}>{monthlyInvoices} Docs / mo</span>
                  </div>
                  <input
                    type="range" min="20" max="1500" step="10"
                    value={monthlyInvoices}
                    onChange={e => setMonthlyInvoices(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#B4781C', cursor: 'pointer', height: 8, borderRadius: 4 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                    Select Active Modules
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {coreModules.map(m => {
                      const Icon = m.icon;
                      const active = selectedModules.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleModule(m.id)}
                          style={{
                            padding: 14, borderRadius: 12, cursor: 'pointer',
                            backgroundColor: active ? '#FFFDF7' : '#FFFFFF',
                            border: `1px solid ${active ? '#B4781C' : 'rgba(243,205,151,0.4)'}`,
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 6,
                            backgroundColor: active ? '#B4781C' : 'rgba(243,205,151,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 2,
                          }}>
                            {active && <Check size={13} color="#FFFFFF" />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{m.title}</div>
                            <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{m.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Finora Subdomain URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFDF7', border: '1px solid rgba(243,205,151,0.4)', borderRadius: 10, padding: '0 14px' }}>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder="workspace"
                      style={{
                        flex: 1, border: 'none', backgroundColor: 'transparent', padding: '12px 0',
                        fontSize: 14, fontWeight: 700, color: '#0F172A', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                    <span style={{ fontSize: 13, color: '#B4781C', fontWeight: 700 }}>.finora.app</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '14px 20px', borderRadius: 12,
                      backgroundColor: '#FFFDF7', border: '1px solid rgba(243,205,151,0.4)',
                      color: '#B4781C', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="liquid-btn liquid-btn-primary"
                    style={{ flex: 1, padding: '14px 20px', fontSize: 15, borderRadius: 12, justifyContent: 'center' }}
                  >
                    <span style={{ color: '#0F172A', fontWeight: 800 }}>{isSubmitting ? 'Creating Account...' : 'Complete Setup'}</span>
                    <ArrowRight size={16} color="#0F172A" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
