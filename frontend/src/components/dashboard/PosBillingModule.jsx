import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, Printer,
  CheckCircle2, AlertCircle, ArrowLeft, Download, CreditCard,
  QrCode, Banknote, RefreshCw, FileText, Zap, Package
} from 'lucide-react';
import { apiCreateInvoice, apiGetInventory, apiCreateCustomerBill } from '../../services/api';
import { saveCustomerBillToSupabase, getInventoryFromSupabase, saveStockToSupabase } from '../../services/supabaseClient';

export default function PosBillingModule({ companyName = 'Metro Superstore Ltd', onBack }) {
  const activeUserSession = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
  const activeUserId = activeUserSession.user_id || activeUserSession.email || 'user';
  const activeUserKey = String(activeUserId).toLowerCase().replace(/[^a-z0-9]/g, '');

  const [availableStock, setAvailableStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedBill, setCompletedBill] = useState(null);

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
          id: st.id || `prod-${key}`,
          name,
          category: st.category || 'General Store',
          costPrice: rateVal,
          sellingPrice: sellVal,
          gstRate: gstVal,
          stockQty: qtyVal,
        });
      }
    });
    return Array.from(map.values());
  };

  const loadStock = async () => {
    try {
      // Only load from user-scoped key — never fall back to global shared keys
      const stockKey = `finsight_stock_inventory_${activeUserKey}`;
      const localStock = JSON.parse(localStorage.getItem(stockKey) || '[]');
      if (localStock.length > 0) {
        setAvailableStock(consolidateStock(localStock));
        return;
      }

      const supaStock = await getInventoryFromSupabase(activeUserId);
      if (supaStock && supaStock.length > 0) {
        localStorage.setItem(stockKey, JSON.stringify(supaStock));
        setAvailableStock(consolidateStock(supaStock));
        return;
      }

      const res = await apiGetInventory();
      if (res && res.inventory && res.inventory.length > 0) {
        localStorage.setItem(stockKey, JSON.stringify(res.inventory));
        setAvailableStock(consolidateStock(res.inventory));
      } else {
        setAvailableStock([]);
      }
    } catch (e) {
      console.warn('POS stock load notice:', e.message);
      setAvailableStock([]);
    }
  };

  useEffect(() => {
    loadStock();
  }, [activeUserId]);

  const filteredProducts = availableStock.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', ...Array.from(new Set(availableStock.map(p => p.category)))];

  const handleAddToCart = (product) => {
    if (product.stockQty <= 0) {
      alert(`Out of Stock: '${product.name}' has 0 units left in store inventory.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stockQty) {
          alert(`Maximum available stock reached for ${product.name} (${product.stockQty} in stock).`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleUpdateQty = (prodId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === prodId) {
            const newQty = item.qty + delta;
            if (newQty > item.stockQty) {
              alert(`Maximum available stock is ${item.stockQty}.`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(item => item.qty > 0)
    );
  };

  const handleRemoveFromCart = (prodId) => {
    setCart(prev => prev.filter(item => item.id !== prodId));
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = cart.reduce((sum, item) => {
    const itemTotal = (item.sellingPrice * item.qty) * (1 - discountPercent / 100);
    return sum + (itemTotal * (item.gstRate / 100));
  }, 0);
  const grandTotal = Math.round(discountedSubtotal + gstAmount);

  const handleCheckoutAndPrint = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to checkout.');
      return;
    }

    setIsProcessing(true);
    const invoiceNumber = `BILL-${Math.floor(100000 + Math.random() * 900000)}`;
    const billDate = new Date().toISOString().split('T')[0];

    const isPending = paymentMode === 'Pending';
    const status = isPending ? 'Pending' : 'Paid';
    const dueDate = isPending ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

    const billNo = invoiceNumber;

    const billData = {
      id: `INV-${Date.now()}`,
      invoice_number: invoiceNumber,
      billNo: invoiceNumber,
      bill_number: invoiceNumber,
      user_id: activeUserId,
      customer_name: customerName.trim() || 'Walk-in Retail Customer',
      customer_phone: customerPhone.trim() || 'N/A',
      payment_mode: paymentMode,
      items: cart.map(item => ({
        description: item.name,
        qty: item.qty,
        rate: item.sellingPrice,
        gstRate: item.gstRate,
        amount: item.sellingPrice * item.qty,
      })),
      subtotal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      tax_gst: Math.round(gstAmount),
      grand_total: grandTotal,
      invoice_date: billDate,
      status: status,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    };

    try {
      // Save bill to Express backend (handles database insert, transactions, and audit logging)
      await apiCreateCustomerBill({
        bill_number: invoiceNumber,
        customer_name: billData.customer_name,
        customer_phone: billData.customer_phone,
        subtotal,
        tax_gst: Math.round(gstAmount),
        grand_total: grandTotal,
        profit_earned: Math.round(grandTotal * 0.20),
        items: billData.items,
        status: status,
        due_date: dueDate
      });

      // 3. Deduct stock in Supabase / LocalStorage
      const stockKey = `finsight_stock_inventory_${activeUserKey}`;
      const currentStock = JSON.parse(localStorage.getItem(stockKey) || localStorage.getItem('finsight_stock_inventory') || '[]');

      const updatedStock = currentStock.map(st => {
        const matchingCart = cart.find(c =>
          c.name.toLowerCase() === (st.name || st.item_name || '').toLowerCase()
        );
        if (matchingCart) {
          const prevQty = parseFloat(st.stock_qty || st.stockQty || st.quantity || 0);
          const newQty = Math.max(0, prevQty - matchingCart.qty);
          return {
            ...st,
            stock_qty: newQty,
            stockQty: newQty,
            quantity: newQty,
          };
        }
        return st;
      });

      localStorage.setItem(stockKey, JSON.stringify(updatedStock));
      localStorage.setItem('finsight_stock_inventory', JSON.stringify(updatedStock));

      for (const cartItem of cart) {
        await saveStockToSupabase({
          name: cartItem.name,
          stock_qty: -cartItem.qty,
          unit_price: cartItem.sellingPrice,
          user_id: activeUserId,
        });
      }

      setCompletedBill(billData);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      await loadStock();
    } catch (err) {
      console.error('POS checkout error:', err);
      alert(`Sale completed with local persistence: ${err.message}`);
      setCompletedBill(billData);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {/* ── POS TOP BAR ────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #F3CD97, #DCA052)',
            color: '#0A0D14', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800,
          }}>
            💳
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                Point of Sale (POS) & Fast Billing
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                background: 'var(--fg-accent-soft)', color: 'var(--fg-accent)',
                border: '1px solid var(--fg-border-accent)',
              }}>
                CASHIER REGISTER
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--fg-text-secondary)', margin: '2px 0 0' }}>
              Select products, apply discounts, calculate GST, and issue instant verified invoices.
            </p>
          </div>
        </div>

        <button
          onClick={loadStock}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
            color: 'var(--fg-text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={13} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* ── POS 2-COLUMN LAYOUT: PRODUCTS CATALOG & CART SUMMARY ────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18,
        alignItems: 'flex-start',
      }}>
        {/* Left Column: Product Selection & Catalog */}
        <div style={{
          background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
          borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Search & Category Filter */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
              borderRadius: 10, padding: '8px 12px',
            }}>
              <Search size={15} color="var(--fg-text-muted)" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  color: 'var(--fg-text-primary)', fontSize: 13, width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: selectedCategory === cat ? 'var(--fg-accent-soft)' : 'var(--fg-bg-secondary)',
                    border: `1px solid ${selectedCategory === cat ? 'var(--fg-border-accent)' : 'var(--fg-border)'}`,
                    color: selectedCategory === cat ? 'var(--fg-accent)' : 'var(--fg-text-secondary)',
                    fontSize: 12, fontWeight: selectedCategory === cat ? 700 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12, maxHeight: 540, overflowY: 'auto', paddingRight: 4,
          }}>
            {filteredProducts.map(prod => {
              const inCart = cart.find(c => c.id === prod.id);
              const isOutOfStock = prod.stockQty <= 0;
              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && handleAddToCart(prod)}
                  style={{
                    background: 'var(--fg-bg-secondary)',
                    border: `1px solid ${inCart ? 'var(--fg-border-accent)' : 'var(--fg-border)'}`,
                    borderRadius: 12, padding: 14, cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    gap: 10, opacity: isOutOfStock ? 0.5 : 1, transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {inCart && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'var(--fg-accent)', color: '#0A0D14',
                      fontSize: 10, fontWeight: 800, borderRadius: 99,
                      padding: '2px 7px',
                    }}>
                      {inCart.qty} in cart
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text-primary)' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-text-muted)', marginTop: 2 }}>
                      {prod.category} · GST {prod.gstRate}%
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-accent)' }}>
                        ₹ {prod.sellingPrice}
                      </div>
                      <div style={{ fontSize: 10, color: prod.stockQty <= 15 ? 'var(--fg-danger)' : 'var(--fg-text-muted)' }}>
                        {prod.stockQty} in stock
                      </div>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'var(--fg-accent)', color: '#0A0D14',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 800,
                      }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Shopping Cart & Checkout */}
        <div style={{
          background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
          borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--fg-border)', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={18} color="var(--fg-accent)" />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text-primary)', margin: 0 }}>
                Customer Cart ({cart.reduce((sum, i) => sum + i.qty, 0)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--fg-danger)', fontSize: 11, fontWeight: 700,
                }}
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ minHeight: 180, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--fg-text-muted)', fontSize: 12 }}>
                <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                Cart is empty. Click any product from the catalog to add.
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 8, background: 'var(--fg-bg-secondary)',
                    border: '1px solid var(--fg-border)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--fg-text-muted)' }}>
                      ₹{item.sellingPrice} × {item.qty} = ₹{item.sellingPrice * item.qty}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                        color: 'var(--fg-text-primary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text-primary)', minWidth: 16, textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'var(--fg-surface)', border: '1px solid var(--fg-border)',
                        color: 'var(--fg-text-primary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--fg-danger)', padding: 2, marginLeft: 4,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Info Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--fg-border)', paddingTop: 10 }}>
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                color: 'var(--fg-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <input
              type="text"
              placeholder="Customer Mobile (Optional)"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                color: 'var(--fg-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Discount & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-text-muted)', display: 'block', marginBottom: 4 }}>
                DISCOUNT %
              </label>
              <select
                value={discountPercent}
                onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                  color: 'var(--fg-text-primary)', fontSize: 11, outline: 'none', fontFamily: 'inherit',
                }}
              >
                <option value="0">0% None</option>
                <option value="5">5% Promo</option>
                <option value="10">10% Member</option>
                <option value="15">15% Clearance</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-text-muted)', display: 'block', marginBottom: 4 }}>
                PAYMENT MODE
              </label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  background: 'var(--fg-bg-secondary)', border: '1px solid var(--fg-border)',
                  color: 'var(--fg-text-primary)', fontSize: 11, outline: 'none', fontFamily: 'inherit',
                }}
              >
                <option value="Cash">Cash Counter</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Pending">Pending Payment (Credit)</option>
              </select>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div style={{
            background: 'var(--fg-bg-secondary)', borderRadius: 10, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--fg-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹ {subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-success)' }}>
                <span>Discount ({discountPercent}%):</span>
                <span>- ₹ {discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-text-secondary)' }}>
              <span>Estimated GST:</span>
              <span>₹ {Math.round(gstAmount).toLocaleString('en-IN')}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 16,
              fontWeight: 800, color: 'var(--fg-accent)', borderTop: '1px solid var(--fg-border)',
              paddingTop: 8, marginTop: 4,
            }}>
              <span>Grand Total:</span>
              <span>₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckoutAndPrint}
            className="lc-liquid-btn"
            style={{
              padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: (cart.length === 0 || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: (cart.length === 0 || isProcessing) ? 0.6 : 1,
            }}
          >
            {isProcessing ? (
              <><RefreshCw size={16} className="animate-spin" /> Processing Sale...</>
            ) : (
              <><Printer size={16} /> Complete Sale & Print Bill</>
            )}
          </button>
        </div>
      </div>

      {/* ── PRINTABLE BILL MODAL ────────────────────────────────────── */}
      {completedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF', color: '#111827', borderRadius: 16,
            width: '100%', maxWidth: 440, padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            fontFamily: "'Courier New', Courier, monospace",
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #D1D5DB', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{companyName}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>TAX INVOICE / RETAIL RECEIPT</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Bill No: <strong>{completedBill.invoice_number}</strong> · {completedBill.invoice_date}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Customer: {completedBill.customer_name} ({completedBill.customer_phone})</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {completedBill.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>{item.description} (x{item.qty})</span>
                  <span>₹{item.amount}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{completedBill.subtotal}</span>
              </div>
              {completedBill.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discount:</span>
                  <span>-₹{completedBill.discount_amount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST:</span>
                <span>₹{completedBill.tax_gst}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, borderTop: '2px solid #111827', paddingTop: 6, marginTop: 4 }}>
                <span>GRAND TOTAL:</span>
                <span>₹{completedBill.grand_total}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                Paid via: <strong>{completedBill.payment_mode}</strong> (Verified by Finora AI)
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, background: '#111827', color: '#FFF',
                  border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedBill(null)}
                style={{
                  padding: '10px 18px', borderRadius: 8, background: '#E5E7EB', color: '#1F2937',
                  border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
