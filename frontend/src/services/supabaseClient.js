import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim();
const supabaseEnabled = import.meta.env?.VITE_SUPABASE_ENABLED === 'true';

export const supabase = supabaseEnabled && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);

/* ─────────────────────────────────────────────────────────────
   1. USER AUTHENTICATION & REGISTRATION IN SUPABASE
   ───────────────────────────────────────────────────────────── */

/**
 * Register a new user in Supabase public.users table with store details.
 */
export async function registerUserInSupabase({ ownerName, companyName, companyAddress, businessType, employeeCount, mobileNumber, email, password, role = 'owner', userId }) {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase is not configured. Check the frontend Supabase environment settings.' };
  }

  const finalUserId = userId || `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser = {
    user_id: finalUserId,
    owner_name: String(ownerName || '').trim(),
    company_name: companyName,
    company_address: companyAddress || '',
    business_type: businessType || 'General Retail',
    employee_count: String(employeeCount || '5'),
    mobile_number: String(mobileNumber).trim(),
    email: email ? String(email).toLowerCase().trim() : `${mobileNumber}@finguard.ai`,
    password_hash: String(password).trim(),
    role: role,
    verified_email: true,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, user: data, message: 'Account created successfully!' };
  } catch (err) {
    console.error('[Supabase Signup Error]:', err);
    return { success: false, message: err.message || 'Could not create the account in Supabase.' };
  }
}

/**
 * Authenticate User in Supabase (Verifies User ID/Email/Mobile Number AND Password case-insensitively)
 */
export async function authenticateUserInSupabase(identifier = '', password = '', mobileNumber = '') {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase is not configured. Check the frontend Supabase environment settings.' };
  }

  const cleanId = String(identifier).toLowerCase().trim();
  const cleanMobile = String(mobileNumber).trim();
  const cleanPass = String(password).trim();

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('[Supabase Auth Error]:', error.message);
      return { success: false, message: error.message };
    }

    const foundUser = users?.find(u => {
      const uId = String(u.user_id || '').toLowerCase().trim();
      const uEmail = String(u.email || '').toLowerCase().trim();
      const uMobile = String(u.mobile_number || '').trim();
      return uId === cleanId || uEmail === cleanId || (cleanMobile && uMobile === cleanMobile) || uMobile === cleanId;
    });

    if (foundUser) {
      if (String(foundUser.password_hash || '').trim() !== cleanPass) {
        return { success: false, message: 'Invalid Password. Please check your password and try again.' };
      }
      return { success: true, user: foundUser, isSuperAdmin: foundUser.role === 'super_admin' };
    }
  } catch (err) {
    console.error('[Supabase Auth Error]:', err);
    return { success: false, message: err.message || 'Could not authenticate with Supabase.' };
  }

  return { success: false, message: 'No registered business owner account found with provided Email / User ID / Mobile Number.' };
}

/* ─────────────────────────────────────────────────────────────
   STAFF / EMPLOYEES CONTAINER IN SUPABASE
   ───────────────────────────────────────────────────────────── */

export async function getStaffFromSupabase(userId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {}
  }
  const key = `finsight_staff_${String(userId).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

export async function addStaffToSupabase(staffObj) {
  const userKey = String(staffObj.user_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `finsight_staff_${userKey}`;
  const local = JSON.parse(localStorage.getItem(key) || '[]');
  local.unshift(staffObj);
  localStorage.setItem(key, JSON.stringify(local));

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('employees').insert([staffObj]);
    } catch (e) {}
  }
  return local;
}

/* ─────────────────────────────────────────────────────────────
   2. INVOICE PERSISTENCE IN SUPABASE
   ───────────────────────────────────────────────────────────── */

/**
 * Save OCR Extracted & Manual Invoice Data to Supabase Database
 */
export async function saveOcrDataToSupabase(ocrData) {
  const {
    userId,
    supplierName,
    invoiceNumber,
    invoiceDate,
    subtotal,
    taxGst,
    grandTotal,
    items,
    rawText,
  } = ocrData;

  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = userId || activeUser.user_id || activeUser.email || 'user';
  const activeUserKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');

  const newInvoiceRecord = {
    id: `inv-${Date.now()}`,
    user_id: activeUserId,
    supplier_name: supplierName || 'Store Vendor',
    invoice_number: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    invoice_date: invoiceDate || new Date().toISOString().split('T')[0],
    subtotal: String(subtotal || grandTotal || '0'),
    tax_gst: String(taxGst || '0'),
    grand_total: String(grandTotal || '0'),
    items: items || [],
    raw_text: rawText || '',
    created_at: new Date().toISOString(),
  };

  // Local storage cache backup (user scoped and global fallback)
  const userOcrKey = `finsight_ocr_invoices_${activeUserKey}`;
  const storedUserInvoices = JSON.parse(localStorage.getItem(userOcrKey) || '[]');
  storedUserInvoices.unshift(newInvoiceRecord);
  localStorage.setItem(userOcrKey, JSON.stringify(storedUserInvoices));

  const storedLocalInvoices = JSON.parse(localStorage.getItem('finsight_ocr_invoices') || '[]');
  storedLocalInvoices.unshift(newInvoiceRecord);
  localStorage.setItem('finsight_ocr_invoices', JSON.stringify(storedLocalInvoices));

  // Sync stock items to the Supabase inventory table
  if (items && items.length > 0) {
    await saveStockToSupabase({
      userId: activeUserId,
      supplierName: supplierName || 'Store Vendor',
      invoiceNumber: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      items,
      source: 'ocr_vendor_bill',
    });
  }

  // Insert into Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      console.log('[Supabase DB]: Inserting Invoice to public.invoices...', newInvoiceRecord);
      await supabase.from('invoices').insert([newInvoiceRecord]);
    } catch (err) {
      console.warn('[Supabase Invoice Insert Error]:', err.message);
    }
  }

  // Log audit activity
  addActivityLog({
    userId: newInvoiceRecord.user_id,
    action: '📄 Uploaded Vendor Invoice',
    details: `Vendor bill #${newInvoiceRecord.invoice_number} from '${newInvoiceRecord.supplier_name}' saved - Total: ₹ ${parseFloat(newInvoiceRecord.grand_total || 0).toLocaleString('en-IN')}`,
    category: 'Vendor Billing',
  }).catch(() => {});

  return { success: true, data: [newInvoiceRecord], savedLocally: !isSupabaseConfigured() };
}

/**
 * Fetch Stock Inventory for specific user from Supabase Database
 */
export async function getInventoryFromSupabase(userId) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_stock_inventory_${userKey}`;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Sync to local cache
        localStorage.setItem(localKey, JSON.stringify(data));
        localStorage.setItem('finsight_stock_inventory', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[Supabase Stock Fetch Error]:', err.message);
    }
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // No stock data found - return empty array for new users
  return [];
}

/**
 * Save stock inventory details to Supabase (scoped per user)
 */
export async function saveStockToSupabase(stockPayload = {}) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const {
    userId = activeUser.user_id || activeUser.email || 'user',
    supplierName = 'Manual Store Stock Upload',
    invoiceNumber = `STK-${Math.floor(1000 + Math.random() * 9000)}`,
    items = [],
    source = 'manual_entry',
  } = stockPayload;

  const userKey = String(userId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_stock_inventory_${userKey}`;

  const formattedItems = items.map(item => {
    const costVal = parseFloat(String(item.rate || item.costPrice || item.price || '100').replace(/[^0-9.]/g, '')) || 100;
    const sellVal = parseFloat(String(item.sellingPrice || item.selling_price || '').replace(/[^0-9.]/g, '')) || Math.round(costVal * 1.20);
    const gstRateStr = item.gst || item.gst_rate || '5%';
    const qtyVal = parseInt(String(item.qty || item.quantity || item.stock_qty || '1').replace(/[^0-9]/g, '')) || 1;

    return {
      id: item.id || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: userId,
      name: item.name || item.description || item.itemName || 'Stock Product',
      category: item.category || 'General Store',
      quantity: `${qtyVal} Units`,
      stock_qty: qtyVal,
      cost_price: `₹ ${costVal.toLocaleString('en-IN')}`,
      unit_price: `₹ ${costVal.toLocaleString('en-IN')}`,
      selling_price: `₹ ${sellVal.toLocaleString('en-IN')}`,
      gst_rate: gstRateStr,
      total_amount: item.total ? item.total : `₹ ${(costVal * qtyVal).toLocaleString('en-IN')}`,
      supplier_name: supplierName,
      invoice_number: invoiceNumber,
      source: source,
      updated_at: new Date().toISOString(),
    };
  });

  // User-scoped Local storage inventory backup with qty accumulation
  const existingStock = JSON.parse(localStorage.getItem(localKey) || '[]');
  const updatedStock = [...existingStock];

  formattedItems.forEach(newItem => {
    const existingIdx = updatedStock.findIndex(st => (st.name || '').toLowerCase().trim() === newItem.name.toLowerCase().trim());
    if (existingIdx >= 0) {
      const prevQty = parseInt(String(updatedStock[existingIdx].stock_qty || updatedStock[existingIdx].quantity || '0').replace(/[^0-9]/g, '')) || 0;
      const nextQty = prevQty + newItem.stock_qty;
      updatedStock[existingIdx].stock_qty = nextQty;
      updatedStock[existingIdx].quantity = `${nextQty} Units`;
      if (newItem.selling_price) updatedStock[existingIdx].selling_price = newItem.selling_price;
      updatedStock[existingIdx].updated_at = new Date().toISOString();
    } else {
      updatedStock.unshift(newItem);
    }
  });

  localStorage.setItem(localKey, JSON.stringify(updatedStock));
  localStorage.setItem('finsight_stock_inventory', JSON.stringify(updatedStock));

  // Insert/Upsert into Supabase table public.inventory if configured
  if (isSupabaseConfigured()) {
    try {
      console.log('[Supabase DB]: Saving stock items into public.inventory for user:', userId, formattedItems);

      for (const it of formattedItems) {
        const { data: existingDbItems } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', it.name);

        if (existingDbItems && existingDbItems.length > 0) {
          const dbItem = existingDbItems[0];
          const nextQty = (parseInt(dbItem.stock_qty) || 0) + it.stock_qty;
          await supabase.from('inventory').update({
            stock_qty: nextQty,
            unit_price: it.unit_price,
            cost_price: it.cost_price,
            selling_price: it.selling_price,
            status: nextQty <= 15 ? 'Low Stock Alert' : 'Healthy Stock',
            updated_at: new Date().toISOString(),
          }).eq('id', dbItem.id);
        } else {
          await supabase.from('inventory').insert([{
            id: it.id,
            user_id: userId,
            name: it.name,
            category: it.category,
            stock_qty: it.stock_qty,
            min_alert_threshold: 15,
            unit_price: it.unit_price,
            cost_price: it.cost_price,
            selling_price: it.selling_price,
            gst_rate: it.gst_rate,
            status: it.stock_qty <= 15 ? 'Low Stock Alert' : 'Healthy Stock',
            supplier_name: supplierName,
          }]);
        }
      }
    } catch (err) {
      console.warn('[Supabase Stock Save Error]:', err.message);
    }
  }

  // Log audit activity
  const firstItemName = formattedItems.length > 0 ? formattedItems[0].name : 'Stock Product';
  const itemSummary = formattedItems.length === 1 ? `'${firstItemName}'` : `${formattedItems.length} product(s)`;
  addActivityLog({
    userId: userId,
    action: '📦 Added Stock Product',
    details: `Added ${itemSummary} to store inventory from '${supplierName}'.`,
    category: 'Inventory',
  }).catch(() => {});

  return { success: true, count: formattedItems.length, items: formattedItems };
}

/**
 * Deduct Sold Quantities from Inventory in Supabase & LocalStorage on Customer Purchase
 */
export async function deductStockInSupabase(userId, soldItems = []) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_stock_inventory_${userKey}`;

  const sanitize = str => (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const storedStock = JSON.parse(localStorage.getItem(localKey) || '[]');

  const updatedStock = storedStock.map(st => {
    const itemKeyInStock = sanitize(st.name || st.item_name || '');
    const matchItem = soldItems.find(it => {
      const itemKey = sanitize(it.description || it.name || '');
      return itemKey && itemKeyInStock && (itemKey.includes(itemKeyInStock) || itemKeyInStock.includes(itemKey));
    });

    if (matchItem) {
      const currentQty = parseInt(String(st.stock_qty !== undefined ? st.stock_qty : st.quantity || '0').replace(/[^0-9]/g, '')) || 0;
      const soldQty = Number(matchItem.qty || 1);
      const newQty = Math.max(0, currentQty - soldQty);
      return {
        ...st,
        stock_qty: newQty,
        stockQty: newQty,
        quantity: `${newQty} Units`,
        updated_at: new Date().toISOString(),
      };
    }
    return st;
  });

  localStorage.setItem(localKey, JSON.stringify(updatedStock));
  localStorage.setItem('finsight_stock_inventory', JSON.stringify(updatedStock));

  if (isSupabaseConfigured()) {
    try {
      const { data: dbItems } = await supabase.from('inventory').select('*').eq('user_id', targetId);
      if (dbItems && dbItems.length > 0) {
        for (const item of soldItems) {
          const nameKey = sanitize(item.description || item.name || '');
          const dbMatch = dbItems.find(st => {
            const dbKey = sanitize(st.name || '');
            return dbKey && nameKey && (dbKey.includes(nameKey) || nameKey.includes(dbKey));
          });

          if (dbMatch) {
            const currentQty = parseInt(String(dbMatch.stock_qty || 0)) || 0;
            const soldQty = Number(item.qty || 1);
            const newQty = Math.max(0, currentQty - soldQty);
            await supabase.from('inventory').update({
              stock_qty: newQty,
              status: newQty <= 15 ? 'Low Stock Alert' : 'Healthy Stock',
              updated_at: new Date().toISOString(),
            }).eq('id', dbMatch.id);
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Stock Deduct Warning]:', err.message);
    }
  }

  return updatedStock;
}

/**
 * Save Customer Sales Bill, Deduct Stock & Record Revenue Inflow in Supabase
 */
export async function saveCustomerBillToSupabase(billPayload = {}) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const {
    userId = activeUser.user_id || activeUser.email || 'user',
    billNo,
    customerName,
    customerPhone,
    items = [],
    subtotal = 0,
    gstTax = 0,
    grandTotal = 0,
    profitEarned = 0,
  } = billPayload;

  const userKey = String(userId).toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Deduct Stock in LocalStorage & Supabase
  await deductStockInSupabase(userId, items);

  // 2. User-scoped Local Storage Cash Inflow Transaction
  const txKey = `finsight_transactions_${userKey}`;
  const existingTransactions = JSON.parse(localStorage.getItem(txKey) || '[]');
  const newTx = {
    id: `tx-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type: 'IN',
    description: `Customer POS Sale (Bill #${billNo} - ${customerName})`,
    category: 'Customer Sale',
    amount: `₹ ${grandTotal.toLocaleString('en-IN')}`,
    balance: `₹ ${grandTotal.toLocaleString('en-IN')}`,
    user_id: userId,
  };
  existingTransactions.unshift(newTx);
  localStorage.setItem(txKey, JSON.stringify(existingTransactions));
  localStorage.setItem('finsight_transactions', JSON.stringify(existingTransactions));

  // 3. User-scoped Local Storage Customer Bill Record
  const billsKey = `finsight_customer_invoices_${userKey}`;
  const storedBills = JSON.parse(localStorage.getItem(billsKey) || '[]');
  const billRecord = {
    id: `bill-${Date.now()}`,
    billNo,
    invoice_number: billNo,
    supplier_name: customerName,
    customerName,
    customerPhone,
    items,
    subtotal,
    gstTax,
    grandTotal,
    grand_total: grandTotal,
    profitEarned,
    createdAt: new Date().toISOString(),
    invoice_date: new Date().toISOString().split('T')[0],
    status: 'Paid',
  };
  storedBills.unshift(billRecord);
  localStorage.setItem(billsKey, JSON.stringify(storedBills));
  localStorage.setItem('finsight_customer_invoices', JSON.stringify(storedBills));

  // 4. Save to Supabase Cloud Database tables
  if (isSupabaseConfigured()) {
    try {
      // Save customer bill details to customer_bills table
      await supabase.from('customer_bills').insert([{
        id: billRecord.id,
        user_id: userId,
        bill_number: billNo,
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal: parseFloat(subtotal) || 0,
        tax_gst: parseFloat(gstTax) || 0,
        grand_total: parseFloat(grandTotal) || 0,
        profit_earned: parseFloat(profitEarned) || 0,
        status: 'Paid',
        items: items,
        created_at: new Date().toISOString(),
      }]);

      await supabase.from('transactions').insert([{
        id: newTx.id,
        user_id: userId,
        type: 'IN',
        description: newTx.description,
        category: 'Customer Sale',
      }]);
    } catch (err) {
      console.warn('[Supabase Customer Bill Insert Notice]:', err.message);
    }
  }

  // Log audit activity
  addActivityLog({
    userId: userId,
    action: '💳 Customer POS Bill Created',
    details: `Generated Bill #${billNo} for '${customerName}' - Total: ₹ ${parseFloat(grandTotal || 0).toLocaleString('en-IN')}`,
    category: 'POS Sales',
  }).catch(() => {});

  return { success: true, bill: billRecord, transaction: newTx };
}

/**
 * Fetch All Saved OCR Invoices from Supabase Database
 */
export async function getStoredOcrInvoicesFromSupabase() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {}
  }
  return JSON.parse(localStorage.getItem('finsight_ocr_invoices') || '[]');
}

/* ─────────────────────────────────────────────────────────────
   DELETE STOCK & UPDATE MRP IN SUPABASE
   ───────────────────────────────────────────────────────────── */

/**
 * Delete a stock product from Supabase & LocalStorage
 */
export async function deleteStockFromSupabase(userId, itemName) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_stock_inventory_${userKey}`;

  try {
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = existing.filter(st => (st.name || st.item_name || '').toLowerCase() !== (itemName || '').toLowerCase());
    localStorage.setItem(localKey, JSON.stringify(filtered));
    localStorage.setItem('finsight_stock_inventory', JSON.stringify(filtered));
  } catch (e) {}

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('inventory')
        .delete()
        .eq('user_id', targetId)
        .ilike('name', itemName);
    } catch (err) {
      console.warn('[Supabase Stock Delete Error]:', err.message);
    }
  }

  // Log audit activity
  addActivityLog({
    userId: targetId,
    action: '🗑️ Deleted Stock Product',
    details: `Removed '${itemName}' from store inventory database.`,
    category: 'Inventory Audit',
  }).catch(() => {});
}

/**
 * Update the Retail MRP (selling_price) for a stock product in Supabase & LocalStorage
 */
export async function updateStockMrpInSupabase(userId, itemName, newMRP) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_stock_inventory_${userKey}`;

  try {
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = existing.map(st => {
      if ((st.name || st.item_name || '').toLowerCase() === (itemName || '').toLowerCase()) {
        return { ...st, selling_price: newMRP, sellingPrice: newMRP, updated_at: new Date().toISOString() };
      }
      return st;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
    localStorage.setItem('finsight_stock_inventory', JSON.stringify(updated));
  } catch (e) {}

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('inventory')
        .update({ selling_price: newMRP, updated_at: new Date().toISOString() })
        .eq('user_id', targetId)
        .ilike('name', itemName);
    } catch (err) {
      console.warn('[Supabase Stock MRP Update Error]:', err.message);
    }
  }

  // Log audit activity
  addActivityLog({
    userId: targetId,
    action: '✏️ Updated Product MRP Price',
    details: `Updated Retail MRP price for '${itemName}' to ${newMRP}.`,
    category: 'Price Management',
  }).catch(() => {});
}

/* ─────────────────────────────────────────────────────────────
   SYSTEM & AUDIT ACTIVITY LOGS
   ───────────────────────────────────────────────────────────── */

/**
 * Log System Activity Event to Supabase & LocalStorage
 */
export async function addActivityLog({ userId, action, details, category = 'System Log' }) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const ownerId = activeUser.owner_id || targetId;
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_activity_logs_${userKey}`;

  const logEntry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: targetId,
    shop_id: targetId,
    owner_id: ownerId,
    user_role: activeUser.role || 'owner',
    user_name: activeUser.company_name || activeUser.user_id || 'User',
    action: action || 'Activity Logged',
    details: details || 'Store data modified',
    category: category,
    created_at: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    existing.unshift(logEntry);
    localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {}

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('activity_logs').insert([{
        id: logEntry.id,
        user_id: targetId,
        shop_id: targetId,
        owner_id: ownerId,
        action: logEntry.action,
        details: logEntry.details,
        category: logEntry.category,
        created_at: logEntry.created_at,
      }]);
    } catch (err) {
      console.warn('[Supabase Activity Log Error]:', err.message);
    }
  }

  return logEntry;
}

/**
 * Fetch System Activity Logs from Supabase Cloud Database & LocalStorage (Scoped strictly per user)
 */
export async function getActivityLogsFromSupabase(userId) {
  const activeUser = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const targetId = userId || activeUser.user_id || activeUser.email || 'user';
  const targetOwnerId = activeUser.owner_id || targetId;
  const userKey = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const localKey = `finsight_activity_logs_${userKey}`;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .or(`user_id.eq.${targetId},shop_id.eq.${targetId},owner_id.eq.${targetOwnerId}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[Supabase Audit Log Fetch Error]:', err.message);
    }
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
}
