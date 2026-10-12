import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, UserCheck, ArrowLeft, Eye, EyeOff,
  CheckCircle2, Sparkles, Building2, ChevronRight, AlertCircle, Phone, Database
} from 'lucide-react';
import { authenticateUser, getStoredUsers } from '../services/dataService';

const availableRoles = [
  {
    id: 'owner',
    title: 'Business Owner (You)',
    sub: 'Full owner access to graphs, stock, billing & employee details',
    icon: '👑',
    color: '#F3CD97',
    badge: 'FULL ACCESS',
    imgSrc: '/assets/role_owner.png',
  },
  {
    id: 'accountant',
    title: 'Store Accountant / CA',
    sub: 'Manage GST filings, tax invoices, and profit/loss statements',
    icon: '📊',
    color: '#F3CD97',
    badge: 'TAX & BILLS',
    imgSrc: '/assets/role_accountant.png',
  },
  {
    id: 'billing',
    title: 'Store Cashier & Billing Executive',
    sub: 'Customer billing checkout, POS register, and retail sales',
    icon: '💳',
    color: '#F3CD97',
    badge: 'POS & BILLING',
    imgSrc: '/assets/role_billing.png',
  },
  {
    id: 'stock_manager',
    title: 'Stock & Inventory Manager',
    sub: 'Stock intake, inventory tracking, supplier orders & warehouse',
    icon: '📦',
    color: '#F3CD97',
    badge: 'STOCK & INVENTORY',
    imgSrc: '/assets/role_stock_manager.png',
  },
];

export default function LoginPage({
  onBack,
  initialRole = null,
  initialOwnerId = '',
  initialOwnerPass = '',
  onNavigateToDashboard,
}) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNum, setMobileNum] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dbUsers, setDbUsers] = useState([]);

  useEffect(() => {
    setDbUsers(getStoredUsers());
  }, []);

  useEffect(() => {
    if (initialRole) {
      const match = availableRoles.find(r => r.id === initialRole);
      if (match) setSelectedRole(match);
    }
  }, [initialRole]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
  };

  const handleMobileChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNum(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage('');

    if (!userId.trim()) {
      setIsLoggingIn(false);
      setErrorMessage('Please enter your registered Email or User ID.');
      return;
    }

    if (!password) {
      setIsLoggingIn(false);
      setErrorMessage('Please enter your account password.');
      return;
    }

    if (!mobileNum || mobileNum.length < 10) {
      setIsLoggingIn(false);
      setErrorMessage('Please enter your registered 10-digit mobile number.');
      return;
    }

    try {
      const result = await authenticateUser(userId, password, mobileNum);

      setTimeout(() => {
        setIsLoggingIn(false);
        if (result.success) {
          setIsSuccess(true);
          const loggedUserId = result.user?.user_id || userId;
          const loggedRole = result.user?.role || (selectedRole ? selectedRole.id : 'owner');
          // For owners: owner_id = their own user_id (data scope = their account)
          const loggedOwnerId = (loggedRole === 'owner')
            ? loggedUserId
            : (result.user?.owner_id || loggedUserId);
          const activeUserObj = {
            user_id: loggedUserId,
            owner_id: loggedOwnerId,
            company_name: result.user?.company_name || companyName,
            email: result.user?.email || userId,
            role: loggedRole,
            mobile_number: result.user?.mobile_number || mobileNum,
          };
          localStorage.setItem('finsight_active_user', JSON.stringify(activeUserObj));
          // Clear stale global (non-user-scoped) caches to prevent cross-user data bleed
          localStorage.removeItem('finsight_stock_inventory');
          localStorage.removeItem('finsight_ocr_invoices');
          localStorage.removeItem('finsight_customer_invoices');
          localStorage.removeItem('finsight_transactions');
          localStorage.removeItem('finsight_expenses');
          if (result.user?.company_name) setCompanyName(result.user.company_name);
          if (onNavigateToDashboard) {
            onNavigateToDashboard(loggedRole, result.user?.company_name || companyName, loggedUserId);
          }
        } else {
          setErrorMessage(result.message || 'Invalid Email, Password, or Mobile Number.');
        }
      }, 500);
    } catch (err) {
      setIsLoggingIn(false);
      setErrorMessage('Connection error. Please check your network and try again.');
    }
  };

  const handleReset = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard(selectedRole ? selectedRole.id : 'owner', companyName, userId || 'OWNER-USER');
    } else {
      setSelectedRole(null);
      setIsSuccess(false);
      onBack();
    }
  };

  // Determine current active banner image (Switches dynamically between 5 images)
  const currentBannerImg = selectedRole ? selectedRole.imgSrc : '/assets/login_default.png';
  const currentBannerTitle = selectedRole ? selectedRole.title : 'Simple Shop & Bill Protection';

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* ── Top Header Navigation Bar ─────────────────────────────── */}
      <header style={{
        height: 66, padding: '0 32px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(13,148,136,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 99,
            backgroundColor: '#F0FDFA', border: '1px solid rgba(13,148,136,0.3)',
            color: '#0D9488', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#CCFBF1'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0FDFA'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <ArrowLeft size={16} />
          <span>← Back to Home</span>
        </button>

        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/favcon_logo.png" alt="Finora Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
            Finora
          </span>
        </div>

        {/* Security Indicator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B4781C', fontWeight: 700, backgroundColor: '#FFFDF7', padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(243,205,151,0.5)' }}>
          <ShieldCheck size={14} color="#B4781C" />
          <span>Verified Secure Access</span>
        </div>
      </header>

      {/* ── Main Content Area ─────── */}
      <main style={{
        flex: 1, display: 'grid', gridTemplateColumns: '440px 1fr',
        height: 'calc(100vh - 66px)', overflow: 'hidden',
        backgroundColor: '#F8FAFC',
      }}>
        {/* Left Side Visual Banner (Dynamic Image Swap) */}
        <div style={{
          backgroundColor: '#0F172A', color: '#FFFFFF',
          padding: '32px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
        }}>
          {/* Top Title Badge */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <span className="mono-badge" style={{ backgroundColor: 'rgba(243,205,151,0.2)', color: '#F3CD97', border: '1px solid rgba(243,205,151,0.4)', marginBottom: 12, display: 'inline-flex' }}>
              🛡️ SAFE &amp; EASY LOGIN
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 8 }}>
              {currentBannerTitle}
            </h2>
            <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, fontWeight: 500 }}>
              Finora — Smart Finance, Safer Business. Keep your shop safe from wrong bills, duplicate payments, and lost profits.
            </p>
          </div>

          {/* Center Graphic Image (Swaps dynamically between the 5 generated images) */}
          <div style={{
            position: 'relative', zIndex: 10, margin: '20px 0',
            borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(243,205,151,0.3)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            backgroundColor: '#1E293B',
          }}>
            <img
              key={currentBannerImg}
              src={currentBannerImg}
              alt={currentBannerTitle}
              style={{
                width: '100%', height: 260, objectFit: 'cover', display: 'block',
                transition: 'opacity 0.3s ease',
              }}
              onError={(e) => {
                e.currentTarget.src = '/assets/hero_dashboard.png';
              }}
            />
            <div style={{
              padding: '12px 16px', backgroundColor: 'rgba(15,23,42,0.9)',
              backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(243,205,151,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#F3CD97" /> Smart Finance, Safer Business
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Instant Verification • Simple Business Interface
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 10, fontSize: 11, color: '#94A3B8' }}>
            Finora © 2026 • Encrypted Authentication
          </div>
        </div>

        {/* Right Side Login Terminal (Two-Step Flow) */}
        <div style={{
          padding: '40px 50px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 720, width: '100%', margin: '0 auto',
        }}>
          {!selectedRole ? (
            /* ── STEP 1: SHOW ONLY THE 4 ROLE BUTTONS ──────────────────── */
            <div>
              <div style={{ marginBottom: 28 }}>
                <span className="mono-badge" style={{ backgroundColor: '#F0FDFA', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)', marginBottom: 12, display: 'inline-flex' }}>
                  🔑 STEP 1 OF 2 • SELECT STORE ACCOUNT TYPE
                </span>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  Select Your Store Role to Log In
                </h1>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                  Choose your account type below to open your dedicated login terminal.
                </p>
              </div>

              {/* 4 Role Selection Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {availableRoles.map(role => (
                  <div
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    style={{
                      padding: 22, borderRadius: 16, cursor: 'pointer',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid rgba(13,148,136,0.2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#0D9488';
                      e.currentTarget.style.backgroundColor = '#F0FDFA';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(13,148,136,0.2)';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ fontSize: 26, width: 46, height: 46, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {role.icon}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                          backgroundColor: '#F0FDFA', color: role.color, border: `1px solid ${role.color}`,
                          fontFamily: 'monospace', textTransform: 'uppercase',
                        }}>
                          {role.badge}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                        {role.title}
                      </h3>
                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.45, marginBottom: 16 }}>
                        {role.sub}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 13, fontWeight: 700, color: '#0D9488',
                      paddingTop: 12, borderTop: '1px solid rgba(13,148,136,0.12)',
                    }}>
                      <span>Log In as {role.title.split(' ')[0]}</span>
                      <ChevronRight size={16} color="#0D9488" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !isSuccess ? (
            /* ── STEP 2: SHOW CREDENTIALS INPUT FORM FOR SELECTED ROLE ─── */
            <div>
              {/* Back to Role Selection Button */}
              <button
                onClick={() => setSelectedRole(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 99,
                  backgroundColor: '#F0FDFA', border: '1px solid rgba(13,148,136,0.3)',
                  color: '#0D9488', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#CCFBF1'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0FDFA'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <ArrowLeft size={16} />
                <span>← Back to Account Type Selection</span>
              </button>

              {/* Banner for Selected Role */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 16, borderRadius: 14,
                backgroundColor: '#F0FDFA', border: '1px solid rgba(13,148,136,0.3)',
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 26, width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {selectedRole.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    STEP 2 OF 2 • {selectedRole.badge}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                    Logging in as {selectedRole.title}
                  </div>
                </div>
              </div>

              {/* Form Header */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  Enter Account Credentials
                </h2>
                <p style={{ fontSize: 13, color: '#475569' }}>
                  Provide your User ID / Email, Password, and Registered Mobile Number to access the dashboard.
                </p>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    User ID / Registered Email Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your User ID or Email"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10,
                      border: '1px solid rgba(13,148,136,0.3)', backgroundColor: '#FFFFFF',
                      fontSize: 14, color: '#0F172A', outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Account Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your account password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 42px 12px 16px', borderRadius: 10,
                        border: '1px solid rgba(13,148,136,0.3)', backgroundColor: '#FFFFFF',
                        fontSize: 14, color: '#0F172A', outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Registered Mobile Number (Digits Only) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} color="#0D9488" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      required
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="Enter your 10-digit mobile number"
                      value={mobileNum}
                      onChange={handleMobileChange}
                      style={{
                        width: '100%', padding: '12px 16px 12px 42px', borderRadius: 10,
                        border: '1px solid rgba(13,148,136,0.3)', backgroundColor: '#FFFFFF',
                        fontSize: 14, color: '#0F172A', outline: 'none', fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div style={{
                    padding: 12, borderRadius: 8, backgroundColor: '#fee2e2',
                    border: '1px solid #fecdd3', color: '#b91c1c', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="liquid-btn liquid-btn-primary"
                  style={{
                    width: '100%', padding: 14, borderRadius: 12,
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  {isLoggingIn ? 'Verifying Credentials...' : `🔑 Verify & Log In as ${selectedRole.title.split(' ')[0]}`}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Authentication Successful!</h2>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>
                Welcome back to <strong>{companyName}</strong>. Opening your dashboard...
              </p>
              <button
                onClick={handleReset}
                className="liquid-btn liquid-btn-primary"
                style={{ padding: '12px 24px', borderRadius: 10 }}
              >
                Go to Store Dashboard →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
