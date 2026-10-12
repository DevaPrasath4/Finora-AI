-- =====================================================================
-- FINGUARD AI (FINORA) - SUPABASE COMPLETE DATABASE SCHEMA (DDL)
-- Run this ENTIRE script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- =====================================================================

-- ── NON-DESTRUCTIVE SETUP ────────────────────────────────────────────
-- Existing tables and records are preserved.

-- ── 1. USERS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    business_type VARCHAR(100) DEFAULT 'General Retail',
    employee_count VARCHAR(50) DEFAULT '5',
    mobile_number VARCHAR(20) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(50) DEFAULT 'owner',
    owner_id    VARCHAR(100),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email   ON public.users(email);
-- Add signup fields when upgrading an existing users table.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS company_address TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(100) DEFAULT 'General Retail',
    ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50) DEFAULT '5',
    ADD COLUMN IF NOT EXISTS owner_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS verified_email BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_users_owner_id ON public.users(owner_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_policy ON public.users;
CREATE POLICY users_policy ON public.users FOR ALL USING (true) WITH CHECK (true);

-- ── 2. EMPLOYEES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
    id               VARCHAR(100) PRIMARY KEY,
    user_id          VARCHAR(100) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    role             VARCHAR(100) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(255),
    salary           VARCHAR(50)  DEFAULT '₹ 0',
    salary_date      VARCHAR(10)  DEFAULT '1',
    payment_status   VARCHAR(50)  DEFAULT 'Unpaid',
    payment_history  JSONB        DEFAULT '[]'::jsonb,
    status           VARCHAR(50)  DEFAULT 'Active',
    joined_date      VARCHAR(50),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employees_policy ON public.employees;
CREATE POLICY employees_policy ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- ── 3. INVENTORY TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
    id                   VARCHAR(100) PRIMARY KEY,
    user_id              VARCHAR(100) NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    category             VARCHAR(100) DEFAULT 'General Store',
    stock_qty            INT          DEFAULT 0,
    min_alert_threshold  INT          DEFAULT 15,
    unit_price           VARCHAR(50)  DEFAULT '₹ 0',
    cost_price           VARCHAR(50)  DEFAULT '₹ 0',
    selling_price        VARCHAR(50)  DEFAULT '₹ 0',
    gst_rate             VARCHAR(20)  DEFAULT '5%',
    status               VARCHAR(50)  DEFAULT 'Healthy Stock',
    supplier_name        VARCHAR(255),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_policy ON public.inventory;
CREATE POLICY inventory_policy ON public.inventory FOR ALL USING (true) WITH CHECK (true);

-- ── 4. VENDORS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors (
    id              VARCHAR(100) PRIMARY KEY,
    user_id         VARCHAR(100) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    gstin           VARCHAR(50),
    address         TEXT,
    total_billed    VARCHAR(50)  DEFAULT '₹ 0',
    trust_score     VARCHAR(100) DEFAULT '100% (Verified)',
    status          VARCHAR(50)  DEFAULT 'Active',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vendors_policy ON public.vendors;
CREATE POLICY vendors_policy ON public.vendors FOR ALL USING (true) WITH CHECK (true);

-- ── 5. INVOICES TABLE (Supplier / Vendor Bills) ───────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
    id               VARCHAR(100) PRIMARY KEY,
    user_id          VARCHAR(100) NOT NULL,
    invoice_number   VARCHAR(100) NOT NULL,
    supplier_name    VARCHAR(255) NOT NULL,
    invoice_date     DATE         DEFAULT CURRENT_DATE,
    subtotal         DECIMAL(12,2) DEFAULT 0.00,
    tax_gst          DECIMAL(12,2) DEFAULT 0.00,
    grand_total      DECIMAL(12,2) DEFAULT 0.00,
    status           VARCHAR(50)  DEFAULT 'Verified',
    risk_score       VARCHAR(100) DEFAULT '0.01 (Safe)',
    duplicate_reason TEXT,
    payment_status   VARCHAR(50)  DEFAULT 'Paid',
    due_date         DATE,
    items            JSONB        DEFAULT '[]'::jsonb,
    raw_text         TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON public.invoices(user_id, supplier_name);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_policy ON public.invoices;
CREATE POLICY invoices_policy ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- ── 6. PAYMENTS TABLE (Vendor Payments) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
    id         VARCHAR(100) PRIMARY KEY,
    user_id    VARCHAR(100) NOT NULL,
    recipient  VARCHAR(255) NOT NULL,
    amount     VARCHAR(50)  NOT NULL,
    date       DATE         DEFAULT CURRENT_DATE,
    mode       VARCHAR(100) DEFAULT 'Cash',
    status     VARCHAR(50)  DEFAULT 'Completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_policy ON public.payments;
CREATE POLICY payments_policy ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- ── 7. CUSTOMER BILLS TABLE (POS Sales) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_bills (
    id              VARCHAR(100) PRIMARY KEY,
    user_id         VARCHAR(100) NOT NULL,
    bill_number     VARCHAR(100) NOT NULL,
    customer_name   VARCHAR(255) NOT NULL,
    customer_phone  VARCHAR(20),
    subtotal        DECIMAL(12,2) DEFAULT 0.00,
    tax_gst         DECIMAL(12,2) DEFAULT 0.00,
    grand_total     DECIMAL(12,2) DEFAULT 0.00,
    profit_earned   DECIMAL(12,2) DEFAULT 0.00,
    status          VARCHAR(50)  DEFAULT 'Paid',
    due_date        DATE,
    payment_date    DATE,
    items           JSONB        DEFAULT '[]'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_bills_user_id ON public.customer_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_bills_status ON public.customer_bills(user_id, status);

ALTER TABLE public.customer_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_bills_policy ON public.customer_bills;
CREATE POLICY customer_bills_policy ON public.customer_bills FOR ALL USING (true) WITH CHECK (true);

-- ── 8. TRANSACTIONS TABLE (Cash Book Ledger) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id               VARCHAR(100) PRIMARY KEY,
    user_id          VARCHAR(100) NOT NULL,
    owner_id         VARCHAR(100),
    date             VARCHAR(100) NOT NULL,
    type             VARCHAR(10)  CHECK (type IN ('IN', 'OUT')),
    transaction_type VARCHAR(100) DEFAULT 'general',
    reference_id     VARCHAR(100),
    description      TEXT         NOT NULL,
    category         VARCHAR(100) NOT NULL,
    amount           VARCHAR(50)  NOT NULL,
    balance          VARCHAR(50),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON public.transactions(owner_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transactions_policy ON public.transactions;
CREATE POLICY transactions_policy ON public.transactions FOR ALL USING (user_id = auth.uid()::text OR owner_id = auth.uid()::text OR true) WITH CHECK (true);

-- ── 9. EXPENSES TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
    id         VARCHAR(100) PRIMARY KEY,
    user_id    VARCHAR(100) NOT NULL,
    category   VARCHAR(100) NOT NULL,
    amount     DECIMAL(12,2) NOT NULL,
    date       DATE         DEFAULT CURRENT_DATE,
    paid_to    VARCHAR(255),
    status     VARCHAR(50)  DEFAULT 'Paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_policy ON public.expenses;
CREATE POLICY expenses_policy ON public.expenses FOR ALL USING (user_id = auth.uid()::text OR true) WITH CHECK (true);

-- ── 10. FRAUD ALERTS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id        VARCHAR(100) PRIMARY KEY,
    user_id   VARCHAR(100) NOT NULL,
    type      VARCHAR(100) NOT NULL,
    message   TEXT         NOT NULL,
    severity  VARCHAR(20)  DEFAULT 'HIGH',
    resolved  BOOLEAN      DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fraud_alerts_policy ON public.fraud_alerts;
CREATE POLICY fraud_alerts_policy ON public.fraud_alerts FOR ALL USING (user_id = auth.uid()::text OR true) WITH CHECK (true);

-- ── 11. ACTIVITY LOGS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id          VARCHAR(100) PRIMARY KEY,
    user_id     VARCHAR(100) NOT NULL,
    shop_id     VARCHAR(100),
    owner_id    VARCHAR(100),
    employee_id VARCHAR(100),
    user_name   VARCHAR(255),
    user_role   VARCHAR(50),
    action      VARCHAR(255) NOT NULL,
    details     TEXT         NOT NULL,
    description TEXT,
    category    VARCHAR(100) DEFAULT 'System Log',
    entity_type VARCHAR(100),
    entity_id   VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_id ON public.activity_logs(shop_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activity_logs_policy ON public.activity_logs;
CREATE POLICY activity_logs_policy ON public.activity_logs FOR ALL USING (user_id = auth.uid()::text OR shop_id = auth.uid()::text OR true) WITH CHECK (true);

-- ── 12. SETTINGS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id         SERIAL PRIMARY KEY,
    user_id    VARCHAR(100) UNIQUE NOT NULL,
    data       JSONB        DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settings_policy ON public.settings;
CREATE POLICY settings_policy ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- ── 13. SALARY PAYMENTS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salary_payments (
    id             VARCHAR(100) PRIMARY KEY,
    user_id        VARCHAR(100) NOT NULL,
    owner_id       VARCHAR(100) NOT NULL,
    employee_id    VARCHAR(100) NOT NULL,
    employee_name  VARCHAR(255),
    amount         DECIMAL(12,2) NOT NULL,
    payment_date   DATE         DEFAULT CURRENT_DATE,
    status         VARCHAR(50)  DEFAULT 'Paid',
    payment_method VARCHAR(50)  DEFAULT 'Cash',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON public.salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_owner_id ON public.salary_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON public.salary_payments(employee_id);

ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS salary_payments_policy ON public.salary_payments;
CREATE POLICY salary_payments_policy ON public.salary_payments FOR ALL USING (true) WITH CHECK (true);

-- ── 13. OFFICIAL GOVT GST RATES TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.official_gst_rates (
    id       SERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    example  TEXT,
    rate     NUMERIC      NOT NULL,
    display  VARCHAR(50)  NOT NULL
);

ALTER TABLE public.official_gst_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS official_gst_rates_policy ON public.official_gst_rates;
CREATE POLICY official_gst_rates_policy ON public.official_gst_rates FOR ALL USING (true) WITH CHECK (true);

-- ── SEED GST RATES ───────────────────────────────────────────────────
INSERT INTO public.official_gst_rates (category, example, rate, display)
SELECT incoming.category, incoming.example, incoming.rate, incoming.display
FROM (VALUES
('Rice (unbranded)', 'Unbranded raw/steamed rice', 0, '0% (Exempted)'),
('Branded Rice', 'Packaged branded basmati/rice', 5, '5% GST'),
('Wheat', 'Whole wheat grains', 0, '0% (Exempted)'),
('Wheat Flour (Atta)', 'Packaged wheat flour / Atta', 5, '5% GST'),
('Maida', 'Refined wheat flour', 5, '5% GST'),
('Rava (Sooji)', 'Semolina / Sooji / Rava', 5, '5% GST'),
('Besan', 'Gram flour', 5, '5% GST'),
('Toor Dal', 'Unbranded Toor dal', 0, '0% (Exempted)'),
('Urad Dal', 'Unbranded Urad dal', 0, '0% (Exempted)'),
('Moong Dal', 'Unbranded Moong dal', 0, '0% (Exempted)'),
('Chana Dal', 'Unbranded Chana dal', 0, '0% (Exempted)'),
('Masoor Dal', 'Unbranded Masoor dal', 0, '0% (Exempted)'),
('Sugar', 'Refined white/brown sugar', 5, '5% GST'),
('Jaggery', 'Natural jaggery / Gur', 5, '5% GST'),
('Salt', 'Common iodized salt', 0, '0% (Exempted)'),
('Tea Powder', 'Packaged tea leaves / dust', 5, '5% GST'),
('Coffee Powder', 'Coffee beans & instant powder', 5, '5% GST'),
('Milk', 'Fresh liquid milk', 0, '0% (Exempted)'),
('Curd', 'Fresh plain curd / Dahi', 0, '0% (Exempted)'),
('Butter', 'Dairy butter / Salted butter', 12, '12% GST'),
('Cheese', 'Processed cheese slices', 12, '12% GST'),
('Paneer', 'Fresh cottage cheese', 5, '5% GST'),
('Ghee', 'Pure cow/buffalo ghee', 12, '12% GST'),
('Cooking Oil', 'Edible cooking oil', 5, '5% GST'),
('Mustard Oil', 'Kachi ghani mustard oil', 5, '5% GST'),
('Sunflower Oil', 'Refined sunflower oil', 5, '5% GST'),
('Coconut Oil (edible)', 'Pure edible coconut oil', 5, '5% GST'),
('Pickle', 'Bottled mango/lemon pickles', 12, '12% GST'),
('Jam', 'Fruit jams & preserves', 12, '12% GST'),
('Honey', 'Natural processed honey', 5, '5% GST'),
('Biscuit', 'Sweet & salted biscuits', 18, '18% GST'),
('Chocolate', 'Milk & dark chocolates', 18, '18% GST'),
('Soft Drinks', 'Carbonated aerated beverages', 28, '28% GST'),
('Mineral Water', 'Packaged drinking water', 18, '18% GST'),
('Fruit Juice', 'Packaged fruit drinks & juice', 12, '12% GST'),
('Noodles', 'Instant noodles & ramen', 18, '18% GST'),
('Pasta', 'Dry durum wheat pasta', 18, '18% GST'),
('Corn Flakes', 'Breakfast corn cereals', 18, '18% GST'),
('Oats', 'Rolled & instant breakfast oats', 5, '5% GST'),
('Spices', 'Whole spices (Cumin, Mustard)', 5, '5% GST'),
('Turmeric Powder', 'Ground turmeric / Haldi', 5, '5% GST'),
('Chilli Powder', 'Ground red chilli powder', 5, '5% GST'),
('Coriander Powder', 'Ground coriander / Dhaniya', 5, '5% GST'),
('Dry Fruits', 'Cashews, Almonds, Raisins', 12, '12% GST'),
('Ice Cream', 'Dairy ice creams & frozen desserts', 18, '18% GST'),
('Bread', 'Fresh sliced loaf bread', 0, '0% (Exempted)'),
('Eggs', 'Fresh poultry farm eggs', 0, '0% (Exempted)'),
('Fresh Vegetables', 'Fresh market vegetables', 0, '0% (Exempted)'),
('Fresh Fruits', 'Fresh seasonal fruits', 0, '0% (Exempted)'),
('Paracetamol', 'Fever & pain relief tablets', 12, '12% GST'),
('Hand Sanitizer', 'Alcohol-based hand rubs', 18, '18% GST'),
('Face Mask', '3-Ply & N95 protective masks', 5, '5% GST'),
('LED Bulb', 'Energy-saving LED bulbs', 12, '12% GST'),
('Hammer', 'Claw & ball peen hammers', 18, '18% GST'),
('Paint', 'Emulsion & enamel paints', 18, '18% GST'),
('Cement', 'OPC & PPC cement bags', 28, '28% GST'),
('Tiles', 'Vitrified & ceramic floor tiles', 28, '28% GST'),
('Cotton Shirt', 'Men/Women cotton shirts', 5, '5% GST'),
('Jeans', 'Denim jeans pants', 12, '12% GST'),
('Saree', 'Traditional sarees', 5, '5% GST')
) AS incoming(category, example, rate, display)
WHERE NOT EXISTS (
    SELECT 1 FROM public.official_gst_rates existing
    WHERE existing.category = incoming.category
);
-- Grant table access to roles used by the Supabase clients.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.users, public.employees, public.inventory, public.vendors,
    public.invoices, public.payments, public.customer_bills, public.transactions,
    public.expenses, public.fraud_alerts, public.activity_logs, public.settings,
    public.salary_payments, public.official_gst_rates
TO anon, authenticated, service_role;

DO $$
BEGIN
    IF to_regclass('public.users_id_seq') IS NOT NULL THEN
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO anon, authenticated, service_role';
    END IF;
    IF to_regclass('public.settings_id_seq') IS NOT NULL THEN
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.settings_id_seq TO anon, authenticated, service_role';
    END IF;
    IF to_regclass('public.official_gst_rates_id_seq') IS NOT NULL THEN
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.official_gst_rates_id_seq TO anon, authenticated, service_role';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
