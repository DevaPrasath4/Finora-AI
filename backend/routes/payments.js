import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.get('/', requireRoles(['owner', 'financier']), async (req, res) => {
  try {
    const payments = await db.fetchScoped('payments', req.shopId);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', requireRoles(['owner', 'financier']), async (req, res) => {
  try {
    const { recipient, amount, mode } = req.body;
    if (!recipient || !amount) {
      return res.status(400).json({ success: false, error: 'Recipient and Amount are required.' });
    }
    const amountStr = String(amount);
    const saved = await db.insert('payments', {
      id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
      user_id: req.shopId,
      recipient,
      amount: amountStr.startsWith('₹') ? amountStr : `₹ ${amountStr}`,
      date: new Date().toISOString().split('T')[0],
      mode: mode || 'UPI / Bank Transfer',
      status: 'Completed',
    });
    res.status(201).json({ success: true, payment: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
