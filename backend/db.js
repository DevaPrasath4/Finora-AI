/**
 * db.js — Finora AI Supabase Database Layer
 *
 * All remote data is stored in and read from Supabase.
 * This module exposes the same interface (getTable, insert, update, delete)
 * as the old JSON wrapper so every route file works without changes.
 *
 * Column name normalisation:
 *   Supabase stores snake_case columns (stock_qty, min_alert_threshold…).
 *   The old JSON store used camelCase (stockQty, minAlertThreshold…).
 *   We normalise on the way out so the rest of the app is unaffected.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function readJsonFallback(tableName) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return json[tableName] || [];
    }
  } catch (e) {
    console.warn('[DB json read fallback warning]:', e.message);
  }
  return [];
}

function writeJsonFallback(tableName, newItem) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (!json[tableName]) json[tableName] = [];
      json[tableName].unshift(newItem);
      fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('[DB json write fallback warning]:', e.message);
  }
}

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_ENABLED = process.env.SUPABASE_ENABLED === 'true';

if (SUPABASE_ENABLED && (!SUPABASE_URL || !SUPABASE_SECRET)) {
  console.warn('[DB WARNING]: Supabase is enabled but SUPABASE_URL or a Supabase key is missing. Running in fallback mode.');
}

export const supabase = (SUPABASE_ENABLED && SUPABASE_URL && SUPABASE_SECRET)
  ? createClient(SUPABASE_URL, SUPABASE_SECRET, { auth: { persistSession: false } })
  : null;

// ── Table name aliases ─────────────────────────────────────────────────────────
// The old code referenced 'employees'; Supabase table is 'employees'.
// The old code referenced 'vendors';   Supabase table is 'vendors'.
const TABLE_MAP = {
  employees:       'employees',
  vendors:         'vendors',
  inventory:       'inventory',
  invoices:        'invoices',
  payments:        'payments',
  customer_bills:  'customer_bills',
  transactions:    'transactions',
  expenses:        'expenses',
  fraud_alerts:    'fraud_alerts',
  activity_logs:   'activity_logs',
  users:           'users',
  salary_payments: 'salary_payments',
  staff:           'employees',   // legacy alias
};

// ── Column normalisation: snake_case → camelCase for inventory ────────────────
function normaliseRow(tableName, row) {
  if (!row) return row;
  if (tableName === 'inventory') {
    return {
      ...row,
      stockQty:           row.stock_qty           ?? row.stockQty,
      minAlertThreshold:  row.min_alert_threshold  ?? row.minAlertThreshold,
      unitPrice:          row.unit_price            ?? row.unitPrice,
      costPrice:          row.cost_price            ?? row.costPrice,
      sellingPrice:       row.selling_price         ?? row.sellingPrice,
      gstRate:            row.gst_rate              ?? row.gstRate,
      supplierName:       row.supplier_name         ?? row.supplierName ?? row.supplier,
      supplier:           row.supplier_name         ?? row.supplier,
    };
  }
  if (tableName === 'employees' || tableName === 'staff') {
    return {
      ...row,
      salary_date:     row.salary_date     ?? row.salaryDate,
      payment_status:  row.payment_status  ?? row.paymentStatus,
      payment_history: row.payment_history ?? row.paymentHistory ?? [],
      joined_date:     row.joined_date     ?? row.joinedDate,
      joinedDate:      row.joined_date     ?? row.joinedDate,
    };
  }
  if (tableName === 'vendors') {
    return {
      ...row,
      contactPerson: row.contact_person ?? row.contactPerson,
      totalBilled:   row.total_billed   ?? row.totalBilled,
      trustScore:    row.trust_score    ?? row.trustScore,
    };
  }
  if (tableName === 'salary_payments') {
    return {
      ...row,
      employee_id:    row.employee_id    ?? row.employeeId,
      employee_name:  row.employee_name  ?? row.employeeName,
      payment_date:   row.payment_date   ?? row.paymentDate,
      payment_method: row.payment_method ?? row.paymentMethod,
    };
  }
  return row;
}

// ── Column normalisation: camelCase → snake_case for writes ─────────────────
function toDbRow(tableName, obj) {
  if (!obj) return obj;
  const row = { ...obj };
  if (tableName === 'inventory') {
    if (row.stockQty           !== undefined) { row.stock_qty           = row.stockQty;           delete row.stockQty; }
    if (row.minAlertThreshold  !== undefined) { row.min_alert_threshold = row.minAlertThreshold;  delete row.minAlertThreshold; }
    if (row.unitPrice          !== undefined) { row.unit_price          = row.unitPrice;          delete row.unitPrice; }
    if (row.costPrice          !== undefined) { row.cost_price          = row.costPrice;          delete row.costPrice; }
    if (row.sellingPrice       !== undefined) { row.selling_price       = row.sellingPrice;       delete row.sellingPrice; }
    if (row.gstRate            !== undefined) { row.gst_rate            = row.gstRate;            delete row.gstRate; }
    if (row.supplier           !== undefined) { row.supplier_name       = row.supplier;           delete row.supplier; }
    if (row.supplierName       !== undefined) { row.supplier_name       = row.supplierName;       delete row.supplierName; }
  }
  if (tableName === 'employees' || tableName === 'staff') {
    if (row.salaryDate       !== undefined) { row.salary_date     = row.salaryDate;     delete row.salaryDate; }
    if (row.paymentStatus    !== undefined) { row.payment_status  = row.paymentStatus;  delete row.paymentStatus; }
    if (row.paymentHistory   !== undefined) { row.payment_history = row.paymentHistory; delete row.paymentHistory; }
    if (row.joinedDate       !== undefined) { row.joined_date     = row.joinedDate;     delete row.joinedDate; }
  }
  if (tableName === 'vendors') {
    if (row.contactPerson !== undefined) { row.contact_person = row.contactPerson; delete row.contactPerson; }
    if (row.totalBilled   !== undefined) { row.total_billed   = row.totalBilled;   delete row.totalBilled; }
    if (row.trustScore    !== undefined) { row.trust_score    = row.trustScore;    delete row.trustScore; }
  }
  if (tableName === 'salary_payments') {
    if (row.employeeId    !== undefined) { row.employee_id    = row.employeeId;    delete row.employeeId; }
    if (row.employeeName  !== undefined) { row.employee_name  = row.employeeName;  delete row.employeeName; }
    if (row.paymentDate   !== undefined) { row.payment_date   = row.paymentDate;   delete row.paymentDate; }
    if (row.paymentMethod !== undefined) { row.payment_method = row.paymentMethod; delete row.paymentMethod; }
  }
  return row;
}

// ── Helper: resolve real table name ──────────────────────────────────────────
function resolveTable(name) {
  return TABLE_MAP[name] || name;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Database class — exposes the same API as the old JSON wrapper
// All methods are async and return resolved values (not Promises) via await
// at the route level.
// ═══════════════════════════════════════════════════════════════════════════════
class SupabaseDatabase {
  /**
   * getTable(tableName) — fetch all rows for a table (synchronous-style shim).
   * Because routes call this synchronously (db.getTable(...).filter(...)),
   * we cache a per-request snapshot.
   *
   * NOTE: For full Supabase integration routes should call await db.fetchTable().
   * The synchronous shim below works for the transition period by returning
   * the last-fetched snapshot.  Use db.fetchTable(name) for fresh data.
   */
  constructor() {
    this._cache = {};
  }

  // ── Async: fetch all rows for a table scoped by user ──────────────────────
  async fetchTable(tableName) {
    const tbl = resolveTable(tableName);
    let rows = [];
    try {
      if (supabase) {
        const { data, error } = await supabase.from(tbl).select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          rows = data.map(r => normaliseRow(tableName, r));
        }
      }
    } catch (err) {
      console.warn(`[DB fetchTable ${tbl} warning]:`, err.message);
    }

    const localRows = readJsonFallback(tableName);
    if (rows.length === 0) {
      rows = localRows;
    } else if (localRows.length > 0) {
      const existingKeys = new Set(rows.map(r => String(r.user_id || r.id || r.email || '').toLowerCase()));
      for (const loc of localRows) {
        const key = String(loc.user_id || loc.id || loc.email || '').toLowerCase();
        if (key && !existingKeys.has(key)) {
          rows.push(loc);
        }
      }
    }

    this._cache[tableName] = rows;
    return rows;
  }

  // ── Sync shim (returns cached snapshot — call fetchTable first) ───────────
  getTable(tableName) {
    return this._cache[tableName] || [];
  }

  // ── Async: insert a row ───────────────────────────────────────────────────
  async insert(tableName, item) {
    const tbl = resolveTable(tableName);
    const dbRow = toDbRow(tableName, { ...item });
    // Remove undefined values
    Object.keys(dbRow).forEach(k => { if (dbRow[k] === undefined) delete dbRow[k]; });

    let saved = null;
    try {
      if (supabase) {
        const { data, error } = await supabase.from(tbl).insert(dbRow).select();
        if (!error && data && data.length > 0) {
          saved = normaliseRow(tableName, data[0]);
        } else if (error) {
          console.warn(`[DB insert ${tbl} Supabase notice]:`, error.message);
        }
      }
    } catch (err) {
      console.warn(`[DB insert ${tbl} Supabase notice]:`, err.message);
    }

    if (!saved) {
      saved = { id: item.id || `ID-${Date.now()}`, ...item };
    }

    writeJsonFallback(tableName, saved);
    return saved;
  }

  // ── Async: update rows matching a field value ─────────────────────────────
  async update(tableName, matchField, matchValue, updateData) {
    const tbl = resolveTable(tableName);
    const dbRow = toDbRow(tableName, { ...updateData });
    Object.keys(dbRow).forEach(k => { if (dbRow[k] === undefined) delete dbRow[k]; });

    let updated = null;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from(tbl)
          .update(dbRow)
          .eq(matchField, matchValue)
          .select();

        if (!error && data && data.length > 0) {
          updated = normaliseRow(tableName, data[0]);
        } else if (error) {
          console.warn(`[DB update ${tbl} Supabase notice]:`, error.message);
        }
      }
    } catch (err) {
      console.warn(`[DB update ${tbl} Supabase notice]:`, err.message);
    }

    // Update in local JSON fallback as well
    try {
      if (fs.existsSync(DATA_FILE)) {
        const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (json[tableName]) {
          const idx = json[tableName].findIndex(r => String(r[matchField]) === String(matchValue));
          if (idx !== -1) {
            json[tableName][idx] = { ...json[tableName][idx], ...updateData };
            if (!updated) updated = json[tableName][idx];
            fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf8');
          }
        }
      }
    } catch (e) {
      console.warn('[DB json update fallback warning]:', e.message);
    }

    return updated || { [matchField]: matchValue, ...updateData };
  }

  // ── Async: delete rows matching a field value ─────────────────────────────
  async delete(tableName, matchField, matchValue) {
    const tbl = resolveTable(tableName);
    try {
      if (supabase) {
        const { error } = await supabase
          .from(tbl)
          .delete()
          .eq(matchField, matchValue);

        if (error) {
          console.warn(`[DB delete ${tbl} Supabase notice]:`, error.message);
        }
      }
    } catch (err) {
      console.warn(`[DB delete ${tbl} Supabase notice]:`, err.message);
    }

    // Delete from local JSON fallback as well
    try {
      if (fs.existsSync(DATA_FILE)) {
        const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (json[tableName]) {
          json[tableName] = json[tableName].filter(r => String(r[matchField]) !== String(matchValue));
          fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn('[DB json delete fallback warning]:', e.message);
    }

    return 1;
  }

  // ── Async: fetch rows scoped by shopId ────────────────────────────────────
  async fetchScoped(tableName, shopId) {
    const tbl = resolveTable(tableName);
    let rows = [];
    try {
      if (supabase) {
        const cleanShop = String(shopId || '').trim();
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .or(`user_id.eq.${cleanShop},shop_id.eq.${cleanShop},owner_id.eq.${cleanShop}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          rows = data.map(r => normaliseRow(tableName, r));
        }
      }
    } catch (err) {
      console.warn(`[DB fetchScoped ${tbl} notice]:`, err.message);
    }

    if (rows.length === 0 && shopId) {
      const local = readJsonFallback(tableName);
      const cleanShop = String(shopId).toLowerCase().trim();
      // STRICT: only return rows that exactly match this user's shopId
      rows = local.filter(r => {
        const uId = String(r.user_id || r.owner_id || '').toLowerCase().trim();
        return uId === cleanShop;
      });
    }

    return rows;
  }

  // ── Async: upsert settings (single record per user) ───────────────────────
  async upsertSettings(shopId, settingsData) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('settings')
          .upsert({ user_id: shopId, data: settingsData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .select()
          .single();
        if (!error && data) return data;
      }
    } catch (err) {
      console.warn('[DB upsertSettings notice]:', err.message);
    }
    return { user_id: shopId, data: settingsData };
  }

  // ── Async: fetch settings for a shop ──────────────────────────────────────
  async fetchSettings(shopId) {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('settings')
          .select('data')
          .eq('user_id', shopId)
          .single();
        if (!error && data) return data.data;
      }
    } catch (err) {}
    return null;
  }
}

export const db = new SupabaseDatabase();

/**
 * Centralized Automatic Audit Logging Helper
 * Extracts user headers and records consistent activity logs in Supabase.
 */
export async function createAuditLog(req, { action, module, description, category, entity_type, entity_id, old_value, new_value }) {
  try {
    const shopId = req?.shopId || 'user';
    const userId = req?.userId || 'user';
    const userRole = req?.userRole || 'owner';
    const userName = req?.headers?.['x-user-name'] || req?.body?.userName || userId;

    const logEntry = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      user_id: shopId,
      shop_id: shopId,
      owner_id: shopId,
      employee_id: userId,
      user_name: userName,
      user_role: userRole,
      action: action || 'System Event',
      module: module || category || 'General',
      category: category || module || 'System Log',
      description: description || action,
      details: description || action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      old_value: old_value ? String(old_value) : null,
      new_value: new_value ? String(new_value) : null,
      created_at: new Date().toISOString(),
    };

    await db.insert('activity_logs', logEntry);
    return logEntry;
  } catch (err) {
    console.warn('[Audit Logger Warning]:', err.message);
  }
}
