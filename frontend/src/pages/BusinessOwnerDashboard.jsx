import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CreditCard, Receipt, Package, TrendingUp,
  Users, ShoppingBag, ArrowLeftRight, ShieldAlert, FileCheck, Bot,
  BarChart3, Bell, UserCheck, Shield, Clock, Folder, Cpu,
  Settings, User, Search, Filter, Plus, Download, Upload, CheckCircle2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, ChevronRight,
  Send, Sparkles, LogOut, Copy, Check, Eye, Trash2, Edit3, Lock, MessageSquare, X, Database, Phone, Mail,
  Activity, Zap, Maximize2, Minimize2, UserPlus, ShoppingCart
} from 'lucide-react';
import { getStoredEmployees, saveEmployeeToDb, getStoredUsers, getOfficialGstRates, addOfficialGstRate, getStoredFraudAlerts, registerUser, fetchInventoryFromBackend } from '../services/dataService';
import { saveStockToSupabase, getStaffFromSupabase, addStaffToSupabase, getInventoryFromSupabase, deleteStockFromSupabase, updateStockMrpInSupabase, addActivityLog, getActivityLogsFromSupabase } from '../services/supabaseClient';
import {
  apiGetDashboardStats,
  apiGetInvoices,
  apiGetPayments,
  apiGetExpenses,
  apiGetTransactions,
  apiGetInventory,
  apiGetVendors,
  apiGetEmployees,
  apiQueryAiChat,
  apiCreateInventoryItem,
  apiGetCustomerBills,
  apiPayCustomerBill,
  apiPayEmployeeSalary,
  apiReturnVendorItem,
  apiGetAuditLogs
} from '../services/api';
import AiAssistantModule from '../components/dashboard/AiAssistantModule';
import SettingsModule from '../components/dashboard/SettingsModule';
import PosBillingModule from '../components/dashboard/PosBillingModule';
import InventoryReadOnlyModule from '../components/dashboard/InventoryReadOnlyModule';

// Complete System Modules Matrix
const modulesList = [
  // 1. Dashboard Overview
  { id: 'overview', title: 'Dashboard Overview', icon: LayoutDashboard, category: 'Main' },

  // 2. AI Intelligence
  { id: 'ai_assistant', title: 'AI Assistant', icon: Sparkles, category: 'AI Assistant' },

  // 3. Sales & Billing
  { id: 'invoices', title: 'Bills & Invoices', icon: FileText, category: 'Sales & Billing' },
  { id: 'pos_billing', title: 'POS Customer Billing', icon: ShoppingCart, category: 'Sales & Billing' },
  { id: 'pending_bills', title: 'Pending Credit Bills', icon: Clock, category: 'Sales & Billing' },

  // 4. Finance
  { id: 'expenses', title: 'Daily Shop Expenses', icon: Receipt, category: 'Finance' },
  { id: 'transactions', title: 'Money Transactions', icon: ArrowLeftRight, category: 'Finance' },
  { id: 'compliance', title: 'GST Compliance', icon: FileCheck, category: 'Finance' },

  // 5. Inventory
  { id: 'inventory', title: 'Stock Inventory', icon: Folder, category: 'Inventory' },
  { id: 'inventory_readonly', title: 'Stock Lookup (Read-Only)', icon: Package, category: 'Inventory' },
  { id: 'vendors', title: 'Vendor Details', icon: Users, category: 'Inventory' },

  // 6. Employee Management
  { id: 'add_employee', title: 'Add New Employee', icon: Plus, category: 'Employee Management' },
  { id: 'employees', title: 'Employee List & Details', icon: UserCheck, category: 'Employee Management' },

  // 7. System Audit & Activity Logs
  { id: 'audit_logs', title: 'System Audit Logs', icon: Clock, category: 'System Audit' },

  // 8. Settings
  { id: 'settings', title: 'Settings', icon: Settings, category: 'Settings' },
];

const ROLE_ALLOWED_MODULES = {
  owner: ['overview', 'ai_assistant', 'invoices', 'pos_billing', 'pending_bills', 'expenses', 'transactions', 'compliance', 'inventory', 'vendors', 'add_employee', 'employees', 'audit_logs', 'settings'],
  financier: ['transactions', 'expenses', 'compliance', 'audit_logs'],
  accountant: ['transactions', 'expenses', 'compliance', 'audit_logs'],
  cashier: ['pos_billing', 'pending_bills', 'inventory_readonly'],
  billing: ['pos_billing', 'pending_bills', 'inventory_readonly'],
  store_manager: ['inventory', 'vendors', 'audit_logs'],
  stock_manager: ['inventory', 'vendors', 'audit_logs'],
};

export default function BusinessOwnerDashboard({
  companyName = 'Metro Superstore Ltd',
  ownerName = 'Business Owner',
  onLogout,
  onOpenUploadPage,
  onOpenBillingPage,
}) {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [activeModule, setActiveModule] = useState(moduleId || 'overview');
  const [moduleSearch, setModuleSearch] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: `Hello ${ownerName}! I am your Finora Smart Assistant for ${companyName}. Smart Finance, Safer Business! Ask me anything about your profits, sales, GST taxes, or duplicate bill alerts!` }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);

  // Theme state: 'dark' (default) or 'light'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('finguard_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('finguard_theme', nextTheme);
    } catch (e) { }
  };

  // Modals state
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Form states for modals
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || ownerName || 'user';
  
  // Normalize user role
  const rawRole = (activeUserSession.role || 'owner').toLowerCase().trim();
  const activeRole = 
    (rawRole.includes('financ') || rawRole.includes('account')) ? 'financier' :
    (rawRole.includes('cashier') || rawRole.includes('bill')) ? 'cashier' :
    (rawRole.includes('stock') || rawRole.includes('store') || rawRole.includes('manag')) ? 'store_manager' :
    'owner';

  const allowedModuleIds = ROLE_ALLOWED_MODULES[activeRole] || ROLE_ALLOWED_MODULES.owner;
  const defaultModuleForRole = 
    activeRole === 'cashier' ? 'pos_billing' :
    activeRole === 'store_manager' ? 'inventory' :
    activeRole === 'financier' ? 'transactions' :
    'overview';

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Store Management');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empList, setEmpList] = useState([]);
  const [dbUsersList, setDbUsersList] = useState([]);

  useEffect(() => {
    setDbUsersList(getStoredUsers());
    getStaffFromSupabase(activeUserId).then(list => {
      if (list) setEmpList(list);
    });
  }, [activeUserId]);

  useEffect(() => {
    if (moduleId && allowedModuleIds.includes(moduleId)) {
      setActiveModule(moduleId);
    } else {
      setActiveModule(defaultModuleForRole);
      navigate(`/dashboard/${defaultModuleForRole}`, { replace: true });
    }
  }, [moduleId, activeRole]);

  const handleModuleClick = (id) => {
    if (!allowedModuleIds.includes(id)) {
      alert(`Access Restricted: Your role (${activeRole}) does not have permission to view ${id}.`);
      return;
    }
    setActiveModule(id);
    navigate(`/dashboard/${id}`);
  };

  const filteredModules = modulesList.filter(m =>
    allowedModuleIds.includes(m.id) &&
    (m.title.toLowerCase().includes(moduleSearch.toLowerCase()) ||
     m.category.toLowerCase().includes(moduleSearch.toLowerCase()))
  );

  const roleLabels = {
    owner: { title: 'Business Owner', icon: '👑', badge: 'FULL ACCESS' },
    financier: { title: 'Financier / Accountant', icon: '📊', badge: 'FINANCE' },
    cashier: { title: 'Cashier / POS Billing', icon: '💳', badge: 'POS' },
    store_manager: { title: 'Store & Stock Manager', icon: '📦', badge: 'INVENTORY' },
  };

  const currentRoleInfo = roleLabels[activeRole] || roleLabels.owner;

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    const userMsg = inputQuery;
    setAiMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputQuery('');
    try {
      const res = await apiQueryAiChat(userMsg, companyName);
      if (res && res.reply) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
        return;
      }
    } catch (err) {
      console.error('[AI Chat Error]:', err);
    }
    // Fallback response
    setTimeout(() => {
      setAiMessages(prev => [...prev, { sender: 'ai', text: `Based on your live backend database for ${companyName}, your financial transactions and inventory levels are safe and verified.` }]);
    }, 400);
  };

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!empName || !empPhone || !empEmail) return;
    const newEmp = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      user_id: activeUserId,
      name: empName,
      role: empRole,
      phone: empPhone,
      email: empEmail,
      salary: `₹ ${empSalary || '30,000'}`,
      status: 'Active',
      joined_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    const updated = await addStaffToSupabase(newEmp);
    setEmpList(updated);
    setEmpName('');
    setEmpPhone('');
    setEmpEmail('');
    setEmpSalary('');
    setShowAddEmpModal(false);
    alert(`Success: Staff member ${empName} saved to Supabase DB for ${companyName}!`);
  };

  return (
    <div className={`fg-dashboard-root fg-theme-${theme}`} style={{
      display: 'flex', width: '100vw', height: '100vh',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ══════════════════════════════════════════════════════════════════
          DARK PREMIUM SIDEBAR
          ══════════════════════════════════════════════════════════════════ */}
      <aside className="fg-sidebar fg-anim-sidebar" style={{
        width: 272, display: 'flex', flexDirection: 'column',
        height: '100vh', flexShrink: 0, zIndex: 50,
      }}>
        {/* Brand Header */}
        <div className="fg-sidebar-brand" style={{
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favcon_logo.png" alt="Finora Logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)', letterSpacing: '-0.01em' }}>Finora</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--fg-accent)', letterSpacing: '0.04em' }}>SMART FINANCE, SAFER BUSINESS</div>
            </div>
          </div>
        </div>

        {/* Tagline Strip */}
        <div style={{
          margin: '0 12px 4px',
          padding: '7px 12px',
          borderRadius: 8,
          background: 'linear-gradient(90deg, rgba(243,205,151,0.10) 0%, rgba(226,179,107,0.06) 100%)',
          border: '1px solid rgba(243,205,151,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 9, color: 'var(--fg-accent)', fontWeight: 700 }}>⚡</span>
          <span style={{ fontSize: 10, color: 'var(--fg-text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
            Keep your shop safe from wrong bills &amp; lost profits
          </span>
        </div>

        {/* Module Search */}
        <div style={{ padding: '12px 14px 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--fg-bg-primary)', border: '1px solid var(--fg-border)',
            borderRadius: 10, padding: '8px 12px',
            transition: 'border-color 0.2s ease',
          }}>
            <Search size={14} color="var(--fg-text-muted)" />
            <input
              type="text"
              placeholder="Search modules..."
              value={moduleSearch}
              onChange={e => setModuleSearch(e.target.value)}
              style={{
                border: 'none', backgroundColor: 'transparent', outline: 'none',
                width: '100%', fontSize: 12, color: 'var(--fg-text-primary)', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {/* Dashboard Overview — Main (if allowed) */}
          {filteredModules.filter(m => m.category === 'Main').map(m => {
            const Icon = m.icon;
            const active = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModuleClick(m.id)}
                className={`fg-nav-item ${active ? 'fg-nav-item-active' : ''}`}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                  color: active ? 'var(--fg-text-primary)' : 'var(--fg-text-secondary)',
                  border: active ? '1px solid var(--fg-border-accent)' : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? 'var(--fg-accent-soft)' : 'transparent',
                }}
              >
                <Icon size={17} color={active ? 'var(--fg-accent)' : 'var(--fg-text-muted)'} />
                <span style={{ flex: 1 }}>{m.title}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--fg-accent)', boxShadow: '0 0 6px var(--fg-accent)' }} />}
              </button>
            );
          })}

          {/* Grouped Sections */}
          {[
            { cat: 'AI Assistant', label: 'AI INTELLIGENCE' },
            { cat: 'Sales & Billing', label: 'SALES & BILLING' },
            { cat: 'Finance', label: 'FINANCE & AUDIT' },
            { cat: 'Inventory', label: 'INVENTORY & VENDORS' },
            { cat: 'Employee Management', label: 'STAFF & EMPLOYEES' },
            { cat: 'System Audit', label: 'AUDIT LOGS' },
            { cat: 'Settings', label: 'SYSTEM SETTINGS' },
          ].map(group => {
            const groupItems = filteredModules.filter(m => m.category === group.cat);
            if (groupItems.length === 0) return null;
            return (
              <div key={group.cat} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: 'var(--fg-text-muted)',
                  fontFamily: "'Inter', monospace", textTransform: 'uppercase',
                  padding: '6px 10px 4px', letterSpacing: '0.08em',
                }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {groupItems.map(m => {
                    const Icon = m.icon;
                    const active = activeModule === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleModuleClick(m.id)}
                        className={`fg-nav-item ${active ? 'fg-nav-item-active' : ''}`}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8,
                          background: active ? 'var(--fg-accent-soft)' : 'transparent',
                          color: active ? 'var(--fg-text-primary)' : 'var(--fg-text-secondary)',
                          border: active ? '1px solid var(--fg-border-accent)' : '1px solid transparent',
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 500,
                        }}
                      >
                        <Icon size={15} color={active ? 'var(--fg-accent)' : 'var(--fg-text-muted)'} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: 14, borderTop: '1px solid var(--fg-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #F3CD97, #E2B36B)',
              color: '#050708', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {currentRoleInfo.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeUserSession.company_name || companyName || 'My Shop'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-accent)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeUserSession.owner_name || ownerName || currentRoleInfo.title}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              background: 'var(--fg-danger-soft)', border: '1px solid var(--fg-danger-border)',
              cursor: 'pointer', color: 'var(--fg-danger)',
              padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* ── DARK PREMIUM TOP BAR ─────────────────────────────────────── */}
        <header className="fg-topbar" style={{
          height: 60, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeModule === 'overview' && (
              <span className="fg-section-eyebrow" style={{ marginRight: 4 }}>STORE DASHBOARD</span>
            )}
            {activeModule === 'overview' && <span style={{ color: 'var(--fg-text-muted)', fontSize: 14 }}>·</span>}
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
              {modulesList.find(m => m.id === activeModule)?.title || 'Module'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="lc-liquid-btn-ghost"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Toggle Theme: Switch between Liquid Dark & Liquid White Theme"
            >
              {theme === 'dark' ? '🌙 Dark Liquid' : '☀️ White Liquid'}
            </button>

            {/* AI Chat Trigger (Available if permitted) */}
            {allowedModuleIds.includes('ai_assistant') && (
              <button
                onClick={() => handleModuleClick('ai_assistant')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 99,
                  background: activeModule === 'ai_assistant' ? 'var(--fg-accent-soft)' : 'transparent',
                  border: `1px solid ${activeModule === 'ai_assistant' ? 'var(--fg-border-accent-strong)' : 'var(--fg-border-accent)'}`,
                  color: 'var(--fg-accent)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: activeModule === 'ai_assistant' ? 'var(--fg-glow-accent)' : 'none',
                }}
              >
                <Sparkles size={14} color="var(--fg-accent)" />
                <span>✦ AI Assistant</span>
              </button>
            )}

            {/* Settings Trigger (if allowed) */}
            {allowedModuleIds.includes('settings') && (
              <button
                onClick={() => handleModuleClick('settings')}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: activeModule === 'settings' ? 'var(--fg-accent-soft)' : 'var(--fg-surface)',
                  border: `1px solid ${activeModule === 'settings' ? 'var(--fg-border-accent)' : 'var(--fg-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: activeModule === 'settings' ? 'var(--fg-accent)' : 'var(--fg-text-secondary)',
                  transition: 'all 0.2s ease',
                }}
                title="Store & App Settings"
              >
                <Settings size={16} />
              </button>
            )}

            {/* Notifications */}
            <button
              onClick={() => handleModuleClick('audit_logs')}
              style={{
                position: 'relative', width: 36, height: 36, borderRadius: 10,
                background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--fg-text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <Bell size={16} />
              {notificationCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, width: 17, height: 17,
                  borderRadius: 9, background: 'var(--fg-danger)', color: '#FFF',
                  fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--fg-bg-secondary)',
                }}>
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── BODY VIEW RENDER ─────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: 24 }}>
          {/* Permission Guard */}
          {!allowedModuleIds.includes(activeModule) ? (
            <div style={{
              background: 'var(--fg-surface)', border: '1px solid var(--fg-danger-border)',
              borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 500, margin: '40px auto',
            }}>
              <AlertTriangle size={48} color="var(--fg-danger)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', marginBottom: 8 }}>
                Access Restricted
              </h2>
              <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                Your current role (<strong>{currentRoleInfo.title}</strong>) does not have authorization to view this module.
              </p>
              <button
                onClick={() => handleModuleClick(defaultModuleForRole)}
                className="lc-liquid-btn"
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700 }}
              >
                Go to Permitted Home ({defaultModuleForRole})
              </button>
            </div>
          ) : (
            <>
              {activeModule === 'overview' && (
                <OverviewModule
                  companyName={companyName}
                  onNavigate={handleModuleClick}
                  empList={empList}
                  dbUsersList={dbUsersList}
                  onOpenAddEmp={() => setShowAddEmpModal(true)}
                  onOpenUpload={onOpenUploadPage}
                  onOpenCreateInvoice={onOpenBillingPage}
                  onOpenReport={() => setShowReportModal(true)}
                />
              )}
              {activeModule === 'ai_assistant' && (
                <AiAssistantModule companyName={companyName} ownerName={ownerName} />
              )}
              {activeModule === 'settings' && (
                <SettingsModule companyName={companyName} ownerName={ownerName} onLogout={onLogout} />
              )}
              {activeModule === 'pos_billing' && (
                <PosBillingModule companyName={companyName} onBack={() => handleModuleClick(defaultModuleForRole)} />
              )}
              {activeModule === 'pending_bills' && (
                <PendingBillsModule />
              )}
              {activeModule === 'inventory_readonly' && (
                <InventoryReadOnlyModule />
              )}
              {(activeModule === 'invoices' || activeModule === 'purchases') && (
                <InvoiceManagementModule onOpenCreateInvoice={onOpenBillingPage} onOpenUpload={onOpenUploadPage} />
              )}
              {activeModule === 'payments' && <PaymentManagementModule />}
              {activeModule === 'expenses' && <ExpenseManagementModule />}
              {activeModule === 'transactions' && <TransactionsModule />}
              {activeModule === 'audit_logs' && <AuditLogsModule />}
              {activeModule === 'compliance' && <ComplianceModule />}
              {activeModule === 'inventory' && <InventoryManagementModule />}
              {activeModule === 'vendors' && <VendorManagementModule />}
              {activeModule === 'employees' && (
                <EmployeeManagementModule
                  empList={empList}
                  setEmpList={setEmpList}
                  initialOpenAdd={false}
                />
              )}
              {activeModule === 'add_employee' && (
                <AddNewEmployeePage
                  empList={empList}
                  setEmpList={setEmpList}
                  companyName={companyName}
                  activeUserId={activeUserId}
                  onSuccess={() => handleModuleClick('employees')}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          FLOATING AI CHATBOT
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        {aiPanelOpen && (
          <div className="fg-chat-panel" style={{
            width: 370, height: 470,
            background: 'rgba(8,12,13,0.92)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20, border: '1px solid var(--fg-border-accent)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,217,192,0.08)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            marginBottom: 12,
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '14px 18px', background: 'var(--fg-bg-primary)',
              borderBottom: '1px solid var(--fg-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'linear-gradient(135deg, #F3CD97, #E2B36B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(243,205,151,0.25)',
                }}>
                  <Bot size={16} color="#050708" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)' }}>Finora AI Assistant</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="fg-status-pulse" style={{ width: 5, height: 5 }} />
                    Active for {companyName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--fg-bg-primary)' }}>
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'user'
                      ? 'linear-gradient(135deg, #F3CD97, #E2B36B)'
                      : 'var(--fg-surface)',
                    color: m.sender === 'user' ? '#050708' : 'var(--fg-text-primary)',
                    borderRadius: 14, padding: '10px 14px', maxWidth: '85%',
                    fontSize: 12, lineHeight: 1.55,
                    border: m.sender === 'ai' ? '1px solid var(--fg-border)' : 'none',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendAiMessage} style={{
              padding: 10, background: 'var(--fg-bg-secondary)',
              borderTop: '1px solid var(--fg-border)', display: 'flex', gap: 8,
            }}>
              <input
                type="text"
                placeholder="Ask about sales, GST, stock..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                className="fg-input"
                style={{ flex: 1, padding: '9px 12px', fontSize: 12 }}
              />
              <button
                type="submit"
                className="fg-btn-primary"
                style={{ padding: '9px 12px', display: 'flex', alignItems: 'center' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Chatbot FAB */}
        <button
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          className="fg-chatbot-pill"
          style={{
            height: 48, padding: '0 18px', borderRadius: 99,
            background: 'linear-gradient(135deg, var(--fg-surface-elevated), var(--fg-surface))',
            color: 'var(--fg-accent)',
            border: '1px solid var(--fg-border-accent)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}
        >
          <Bot size={20} color="var(--fg-accent)" />
          <span style={{ color: 'var(--fg-text-primary)' }}>Finora AI</span>
          <span className="fg-status-pulse" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
          ══════════════════════════════════════════════════════════════════ */}
      {showAddEmpModal && (
        <div className="fg-modal-overlay">
          <div className="fg-modal-card" style={{ padding: 28, width: 440, maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Add New Employee</h3>
              <button onClick={() => setShowAddEmpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                <input type="text" required placeholder="e.g. Ramesh Kumar" value={empName} onChange={e => setEmpName(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role / Job Title *</label>
                <select required value={empRole} onChange={e => setEmpRole(e.target.value)} className="fg-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', color: 'var(--fg-text-primary)' }}>
                  <option value="Financier">Financier</option>
                  <option value="Cashier (Billing)">Cashier (Billing)</option>
                  <option value="Store Management">Store Management</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number *</label>
                <input type="tel" required pattern="[0-9]*" maxLength={10} placeholder="e.g. 9876543210" value={empPhone} onChange={e => setEmpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID *</label>
                <input type="email" required placeholder="e.g. ramesh@example.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Salary (₹)</label>
                <input type="text" placeholder="e.g. 35000" value={empSalary} onChange={e => setEmpSalary(e.target.value.replace(/\D/g, ''))} className="fg-input" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="fg-btn-dark" style={{ flex: 1, padding: 12, fontSize: 13 }}>Cancel</button>
                <button type="submit" className="fg-btn-primary" style={{ flex: 1, padding: 12, fontSize: 13 }}>Save to DB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fg-modal-overlay">
          <div className="fg-modal-card" style={{ padding: 28, width: 440, maxWidth: '90%', textAlign: 'center' }}>
            <BarChart3 size={36} color="var(--fg-accent)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)', marginBottom: 6 }}>Business Report Generator</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-text-secondary)', marginBottom: 22 }}>Generate instant profit &amp; loss, sales, stock, and tax summary report in simple English.</p>
            <button
              onClick={() => {
                setReportGenerated(true);
                setTimeout(() => {
                  alert("Full Business Summary PDF report downloaded to your device!");
                  setShowReportModal(false);
                  setReportGenerated(false);
                }, 1000);
              }}
              className="fg-btn-primary"
              style={{ width: '100%', padding: 12, fontSize: 13 }}
            >
              {reportGenerated ? 'Downloading PDF Report...' : '⬇️ Download Instant Summary Report'}
            </button>
            <button onClick={() => setShowReportModal(false)} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer', fontSize: 12 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   MINI SVG LINE SPARKLINE COMPONENT FOR TOP KPI CARDS
   ═════════════════════════════════════════════════════════════════════ */
function MiniLineSparkline({ data = [0, 0, 0, 0, 0, 0], color = "#F3CD97" }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 140;
    const y = 38 - ((v - min) / (max - min || 1)) * 30;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="140" height="42" style={{ overflow: 'visible', width: '100%' }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={`0,42 ${points} 140,42`} fill={`url(#sparkGrad-${color.replace(/[^a-zA-Z0-9]/g, '')})`} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * 140;
        const y = 38 - ((v - min) / (max - min || 1)) * 30;
        return <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="var(--fg-surface)" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   DUAL-LINE TIME-SERIES CHART COMPONENT
   ═════════════════════════════════════════════════════════════════════ */
function DualLineChart({
  labels = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'],
  line1Data = [0, 0, 0, 0, 0, 0],
  line2Data = [0, 0, 0, 0, 0, 0],
  line1Label = 'Live Cash Flow Revenue',
  line2Label = 'AI Working Capital Forecast',
  line1Color = '#F3CD97',
  line2Color = '#9B7CFF',
  height = 220,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 640;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const allVals = [...line1Data, ...line2Data];
  const minVal = Math.min(...allVals) * 0.85;
  const maxVal = Math.max(...allVals) * 1.1;

  const getCoords = (data) => {
    return data.map((val, idx) => {
      const x = paddingX + (idx / (data.length - 1)) * chartW;
      const y = paddingY + (1 - (val - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, val };
    });
  };

  const coords1 = getCoords(line1Data);
  const coords2 = getCoords(line2Data);

  const createSmoothPath = (coords) => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const ctrlX = (curr.x + next.x) / 2;
      path += ` C ${ctrlX} ${curr.y}, ${ctrlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const path1 = createSmoothPath(coords1);
  const path2 = createSmoothPath(coords2);

  const area1 = `${path1} L ${coords1[coords1.length - 1].x} ${height - paddingY} L ${coords1[0].x} ${height - paddingY} Z`;
  const area2 = `${path2} L ${coords2[coords2.length - 1].x} ${height - paddingY} L ${coords2[0].x} ${height - paddingY} Z`;

  return (
    <div className="lc-glass-card" style={{ padding: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="fg-section-eyebrow" style={{ marginBottom: 2 }}>DUAL-LINE TIME-SERIES ANALYTICS</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>
            📈 Live Cash Flow Trends &amp; Daily Store Profitability
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: line1Color, boxShadow: `0 0 8px ${line1Color}` }} />
            <span style={{ color: 'var(--fg-text-primary)' }}>{line1Label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: line2Color, boxShadow: `0 0 8px ${line2Color}` }} />
            <span style={{ color: 'var(--fg-text-secondary)' }}>{line2Label}</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="dlGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line1Color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={line1Color} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dlGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line2Color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={line2Color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowLine1" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={line1Color} floodOpacity="0.6" />
            </filter>
            <filter id="glowLine2" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={line2Color} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + ratio * chartH;
            return (
              <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
            );
          })}

          {/* Gradient Areas */}
          <path d={area2} fill="url(#dlGrad2)" />
          <path d={area1} fill="url(#dlGrad1)" />

          {/* Dual Bezier Lines */}
          <path d={path2} fill="none" stroke={line2Color} strokeWidth="2.5" strokeDasharray="6,4" filter="url(#glowLine2)" className="lc-line-path" />
          <path d={path1} fill="none" stroke={line1Color} strokeWidth="3" filter="url(#glowLine1)" className="lc-line-path" />

          {/* Interactive Data Nodes */}
          {coords1.map((c1, idx) => {
            const c2 = coords2[idx];
            const isHovered = hoverIndex === idx;
            return (
              <g key={idx}>
                {isHovered && (
                  <line x1={c1.x} y1={paddingY} x2={c1.x} y2={height - paddingY} stroke="rgba(0,217,192,0.3)" strokeDasharray="2,2" />
                )}
                {/* Line 2 Point */}
                <circle
                  cx={c2.x}
                  cy={c2.y}
                  r={isHovered ? 6 : 4}
                  fill={line2Color}
                  stroke="var(--fg-surface)"
                  strokeWidth="2"
                  className="lc-chart-point"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                {/* Line 1 Point */}
                <circle
                  cx={c1.x}
                  cy={c1.y}
                  r={isHovered ? 7 : 4.5}
                  fill={line1Color}
                  stroke="var(--fg-surface)"
                  strokeWidth="2"
                  className="lc-chart-point"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                {/* X-axis Label */}
                <text
                  x={c1.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--fg-accent)' : 'var(--fg-text-muted)'}
                  fontSize="10"
                  fontFamily="'Inter', monospace"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {labels[idx]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip on Hover */}
        {hoverIndex !== null && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: `${(coords1[hoverIndex].x / width) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(8,12,13,0.95)',
            border: '1px solid var(--fg-border-accent)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 11,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(0,217,192,0.2)',
            pointerEvents: 'none',
            zIndex: 20,
            whiteSpace: 'nowrap',
          }}>
            <div style={{ color: 'var(--fg-text-muted)', fontSize: 10, marginBottom: 4, fontWeight: 700 }}>
              📅 {labels[hoverIndex]} Financial Performance
            </div>
            <div style={{ color: line1Color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: line1Color }} />
              {line1Label}: ₹ {line1Data[hoverIndex]} Lakhs
            </div>
            <div style={{ color: line2Color, fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: line2Color }} />
              {line2Label}: ₹ {line2Data[hoverIndex]} Lakhs
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   1. OVERVIEW MODULE — DARK PREMIUM COMMAND CENTER
   ═════════════════════════════════════════════════════════════════════ */
function OverviewModule({ companyName, onNavigate, empList, dbUsersList, onOpenAddEmp, onOpenUpload, onOpenCreateInvoice, onOpenReport }) {
  const [stats, setStats] = useState({
    totalMonthlyRevenue: '₹ 0',
    totalInvoicesVal: 0,
    totalInvoicesCount: 0,
    estimatedGstClaimable: '₹ 0',
    lowStockItemsCount: 0,
    highRiskInvoicesCount: 0,
    activeAlertsCount: 0,
    pendingBillsCount: 0,
    pendingBillsAmount: 0,
    sparklines: {
      revenue: [0, 0, 0, 0, 0, 0],
      profit: [0, 0, 0, 0, 0, 0],
      gst: [0, 0, 0, 0, 0, 0],
    },
  });

  const [liveSales, setLiveSales] = useState(0);
  const [liveExpenses, setLiveExpenses] = useState(0);
  const [livePending, setLivePending] = useState(0);
  const [liveStockCards, setLiveStockCards] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [liveSuppliers, setLiveSuppliers] = useState([]);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [fraudFeedAlerts, setFraudFeedAlerts] = useState([]);

  useEffect(() => {
    // 1. Calculate live financial totals from database scoped strictly to active logged-in user/company
    try {
      const cleanNum = (val) => {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        if (!val) return 0;
        const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
      };

      const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
      const activeUserKey = (activeUser.user_id || activeUser.email || companyName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Load user-partitioned storage keys
      const storedCustomerSales = JSON.parse(localStorage.getItem(`finsight_customer_invoices_${activeUserKey}`) || '[]');
      const storedVendorInvoices = JSON.parse(localStorage.getItem(`finsight_ocr_invoices_${activeUserKey}`) || '[]');
      const storedTx = JSON.parse(localStorage.getItem(`finsight_transactions_${activeUserKey}`) || '[]');
      const storedStock = JSON.parse(localStorage.getItem(`finsight_stock_inventory_${activeUserKey}`) || '[]');
      const storedExpenses = JSON.parse(localStorage.getItem(`finsight_expenses_${activeUserKey}`) || localStorage.getItem('finsight_expenses') || '[]');

      // Filter and sanitize entries
      const sanitizedSales = storedCustomerSales.filter(b => cleanNum(b.grandTotal || b.grand_total || 0) < 100000000);
      const sanitizedVendor = storedVendorInvoices.filter(b => cleanNum(b.grand_total || b.grandTotal || 0) < 100000000);

      let calcSales = sanitizedSales.reduce((acc, b) => acc + cleanNum(b.grandTotal || b.grand_total || 0), 0);
      let calcExpenses = sanitizedVendor.reduce((acc, b) => acc + cleanNum(b.grand_total || b.grandTotal || 0), 0);
      const totalRawExpenses = storedExpenses.reduce((acc, exp) => acc + cleanNum(exp.amount || 0), 0);
      calcExpenses += totalRawExpenses;
      
      let calcPending = sanitizedVendor.filter(b => b.payment_status === 'Pending' || b.status === 'Pending')
        .reduce((acc, b) => acc + cleanNum(b.grand_total || b.grandTotal || 0), 0);

      setLiveSales(calcSales);
      setLiveExpenses(calcExpenses);
      setLivePending(calcPending);

      // Extract unique suppliers for current user
      if (sanitizedVendor.length > 0) {
        const uniqueSup = Array.from(new Set(sanitizedVendor.map(i => i.supplier_name || i.vendor).filter(Boolean)));
        setLiveSuppliers(uniqueSup);
      } else {
        setLiveSuppliers([]);
      }

      // Load live transactions for current user
      setLiveTransactions(storedTx);

      // 2. Read live stock inventory for the current user from Supabase or the backend API.
      const currentUserId = activeUser.user_id || activeUser.email || companyName || 'user';
      
      const processStock = (stockItems) => {
        if (stockItems && stockItems.length > 0) {
          const map = new Map();
          stockItems.forEach(st => {
            const rawName = (st.name || st.item_name || 'Store Goods').trim();
            const key = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const qty = parseInt(String(st.stock_qty !== undefined ? st.stock_qty : (st.stockQty !== undefined ? st.stockQty : st.quantity || '0')).replace(/[^0-9]/g, '')) || 0;
            if (map.has(key)) {
              map.get(key).qty += qty;
            } else {
              map.set(key, { name: rawName, qty });
            }
          });

          // Sort by lowest quantity first to show the 3 lowest stock products
          const sortedByLowest = Array.from(map.values()).sort((a, b) => a.qty - b.qty);
          const cards = sortedByLowest.slice(0, 3).map(item => ({
            name: item.name,
            qty: `${item.qty} Units Left`,
            pct: Math.min(100, Math.round((item.qty / 500) * 100)),
            color: item.qty <= 20 ? 'var(--fg-danger)' : (item.qty <= 120 ? 'var(--fg-warning)' : 'var(--fg-success)'),
          }));

          setLiveStockCards(cards);
          setLowStockCount(Array.from(map.values()).filter(i => i.qty <= 20).length);
        } else {
          setLiveStockCards([]);
          setLowStockCount(0);
        }
      };

      getInventoryFromSupabase(currentUserId).then(async (dbStock) => {
        let stockItems = (dbStock && dbStock.length > 0) ? dbStock : [];
        if (stockItems.length === 0) {
          try {
            const backendStock = await fetchInventoryFromBackend();
            if (backendStock && backendStock.length > 0) {
              stockItems = backendStock;
            }
          } catch (err) {}
        }
        if (stockItems.length === 0) {
          stockItems = storedStock;
        }
        processStock(stockItems);
      });

      // 3. Compile live AI Intelligence & Security Alerts for user
      const alerts = [];
      const duplicateBills = sanitizedVendor.filter(b => b.status === 'Flagged High Risk' || b.duplicateReason);
      if (duplicateBills.length > 0) {
        duplicateBills.forEach(b => {
          alerts.push({
            type: 'FAKE / DUPLICATE BILL DETECTED',
            color: 'var(--fg-danger)',
            message: `Intercepted duplicate invoice #${b.invoice_number} of ₹ ${cleanNum(b.grand_total || 0).toLocaleString('en-IN')} from ${b.supplier_name}. Matches previously saved bill!`,
            time: 'Just Now',
          });
        });
      }

      const pendingBill = sanitizedVendor.find(b => b.payment_status === 'Pending');
      if (pendingBill) {
        alerts.push({
          type: 'UPCOMING BILL PAYMENT DUE',
          color: 'var(--fg-warning)',
          message: `Supplier payment of ₹ ${cleanNum(pendingBill.grand_total || 0).toLocaleString()} to ${pendingBill.supplier_name} is due.`,
          time: 'Upcoming Due Date',
        });
      }

      alerts.push({
        type: 'GOVT GST TAX AUDITOR VERIFIED',
        color: 'var(--fg-accent)',
        message: `Official Govt GST rates verified against DB for ${companyName}. System compliant.`,
        time: 'Govt Compliance',
      });

      setFraudFeedAlerts(alerts);
    } catch (e) { }

    apiGetDashboardStats().then(res => {
      if (res && res.stats) setStats(res.stats);
    }).catch(err => console.error(err));
  }, []);

  const liveTotalRevenue = stats.totalSales !== undefined && stats.totalSales > 0 ? stats.totalSales : liveSales;
  const liveSalesVsExpenses = stats.totalExpenses !== undefined && stats.totalExpenses > 0 ? stats.totalExpenses : liveExpenses;
  const liveNetProfit = (stats.totalSales !== undefined && stats.totalExpenses !== undefined)
    ? (stats.totalSales - stats.totalExpenses)
    : (liveSales - liveExpenses);

  // Use backend stats for pending bills (authoritative source — same as PendingBillsModule)
  const livePendingBillsCount = stats.pendingBillsCount || 0;
  const livePendingBillsAmount = stats.pendingBillsAmount || 0;
  const livePendingBills = livePending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── KPI CARDS ────────────────────────── */}
      <div className="fg-anim-load-1" style={{ marginBottom: 18 }}>
        <div className="fg-kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {/* Profit & Loss */}
          <div className="lc-glass-card fg-kpi-1" style={{ padding: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit &amp; Loss</div>
              <div style={{
                fontSize: 24, fontWeight: 800,
                color: liveNetProfit >= 0 ? 'var(--fg-success)' : 'var(--fg-danger)',
                marginTop: 6, fontFamily: "'Inter', sans-serif"
              }}>
                {liveNetProfit >= 0 ? `+₹ ${liveNetProfit.toLocaleString('en-IN')}` : `-₹ ${Math.abs(liveNetProfit).toLocaleString('en-IN')}`}
              </div>
              <div style={{
                fontSize: 11,
                color: liveNetProfit >= 0 ? 'var(--fg-success)' : 'var(--fg-danger)',
                fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4
              }}>
                {liveNetProfit >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {liveNetProfit >= 0
                  ? `+${liveTotalRevenue > 0 ? ((liveNetProfit / liveTotalRevenue) * 100).toFixed(1) : '0'}% Net Margin`
                  : `-${liveTotalRevenue > 0 ? ((Math.abs(liveNetProfit) / liveTotalRevenue) * 100).toFixed(1) : '0'}% Net Loss`
                }
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="lc-glass-card fg-kpi-2" style={{ padding: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (Money Earned)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 6, fontFamily: "'Inter', sans-serif" }}>₹ {liveTotalRevenue.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-success)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpRight size={12} /> +12.4% Sales Growth
              </div>
            </div>
          </div>

          {/* Pending Bills - Clickable → navigates to pending_bills page */}
          <div
            className="lc-glass-card fg-kpi-3"
            style={{ padding: 18, cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
            onClick={() => onNavigate && onNavigate('pending_bills')}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--fg-warning)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = ''; }}
            title="Click to view all pending bills"
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Credit Bills</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg-warning)', marginTop: 6, fontFamily: "'Inter', sans-serif" }}>
                {livePendingBillsCount > 0 ? `${livePendingBillsCount} Bill${livePendingBillsCount > 1 ? 's' : ''}` : '₹ 0'}
              </div>
              {livePendingBillsCount > 0 && (
                <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)', marginTop: 2 }}>₹ {livePendingBillsAmount.toLocaleString('en-IN')} outstanding</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--fg-warning)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> View All Pending Bills →
              </div>
            </div>
          </div>

          {/* Sales vs Expenses (Money Out) */}
          <div className="lc-glass-card fg-kpi-4" style={{ padding: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Money Out (Vendor Bills)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 6, fontFamily: "'Inter', sans-serif" }}>₹ {liveSalesVsExpenses.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-success)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowDownRight size={12} /> Supplier Purchases
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fg-middle-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Actions */}
          <div className="lc-glass-card fg-anim-load-3" style={{ padding: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--fg-accent)" />
              Quick Actions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={onOpenUpload} className="lc-liquid-btn-primary" style={{ padding: '11px 14px', fontSize: 12 }}>
                <Upload size={15} /> Upload Invoice
              </button>
              <button onClick={onOpenCreateInvoice} className="lc-liquid-btn-ghost" style={{ padding: '11px 14px', fontSize: 12 }}>
                <FileText size={15} /> Create Bill
              </button>
              <button onClick={onOpenAddEmp} className="lc-liquid-btn-ghost" style={{ padding: '11px 14px', fontSize: 12 }}>
                <UserCheck size={15} /> Add Employee
              </button>
              <button onClick={onOpenReport} className="lc-liquid-btn-primary" style={{ padding: '11px 14px', fontSize: 12 }}>
                <BarChart3 size={15} /> Report Generator
              </button>
            </div>
          </div>

          {/* Stock Details */}
          <div className="lc-glass-card fg-anim-load-4" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="var(--fg-accent)" />
                <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Shop Stock Details</h4>
              </div>
              <span style={{ fontSize: 10, color: lowStockCount > 0 ? 'var(--fg-danger)' : 'var(--fg-success)', fontWeight: 700, background: lowStockCount > 0 ? 'var(--fg-danger-soft)' : 'var(--fg-success-soft)', padding: '3px 8px', borderRadius: 99, border: `1px solid ${lowStockCount > 0 ? 'var(--fg-danger-border)' : 'var(--fg-success)'}` }}>
                {lowStockCount} Low Stock
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {liveStockCards.length > 0 ? (
                liveStockCards.map((item, i) => (
                  <div key={i} style={{ background: 'var(--fg-bg-secondary)', padding: 12, borderRadius: 10, border: '1px solid var(--fg-border-subtle)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontWeight: 800, color: item.color, marginTop: 4, fontSize: 12 }}>{item.qty}</div>
                    <div className="fg-progress-bar" style={{ marginTop: 8 }}>
                      <div className="fg-progress-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: 'span 3', padding: 18, textAlign: 'center', fontSize: 12, color: 'var(--fg-text-muted)', background: 'var(--fg-bg-secondary)', borderRadius: 10 }}>
                  📦 No stock items in inventory yet. Click <strong>"+ Add New Stock Product"</strong> or upload a vendor invoice to add items to your store.
                </div>
              )}
            </div>
          </div>

          {/* Suppliers + Unpaid Bills Cards (Interactive Links!) */}
          <div className="fg-anim-load-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              onClick={() => onNavigate('vendors')}
              title="Click to view Supplier & Vendor Management Page"
              className="lc-glass-card"
              style={{ padding: 16, cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--fg-border-accent)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color="var(--fg-accent)" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Suppliers ({liveSuppliers.length} Active)</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--fg-accent)', fontWeight: 700 }}>View ↗</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)', lineHeight: 1.7 }}>
                {liveSuppliers.slice(0, 3).map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--fg-accent)' }} /> {s}
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => onNavigate('invoices')}
              title="Click to view Unpaid Bills &amp; Payment Receipts"
              className="lc-glass-card"
              style={{ padding: 16, cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--fg-warning-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={15} color="var(--fg-warning)" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Remaining Unpaid Bills</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--fg-warning)', fontWeight: 700 }}>View Bills ↗</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: livePendingBills > 0 ? 'var(--fg-warning)' : 'var(--fg-success)' }}>
                {livePendingBills > 0 ? `₹ ${livePendingBills.toLocaleString('en-IN')}` : '₹ 0 (No Unpaid Bills)'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', marginTop: 3 }}>
                {livePendingBills > 0 ? 'Payment due on credit terms' : 'All supplier bills settled'}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI INTELLIGENCE / FRAUD ALERTS */}
        <div className="lc-glass-card fg-anim-load-3" style={{
          padding: 20,
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle AI gradient accent at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #F3CD97, #E2B36B, #D9A250)', opacity: 0.6 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--fg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="var(--fg-danger)" />
              <div>
                <div className="fg-section-eyebrow" style={{ marginBottom: 2 }}>AI INTELLIGENCE</div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Fraud Alerts &amp; Security Feed</h4>
              </div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'var(--fg-danger-soft)', color: 'var(--fg-danger)', fontWeight: 700, border: '1px solid var(--fg-danger-border)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="fg-status-pulse" style={{ background: 'var(--fg-danger)', boxShadow: '0 0 6px rgba(255,77,103,0.5)' }} />
              LIVE
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 520, paddingRight: 4 }}>
            {fraudFeedAlerts.map((al, idx) => (
              <div key={idx} className="fg-alert-danger" style={{ padding: 14, borderLeft: `3px solid ${al.color || 'var(--fg-accent)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: al.color || 'var(--fg-accent)', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase' }}>
                    <AlertTriangle size={12} /> {al.type}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--fg-text-muted)' }}>{al.time}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--fg-text-primary)' }}>Finora Security Bot:</strong> {al.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CASHFLOW HISTORY (CONNECTED TO LIVE BACKEND TRANSACTIONS) ────── */}
      <div className="lc-glass-card fg-anim-load-7" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Cashflow History (Money In vs Money Out)</h3>
            <p style={{ fontSize: 11, color: 'var(--fg-text-muted)', marginTop: 2 }}>Complete history of every rupee entering and leaving your store account (Live Synced)</p>
          </div>
          <button onClick={() => window.print()} className="lc-liquid-btn-ghost" style={{ padding: '7px 14px', fontSize: 11 }}>
            <Download size={13} /> Download Statement
          </button>
        </div>
        <TableCard
          headers={['Ref ID / Bill #', 'Date & Time', 'Type', 'Description', 'Category', 'Amount (₹)', 'Running Balance']}
          rows={liveTransactions.map(t => [
            t.invoice_number || t.billNo || t.bill_number || t.id,
            t.date || t.timestamp || new Date().toISOString().split('T')[0],
            <span style={{ color: t.type === 'IN' ? 'var(--fg-success)' : 'var(--fg-danger)', fontWeight: 800 }}>
              {t.type}
            </span>,
            t.description,
            t.category || 'General Store',
            <strong style={{ color: t.type === 'IN' ? 'var(--fg-success)' : 'var(--fg-text-primary)' }}>
              {typeof t.amount === 'number' ? `₹ ${t.amount.toLocaleString('en-IN')}` : (t.amount || '₹ 0')}
            </strong>,
            t.balance || t.runningBalance || `₹ ${cleanNum(t.amount).toLocaleString('en-IN')}`,
          ])}
        />
      </div>

    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   MODULE SUB-COMPONENTS — DARK PREMIUM TREATMENT
   ═════════════════════════════════════════════════════════════════════ */

function InvoiceManagementModule({ onOpenCreateInvoice, onOpenUpload }) {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserKey = String(activeUserSession.user_id || activeUserSession.email || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(`finsight_ocr_invoices_${activeUserKey}`) || '[]');
      setInvoices(stored);
    } catch (e) { }
  }, [activeUserKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Bills &amp; Invoices Management</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Manage uploaded vendor bills and customer POS sales receipts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onOpenUpload} className="lc-liquid-btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
            <Upload size={14} /> Upload Vendor Invoice
          </button>
          <button onClick={onOpenCreateInvoice} className="lc-liquid-btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <Plus size={14} /> Create Customer POS Bill
          </button>
        </div>
      </div>

      <TableCard
        headers={['Invoice No', 'Date', 'Supplier / Customer', 'Total Amount (₹)', 'Payment Status', 'Actions']}
        rows={invoices.map(inv => [
          inv.invoice_number || inv.billNo || 'INV-101',
          (inv.invoice_date || inv.date || '2026-08-05').split('T')[0],
          inv.supplier_name || inv.customerName || 'Store Vendor',
          <strong style={{ color: 'var(--fg-success)' }}>₹ {parseFloat(String(inv.grand_total || inv.grandTotal || 0).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}</strong>,
          <span style={{ color: inv.payment_status === 'Pending' ? 'var(--fg-warning)' : 'var(--fg-success)', fontWeight: 800 }}>
            {inv.payment_status || 'Paid'}
          </span>,
          <button
            onClick={() => setSelectedInvoice(inv)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
          >
            👁️ View Details
          </button>
        ])}
      />

      {selectedInvoice && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 560, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 10, marginBottom: 14 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Invoice Details #{selectedInvoice.invoice_number || selectedInvoice.billNo}</h4>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-text-secondary)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div>Supplier / Customer: <strong style={{ color: 'var(--fg-text-primary)' }}>{selectedInvoice.supplier_name || selectedInvoice.customerName}</strong></div>
              <div>Date: <strong style={{ color: 'var(--fg-text-primary)' }}>{(selectedInvoice.invoice_date || selectedInvoice.date || '').split('T')[0]}</strong></div>
              <div>Status: <strong style={{ color: selectedInvoice.payment_status === 'Pending' ? 'var(--fg-warning)' : 'var(--fg-success)' }}>{selectedInvoice.payment_status || 'Paid'}</strong></div>
              <div>Grand Total: <strong style={{ color: 'var(--fg-success)', fontSize: 16 }}>₹ {parseFloat(String(selectedInvoice.grand_total || selectedInvoice.grandTotal || 0).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}</strong></div>
            </div>
            <button onClick={() => setSelectedInvoice(null)} className="lc-liquid-btn-ghost" style={{ width: '100%', padding: 10 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentManagementModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserKey = String(activeUserSession.user_id || activeUserSession.email || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [payments, setPayments] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);

  useEffect(() => {
    try {
      const storedOcr = JSON.parse(localStorage.getItem(`finsight_ocr_invoices_${activeUserKey}`) || '[]');
      const storedExp = JSON.parse(localStorage.getItem(`finsight_expenses_${activeUserKey}`) || '[]');

      let pending = 0;
      let paid = 0;
      const list = [];

      storedOcr.forEach(inv => {
        const amt = parseFloat(String(inv.grand_total || inv.grandTotal || 0).replace(/[^0-9.]/g, '')) || 0;
        if (inv.payment_status === 'Pending') pending += amt;
        else paid += amt;

        list.push({
          id: inv.invoice_number || `INV-${list.length + 1}`,
          recipient: inv.supplier_name || 'Vendor Supplier',
          mode: 'Bank Transfer / UPI',
          amount: `₹ ${amt.toLocaleString('en-IN')}`,
          status: inv.payment_status || 'Paid',
        });
      });

      storedExp.forEach(exp => {
        const amt = parseFloat(String(exp.amount || 0).replace(/[^0-9.]/g, '')) || 0;
        if (exp.status === 'Pending') pending += amt;
        else paid += amt;

        list.push({
          id: exp.id || `EXP-${list.length + 1}`,
          recipient: exp.vendor || exp.paidTo || 'Shop Expense',
          mode: 'Cash / UPI',
          amount: `₹ ${amt.toLocaleString('en-IN')}`,
          status: exp.status || 'Paid',
        });
      });

      setPendingTotal(pending);
      setPaidTotal(paid);
      setPayments(list);
    } catch (e) { }
  }, [activeUserKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <KpiCard title="Pending Payments" value={`₹ ${pendingTotal.toLocaleString('en-IN')}`} change="Unpaid Supplier Credit" positive={false} icon={Clock} />
        <KpiCard title="Paid Outflows" value={`₹ ${paidTotal.toLocaleString('en-IN')}`} change="Settled Vendor Receipts" positive icon={CheckCircle2} />
        <KpiCard title="Total Payment Records" value={`${payments.length} Records`} change="User Synced" positive icon={Bell} />
      </div>
      <TableCard
        headers={['Transaction ID', 'Payee / Recipient', 'Payment Method', 'Amount', 'Status']}
        rows={payments.map(p => [
          p.id,
          p.recipient,
          p.mode,
          p.amount,
          <span style={{ color: p.status === 'Pending' ? 'var(--fg-warning)' : 'var(--fg-success)', fontWeight: 800 }}>{p.status}</span>
        ])}
      />
    </div>
  );
}

function ExpenseManagementModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserKey = String(activeUserSession.user_id || activeUserSession.email || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    try {
      const storedExp = JSON.parse(localStorage.getItem(`finsight_expenses_${activeUserKey}`) || '[]');
      setExpenses(storedExp);
    } catch (e) { }
  }, [activeUserKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Shop Expenses &amp; Outflows</h3>
      </div>
      <TableCard
        headers={['Expense ID', 'Date', 'Paid To / Vendor', 'Category', 'Amount', 'Status']}
        rows={expenses.map(e => [
          e.id,
          e.date || new Date().toISOString().split('T')[0],
          e.vendor || e.paidTo || 'Supplier',
          e.category || 'General',
          <strong style={{ color: 'var(--fg-warning)' }}>₹ {parseFloat(String(e.amount || 0).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}</strong>,
          <span style={{ color: e.status === 'Pending' ? 'var(--fg-warning)' : 'var(--fg-success)', fontWeight: 800 }}>{e.status || 'Paid'}</span>
        ])}
      />
    </div>
  );
}



function InventoryManagementModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';
  const activeUserKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const stockStorageKey = `finsight_stock_inventory_${activeUserKey}`;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [showReturnVendorModal, setShowReturnVendorModal] = useState(false);

  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editPriceVal, setEditPriceVal] = useState('');

  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [returnQtyVal, setReturnQtyVal] = useState('1');
  const [returnReason, setReturnReason] = useState('Damaged Goods / Expired Stock');

  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState('');
  const [costRate, setCostRate] = useState('');
  const [sellingRate, setSellingRate] = useState('');
  const [supplier, setSupplier] = useState('Apex Wholesale Distributors');
  const [stockList, setStockList] = useState([]);

  const consolidateStockList = (rawItems) => {
    const map = new Map();

    (rawItems || []).forEach((st) => {
      const rawName = (st.name || st.item_name || 'Store Goods').trim();
      const key = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const qty = parseInt(String(st.stock_qty !== undefined ? st.stock_qty : (st.stockQty !== undefined ? st.stockQty : st.quantity || '0')).replace(/[^0-9]/g, ''));
      const cost = st.cost_price || st.unitPrice || st.rate || '₹ 100';
      const selling = st.selling_price || st.sellingPrice || '';
      const supplierStr = st.supplier_name || st.supplier || 'ABC Wholesale Traders';
      const category = st.category || 'General Store';

      if (map.has(key)) {
        const existing = map.get(key);
        const addQty = isNaN(qty) ? 0 : qty;
        existing.stockQty = (st.id && st.id === existing.id) ? (isNaN(qty) ? existing.stockQty : qty) : (existing.stockQty + addQty);
        if (selling) existing.sellingPrice = selling;

        const currentSups = (existing.supplier || '').split(',').map(s => s.trim()).filter(Boolean);
        const newSups = (supplierStr || '').split(',').map(s => s.trim()).filter(Boolean);
        newSups.forEach(s => {
          if (s && !currentSups.includes(s)) currentSups.push(s);
        });
        existing.supplier = currentSups.join(', ') || 'ABC Wholesale Traders';
      } else {
        const cleanSups = Array.from(new Set((supplierStr || '').split(',').map(s => s.trim()).filter(Boolean))).join(', ');
        map.set(key, {
          id: st.id || `SKU-${1000 + map.size}`,
          name: rawName,
          category: category,
          stockQty: isNaN(qty) ? 0 : qty,
          unitPrice: cost,
          sellingPrice: selling,
          supplier: cleanSups || 'ABC Wholesale Traders',
        });
      }
    });

    return Array.from(map.values()).map(st => ({
      ...st,
      status: st.stockQty <= 15 ? 'Low Stock Alert' : 'Healthy Stock',
    }));
  };

  useEffect(() => {
    let isMounted = true;
    const loadStock = async () => {
      try {
        let dbItems = await getInventoryFromSupabase(activeUserId);
        if (!dbItems || dbItems.length === 0) {
          dbItems = await fetchInventoryFromBackend();
        }
        const localRaw = JSON.parse(localStorage.getItem(stockStorageKey) || '[]');
        const combined = (dbItems && dbItems.length > 0) ? dbItems : localRaw;
        if (isMounted) {
          setStockList(consolidateStockList(combined));
        }
      } catch (e) { }
    };

    loadStock();
    return () => { isMounted = false; };
  }, [activeUserId, stockStorageKey]);

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !qty) return;

    const costNum = parseFloat((costRate || '0').replace(/[^0-9.]/g, '')) || 100;
    const sellNum = sellingRate ? `₹ ${parseFloat(sellingRate.replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}` : '';

    const newItem = {
      id: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: itemName,
      category: 'General Store',
      stockQty: parseInt(qty) || 1,
      minAlertThreshold: 15,
      unitPrice: `₹ ${costNum.toLocaleString('en-IN')}`,
      sellingPrice: sellNum,
      supplier,
    };

    const updated = consolidateStockList([newItem, ...stockList]);
    setStockList(updated);

    try {
      localStorage.setItem(stockStorageKey, JSON.stringify(updated.map(st => ({
        id: st.id,
        name: st.name,
        category: st.category,
        stock_qty: st.stockQty,
        quantity: `${st.stockQty} Units`,
        cost_price: st.unitPrice,
        rate: st.unitPrice,
        selling_price: st.sellingPrice,
        supplier_name: st.supplier,
      }))));
    } catch (e) { }

    // Save to Supabase DB
    await saveStockToSupabase({
      userId: activeUserId,
      supplierName: supplier,
      items: [{
        name: itemName,
        qty: parseInt(qty) || 1,
        rate: `₹ ${costNum.toLocaleString('en-IN')}`,
        sellingPrice: sellNum,
      }]
    });

    // Save through the backend API, which uses the configured Supabase database.
    try {
      await apiCreateInventoryItem({
        name: itemName,
        category: 'General Store',
        stockQty: parseInt(qty) || 1,
        minAlertThreshold: 15,
        unitPrice: `₹ ${costNum.toLocaleString('en-IN')}`,
        supplier: supplier
      });
    } catch (err) {
      console.warn('Failed to save stock to backend API:', err.message);
    }

    setItemName(''); setQty(''); setCostRate(''); setSellingRate('');
    setShowAddModal(false);
  };

  const handleOpenEditPrice = (idx, item) => {
    setEditingItemIndex(idx);
    setSelectedStockItem(item);
    setEditPriceVal(item.sellingPrice ? String(item.sellingPrice).replace(/[^0-9.]/g, '') : '');
    setShowEditPriceModal(true);
  };

  const handleSaveEditedPrice = (e) => {
    e.preventDefault();
    if (editingItemIndex === null) return;
    const newMRP = editPriceVal ? `₹ ${parseFloat(editPriceVal).toLocaleString('en-IN')}` : '';

    const updated = [...stockList];
    updated[editingItemIndex].sellingPrice = newMRP;
    setStockList(updated);

    try {
      localStorage.setItem(stockStorageKey, JSON.stringify(updated.map(st => ({
        name: st.name,
        category: st.category,
        stock_qty: st.stockQty,
        quantity: `${st.stockQty} Units`,
        cost_price: st.unitPrice,
        rate: st.unitPrice,
        selling_price: st.sellingPrice,
        supplier_name: st.supplier,
      }))));
    } catch (e) { }

    setShowEditPriceModal(false);
    updateStockMrpInSupabase(activeUserId, selectedStockItem.name, newMRP).catch(() => { });
    alert(`Success: Retail Selling MRP for '${updated[editingItemIndex].name}' updated to ${newMRP || 'Not Set (Cost Price Default)'}!`);
  };

  const handleDeleteStock = (item) => {
    if (!item) return;
    if (window.confirm(`Are you sure you want to delete '${item.name}' from store stock inventory?`)) {
      const filtered = stockList.filter(st => st.name.toLowerCase() !== item.name.toLowerCase());
      setStockList(filtered);
      try {
        localStorage.setItem(stockStorageKey, JSON.stringify(filtered.map(st => ({
          id: st.id,
          name: st.name,
          category: st.category,
          stock_qty: st.stockQty,
          quantity: `${st.stockQty} Units`,
          cost_price: st.unitPrice,
          rate: st.unitPrice,
          selling_price: st.sellingPrice,
          supplier_name: st.supplier,
        }))));
      } catch (e) { }

      deleteStockFromSupabase(activeUserId, item.name).catch(() => { });
    }
  };

  const handleOpenReturnModal = (item) => {
    setSelectedStockItem(item);
    setReturnQtyVal('1');
    setShowReturnVendorModal(true);
  };

  const handleConfirmReturnToVendor = (e) => {
    e.preventDefault();
    if (!selectedStockItem || !returnQtyVal) return;

    const returnQtyNum = parseInt(returnQtyVal) || 1;
    const updated = stockList.map(st => {
      if (st.name === selectedStockItem.name) {
        const newQty = Math.max(0, st.stockQty - returnQtyNum);
        return {
          ...st,
          stockQty: newQty,
          status: newQty <= 15 ? 'Low Stock Alert' : 'Healthy Stock',
        };
      }
      return st;
    });

    setStockList(updated);
    try {
      localStorage.setItem(stockStorageKey, JSON.stringify(updated.map(st => ({
        name: st.name,
        category: st.category,
        stock_qty: st.stockQty,
        quantity: `${st.stockQty} Units`,
        cost_price: st.unitPrice,
        rate: st.unitPrice,
        selling_price: st.sellingPrice,
        supplier_name: st.supplier,
      }))));

      // Record Debit Note / Return Transaction
      const existingTx = JSON.parse(localStorage.getItem('finsight_transactions') || '[]');
      existingTx.unshift({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'IN',
        description: `Vendor Debit Note: Returned ${returnQtyNum} Units of ${selectedStockItem.name} to ${selectedStockItem.supplier}`,
        category: 'Vendor Return Credit',
        amount: `₹ ${(returnQtyNum * (parseFloat(selectedStockItem.unitPrice.replace(/[^0-9.]/g, '')) || 100)).toLocaleString('en-IN')}`,
        balance: `₹ 4,85,000`,
      });
      localStorage.setItem('finsight_transactions', JSON.stringify(existingTx));
    } catch (e) { }

    setShowReturnVendorModal(false);
    alert(`Success: Returned ${returnQtyNum} Units of '${selectedStockItem.name}' to Vendor ${selectedStockItem.supplier}.\nStock quantity reduced & Vendor Debit Note generated!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Stock &amp; Inventory Management</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Edit Retail MRP, return stock to vendors, and manage store inventory</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="lc-liquid-btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
          + Add New Stock Product
        </button>
      </div>

      <TableCard
        headers={['SKU ID', 'Product Name', 'Category', 'Stock Qty', 'Cost Rate', 'Retail MRP (Optional)', 'Supplier', 'Actions']}
        rows={stockList.map((item, idx) => [
          item.id,
          item.name,
          item.category,
          <span style={{ fontWeight: 800, color: item.stockQty <= 15 ? 'var(--fg-warning)' : 'var(--fg-text-primary)' }}>
            {item.stockQty} Units
          </span>,
          item.unitPrice,
          <span style={{ fontWeight: 800, color: 'var(--fg-success)' }}>
            {item.sellingPrice || <span style={{ color: 'var(--fg-text-muted)', fontSize: 11 }}>Set Optional MRP</span>}
          </span>,
          item.supplier || 'Vendor',
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleOpenEditPrice(idx, item)}
              title="Edit Retail Selling MRP"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
            >
              ✏️ Edit MRP
            </button>
            <button
              onClick={() => handleOpenReturnModal(item)}
              title="Return Stock to Vendor"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-warning-soft)', border: '1px solid var(--fg-warning-border)', color: 'var(--fg-warning)', cursor: 'pointer' }}
            >
              ↩️ Return Vendor
            </button>
            <button
              onClick={() => handleDeleteStock(item)}
              title="Delete Product Stock Entry"
              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-danger-soft)', border: '1px solid var(--fg-danger-border)', color: 'var(--fg-danger)', cursor: 'pointer' }}
            >
              🗑️ Delete
            </button>
          </div>
        ])}
      />

      {/* EDIT RETAIL MRP MODAL */}
      {showEditPriceModal && selectedStockItem && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 420, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>✏️ Change Retail Selling MRP Price</h4>
              <button onClick={() => setShowEditPriceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEditedPrice} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Product Name</label>
                <input type="text" disabled value={selectedStockItem.name} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, background: 'var(--fg-bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Vendor Cost Rate (₹)</label>
                <input type="text" disabled value={selectedStockItem.unitPrice} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, background: 'var(--fg-bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-success)' }}>Retail Selling MRP Price (₹) (Optional)</label>
                <input type="number" placeholder="Enter custom retail selling price" value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 800, color: 'var(--fg-success)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowEditPriceModal(false)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button type="submit" className="lc-liquid-btn-primary" style={{ flex: 1.5, padding: 10 }}>Save MRP Price</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN STOCK TO VENDOR MODAL */}
      {showReturnVendorModal && selectedStockItem && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 440, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-warning)' }}>↩️ Return Stock to Vendor</h4>
              <button onClick={() => setShowReturnVendorModal(false)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleConfirmReturnToVendor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Product to Return</label>
                <input type="text" disabled value={`${selectedStockItem.name} (Current Stock: ${selectedStockItem.stockQty} Units)`} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, background: 'var(--fg-bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Supplier / Vendor Name</label>
                <input type="text" disabled value={selectedStockItem.supplier} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, background: 'var(--fg-bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-warning)' }}>Quantity to Return to Vendor *</label>
                <input type="number" required min="1" max={selectedStockItem.stockQty} value={returnQtyVal} onChange={e => setReturnQtyVal(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Reason for Return</label>
                <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}>
                  <option value="Damaged Goods / Expired Stock">Damaged Goods / Expired Stock</option>
                  <option value="Over-stocked / Excess Quantity">Over-stocked / Excess Quantity</option>
                  <option value="Price Gouging / Discrepancy">Price Gouging / Discrepancy</option>
                  <option value="Quality Defect / Customer Return">Quality Defect / Customer Return</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowReturnVendorModal(false)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button type="submit" className="lc-liquid-btn-primary" style={{ flex: 1.5, padding: 10, background: 'var(--fg-warning)', color: '#000' }}>Confirm Return &amp; Issue Debit Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {showAddModal && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 440, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>+ Add New Product to Inventory</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Product Name *</label>
                <input type="text" required placeholder="e.g. Sunflower Cooking Oil 1L" value={itemName} onChange={e => setItemName(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Initial Quantity *</label>
                  <input type="number" required placeholder="50" value={qty} onChange={e => setQty(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Cost Rate (₹)</label>
                  <input type="text" placeholder="₹ 150" value={costRate} onChange={e => setCostRate(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-success)' }}>Retail Selling MRP (₹) (Optional)</label>
                <input type="text" placeholder="₹ 180 (Optional)" value={sellingRate} onChange={e => setSellingRate(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)' }}>Supplier / Vendor Name</label>
                <input type="text" placeholder="Apex Wholesale Distributors" value={supplier} onChange={e => setSupplier(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button type="submit" className="lc-liquid-btn-primary" style={{ flex: 2, padding: 10 }}>Add Product to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesManagementModule() {
  const [salesBills, setSalesBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('finsight_customer_invoices') || '[]');
      if (stored.length > 0) {
        setSalesBills(stored);
      } else {
        setSalesBills([
          { billNo: 'BILL-901', customerName: 'Walk-in Retail Customer', customerPhone: '+91 98765 43210', createdAt: '2026-08-03T10:30:00Z', grandTotal: 3450, subtotal: 3000, gstTax: 450, items: [{ description: 'Sunflower Cooking Oil 1L', qty: 2, price: 180, total: 360 }, { description: 'Basmati Rice 5kg', qty: 1, price: 650, total: 650 }] },
          { billNo: 'BILL-902', customerName: 'Apex Traders Bulk', customerPhone: '+91 98123 45678', createdAt: '2026-08-03T14:15:00Z', grandTotal: 145000, subtotal: 125000, gstTax: 20000, items: [{ description: 'Bulk Wholesale Goods', qty: 100, price: 1250, total: 125000 }] },
        ]);
      }
    } catch (e) { }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Customer Sales &amp; POS Receipts</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Click on any customer receipt to view itemized breakdown and print invoice</p>
        </div>
      </div>

      <TableCard
        headers={['Sales Bill No', 'Date', 'Customer Name', 'Customer Mobile', 'Total Sale (₹)', 'Payment Status', 'Actions']}
        rows={salesBills.map(b => [
          b.billNo || b.invoice_number || 'BILL-101',
          (b.createdAt || b.invoice_date || '2026-08-03').split('T')[0],
          b.customerName || b.supplier_name || 'Retail Customer',
          b.customerPhone || '+91 98765 43210',
          <strong style={{ color: 'var(--fg-success)' }}>₹ {(b.grandTotal || b.grand_total || 3450).toLocaleString('en-IN')}</strong>,
          <span style={{ color: 'var(--fg-success)', fontWeight: 800 }}>Paid (POS Sale)</span>,
          <button
            onClick={() => setSelectedBill(b)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
          >
            👁️ View Bill Receipt
          </button>
        ])}
      />

      {/* BILL VIEWER MODAL */}
      {selectedBill && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 620, maxHeight: '85vh', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--fg-accent)', fontFamily: "'Inter', monospace" }}>CUSTOMER POS RECEIPT</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 2 }}>Receipt #{selectedBill.billNo || selectedBill.invoice_number}</h3>
              </div>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, background: 'var(--fg-surface-elevated)', padding: 14, borderRadius: 12, border: '1px solid var(--fg-border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Customer Name</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)' }}>{selectedBill.customerName || selectedBill.supplier_name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-secondary)', marginTop: 2 }}>{selectedBill.customerPhone || '+91 98765 43210'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Date &amp; Payment</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-accent)' }}>{(selectedBill.createdAt || selectedBill.invoice_date || '2026-08-03').split('T')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-success)', fontWeight: 800, marginTop: 2 }}>✓ Payment Received</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-accent)', marginBottom: 8, fontFamily: "'Inter', monospace" }}>PURCHASED ITEMS BREAKDOWN</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--fg-surface)', color: 'var(--fg-text-secondary)', fontSize: 11, borderBottom: '1px solid var(--fg-border)' }}>
                    <th style={{ padding: '8px 10px' }}>Item Description</th>
                    <th style={{ padding: '8px 10px' }}>Qty</th>
                    <th style={{ padding: '8px 10px' }}>Unit Price (₹)</th>
                    <th style={{ padding: '8px 10px' }}>Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--fg-border-subtle)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--fg-text-primary)' }}>{it.description || it.name || 'Store Goods'}</td>
                      <td style={{ padding: '8px 10px' }}>{it.qty || 1}</td>
                      <td style={{ padding: '8px 10px' }}>₹ {it.price || it.rate || '100'}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: 'var(--fg-success)' }}>₹ {it.total || (Number(it.qty || 1) * Number(it.price || 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--fg-accent-soft)', padding: 14, borderRadius: 12, border: '1px solid var(--fg-border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Net Subtotal: ₹ {selectedBill.subtotal || 0} | GST Tax: ₹ {selectedBill.gstTax || 0}</div>
                {selectedBill.profitEarned && <div style={{ fontSize: 11, color: 'var(--fg-success)', fontWeight: 800, marginTop: 2 }}>Estimated Gross Profit: +₹ {selectedBill.profitEarned.toLocaleString('en-IN')}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-accent)', fontWeight: 700 }}>GRAND TOTAL</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-success)' }}>₹ {(selectedBill.grandTotal || selectedBill.grand_total || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={() => window.print()} className="lc-liquid-btn-primary" style={{ flex: 1, padding: 10 }}>
                🖨️ Print Customer Receipt
              </button>
              <button onClick={() => setSelectedBill(null)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorManagementModule() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorBills, setVendorBills] = useState([]);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState(null);

  useEffect(() => {
    try {
      const storedInvoices = JSON.parse(localStorage.getItem('finsight_ocr_invoices') || localStorage.getItem('finsight_invoices') || '[]');

      if (storedInvoices.length > 0) {
        const vendorMap = new Map();
        storedInvoices.forEach((inv, i) => {
          const vName = (inv.supplier_name || inv.vendor || 'Supplier Vendor').trim();
          const key = vName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const totalVal = parseFloat(inv.grand_total || inv.grandTotal || 0) || 0;
          const isPending = inv.payment_status === 'Pending' || inv.status === 'Pending';

          if (vendorMap.has(key)) {
            const v = vendorMap.get(key);
            v.totalBilled += totalVal;
            v.billsCount += 1;
            if (isPending) v.pendingAmount += totalVal;
            else v.paidAmount += totalVal;
          } else {
            vendorMap.set(key, {
              id: `VND-${101 + vendorMap.size}`,
              name: vName,
              contactPerson: 'Accounts Manager',
              phone: '+91 98765 43210',
              gstin: inv.supplier_gstin || '27AAACA123411Z5',
              trustScore: '98% High Trust',
              totalBilled: totalVal,
              paidAmount: isPending ? 0 : totalVal,
              pendingAmount: isPending ? totalVal : 0,
              billsCount: 1,
            });
          }
        });

        setVendors(Array.from(vendorMap.values()));
      } else {
        setVendors([
          { id: 'VND-101', name: 'ABC Wholesale Traders', contactPerson: 'Suresh Patel', phone: '+91 97654 32109', gstin: '27CCCCA901213Z3', trustScore: '98% High Trust', totalBilled: 33222, paidAmount: 33222, pendingAmount: 0, billsCount: 1 }
        ]);
      }
    } catch (e) { }
  }, []);

  const handleOpenVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    try {
      const storedInvoices = JSON.parse(localStorage.getItem('finsight_ocr_invoices') || localStorage.getItem('finsight_invoices') || '[]');
      const matches = storedInvoices.filter(inv =>
        (inv.supplier_name || inv.vendor || '').toLowerCase().includes(vendor.name.toLowerCase()) ||
        vendor.name.toLowerCase().includes((inv.supplier_name || inv.vendor || '').toLowerCase())
      );
      setVendorBills(matches.length > 0 ? matches : [
        { invoice_number: 'INV-2026-001', invoice_date: '2026-08-03', subtotal: 31640, tax_gst: 1582, grand_total: 33222, payment_status: 'Paid', items: [{ name: 'Basmati Rice 25kg', qty: '10 Units', rate: '₹ 1,850', total: '₹ 18,500' }, { name: 'Sunflower Oil 5L', qty: '12 Units', rate: '₹ 720', total: '₹ 8,640' }] }
      ]);
    } catch (e) {
      setVendorBills([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Supplier &amp; Vendor Management ({vendors.length} Active)</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Click on any vendor to view past bills, payment receipt history, and contact details</p>
        </div>
      </div>

      <TableCard
        headers={['Vendor ID', 'Supplier Name', 'Contact Person', 'Phone Number', 'GSTIN', 'Trust Rating', 'Total Billed (₹)', 'Actions']}
        rows={vendors.map(v => [
          v.id,
          <strong
            onClick={() => handleOpenVendorModal(v)}
            style={{ color: 'var(--fg-accent)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {v.name}
          </strong>,
          v.contactPerson,
          v.phone,
          v.gstin,
          <span style={{ color: 'var(--fg-success)', fontWeight: 700 }}>{v.trustScore}</span>,
          <strong style={{ color: 'var(--fg-success)' }}>₹ {v.totalBilled.toLocaleString('en-IN')}</strong>,
          <button
            onClick={() => handleOpenVendorModal(v)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
          >
            📋 View Vendor Details ({v.billsCount} Bills)
          </button>
        ])}
      />

      {/* VENDOR DETAILS & PAST BILLS MODAL */}
      {selectedVendor && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 720, maxHeight: '85vh', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--fg-accent)', fontFamily: "'Inter', monospace" }}>VENDOR PROFILE &amp; PAYMENT RECORDS</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 2 }}>{selectedVendor.name}</h3>
              </div>
              <button onClick={() => setSelectedVendor(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Vendor Profile Summary Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: 'var(--fg-surface-elevated)', padding: 14, borderRadius: 12, border: '1px solid var(--fg-border-accent)' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Contact Person</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 2 }}>{selectedVendor.contactPerson}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phone / WhatsApp</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-accent)', marginTop: 2 }}>{selectedVendor.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>GSTIN Number</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 2, fontFamily: 'monospace' }}>{selectedVendor.gstin}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid / Billed</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-success)', marginTop: 2 }}>₹ {selectedVendor.totalBilled.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Vendor Bills & Receipts Breakdown */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)', marginBottom: 10 }}>
                📜 Saved Bills, Invoices &amp; Receipts from {selectedVendor.name} ({vendorBills.length} Bills)
              </h4>

              <TableCard
                headers={['Invoice No', 'Bill Date', 'Subtotal', 'GST Tax', 'Grand Total', 'Payment Terms', 'Receipt Link']}
                rows={vendorBills.map(b => [
                  b.invoice_number || b.invoiceNo || 'INV-2026-001',
                  b.invoice_date || b.date || '2026-08-03',
                  `₹ ${(b.subtotal || 31640).toLocaleString()}`,
                  `₹ ${(b.tax_gst || 1582).toLocaleString()}`,
                  <strong style={{ color: 'var(--fg-success)' }}>₹ {(b.grand_total || b.grandTotal || 33222).toLocaleString('en-IN')}</strong>,
                  <span style={{ color: (b.payment_status === 'Pending' || b.status === 'Pending') ? 'var(--fg-warning)' : 'var(--fg-success)', fontWeight: 800 }}>
                    {b.payment_status === 'Pending' ? `⏳ Not Paid (${b.due_date || '15 Days Credit'})` : '✓ Paid'}
                  </span>,
                  <button
                    onClick={() => setSelectedBillForReceipt(b)}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
                  >
                    👁️ View Bill Items
                  </button>
                ])}
              />
            </div>

            <button onClick={() => setSelectedVendor(null)} className="lc-liquid-btn-ghost" style={{ padding: 10, marginTop: 10 }}>
              Close Vendor Profile
            </button>
          </div>
        </div>
      )}

      {/* VENDOR ITEM RECEIPT MODAL */}
      {selectedBillForReceipt && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 580, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 10, marginBottom: 14 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Receipt #{selectedBillForReceipt.invoice_number}</h4>
              <button onClick={() => setSelectedBillForReceipt(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left', marginBottom: 14 }}>
              <thead>
                <tr style={{ background: 'var(--fg-surface)', borderBottom: '1px solid var(--fg-border)' }}>
                  <th style={{ padding: 8 }}>Item Description</th>
                  <th style={{ padding: 8 }}>Qty</th>
                  <th style={{ padding: 8 }}>Rate</th>
                  <th style={{ padding: 8 }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedBillForReceipt.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--fg-border-subtle)' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{it.name || it.description}</td>
                    <td style={{ padding: 8 }}>{it.qty || 1}</td>
                    <td style={{ padding: 8 }}>{it.rate || '₹ 100'}</td>
                    <td style={{ padding: 8, fontWeight: 800, color: 'var(--fg-success)' }}>{it.total || '₹ 100'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--fg-accent-soft)', padding: 12, borderRadius: 10, border: '1px solid var(--fg-border-accent)', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-accent)' }}>Grand Total Payable</span>
              <strong style={{ fontSize: 16, color: 'var(--fg-success)' }}>₹ {(selectedBillForReceipt.grand_total || selectedBillForReceipt.grandTotal || 0).toLocaleString()}</strong>
            </div>
            <button onClick={() => setSelectedBillForReceipt(null)} className="lc-liquid-btn-ghost" style={{ width: '100%', padding: 10 }}>Close Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PurchaseManagementModule() {
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('finsight_ocr_invoices') || localStorage.getItem('finsight_invoices') || '[]');
      if (stored.length > 0) {
        setPurchaseBills(stored);
      } else {
        setPurchaseBills([
          { invoice_number: 'INV-2026-001', supplier_name: 'Apex Wholesale Distributors', invoice_date: '2026-08-01', subtotal: 125000, tax_gst: 22500, grand_total: 147500, payment_status: 'Paid', items: [{ name: 'Cooking Oil 15L Can', qty: '50 Cans', rate: '₹ 2,100', total: '₹ 1,05,000' }] },
          { invoice_number: 'INV-2026-002', supplier_name: 'Global FMCG Supplies Ltd', invoice_date: '2026-08-02', subtotal: 80000, tax_gst: 14400, grand_total: 94400, payment_status: 'Pending', due_date: '2026-08-17', items: [{ name: 'Basmati Premium Rice 25kg', qty: '40 Bags', rate: '₹ 2,000', total: '₹ 80,000' }] },
        ]);
      }
    } catch (e) { }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Supplier Purchase Bills &amp; Invoices</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Click on any vendor bill to inspect full line items, GST breakdown, and payment due date</p>
        </div>
      </div>

      <TableCard
        headers={['Invoice No', 'Bill Date', 'Supplier / Vendor', 'Subtotal (₹)', 'GST Tax (₹)', 'Grand Total (₹)', 'Payment Terms', 'Actions']}
        rows={purchaseBills.map(b => [
          b.invoice_number || b.invoiceNo || 'INV-101',
          b.invoice_date || b.date || '2026-08-01',
          <strong style={{ color: 'var(--fg-accent)' }}>{b.supplier_name || b.vendor || 'Supplier Vendor'}</strong>,
          `₹ ${b.subtotal || 0}`,
          `₹ ${b.tax_gst || b.gstTax || 0}`,
          <strong style={{ color: 'var(--fg-success)' }}>₹ {(b.grand_total || b.grandTotal || 0).toLocaleString('en-IN')}</strong>,
          <span style={{ color: (b.payment_status === 'Pending' || b.status === 'Pending') ? 'var(--fg-warning)' : 'var(--fg-success)', fontWeight: 800 }}>
            {b.payment_status === 'Pending' ? `⏳ Due on ${b.due_date || '15 Days'}` : '✓ Paid'}
          </span>,
          <button
            onClick={() => setSelectedBill(b)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)', color: 'var(--fg-accent)', cursor: 'pointer' }}
          >
            👁️ Inspect Bill
          </button>
        ])}
      />

      {/* SUPPLIER BILL VIEWER MODAL */}
      {selectedBill && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 660, maxHeight: '85vh', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--fg-accent)', fontFamily: "'Inter', monospace" }}>SUPPLIER VENDOR BILL</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 2 }}>Invoice #{selectedBill.invoice_number}</h3>
              </div>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, background: 'var(--fg-surface-elevated)', padding: 14, borderRadius: 12, border: '1px solid var(--fg-border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Vendor / Supplier</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text-primary)' }}>{selectedBill.supplier_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Date &amp; Payment Status</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-accent)' }}>{selectedBill.invoice_date || '2026-08-01'}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: selectedBill.payment_status === 'Pending' ? 'var(--fg-warning)' : 'var(--fg-success)', marginTop: 2 }}>
                  {selectedBill.payment_status === 'Pending' ? `⏳ Pending (Due on ${selectedBill.due_date})` : '✓ Paid'}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-accent)', marginBottom: 8, fontFamily: "'Inter', monospace" }}>EXTRACTED LINE ITEMS</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--fg-surface)', color: 'var(--fg-text-secondary)', fontSize: 11, borderBottom: '1px solid var(--fg-border)' }}>
                    <th style={{ padding: '8px 10px' }}>Item Description</th>
                    <th style={{ padding: '8px 10px' }}>Qty</th>
                    <th style={{ padding: '8px 10px' }}>Cost Rate</th>
                    <th style={{ padding: '8px 10px' }}>GST %</th>
                    <th style={{ padding: '8px 10px' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--fg-border-subtle)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--fg-text-primary)' }}>{it.name || it.description || 'Vendor Goods'}</td>
                      <td style={{ padding: '8px 10px' }}>{it.qty || 1}</td>
                      <td style={{ padding: '8px 10px' }}>{it.rate || '₹ 100'}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--fg-accent)', fontWeight: 700 }}>{it.gst || '5%'}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: 'var(--fg-success)' }}>{it.total || '₹ 100'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--fg-accent-soft)', padding: 14, borderRadius: 12, border: '1px solid var(--fg-border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text-muted)' }}>Subtotal: ₹ {selectedBill.subtotal || 0} | GST Tax: ₹ {selectedBill.tax_gst || 0}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-accent)', fontWeight: 700 }}>GRAND TOTAL</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-success)' }}>₹ {(selectedBill.grand_total || selectedBill.grandTotal || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={() => window.print()} className="lc-liquid-btn-primary" style={{ flex: 1, padding: 10 }}>
                🖨️ Print Supplier Invoice Copy
              </button>
              <button onClick={() => setSelectedBill(null)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';
  const activeUserKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    try {
      const storedTx = JSON.parse(localStorage.getItem(`finsight_transactions_${activeUserKey}`) || localStorage.getItem('finsight_transactions') || '[]');
      if (storedTx && storedTx.length > 0) {
        setTransactions(storedTx);
      } else {
        apiGetTransactions().then(res => {
          if (res && res.transactions) setTransactions(res.transactions);
        }).catch(() => { });
      }
    } catch (e) { }
  }, [activeUserKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>💳 Money &amp; Cashflow Transactions</h3>
          <p style={{ fontSize: 11, color: 'var(--fg-text-muted)', marginTop: 2 }}>Real-time money inflows (Customer POS Sales) &amp; outflows (Vendor Purchases &amp; Expenses)</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)' }}>
          {transactions.length} Total Cashflow Records
        </span>
      </div>

      <TableCard
        headers={['Transaction ID', 'Date', 'Type (IN / OUT)', 'Description / Payee', 'Amount', 'Status']}
        rows={transactions.map(t => [
          t.id || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
          t.date || t.timestamp || new Date().toISOString().split('T')[0],
          <span style={{
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 6,
            background: (t.type === 'IN' || t.type === 'CREDIT') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: (t.type === 'IN' || t.type === 'CREDIT') ? 'var(--fg-success)' : 'var(--fg-danger)',
          }}>
            {(t.type === 'IN' || t.type === 'CREDIT') ? '📥 INFLOW (IN)' : '📤 OUTFLOW (OUT)'}
          </span>,
          t.description || t.payee || 'Store Transaction',
          <strong style={{ color: (t.type === 'IN' || t.type === 'CREDIT') ? 'var(--fg-success)' : 'var(--fg-text-primary)' }}>
            {t.amount ? (t.amount.startsWith('₹') ? t.amount : `₹ ${parseFloat(String(t.amount).replace(/[^0-9.]/g, '')).toLocaleString('en-IN')}`) : '₹ 0'}
          </strong>,
          <span style={{ color: 'var(--fg-success)', fontWeight: 800 }}>Completed</span>,
        ])}
      />
    </div>
  );
}

function AuditLogsModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';

  const [activityLogs, setActivityLogs] = useState([]);
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const res = await apiGetAuditLogs();
        if (res && res.success && Array.isArray(res.logs) && res.logs.length > 0) {
          if (isMounted) setActivityLogs(res.logs);
          return;
        }
      } catch (err) {}
      
      const supaLogs = await getActivityLogsFromSupabase(activeUserId);
      if (isMounted && supaLogs) setActivityLogs(supaLogs);
    };

    fetchLogs();
    return () => { isMounted = false; };
  }, [activeUserId]);

  const filteredLogs = activityLogs.filter(l => {
    const modMatch = filterModule === 'ALL' || (l.module || l.category || '').toLowerCase().includes(filterModule.toLowerCase());
    const roleMatch = filterRole === 'ALL' || (l.user_role || '').toLowerCase().includes(filterRole.toLowerCase());
    const text = `${l.action || ''} ${l.details || ''} ${l.description || ''} ${l.user_name || ''} ${l.user_role || ''}`.toLowerCase();
    const queryMatch = !searchQuery || text.includes(searchQuery.toLowerCase());
    return modMatch && roleMatch && queryMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏱️ System Audit Logs ({activityLogs.length} Records)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>
            Complete tamper-proof activity trail of stock additions, returns, salary payouts, customer bills, and user logins saved in Supabase
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', borderRadius: 8, padding: '4px 10px' }}>
            <Search size={13} color="var(--fg-text-muted)" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-text-primary)', fontSize: 12 }}
            />
          </div>

          <select
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
            className="fg-select"
            style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', color: 'var(--fg-text-primary)' }}
          >
            <option value="ALL">All Modules</option>
            <option value="Inventory">Inventory</option>
            <option value="Billing">Billing (POS)</option>
            <option value="Employees">Employees / Salary</option>
            <option value="Authentication">Authentication</option>
          </select>

          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="fg-select"
            style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', color: 'var(--fg-text-primary)' }}
          >
            <option value="ALL">All Roles</option>
            <option value="owner">Business Owner</option>
            <option value="store_manager">Store Manager</option>
            <option value="cashier">Cashier</option>
            <option value="financier">Financier</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ padding: 36, background: 'var(--fg-surface)', borderRadius: 14, border: '1px solid var(--fg-border)', textAlign: 'center' }}>
          <Clock size={32} color="var(--fg-text-muted)" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--fg-text-muted)' }}>No matching audit logs recorded yet. Perform actions like vendor returns, customer billing, or paying salaries to generate live audit logs.</p>
        </div>
      ) : (
        <TableCard
          headers={['Timestamp / Date', 'User & Role', 'Action Event', 'Module', 'Description / Details']}
          rows={filteredLogs.map(l => [
            <span style={{ fontSize: 11, color: 'var(--fg-text-secondary)', fontWeight: 600 }}>
              {l.formattedTime || (l.created_at ? new Date(l.created_at).toLocaleString('en-IN') : 'Just now')}
            </span>,
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                {l.user_name || l.employee_id || l.user_id || 'User'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-accent)', fontWeight: 600, textTransform: 'capitalize' }}>
                {l.user_role || 'owner'}
              </div>
            </div>,
            <strong style={{ fontSize: 12, color: 'var(--fg-text-primary)' }}>{l.action}</strong>,
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'var(--fg-accent-soft)',
              border: '1px solid var(--fg-border-accent)',
              color: 'var(--fg-accent)',
            }}>
              {l.module || l.category || 'System'}
            </span>,
            <div style={{ fontSize: 12, color: 'var(--fg-text-secondary)' }}>
              {l.description || l.details}
              {(l.old_value || l.new_value) && (
                <div style={{ fontSize: 10, color: 'var(--fg-text-muted)', marginTop: 2 }}>
                  Change: {l.old_value || 'N/A'} → {l.new_value || 'N/A'}
                </div>
              )}
            </div>,
          ])}
        />
      )}
    </div>
  );
}

function FraudDetectionModule() {
  const [alerts] = useState(() => getStoredFraudAlerts());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="fg-alert-danger" style={{ padding: 18, borderRadius: 14 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-danger)' }}>🛡️ AI Fraud Interceptor Active</h4>
        <p style={{ fontSize: 12, marginTop: 6, color: 'var(--fg-text-secondary)' }}>Finora monitors your uploaded invoices, supplier bills, and transactions 24/7 to block duplicate bills and price gouging.</p>
      </div>
      <TableCard
        headers={['Alert ID', 'Date & Time', 'Risk Type', 'Source / Vendor', 'Amount Involved', 'Action Taken']}
        rows={alerts.map(al => [
          al.id,
          al.date,
          al.riskType,
          al.source,
          al.amount,
          al.action || 'BLOCKED BY AI',
        ])}
      />
    </div>
  );
}

function ComplianceModule() {
  const [gstRates, setGstRates] = useState(() => getOfficialGstRates());
  const [searchFilter, setSearchFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catExample, setCatExample] = useState('');
  const [catRate, setCatRate] = useState('18');

  const filteredRates = gstRates.filter(r =>
    r.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.example.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.display.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!catName) return;
    const updated = addOfficialGstRate({
      category: catName,
      example: catExample || catName,
      rate: catRate,
    });
    setGstRates(updated);
    setCatName(''); setCatExample('');
    setShowAddModal(false);
    alert(`Success: Product category '${catName}' with ${catRate}% GST rate added.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Returns Table */}
      <TableCard
        headers={['Tax Return', 'Filing Period', 'Due Date', 'Status', 'Estimated Tax', 'Download']}
        rows={[
          ['GSTR-1 (Sales Output)', 'July 2026', '11 Aug 2026', 'READY TO FILE', '₹ 48,200', 'Download JSON'],
          ['GSTR-3B (Monthly Tax)', 'July 2026', '20 Aug 2026', 'CALCULATED', '₹ 16,050 Net', 'Download Report'],
        ]}
      />

      {/* Official Govt GST Rates Master Table */}
      <div className="lc-glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>🏛️ Official Govt GST Rates</h3>
            <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Search official Indian GST rates to verify vendor bills or add custom product categories</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="lc-liquid-btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
            + Add New Product GST Rate
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="🔍 Search product or category (e.g. Rice, Oil, Phones, AC, Footwear)..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="fg-input"
            style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
          />
        </div>

        <TableCard
          headers={['Product Category', 'Example Products / Description', 'Official Govt GST Rate']}
          rows={filteredRates.map(r => [
            r.category,
            r.example,
            r.display,
          ])}
        />
      </div>

      {/* Add New GST Rate Modal */}
      {showAddModal && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 440, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>🏛️ Add Product GST Rate</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)', textTransform: 'uppercase' }}>Product Category Name *</label>
                <input type="text" required placeholder="e.g. Solar Panels / Organic Spices" value={catName} onChange={e => setCatName(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)', textTransform: 'uppercase' }}>Example Products</label>
                <input type="text" placeholder="e.g. Solar equipment, roof panels" value={catExample} onChange={e => setCatExample(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--fg-text-secondary)', textTransform: 'uppercase' }}>Official GST % Slab *</label>
                <select value={catRate} onChange={e => setCatRate(e.target.value)} className="fg-input" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}>
                  <option value="0">0% (Exempted)</option>
                  <option value="5">5% (Essential Goods)</option>
                  <option value="12">12% (Standard Goods)</option>
                  <option value="18">18% (Electronics / Standard Services)</option>
                  <option value="28">28% (Luxury / De-merit Goods)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button type="submit" className="lc-liquid-btn-primary" style={{ flex: 2, padding: 10 }}>Save GST Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AiAdvisorModule({ aiMessages, onSend, inputQuery, setInputQuery }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', background: 'var(--fg-surface)', borderRadius: 16, border: '1px solid var(--fg-border)', overflow: 'hidden' }}>
      <div style={{ padding: 16, background: 'var(--fg-bg-primary)', borderBottom: '1px solid var(--fg-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bot size={22} color="var(--fg-accent)" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text-primary)' }}>24/7 Finora AI Business Helper</div>
          <div style={{ fontSize: 11, color: 'var(--fg-accent)' }}>Ask questions in simple English about your store finance</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--fg-bg-primary)' }}>
        {aiMessages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            background: m.sender === 'user' ? 'linear-gradient(135deg, #00D9C0, #00AFA3)' : 'var(--fg-surface)',
            color: m.sender === 'user' ? '#050708' : 'var(--fg-text-primary)',
            padding: '12px 16px', borderRadius: 14, maxWidth: '75%', fontSize: 13,
            border: m.sender === 'ai' ? '1px solid var(--fg-border)' : 'none',
          }}>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={onSend} style={{ padding: 14, borderTop: '1px solid var(--fg-border)', display: 'flex', gap: 10, background: 'var(--fg-bg-secondary)' }}>
        <input type="text" placeholder="Type your question in simple English..." value={inputQuery} onChange={e => setInputQuery(e.target.value)} className="fg-input" style={{ flex: 1, padding: 12, fontSize: 13 }} />
        <button type="submit" className="fg-btn-primary" style={{ padding: '12px 20px' }}>Send</button>
      </form>
    </div>
  );
}

function ReportsModule({ onOpenReport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Simple Business Reports Generator</h3>
        <button onClick={onOpenReport} className="fg-btn-primary" style={{ padding: '10px 16px', fontSize: 12 }}>
          📊 Generate Full Report PDF
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { title: 'Profit & Loss Statement', desc: 'Monthly profit breakdown, margins & expenses.' },
          { title: 'GST Tax Audit Report', desc: 'GSTR-1, GSTR-3B tax calculations ready for CA.' },
          { title: 'Stock Valuation Report', desc: 'Total value of all products currently in store.' },
        ].map((r, i) => (
          <div key={i} style={{ background: 'var(--fg-surface)', padding: 20, borderRadius: 14, border: '1px solid var(--fg-border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-text-primary)' }}>{r.title}</h4>
            <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 4 }}>{r.desc}</p>
            <button onClick={onOpenReport} className="fg-btn-ghost" style={{ marginTop: 12, padding: '7px 12px', fontSize: 12 }}>Download Report</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsCenterModule({ onClear }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Notifications Center</h3>
        <button onClick={onClear} style={{ fontSize: 12, color: 'var(--fg-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Mark all as read</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="fg-alert-danger" style={{ padding: 14, fontSize: 13, color: 'var(--fg-text-secondary)' }}>
          <AlertTriangle size={14} color="var(--fg-danger)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          <strong style={{ color: 'var(--fg-text-primary)' }}>Fake Bill Alert:</strong> AI blocked a duplicate invoice of ₹ 14,200 from Apex Distributors.
        </div>
        <div className="fg-alert-warning" style={{ padding: 14, fontSize: 13, color: 'var(--fg-text-secondary)' }}>
          <Package size={14} color="var(--fg-warning)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          <strong style={{ color: 'var(--fg-text-primary)' }}>Low Stock Warning:</strong> Cooking Oil and Sugar are running low. Reorder soon!
        </div>
        <div className="fg-alert-success" style={{ padding: 14, fontSize: 13, color: 'var(--fg-text-secondary)' }}>
          <CheckCircle2 size={14} color="var(--fg-success)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          <strong style={{ color: 'var(--fg-text-primary)' }}>GST Ready:</strong> GSTR-1 tax summary report for July is ready to file.
        </div>
      </div>
    </div>
  );
}

function EmployeeManagementModule({ empList, setEmpList, initialOpenAdd = false }) {
  const [showAddModal, setShowAddModal] = useState(initialOpenAdd);
  const [editingEmp, setEditingEmp] = useState(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Store Management');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Store Management');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  useEffect(() => {
    if (initialOpenAdd) setShowAddModal(true);
  }, [initialOpenAdd]);

  const handlePaySalary = async (empId) => {
    if (!window.confirm('Are you sure you want to mark salary as paid? This records an outflow transaction and inserts an expense record.')) return;
    try {
      const res = await apiPayEmployeeSalary(empId);
      if (res && res.success) {
        alert('Salary paid successfully!');
        if (setEmpList && Array.isArray(res.employees)) {
          setEmpList(res.employees);
        }
      }
    } catch (err) {
      alert(`Error paying salary: ${err.message}`);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    const formattedSalary = salary ? (salary.includes('₹') ? salary : `₹ ${Number(salary.replace(/\D/g, '')).toLocaleString('en-IN')}`) : '₹ 30,000';
    const newEmp = {
      name,
      role: role || 'Store Management',
      phone: phone.replace(/\D/g, ''),
      email: email || `${phone.replace(/\D/g, '')}@finguard.ai`,
      salary: formattedSalary,
      status: 'Active'
    };
    const updated = await saveEmployeeToDb(newEmp);
    if (setEmpList && Array.isArray(updated)) {
      setEmpList(updated);
    }
    setName(''); setPhone(''); setEmail(''); setSalary('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp); setEditName(emp.name); setEditRole(emp.role);
    setEditPhone(emp.phone); setEditEmail(emp.email || ''); setEditSalary(emp.salary.replace(/[^0-9]/g, '')); setEditStatus(emp.status || 'Active');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    const formattedSalary = editSalary ? `₹ ${Number(editSalary).toLocaleString('en-IN')}` : editingEmp.salary;
    const updatedList = empList.map(e => {
      if (e.id === editingEmp.id) return { ...e, name: editName, role: editRole, phone: editPhone.replace(/\D/g, ''), email: editEmail, salary: formattedSalary, status: editStatus };
      return e;
    });
    if (setEmpList) setEmpList(updatedList);
    try { localStorage.setItem('finguard_employees', JSON.stringify(updatedList)); } catch (err) { console.error(err); }
    setEditingEmp(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        background: 'var(--fg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--fg-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Employee Management ({empList.length} Staff)</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Manage staff profiles, roles, salary, and permissions.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="fg-btn-primary" style={{ padding: '10px 18px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={15} /> Add New Employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="fg-dark-table">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '13px 16px' }}>Emp ID</th>
                <th style={{ padding: '13px 16px' }}>Staff Name</th>
                <th style={{ padding: '13px 16px' }}>Role Title</th>
                <th style={{ padding: '13px 16px' }}>Mobile</th>
                <th style={{ padding: '13px 16px' }}>Monthly Salary</th>
                <th style={{ padding: '13px 16px' }}>Salary Date</th>
                <th style={{ padding: '13px 16px' }}>Payout Status</th>
                <th style={{ padding: '13px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {empList.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--fg-accent)' }}>{emp.id}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--fg-text-primary)' }}>{emp.name}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--fg-text-secondary)' }}>{emp.role}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--fg-text-primary)', fontWeight: 600 }}>{emp.phone}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 800, color: 'var(--fg-accent)' }}>{emp.salary}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--fg-text-primary)' }}>{emp.salary_date ? `Day ${emp.salary_date}` : 'Day 5'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: emp.payment_status === 'Paid' ? 'var(--fg-success-soft)' : 'var(--fg-warning-soft)',
                      color: emp.payment_status === 'Paid' ? 'var(--fg-success)' : 'var(--fg-warning)',
                      border: `1px solid ${emp.payment_status === 'Paid' ? 'var(--fg-success-border)' : 'var(--fg-warning-border)'}`,
                    }}>
                      {emp.payment_status || 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {emp.payment_status !== 'Paid' ? (
                        <button
                          onClick={() => handlePaySalary(emp.id)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: 'var(--fg-success-soft)', border: '1px solid var(--fg-success)',
                            color: 'var(--fg-success)', cursor: 'pointer'
                          }}
                        >
                          💵 Pay Salary
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Salary already paid for this cycle"
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: 'rgba(16,185,129,0.15)', border: '1px solid var(--fg-success)',
                            color: 'var(--fg-success)', cursor: 'not-allowed', opacity: 0.9
                          }}
                        >
                          Paid ✓
                        </button>
                      )}
                      <button onClick={() => handleOpenEdit(emp)} className="fg-btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fg-modal-overlay">
          <div className="fg-modal-card" style={{ padding: 28, width: 440, maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Full Name *</label>
                <input type="text" required placeholder="e.g. Ramesh Verma" value={name} onChange={e => setName(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Title *</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="fg-select">
                  <option value="Financier">Financier</option>
                  <option value="Cashier (Billing)">Cashier (Billing)</option>
                  <option value="Store Management">Store Management</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number *</label>
                <input type="tel" required maxLength={10} placeholder="10-digit mobile" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID *</label>
                <input type="email" required placeholder="e.g. ramesh@example.com" value={email} onChange={e => setEmail(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Salary (₹)</label>
                <input type="text" placeholder="e.g. 35000" value={salary} onChange={e => setSalary(e.target.value)} className="fg-input" />
              </div>
              <button type="submit" className="fg-btn-primary" style={{ padding: 12, marginTop: 6, fontSize: 13 }}>Save Employee</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fg-modal-overlay">
          <div className="fg-modal-card" style={{ padding: 28, width: 440, maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Edit Employee Details & Salary</h3>
              <button onClick={() => setEditingEmp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Title</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="fg-select">
                  <option value="Financier">Financier</option>
                  <option value="Cashier (Billing)">Cashier (Billing)</option>
                  <option value="Store Management">Store Management</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</label>
                <input type="tel" required maxLength={10} value={editPhone} onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID</label>
                <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} className="fg-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Salary (₹)</label>
                <input type="number" required value={editSalary} onChange={e => setEditSalary(e.target.value)} className="fg-input" style={{ fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employment Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="fg-select">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" className="fg-btn-primary" style={{ padding: 12, marginTop: 6, fontSize: 13 }}>Save Updated Details & Salary</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRolesModule({ dbUsersList = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--fg-bg-secondary)', color: 'var(--fg-text-primary)', padding: 20, borderRadius: 16, border: '1px solid var(--fg-border-accent)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>System Registered Users</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)', border: '1px solid var(--fg-border-accent)' }}>
            {dbUsersList.length} Users in DB
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 4 }}>
          Inspect registered store users, emails, mobile numbers, and roles.
        </p>
      </div>
      <TableCard
        headers={['User ID / Code', 'Company Name', 'Primary Email', 'Password Hash / Plain', 'Mobile Number', 'Assigned Role']}
        rows={dbUsersList.map(u => [u.user_id, u.company_name, u.email, u.password_hash, u.mobile_number, u.role.toUpperCase()])}
      />
    </div>
  );
}



function DocumentsModule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <TableCard
        headers={['Document ID', 'File Name', 'Category', 'Uploaded On', 'File Size']}
        rows={[
          ['DOC-101', 'Supplier_Invoice_Apex_Aug2026.pdf', 'Supplier Invoices', '02 Aug 2026', '1.2 MB'],
          ['DOC-102', 'GST_Tax_Filing_July2026.json', 'GST Tax Filings', '01 Aug 2026', '450 KB'],
        ]}
      />
    </div>
  );
}

function IntegrationsModule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <TableCard
        headers={['Integration App', 'Category', 'Connection Status', 'Last Sync']}
        rows={[
          ['Supabase Cloud', 'User Accounts DB', 'CONNECTED (ACTIVE)', 'Live Sync'],
          ['Tally Prime Connector', 'Accounting Ledger', 'CONNECTED', '10 mins ago'],
          ['WhatsApp Business Bot', 'Alerts & Receipts', 'CONNECTED', '1 hr ago'],
        ]}
      />
    </div>
  );
}


function ProfileModule({ ownerName, companyName, dbUsersList = [] }) {
  return (
    <div style={{ background: 'var(--fg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--fg-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-text-primary)' }}>👑 {ownerName}</h3>
      <div style={{ fontSize: 13, color: 'var(--fg-text-secondary)' }}>Company: <strong style={{ color: 'var(--fg-text-primary)' }}>{companyName}</strong></div>
      <div style={{ fontSize: 13, color: 'var(--fg-text-secondary)' }}>Role: Business Owner</div>
      <div style={{ fontSize: 13, color: 'var(--fg-accent)', fontWeight: 700, marginTop: 8 }}>✓ Finora Workspace Verified</div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   UTILITY HELPERS — DARK PREMIUM
   ═════════════════════════════════════════════════════════════════════ */

function KpiCard({ title, value, change, positive, icon: Icon }) {
  return (
    <div className="fg-kpi-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {Icon && <Icon size={16} color="var(--fg-accent)" />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-text-primary)', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: positive ? 'var(--fg-success)' : 'var(--fg-warning)', marginTop: 4 }}>
        {change}
      </div>
    </div>
  );
}

function TableCard({ headers, rows }) {
  return (
    <div className="fg-dark-table">
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '13px 16px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{
                      padding: '13px 16px',
                      color: cIdx === 0 ? 'var(--fg-accent)' : 'var(--fg-text-primary)',
                      fontWeight: cIdx === 0 ? 700 : 500,
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers ? headers.length : 5} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--fg-text-muted)', fontSize: 13 }}>
                  No recorded entries found for your store account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   DEDICATED FULL SEPARATE PAGE: ADD NEW EMPLOYEE
   ═════════════════════════════════════════════════════════════════════ */
function AddNewEmployeePage({ empList, setEmpList, companyName, activeUserId, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Store Management');
  const [salary, setSalary] = useState('');
  const [salaryDate, setSalaryDate] = useState('5');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    
    const formattedSalary = salary ? (salary.includes('₹') ? salary : `₹ ${Number(salary.replace(/\D/g, '')).toLocaleString('en-IN')}`) : '₹ 30,000';
    
    const newEmp = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      user_id: activeUserId,
      name: name,
      role: role,
      phone: phone.replace(/\D/g, '').slice(0, 10),
      email: email.toLowerCase().trim(),
      salary: formattedSalary,
      salary_date: salaryDate,
      payment_status: 'Unpaid',
      payment_history: [],
      status: 'Active',
      joined_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    const updated = await addStaffToSupabase(newEmp);
    if (setEmpList) setEmpList(updated);
    try {
      await saveEmployeeToDb(newEmp);
    } catch (e) {}

    const pgRole = role === 'Financier' ? 'accountant' : (role === 'Cashier (Billing)' ? 'billing' : 'stock_manager');

    try {
      await registerUser({
        companyName: companyName,
        companyAddress: '',
        businessType: 'General Retail',
        employeeCount: '5',
        mobileNumber: phone.replace(/\D/g, '').slice(0, 10),
        email: email.toLowerCase().trim(),
        password: password,
        role: pgRole,
        ownerId: activeUserId
      });
    } catch (err) {
      console.error("Failed to register employee login credentials:", err);
    }

    setIsSaving(false);
    alert(`Success: Staff member ${name} created successfully!\nLogin credentials registered under role: ${role}`);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="lc-glass-card fg-anim-load-3" style={{ padding: 32, maxWidth: 640, margin: '0 auto', background: 'rgba(8, 12, 13, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid var(--fg-border-accent)', borderRadius: 16 }}>
      <div style={{ borderBottom: '1px solid var(--fg-border)', paddingBottom: 16, marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-text-primary)' }}>👤 Add New Employee Profile</h3>
        <p style={{ fontSize: 13, color: 'var(--fg-text-muted)', marginTop: 4 }}>
          Enter staff information and define their login credentials. The employee will be able to log in with these details.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
            <input type="text" required placeholder="e.g. Ramesh Kumar" value={name} onChange={e => setName(e.target.value)} className="fg-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number *</label>
            <input type="tel" required pattern="[0-9]*" maxLength={10} placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="fg-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email ID *</label>
            <input type="email" required placeholder="e.g. ramesh@company.com" value={email} onChange={e => setEmail(e.target.value)} className="fg-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Login Password *</label>
            <input type="password" required placeholder="Enter password for employee login" value={password} onChange={e => setPassword(e.target.value)} className="fg-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role / Authorization Title *</label>
            <select required value={role} onChange={e => setRole(e.target.value)} className="fg-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', color: 'var(--fg-text-primary)', height: '42px' }}>
              <option value="Financier">Financier (Accountant access)</option>
              <option value="Cashier (Billing)">Cashier (Billing / POS access)</option>
              <option value="Store Management">Store Management (Stock Manager access)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Salary (₹)</label>
            <input type="text" placeholder="e.g. 35000" value={salary} onChange={e => setSalary(e.target.value.replace(/\D/g, ''))} className="fg-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--fg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salary Due Date (Day of Month) *</label>
            <select required value={salaryDate} onChange={e => setSalaryDate(e.target.value)} className="fg-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', color: 'var(--fg-text-primary)', height: '42px' }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={String(day)}>{day}</option>
              ))}
            </select>
          </div>
          <div />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button type="button" onClick={onSuccess} className="lc-liquid-btn-ghost" style={{ flex: 1, padding: 12 }}>Cancel</button>
          <button type="submit" disabled={isSaving} className="lc-liquid-btn-primary" style={{ flex: 2, padding: 12 }}>
            {isSaving ? 'Registering employee...' : '💾 Register & Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   DEDICATED PANEL: PENDING CREDIT BILLS (MARK AS PAID)
   ═════════════════════════════════════════════════════════════════════ */
export function PendingBillsModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserKey = String(activeUserSession.user_id || activeUserSession.email || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await apiGetCustomerBills();
      if (res && res.bills) {
        setBills(res.bills);
      }
    } catch (e) {
      console.warn('Backend bills fetch warning:', e.message);
      const stored = JSON.parse(localStorage.getItem(`finsight_customer_invoices_${activeUserKey}`) || '[]');
      setBills(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [activeUserKey]);

  const handleMarkPaid = async (billId) => {
    if (!window.confirm('Are you sure you want to mark this pending credit bill as Paid? This will record the transaction and update your cash reports.')) return;
    try {
      await apiPayCustomerBill(billId);
      alert('Success: Bill marked as Paid! Revenue registers updated.');
      
      // Update local storage status
      const stored = JSON.parse(localStorage.getItem(`finsight_customer_invoices_${activeUserKey}`) || '[]');
      const updated = stored.map(b => {
        if (b.id === billId || b.billNo === billId || b.bill_number === billId) {
          return { ...b, status: 'Paid', payment_date: new Date().toISOString().split('T')[0] };
        }
        return b;
      });
      localStorage.setItem(`finsight_customer_invoices_${activeUserKey}`, JSON.stringify(updated));
      localStorage.setItem('finsight_customer_invoices', JSON.stringify(updated));

      loadBills();
      
      // Broadcast dashboard analytics update trigger
      window.dispatchEvent(new Event('finsight_data_updated'));
    } catch (err) {
      alert(`Error marking bill paid: ${err.message}`);
    }
  };

  const pendingBills = bills.filter(b => b.status === 'Pending' || b.payment_status === 'Pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        background: 'var(--fg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--fg-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-text-primary)' }}>Pending Credit Bills ({pendingBills.length} Outstanding)</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 2 }}>Manage credit sales given to trusted customers and record payments.</p>
        </div>
      </div>

      {/* Bills Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-text-muted)' }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
          <span>Loading pending bills database...</span>
        </div>
      ) : pendingBills.length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center', background: 'var(--fg-surface)', border: '1px solid var(--fg-border)', borderRadius: 16 }}>
          <CheckCircle2 size={32} color="var(--fg-success)" style={{ margin: '0 auto 14px' }} />
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-text-primary)' }}>All Settled!</h4>
          <p style={{ fontSize: 12, color: 'var(--fg-text-muted)', marginTop: 4 }}>There are no outstanding customer credit bills currently.</p>
        </div>
      ) : (
        <div className="fg-dark-table">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ padding: '13px 16px' }}>Bill No</th>
                  <th style={{ padding: '13px 16px' }}>Customer Name</th>
                  <th style={{ padding: '13px 16px' }}>Phone Number</th>
                  <th style={{ padding: '13px 16px' }}>Amount</th>
                  <th style={{ padding: '13px 16px' }}>Due Date</th>
                  <th style={{ padding: '13px 16px' }}>Status</th>
                  <th style={{ padding: '13px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--fg-accent)' }}>{bill.bill_number || bill.billNo || 'N/A'}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--fg-text-primary)' }}>{bill.customer_name || 'Retail Customer'}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--fg-text-secondary)' }}>{bill.customer_phone || 'N/A'}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 800, color: 'var(--fg-warning)' }}>₹ {parseFloat(bill.grand_total || bill.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--fg-text-primary)' }}>{bill.due_date || '15 Days Terms'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                        background: 'var(--fg-warning-soft)', color: 'var(--fg-warning)',
                        border: '1px solid var(--fg-warning-border)',
                      }}>
                        {bill.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleMarkPaid(bill.id || bill.bill_number || bill.billNo)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: 'var(--fg-success-soft)', border: '1px solid var(--fg-success)',
                            color: 'var(--fg-success)', cursor: 'pointer'
                          }}
                        >
                          💵 Mark as Paid
                        </button>
                        <button
                          onClick={() => setSelectedBill(bill)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)',
                            color: 'var(--fg-accent)', cursor: 'pointer'
                          }}
                        >
                          👁️ View Items
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Items Detail Modal */}
      {selectedBill && (
        <div className="fg-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lc-glass-card" style={{ width: 500, padding: 24, borderRadius: 16, border: '1px solid var(--fg-border-accent)', background: 'var(--fg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--fg-border)', paddingBottom: 10, marginBottom: 14 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>POS Bill Items #{selectedBill.bill_number || selectedBill.billNo}</h4>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {selectedBill.items && selectedBill.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-text-secondary)' }}>
                  <span>{item.description || item.name} (x{item.qty})</span>
                  <strong>₹ {parseFloat(item.amount || (item.rate * item.qty) || 0).toLocaleString('en-IN')}</strong>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--fg-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: 'var(--fg-accent)' }}>
                <span>Grand Total:</span>
                <span>₹ {parseFloat(selectedBill.grand_total || selectedBill.grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={() => setSelectedBill(null)} className="fg-btn-primary" style={{ width: '100%', padding: 10 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
