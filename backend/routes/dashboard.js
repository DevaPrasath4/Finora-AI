import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function getDaysUntilSalary(salaryDay) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  let targetDate = new Date(currentYear, currentMonth, salaryDay);
  if (targetDate < today && targetDate.toDateString() !== today.toDateString()) {
    targetDate = new Date(currentYear, currentMonth + 1, salaryDay);
  }
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const shopId = req.shopId;
    const [invoices, expenses, inventory, fraudAlerts, customerBills] = await Promise.all([
      db.fetchScoped('invoices', shopId),
      db.fetchScoped('expenses', shopId),
      db.fetchScoped('inventory', shopId),
      db.fetchScoped('fraud_alerts', shopId),
      db.fetchScoped('customer_bills', shopId),
    ]);

    const cleanNum = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
      return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
    };

    // Customer Sales (Revenue)
    const paidCustomerBills = customerBills.filter(b => b.status === 'Paid' || !b.status || b.status === 'SUCCESS');
    const totalSales = paidCustomerBills.reduce((acc, b) => acc + cleanNum(b.grand_total || b.grandTotal || 0), 0);

    // Vendor Invoices + Store Expenses (Expenses)
    const totalVendorPurchases = invoices.reduce((acc, inv) => acc + cleanNum(inv.grand_total || inv.grandTotal || 0), 0);
    const totalOtherExpenses = expenses.reduce((acc, exp) => acc + cleanNum(exp.amount || 0), 0);
    const totalExpenses = totalVendorPurchases + totalOtherExpenses;

    const netProfit = totalSales - totalExpenses;
    const netMarginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

    const totalTaxGst = invoices.reduce((acc, inv) => acc + cleanNum(inv.tax_gst || inv.taxGst || 0), 0);
    const lowStockCount = inventory.filter(i => {
      const qty = parseInt(String(i.stockQty !== undefined ? i.stockQty : i.stock_qty || 0).replace(/[^0-9]/g, '')) || 0;
      const thresh = parseInt(String(i.minAlertThreshold || i.min_alert_threshold || 15)) || 15;
      return qty <= thresh;
    }).length;
    const highRiskCount = invoices.filter(inv => inv.status === 'Flagged High Risk').length;
    const activeAlertsCount = fraudAlerts.filter(a => !a.resolved).length;

    const pendingCustomerBills = customerBills.filter(b => b.status === 'Pending' || b.status === 'Pending Payment (Credit)');
    const pendingBillsCount = pendingCustomerBills.length;
    const pendingBillsAmount = pendingCustomerBills.reduce((acc, b) => acc + cleanNum(b.grand_total || b.grandTotal || 0), 0);

    res.json({
      success: true,
      stats: {
        totalSales,
        totalExpenses,
        totalVendorPurchases,
        netProfit,
        netMarginPct,
        totalMonthlyRevenue: `₹ ${(totalSales / 100000).toFixed(2)}L`,
        totalInvoicesVal: totalVendorPurchases,
        totalInvoicesCount: invoices.length,
        totalCustomerBillsCount: customerBills.length,
        estimatedGstClaimable: `₹ ${totalTaxGst.toLocaleString('en-IN')}`,
        lowStockItemsCount: lowStockCount,
        highRiskInvoicesCount: highRiskCount,
        activeAlertsCount,
        pendingBillsCount,
        pendingBillsAmount,
        sparklines: {
          revenue: totalSales > 0 ? [40, 55, 70, 60, 85, 95] : [0, 0, 0, 0, 0, 0],
          profit:  netProfit > 0 ? [20, 25, 38, 42, 50, 64] : [0, 0, 0, 0, 0, 0],
          gst:     totalTaxGst > 0 ? [12, 18, 22, 28, 32, 48] : [0, 0, 0, 0, 0, 0],
        },
      },
    });
  } catch (err) {
    console.error('[Dashboard stats error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/notifications
router.get('/notifications', async (req, res) => {
  try {
    const shopId = req.shopId;
    const [alerts, employees] = await Promise.all([
      db.fetchScoped('fraud_alerts', shopId),
      db.fetchScoped('employees', shopId),
    ]);

    const notifications = [...alerts];

    employees.forEach(emp => {
      const salaryDay = parseInt(emp.salary_date || emp.salaryDate || '5');
      const daysUntil = getDaysUntilSalary(salaryDay);
      if (daysUntil <= 3) {
        notifications.unshift({
          id: `sal-rem-${emp.id}`,
          user_id: shopId,
          type: 'Salary Reminder',
          message: `The salary payment for ${emp.name} is due in ${daysUntil} days. Ensure sufficient funds are available.`,
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error('[Dashboard notifications error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
