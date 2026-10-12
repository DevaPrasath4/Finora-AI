import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import useScrollReveal from '../utils/useScrollReveal';

const testimonials = [
  {
    id: 1,
    name: 'Rajesh Patel',
    role: 'Owner, Metro Superstore (3 Locations)',
    text: "Finora's bill photo scanner saved our store 18 hours every week. Smart Finance, Safer Business! The vendor price matcher automatically flagged a 14% cheaper bulk supplier for our top-selling items.",
    stars: 5,
    tag: 'Retail & Grocery',
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    role: 'Finance Manager, Apex Hardware Supplies',
    text: "Finora's Duplicate Bill Check caught a ₹ 14,200 duplicate supplier invoice on our second day! It's like having a 24/7 helper watching over our shop bills.",
    stars: 5,
    tag: 'Hardware & Wholesale',
  },
  {
    id: 3,
    name: 'Vikram Sharma',
    role: 'Chartered Accountant & Business Advisor',
    text: 'Finora makes GST compliance and audit reports completely effortless for small business clients. The AI helper gives simple, clear cash flow guidance.',
    stars: 5,
    tag: 'Tax & Audit',
  },
];

export default function TestimonialsSection() {
  useScrollReveal();

  return (
    <section
      style={{
        padding: '88px 40px',
        backgroundColor: '#0F1117',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99, marginBottom: 14,
            backgroundColor: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>Loved by 5,000+ Shop Owners</span>
          </div>
          <h2 style={{
            color: '#F8FAFC', fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12,
          }}>
            Real Results for Small Business
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            Discover how owners, accountants, and inventory managers get Smart Finance, Safer Business with Finora.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {testimonials.map((t, i) => {
            const delayClass = i === 1 ? 'reveal-delay-1' : i === 2 ? 'reveal-delay-2' : '';
            return (
              <div
                key={t.id}
                className={`reveal ${delayClass}`}
                style={{
                  flex: '1 1 300px',
                  backgroundColor: '#161B22',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array.from({ length: t.stars }).map((_, idx) => (
                        <Star key={idx} size={16} color="#F59E0B" fill="#F59E0B" />
                      ))}
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#F3CD97', fontSize: 11, fontWeight: 700,
                    }}>{t.tag}</span>
                  </div>

                  <Quote size={28} color="rgba(243,205,151,0.25)" style={{ marginBottom: 12 }} />

                  <p style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 1.65, fontStyle: 'italic', marginBottom: 24 }}>
                    "{t.text}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#F3CD97', color: '#0F172A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16,
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.name}
                      <CheckCircle2 size={14} color="#4ade80" />
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
