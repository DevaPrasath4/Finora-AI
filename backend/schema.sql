-- =====================================================================
-- FINSIGHT AI - MULTI-TENANT POSTGRESQL DATABASE SCHEMA (DDL)
-- Supports user data isolation by user_id & company_name
-- Compatible with PostgreSQL 12+ and Supabase
-- =====================================================================

-- 1. USERS & AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    business_type VARCHAR(100) DEFAULT 'General Retail',
    employee_count VARCHAR(50) DEFAULT '5',
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. INVENTORY / STOCK TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General Store',
    stock_qty INT DEFAULT 0,
    min_alert_threshold INT DEFAULT 15,
    unit_price DECIMAL(12, 2) DEFAULT 0.00,
    cost_price DECIMAL(12, 2) DEFAULT 0.00,
    supplier_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);

-- 3. VENDOR OCR INVOICES TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_gst DECIMAL(12, 2) DEFAULT 0.00,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Verified',
    risk_score VARCHAR(100) DEFAULT '0.01 (Safe)',
    duplicate_reason TEXT,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    due_date DATE,
    items JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- 4. CUSTOMER POS BILLS TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS customer_bills (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_gst DECIMAL(12, 2) DEFAULT 0.00,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    profit_earned DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Paid',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_bills_user_id ON customer_bills(user_id);

-- 5. MONEY TRANSACTIONS TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('IN', 'OUT')),
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount VARCHAR(50) NOT NULL,
    numeric_amount DECIMAL(12, 2) DEFAULT 0.00,
    balance VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 6. DAILY SHOP EXPENSES TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    paid_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- 7. FRAUD & DUPLICATE BILL ALERTS TABLE (Scoped by user_id)
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'HIGH',
    resolved BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) MULTI-TENANCY POLICIES (FOR SUPABASE / POSTGRES)
-- Ensures User A can never select or insert into User B's records
-- =====================================================================

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_inventory_isolation ON inventory FOR ALL USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY user_invoices_isolation ON invoices FOR ALL USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY user_bills_isolation ON customer_bills FOR ALL USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY user_transactions_isolation ON transactions FOR ALL USING (user_id = current_setting('app.current_user_id', true));
