import React, { useState } from 'react';
import { Calculator, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

export default function RoiCalculator() {
  useScrollReveal();
  const [monthlyRevenue, setMonthlyRevenue] = useState(45000);
  const [invoiceCount, setInvoiceCount] = useState(250);

  const hoursSavedPerWeek = Math.round((invoiceCount * 0.14) + (monthlyRevenue / 18000));
  const invoiceEntryTimeSavedPercent = 94;

  return (
    <section
      id="roi"
      style={{
        padding: '88px 40px',
        backgroundColor: '#FFFDF7',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99, marginBottom: 14,
            backgroundColor: '#FDF4E3', border: '1px solid rgba(243,205,151,0.4)',
            color: '#F3CD97', fontSize: 13, fontWeight: 700,
          }}>
            <Calculator size={14} color="#F3CD97" />
            Efficiency Impact Estimator
          </div>
          <h2 style={{
            color: '#0F172A', fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12,
          }}>
            Operational Time &amp; Governance Analysis
          </h2>
          <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            Analyze how automated OCR parsing and real-time ledger reconciliation optimize weekly accounting workflows.
          </p>
        </div>

        {/* Main card */}
        <div
          className="reveal reveal-delay-1 gloss-card"
          style={{
            display: 'flex', flexWrap: 'wrap',
            borderRadius: 24,
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(243,205,151,0.35)',
            boxShadow: '0 12px 32px rgba(15,23,42,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* LEFT — Inputs */}
          <div style={{
            flex: '1 1 320px', padding: 36,
            borderRight: '1px solid rgba(243,205,151,0.25)',
          }}>
            <h3 style={{ color: '#0F172A', fontSize: 20, fontWeight: 800, marginBottom: 28 }}>
              Enterprise Parameters
            </h3>

            {/* Slider 1 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ color: '#334155', fontSize: 14, fontWeight: 600 }}>Monthly Revenue Volume</label>
                <span style={{ color: '#F3CD97', fontSize: 17, fontWeight: 800 }}>₹ {monthlyRevenue.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range" min="10000" max="250000" step="5000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F3CD97', cursor: 'pointer', height: 8, borderRadius: 4 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: '#64748B', fontSize: 11 }}>₹ 10,000</span>
                <span style={{ color: '#64748B', fontSize: 11 }}>₹ 2,50,000</span>
              </div>
            </div>

            {/* Slider 2 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ color: '#334155', fontSize: 14, fontWeight: 600 }}>Monthly Receipts &amp; Invoices</label>
                <span style={{ color: '#F3CD97', fontSize: 17, fontWeight: 800 }}>{invoiceCount} Docs</span>
              </div>
              <input
                type="range" min="50" max="2000" step="25"
                value={invoiceCount}
                onChange={(e) => setInvoiceCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F3CD97', cursor: 'pointer', height: 8, borderRadius: 4 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: '#64748B', fontSize: 11 }}>50 / mo</span>
                <span style={{ color: '#64748B', fontSize: 11 }}>2,000 / mo</span>
              </div>
            </div>

            {/* Note */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: 14, borderRadius: 12,
              backgroundColor: '#FDF4E3',
              border: '1px solid rgba(243,205,151,0.4)',
            }}>
              <Sparkles size={16} color="#F3CD97" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: '#0F172A', fontSize: 12, lineHeight: 1.55, margin: 0 }}>
                Automated OCR parsing reduces manual invoice data entry time from 4 minutes to under 2 seconds per document.
              </p>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div style={{
            flex: '1 1 320px', padding: 36,
            backgroundColor: '#FFFDF7',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <h3 style={{ color: '#0F172A', fontSize: 20, fontWeight: 800, marginBottom: 22 }}>
              Projected Operational Savings
            </h3>

            {/* Big stat */}
            <div style={{
              textAlign: 'center', padding: 24, borderRadius: 16,
              backgroundColor: '#FDF4E3',
              border: '1px solid rgba(243,205,151,0.4)',
              marginBottom: 24,
            }}>
              <p style={{ color: '#F3CD97', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Weekly Operational Hours Saved
              </p>
              <div style={{ color: '#0F172A', fontSize: 40, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
                {hoursSavedPerWeek}
                <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 6, color: '#F3CD97' }}>hrs/wk</span>
              </div>
              <p style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
                Reallocated directly to strategic core business growth
              </p>
            </div>

            {/* Metric cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  icon: Clock, color: '#F3CD97', bg: '#FFFDF7',
                  title: `${invoiceEntryTimeSavedPercent}% Faster OCR Verification`,
                  sub: 'Instant line-item & GST extraction',
                },
                {
                  icon: ShieldCheck, color: '#F3CD97', bg: '#FDF4E3',
                  title: 'Continuous Anomaly Governance',
                  sub: 'Automatic duplicate bill & fraud screening',
                },
              ].map(({ icon: Icon, color, bg, title, sub }) => (
                <div key={title} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 14, borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(243,205,151,0.25)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    backgroundColor: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div style={{ color: '#0F172A', fontSize: 14, fontWeight: 700 }}>{title}</div>
                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
