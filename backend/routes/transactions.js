import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// GET /api/transactions
router.get('/', requireRoles(['owner', 'financier']), async (req, res) => {
  try {
    const transactions = await db.fetchScoped('transactions', req.shopId);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions
router.post('/', requireRoles(['owner', 'financier', 'cashier']), async (req, res) => {
  try {
    const { description, type, amount, category } = req.body;
    if (!description || !amount) {
      return res.status(400).json({ success: false, error: 'Description and Amount are required.' });
    }

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;
    const amountStr = String(amount);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: req.shopId,
      description,
      type: type || 'IN',
      category: category || 'General Store',
      amount: amountStr.startsWith('₹') || amountStr.startsWith('-₹') || amountStr.startsWith('+₹') ? amountStr : `₹ ${amountStr}`,
      date: timestamp,
    };

    const saved = await db.insert('transactions', newTxn);
    res.status(201).json({ success: true, transaction: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
