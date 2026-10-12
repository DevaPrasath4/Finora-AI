import { Router } from 'express';
import { db, createAuditLog } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// GET /api/customer-bills
router.get('/', requireRoles(['owner', 'financier', 'cashier']), async (req, res) => {
  try {
    const bills = await db.fetchScoped('customer_bills', req.shopId);
    res.json({ success: true, bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customer-bills
router.post('/', requireRoles(['owner', 'cashier']), async (req, res) => {
  try {
    const shopId = req.shopId;
    const { bill_number, customer_name, customer_phone, subtotal, tax_gst, grand_total, profit_earned, items, status, due_date } = req.body;

    if (!customer_name || !grand_total) {
      return res.status(400).json({ success: false, error: 'Customer name and total amount are required.' });
    }

    const billNo = bill_number || `BILL-${Math.floor(100000 + Math.random() * 900000)}`;
    const billStatus = status || 'Paid';

    const newBill = {
      id: `bill-${Date.now()}`,
      user_id: shopId,
      bill_number: billNo,
      customer_name,
      customer_phone: customer_phone || 'N/A',
      subtotal: parseFloat(subtotal || grand_total),
      tax_gst: parseFloat(tax_gst || 0),
      grand_total: parseFloat(grand_total),
      profit_earned: parseFloat(profit_earned || 0),
      status: billStatus,
      due_date: due_date || null,
      payment_date: billStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null,
      items: items || [],
    };

    const saved = await db.insert('customer_bills', newBill);

    // If Paid, immediately insert transaction record
    if (billStatus === 'Paid') {
      await db.insert('transactions', {
        id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: shopId,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'IN',
        description: `Customer POS Sale (Bill #${billNo} - ${customer_name})`,
        category: 'Sales Revenue',
        amount: `₹ ${parseFloat(grand_total).toLocaleString('en-IN')}`,
        balance: '—',
      });
    }

    await createAuditLog(req, {
      action: 'Customer Bill Created',
      module: 'Billing',
      description: `Created POS bill #${billNo} for ${customer_name} (Amount: ₹ ${parseFloat(grand_total).toLocaleString('en-IN')}, Status: ${billStatus})`,
      entity_type: 'Bill',
      entity_id: billNo,
    });

    res.status(201).json({ success: true, bill: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/customer-bills/:id/pay
router.put('/:id/pay', requireRoles(['owner', 'cashier']), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.shopId;

    // Verify the bill exists and belongs to this shop
    const bills = await db.fetchScoped('customer_bills', shopId);
    const bill = bills.find(b => b.id === id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Pending bill not found.' });
    }

    const paymentDate = new Date().toISOString().split('T')[0];
    const updated = await db.update('customer_bills', 'id', id, {
      status: 'Paid',
      payment_date: paymentDate,
    });

    // Insert transaction
    await db.insert('transactions', {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: shopId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'IN',
      description: `Paid Customer POS Bill #${bill.bill_number} - ${bill.customer_name}`,
      category: 'Sales Revenue',
      amount: `₹ ${parseFloat(bill.grand_total).toLocaleString('en-IN')}`,
      balance: '—',
    });

    // Audit Log
    await db.insert('activity_logs', {
      id: `LOG-${Date.now()}`,
      user_id: shopId,
      action: '💳 Customer POS Bill Marked Paid',
      details: `Bill #${bill.bill_number} for '${bill.customer_name}' was marked paid - Amount: ₹ ${parseFloat(bill.grand_total).toLocaleString('en-IN')}`,
      category: 'POS Sales',
    });

    res.json({ success: true, bill: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
