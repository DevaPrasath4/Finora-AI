import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2, Lock, FileCheck } from 'lucide-react';

const footerLinks = [
  {
    header: 'Core Features',
    section: 'features',
    items: ['Bill Photo Scanner', 'Duplicate Bill Alert', 'Stock Low Warning', 'Lowest Price Matcher', 'Easy GST Reports'],
  },
  {
    header: 'Solutions by Role',
    section: 'roles',
    items: ['Business Owners', 'Accountants & CAs', 'Cashiers & Billing Staff', 'Stock Managers', 'System Admins'],
  },
  {
    header: 'Platform & Access',
    section: 'pricing',
    items: ['Log In to Workspace', 'Create Business Account', 'Express API Backend', '24/7 AI Helper Chat'],
  },
];

export default function Footer({ onOpenModal }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email.trim().length > 3) setSubmitted(true);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{ backgroundColor: '#FFFDF7' }}>
      {/* Top CTA Banner */}
      <div style={{
        padding: '48px 40px',
        backgroundColor: '#FDF4E3',
        borderTop: '1px solid rgba(243,205,151,0.35)',
        borderBottom: '1px solid rgba(243,205,151,0.35)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 28,
        }}>
          <div style={{ flex: '1 1 280px' }}>
            <h3 style={{ color: '#0F172A', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
              Set Up FinSight for Your Business
            </h3>
            <p style={{ color: '#334155', fontSize: 15, maxWidth: 520, fontWeight: 500 }}>
              See beyond the numbers. Start managing your store bills, GST reports, and stock in under 3 minutes.
            </p>
          </div>

          <div style={{ flex: '1 1 320px', maxWidth: 480 }}>
            {submitted ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 14, borderRadius: 10,
                backgroundColor: '#FFFFFF', border: '1px solid rgba(243,205,151,0.5)',
              }}>
                <CheckCircle2 size={20} color="#B4781C" />
                <span style={{ color: '#B4781C', fontSize: 14, fontWeight: 700 }}>
                  Account Setup Initiated! Check your email to log in.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="email"
                  placeholder="Enter business email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  style={{
                    flex: 1, backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(243,205,151,0.4)', borderRadius: 10,
                    padding: '12px 16px', color: '#0F172A', fontSize: 14, outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '12px 20px', borderRadius: 10, fontSize: 14, whiteSpace: 'nowrap',
                    backgroundColor: '#F3CD97', color: '#0F172A', border: 'none',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span>Create Account</span>
                  <ArrowRight size={16} color="#0F172A" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div style={{ padding: '60px 40px 32px' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', gap: 48, marginBottom: 48,
        }}>
          {/* Brand col */}
          <div style={{ flex: '2 1 280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/favcon_logo.png" alt="Finora Logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
              <span style={{ color: '#0F172A', fontSize: 20, fontWeight: 800 }}>
                Finora
              </span>
            </div>
            <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, marginBottom: 20, maxWidth: 360, fontWeight: 500 }}>
              Smart Finance, Safer Business. Built for retail stores, shops, and growing businesses.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: Lock, label: 'Protected Accounts' },
                { icon: FileCheck, label: 'ISO Security Standards' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 8,
                  backgroundColor: '#FFFFFF', border: '1px solid rgba(243,205,151,0.3)',
                }}>
                  <Icon size={12} color="#B4781C" />
                  <span style={{ color: '#0F172A', fontSize: 11, fontWeight: 700 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ header, section, items }) => (
            <div key={header} style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ color: '#0F172A', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{header}</h4>
              {items.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(section)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: 0, fontFamily: 'inherit',
                    color: '#334155', fontSize: 14, fontWeight: 500,
                    transition: 'color 0.18s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#B4781C'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 24, borderTop: '1px solid rgba(243,205,151,0.3)', gap: 14,
        }}>
          <p style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>
            © {new Date().getFullYear()} Finora Platform. Smart Finance, Safer Business. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service', 'Security Audit'].map((item) => (
              <button key={item} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', color: '#334155', fontSize: 13, fontWeight: 500,
                transition: 'color 0.18s ease', padding: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#B4781C'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
