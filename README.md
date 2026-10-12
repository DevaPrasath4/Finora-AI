# 🚀 Finora — Smart Finance, Smarter Business

<div align="center">

![Finora Banner](https://img.shields.io/badge/Finora-Smart%20Finance%2C%20Smarter%20Business-B4781C?style=for-the-badge&logo=react)

**The All-In-One AI Shop Money Management & Neural OCR Fraud Interceptor Platform**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js%20REST%20API-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js%20Neural%20Engine-FF6F00?style=flat-square&logo=google)](https://tesseract.projectnaptha.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

**Finora** is a financial management and bill verification platform designed for retail store owners, wholesale traders, accountants, and stock managers. It combines **server-side Neural OCR**, **automated duplicate bill detection**, **real-time GST compliance verification**, and **Supabase cloud database synchronization**.

---

## ✨ Key Features

### ⚡ 1. Neural OCR & Invoice Photo Scanner
* **Instant Document Breakdown**: Upload vendor bills, receipts, or photos (`PNG`, `JPG`, `PDF`) to extract vendor details, invoice dates, bill numbers, line item descriptions, quantities, unit cost rates, retail MRPs, GST %, and grand totals.
* **NVIDIA Nemotron Vision AI Engine**: Server-side Express REST API endpoint (`POST /api/invoices/scan-file`) processes bill images with high-precision NVIDIA Nemotron Vision AI (`meta/llama-3.2-11b-vision-instruct`) for end-to-end optical character recognition (OCR) and structured JSON parsing.

### 🛡️ 2. AI Fraud & Duplicate Bill Interceptor
* **Instant Fraud Screening**: Detects duplicate invoice numbers, matching supplier billing totals, and unverified vendor entries before payments are issued.
* **Risk Severity Alerts**: Flags duplicate bills with high-risk alerts logged to the `fraud_alerts` system.

### 📦 3. Live Inventory Auto-Sync (Supabase)
* **Automated Stock Increment**: Saving vendor bills automatically updates store inventory quantities and updates retail selling MRPs in the Supabase `public.inventory` table.
* **Low-Stock Alerting**: Highlights SKUs falling below minimum alert thresholds.

### ⏱️ 4. Dedicated System Audit Logs
* **Comprehensive Audit Trail**: Dedicated sidebar page tracking all system actions including stock additions, quantity deductions, vendor bill uploads, price changes, and payment entries.
* **Categorized Records**: Filter logs by timestamp, user role, action category, and details.

### 🏛️ 5. Govt GST Compliance & Tax Rates Master
* **Official GST Rates Verification**: Cross-check line item GST percentages against official Govt GST slabs (0%, 5%, 12%, 18%, 28%).
* **GST Rates Verification**: Verifies invoice line items against configured GST rates.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Lucide Icons, Vanilla CSS (Modern Dark/Glassmorphic Palette) |
| **Backend REST API** | Node.js, Express.js, Multer |
| **OCR Processing** | Tesseract.js Neural Engine |
| **Database & Cloud** | Supabase, `@supabase/supabase-js` |
| **Integrations** | Local OCR and AI services |

---

## 📁 Repository Structure

```
FinGuard-AI/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # User Login/Signup API
│   │   ├── invoices.js      # Invoice & Neural OCR API Routes
│   │   └── dashboard.js     # Analytics & System Stats
│   ├── db.js                # Core Database Adapter
│   ├── index.js             # Express Server Initialization
│   ├── supabase_schema.sql  # Supabase table schemas
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Components (Navbar, Footer, Hero, Modals)
│   │   ├── pages/           # Application Pages (Dashboard, Upload Invoice, POS)
│   │   ├── services/        # Supabase and Express REST API Clients
│   │   └── styles/          # Dark Mode & Modern CSS Token System
│   ├── index.html           # Main HTML Template & Meta Tags
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Backend Installation & Server Startup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start Express REST API server (Runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Installation & Client Startup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite Development Server (Runs on http://localhost:3000)
npm run dev
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the `frontend` root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_ENABLED=true
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The frontend connects directly to Supabase for account and client-side data operations. Keep the Supabase service-role key and database password on the server only; never put them in a `VITE_` variable.

---

## Supabase Database Schema Setup

Run [`backend/supabase_schema.sql`](./backend/supabase_schema.sql) in the SQL Editor of the same Supabase project configured in both frontend and backend. The script creates the application tables and can be rerun without dropping existing tables or records. It also refreshes PostgREST's schema cache.

If the app reports `PGRST205` or says it cannot find `public.users`, the schema has not been applied to the configured project (or PostgREST has not refreshed yet). Run the script, wait briefly for the schema cache to reload, then retry signup.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Finora — Smart Finance, Smarter Business**  
*Built with ❤️ for modern retail stores & small businesses.*

</div>
