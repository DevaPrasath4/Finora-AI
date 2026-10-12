-- ==============================================================================
-- FINSIGHT AI — COMPLETE SUPABASE DATABASE SCHEMA
-- Copy & Paste this entire script into your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. USERS TABLE (Stores user authentication, login ID, mobile number, email, and roles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INVOICES TABLE (Stores complete bill details, supplier, GST, grand total, line items)
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    invoice_date TEXT,
    subtotal TEXT,
    tax_gst TEXT,
    grand_total TEXT,
    status TEXT DEFAULT 'Verified',
    risk_score TEXT,
    duplicate_reason TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. OCR INVOICES TABLE (Dedicated OCR extraction table)
CREATE TABLE IF NOT EXISTS public.ocr_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT,
    subtotal TEXT,
    tax_gst TEXT,
    grand_total TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INVENTORY TABLE (Stores stock quantity, cost price, selling price MRP, GST rate, supplier)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General Store Goods',
    stock_qty INTEGER DEFAULT 0,
    min_alert_threshold INTEGER DEFAULT 15,
    unit_price TEXT,
    cost_price TEXT,
    selling_price TEXT,
    gst_rate TEXT DEFAULT '5%',
    status TEXT DEFAULT 'Healthy Stock',
    supplier TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. FRAUD ALERTS TABLE (Stores duplicate bill and overcharge alerts)
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'HIGH',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved BOOLEAN DEFAULT false
);

-- 6. PAYMENTS & TRANSACTIONS TABLES
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient TEXT NOT NULL,
    amount TEXT NOT NULL,
    date TEXT NOT NULL,
    mode TEXT DEFAULT 'Bank Transfer',
    status TEXT DEFAULT 'Completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'IN' or 'OUT'
    description TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    amount TEXT NOT NULL,
    balance TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ALLOW PUBLIC ACCESS FOR DEMO/DEVELOPMENT
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid error 42710
DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow public access to ocr_invoices" ON public.ocr_invoices;
DROP POLICY IF EXISTS "Allow public access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public access to fraud_alerts" ON public.fraud_alerts;
DROP POLICY IF EXISTS "Allow public access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public access to transactions" ON public.transactions;

-- Create policies for full SELECT, INSERT, UPDATE, DELETE access
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to ocr_invoices" ON public.ocr_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to fraud_alerts" ON public.fraud_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
