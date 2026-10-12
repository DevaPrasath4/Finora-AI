import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    { id: 'features', label: 'Easy Features' },
    { id: 'roles', label: 'Role Dashboards' },
    { id: 'ai-advisor', label: '24/7 AI Helper' },
    { id: 'roi', label: 'Savings & Profit' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: scrolled
        ? 'rgba(255,255,255,0.96)'
        : 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
      boxShadow: scrolled ? '0 4px 20px rgba(243,205,151,0.25)' : 'none',
      borderBottom: '1px solid rgba(243,205,151,0.3)',
    }}>
      {/* Main row */}
      <div style={{
        maxWidth: 1340, margin: '0 auto',
        padding: '0 40px',
        height: 66,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 32,
      }}>

        {/* Logo */}
        <button onClick={() => { navigate('/'); scrollTo('hero'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src="/favcon_logo.png" alt="Finora Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.4px' }}>
              Finora
            </div>
            <div style={{ fontSize: 9, color: '#B4781C', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
              Smart Finance, Safer Business
            </div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
          {links.map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: 700, color: '#0F172A',
              fontFamily: 'inherit',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFFDF7'; e.currentTarget.style.color = '#B4781C'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#0F172A'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => onOpenModal ? onOpenModal('login') : navigate('/login')}
            className="liquid-btn liquid-btn-secondary"
            style={{ padding: '9px 18px', fontSize: 13, borderRadius: 99, gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            <span style={{ color: '#0F172A', fontWeight: 800 }}>Log In</span>
          </button>
          <button
            onClick={() => onOpenModal ? onOpenModal('setup') : navigate('/signup')}
            className="liquid-btn liquid-btn-primary"
            style={{ padding: '9px 20px', fontSize: 13, borderRadius: 99 }}
          >
            <span style={{ color: '#0F172A', fontWeight: 800 }}>Set Up FinSight</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: '#FFFDF7', border: '1px solid rgba(243,205,151,0.5)',
              borderRadius: 8, padding: '8px', cursor: 'pointer',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Animated underline */}
      <div className="nav-line" />

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          padding: '12px 40px 20px',
          borderTop: '1px solid rgba(243,205,151,0.3)',
          background: 'rgba(255,255,255,0.98)',
          display: 'flex', flexDirection: 'column', gap: 4,
          animation: 'revealUp 0.25s ease both',
        }}>
          {[...links, { id: 'pricing', label: 'Get Started' }].map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 12px', borderRadius: 8, textAlign: 'left',
              fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'inherit',
              borderBottom: '1px solid rgba(243,205,151,0.2)',
            }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
