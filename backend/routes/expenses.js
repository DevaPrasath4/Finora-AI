import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.get('/', requireRoles(['owner', 'financier']), async (req, res) => {
  try {
    const expenses = await db.fetchScoped('expenses', req.shopId);
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', requireRoles(['owner', 'financier']), async (req, res) => {
  try {
    const { category, amount, paidTo } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ success: false, error: 'Category and Amount are required.' });
    }
    const numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    const saved = await db.insert('expenses', {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      user_id: req.shopId,
      category,
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      paid_to: paidTo || 'General Service',
      status: 'Paid',
    });
    res.status(201).json({ success: true, expense: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
