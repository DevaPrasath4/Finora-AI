import React, { useState } from 'react';
import {
  Briefcase, Calculator, Users, Store, ShieldCheck,
  Check, ArrowRight, Lock, KeyRound
} from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

const rolesData = [
  {
    id: 'owner', title: 'Business Owner (You)', icon: Briefcase, color: '#B4781C',
    badge: 'Store Owner Role',
    description: 'See beyond the numbers with real-time money tracking, low stock warnings, cash flow views, and easy bill approvals.',
    features: [
      'Real-Time Money & Cash Flow View',
      'Low Stock Warning & Auto Order Tips',
      'Easy Expense Approvals',
      'Finora Store Business Advisor',
    ],
  },
  {
    id: 'accountant', title: 'Store Accountant / CA', icon: Calculator, color: '#B4781C',
    badge: 'Tax & Ledger Role',
    description: 'Instant bill photo reading, duplicate bill warning, simple GST tax reports, and easy profit/loss statements.',
    features: [
      'Fast Bill Photo Scanner',
      'Simple GST & Tax Audit Reports',
      'Bank & Transaction Summary',
      'Payment & Bill Due Date Reminders',
    ],
  },
  {
    id: 'billing', title: 'Store Cashier & Billing Executive', icon: Users, color: '#B4781C',
    badge: 'POS & Billing Counter',
    description: 'Fast store checkout, daily counter cash register total, instant bill receipt printing, and customer list management.',
    features: [
      'Fast Store Counter Checkout',
      'Daily Cash Register Settlement',
      'Instant Bill Print & WhatsApp Receipt Share',
      'Customer Credit & Transaction History',
    ],
  },
  {
    id: 'stock_manager', title: 'Stock & Inventory Manager', icon: Store, color: '#B4781C',
    badge: 'Stock Manager Role',
    description: 'Live stock level tracking, low-stock reorder warnings, lowest supplier price matching, and daily stock intake records.',
    features: [
      'Live Stock Quantity Alerts',
      'Best Price Wholesale Supplier Orders',
      'Stock Intake & Barcode Logging',
      'Expiry & Damage Item Tracking',
    ],
  },
];

export default function RoleShowcase({ onOpenModal }) {
  const [activeTab, setActiveTab] = useState('owner');
  useScrollReveal();
  const activeRole = rolesData.find((r) => r.id === activeTab);

  return (
    <section
      id="roles"
      style={{
        padding: '80px 40px',
        backgroundColor: '#FFFDF7',
        borderTop: '1px solid rgba(243,205,151,0.3)',
        borderBottom: '1px solid rgba(243,205,151,0.3)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="mono-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
            <KeyRound size={14} color="#9A620E" />
            EASY ROLE ACCESS
          </div>
          <h2 style={{
            color: '#0F172A', fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12,
          }}>
            Tailored Screens for Every Store Member
          </h2>
          <p style={{ color: '#334155', fontSize: 16, lineHeight: 1.55, maxWidth: 680, margin: '0 auto', fontWeight: 500 }}>
            Finora gives simple, clear tools for Business Owners, Accountants, Cashiers, and Store Stock Managers.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          {rolesData.map((role) => {
            const Icon = role.icon;
            const isSelected = activeTab === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderRadius: 14,
                  backgroundColor: isSelected ? '#FDF4E3' : '#FFFFFF',
                  border: `1.5px solid ${isSelected ? role.color : 'rgba(243,205,151,0.4)'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: isSelected ? `0 4px 16px rgba(243,205,151,0.3)` : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(180,120,28,0.5)'; e.currentTarget.style.backgroundColor = '#FFFDF7'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(243,205,151,0.4)'; e.currentTarget.style.backgroundColor = '#FFFFFF'; } }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  backgroundColor: isSelected ? role.color : '#FFFDF7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.22s ease',
                }}>
                  <Icon size={16} color={isSelected ? '#FFFFFF' : '#B4781C'} />
                </div>
                <span style={{
                  fontSize: 14, fontWeight: isSelected ? 800 : 700,
                  color: '#0F172A',
                  transition: 'all 0.2s ease',
                }}>{role.title}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase card */}
        {activeRole && (
          <div
            className="gloss-card"
            key={activeRole.id}
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 36,
              padding: 36, borderRadius: 24,
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(243,205,151,0.4)',
              boxShadow: '0 12px 40px rgba(243,205,151,0.18)',
            }}
          >
            {/* Left */}
            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800,
                  color: '#9A620E',
                  border: `1.5px solid #B4781C`,
                  backgroundColor: '#FFFDF7',
                }}>{activeRole.badge}</span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                  color: '#9A620E',
                  backgroundColor: '#FFFDF7',
                  border: '1.5px solid rgba(243,205,151,0.5)',
                }}>
                  <Lock size={11} color="#9A620E" /> Protected Access
                </span>
              </div>

              <h3 style={{ color: '#0F172A', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
                {activeRole.title} Workspace
              </h3>
              <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
                {activeRole.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {activeRole.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: activeRole.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={12} color="#FFFFFF" />
                    </div>
                    <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 700 }}>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onOpenModal && onOpenModal('login')}
                className="liquid-btn liquid-btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: 14, padding: '10px 18px', borderRadius: 10 }}
              >
                <span style={{ color: '#0F172A', fontWeight: 800 }}>Explore {activeRole.title} Workflow</span>
                <ArrowRight size={14} color="#0F172A" />
              </button>
            </div>

            {/* Right — visual placeholder */}
            <div style={{ flex: '1 1 320px', minHeight: 320 }}>
              <div style={{
                width: '100%', height: '100%', minHeight: 320,
                borderRadius: 20, overflow: 'hidden',
                border: '1px solid rgba(243,205,151,0.4)',
                boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
                background: `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`,
                padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#F3CD97', fontFamily: 'monospace', fontWeight: 800 }}>{activeRole.title.toUpperCase()} WORKSPACE</div>
                  <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>Store Total</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>₹ 1,84,500 <span style={{ fontSize: 11, color: '#4ade80' }}>✓ Active</span></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>System Status</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#F3CD97' }}>100% Online • Real-time Protection Active</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', fontWeight: 600 }}>Finora Security Standard</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
