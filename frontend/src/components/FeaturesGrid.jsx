import React, { useState } from 'react';
import { ScanText, ShieldAlert, TrendingUp, ShoppingBag, Bot, FileText, ArrowUpRight, Zap } from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

const featuresList = [
  {
    id: 1, icon: ScanText, imgSrc: '/assets/feature_ocr_scanner.png', title: 'Instant Bill Photo & Receipt Scanner',
    category: 'Invoice Service', tag: 'Bill Reader',
    desc: 'Extract line items, GST numbers, supplier names, and total amounts from bill photos with high precision.',
    details: 'Automates matching with store records and alerts upcoming bill due dates.',
  },
  {
    id: 2, icon: ShieldAlert, imgSrc: '/assets/feature_fake_bill.png', title: 'AI Fake Bill & Overcharge Protection',
    category: 'Security Service', tag: 'Fake Bill Shield',
    desc: 'Real-time AI security to instantly block duplicate invoices, wrong bills, or supplier price overcharging.',
    details: 'Blocks fake bill payments before money leaves your account.',
  },
  {
    id: 3, icon: TrendingUp, imgSrc: '/assets/feature_stock_alert.png', title: 'AI Demand & Stock Low Warnings',
    category: 'Stock Service', tag: 'Stock Alert',
    desc: 'Predict stock needs based on sales history so your retail shop never runs out of popular items.',
    details: 'Automates reorder recommendations to keep healthy stock levels.',
  },
  {
    id: 4, icon: ShoppingBag, imgSrc: '/assets/feature_supplier_compare.png', title: 'Supplier Price Comparison & Buying Orders',
    category: 'Purchase Service', tag: 'Cost Saver',
    desc: 'Compare wholesale item prices across registered suppliers to ensure you buy at the lowest market rate.',
    details: 'Dispatches automated buying orders directly to approved suppliers.',
  },
  {
    id: 5, icon: Bot, imgSrc: '/assets/feature_ai_chatbot.png', title: '24/7 AI Chatbot Business Helper',
    category: 'AI Advisory Service', tag: 'AI Assistant',
    desc: 'Ask questions in simple English about your store profits, sales, GST taxes, and cash flow trajectory.',
    details: 'Always active to answer questions and give smart store tips.',
  },
  {
    id: 6, icon: FileText, imgSrc: '/assets/feature_gst_filing.png', title: 'Automated GST Tax Filing & Simple Reports',
    category: 'Compliance Service', tag: 'GST Filing',
    desc: 'Generate GSTR-1 and GSTR-3B tax audit summaries with automatic WhatsApp and SMS alerts.',
    details: 'Download simple profit & loss statements to PDF or Excel formats.',
  },
];

function FeatureCard({ feat, delayClass }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`gloss-card reveal ${delayClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 320px',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        backgroundColor: hovered ? '#FFFFFF' : '#FFFDF7',
        borderColor: hovered ? 'rgba(243,205,151,0.6)' : 'rgba(243,205,151,0.3)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Feature Image Illustration */}
      <div style={{
        width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
        marginBottom: 18, border: '1px solid rgba(243,205,151,0.3)',
        backgroundColor: '#0F172A',
      }}>
        <img
          src={feat.imgSrc}
          alt={feat.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
      </div>

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 8,
          backgroundColor: '#FFFDF7',
          border: '1.5px solid rgba(243,205,151,0.5)',
          fontSize: 10, fontWeight: 800, color: '#9A620E',
          fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{feat.tag}</span>
      </div>

      <h3 style={{
        color: '#0F172A', fontSize: 18, fontWeight: 800,
        marginBottom: 10, lineHeight: 1.4,
        transition: 'color 0.2s ease',
      }}>{feat.title}</h3>
      <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, marginBottom: 20, flex: 1, fontWeight: 500 }}>{feat.desc}</p>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: '1px solid rgba(15,23,42,0.08)',
      }}>
        <p style={{ color: '#B4781C', fontSize: 12, flex: 1, marginRight: 10, lineHeight: 1.5, fontWeight: 700 }}>{feat.details}</p>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          backgroundColor: hovered ? '#F3CD97' : '#FFFDF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s ease', flexShrink: 0,
        }}>
          <ArrowUpRight size={16} color={hovered ? '#0F172A' : '#B4781C'} />
        </div>
      </div>
    </div>
  );
}

const delayClasses = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3', 'reveal-delay-4', 'reveal-delay-5'];

export default function FeaturesGrid() {
  useScrollReveal();

  return (
    <section
      id="features"
      style={{
        padding: '96px 40px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="mono-badge" style={{ marginBottom: 16, display: 'inline-flex' }}>
            <Zap size={13} color="#9A620E" />
            EASY SHOP FINANCIAL APP
          </div>
          <h2 style={{
            color: '#0F172A', fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 14,
          }}>
            Main Shop Management Features
          </h2>
          <p style={{ color: '#334155', fontSize: 16, lineHeight: 1.65, maxWidth: 600, margin: '0 auto 16px', fontWeight: 500 }}>
            Designed for business owners to easily manage bills, cut costs, and protect store profits in simple English.
          </p>
          {/* animated underline */}
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #B4781C, transparent)', borderRadius: 99, margin: '0 auto' }} />
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
          {featuresList.map((feat, i) => (
            <FeatureCard key={feat.id} feat={feat} delayClass={delayClasses[i % delayClasses.length]} />
          ))}
        </div>
      </div>
    </section>
  );
}
