import React, { useState, useEffect } from 'react';
import {
  Package, Search, Filter, RefreshCw, CheckCircle2,
  AlertTriangle, Eye, ArrowUpDown, Tag
} from 'lucide-react';
import { apiGetInventory } from '../../services/api';
import { getInventoryFromSupabase } from '../../services/supabaseClient';

export default function InventoryReadOnlyModule() {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';
  const activeUserKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');

  const [inventoryList, setInventoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const consolidateStock = (rawList) => {
    if (!rawList || rawList.length === 0) return [];
    const map = new Map();
    rawList.forEach(st => {
      const name = (st.name || st.item_name || 'Stock Product').trim();
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const rateVal = parseFloat(String(st.unit_price || st.rate || st.cost_price || st.costPrice || '0').replace(/[^0-9.]/g, '')) || 100;
      const sellVal = parseFloat(String(st.selling_price || st.sellingPrice || st.unitPrice || '').replace(/[^0-9.]/g, '')) || Math.round(rateVal * 1.2);
      const qtyVal = parseFloat(String(st.stock_qty !== undefined ? st.stock_qty : (st.stockQty !== undefined ? st.stockQty : st.quantity || '0')).replace(/[^0-9.]/g, '')) || 0;
      const gstVal = st.gstRate !== undefined ? st.gstRate : (name.toLowerCase().includes('detergent') ? 18 : 5);

      if (map.has(key)) {
        const existing = map.get(key);
        existing.stockQty += qtyVal;
      } else {
        map.set(key, {
          id: st.id || `SKU-${key}`,
          name,
          category: st.category || 'General Store',
          sellingPrice: sellVal,
          gstRate: gstVal,
          stockQty: qtyVal,
          minAlertThreshold: st.minAlertThreshold || 15,
        });
      }
    });
    return Array.from(map.values());
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Check user-scoped local cache ONLY (never fall back to global shared key)
      const stockKey = `finsight_stock_inventory_${activeUserKey}`;
      const local = JSON.parse(localStorage.getItem(stockKey) || '[]');
      if (local.length > 0) {
        setInventoryList(consolidateStock(local));
        setLoading(false);
        return;
      }

      // 2. Try Supabase (strictly scoped to this user's ID)
      const supa = await getInventoryFromSupabase(activeUserId);
      if (supa && supa.length > 0) {
        // Cache into user-scoped key
        localStorage.setItem(stockKey, JSON.stringify(supa));
        setInventoryList(consolidateStock(supa));
        setLoading(false);
        return;
      }

      // 3. Try Express backend (which already enforces shopId isolation)
      const res = await apiGetInventory();
      if (res && res.inventory && res.inventory.length > 0) {
        // Cache into user-scoped key
        localStorage.setItem(stockKey, JSON.stringify(res.inventory));
        setInventoryList(consolidateStock(res.inventory));
      } else {
        // New user — empty inventory, nothing to show
        setInventoryList([]);
      }
    } catch (e) {
      console.warn('Read-only stock notice:', e.message);
      setInventoryList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeUserId]);

  const filtered = inventoryList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', ...Array.from(new Set(inventoryList.map(i => i.category)))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
        borderRadius: 14, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'var(--fg-accent-soft)', border: '1px solid var(--fg-border-accent)',
            color: 'var(--fg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                Store Stock & Available Inventory
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                background: 'rgba(59,130,246,0.15)', color: '#60A5FA',
                border: '1px solid rgba(59,130,246,0.3)',
              }}>
                READ ONLY
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '2px 0 0' }}>
              Check available quantities and retail MRP prices for checkout assistance.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
            color: 'var(--fg-text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={13} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
        borderRadius: 14, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240,
          background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <Search size={15} color="var(--fg-text-muted)" />
          <input
            type="text"
            placeholder="Search stock product name or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              color: 'var(--fg-text-primary)', fontSize: 13, width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: categoryFilter === c ? 'var(--fg-accent-soft)' : 'var(--fg-bg-secondary)',
                border: `1px solid ${categoryFilter === c ? 'var(--fg-border-accent)' : 'var(--fg-border)'}`,
                color: categoryFilter === c ? 'var(--fg-accent)' : 'var(--fg-text-secondary)',
                fontSize: 12, fontWeight: categoryFilter === c ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div style={{
        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--fg-bg-secondary)', borderBottom: '1px solid var(--fg-border)', color: 'var(--fg-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 18px' }}>Product Name</th>
              <th style={{ padding: '12px 18px' }}>Category</th>
              <th style={{ padding: '12px 18px' }}>Selling Price (MRP)</th>
              <th style={{ padding: '12px 18px' }}>GST Rate</th>
              <th style={{ padding: '12px 18px' }}>Available Stock</th>
              <th style={{ padding: '12px 18px' }}>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--fg-text-muted)' }}>
                  No stock items match your search.
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const isLow = item.stockQty <= (item.minAlertThreshold || 15);
                const isOut = item.stockQty <= 0;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--fg-border)', transition: 'background 0.1s ease' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--fg-text-secondary)' }}>
                      {item.category}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--fg-accent)' }}>
                      ₹ {item.sellingPrice}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--fg-text-secondary)' }}>
                      {item.gstRate}%
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: isOut ? 'var(--fg-danger)' : (isLow ? '#F59E0B' : 'var(--fg-text-primary)') }}>
                      {item.stockQty} Units
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                        background: isOut ? 'rgba(239,68,68,0.15)' : (isLow ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'),
                        color: isOut ? 'var(--fg-danger)' : (isLow ? '#F59E0B' : 'var(--fg-success)'),
                        border: `1px solid ${isOut ? 'rgba(239,68,68,0.3)' : (isLow ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)')}`,
                      }}>
                        {isOut ? '● Out of Stock' : (isLow ? '● Low Stock' : '● Available')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
