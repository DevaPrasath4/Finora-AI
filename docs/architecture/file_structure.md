# 📂 Finora AI - Repository File Structure

This document outlines the detailed directory tree and file layout of the **Finora AI** repository.

---

## 🌳 Directory Tree Structure

```text
Finora-AI/
├── .env                          # Unified Root Environment Config
├── .env.example                  # Template Config for Project Setup
├── .gitignore                    # Git Exclusion Specifications
├── package.json                  # Root Workspace Script Orchestration
├── package-lock.json             # Root Locked Package Dependencies
├── README.md                     # Platform Documentation & Setup Guide
│
├── backend/                      # Backend Express REST API Server
│   ├── .env                      # Local Backend Environment Override
│   ├── .env.example              # Template Config for Backend Setup
│   ├── db.js                     # Local JSON Database Engine Wrapper
│   ├── data.json                 # Local JSON Database Store (State Persistence)
│   ├── index.js                  # Express App Initialization & Router Mounting
│   ├── package.json              # Backend Dependency Configurations
│   │
│   ├── middleware/               # Express Request Interceptors
│   │   └── rbac.js               # Tenant Isolation (Shop Scoping) & RBAC Guard
│   │
│   └── routes/                   # Module-Specific Route Handlers
│       ├── ai.js                 # Multi-Model Groq AI Query Router
│       ├── auth.js               # Login, Signup, and User List Router
│       ├── customer_bills.js     # POS Bills Management & Settlement
│       ├── dashboard.js          # Live KPI Aggregation & Salary Due Reminders
│       ├── employees.js          # Staff Records & Salary Payout Engine
│       ├── expenses.js           # Expense Entry Recording
│       ├── inventory.js          # SKU Add/Update/Delete
│       ├── invoices.js           # Supplier OCR Scanning & Manual Entry
│       ├── payments.js           # Vendor Invoice Payment Ledger
│       ├── reports.js            # Generated Reports and Business Advice
│       ├── settings.js           # Store Profile & Preferences Configuration
│       ├── transactions.js       # Transaction Flow Ledger (Cash Book)
│       └── vendors.js            # Supplier Directory Listing
│
└── frontend/                     # Frontend Vite + React SPA Client
    ├── .env                      # Client-Side Configuration Values
    ├── .env.example              # Template Config for Frontend Setup
    ├── index.html                # Main SPA Root Markup Page
    ├── package.json              # Frontend Dependency Configuration
    ├── vite.config.js            # Vite Build & Hot Reload Server Settings
    │
    ├── public/                   # Static Assets & Icons
    │
    └── src/                      # Source Code Directory
        ├── App.jsx               # Application Shell & React Router Layout
        ├── main.jsx              # React DOM Entry Mounting Endpoint
        │
        ├── components/           # Reusable View Widgets
        │   └── dashboard/        # Dashboard Panel Widgets
        │       ├── AiAssistantModule.jsx     # Conversational Multi-Agent Client
        │       ├── InventoryReadOnlyModule.jsx # Read-Only Stock Table
        │       ├── PosBillingModule.jsx      # Barcode POS Terminal Interface
        │       └── SettingsModule.jsx        # App Profiles & Report Triggers
        │
        ├── pages/                # Parent Page Components
        │   ├── BusinessOwnerDashboard.jsx    # Core Layout & Scoped Sub-Modules
        │   ├── CreateInvoiceFullPage.jsx     # Manual Vendor Invoice Entry Form
        │   ├── LoginPage.jsx                 # Role-Select Login Dashboard Page
        │   ├── SignupPage.jsx                # Multi-Step Business Registration
        │   └── UploadInvoiceFullPage.jsx     # Drag-and-Drop Image OCR Portal
        │
        ├── services/             # API Client Clients
        │   ├── api.js                # Injected REST API Service Functions
        │   ├── dataService.js        # Supabase-backed data and local utility helpers
        │   └── supabaseClient.js     # Client-Side Supabase DB Direct Scans
        │
        ├── styles/               # CSS Design Themes
        │   ├── dashboard-dark.css            # Liquid Dark Dashboard Styling
        │   └── global.css                    # Shared Variables & Liquid Buttons
        │
        └── utils/                # Helper Libraries
```

---

## 📝 Critical Files Description

### 1. Root Configuration Files
* **[`package.json`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/package.json)**: Manages concurrent processes for local startup (`npm run start:all`).
* **[`.env`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/.env)**: Stores server-side service credentials for local execution.

### 2. Backend Modules
* **[`backend/db.js`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/backend/db.js)**: Utilizes a lightweight synchronous JSON reader/writer (`data.json`) to persist state during offline operations.
* **[`backend/middleware/rbac.js`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/backend/middleware/rbac.js)**: Enforces RBAC permissions and handles multi-tenant data isolation by binding all routes to `req.shopId`.
* **[`backend/routes/reports.js`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/backend/routes/reports.js)**: Aggregates real-time business statistics and returns generated reports.

### 3. Frontend Core
* **[`frontend/src/services/api.js`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/frontend/src/services/api.js)**: A central HTTP service wrapper. It automatically injects the tenant isolation headers (`x-shop-id`, `x-user-role`) into all API requests.
* **[`frontend/src/pages/BusinessOwnerDashboard.jsx`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/frontend/src/pages/BusinessOwnerDashboard.jsx)**: Houses the central dashboard viewport. Renders specific functional modules depending on the logged-in user's role.
