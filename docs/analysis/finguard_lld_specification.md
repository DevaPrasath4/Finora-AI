# 🛠️ Finora AI — Complete Low-Level Design (LLD) Specification

> **Document Version**: 2.0.0  
> **Status**: Approved Architecture Specification  
> **Target Audience**: Core Engineering Team, DevOps, Security Auditors, AI Engineers  
> **Repository Location**: `docs/analysis/finguard_lld_specification.md`

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [User Roles & RBAC Matrix](#4-user-roles--rbac-matrix)
5. [Authentication & Security Design](#5-authentication--security-design)
6. [Multi-Tenancy Architecture](#6-multi-tenancy-architecture)
7. [Database Design & Schema Blueprint](#7-database-design--schema-blueprint)
8. [Module Design Specifications](#8-module-design-specifications)
9. [API Design Contracts](#9-api-design-contracts)
10. [Business Workflows & Event Processing](#10-business-workflows--event-processing)
11. [AI / ML Engine Design](#11-ai--ml-engine-design)
12. [OCR Processing Pipeline Design](#12-ocr-processing-pipeline-design)
13. [GST & Tax Compliance Design](#13-gst--tax-compliance-design)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Deployment & Infrastructure Specification](#15-deployment--infrastructure-specification)

---

## 1. Project Overview

### 1.1 Project Name
**Finora AI** — Enterprise Financial Intelligence, POS & Anomaly Prevention Platform for Retail & MSMEs.

### 1.2 Problem Statement
Micro, Small, and Medium Enterprises (MSMEs) and retail store operators face critical operational and financial inefficiencies:
- **Manual Data Entry & Human Error**: High time loss in manually recording vendor paper invoices into accounting software.
- **Vendor Fraud & Duplicate Invoices**: Double billing, price inflation, or invalid GSTINs cause non-recoverable financial leaks.
- **Inventory Disconnect**: Inability to link real-time checkout sales (POS) with stock replenishment schedules leads to stockouts or frozen capital in excess stock.
- **GST Compliance Chaos**: Errors in CGST/SGST/IGST separation and missed Input Tax Credit (ITC) reconciliation during monthly tax filing.
- **Lack of Multi-Role Access Control**: Store owners lack granular controls to limit cashiers or stock managers from sensitive business revenue data.

### 1.3 Project Objective
To deliver a unified, multi-tenant financial intelligence platform that automates checkout billing (POS), parses vendor invoices with vision OCR, detects financial anomalies & fraud in real-time, predicts inventory stockouts using machine learning, automates GST tax breakdown, and empowers business owners with an AI financial advisor.

### 1.4 Target Users
- **Store Owners & Enterprise Founders**: Access full operational dashboards, financial summaries, growth insights, and user provisioning.
- **Store Managers / Stock Supervisors**: Oversee inventory catalogs, supplier orders, purchase registers, and low-stock alerts.
- **Billing Cashiers / POS Operators**: Access simplified high-speed POS checkout screens for customer transactions.
- **Financiers / Accountants**: Review profit & loss reports, ledger transactions, cash flows, and expense registers.
- **Tax Auditors / External CAs**: Export GST tax registers, ITC summaries, and audit trail logs.
- **Super Administrators**: Manage multi-tenant account lifecycle, system limits, and health monitoring.

### 1.5 Scope
- Real-time Point of Sale (POS) checkout with automated receipt generation and stock decrement.
- Vision OCR invoice scanner (NVIDIA Nemotron OCR v2 + Tesseract fallback) for paper vendor bills.
- Automated duplicate bill & fraud detection engine.
- Predictive demand forecasting & intelligent stock replenishment recommendations.
- Role-Based Access Control (RBAC) with shop-level multi-tenant isolation.
- Conversational AI Business Assistant powered by Groq LLM (Llama-3-70b).
- Multi-channel notification pipeline via Telegram Bot and Gmail API.
- Full audit logging for compliance and activity tracking.

### 1.6 Main Features Matrix

| Module | Core Functionality |
| :--- | :--- |
| **POS Billing** | Quick checkout, barcode scanner support, tax computation, digital customer receipt |
| **Vendor OCR** | Image upload, text/table parsing, total verification, duplicate detection |
| **Fraud Prevention** | Duplicate invoice alert, price variance flag, suspicious amount detection |
| **Inventory Control** | Real-time stock sync, minimum alert threshold, low-stock notifications |
| **AI Assistant** | Finance advisory, stock recommendations, vendor performance assessment |
| **GST Engine** | CGST/SGST/IGST breakdown, HSN validation, GSTR-1/3B summary creation |
| **Employee Management** | Multi-role user creation, salary calculation, role-specific feature locks |

---

## 2. Technology Stack

The exact production technology stack for FinGuard AI is specified below:

```text
+-------------------------------------------------------------------------------+
|                             FINGUARD AI TECH STACK                             |
+-------------------+-----------------------------------------------------------+
| Layer             | Exact Technologies Used                                   |
+-------------------+-----------------------------------------------------------+
| Frontend          | React 18.3 + Vite 5 + Vanilla CSS (Design Tokens)        |
|                   | + Lucide React + Recharts + HTML5 Canvas Scanner          |
+-------------------+-----------------------------------------------------------+
| Backend           | Node.js 18.x / 20.x LTS + Express.js 4.19 (Modular Monolith|
|                   | with 13 domain routers)                                   |
+-------------------+-----------------------------------------------------------+
| Primary DB        | Supabase PostgreSQL 15.x (Row-Level Security Enabled)     |
+-------------------+-----------------------------------------------------------+
| Secondary DB /    | Local JSON Store (data.json fallback with auto-sync)      |
| Fallback          | + PostgreSQL local container                              |
+-------------------+-----------------------------------------------------------+
| Cache             | Redis 7.2 (Token blacklist, rate limits, KPI caching)     |
+-------------------+-----------------------------------------------------------+
| Message Queue     | RabbitMQ 3.12 / Webhook Dispatcher (SNS iHub integration) |
+-------------------+-----------------------------------------------------------+
| AI / ML Engine    | Python 3.11 + Scikit-Learn + XGBoost + SARIMA             |
|                   | + Groq Cloud API (Llama-3.3-70b-versatile LLM)           |
+-------------------+-----------------------------------------------------------+
| OCR Engine        | NVIDIA Nemotron OCR v2 API + Tesseract.js (Local Fallback)|
+-------------------+-----------------------------------------------------------+
| Authentication    | JWT (JSON Web Tokens) + SHA-256 / Argon2id Hashing        |
|                   | + Express RBAC Middleware                                 |
+-------------------+-----------------------------------------------------------+
| Storage / Cloud   | Supabase Object Storage / AWS S3 (Invoices & Receipts)    |
+-------------------+-----------------------------------------------------------+
| Monitoring        | Prometheus + Grafana + Winston Logger + Express Health     |
+-------------------+-----------------------------------------------------------+
| Deployment        | Docker + Docker Compose + NGINX + GitHub Actions CI/CD    |
+-------------------+-----------------------------------------------------------+
```

---

## 3. System Architecture

### 3.1 Architectural Pattern
FinGuard AI is designed as a **Modular Monolith** initially, with strictly decoupled domain routes in Express (`backend/routes/`). Each domain router (`auth`, `invoices`, `inventory`, `customer_bills`, `expenses`, `transactions`, `ai`, `reports`, `employees`, `dashboard`) operates as an independent module communicating via in-memory calls and event dispatchers. This allows seamless future decomposition into Microservices.

### 3.2 System Topography & Data Flow Diagram

```text
[ Client Layer ]
  │
  ▼
Cloudflare Edge CDN / DNS / DDoS Protection
  │
  ▼
Cloudflare WAF (Web Application Firewall)
  │
  ▼
AWS Application Load Balancer (ALB)
  │
  ▼
NGINX Reverse Proxy (SSL Termination, Static Cache)
  │
  ▼
Express API Gateway Middleware (`validateShopIsolation`, JWT, Rate Limiter)
  │
  ├───────────────┬───────────────┬───────────────┐
  ▼               ▼               ▼               ▼
Auth Router    POS Router     OCR Router      AI Router
  │               │               │               │
  ▼               ▼               ▼               ▼
  ├───────────────┴───────────────┴───────────────┤
  │       Modular Monolith Business Domain        │
  └──────┬────────────────┬───────────────┬───────┘
         │                │               │
         ▼                ▼               ▼
 Supabase Postgres    Redis Cache   RabbitMQ Queue
   (Primary DB)      (Rate/Session)  (Async Tasks)
                                          │
                                 ┌────────┴────────┐
                                 ▼                 ▼
                            NVIDIA OCR API    Groq LLM API
```

---

## 4. User Roles & RBAC Matrix

### 4.1 System Roles
1. **`owner` / `super_admin`**: Store Owner / Administrator with unrestricted access.
2. **`financier`**: Financial Controller focusing on transactions, margins, and financial reports.
3. **`accountant`**: Tax accountant managing expenses, invoices, and GST registers.
4. **`store_management`**: Operations Manager managing employees, inventory, and vendor logs.
5. **`stock_manager`**: Inventory supervisor focused exclusively on stock levels and catalog items.
6. **`billing`**: Front-desk cashier restricted to POS checkout and customer receipt creation.

### 4.2 Granular Permissions Matrix (CRUD)

| Resource Domain | `owner` | `financier` | `accountant` | `store_management` | `stock_manager` | `billing` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Invoices (Vendor Bills)** | C R U D | C R U - | C R U - | R - - - | - - - - | - - - - |
| **Customer Bills (POS)** | C R U D | R - - - | R - - - | C R U - | - - - - | C R - - |
| **Inventory Catalog** | C R U D | R - - - | R - - - | C R U D | C R U - | R - - - |
| **Daily Expenses** | C R U D | C R U D | C R U - | C R U - | - - - - | - - - - |
| **Financial Transactions** | C R U D | C R U - | C R U - | R - - - | - - - - | - - - - |
| **Employee Roster** | C R U D | R - - - | - - - - | C R U - | - - - - | - - - - |
| **Fraud Alerts** | C R U D | R U - - | R U - - | R - - - | - - - - | - - - - |
| **AI Assistant** | C R U D | C R - - | C R - - | C R - - | C R - - | - - - - |
| **Audit Trail Logs** | R - - - | R - - - | R - - - | - - - - | - - - - | - - - - |
| **Store Settings** | C R U D | - - - - | - - - - | - - - - | - - - - | - - - - |

*(Legend: **C** = Create, **R** = Read, **U** = Update, **D** = Delete)*

---

## 5. Authentication & Security Design

### 5.1 Authentication Flow
1. **User Login**: Client sends `userId`/`email` and `password` to `POST /api/auth/login`.
2. **Password Verification**:
   - Compares raw password with stored SHA-256 hash or plain-text legacy store in `auth.js`.
   - Function signature: `verifyPassword(plainText, storedHash)`.
3. **JWT Generation**:
   - On valid authentication, issues signed JWT containing: `{ userId, role, ownerId, shopId, exp }`.
   - Token TTL: 8 hours (Access Token) + 7 days (Refresh Token).
4. **Header Scoping**: Downstream requests pass `Authorization: Bearer <token>` along with `x-shop-id` and `x-user-id`.

```text
[ Client ] ──( Credentials )──> [ /api/auth/login ]
                                      │
                                      ▼
                        [ Verify Password Hash ]
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 ( Invalid )                   ( Valid )
                     │                             │
                     ▼                             ▼
              [ 401 Unauthorized ]       [ Sign JWT Token ]
                                                   │
                                                   ▼
                                        [ Return User + Token ]
```

### 5.2 Security Mechanisms
- **Password Hashing**: SHA-256 standard digests (`crypto.createHash('sha256')`) and Argon2id for production upgrade.
- **Tenant Verification Middleware**: `validateShopIsolation(allowedRoles)` extracts headers, enforces role permissions, and injects `req.shopId`.
- **Encryption at Rest**: Supabase PostgreSQL transparent column encryption & AES-256 for sensitive configuration tokens.
- **Encryption in Transit**: TLS 1.3 enforced across Cloudflare, NGINX, and API routes.
- **Rate Limiting**: `express-rate-limit` capped at 100 requests/minute per IP for standard API, 10 requests/minute for OCR scanning.
- **Audit Logging**: Mandatory logging via `createAuditLog()` for all data modification operations.

---

## 6. Multi-Tenancy Architecture

### 6.1 Multi-Tenant Hierarchy

```text
   +---------------------------------------+
   |        Business / Enterprise          |
   +-------------------+-------------------+
                       |
                       ▼
   +---------------------------------------+
   |      Tenant (Shop ID / owner_id)      |
   +-------------------+-------------------+
                       |
        ┌──────────────┴──────────────┐
        ▼                             ▼
+---------------+             +---------------+
|  Owner User   |             | Employee User |
+---------------+             +---------------+
        │                             │
        └──────────────┬──────────────┘
                       ▼
   +---------------------------------------+
   |       Isolated Business Data          |
   | (Inventory, Bills, Invoices, Logs)    |
   +---------------------------------------+
```

### 6.2 Tenant Resolution & Scoping Logic
1. **Tenant Identification**: Every user record has an `owner_id`. For an owner, `owner_id = user_id`. For an employee, `owner_id` points to their employer's `user_id`.
2. **Request Context**: Middleware extracts `req.shopId` from JWT payload or `x-shop-id` header.
3. **Database Layer Scoping**: `db.fetchScoped(tableName, shopId)` executes queries with strict filtering:
   ```sql
   SELECT * FROM inventory WHERE user_id = shopId OR owner_id = shopId;
   ```
4. **Row Level Security (RLS)**: PostgreSQL tables enforce multi-tenant separation using session variables:
   ```sql
   CREATE POLICY tenant_isolation_policy ON inventory
   FOR ALL USING (user_id = current_setting('app.current_user_id', true));
   ```

---

## 7. Database Design & Schema Blueprint

### 7.1 Database ERD Relationship Diagram

```text
  +------------------+             +----------------------+
  |      users       | 1         * |      employees       |
  |  PK: id          +------------>|  PK: id              |
  |  UK: user_id     |             |  FK: user_id         |
  +--------+---------+             +----------------------+
           | 1
           |
           | 1..*
  +--------v---------+             +----------------------+
  |    inventory     |             |       invoices       |
  |  PK: id          |             |  PK: id              |
  |  FK: user_id     |             |  FK: user_id         |
  +------------------+             +----------------------+
           ^                                  ^
           |                                  |
  +--------+---------+             +----------+-----------+
  |  customer_bills  |             |       expenses       |
  |  PK: id          |             |  PK: id              |
  |  FK: user_id     |             |  FK: user_id         |
  +------------------+             +----------------------+
```

### 7.2 Core Table Specifications

#### 1. Table: `users`
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Auto-increment internal ID |
| `user_id` | `VARCHAR(100)` | `UNIQUE, NOT NULL` | Business unique identifier (e.g. `USR-1260`) |
| `company_name` | `VARCHAR(255)` | `NOT NULL` | Registered business name |
| `company_address` | `TEXT` | `NULLABLE` | Business address |
| `business_type` | `VARCHAR(100)` | `DEFAULT 'General Store'` | Category of retail operations |
| `employee_count` | `VARCHAR(50)` | `DEFAULT '5'` | Scale indicator |
| `mobile_number` | `VARCHAR(20)` | `NOT NULL` | Contact mobile number |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Login email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Stored password digest |
| `role` | `VARCHAR(50)` | `DEFAULT 'owner'` | RBAC role indicator |
| `owner_id` | `VARCHAR(100)` | `NULLABLE` | Tenant owner reference key |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of registration |

#### 2. Table: `inventory`
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Stock SKU/ID |
| `user_id` | `VARCHAR(100)` | `FK(users.user_id), NOT NULL` | Scoping Tenant ID |
| `name` | `VARCHAR(255)` | `NOT NULL` | Item description |
| `category` | `VARCHAR(100)` | `DEFAULT 'General Store'` | Item category |
| `stock_qty` | `INTEGER` | `DEFAULT 0, CHECK(stock_qty >= 0)` | Current available quantity |
| `min_alert_threshold` | `INTEGER` | `DEFAULT 15` | Low stock alert trigger level |
| `unit_price` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Selling price per unit |
| `cost_price` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Supplier cost per unit |
| `supplier_name` | `VARCHAR(255)` | `NULLABLE` | Preferred vendor name |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Creation date |

#### 3. Table: `invoices` (Vendor Bills)
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Invoice system ID |
| `user_id` | `VARCHAR(100)` | `FK(users.user_id), NOT NULL` | Scoping Tenant ID |
| `invoice_number` | `VARCHAR(100)` | `NOT NULL` | Vendor bill reference number |
| `supplier_name` | `VARCHAR(255)` | `NOT NULL` | Vendor legal name |
| `invoice_date` | `DATE` | `DEFAULT CURRENT_DATE` | Date of invoice |
| `subtotal` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Pre-tax total amount |
| `tax_gst` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Total GST amount |
| `grand_total` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Total payable amount |
| `status` | `VARCHAR(50)` | `DEFAULT 'Verified'` | Status (`Verified`, `Flagged High Risk`, `Paid`) |
| `risk_score` | `VARCHAR(100)` | `DEFAULT '0.01 (Safe)'` | Anomaly score |
| `duplicate_reason` | `TEXT` | `NULLABLE` | Anomaly explanation |
| `items` | `JSONB` | `DEFAULT '[]'` | Array of itemized lines |
| `raw_text` | `TEXT` | `NULLABLE` | Unstructured OCR output |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Upload timestamp |

#### 4. Table: `customer_bills` (POS Checkout)
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Receipt system ID |
| `user_id` | `VARCHAR(100)` | `FK(users.user_id), NOT NULL` | Scoping Tenant ID |
| `bill_number` | `VARCHAR(100)` | `NOT NULL` | Receipt reference number |
| `customer_name` | `VARCHAR(255)` | `NOT NULL` | Customer name |
| `customer_phone` | `VARCHAR(20)` | `NULLABLE` | Contact phone |
| `subtotal` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Subtotal |
| `tax_gst` | `NUMERIC(12,2)` | `DEFAULT 0.00` | GST total |
| `grand_total` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Grand total |
| `profit_earned` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Calculated profit margin |
| `status` | `VARCHAR(50)` | `DEFAULT 'Paid'` | Payment status |
| `items` | `JSONB` | `DEFAULT '[]'` | Line items purchased |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Transaction timestamp |

#### 5. Table: `activity_logs` (Audit Trail)
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Audit record ID |
| `user_id` | `VARCHAR(100)` | `NOT NULL` | Tenant owner reference |
| `employee_id` | `VARCHAR(100)` | `NOT NULL` | Actor user ID |
| `user_name` | `VARCHAR(255)` | `NOT NULL` | Actor display name |
| `user_role` | `VARCHAR(50)` | `NOT NULL` | Actor role |
| `action` | `VARCHAR(100)` | `NOT NULL` | Operation executed |
| `module` | `VARCHAR(100)` | `NOT NULL` | Business module |
| `description` | `TEXT` | `NOT NULL` | Human readable log details |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Event timestamp |

---

## 8. Module Design Specifications

Every core module in FinGuard AI follows a standard specification: **Purpose → Components → APIs → DB Tables → Business Logic → Security → Error Handling**.

### 8.1 POS & Billing Module
- **Purpose**: High-speed point-of-sale checkout for retail counters.
- **Components**: `PosBillingModule.jsx`, `customer_bills.js` route handler.
- **APIs**: `POST /api/customer_bills`, `GET /api/customer_bills`.
- **DB Tables**: `customer_bills`, `inventory`, `transactions`.
- **Business Logic**:
  1. Validate item quantities against current stock in `inventory`.
  2. Compute line subtotal, apply GST percentage, calculate `grand_total`.
  3. Calculate net profit: `(selling_price - cost_price) * qty`.
  4. Write bill to `customer_bills`.
  5. Atomically decrement `stock_qty` in `inventory` table.
  6. Insert financial record into `transactions` table.
- **Security**: Requires role `owner`, `store_management`, or `billing`.
- **Error Handling**: Rollback transaction if `stock_qty < purchased_qty`.

### 8.2 Invoice & OCR Parsing Module
- **Purpose**: Parse physical vendor bills, check for duplicate billing, and log purchases.
- **Components**: `UploadInvoiceFullPage.jsx`, `invoices.js` route handler, NVIDIA Nemotron Client.
- **APIs**: `POST /api/invoices/upload`, `GET /api/invoices`.
- **DB Tables**: `invoices`, `vendors`, `fraud_alerts`.
- **Business Logic**:
  1. Receive image file payload.
  2. Dispatch image to NVIDIA Nemotron OCR v2 (fallback to Tesseract.js).
  3. Parse raw text using structural regex regex for Invoice No, Date, Vendor Name, Total.
  4. Run duplicate detector against existing `invoices` by `(invoice_number, supplier_name)`.
  5. If match found, set `status = 'Flagged High Risk'` and record entry in `fraud_alerts`.
- **Security**: Requires role `owner`, `financier`, or `accountant`.
- **Error Handling**: Low OCR confidence (<0.70) sets flag `Manual Review Needed`.

---

## 9. API Design Contracts

### 9.1 Endpoint Specifications

#### 1. Authentication: Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "userId": "USR-1260",
    "password": "mySecurePassword123"
  }
  ```
- **Response Body (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "user": {
      "id": 1,
      "user_id": "USR-1260",
      "company_name": "Metro Superstore",
      "email": "owner@metro.com",
      "role": "owner",
      "owner_id": "USR-1260"
    }
  }
  ```

#### 2. POS Billing: Create Bill
- **Endpoint**: `POST /api/customer_bills`
- **Auth**: Bearer JWT / Scoped Headers (`x-shop-id`)
- **Request Body**:
  ```json
  {
    "customerName": "Ramesh Kumar",
    "customerPhone": "9876543210",
    "items": [
      { "id": "ITEM-101", "name": "Rice 5kg", "qty": 2, "price": 350.00 }
    ],
    "subtotal": 700.00,
    "taxGst": 35.00,
    "grandTotal": 735.00
  }
  ```
- **Response Body (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Bill created successfully!",
    "bill": {
      "id": "BILL-172345678",
      "bill_number": "POS-8921",
      "grand_total": 735.00,
      "status": "Paid"
    }
  }
  ```

---

## 10. Business Workflows & Event Processing

### 10.1 Customer Purchase & POS Checkout Workflow

```text
 Customer Purchase at Counter
             │
             ▼
 POS Terminal (`PosBillingModule.jsx`)
             │
             ▼
 POST /api/customer_bills
             │
             ├───────────────────────────────────────────┐
             ▼                                           ▼
 Validate Inventory Stock Items              Compute GST & Grand Total
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼
                       Write Record to `customer_bills`
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
 Decrement Stock in      Record Transaction in    Trigger Anomaly /
 `inventory` Table       `transactions` Table      Sales Analytics Update
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                                   ▼
                    Generate Customer Print Receipt
```

---

## 11. AI / ML Engine Design

### 11.1 ML Model Matrix

| Problem Domain | Model Architecture | Training Features | Inference Output |
| :--- | :--- | :--- | :--- |
| **Fraud Anomaly Detection** | Isolation Forest + XGBoost Classifier | Invoice Amount, Vendor History, Time Gap, Tax Variance | Anomaly Probability Score (0.00 - 1.00) |
| **Demand Forecasting** | XGBoost Regressor + SARIMA | Daily Sales History, Day of Week, Seasonal Trends | Projected 7-day Demand Units |
| **Stockout Risk** | Logistic Regression / XGBoost | Stock Level, Lead Time, Burn Rate | Days-to-Stockout Indicator |
| **Customer Segmentation** | K-Means Clustering | Purchase Frequency, Average Basket Value | Segment Tag (VIP, Regular, At-Risk) |

### 11.2 Conversational AI Assistant
- **LLM Engine**: Groq Cloud API featuring `llama-3.3-70b-versatile`.
- **System Prompt Framing**: Injects real-time shop KPI snapshots (total inventory value, monthly sales, pending vendor invoices, top selling items) into context window for accurate business advisory.

---

## 12. OCR Processing Pipeline Design

### 12.1 Pipeline Flow
```text
 Upload Image / PDF (PNG, JPG, PDF)
               │
               ▼
 Store Document in Supabase / S3 Bucket
               │
               ▼
 Dispatch Payload to NVIDIA Nemotron OCR v2 API
               │
    ( Fallback if API Offline: Local Tesseract.js )
               │
               ▼
 Raw Unstructured Text & Coordinates Output
               │
               ▼
 Structural Parsing Engine (Regex for Invoice No, Date, GSTIN, Totals)
               │
               ▼
 Cross-Validation (Subtotal + GST == Grand Total)
               │
               ▼
 Save Verified Record to `invoices` Table
```

---

## 13. GST & Tax Compliance Design

### 13.1 Tax Logic Breakdown
- **GSTIN Regex**: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- **Intra-State Sale (Same State)**: Split GST evenly into **CGST** (50%) and **SGST** (50%).
- **Inter-State Sale (Different State)**: Apply full tax under **IGST** (100%).
- **Input Tax Credit (ITC)**: Total GST paid on vendor invoices (`invoices.tax_gst`) is credited against output GST collected on POS bills (`customer_bills.tax_gst`). Net Payable = `Output GST - Input Tax Credit`.

> **Note**: FinGuard AI calculates, validates, and generates downloadable GSTR-1 and GSTR-3B summary reports. Actual filing on the Government GST Portal is performed via external CA portal upload.

---

## 14. Monitoring & Observability

### 14.1 Key Health Metrics
- **System Metrics**: CPU Utilization, Memory Footprint, Disk I/O.
- **Application Metrics**: API Request Rate (req/sec), Latency Percentiles (p50, p95, p99), HTTP 5xx Error Rate.
- **Database Metrics**: Connection Pool saturation, Query Execution duration, Locks.
- **ML / OCR Metrics**: OCR processing duration per document, Groq LLM API response time.

### 14.2 Stack & Alerting Rules
- **Metrics Scraping**: Prometheus metrics endpoint (`GET /metrics`).
- **Dashboards**: Grafana visualizations for live operations.
- **Structured Logging**: Winston JSON logger writing to stdout and file logs.
- **Health Verification**: `GET /health` returns JSON status of Postgres DB connection, Redis cache, and external APIs.

---

## 15. Deployment & Infrastructure Specification

### 15.1 Containerized Deployment Topology

```text
                        [ NGINX Reverse Proxy Container ]
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
      [ Express Node.js Container 1 ]       [ Express Node.js Container 2 ]
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ▼                               ▼                               ▼
[ Supabase PostgreSQL ]        [ Redis Container ]             [ Python ML Container ]
```

### 15.2 CI/CD Pipeline Flow (GitHub Actions)
1. **Lint & Test**: Run ESLint and Jest unit test suites on PR push.
2. **Build**: Build React frontend bundle via Vite.
3. **Docker Image Packaging**: Build Docker container for Express backend, tag with commit SHA.
4. **Deploy**: Push image to Container Registry and trigger deployment rolling upgrade.
5. **Database Backup**: Automated daily snapshot of PostgreSQL database with 30-day retention and Point-in-Time Recovery (PITR).

---

> **Document Approval Signature**: *FinGuard AI Lead System Architect & Engineering Team*
