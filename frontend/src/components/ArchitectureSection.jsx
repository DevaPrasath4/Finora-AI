import React from 'react';
import { Layers, Database, Shield, Zap, Server, Cpu, MessageSquare, Lock, Activity, Globe, Code } from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

const systemTiers = [
  {
    tier: 'FRONTEND CLIENT LAYER (src/)',
    subtitle: 'React 18 SPA + Vite Dev Server',
    tech: 'React, Tailwind/Vanilla CSS, Lucide Icons',
    icon: Globe,
    color: '#F3CD97',
    features: ['Business Owner Dashboard', 'OCR Invoice Upload Module', 'Customer POS Bill Generator', 'Real-Time Fraud Alerts Feed'],
  },
  {
    tier: 'BACKEND REST API LAYER (server/)',
    subtitle: 'Node.js Express API Engine (Port 5000)',
    tech: 'Node.js, Express, REST APIs, JSON Store',
    icon: Server,
    color: '#00D9C0',
    features: ['API Routes: /api/inventory, /api/invoices, /api/auth', 'AI Fraud Detection & Duplicate Bill Interceptor', 'Vendor Rates & Overcharge Auditor', 'Automated Financial Ledger & Profit Sync'],
  },
  {
    tier: 'PERSISTENCE DB LAYER (docs/)',
    subtitle: 'Supabase Cloud Database',
    tech: 'Supabase, Row-Level Security',
    icon: Database,
    color: '#20D67A',
    features: ['public.users (Email, Pass, Phone Auth)', 'public.invoices & public.inventory', 'public.expenses & public.transactions', 'public.fraud_alerts & RLS Row Policies'],
  },
];

const microservices = [
  { name: 'User & Staff Auth API', desc: 'Email, Mobile & Password Login', icon: Lock },
  { name: 'Invoice & Payment Engine', desc: 'OCR Reader & Credit Due Dates', icon: Server },
  { name: 'Financial Ledger Sync', desc: 'Real-Time Cash In/Out Ledger', icon: Activity },
  { name: 'Inventory & Stock Service', desc: 'Stock Auto-Accumulation & MRP', icon: Layers },
  { name: 'AI Forecast Service', desc: 'Sales & Profit Margin Analytics', icon: Cpu },
  { name: 'Vendor & Debit Note Manager', desc: 'Vendor Profiles & Stock Return', icon: Server },
  { name: 'AI Duplicate Interceptor', desc: 'Identical Bill & Fake Detector', icon: Shield },
  { name: 'Govt GST Tax Verification', desc: 'GSTIN & Rate Overcharge Check', icon: Server },
];

export default function ArchitectureSection() {
  useScrollReveal();

  return (
    <section
      id="architecture"
      style={{
        padding: '80px 40px',
        backgroundColor: '#F5F0EB',
        borderTop: '1px solid rgba(30,27,24,0.08)',
        borderBottom: '1px solid rgba(30,27,24,0.08)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="mono-badge" style={{ marginBottom: 14, display: 'inline-flex' }}>
            <Server size={14} color="#A88660" />
            Decoupled Architecture
          </div>
          <h2 style={{
            color: '#1E1B18', fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12,
          }}>
            Finora System Architecture
          </h2>
          <p style={{ color: '#6E675F', fontSize: 16, lineHeight: 1.6, maxWidth: 680, margin: '0 auto' }}>
            Smart Finance, Safer Business. Clean separation between the React client, Express REST API, and Supabase cloud database.
          </p>
        </div>

        {/* 3-Tier Architecture Diagram Grid */}
        <div className="reveal reveal-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {systemTiers.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 20, backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(30,27,24,0.1)',
                  padding: 24, boxShadow: '0 10px 24px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={item.color === '#F3CD97' ? '#B4781C' : item.color} />
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#A88660', letterSpacing: '0.05em' }}>{item.tier}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1E1B18', marginTop: 2 }}>{item.subtitle}</h3>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#5C705E', background: '#F2E8DC', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                  Tech Stack: {item.tech}
                </div>

                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#4A443E', lineHeight: 1.6 }}>
                  {item.features.map((ft, i) => (
                    <li key={i}>{ft}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Architecture box */}
        <div
          className="reveal reveal-delay-2"
          style={{
            borderRadius: 24, backgroundColor: '#FFFFFF',
            border: '1px solid rgba(30,27,24,0.08)',
            padding: 28,
            boxShadow: '0 12px 32px rgba(30,27,24,0.05)',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}
        >
          {/* Gateway layer */}
          <div style={{
            padding: 16, borderRadius: 14, textAlign: 'center',
            backgroundColor: '#F2E8DC',
            border: '1px solid rgba(212,184,150,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <Zap size={18} color="#A88660" />
              <span style={{ color: '#1E1B18', fontSize: 16, fontWeight: 800 }}>Finora Core Express REST API Services</span>
            </div>
            <p style={{ color: '#4A443E', fontSize: 12, margin: 0 }}>
              Express.js Router • CORS Security • JWT Session Auth • Supabase Client Bridge
            </p>
          </div>

          {/* Microservices grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {microservices.map((ms, idx) => {
              const Icon = ms.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 12, borderRadius: 12,
                    backgroundColor: '#FAF8F5',
                    border: '1px solid rgba(30,27,24,0.08)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    backgroundColor: '#F2E8DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color="#A88660" />
                  </div>
                  <div>
                    <div style={{ color: '#1E1B18', fontSize: 12, fontWeight: 700 }}>{ms.name}</div>
                    <div style={{ color: '#6E675F', fontSize: 10, marginTop: 1 }}>{ms.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
