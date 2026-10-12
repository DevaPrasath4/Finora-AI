import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

const GROQ_KEYS = {
  finance: process.env.GROQ_API_KEY_FINANCE,
  fraud_growth: process.env.GROQ_API_KEY_FRAUD_GROWTH,
};

const cleanNum = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
};

// Helper: get comprehensive store data scoped to shopId asynchronously from Supabase
async function getFullStoreContext(shopId) {
  const [invoices, inventory, expenses, transactions, customerBills, employees, vendors] = await Promise.all([
    db.fetchScoped('invoices', shopId),
    db.fetchScoped('inventory', shopId),
    db.fetchScoped('expenses', shopId),
    db.fetchScoped('transactions', shopId),
    db.fetchScoped('customer_bills', shopId),
    db.fetchScoped('employees', shopId),
    db.fetchScoped('vendors', shopId),
  ]);

  const totalSales = customerBills.filter(b => b.status === 'Paid')
    .reduce((sum, b) => sum + cleanNum(b.grand_total), 0);

  const vendorReturnCredits = transactions
    .filter(t => t.category === 'vendor_return' || t.transaction_type === 'vendor_return')
    .reduce((sum, t) => sum + cleanNum(t.amount), 0);

  const grossExpenses = expenses.reduce((sum, e) => sum + cleanNum(e.amount), 0)
    + invoices.reduce((sum, i) => sum + cleanNum(i.grand_total), 0);

  const totalExpenses = Math.max(0, grossExpenses - vendorReturnCredits);

  const pendingBills = customerBills.filter(b =>
    b.status === 'Pending' || b.status === 'Pending Payment (Credit)'
  );
  const pendingBillsTotal = pendingBills.reduce((sum, b) => sum + cleanNum(b.grand_total), 0);

  const lowStockItems = inventory.filter(i => {
    const qty = parseInt(String(i.stockQty !== undefined ? i.stockQty : i.stock_qty || 0).replace(/[^0-9]/g, '')) || 0;
    const thresh = parseInt(String(i.minAlertThreshold || i.min_alert_threshold || 15)) || 15;
    return qty <= thresh;
  });

  const today = new Date();
  const getDaysUntilSalary = (salaryDay) => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let targetDate = new Date(currentYear, currentMonth, salaryDay);
    if (targetDate < today && targetDate.toDateString() !== today.toDateString()) {
      targetDate = new Date(currentYear, currentMonth + 1, salaryDay);
    }
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  };

  const salariesDueSoon = employees.filter(emp => {
    const days = getDaysUntilSalary(parseInt(emp.salary_date || emp.salaryDate || '5'));
    return days >= 0 && days <= 5;
  }).map(emp => ({
    name: emp.name,
    salary: emp.salary,
    daysUntilDue: getDaysUntilSalary(parseInt(emp.salary_date || emp.salaryDate || '5')),
    salaryDate: emp.salary_date || emp.salaryDate || '5',
  }));

  return {
    totalSales, totalExpenses,
    netProfit: totalSales - totalExpenses,
    netMargin: totalSales > 0 ? ((Math.max(0, totalSales - totalExpenses) / totalSales) * 100).toFixed(1) : '0',
    pendingBills: pendingBills.map(b => ({ customer: b.customer_name, amount: b.grand_total, due: b.due_date })),
    pendingBillsTotal,
    pendingBillsCount: pendingBills.length,
    lowStockItems: lowStockItems.map(i => ({ name: i.name, qty: i.stockQty || i.stock_qty, threshold: i.minAlertThreshold || i.min_alert_threshold || 15 })),
    lowStockCount: lowStockItems.length,
    recentTransactions: transactions.slice(-10),
    employees: employees.map(e => ({ name: e.name, salary: e.salary, salaryDate: e.salary_date || e.salaryDate })),
    salariesDueSoon,
    vendorCount: vendors.length,
    inventoryCount: inventory.length,
  };
}

function filterByDays(items, daysBack, dateField = 'created_at') {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  return items.filter(item => {
    const d = new Date(item[dateField] || item.date || '');
    return !isNaN(d) && d >= cutoff;
  });
}

async function callGroqAI(apiKey, systemPrompt, userPrompt, maxTokens = 600) {
  if (!apiKey) throw new Error('Groq API key not configured');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error(data.error?.message || 'Empty response from Groq');
}

// POST /api/reports/send-daily
router.post('/send-daily', requireRoles(['owner']), async (req, res) => {
  try {
    const shopId = req.shopId;
    const ctx = await getFullStoreContext(shopId);
    const [allTx, allBills] = await Promise.all([
      db.fetchScoped('transactions', shopId),
      db.fetchScoped('customer_bills', shopId),
    ]);

    const recentTx = filterByDays(allTx, 2);
    const recentSales = filterByDays(allBills.filter(b => b.status === 'Paid'), 2);
    const recentSalesTotal = recentSales.reduce((sum, b) => sum + cleanNum(b.grand_total), 0);

    const payload = {
      type: 'DAILY_REPORT',
      title: '📊 Finora — 2-Day Business Activity Report',
      generatedAt: new Date().toISOString(),
      shopId,
      summary: {
        period: 'Last 2 Days',
        totalSalesInPeriod: recentSalesTotal,
        totalBillsRaised: recentSales.length,
        pendingBillsCount: ctx.pendingBillsCount,
        pendingBillsAmount: ctx.pendingBillsTotal,
        lowStockAlerts: ctx.lowStockCount,
        recentTransactions: recentTx.slice(0, 10),
        recentSales: recentSales.map(b => ({
          billNo: b.bill_number,
          customer: b.customer_name,
          amount: b.grand_total,
          date: b.created_at,
        })),
      },
      lowStockItems: ctx.lowStockItems,
      pendingBills: ctx.pendingBills,
      overallFinancials: {
        totalSales: ctx.totalSales,
        totalExpenses: ctx.totalExpenses,
        netProfit: ctx.netProfit,
        netMargin: ctx.netMargin,
      },
    };

    res.json({
      success: true,
      message: '2-day report generated successfully.',
      report: payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/send-weekly
router.post('/send-weekly', requireRoles(['owner']), async (req, res) => {
  try {
    const shopId = req.shopId;
    const ctx = await getFullStoreContext(shopId);
    const [allBills, allTx, allExpenses] = await Promise.all([
      db.fetchScoped('customer_bills', shopId),
      db.fetchScoped('transactions', shopId),
      db.fetchScoped('expenses', shopId),
    ]);

    const weekSales = filterByDays(allBills.filter(b => b.status === 'Paid'), 7);
    const weekTx = filterByDays(allTx, 7);
    const weekExpenses = filterByDays(allExpenses, 7);

    const weekSalesTotal = weekSales.reduce((sum, b) => sum + cleanNum(b.grand_total), 0);
    const weekExpTotal = weekExpenses.reduce((sum, e) => sum + cleanNum(e.amount), 0);
    const weekProfit = weekSalesTotal - weekExpTotal;

    let aiSummary = null;
    try {
      aiSummary = await callGroqAI(
        GROQ_KEYS.finance,
        `You are the Finora AI Finance Analyst. Analyze the weekly business performance and provide a concise 3-bullet executive summary with key insights and one actionable recommendation.`,
        `Weekly Performance Data:
- Total Sales (7 days): Rs.${weekSalesTotal.toLocaleString('en-IN')} from ${weekSales.length} bills
- Total Expenses (7 days): Rs.${weekExpTotal.toLocaleString('en-IN')}
- Estimated Weekly Profit: Rs.${weekProfit.toLocaleString('en-IN')}
- Pending Credit Bills: ${ctx.pendingBillsCount} worth Rs.${ctx.pendingBillsTotal.toLocaleString('en-IN')}
- Low Stock Items: ${ctx.lowStockCount}
- Overall Net Margin: ${ctx.netMargin}%
Provide a brief, actionable weekly summary in 3-4 bullet points.`,
        400
      );
    } catch (err) {
      console.error('[Weekly Report] AI summary failed:', err.message);
      aiSummary = `- Sales this week: Rs.${weekSalesTotal.toLocaleString('en-IN')} from ${weekSales.length} transactions\n- Expenses recorded: Rs.${weekExpTotal.toLocaleString('en-IN')}\n- Estimated profit: Rs.${weekProfit.toLocaleString('en-IN')}`;
    }

    const payload = {
      type: 'WEEKLY_REPORT',
      title: 'Finora — Weekly Business Performance Report',
      generatedAt: new Date().toISOString(),
      shopId,
      period: 'Last 7 Days',
      weeklyMetrics: {
        totalSales: weekSalesTotal,
        totalBillsRaised: weekSales.length,
        totalExpenses: weekExpTotal,
        netProfit: weekProfit,
        netMargin: weekSalesTotal > 0 ? `${((weekProfit / weekSalesTotal) * 100).toFixed(1)}%` : '0%',
      },
      aiExecutiveSummary: aiSummary,
      pendingBillsSummary: {
        count: ctx.pendingBillsCount,
        totalAmount: ctx.pendingBillsTotal,
        bills: ctx.pendingBills,
      },
      inventoryAlerts: ctx.lowStockItems,
      topTransactions: weekTx.slice(0, 15),
      overallFinancials: {
        allTimeSales: ctx.totalSales,
        allTimeExpenses: ctx.totalExpenses,
        allTimeProfit: ctx.netProfit,
      },
    };

    res.json({
      success: true,
      message: 'Weekly report with AI summary generated successfully.',
      report: payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/send-reminders
router.post('/send-reminders', requireRoles(['owner']), async (req, res) => {
  try {
    const shopId = req.shopId;
    const ctx = await getFullStoreContext(shopId);
    const reminders = [];

    ctx.salariesDueSoon.forEach(emp => {
      reminders.push({
        type: 'Salary Due',
        priority: emp.daysUntilDue <= 1 ? 'URGENT' : 'HIGH',
        message: `${emp.name}'s salary of Rs.${cleanNum(emp.salary).toLocaleString('en-IN')} is due in ${emp.daysUntilDue} day(s) (on the ${emp.salaryDate}th).`,
        actionRequired: 'Ensure sufficient cash balance to process payment.',
      });
    });

    ctx.pendingBills.forEach(bill => {
      reminders.push({
        type: 'Pending Customer Bill',
        priority: bill.due && new Date(bill.due) < new Date() ? 'OVERDUE' : 'MEDIUM',
        message: `Bill for ${bill.customer} worth Rs.${cleanNum(bill.amount).toLocaleString('en-IN')} is pending${bill.due ? ` (due: ${bill.due})` : ''}.`,
        actionRequired: 'Follow up with customer for payment settlement.',
      });
    });

    ctx.lowStockItems.forEach(item => {
      reminders.push({
        type: 'Low Stock Alert',
        priority: item.qty <= 5 ? 'CRITICAL' : 'HIGH',
        message: `${item.name} has only ${item.qty} units left (threshold: ${item.threshold}).`,
        actionRequired: 'Place reorder with supplier immediately.',
      });
    });

    if (reminders.length === 0) {
      reminders.push({
        type: 'All Clear',
        priority: 'INFO',
        message: 'No urgent reminders at this time. Salaries are not due, no pending bills, and stock levels are healthy.',
        actionRequired: 'None',
      });
    }

    const payload = {
      type: 'BUSINESS_REMINDERS',
      title: 'Finora — Business Action Reminders',
      generatedAt: new Date().toISOString(),
      shopId,
      totalReminders: reminders.length,
      urgentCount: reminders.filter(r => ['URGENT', 'CRITICAL', 'OVERDUE'].includes(r.priority)).length,
      reminders,
      quickStats: {
        salariesDueSoon: ctx.salariesDueSoon.length,
        pendingBills: ctx.pendingBillsCount,
        lowStockItems: ctx.lowStockCount,
      },
    };

    res.json({
      success: true,
      message: `${reminders.length} reminder(s) generated.`,
      reminders,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/growth-advice
router.post('/growth-advice', requireRoles(['owner']), async (req, res) => {
  try {
    const shopId = req.shopId;
    const ctx = await getFullStoreContext(shopId);

    // 1. Fetch vendor invoices & vendor data
    const [invoices, vendors] = await Promise.all([
      db.fetchScoped('invoices', shopId),
      db.fetchScoped('vendors', shopId),
    ]);

    // 2. Perform Vendor Comparison & Analytics
    const vendorMap = new Map();
    invoices.forEach(inv => {
      const vName = (inv.supplier_name || inv.vendor || 'General Supplier').trim();
      const vKey = vName.toLowerCase();
      const amt = cleanNum(inv.grand_total);
      if (!vendorMap.has(vKey)) {
        vendorMap.set(vKey, {
          name: vName,
          totalBilled: 0,
          billCount: 0,
          invoices: [],
          flaggedCount: 0,
        });
      }
      const item = vendorMap.get(vKey);
      item.totalBilled += amt;
      item.billCount += 1;
      if (inv.status === 'Flagged High Risk' || inv.duplicateReason) item.flaggedCount += 1;
      item.invoices.push(inv);
    });

    const vendorComparison = Array.from(vendorMap.values()).map(v => {
      const dbVendor = vendors.find(dbV => (dbV.name || dbV.contact_person || '').toLowerCase() === v.name.toLowerCase());
      const trustScore = dbVendor ? (dbVendor.trust_score || dbVendor.trustScore || 85) : 85;
      const avgBill = v.billCount > 0 ? (v.totalBilled / v.billCount) : 0;
      let recommendation = 'Primary reliable vendor with steady pricing.';
      if (v.flaggedCount > 0) recommendation = `⚠️ High Risk: ${v.flaggedCount} duplicate/flagged bill(s) detected. Recommend audit before settlement.`;
      else if (v.totalBilled > 100000) recommendation = `💡 High Volume Supplier (₹ ${v.totalBilled.toLocaleString('en-IN')} total). Negotiate 5-8% bulk discount or extended 30-day payment terms.`;
      else if (trustScore < 75) recommendation = `⚡ Lower Trust Score (${trustScore}%). Compare item prices with alternate suppliers.`;

      return {
        vendorName: v.name,
        totalBilled: v.totalBilled,
        billCount: v.billCount,
        avgBillAmount: Math.round(avgBill),
        trustScore,
        flaggedDuplicates: v.flaggedCount,
        growthAdvice: recommendation,
      };
    }).sort((a, b) => b.totalBilled - a.totalBilled);

    // 3. AI Advisory Prompt with explicit Vendor Comparison
    let advice = '';
    const vendorSummaryText = vendorComparison.length > 0
      ? vendorComparison.map(v => `- ${v.vendorName}: Total Billed Rs.${v.totalBilled.toLocaleString('en-IN')}, Trust Score ${v.trustScore}%, Bills: ${v.billCount}. Advice: ${v.growthAdvice}`).join('\n')
      : 'No recorded vendor purchases yet.';

    try {
      advice = await callGroqAI(
        GROQ_KEYS.fraud_growth,
        `You are the Finora AI Business Growth & Vendor Optimization Advisor for Indian retail stores. Analyze the store's sales, expenses, and vendor comparison data. Provide 5 strategic, practical growth recommendations including vendor price optimization, stock turnover, and cashflow strategies. Format as numbered points.`,
        `Store Financial Snapshot:
- All-Time Sales: Rs.${ctx.totalSales.toLocaleString('en-IN')}
- All-Time Expenses: Rs.${ctx.totalExpenses.toLocaleString('en-IN')}
- Net Profit: Rs.${ctx.netProfit.toLocaleString('en-IN')} (${ctx.netMargin}% margin)
- Active Inventory SKUs: ${ctx.inventoryCount}
- Low Stock Items: ${ctx.lowStockCount}
- Pending Credit Bills: ${ctx.pendingBillsCount} (Rs.${ctx.pendingBillsTotal.toLocaleString('en-IN')} outstanding)
- Active Vendors: ${ctx.vendorCount}

Vendor Comparison Data:
${vendorSummaryText}

Generate 5 actionable Growth & Vendor Optimization Strategies tailored to this store's real data.`,
        750
      );
    } catch (err) {
      console.error('[Growth Advice] Groq AI failed:', err.message);
      advice = `1. Vendor Pricing & Bulk Discount Optimization:\nCompare top suppliers. ${vendorComparison[0] ? `Your largest supplier is '${vendorComparison[0].vendorName}' (Rs. ${vendorComparison[0].totalBilled.toLocaleString('en-IN')} billed). Negotiate 5-8% bulk discounts on fast-moving SKUs.` : 'Consolidate supplier orders for better bulk discounts.'}\n\n2. Low Stock Protection:\n${ctx.lowStockCount} inventory items are below reorder threshold. Set automated 3-day buffer alerts to avoid out-of-stock revenue loss.\n\n3. Credit Bill Recovery:\n${ctx.pendingBillsCount} customer bills worth Rs.${ctx.pendingBillsTotal.toLocaleString('en-IN')} are pending. Implement a automated 7-day payment reminder cycle.\n\n4. High-Margin Fast Movers:\nIdentify top 5 profitable SKUs and offer bundle deals to increase average customer cart value by 15%.\n\n5. Supplier Risk Audit:\nRegularly cross-check vendor invoice line items against official GST rates to prevent overbilling.`;
    }

    const payload = {
      type: 'GROWTH_ADVICE',
      title: 'Finora — AI Business Growth & Vendor Comparison Advisory',
      generatedAt: new Date().toISOString(),
      shopId,
      storeSnapshot: {
        totalSales: ctx.totalSales,
        totalExpenses: ctx.totalExpenses,
        netProfit: ctx.netProfit,
        netMargin: `${ctx.netMargin}%`,
        pendingBillsCount: ctx.pendingBillsCount,
        pendingBillsTotal: ctx.pendingBillsTotal,
        lowStockCount: ctx.lowStockCount,
      },
      vendorComparison,
      aiGrowthAdvice: advice,
      generatedBy: 'Finora AI Growth & Vendor Comparison Model (Groq llama-3.1-8b-instant)',
    };

    res.json({
      success: true,
      message: 'Growth advice and vendor comparison generated successfully.',
      advice,
      vendorComparison,
      report: payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.fetchScoped('activity_logs', req.shopId);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
