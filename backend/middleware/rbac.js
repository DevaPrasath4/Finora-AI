
import { db } from '../db.js';

const ROLE_ALIASES = {
  owner: 'owner',
  super_admin: 'owner',
  admin: 'owner',
  accountant: 'financier',
  financier: 'financier',
  finance: 'financier',
  billing: 'cashier',
  cashier: 'cashier',
  'cashier (billing)': 'cashier',
  stock_manager: 'store_manager',
  store_manager: 'store_manager',
  'store manager': 'store_manager',
  'store management': 'store_manager',
  'stock management': 'store_manager',
};

export function normalizeRole(role) {
  if (!role) return null;
  const clean = String(role).toLowerCase().trim().replace(/_/g, ' ');
  const directKey = String(role).toLowerCase().trim();
  if (ROLE_ALIASES[directKey]) return ROLE_ALIASES[directKey];
  if (clean.includes('financ') || clean.includes('account')) return 'financier';
  if (clean.includes('cashier') || clean.includes('bill')) return 'cashier';
  if (clean.includes('stock') || clean.includes('store') || clean.includes('manag')) return 'store_manager';
  return ROLE_ALIASES[clean] || clean;
}

/**
 * Middleware factory to restrict route access to specific roles.
 * Usage: router.post('/sensitive', requireRoles(['owner', 'financier']), (req, res) => ...)
 *
 * @param {string[]} allowedRoles Array of normalized roles allowed to access the route
 */
export function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    const headerRole = (req.headers && req.headers['x-user-role']) || (req.query && req.query.role) || (req.body && req.body.userRole);
    if (!headerRole) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing role authorization headers.',
      });
    }

    const userRole = normalizeRole(headerRole);
    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Unrecognized or invalid user role.',
      });
    }

    // Normalize allowed roles list
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    // Business Owner always has root access unless specifically restricted
    if (userRole === 'owner' || normalizedAllowed.includes(userRole)) {
      req.authenticatedUserRole = userRole;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access Denied: Your assigned role ('${userRole}') does not have permission to perform this action.`,
      requiredRoles: allowedRoles,
      assignedRole: userRole,
    });
  };
}

/**
 * Permissions matrix helper for fine-grained entity actions
 */
export const PERMISSIONS = {
  // Inventory
  INVENTORY_READ: ['owner', 'financier', 'cashier', 'store_manager'],
  INVENTORY_WRITE: ['owner', 'store_manager'],
  INVENTORY_DELETE: ['owner'],

  // Employees & Staff
  EMPLOYEES_MANAGE: ['owner'],
  EMPLOYEES_READ: ['owner'],

  // Invoices & Billing
  BILLING_CREATE: ['owner', 'cashier'],
  INVOICES_READ: ['owner', 'financier', 'cashier'],
  INVOICES_UPLOAD: ['owner'],

  // Expenses & Cash Out
  EXPENSES_READ: ['owner', 'financier'],
  EXPENSES_WRITE: ['owner', 'financier'],

  // Transactions & Cash In
  TRANSACTIONS_READ: ['owner', 'financier'],
  TRANSACTIONS_WRITE: ['owner', 'financier'],

  // Compliance & GST
  COMPLIANCE_READ: ['owner', 'financier'],
  COMPLIANCE_WRITE: ['owner', 'financier'],

  // AI Assistant & Deep Insights
  AI_ACCESS: ['owner'],

  // Settings & System Configuration
  SETTINGS_MANAGE: ['owner'],
};

/**
 * Shop Isolation Middleware
 * Enforces that owners can only view their own data, and employees can only view data from their owner's shop.
 */
export function validateShopIsolation() {
  return async (req, res, next) => {
    const headerRole = (req.headers && req.headers['x-user-role']) || (req.query && req.query.role) || (req.body && req.body.userRole);
    const userId = (req.headers && req.headers['x-user-id']) || (req.query && req.query.userId) || (req.body && req.body.userId);
    const shopId = (req.headers && req.headers['x-shop-id']) || (req.query && req.query.shopId) || (req.body && req.body.shopId) || userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing User ID headers.' });
    }

    const userRole = normalizeRole(headerRole);
    // Use the shopId as the data scope (owner_id or user_id of the owner)
    req.shopId = shopId;
    req.userId = userId;
    req.userRole = userRole;

    if (userRole === 'owner') {
      // Owner: shopId must be either their user_id or owner_id
      // This allows both cases: new users where owner_id == user_id
      return next();
    }

    // For employees, verify in DB that they belong to this shop
    try {
      const users = await db.fetchTable('users');
      const user = users.find(u =>
        String(u.user_id || '').toLowerCase() === String(userId).toLowerCase() ||
        String(u.email || '').toLowerCase() === String(userId).toLowerCase()
      );
      if (!user) {
        return res.status(403).json({ success: false, error: 'Forbidden: Employee user record not found.' });
      }

      if (user.owner_id && String(user.owner_id).toLowerCase() !== String(shopId).toLowerCase()) {
        return res.status(403).json({ success: false, error: 'Forbidden: Employee does not belong to this shop.' });
      }

      // Set shopId to the owner's shop scope for employees
      req.shopId = user.owner_id || shopId;
    } catch (err) {
      console.warn('[RBAC validateShopIsolation warning]:', err.message);
    }

    return next();
  };
}
