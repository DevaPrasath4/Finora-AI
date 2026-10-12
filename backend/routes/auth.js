import { Router } from 'express';
import crypto from 'crypto';
import { db, createAuditLog } from '../db.js';
import { validateShopIsolation } from '../middleware/rbac.js';

const router = Router();

export function hashPassword(plainText) {
  if (!plainText) return '';
  return crypto.createHash('sha256').update(String(plainText).trim()).digest('hex');
}

export function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;
  const cleanInput = String(plainText).trim();
  const cleanStored = String(storedHash).trim();
  // Support plain-text stored passwords (legacy / data.json) AND SHA-256 hashes (Supabase)
  if (cleanStored === cleanInput) return true;
  return hashPassword(cleanInput) === cleanStored;
}

// GET /api/auth/users (Protected to shop isolation)
router.get('/users', validateShopIsolation(), async (req, res) => {
  try {
    const users = await db.fetchScoped('users', req.shopId);
    const sanitized = users.map(u => ({
      id: u.id,
      user_id: u.user_id,
      company_name: u.company_name,
      company_address: u.company_address || '',
      business_type: u.business_type || '',
      employee_count: u.employee_count || '5',
      mobile_number: u.mobile_number,
      email: u.email,
      role: u.role,
      owner_id: u.owner_id || u.user_id,
      created_at: u.created_at,
    }));
    res.json({ success: true, users: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password, mobileNumber } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, error: 'User ID / Email and Password are required.' });
    }

    const cleanId = String(userId).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const cleanMobile = mobileNumber ? String(mobileNumber).trim() : null;

    const users = await db.fetchTable('users');
    const user = users.find(u => {
      const uId = String(u.user_id || '').trim().toLowerCase();
      const uEmail = String(u.email || '').trim().toLowerCase();
      const uMobile = String(u.mobile_number || '').trim();
      const matchIdentity = (uId === cleanId || uEmail === cleanId || uMobile === cleanId);
      const passMatch = verifyPassword(cleanPass, u.password_hash);
      const mobileMatch = !cleanMobile || uMobile === cleanMobile;
      return matchIdentity && passMatch && mobileMatch;
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Please check your User ID, Password, and Mobile Number.' });
    }

    const shopId = user.owner_id || user.user_id;
    try {
      await createAuditLog({ shopId, userId: user.user_id, userRole: user.role, headers: {} }, {
        action: 'User Login',
        module: 'Authentication',
        description: `User ${user.user_id} (${user.role}) logged in successfully to ${user.company_name}.`,
        entity_type: 'User',
        entity_id: user.user_id,
      });
    } catch (lErr) {}

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        user_id: user.user_id,
        company_name: user.company_name,
        company_address: user.company_address || '',
        business_type: user.business_type || '',
        employee_count: user.employee_count || '5',
        mobile_number: user.mobile_number,
        email: user.email,
        role: user.role,
        owner_id: shopId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { companyName, companyAddress, businessType, employeeCount, mobileNumber, email, password, role, ownerId, customUserId } = req.body;
    if (!companyName || !mobileNumber || !password) {
      return res.status(400).json({ success: false, error: 'Company Name, Mobile Number, and Password are required.' });
    }

    const users = await db.fetchTable('users');
    const exists = users.some(u =>
      (u.mobile_number && String(u.mobile_number).trim() === String(mobileNumber).trim()) ||
      (email && u.email && String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase())
    );
    if (exists) {
      return res.status(409).json({ success: false, error: 'Account with this mobile number or email already exists.' });
    }

    const isOwner = role === 'owner' || !role;
    const newId = customUserId || (isOwner ? `USR-${Math.floor(1000 + Math.random() * 9000)}` : `EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    const newUser = {
      user_id: newId,
      company_name: companyName,
      company_address: companyAddress || '',
      business_type: businessType || 'General Store',
      employee_count: String(employeeCount || '5'),
      mobile_number: String(mobileNumber).trim(),
      email: email ? String(email).trim().toLowerCase() : `${mobileNumber}@finguard.ai`,
      password_hash: hashPassword(password),
      role: role || 'owner',
      owner_id: ownerId || (isOwner ? newId : null),
    };

    const saved = await db.insert('users', newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully in FinGuard AI database!',
      user: {
        id: saved.id,
        user_id: saved.user_id,
        company_name: saved.company_name,
        company_address: saved.company_address,
        business_type: saved.business_type,
        employee_count: saved.employee_count,
        mobile_number: saved.mobile_number,
        email: saved.email,
        role: saved.role,
        owner_id: saved.owner_id || saved.user_id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
