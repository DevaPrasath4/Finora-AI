# 🛡️ Finora AI - Final High-Level Design (HLD) Specification

This document provides the complete, structured High-Level Design (HLD) specifications for the **Finora AI** platform, addressing all structural, backend, frontend, database, AI, security, and infrastructure questions.

---

## 1. Architecture & Backend

### 1.1 Backend Technology
Finora AI utilizes **Node.js** with the **Express.js** framework as its core server runtime. This combination provides a lightweight, highly performant asynchronous execution environment well-suited for high-concurrency API requests, file scanning pipelines, and external AI service communication.

### 1.2 Architecture Style
The system adopts a **Modular Monolith** architectural style. 
* All routes, middleware, and business modules reside in a single codebase but are strictly decoupled by context boundary (e.g., separate files in `backend/routes/` for AI, inventory, POS billing, and reports).
* This provides the low latency and simple deployment of a monolith during early stages while maintaining module boundaries that can easily be extracted into standalone microservices as the platform scales.

### 1.3 Main Backend Modules
The backend consists of the following primary modules:
1. **Auth & Identity Module:** Handles token-less header-based security, user sign-ups, and user role validation.
2. **POS Billing Engine:** Manages customer checkout transactions, payment statuses (Paid vs. Credit), and invoice receipt creation.
3. **OCR Scanning Pipeline:** Integrates with multer memory storage, local Tesseract.js libraries, and NVIDIA vision models.
4. **Inventory Control System:** Manages store SKU tracking, threshold triggers, and stock adjustment hooks.
5. **AI Assistant Router:** Injects scoped live data contexts into the Groq multi-model chat interface.
6. **Automated Reports Engine:** Gathers real-time statistics and returns generated reports to the application.
7. **Expense & Ledger Module:** Manages general store cash inflows/outflows, salary payouts, and tax offsets.

### 1.4 Communication Protocol
Communication between the frontend client and the backend server is entirely handled through **RESTful APIs** communicating via JSON payloads over HTTP/HTTPS.

---

## 2. Database & Storage

### 2.1 Primary Source of Truth
The primary source of truth is a dual-storage setup:
* **Local Database Store (`backend/data.json`):** Serves as a local-first repository that ensures zero-latency reads/writes and robust offline capability in rural/retail store environments.
* **Supabase Cloud Database:** Acts as the persistent repository for audit logging and cross-device data access.

### 2.2 Main Database Entities (Tables)
The database structure consists of the following key tables:
* `users`: Identity credentials, company info, and role mappings.
* `invoices`: Supplier bills, total pricing, and risk check scores.
* `customer_bills`: Customer POS credit/cash sales.
* `inventory`: SKUs, current quantities, unit prices, and alert thresholds.
* `expenses`: Salaries, packaging, utilities, and general business costs.
* `transactions`: Ledger history (debit/credit flows).
* `employees`: Salary details, joining dates, and payment history trails.
* `vendors`: Supplier directory and active status.
* `fraud_alerts`: Logged duplicate bills, credit payment terms breaches, and suspicious actions.
* `activity_logs`: Complete immutable audit trail.
* `settings`: Custom invoice prefixes, formatting preferences, and credentials.

### 2.3 Uploaded Document Storage
Uploaded files, scanned invoices, and bills are processed as in-memory buffers during execution. For persistent file tracking:
* **Local Staging:** Scans are temporarily processed in-memory.
* **Production Storage:** Documents are uploaded to a **Supabase Storage Bucket** (secured with Row-Level Security, or RLS) which returns secure, time-bound URLs stored in the `invoices` table.

### 2.4 Caching Layer
* **Local Development:** RAM-level caching is used (e.g. key-value Maps for supplier names and inventory stats).
* **Production Scale:** **Redis** is introduced to cache aggregated dashboard KPIs and frequent inventory lookup queries.

### 2.5 Background Task Processing
For heavy background tasks (such as AI Growth strategy generation and OCR processing), the system relies on Express asynchronous promises during local runs, migrating to **BullMQ** (powered by Redis) or a serverless queuing framework (like Supabase Edge Functions) for message execution at scale.

---

## 3. Authentication & Authorization

### 3.1 Authentication Mechanism
Users authenticate using their unique User ID (e.g. `OWNER-1611` or `EMP-8392`) and password. 
* Upon successful authentication, user attributes (ID, Role, Shop ID) are cached securely in the frontend client's `localStorage`.
* **API Security:** The client API client automatically injects these attributes as custom HTTP headers (`x-shop-id`, `x-user-role`, `x-user-id`) on all outgoing requests.

### 3.2 System Roles
Finora AI supports 5 distinct roles:
1. `owner`: Has absolute administrative privileges over all shop modules, settings, staff, and financial analytics.
2. `cashier`: Scoped exclusively to POS checkout, customer pending bills, and read-only inventory lookup.
3. `store_manager`: Scoped to stock inventory management, POS checkout, and vendor directory updates.
4. `financier`: Scoped to supplier invoices, expense entry, cash ledgers, and reports.
5. `accountant`: Scoped to transaction ledgers, daily shop expenses, and report generation.

### 3.3 Data Isolation (Multi-Tenant Scoping)
* Every database record is stamped with a `user_id` containing the store owner's ID.
* The `validateShopIsolation` middleware intercepts all requests, extracts the `x-shop-id` header, and binds it to `req.shopId`.
* All database queries filter results strictly by `req.shopId`. No query can load, update, or delete data belonging to another store owner.

---

## 4. Business Modules

### 4.1 POS Customer Purchase Lifecycle
When a cashier completes a customer sale:
1. **Stock Deduction:** System maps checkout items and subtracts purchase quantities from the `inventory` table.
2. **Bill Persistence:** The completed bill and inventory changes are saved to the configured database.
3. **Transaction Registry:** If the payment is completed, a transaction record (category: "Sales Revenue") is immediately registered as income.
4. **Credit Handling:** If payment mode is credit, status is set to "Pending" with an associated due date.

### 4.2 Invoice Creation Hooks
When a vendor invoice is saved:
1. **Stock Additions:** Line items extracted from the bill automatically increment quantities of matching SKUs in `inventory`.
2. **Verification Trigger:** Real-time validation checks for duplicates.
3. **Alert Creation:** If duplicates are detected, a High Risk alert is logged in the `fraud_alerts` table.

### 4.3 Inventory Updates
Inventory quantities update dynamically via POS checkouts (decrease) and vendor invoice entries (increase). Manual stock adjustments can only be processed by `owner` or `store_manager` roles.

### 4.4 Payments & Due Dates
Customer credit terms are tracked via due dates. Overdue credit invoices are highlighted in red in the UI and trigger alerts in the notification feed.

### 4.5 Financial Recording (Expenses & Revenue)
* **Revenue:** Captured from POS checkouts and settled credit bills.
* **Expenses:** Captured from vendor purchases, manual bills (utilities, rent), and employee salary payouts.
* **Profit:** Dynamically calculated on the fly as `Revenue - Expenses`.

### 4.6 Vendor Directories
A centralized directory mapping active suppliers. Invoices link to this directory to allow owners to analyze vendor cost variations over time.

### 4.7 Reports Generation
Four reports are generated via settings triggers:
* **2-Day Digest:** Analyzes the past 48 hours of sales, expenses, and transactions.
* **Weekly Analysis:** Summary of sales and P&L with AI-generated insights.
* **Action Reminders:** Consolidated list of low-stock items, unpaid bills, and upcoming salaries.
* **Future Growth Advice:** AI-formulated marketing and billing suggestions.

### 4.8 GST Compliance
* Calculates tax liability using tax metrics from customer invoices and vendor bills.
* Auto-calculates available Input Tax Credit (ITC) from verified supplier bills.

---

## 5. OCR & Documents

### 5.1 Upload & OCR Workflow
```text
[Invoice Uploaded] -> [Tesseract OCR Extracts Raw Text] -> [Prompt Compiled with Raw Text]
                                                                     |
                                                                     v
                                                          [NVIDIA Vision API Call]
                                                                     |
                                                                     v
[Inventory Updated] <---- [Save Bill to DB] <----------- [Structured JSON Returned]
```

### 5.2 OCR Extraction Technology
* **Image OCR:** **Tesseract.js** handles offline client/server character extraction.
* **Data Structuring:** **NVIDIA Nemotron Vision Models** convert the raw text block into standard JSON.

### 5.3 Suspicious Bill Validation
* **Verification 1:** Matches invoice number and supplier name against existing database entries.
* **Verification 2:** Checks if the same supplier name and total amount exist within a ₹5 tolerance window.
* **Action:** Flagged duplicate entries are marked as "Flagged High Risk" with a 95%+ risk score.

---

## 6. AI & Machine Learning

### 6.1 Implemented AI/ML Features
* **OCR Data Structuring:** NVIDIA Vision model.
* **Multi-Assistant Chatbot:** Groq model with specialized prompts for Finance, Inventory, Vendors, and Fraud/Growth.
* **Smart Weekly Summary:** Generates executive bullet points for weekly reports.
* **Growth Advisor:** Generates business expansion tips.

### 6.2 Data Injection for AI Models
The backend computes a live context string containing real-time numbers from the store's database (e.g., total sales, outstanding credit, low stock counts). This context is injected directly into the LLM system prompt.

### 6.3 LLM Provider
* **Provider:** **Groq Cloud API**
* **Model:** **`llama-3.1-8b-instant`** (chosen for high speed, low cost, and reliable formatting).

### 6.4 Execution Frequency
* **Real-time:** Conversational chat queries.
* **On-Demand/Periodic:** Weekly reports and Growth advice triggers.

---

## 7. Fraud Detection

### 7.1 Anomalies Detected
* Duplicate vendor invoice submissions.
* Mismatch between invoice totals and sum of line items.
* Suspiciously high customer credit terms.

### 7.2 Interception & Alert Scoping
Flagged items are locked or labeled as "Flagged High Risk." Alerts are logged to the dashboard database and shown on the owner's dashboard in the AI Intelligence widget.

---

## 8. Notifications

### 8.1 Event Triggers
* Inventory levels falling below alert thresholds.
* Upcoming salary payouts (3 days before salary date).
* Overdue customer credit bills.

### 8.2 Notification Channels
* **In-App:** Live dashboard notifications panel.
* **In-App Notifications:** Alerts are shown in the dashboard notification panel.

---

## 9. Security

### 9.1 Password Protection
All user passwords are encrypted. (In production, **bcrypt** hashes passwords on the backend before writing them to the database).

### 9.2 API & Key Security
* Server credentials (Supabase service key, Groq keys, NVIDIA keys) are stored in server-side environment variables and are not exposed to the frontend.
* API routes are guarded by the RBAC middleware.

### 9.3 Audit Logging
All write operations (adding stock, updating settings, processing salary, marking bills paid) log an entry to the `activity_logs` table with action, details, category, and timestamp.

---

## 10. Deployment & Infrastructure

### 10.1 Host Deployment
* **Backend API:** Deployed to **Render**, **Railway**, or **Heroku**.
* **Frontend client:** Deployed to **Vercel** or **Netlify**.

### 10.2 Database Hosting
* Cloud database is hosted on **Supabase** (managed PostgreSQL).

### 10.3 Caching & Queues
* Dockerized **Redis** is deployed alongside the API.
* **Docker Compose** orchestrates local development dependencies.

---

## 11. Monitoring & Reliability

### 11.1 Offline Resilience
If the external Groq AI or NVIDIA OCR API becomes unavailable, the system automatically falls back to an offline rule-based extraction mode. This ensures basic invoice saving and store reports continue to work uninterrupted.
