import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.get('/', requireRoles(['owner', 'store_manager']), async (req, res) => {
  try {
    const vendors = await db.fetchScoped('vendors', req.shopId);
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', requireRoles(['owner', 'store_manager']), async (req, res) => {
  try {
    const { name, contactPerson, phone, gstin } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Vendor name is required.' });
    }
    const saved = await db.insert('vendors', {
      id: `VEND-${Math.floor(10 + Math.random() * 90)}`,
      user_id: req.shopId,
      name,
      contact_person: contactPerson || 'N/A',
      phone: phone || 'N/A',
      gstin: gstin || 'Unverified GSTIN',
      total_billed: '₹ 0',
      trust_score: '100% (New Vendor)',
    });
    res.status(201).json({ success: true, vendor: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
