import { Router } from 'express';
import { db, createAuditLog } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const inventory = await db.fetchScoped('inventory', req.shopId);
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory
router.post('/', requireRoles(['owner', 'store_manager']), async (req, res) => {
  try {
    const { name, category, stockQty, minAlertThreshold, unitPrice, supplier } = req.body;
    if (!name || stockQty === undefined) {
      return res.status(400).json({ success: false, error: 'Item Name and Stock Quantity are required.' });
    }
    const qty = parseInt(stockQty);
    const threshold = parseInt(minAlertThreshold || 15);
    const newItem = {
      id: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      user_id: req.shopId,
      name,
      category: category || 'General Store',
      stock_qty: qty,
      min_alert_threshold: threshold,
      unit_price: String(unitPrice || '0').startsWith('₹') ? String(unitPrice) : `₹ ${unitPrice}`,
      status: qty <= threshold ? 'Low Stock Alert' : 'Healthy Stock',
      supplier_name: supplier || 'General Supplier',
    };

    const saved = await db.insert('inventory', newItem);

    await db.insert('activity_logs', {
      id: `LOG-${Date.now()}`,
      user_id: req.shopId,
      action: '📦 Added Inventory SKU',
      details: `Added ${name} (${qty} units) to store inventory.`,
      category: 'Inventory',
    });

    res.status(201).json({ success: true, item: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/inventory/:id
router.put('/:id', requireRoles(['owner', 'store_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    // Validate ownership
    const inv = await db.fetchScoped('inventory', req.shopId);
    const existing = inv.find(i => i.id === id);
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found.' });

    const updates = { ...req.body };
    // Normalise incoming camelCase to snake_case for Supabase
    if (updates.stockQty !== undefined)          { updates.stock_qty = parseInt(updates.stockQty); delete updates.stockQty; }
    if (updates.minAlertThreshold !== undefined)  { updates.min_alert_threshold = parseInt(updates.minAlertThreshold); delete updates.minAlertThreshold; }
    if (updates.unitPrice !== undefined)          { updates.unit_price = updates.unitPrice; delete updates.unitPrice; }
    if (updates.supplier !== undefined)           { updates.supplier_name = updates.supplier; delete updates.supplier; }

    // Auto-compute status
    const qty = parseInt(updates.stock_qty ?? existing.stockQty ?? 0);
    const threshold = parseInt(updates.min_alert_threshold ?? existing.minAlertThreshold ?? 15);
    updates.status = qty <= threshold ? 'Low Stock Alert' : 'Healthy Stock';
    updates.updated_at = new Date().toISOString();

    const updated = await db.update('inventory', 'id', id, updates);

    await db.insert('activity_logs', {
      id: `LOG-${Date.now()}`,
      user_id: req.shopId,
      action: '✏️ Updated Inventory SKU',
      details: `Adjusted inventory details for ${existing.name} (Current Qty: ${qty}).`,
      category: 'Inventory',
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory/:id/return-to-vendor (Owner & Store Manager)
router.post('/:id/return-to-vendor', requireRoles(['owner', 'store_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { returnQty, unitPrice, vendorName, reason } = req.body;

    const inv = await db.fetchScoped('inventory', req.shopId);
    const existing = inv.find(i => String(i.id) === String(id));
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found in store inventory.' });
    }

    const currentQty = parseInt(existing.stockQty ?? existing.stock_qty ?? 0);
    const qtyToReturn = parseInt(returnQty || 0);

    if (qtyToReturn <= 0) {
      return res.status(400).json({ success: false, error: 'Return quantity must be greater than zero.' });
    }

    if (qtyToReturn > currentQty) {
      return res.status(400).json({ success: false, error: `Cannot return ${qtyToReturn} units. Current stock is only ${currentQty} units.` });
    }

    const priceVal = parseFloat(String(unitPrice || existing.costPrice || existing.cost_price || existing.unitPrice || existing.unit_price || '0').replace(/[^0-9.]/g, '')) || 50;
    const returnTotal = qtyToReturn * priceVal;
    const newQty = currentQty - qtyToReturn;
    const threshold = parseInt(existing.minAlertThreshold ?? existing.min_alert_threshold ?? 15);
    const newStatus = newQty <= threshold ? 'Low Stock Alert' : 'Healthy Stock';

    // 1. Update inventory stock quantity
    const updatedItem = await db.update('inventory', 'id', id, {
      stock_qty: newQty,
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    // 2. Create financial transaction (Vendor Return Outflow Refund / Credit IN)
    const targetVendor = vendorName || existing.supplierName || existing.supplier || 'Vendor Supplier';
    const txn = await db.insert('transactions', {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: req.shopId,
      owner_id: req.shopId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'IN',
      transaction_type: 'vendor_return',
      category: 'vendor_return',
      amount: `+₹ ${returnTotal.toLocaleString('en-IN')}`,
      reference_id: existing.id,
      description: `Vendor Return: Returned ${qtyToReturn} ${existing.name} units to ${targetVendor}${reason ? ` (${reason})` : ''}`,
      balance: '—',
    });

    // 3. Create Audit Log entry
    await createAuditLog(req, {
      action: 'Product Returned to Vendor',
      module: 'Inventory',
      description: `Returned ${qtyToReturn} units of ${existing.name} (Value: ₹ ${returnTotal.toLocaleString('en-IN')}) to ${targetVendor}. Reason: ${reason || 'Stock Return'}`,
      entity_type: 'Product',
      entity_id: existing.id,
      old_value: `${currentQty} units`,
      new_value: `${newQty} units`,
    });

    const refreshedInventory = await db.fetchScoped('inventory', req.shopId);
    res.json({
      success: true,
      message: `Successfully returned ${qtyToReturn} units of ${existing.name} to ${targetVendor}.`,
      returnTotal,
      item: updatedItem,
      inventory: refreshedInventory,
      transaction: txn,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', requireRoles(['owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await db.fetchScoped('inventory', req.shopId);
    const item = inv.find(i => i.id === id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found.' });

    await db.delete('inventory', 'id', id);

    await createAuditLog(req, {
      action: 'Deleted Inventory SKU',
      module: 'Inventory',
      description: `Removed '${item.name}' from store database.`,
      entity_type: 'Product',
      entity_id: item.id,
    });

    const inventory = await db.fetchScoped('inventory', req.shopId);
    res.json({ success: true, message: 'Item deleted.', inventory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
