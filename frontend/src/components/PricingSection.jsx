import React from 'react';
import { Check, ArrowRight, LogIn, UserPlus, Zap, Sparkles } from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

const options = [
  {
    id: 'standard',
    name: 'Finora Store Account',
    sub: 'For small stores, retail shops, and growing business ledgers',
    badge: 'QUICK START',
    features: [
      'Instant Bill Photo & Receipt Scanner',
      'Duplicate Bill Alert Engine',
      'Easy GST Filing Reports (GSTR-1 & 3B)',
      'Easy Staff Access (Owners & Accountants)',
      'WhatsApp & Email Reminders',
      'Protected Cloud Ledger Backup',
    ],
    buttonText: 'Create Finora Account',
    icon: UserPlus,
    primary: false,
  },
  {
    id: 'enterprise',
    name: 'Finora Workspace Access',
    sub: 'For existing store owners, accountants, cashiers, and managers',
    badge: 'EXISTING MEMBERS',
    features: [
      'Log In to Your Finora Workspace',
      '24/7 AI Chatbot Assistant',
      'Real-Time Demand & Stock Forecasts',
      'Best Price Supplier Purchase Orders',
      'Full Staff Role Access',
      'Real-Time Security Activity Stream',
    ],
    buttonText: 'Log In to Workspace',
    icon: LogIn,
    primary: true,
  },
];

export default function PricingSection({ onOpenModal }) {
  useScrollReveal();

  return (
    <section
      id="pricing"
      style={{
        padding: '96px 40px',
        backgroundColor: '#FFFDF7',
      }}
    >
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="mono-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
            <Zap size={13} color="#9A620E" />
            GET STARTED IN MINUTES
          </div>
          <h2 style={{
            color: '#0F172A', fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 12,
          }}>
            Set Up Finora for Your Business
          </h2>
          <p style={{ color: '#334155', fontSize: 16, lineHeight: 1.65, maxWidth: 580, margin: '0 auto', fontWeight: 500 }}>
            Smart Finance, Safer Business. Create a new account for your store or log in directly to your workspace.
          </p>
        </div>

        {/* Cards row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center' }}>
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                className={`reveal gloss-card ${i === 0 ? 'reveal-delay-1' : 'reveal-delay-2'}`}
                style={{
                  flex: '1 1 320px',
                  maxWidth: 540,
                  padding: 36,
                  borderRadius: 22,
                  background: opt.primary ? '#0F172A' : '#FFFFFF',
                  border: `1px solid ${opt.primary ? '#0F172A' : 'rgba(243,205,151,0.35)'}`,
                  boxShadow: opt.primary ? '0 20px 50px rgba(15,23,42,0.20)' : '0 4px 20px rgba(243,205,151,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
                }}
              >
                {/* Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 99, alignSelf: 'flex-start',
                  marginBottom: 16,
                  backgroundColor: opt.primary ? 'rgba(243,205,151,0.2)' : '#FFFDF7',
                  border: `1px solid ${opt.primary ? 'rgba(243,205,151,0.4)' : 'rgba(243,205,151,0.4)'}`,
                }}>
                  <Sparkles size={11} color="#F3CD97" />
                  <span style={{
                    color: '#F3CD97',
                    fontSize: 10, fontWeight: 800, fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                  }}>
                    {opt.badge}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 22, fontWeight: 800,
                  color: opt.primary ? '#FFFFFF' : '#0F172A',
                  marginBottom: 6,
                }}>
                  {opt.name}
                </h3>
                <p style={{
                  fontSize: 13, lineHeight: 1.5,
                  color: opt.primary ? '#94A3B8' : '#334155',
                  marginBottom: 24,
                }}>
                  {opt.sub}
                </p>

                {/* Features list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32, flex: 1 }}>
                  {opt.features.map((feat) => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 99,
                        backgroundColor: opt.primary ? 'rgba(243,205,151,0.2)' : '#FFFDF7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Check size={12} color="#F3CD97" />
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        color: opt.primary ? '#F8FAFC' : '#0F172A',
                      }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => onOpenModal ? onOpenModal(opt.id === 'enterprise' ? 'login' : 'setup') : null}
                  className={`liquid-btn ${opt.primary ? 'liquid-btn-primary' : 'liquid-btn-secondary'}`}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 14,
                  }}
                >
                  <Icon size={16} />
                  <span>{opt.buttonText}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
