import React, { useState, useEffect } from 'react';
import {
  Building2, Store, User, Lock, Bell, Shield,
  Users, Sliders, LogOut, CheckCircle2, AlertCircle,
  Save, Key, Smartphone, Mail, Globe, Clock, RefreshCw,
  Eye, EyeOff, ShieldCheck, Send, BarChart2, BellRing, TrendingUp, Loader2
} from 'lucide-react';
import { apiGetSettings, apiUpdateSettings, apiChangePassword, apiSendDailyReport, apiSendWeeklyReport, apiSendReminders, apiGetGrowthAdvice } from '../../services/api';

export default function SettingsModule({ companyName = 'Metro Superstore Ltd', ownerName = 'Business Owner', onLogout }) {
  const [activeTab, setActiveTab] = useState('business');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active User session info
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';
  const activeRole = activeUserSession.role || 'owner';

  // 1. Business Profile Form State
  const [bizForm, setBizForm] = useState({
    company_name: companyName,
    legal_name: `${companyName} Private Limited`,
    gstin: '33AABCM8291M1Z5',
    pan: 'AABCM8291M',
    business_type: 'Supermarket & FMCG Retail',
    registration_date: '2021-04-15',
  });

  // 2. Shop Information Form State
  const [shopForm, setShopForm] = useState({
    store_code: 'STORE-HQ-01',
    branch_name: 'Main Flagship Store - Anna Nagar',
    address: 'Plot 42, 2nd Avenue, Anna Nagar East, Chennai, Tamil Nadu 600102',
    phone: '+91 98765 43210',
    email: 'store@metrosuperstore.in',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    operating_hours: '08:00 AM - 10:30 PM (Mon-Sun)',
  });

  // 3. User Profile Form State
  const [userProfile, setUserProfile] = useState({
    name: ownerName,
    userId: activeUserId,
    email: activeUserSession.email || `${activeUserId}@finguard.ai`,
    phone: activeUserSession.mobile_number || '+91 98401 23456',
    role: activeRole,
  });

  // 4. Change Password State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // 5. Notification Preferences
  const [notifState, setNotifState] = useState({
    low_stock_alerts: true,
    fraud_detection_alerts: true,
    daily_sales_digest: true,
    tax_filing_reminders: true,
    email_notifications: true,
    sms_notifications: false,
  });

  // 6. Security Settings
  const [secState, setSecState] = useState({
    two_factor_auth: false,
    session_timeout_minutes: '60',
    enforce_strong_passwords: true,
    allow_multi_device_login: true,
    ip_whitelist_enabled: false,
  });

  // 7. Application Preferences
  const [appPref, setAppPref] = useState({
    theme: localStorage.getItem('finguard_theme') || 'dark',
    date_format: 'DD/MM/YYYY',
    auto_backup_enabled: true,
    invoice_prefix: 'INV-2026-',
    barcode_scanner_auto_submit: true,
  });

  // 8. Report Action Button States
  const [reportActions, setReportActions] = useState({
    daily: { loading: false, result: null },
    weekly: { loading: false, result: null },
    reminders: { loading: false, result: null },
    growth: { loading: false, result: null },
  });

  const setActionState = (key, loading, result = null) =>
    setReportActions(prev => ({ ...prev, [key]: { loading, result } }));

  const handleSendDailyReport = async () => {
    setActionState('daily', true);
    try {
      const res = await apiSendDailyReport();
      setActionState('daily', false, { success: true, message: res.message || '2-day report sent!' });
    } catch (err) {
      setActionState('daily', false, { success: false, message: err.message || 'Failed to generate report.' });
    }
  };

  const handleSendWeeklyReport = async () => {
    setActionState('weekly', true);
    try {
      const res = await apiSendWeeklyReport();
      setActionState('weekly', false, { success: true, message: res.message || 'Weekly report sent!' });
    } catch (err) {
      setActionState('weekly', false, { success: false, message: err.message || 'Failed to generate report.' });
    }
  };

  const handleSendReminders = async () => {
    setActionState('reminders', true);
    try {
      const res = await apiSendReminders();
      setActionState('reminders', false, { success: true, message: res.message || 'Reminders sent!' });
    } catch (err) {
      setActionState('reminders', false, { success: false, message: err.message || 'Failed to generate reminders.' });
    }
  };

  const handleGrowthAdvice = async () => {
    setActionState('growth', true);
    try {
      const res = await apiGetGrowthAdvice();
      setActionState('growth', false, {
        success: true,
        message: res.message || 'Growth advice and vendor comparison generated.',
        detail: res.advice,
        vendorComparison: res.vendorComparison,
      });
    } catch (err) {
      setActionState('growth', false, { success: false, message: err.message || 'Failed to generate advice.' });
    }
  };

  useEffect(() => {
    apiGetSettings()
      .then(res => {
        if (res && res.settings) {
          if (res.settings.business_profile) setBizForm(res.settings.business_profile);
          if (res.settings.shop_info) setShopForm(res.settings.shop_info);
          if (res.settings.notifications) setNotifState(res.settings.notifications);
          if (res.settings.security) setSecState(res.settings.security);
          if (res.settings.app_preferences) setAppPref(res.settings.app_preferences);
        }
      })
      .catch(err => console.warn('Settings load notice:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        business_profile: bizForm,
        shop_info: shopForm,
        notifications: notifState,
        security: secState,
        app_preferences: appPref,
      };
      await apiUpdateSettings(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New Password and Confirmation do not match.');
      return;
    }
    if (passForm.newPassword.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      return;
    }

    try {
      const res = await apiChangePassword(activeUserId, passForm.currentPassword, passForm.newPassword);
      if (res && res.success) {
        setPassSuccess('Password changed successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPassError(err.message || 'Failed to change password.');
    }
  };

  const navTabs = [
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'shop', label: 'Shop Information', icon: Store },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'security', label: 'Security Settings', icon: Shield },
    { id: 'roles', label: 'Role Management', icon: Users },
    { id: 'preferences', label: 'App Preferences', icon: Sliders },
    { id: 'logout', label: 'Logout System', icon: LogOut, danger: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
        borderRadius: 16, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)',
            color: 'var(--fg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sliders size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
              System & Store Settings
            </h1>
            <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', margin: '2px 0 0' }}>
              Manage business legal details, store locations, security preferences, and system RBAC roles.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            color: 'var(--fg-success)', fontSize: 13, fontWeight: 700,
          }}>
            <CheckCircle2 size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Main Settings Body with Vertical Nav Tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20,
        alignItems: 'flex-start',
      }}>
        {/* Navigation Tabs Menu */}
        <div style={{
          background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
          borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'logout') {
                    if (window.confirm('Are you sure you want to log out of Finora AI?')) {
                      if (onLogout) onLogout();
                    }
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: active ? 'var(--fg-accent-soft)' : 'transparent',
                  border: active ? '1px solid var(--fg-border-accent)' : '1px solid transparent',
                  color: tab.danger ? 'var(--fg-danger)' : (active ? 'var(--fg-accent)' : 'var(--fg-text-secondary)'),
                  fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={tab.danger ? 'var(--fg-danger)' : (active ? 'var(--fg-accent)' : 'var(--fg-text-muted)')} />
                <span style={{ flex: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div style={{
          background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
          borderRadius: 16, padding: 28, minHeight: 480,
        }}>
          {/* ── 1. BUSINESS PROFILE TAB ────────────────────────────────── */}
          {activeTab === 'business' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  🏢 Business Profile & Legal Identity
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Official registration info printed on customer receipts and tax invoices.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Brand / Display Name
                  </label>
                  <input
                    type="text"
                    value={bizForm.company_name}
                    onChange={e => setBizForm({ ...bizForm, company_name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Legal Registered Entity Name
                  </label>
                  <input
                    type="text"
                    value={bizForm.legal_name}
                    onChange={e => setBizForm({ ...bizForm, legal_name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    GSTIN Identification Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.gstin}
                    onChange={e => setBizForm({ ...bizForm, gstin: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.pan}
                    onChange={e => setBizForm({ ...bizForm, pan: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={bizForm.business_type}
                    onChange={e => setBizForm({ ...bizForm, business_type: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={bizForm.registration_date}
                    onChange={e => setBizForm({ ...bizForm, registration_date: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button type="submit" className="lc-liquid-btn" style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                  <Save size={15} style={{ marginRight: 6 }} /> Save Business Profile
                </button>
              </div>
            </form>
          )}

          {/* ── 2. SHOP INFORMATION TAB ────────────────────────────────── */}
          {activeTab === 'shop' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  🏪 Store & Branch Information
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Location and contact details for physical retail outlets.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Store Branch Code
                  </label>
                  <input
                    type="text"
                    value={shopForm.store_code}
                    onChange={e => setShopForm({ ...shopForm, store_code: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Branch / Location Name
                  </label>
                  <input
                    type="text"
                    value={shopForm.branch_name}
                    onChange={e => setShopForm({ ...shopForm, branch_name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Full Physical Store Address
                  </label>
                  <textarea
                    rows={2}
                    value={shopForm.address}
                    onChange={e => setShopForm({ ...shopForm, address: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Store Helpdesk Phone
                  </label>
                  <input
                    type="text"
                    value={shopForm.phone}
                    onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Store Contact Email
                  </label>
                  <input
                    type="email"
                    value={shopForm.email}
                    onChange={e => setShopForm({ ...shopForm, email: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={shopForm.operating_hours}
                    onChange={e => setShopForm({ ...shopForm, operating_hours: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button type="submit" className="lc-liquid-btn" style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                  <Save size={15} style={{ marginRight: 6 }} /> Save Store Information
                </button>
              </div>
            </form>
          )}

          {/* ── 3. USER PROFILE TAB ────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  👤 Active User Profile
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Currently logged in session identity and assigned system privileges.
                </p>
              </div>

              <div style={{
                background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 18,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, #F3CD97, #DCA052)',
                  color: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800,
                }}>
                  {activeRole === 'owner' ? '👑' : (activeRole === 'financier' || activeRole === 'accountant' ? '📊' : (activeRole === 'cashier' || activeRole === 'billing' ? '💳' : '📦'))}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                      {userProfile.name}
                    </h4>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                      background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                      border: '1px solid var(--fg-border-accent)', textTransform: 'uppercase',
                    }}>
                      {activeRole}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 4 }}>
                    User ID: <strong>{userProfile.userId}</strong> · {companyName}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--fg-bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--fg-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text-muted)', textTransform: 'uppercase' }}>Email Address</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-text-primary)', marginTop: 4 }}>{userProfile.email}</div>
                </div>
                <div style={{ background: 'var(--fg-bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--fg-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text-muted)', textTransform: 'uppercase' }}>Registered Mobile</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-text-primary)', marginTop: 4 }}>{userProfile.phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. CHANGE PASSWORD TAB ─────────────────────────────────── */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  🔒 Change Account Password
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Update your authentication credentials for secure dashboard access.
                </p>
              </div>

              {passError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--fg-danger)', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertCircle size={15} /> {passError}
                </div>
              )}

              {passSuccess && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                  color: 'var(--fg-success)', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <CheckCircle2 size={15} /> {passSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Current Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passForm.currentPassword}
                    onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passForm.newPassword}
                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passForm.confirmPassword}
                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="showPassToggle"
                    checked={showPass}
                    onChange={e => setShowPass(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="showPassToggle" style={{ fontSize: 12, color: 'var(--fg-text-secondary)', cursor: 'pointer' }}>
                    Show Passwords
                  </label>
                </div>
              </div>

              <div>
                <button type="submit" className="lc-liquid-btn" style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                  <Key size={15} style={{ marginRight: 6 }} /> Update Password
                </button>
              </div>
            </form>
          )}



          {/* ── 6. SECURITY SETTINGS TAB ────────────────────────────────── */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  🛡️ Security & Access Policies
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Enterprise security policies, session longevity, and multi-factor authorization.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                  padding: '14px 18px', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                      Two-Factor Authentication (2FA)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>
                      Require SMS / Authenticator app OTP during staff and owner logins.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={secState.two_factor_auth}
                    onChange={e => setSecState({ ...secState, two_factor_auth: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                  padding: '14px 18px', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                      Session Idle Timeout
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>
                      Automatically lock register or dashboard after inactivity.
                    </div>
                  </div>
                  <select
                    value={secState.session_timeout_minutes}
                    onChange={e => setSecState({ ...secState, session_timeout_minutes: e.target.value })}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
                    }}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes (Default)</option>
                    <option value="120">120 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <button onClick={handleSaveSettings} className="lc-liquid-btn" style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                  <Save size={15} style={{ marginRight: 6 }} /> Save Security Configuration
                </button>
              </div>
            </div>
          )}

          {/* ── 7. ROLE MANAGEMENT TAB ─────────────────────────────────── */}
          {activeTab === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  👥 Role-Based Access Control (RBAC) Architecture
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Granular permission sets enforced on backend API endpoints and frontend views.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    role: 'Business Owner (owner)',
                    icon: '👑',
                    badge: 'ROOT ADMIN',
                    desc: 'Unrestricted full access across all financial graphs, stock adjustments, customer POS, employee payroll, AI assistant, and store settings.',
                    modules: ['Dashboard Overview', 'Invoices & OCR Scan', 'Customer POS Billing', 'Expenses & Cash Out', 'Money Transactions', 'GST Compliance', 'Stock & Inventory (Full CRUD)', 'Vendor Management', 'Employee Creation & Management', 'AI Assistant', 'Settings'],
                  },
                  {
                    role: 'Financier / Store Accountant (financier)',
                    icon: '📊',
                    badge: 'FINANCE ONLY',
                    desc: 'Financial ledger maintenance, daily shop expense records, cash inflow/outflow reconciliation, and GST tax compliance filing.',
                    modules: ['Dashboard Overview (Finance View)', 'Daily Expenses Record', 'Transactions & Cash In', 'GST & Tax Compliance', 'Financial Audit Trail'],
                  },
                  {
                    role: 'Cashier & Billing Executive (cashier)',
                    icon: '💳',
                    badge: 'POS CHECKOUT',
                    desc: 'Fast customer checkout, barcode product search, cart creation, discount & tax calculations, bill printing, and read-only stock lookup.',
                    modules: ['POS Customer Billing', 'Bill & Receipt Generator', 'Stock Details Lookup (Read-Only)'],
                  },
                  {
                    role: 'Store & Stock Manager (store_manager)',
                    icon: '📦',
                    badge: 'INVENTORY ONLY',
                    desc: 'Warehouse stock intake, physical count updates, threshold alerts, supplier order management, and stock audit logs.',
                    modules: ['Remaining Stock (Full CRUD)', 'Live Stock Qty Adjustments', 'Vendor Supplier Details', 'Stock Movement Audit Logs'],
                  },
                ].map((r, idx) => (
                  <div key={idx} style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                    borderRadius: 12, padding: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)' }}>{r.role}</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                        background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                        border: '1px solid var(--fg-border-accent)',
                      }}>
                        {r.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {r.desc}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.modules.map((m, mi) => (
                        <span key={mi} style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6,
                          background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                          color: 'var(--fg-text-primary)', fontWeight: 500,
                        }}>
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 8. APPLICATION PREFERENCES TAB ─────────────────────────── */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                  ⚙️ Application Preferences
                </h3>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                  Configure user interface display formats, currency standards, and auto-backup schedules.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Default Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={appPref.invoice_prefix}
                    onChange={e => setAppPref({ ...appPref, invoice_prefix: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', display: 'block', marginBottom: 6 }}>
                    Date Display Format
                  </label>
                  <select
                    value={appPref.date_format}
                    onChange={e => setAppPref({ ...appPref, date_format: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                      color: 'var(--fg-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                  </select>
                </div>
              </div>

              <div>
                <button onClick={handleSaveSettings} className="lc-liquid-btn" style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                  <Save size={15} style={{ marginRight: 6 }} /> Save Preferences
                </button>
              </div>

              {/* ── AUTOMATED REPORT ACTIONS ─────────────────────────────── */}
              <div style={{ borderTop: '1px solid var(--fg-border)', paddingTop: 20, marginTop: 4 }}>
                <div style={{ marginBottom: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Send size={16} color="var(--fg-accent)" /> Automated Report Actions
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '4px 0 0' }}>
                    Generate reports, reminders, and growth advice from your store data.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                  {/* Button 1: 2-Day Report */}
                  <div style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)', borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={18} color="#818cf8" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Generate 2-Day Report</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)' }}>Analyze the last 48 hours</div>
                      </div>
                    </div>
                    {reportActions.daily.result && (
                      <div style={{
                        fontSize: 11, padding: '6px 10px', borderRadius: 8, fontWeight: 600,
                        background: reportActions.daily.result.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: reportActions.daily.result.success ? 'var(--fg-success)' : 'var(--fg-danger)',
                        border: `1px solid ${reportActions.daily.result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {reportActions.daily.result.success ? '✓' : '✗'} {reportActions.daily.result.message}
                      </div>
                    )}
                    <button
                      onClick={handleSendDailyReport}
                      disabled={reportActions.daily.loading}
                      className="lc-liquid-btn"
                      style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: reportActions.daily.loading ? 0.7 : 1 }}
                    >
                      {reportActions.daily.loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                      {reportActions.daily.loading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>

                  {/* Button 2: Weekly Report */}
                  <div style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)', borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={18} color="#34d399" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Weekly Report</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)' }}>7-day summary with AI insights</div>
                      </div>
                    </div>
                    {reportActions.weekly.result && (
                      <div style={{
                        fontSize: 11, padding: '6px 10px', borderRadius: 8, fontWeight: 600,
                        background: reportActions.weekly.result.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: reportActions.weekly.result.success ? 'var(--fg-success)' : 'var(--fg-danger)',
                        border: `1px solid ${reportActions.weekly.result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {reportActions.weekly.result.success ? '✓' : '✗'} {reportActions.weekly.result.message}
                      </div>
                    )}
                    <button
                      onClick={handleSendWeeklyReport}
                      disabled={reportActions.weekly.loading}
                      className="lc-liquid-btn"
                      style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: reportActions.weekly.loading ? 0.7 : 1 }}
                    >
                      {reportActions.weekly.loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                      {reportActions.weekly.loading ? 'Generating...' : 'Generate Weekly Report'}
                    </button>
                  </div>

                  {/* Button 3: Reminders */}
                  <div style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)', borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BellRing size={18} color="#fbbf24" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Business Action Reminders</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)' }}>Salary, pending bills, and low stock</div>
                      </div>
                    </div>
                    {reportActions.reminders.result && (
                      <div style={{
                        fontSize: 11, padding: '6px 10px', borderRadius: 8, fontWeight: 600,
                        background: reportActions.reminders.result.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: reportActions.reminders.result.success ? 'var(--fg-success)' : 'var(--fg-danger)',
                        border: `1px solid ${reportActions.reminders.result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {reportActions.reminders.result.success ? '✓' : '✗'} {reportActions.reminders.result.message}
                      </div>
                    )}
                    <button
                      onClick={handleSendReminders}
                      disabled={reportActions.reminders.loading}
                      className="lc-liquid-btn"
                      style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: reportActions.reminders.loading ? 0.7 : 1 }}
                    >
                      {reportActions.reminders.loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BellRing size={13} />}
                      {reportActions.reminders.loading ? 'Generating...' : 'Generate Reminders'}
                    </button>
                  </div>

                  {/* Button 4: Growth Advice */}
                  <div style={{
                    background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)', borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} color="#f87171" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Future Growth Advice</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)' }}>AI-powered growth strategies</div>
                      </div>
                    </div>
                    {reportActions.growth.result && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{
                          fontSize: 11, padding: '6px 10px', borderRadius: 8, fontWeight: 600,
                          background: reportActions.growth.result.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: reportActions.growth.result.success ? 'var(--fg-success)' : 'var(--fg-danger)',
                          border: `1px solid ${reportActions.growth.result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {reportActions.growth.result.success ? '✓' : '✗'} {reportActions.growth.result.message}
                        </div>
                        {reportActions.growth.result.vendorComparison && reportActions.growth.result.vendorComparison.length > 0 && (
                          <div style={{
                            background: 'rgba(243,205,151,0.06)', borderRadius: 8, padding: '8px 10px',
                            border: '1px solid var(--fg-border-accent)', fontSize: 11,
                          }}>
                            <div style={{ fontWeight: 800, color: 'var(--fg-accent)', marginBottom: 4 }}>
                              📊 Vendor Comparison Analysis:
                            </div>
                            {reportActions.growth.result.vendorComparison.map((v, i) => (
                              <div key={i} style={{ marginBottom: 3, color: 'var(--fg-text-primary)', lineHeight: 1.4 }}>
                                • <strong>{v.vendorName}</strong>: Total Billed ₹ {v.totalBilled.toLocaleString('en-IN')} (Trust Score: {v.trustScore}%) → <em style={{ color: 'var(--fg-text-secondary)' }}>{v.growthAdvice}</em>
                              </div>
                            ))}
                          </div>
                        )}
                        {reportActions.growth.result.detail && (
                          <div style={{
                            fontSize: 11, color: 'var(--fg-text-secondary)', lineHeight: 1.7,
                            background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                            border: '1px solid var(--fg-border)', whiteSpace: 'pre-line', maxHeight: 140, overflowY: 'auto',
                          }}>
                            {reportActions.growth.result.detail}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleGrowthAdvice}
                      disabled={reportActions.growth.loading}
                      className="lc-liquid-btn"
                      style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: reportActions.growth.loading ? 0.7 : 1, background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(239,68,68,0.4)' }}
                    >
                      {reportActions.growth.loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <TrendingUp size={13} />}
                      {reportActions.growth.loading ? 'Generating AI Advice...' : 'Get Growth Advice'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
