import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import transactionRoutes from './routes/transactions.js';
import inventoryRoutes from './routes/inventory.js';
import vendorRoutes from './routes/vendors.js';
import employeeRoutes from './routes/employees.js';
import aiRoutes from './routes/ai.js';
import settingsRoutes from './routes/settings.js';
import customerBillsRoutes from './routes/customer_bills.js';
import reportsRoutes from './routes/reports.js';
import automationRoutes from './routes/automation.js';
import { validateShopIsolation } from './middleware/rbac.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_CORS_ORIGINS
  ? process.env.ALLOWED_CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Policy: Origin ${origin} not allowed.`));
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// API Route mounts
app.use('/api/auth', authRoutes);

// Apply shop isolation middleware on all business data endpoints
app.use('/api/dashboard', validateShopIsolation(), dashboardRoutes);
app.use('/api/invoices', validateShopIsolation(), invoiceRoutes);
app.use('/api/payments', validateShopIsolation(), paymentRoutes);
app.use('/api/expenses', validateShopIsolation(), expenseRoutes);
app.use('/api/transactions', validateShopIsolation(), transactionRoutes);
app.use('/api/inventory', validateShopIsolation(), inventoryRoutes);
app.use('/api/vendors', validateShopIsolation(), vendorRoutes);
app.use('/api/employees', validateShopIsolation(), employeeRoutes);
app.use('/api/ai', validateShopIsolation(), aiRoutes);
app.use('/api/settings', validateShopIsolation(), settingsRoutes);
app.use('/api/customer-bills', validateShopIsolation(), customerBillsRoutes);
app.use('/api/reports', validateShopIsolation(), reportsRoutes);
app.use('/api/automation', validateShopIsolation(), automationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'FinSight AI Express API Backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` 🛡️  FINSIGHT AI BACKEND EXPRESS SERVER IS RUNNING `);
  console.log(` 🚀  API Base URL: http://localhost:${PORT}/api    `);
  console.log(`==================================================`);
});
