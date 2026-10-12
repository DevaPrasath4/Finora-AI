/**
 * FINSIGHT AI - Centralized REST API Service Client
 * Communicates with the Express Backend Server running on http://localhost:5000/api
 * Injects Role-Based Access Control (RBAC) headers automatically for authorization.
 */

const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';

function getActiveUserAuthHeaders() {
  try {
    const active = JSON.parse(localStorage.getItem('finsight_active_user') || '{}');
    const userId = active.user_id || active.email || 'user';
    // For owners: shopId is their own user_id (= owner_id)
    // For employees: shopId is the owner_id they belong to
    const shopId = (active.role === 'owner' || !active.role)
      ? userId
      : (active.owner_id || userId);
    return {
      'x-user-role': active.role || 'owner',
      'x-user-id': userId,
      'x-shop-id': shopId,
    };
  } catch (e) {
    return {
      'x-user-role': 'owner',
      'x-user-id': 'user',
      'x-shop-id': 'user',
    };
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getActiveUserAuthHeaders();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Request failed`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const apiGetUsers = () => request('/auth/users');

// Dashboard & Analytics API
export const apiGetDashboardStats = () => request('/dashboard/stats');
export const apiGetNotifications = () => request('/dashboard/notifications');

// Invoices API
export const apiGetInvoices = () => request('/invoices');
export const apiCreateInvoice = (invoiceData) =>
  request('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  });
export const apiUploadOcrInvoice = (ocrData) =>
  request('/invoices/upload', {
    method: 'POST',
    body: JSON.stringify(ocrData),
  });

export const apiScanOcrFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const authHeaders = getActiveUserAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/invoices/scan-file`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });
    return await response.json();
  } catch (err) {
    console.warn('[API Scan File Warning]:', err.message);
    return { success: false, error: err.message };
  }
};

// Payments API
export const apiGetPayments = () => request('/payments');
export const apiCreatePayment = (paymentData) =>
  request('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });

// Expenses API
export const apiGetExpenses = () => request('/expenses');
export const apiCreateExpense = (expenseData) =>
  request('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });

// Transactions API
export const apiGetTransactions = () => request('/transactions');
export const apiCreateTransaction = (txnData) =>
  request('/transactions', {
    method: 'POST',
    body: JSON.stringify(txnData),
  });

// Inventory API
export const apiGetInventory = () => request('/inventory');
export const apiCreateInventoryItem = (itemData) =>
  request('/inventory', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
export const apiUpdateInventoryItem = (id, itemData) =>
  request(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
export const apiDeleteInventoryItem = (id) =>
  request(`/inventory/${id}`, {
    method: 'DELETE',
  });

// Vendors API
export const apiGetVendors = () => request('/vendors');
export const apiCreateVendor = (vendorData) =>
  request('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendorData),
  });

// Employees API
export const apiGetEmployees = () => request('/employees');
export const apiAddEmployee = (empData) =>
  request('/employees', {
    method: 'POST',
    body: JSON.stringify(empData),
  });
export const apiDeleteEmployee = (id) =>
  request(`/employees/${id}`, {
    method: 'DELETE',
  });

// AI Chat Assistant API
export const apiAiChat = (query, companyName, assistantType = 'finance') =>
  request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ query, companyName, assistantType }),
  });

export const apiQueryAiChat = apiAiChat;

export const apiGetAiInsights = () => request('/ai/insights');

// Customer Bills POS API
export const apiGetCustomerBills = () => request('/customer-bills');
export const apiCreateCustomerBill = (billData) =>
  request('/customer-bills', {
    method: 'POST',
    body: JSON.stringify(billData),
  });
export const apiPayCustomerBill = (id) =>
  request(`/customer-bills/${id}/pay`, {
    method: 'PUT',
  });

// Salary Payout API
export const apiPayEmployeeSalary = (id) =>
  request(`/employees/${id}/pay-salary`, {
    method: 'PUT',
  });

// Settings & Store Configuration API
export const apiGetSettings = () => request('/settings');
export const apiUpdateSettings = (settingsData) =>
  request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
export const apiChangePassword = (userId, currentPassword, newPassword) =>
  request('/settings/change-password', {
    method: 'POST',
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });

// Reports & Automation Actions API
export const apiSendDailyReport = () =>
  request('/reports/send-daily', { method: 'POST', body: JSON.stringify({}) });

export const apiSendWeeklyReport = () =>
  request('/reports/send-weekly', { method: 'POST', body: JSON.stringify({}) });

export const apiSendReminders = () =>
  request('/reports/send-reminders', { method: 'POST', body: JSON.stringify({}) });

export const apiGetGrowthAdvice = () =>
  request('/reports/growth-advice', { method: 'POST', body: JSON.stringify({}) });

// Vendor Stock Return API
export const apiReturnVendorItem = (id, returnData) =>
  request(`/inventory/${id}/return-to-vendor`, {
    method: 'POST',
    body: JSON.stringify(returnData),
  });

// Audit Logs API
export const apiGetAuditLogs = () => request('/reports/audit-logs');
