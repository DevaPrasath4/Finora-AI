-- ============================================================
-- FINGUARD AI - POSTGRESQL DATABASE SCHEMA
-- Database: finguard_db
-- Description: Stores user login credentials, company info,
-- invoices, employees, suppliers, and cashflow history.
-- ============================================================

-- Create Users Table (User ID, Password Hash, Mobile, Role)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Official Govt GST Rates Table (PostgreSQL)
CREATE TABLE IF NOT EXISTS official_gst_rates (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    example VARCHAR(255) NOT NULL,
    gst_rate_percent NUMERIC(5, 2) NOT NULL,
    gst_display VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Official Indian Govt GST Rates
INSERT INTO official_gst_rates (category, example, gst_rate_percent, gst_display) VALUES
('Essential food', 'Fresh fruits & vegetables', 0.00, '0%'),
('Milk', 'Fresh milk', 0.00, '0%'),
('Rice/Wheat', 'Unbranded grains', 0.00, '0%'),
('Packaged food', 'Packaged cereals', 5.00, '5%'),
('Edible oil', 'Cooking oil', 5.00, '5%'),
('Tea', 'Tea leaves', 5.00, '5%'),
('Sugar', 'Refined sugar', 5.00, '5%'),
('Restaurant', 'Non-luxury restaurants', 5.00, '5%'),
('Footwear', 'Footwear items', 12.00, '12%'),
('Mobile phones', 'Smartphones', 18.00, '18%'),
('Laptops', 'Computers', 18.00, '18%'),
('Televisions', 'TVs up to applicable slab', 18.00, '18%'),
('Soap & shampoo', 'Personal care', 18.00, '18%'),
('Toothpaste', 'Dental care', 18.00, '18%'),
('Clothing', 'Ready-made garments', 12.00, '12% / 5%'),
('Furniture', 'Wooden furniture', 18.00, '18%'),
('Electrical appliances', 'Mixer, fan', 18.00, '18%'),
('Air conditioners', 'AC units', 28.00, '28%'),
('Refrigerators', 'Fridge', 18.00, '18%'),
('Luxury cars', 'Selected vehicles', 28.00, '28% + cess'),
('Soft drinks', 'Aerated beverages', 28.00, '28%'),
('Cigarettes', 'Tobacco', 28.00, '28% + cess')
ON CONFLICT (category) DO NOTHING;

-- Create Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    company_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    joined_date DATE DEFAULT CURRENT_DATE
);

-- Create Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    pending_bills_amount NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active'
);

-- Create Invoices Table (Billing & Supplier Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('customer', 'supplier')),
    party_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Cashflow Logs Table
CREATE TABLE IF NOT EXISTS cashflow_logs (
    id SERIAL PRIMARY KEY,
    transaction_ref VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('IN', 'OUT')),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial 4 Role Store Accounts + Super Admin in PostgreSQL
INSERT INTO users (user_id, company_name, mobile_number, email, password_hash, role)
VALUES 
  ('ADMIN-001', 'FinGuard System Governance Central', '9999999999', 'admin@finguard.ai', 'admin123', 'super_admin'),
  ('OWNER-METRO-8492', 'Metro Superstore Ltd', '9876543210', 'owner@metrosuperstore.com', 'FG-8924-XK9', 'owner'),
  ('accountant@metrosuperstore.com', 'Metro Superstore Ltd', '9876523451', 'accountant@metrosuperstore.com', 'FG-CA-2026', 'accountant'),
  ('cashier.billing@metrosuperstore.com', 'Metro Superstore Ltd', '9876545673', 'cashier.billing@metrosuperstore.com', 'FG-BILL-789', 'billing'),
  ('manager.stock@metrosuperstore.com', 'Metro Superstore Ltd', '9876534562', 'manager.stock@metrosuperstore.com', 'FG-STOCK-552', 'stock_manager')
ON CONFLICT (user_id) DO NOTHING;

