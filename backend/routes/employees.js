import { Router } from 'express';
import { db } from '../db.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// GET /api/employees (Owner only)
router.get('/', requireRoles(['owner']), async (req, res) => {
  try {
    const employees = await db.fetchScoped('employees', req.shopId);
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees (Owner only)
router.post('/', requireRoles(['owner']), async (req, res) => {
  try {
    const { name, role, phone, email, salary, salary_date } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Full Name and Phone Number are required.' });
    }
    const salaryStr = String(salary || '30,000');
    const salaryDay = String(salary_date || '5');
    const empId = `EMP-${Math.floor(100 + Math.random() * 900)}`;

    const newEmp = {
      id: empId,
      user_id: req.shopId,
      name,
      role: role || 'Store Management',
      phone: String(phone).trim(),
      email: email ? String(email).trim().toLowerCase() : `${phone}@finguard.ai`,
      salary: salaryStr.startsWith('₹') ? salaryStr : `₹ ${salaryStr}`,
      salary_date: salaryDay,
      payment_status: 'Unpaid',
      payment_history: [],
      status: 'Active',
      joined_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    const saved = await db.insert('employees', newEmp);

    // Auto-create / link User account for employee with owner_id = req.shopId
    try {
      const allUsers = await db.fetchTable('users');
      const ownerUser = allUsers.find(u => String(u.user_id).toLowerCase() === String(req.shopId).toLowerCase());
      
      const cleanPhone = String(phone).replace(/\D/g, '');
      const empUser = {
        user_id: empId,
        company_name: ownerUser?.company_name || 'FinGuard AI Store',
        company_address: ownerUser?.company_address || '',
        business_type: ownerUser?.business_type || 'General Store',
        employee_count: ownerUser?.employee_count || '5',
        mobile_number: cleanPhone,
        email: email ? String(email).trim().toLowerCase() : `${cleanPhone}@finguard.ai`,
        password_hash: cleanPhone,
        role: role ? String(role).toLowerCase().replace(/[^a-z0-9]/g, '_') : 'store_manager',
        owner_id: req.shopId,
      };
      await db.insert('users', empUser);
    } catch (uErr) {
      console.warn('[Employee User Sync notice]:', uErr.message);
    }

    const employees = await db.fetchScoped('employees', req.shopId);
    res.status(201).json({ success: true, employee: saved, employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/employees/:id (Owner only)
router.delete('/:id', requireRoles(['owner']), async (req, res) => {
  try {
    const { id } = req.params;
    // Verify the employee belongs to this shop before deleting
    const empList = await db.fetchScoped('employees', req.shopId);
    const emp = empList.find(e => e.id === id);
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }
    await db.delete('employees', 'id', id);
    await db.delete('users', 'user_id', id);
    const employees = await db.fetchScoped('employees', req.shopId);
    res.json({ success: true, message: 'Employee removed.', employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/employees/:id/pay-salary (Owner only)
router.put('/:id/pay-salary', requireRoles(['owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.shopId;

    // Fetch current employee record
    let empList = await db.fetchScoped('employees', shopId);
    let emp = empList.find(e => String(e.id) === String(id));

    if (!emp) {
      // Try fallback fetch all employees
      const allEmps = await db.fetchTable('employees');
      emp = allEmps.find(e => String(e.id) === String(id));
    }

    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    // 1. Prevent duplicate salary payments
    if (emp.payment_status === 'Paid') {
      return res.status(400).json({
        success: false,
        error: `Salary for employee ${emp.name} has already been paid for this period. Duplicate payments are not allowed.`,
      });
    }

    const salaryVal = parseFloat(String(emp.salary).replace(/[^0-9.]/g, '')) || 30000;
    const currentDate = new Date().toISOString().split('T')[0];

    // 2. Build updated payment history
    const history = Array.isArray(emp.payment_history) ? [...emp.payment_history] : [];
    history.push({
      date: currentDate,
      amount: emp.salary,
      status: 'Paid',
    });

    // 3. Update employee payment status in DB
    const updated = await db.update('employees', 'id', id, {
      payment_status: 'Paid',
      payment_history: history,
    });

    // 4. Create dedicated record in salary_payments table
    await db.insert('salary_payments', {
      id: `SAL-${Date.now()}`,
      user_id: shopId,
      owner_id: shopId,
      employee_id: emp.id,
      employee_name: emp.name,
      amount: salaryVal,
      payment_date: currentDate,
      status: 'Paid',
      payment_method: 'Cash',
    });

    // 5. Deduct salary from profit via expense entry
    await db.insert('expenses', {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: shopId,
      category: 'Staff Salary',
      amount: salaryVal,
      date: currentDate,
      paid_to: emp.name,
      status: 'Paid',
    });

    // 6. Record cash-book transaction (OUTFLOW / salary)
    await db.insert('transactions', {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: shopId,
      owner_id: shopId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'OUT',
      transaction_type: 'salary',
      category: 'employee_salary',
      amount: `-₹ ${salaryVal.toLocaleString('en-IN')}`,
      reference_id: emp.id,
      description: `Staff Salary Payout - ${emp.name} (${emp.role})`,
      balance: '—',
    });

    // 7. Audit log
    await db.insert('activity_logs', {
      id: `LOG-${Date.now()}`,
      user_id: shopId,
      action: '💵 Employee Salary Paid',
      details: `Paid salary of ₹ ${salaryVal.toLocaleString('en-IN')} to ${emp.name} (${emp.role})`,
      category: 'Employees',
    });

    const refreshedEmployees = await db.fetchScoped('employees', shopId);
    res.json({ success: true, employee: updated, employees: refreshedEmployees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
