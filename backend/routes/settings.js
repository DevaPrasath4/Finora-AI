import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

const DEFAULT_SETTINGS = {
  business_profile: {
    company_name: 'My Store',
    legal_name: '',
    gstin: '',
    pan: '',
    business_type: 'General Retail',
    registration_date: '',
  },
  shop_info: {
    store_code: 'STORE-001',
    branch_name: 'Main Store',
    address: '',
    phone: '',
    email: '',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    operating_hours: '08:00 AM - 10:00 PM',
  },
  security: {
    two_factor_auth: false,
    session_timeout_minutes: 60,
    enforce_strong_passwords: true,
    allow_multi_device_login: true,
    ip_whitelist_enabled: false,
  },
  app_preferences: {
    theme: 'dark',
    date_format: 'DD/MM/YYYY',
    auto_backup_enabled: true,
    invoice_prefix: 'INV-2026-',
    barcode_scanner_auto_submit: true,
  },
};

const ROLES_PERMISSIONS = [
  { role_id: 'owner', title: 'Business Owner', description: 'Full administrative control.', modules: ['overview','ai_assistant','invoices','pos_billing','pending_bills','expenses','transactions','compliance','inventory','vendors','add_employee','employees','audit_logs','settings'] },
  { role_id: 'financier', title: 'Financier / Accountant', description: 'Financial ledger, taxes, compliance.', modules: ['transactions','expenses','compliance','audit_logs'] },
  { role_id: 'cashier', title: 'Cashier & Billing', description: 'POS checkout, billing, read-only inventory.', modules: ['pos_billing','pending_bills','inventory_readonly'] },
  { role_id: 'store_manager', title: 'Stock Manager', description: 'Inventory, vendors, warehouse tracking.', modules: ['inventory','vendors','audit_logs'] },
];

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const shopId = req.shopId;
    let settings = await db.fetchSettings(shopId);
    if (!settings) {
      settings = { ...DEFAULT_SETTINGS };
      await db.upsertSettings(shopId, settings);
    }
    res.json({ success: true, settings, roles: ROLES_PERMISSIONS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireRoles(['owner']), async (req, res) => {
  try {
    const updates = req.body;
    const shopId = req.shopId;

    let settings = await db.fetchSettings(shopId) || { ...DEFAULT_SETTINGS };

    if (updates.business_profile) settings.business_profile = { ...settings.business_profile, ...updates.business_profile };
    if (updates.shop_info) settings.shop_info = { ...settings.shop_info, ...updates.shop_info };
    if (updates.security) settings.security = { ...settings.security, ...updates.security };
    if (updates.app_preferences) settings.app_preferences = { ...settings.app_preferences, ...updates.app_preferences };

    await db.upsertSettings(shopId, settings);

    await db.insert('activity_logs', {
      id: `LOG-${Date.now()}`,
      user_id: shopId,
      action: '⚙️ Settings Updated',
      details: 'Store settings and business configurations were updated by Owner.',
      category: 'Settings',
    });

    res.json({ success: true, message: 'Store settings updated successfully.', settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const users = await db.fetchTable('users');
    const user = users.find(u => (u.user_id === userId || u.email === userId) && u.password_hash === currentPassword);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Current password does not match.' });
    }

    await db.update('users', 'user_id', user.user_id, { password_hash: newPassword });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
