# 🏛️ FinGuard AI — HLD Architecture Questionnaire: Complete Answers

> **Source Analysis**: Answers derived from deep inspection of the entire codebase including:
> - `backend/index.js`, `backend/db.js`, `backend/middleware/rbac.js`
> - `backend/routes/` (13 route files: ai, auth, customer_bills, dashboard, employees, expenses, inventory, invoices, payments, reports, settings, transactions, vendors)
> - `backend/data.json` (5,164-line live production data store)
> - `backend/supabase_schema.sql` (369-line full DDL schema)
> - `docs/architecture/` (final_hld.md, low_level_design.md, high_level_design.md)
> - **`SNS-Workbench.json`** (7,748-line agentbuilder automation workflow export — SNS iHub platform)

---

## 📑 Table of Contents
1. [System Scope & Architecture](#1-system-scope--architecture)
2. [Client Layer](#2-client-layer)
3. [Edge & API Layer](#3-edge--api-layer)
4. [Authentication & RBAC](#4-authentication--rbac)
5. [Multi-Tenancy](#5-multi-tenancy)
6. [Core Business Services](#6-core-business-services)
7. [Most Important Business Event Flow](#7-most-important-business-event-flow)
8. [Event-Driven Architecture](#8-event-driven-architecture)
9. [Database Architecture](#9-database-architecture)
10. [Cache Layer](#10-cache-layer)
11. [Invoice & OCR Architecture](#11-invoice--ocr-architecture)
12. [Fraud Detection Architecture](#12-fraud-detection-architecture)
13. [AI/ML Architecture](#13-aiml-architecture)
14. [AI Business Assistant](#14-ai-business-assistant)
15. [Analytics Architecture](#15-analytics-architecture)
16. [Notification Architecture](#16-notification-architecture)
17. [Payment Architecture](#17-payment-architecture)
18. [Compliance Architecture](#18-compliance-architecture)
19. [Audit & Security](#19-audit--security)
20. [Object Storage](#20-object-storage)
21. [Observability](#21-observability)
22. [Deployment & Infrastructure](#22-deployment--infrastructure)
23. [Reliability & Failure Handling](#23-reliability--failure-handling)
24. [Non-Functional Requirements](#24-non-functional-requirements)
25. [Core Business Flows for the HLD Diagram](#25-core-business-flows-for-the-hld-diagram)
26. [Final HLD Diagram Style](#26-final-hld-diagram-style)

---

## 1. System Scope & Architecture

### Should FinGuard AI be designed as a modular monolith initially, or microservices from the beginning?
**Modular Monolith — NOW. Microservices — LATER.**

The current codebase (`backend/index.js`) already uses a **Modular Monolith** with 13 cleanly separated route modules (`auth`, `invoices`, `customer_bills`, `inventory`, `employees`, `expenses`, `transactions`, `vendors`, `payments`, `reports`, `ai`, `settings`, `dashboard`) all mounted on a single Express server. The HLD should represent this current reality with a clearly drawn migration path to microservices when user scale requires it.

### If microservices, which business domains should have their own services?

| Service | Priority | Justification |
|:---|:---:|:---|
| **Auth / Identity / RBAC** | Phase 2 | Centralize JWT issuance, role validation, multi-tenant scoping |
| **OCR / AI Extraction** | Phase 2 | Compute-heavy NVIDIA Vision API calls should be isolated |
| **Fraud Detection** | Phase 2 | Independent anomaly engine with its own model versioning |
| **Notification** | Phase 2 | Already externalized via SNS iHub Workbench webhooks (Telegram, Gmail, OTP) |
| **Reporting / Analytics** | Phase 3 | Data warehouse pipeline, separate from transactional DB reads |
| **POS / Billing** | Phase 3 | High-traffic checkout endpoint needs independent scaling |
| **Inventory** | Phase 3 | Stock mutation is a hot-path requiring dedicated ACID transactions |
| **Invoice** | Phase 3 | Coupled with OCR pipeline and fraud detection |
| **AI Assistant / LLM** | Phase 3 | Groq API calls require their own rate limiting and context management |
| **Compliance / GST** | Phase 3 | Regulatory logic should be independently deployable |

### Which services should communicate synchronously (REST)?
- Client → Auth Service (login/signup)
- Client → POS Service (checkout)
- Client → OCR Service (invoice scan upload — synchronous because user waits)
- Client → AI Assistant (chat queries — synchronous response needed)
- Client → Dashboard (KPI stats — synchronous)
- All services → Audit Log Service (fire-and-forget REST POST)

### Which operations should be asynchronous (events)?
Evidence from `SNS-Workbench.json` confirms the following are **already async via webhooks**:
- `SALE_COMPLETED` → Inventory stock decrement webhook dispatched to SNS iHub
- `GROWTH_ADVICE` reports → dispatched via `POST /api/reports/growth` to SNS iHub webhook
- `2_DAY_DIGEST`, `WEEKLY_SUMMARY` → dispatched via `POST /api/reports/digest`
- Low-stock inventory detection → SNS iHub workflow → Gemini LLM → Telegram alert to owner
- OTP delivery → SNS iHub workflow → Gmail send node

**Target async operations:**
- `InvoiceCreated` → Fraud Detection (async background check after save)
- `SaleCompleted` → Analytics Update, Stock Level Check
- `StockLow` → Notification Service (Telegram + Email — confirmed working in Workbench)
- `PaymentOverdue` → Customer notification reminder
- Periodic scheduled report generation (weekly cron)

### Do you want an API Gateway in front of all backend services?
**YES.** The HLD should show a lightweight API Gateway layer (initially handled by the `validateShopIsolation` Express middleware, eventually migrated to a standalone service like Kong, AWS API Gateway, or NGINX Plus) that:
- Routes requests to correct service
- Validates JWT tokens
- Enforces rate limiting
- Injects tenant context (`x-shop-id`, `x-user-id`) into all downstream requests

### Do you want a separate Load Balancer before the API Gateway?
**YES — for production.** Recommended stack: **AWS ALB → NGINX API Gateway → Express Services**. For current MVP: A single process on Railway/Render with horizontal pod scaling.

### Do you want a service discovery/service mesh layer?
**No for MVP.** Keep it simple with direct DNS/URL referencing for individual services. Service mesh (Consul / Istio) is a Phase 3 scaling concern.

---

## 2. Client Layer

### What clients should appear in the HLD?

| Client | Status | Notes |
|:---|:---:|:---|
| **React Web Application (Vite + SPA)** | ✅ Current | Primary client — `BusinessOwnerDashboard.jsx`, `PosBillingModule`, `AiAssistantModule` |
| **POS Terminal** | ✅ Current | Part of the React SPA — `PosBillingModule.jsx` |
| **Camera / Invoice Scanner** | ✅ Current | `UploadInvoiceFullPage.jsx` — uploads photo, calls OCR |
| **AI Assistant Frontend Module** | ✅ Current | `AiAssistantModule.jsx` — 4 specialized chat assistants |
| **Telegram Bot (Notification Client)** | ✅ Current | Confirmed in SNS-Workbench.json — `PaymentaReminderBot` sends low-stock alerts |
| **Gmail / Email Client** | ✅ Current | Confirmed in SNS-Workbench.json — OTP delivery & Welcome email workflows |
| **Mobile Application** | 🔮 Future | Not implemented — show as a future component in HLD |
| **Admin Portal** | 🔮 Future | Management console for super_admin role (exists in data.json as `ADMIN-001`) |
| **Accountant Portal** | 🔮 Future | Separate read-only view for external CAs |
| **Voice Assistant** | 🔮 Future | Natural language voice queries to AI assistant |

### Should the mobile application be part of the current architecture or only shown as a future component?
**Show as a future component only.** The MVP is web-only. Mobile is Phase 2.

### Should POS be represented as part of the React application or as a separate client?
**Part of the React application.** `PosBillingModule.jsx` is a dashboard module, not a separate client. The HLD should show it as a module inside the Web App box.

### Should the AI assistant have its own frontend module/client?
**YES.** `AiAssistantModule.jsx` is a distinct UI panel with 4 specialized assistants (Finance, Inventory, Vendor, Fraud/Growth). Show it as a dedicated frontend component calling `POST /api/ai/chat`.

---

## 3. Edge & API Layer

### Which API Gateway do you want to use?
**Current**: Express.js middleware (`validateShopIsolation()` in `backend/middleware/rbac.js`) acting as a lightweight gateway.
**Future / Production**: **AWS API Gateway** (if deploying on AWS) or **Kong Open Source** (self-hosted).

### Should the HLD include:

| Component | Include? | Notes |
|:---|:---:|:---|
| **DNS** | ✅ Yes | Custom domain resolution |
| **CDN** | ✅ Yes | Cloudflare for static React SPA assets caching |
| **WAF** | ✅ Yes | Cloudflare WAF or AWS WAF for SQL injection, XSS protection |
| **DDoS Protection** | ✅ Yes | Cloudflare Unmetered DDoS mitigation |
| **Load Balancer** | ✅ Yes | AWS ALB or NGINX upstream |
| **API Gateway** | ✅ Yes | Central routing, auth validation, rate limiting |
| **Rate Limiter** | ✅ Yes | Per-user-ID request throttling (OCR endpoint especially) |

### Where should authentication happen?
**At the API Gateway level.** JWT validation occurs in the `validateShopIsolation()` middleware — this entire function should be promoted into the API Gateway in Phase 2 so downstream services receive pre-verified tenant context only.

### Should JWT validation happen at the API Gateway, individual services, or both?
**API Gateway only** (in Phase 2). Currently it happens at the Express middleware level on every service, which should be refactored. Individual services should trust the verified tenant claims injected by the Gateway via internal headers.

### Should the gateway perform tenant/business validation?
**YES.** The gateway should:
1. Validate JWT signature and expiry
2. Extract `user_id`, `owner_id`, `role` from JWT payload
3. Resolve `shop_id` (which is `owner_id` for employees)
4. Inject verified `x-shop-id`, `x-user-id`, `x-user-role` headers into all internal service requests

### Should the system use REST only, or GraphQL/gRPC anywhere?
**REST only** for the current phase. All 13 backend route files use REST with JSON payloads over HTTP. gRPC could be introduced in Phase 3 for high-throughput internal service-to-service communication (e.g., Inventory → Analytics).

---

## 4. Authentication & RBAC

### What authentication mechanism should FinGuard use?
**JWT + Role-Based Header Injection** (current). The recommended upgrade path is:
- **Phase 1 (Current)**: Custom JWT with `user_id`, `role`, `owner_id` claims. Stored in `localStorage`. Injected as HTTP headers (`x-shop-id`, `x-user-role`, `x-user-id`).
- **Phase 2**: **JWT + OAuth2/OpenID Connect** via Supabase Auth (already available in the Supabase stack). Supports social login and enterprise SSO.

### Do you want MFA/2FA in the architecture?
**YES — already partially implemented.** The `SNS-Workbench.json` contains a complete **OTP Email Workflow**:
```
Webhook Trigger (POST /webhook/2c8af1a7...)
  → Gmail Send Node (OTP email to owner)
  → IF Condition (verify OTP type)
  → Welcome Email (if new signup event)
```
This confirms OTP-based 2FA via Gmail is live. The HLD should show this as an active component.

### Where should passwords be stored and hashed?
**Supabase PostgreSQL** in the `public.users` table (`password_hash` column). Current implementation uses plaintext in `data.json` (development only). Production must use **bcrypt** or **Argon2id** hashing before storage, as documented in `final_hld.md` section 9.1.

### Should roles be centralized in an Auth service?
**YES (Phase 2).** Currently role normalization is in `backend/middleware/rbac.js` (`ROLE_ALIASES` map). This should be extracted into a centralized Auth Service.

### Should permissions be RBAC only, or RBAC + fine-grained permissions?
**RBAC + Fine-Grained Resource Permissions.** The `PERMISSIONS` map in `rbac.js` already implements fine-grained permissions:
```javascript
INVENTORY_READ: ['owner', 'financier', 'cashier', 'store_manager']
INVENTORY_WRITE: ['owner', 'store_manager']
INVENTORY_DELETE: ['owner']
EMPLOYEES_MANAGE: ['owner']
AI_ACCESS: ['owner']
SETTINGS_MANAGE: ['owner']
```

### Should the architecture show: User → Role → Permission → Resource?
**YES.** The HLD should explicitly show this chain:
```
User (user_id) → Role (owner/cashier/store_manager/financier/accountant)
              → Permission (INVENTORY_READ, AI_ACCESS, etc.)
              → Resource (inventory table, ai route, reports route)
```

### How should tenant/business isolation be enforced?
Through **3 layers**:
1. **Header Layer**: `x-shop-id` header injected by client, verified by middleware.
2. **Middleware Layer**: `validateShopIsolation()` resolves `req.shopId` = `owner_id` for all employees.
3. **Database Layer**: Every SQL query appends `WHERE user_id = req.shopId`. No cross-tenant data leakage is possible.

### Should every service receive a verified tenant_id/business_id?
**YES.** `req.shopId` is set by `validateShopIsolation()` middleware and all 12 protected route modules rely on `req.shopId` for every database query.

---

## 5. Multi-Tenancy

### Is each business a separate tenant?
**YES.** Each registered owner gets a unique `user_id` (e.g., `USR-8828`, `OWNER-3697`, `OWNER-METRO-8492`) that acts as the tenant key. All data records (`invoices`, `inventory`, `expenses`, `customer_bills`, `employees`, etc.) are stamped with `user_id = owner_id`.

### Can one owner manage multiple businesses?
**Not currently.** Each user account maps to exactly one `company_name`. Multi-business management is a Phase 3 Enterprise feature.

### Can one user belong to multiple businesses?
**Not currently.** Each user's `owner_id` maps to exactly one shop. Cross-shop employee assignments are unsupported in MVP.

### Can one business have multiple branches?
**Not currently.** The MVP scopes all data to a single `owner_id`. Multi-branch support is a Phase 3 Enterprise chain feature.

### Should branch-level isolation be supported now or later?
**Later (Phase 3).** Add a `branch_id` column to all tables.

### Which multi-tenancy strategy do you want?
**Shared database / Shared schema** (current) — The `public.*` Supabase schema is shared, with `user_id`-based Row Level Security (RLS) policies applied. This is the most cost-efficient strategy for the SMB market.

### Should the HLD explicitly show: Tenant ID → API Gateway → Services → Database?
**YES.** This data-scoping chain is the most critical security guarantee and must be prominently displayed in the HLD.

---

## 6. Core Business Services

### Should Invoice Service be separate from POS/Billing Service?
**YES.** They serve different directions:
- `POST /api/invoices` = **Vendor Bill Inflow** (money leaving the business to suppliers)
- `POST /api/customer-bills` = **Customer Sale Outflow** (money coming into the business from customers)

### Should Transaction Service be the central financial ledger?
**YES.** `backend/routes/transactions.js` maintains the canonical ledger of all `IN` (revenue) and `OUT` (expense/payment) flows.

### Should Payment Service be separate from Transaction Service?
**YES (Phase 2).** Currently `payments.js` is minimal. Future expansion to support Razorpay/UPI gateway webhooks warrants a dedicated Payment Service.

### Should Inventory Service maintain the authoritative stock quantity?
**YES.** `public.inventory.stock_qty` is the single source of truth. Both vendor invoice saves (increment) and POS checkouts (decrement) call the Inventory Service to mutate stock.

### Should Product Service maintain product master data?
**YES (Phase 2).** Currently product master data is embedded inside `inventory`. A dedicated Product/SKU catalogue service would separate product attributes from stock quantities.

### Should Vendor Service maintain supplier information and pricing history?
**YES.** `public.vendors` table already stores supplier directories. The AI vendor recommendation engine in `ai.js` queries vendor data to compare pricing history.

### Should Customer Service maintain customer profiles and credit information?
**YES (Phase 2).** Currently customer data (`customer_name`, `customer_phone`, credit/due dates) is embedded in `customer_bills`. A dedicated Customer Service with credit scoring is a Phase 2 feature.

### Should Expense Service maintain all business expenses?
**YES.** `backend/routes/expenses.js` with `public.expenses` table handles all operational outflows (rent, utilities, salaries, miscellaneous).

### Should Compliance Service consume events instead of directly querying every service?
**YES (Phase 2).** The Compliance/GST Service should subscribe to `InvoiceCreated`, `SaleCompleted`, `ExpenseRecorded` events and maintain its own read model for GSTR computation. This prevents tight coupling.

---

## 7. Most Important Business Event Flow

### When a customer purchases a product, should the architecture show this exact flow?

```
Customer at POS
  → [POS Module] Cart Items Selected + Payment Mode
    → POST /api/customer-bills (Express Server)
      → validateShopIsolation() (Tenant Verification)
        → verifyStockAvailability() (Inventory Check)
          → BEGIN ACID TRANSACTION
            → INSERT INTO customer_bills (Bill Created)
            → UPDATE inventory SET stock_qty = stock_qty - qty (Stock Deducted)
            → INSERT INTO transactions (Revenue Ledger Entry — type: 'IN')
            → INSERT INTO activity_logs (Audit Record)
          → COMMIT TRANSACTION
          → DISPATCH Webhook to SNS iHub (STOCK_CUSTOMER_BOUGHT event)
            → IF stock_qty < min_alert_threshold
              → Supabase getManyRows (inventory)
              → Code Execute (filter low-stock items < 10 units)
              → LLM Node (Gemini 3.5 Flash generates alert message)
              → Telegram Send Message (owner notified on @PaymentaReminderBot)
      → JSON Response → Client (Receipt Displayed)
```

This exact flow is **confirmed by both** `customer_bills.js` (backend code) and `SNS-Workbench.json` (the executed automation).

### Should these updates happen inside one database transaction, or through an event-driven workflow?
**HYBRID.** The core financial mutations (bill insert + stock decrement + ledger entry + audit log) **must be a single ACID database transaction** (already implemented). The downstream analytics and notification steps should be **async event-driven** via the webhook pipeline (already working via SNS iHub).

### What happens if inventory update succeeds but analytics processing fails?
The ACID transaction ensures the database is always consistent. If the external webhook dispatch to SNS iHub fails (analytics processing), the core POS sale is still saved and the transaction committed. The webhook dispatcher should implement retry logic with exponential backoff.

### Should the system support retry mechanisms?
**YES.** The SNS iHub workbench already handles retries at the workflow level. The backend should additionally implement webhook retry with 3 attempts and a Dead Letter Queue for permanently failed dispatches.

### Should failed events go to a Dead Letter Queue (DLQ)?
**YES (Phase 2).** Failed webhook payloads should be queued in a Redis-backed DLQ (BullMQ) for manual review and replay.

---

## 8. Event-Driven Architecture

### Do you want Kafka, RabbitMQ, or another messaging system?
**Phase 1-2**: **SNS iHub Agentbuilder Webhooks** (already in production — confirmed via `SNS-Workbench.json`).
**Phase 3**: Migrate to **BullMQ + Redis** for internal async task queuing (as documented in `final_hld.md` section 2.5). Kafka is overkill for the current SMB scale.

### Which events should be published?
Based on the existing codebase and SNS-Workbench.json automation flows:

| Event | Status | Confirmed Source |
|:---|:---:|:---|
| `InvoiceCreated` | ✅ Active | `invoices.js` → activity_log write |
| `InvoiceDuplicateDetected` | ✅ Active | `invoices.js` → fraud_alerts insert |
| `SaleCompleted` | ✅ Active | `customer_bills.js` → webhook dispatch |
| `InventoryUpdated` | ✅ Active | Both invoice save and POS checkout |
| `StockLow` | ✅ Active | SNS-Workbench: Supabase → Code → Gemini → Telegram |
| `OTPRequested` | ✅ Active | SNS-Workbench: Webhook → Gmail OTP send |
| `UserRegistered` | ✅ Active | SNS-Workbench: IF Condition → Gmail Welcome Email |
| `GrowthAdviceGenerated` | ✅ Active | SNS-Workbench: Webhook → IF → Telegram (GROWTH_ADVICE type) |
| `WeeklyReportGenerated` | ✅ Active | `reports.js` → WEBHOOK_URL_1 dispatch |
| `PaymentOverdue` | 🔧 Partial | Detected in reports but no notification confirmed |
| `FraudAlertCreated` | 🔧 Partial | Saved to fraud_alerts but no push confirmed |
| `PredictionGenerated` | 🔮 Future | AI demand/sales forecasting (not yet implemented) |
| `SalaryDue` | 🔮 Future | Salary date proximity alerts |

### Should the HLD show an Event Bus connecting the services?
**YES.** Show the SNS iHub Webhook Pipeline / BullMQ as a central Event Bus between the Express API and external notification services (Telegram, Gmail, WhatsApp).

### Which services should consume these events?

| Event | Consumer Services |
|:---|:---|
| `SaleCompleted` | Inventory Service, Transaction Ledger, Analytics, Notification (via webhook) |
| `StockLow` | Notification Service → Telegram Bot (confirmed), Email |
| `InvoiceDuplicateDetected` | Fraud Service, Dashboard Alert Feed, Notification |
| `OTPRequested` | Auth Service → Email (Gmail) via SNS iHub |
| `UserRegistered` | Notification → Welcome Email via SNS iHub |
| `WeeklyReportReady` | Reporting Service → Webhook → External (Telegram, Email) |

### Do you want event replay capability?
**YES (Phase 2).** BullMQ supports job replay. The SNS-Workbench shows past execution logs — replaying failed events is already possible manually via the SNS iHub execution history.

### Should Kafka/RabbitMQ be considered mandatory for MVP or future scaling?
**Not mandatory for MVP.** The SNS iHub Webhook pipeline adequately handles current async event needs. Introduce BullMQ/Redis queuing at Phase 2 when webhook failures need guaranteed delivery.

---

## 9. Database Architecture

### Should PostgreSQL be the primary transactional database?
**YES.** Supabase PostgreSQL is the confirmed primary database (`db.js` uses `@supabase/supabase-js`). `data.json` is the local fallback store for offline/development mode.

### Do you want one PostgreSQL database with multiple schemas, or separate databases per service?
**One Supabase PostgreSQL database with the `public` schema** (current). All 15 tables live in `public.*`. The schema uses Row Level Security (RLS) policies for tenant isolation.

### Which services need their own database?
Currently all services share the single Supabase PostgreSQL instance. In Phase 3:
- **Analytics/Reporting** → Dedicated read replica or data warehouse (BigQuery/Redshift)
- **Audit Logs** → Separate append-only time-series store

### Should financial transactions be stored in a dedicated financial ledger?
**YES.** `public.transactions` already serves as the financial ledger with `type: 'IN'/'OUT'`, `category`, `amount`, `balance`, and `date` columns.

### Should inventory movements have a separate transaction/history table?
**YES (Phase 2).** Currently only the final `stock_qty` is stored. An `inventory_movements` audit table recording every increment/decrement with timestamp, reason, and actor is needed for true stock audit trails.

### Should invoices be immutable after finalization?
**YES.** Once an invoice reaches `status: 'Verified'` or `status: 'Flagged High Risk'`, no edits should be permitted. Corrections require a new invoice with a reverse entry.

### Which data requires strong ACID transactions?
1. **POS Checkout** — `customer_bills INSERT + inventory UPDATE + transactions INSERT` (confirmed in `customer_bills.js`)
2. **Invoice Save** — `invoices INSERT + inventory UPDATE` (confirmed in `invoices.js`)
3. **Salary Payment** — `expenses INSERT + transactions INSERT`

### Which tables are expected to grow very quickly?
1. `activity_logs` — Every write operation generates a log entry (unbounded growth)
2. `transactions` — Every POS sale + expense = 2 records
3. `customer_bills` — High-volume daily POS receipts
4. `invoices` — Multiple OCR scans per day per shop

### Should the HLD show database replication/read replicas?
**YES (Phase 2).** Supabase supports read replicas. Dashboard KPI queries and analytics should hit read replicas; all transactional writes go to the primary.

### Should database partitioning be included?
**YES (Phase 3).** Partition `transactions` and `activity_logs` by `created_at` month to maintain query performance at scale.

### Should backups and disaster recovery be shown?
**YES.** Supabase provides automatic daily backups. The HLD should show:
- **Supabase Managed Backups** (daily, 7-day retention on free tier, 30-day on Pro)
- **Local JSON Fallback** (`data.json`) as an additional offline resilience layer
- **Point-in-Time Recovery (PITR)** for Pro plan

---

## 10. Cache Layer

### Should Redis be included?
**YES (Phase 2).** Currently no Redis cache exists. The `final_hld.md` documents Redis as the planned caching and BullMQ queuing backend.

### What should Redis store?

| Cache Key | TTL | Justification |
|:---|:---:|:---|
| `session:{user_id}` | 12 hours | JWT session state |
| `dashboard:{shop_id}` | 5 minutes | Aggregated KPI stats (totalSales, netProfit, lowStockCount) |
| `inventory:{shop_id}` | 2 minutes | Inventory list for POS barcode lookup |
| `rate_limit:{ip}` | 1 minute | OCR endpoint rate limiting (prevent abuse) |
| `ai_context:{shop_id}` | 10 minutes | Pre-computed store context for LLM prompts |
| `ocr_temp:{upload_id}` | 30 minutes | Temporary OCR result before user saves the invoice |

### Should dashboard analytics be cached?
**YES.** The `getStoreContextData()` function in `ai.js` and `getFullStoreContext()` in `reports.js` perform multiple parallel Supabase queries on every request. Caching these aggregated results with a 5-minute TTL would dramatically reduce database load.

### What happens when cached data becomes stale?
**Cache-Aside strategy with TTL expiry.** When a sale is completed or an invoice saved, the relevant dashboard cache key should be actively invalidated (cache busting) so the next request fetches fresh data.

---

## 11. Invoice & OCR Architecture

### Where should uploaded invoice images/PDFs be stored?
**Supabase Storage Bucket** (documented in `final_hld.md` section 2.3). Currently, images are processed as in-memory buffers only — not persisted. Phase 2 should save original bill images to a secure Supabase Storage Bucket with time-bound signed URLs stored in the `invoices` table.

### Should invoice processing be synchronous or asynchronous?
**Synchronous for MVP.** The user uploads a bill photo and waits for the OCR result (typically 3–8 seconds). The `POST /api/invoices/scan-file` endpoint runs Tesseract.js → NVIDIA Vision synchronously. For Phase 2, move to an async queue where OCR processing happens in the background and a WebSocket pushes the result when ready.

### Should the OCR pipeline be:
```
Upload → Object Storage → OCR → AI Extraction → Validation → Fraud Check → Human Approval → Database
```
**YES — this is the target architecture:**

```
[Upload to Supabase Storage]  (Phase 2)
        ↓
[Tesseract.js OCR — Extract Raw Text]  (Current)
        ↓
[NVIDIA Nemotron Vision AI — Structure JSON]  (Current)
        ↓
[Validation — Supplier/Date/Items completeness check]  (Current)
        ↓
[Fraud Check — Duplicate invoice number + amount tolerance]  (Current)
        ↓
[Human Review Flag — if risk_score > 0.5]  (Phase 2)
        ↓
[Save to invoices + inventory + activity_logs]  (Current)
```

### Which OCR technology should the HLD show?
- **Primary**: `NVIDIA Nemotron Vision AI` (`meta/llama-3.2-11b-vision-instruct`) — structured JSON extraction
- **Fallback**: `Tesseract.js Neural Engine` — offline raw text extraction
Both confirmed in `invoices.js` `processBillImageWithNvidiaAi()` and `parseOcrTextServer()`.

### Should OCR failures trigger retry?
**YES.** If NVIDIA Vision API fails, the system already auto-falls back to Tesseract.js local extraction. This two-tier fallback is already implemented.

### Should low-confidence OCR results require manual verification?
**YES (Phase 2).** If `risk_score > 0.5` or OCR confidence is below threshold (e.g., blurry image), show a manual verification overlay where the user confirms extracted fields before saving.

### Should original invoice files be retained for audit purposes?
**YES (Phase 2).** All uploaded bill images should be stored permanently in Supabase Storage (encrypted at rest). The `invoices` table should store a `file_url` pointing to the stored image for legal audit trail purposes.

---

## 12. Fraud Detection Architecture

### Should fraud detection be a separate Fraud Detection Service?
**YES (Phase 2).** Currently `checkDuplicateInDb()` is embedded in `invoices.js`. It should be extracted into a standalone Fraud Detection Service with its own database of known fraud patterns, risk models, and vendor trust scores.

### Which techniques should it use?
Currently implemented and confirmed:
- **Rule-Based Detection** (confirmed in `invoices.js`): Duplicate invoice number match, same vendor + amount within ₹5 tolerance

Future (Phase 2-3):
- **Statistical Anomaly Detection**: Flag sudden supplier price spikes >5% vs. 90-day average
- **LLM Reasoning**: Use Groq/Gemini to evaluate context of flagged invoices and generate natural-language fraud explanations

### Should fraud detection happen synchronously before an invoice is accepted?
**YES.** Currently the duplicate check runs inline (`checkDuplicateInDb()`) before the invoice is saved. This is the correct approach — block a high-risk save before database commit.

### Should it also run asynchronously after transactions?
**YES (Phase 2).** A background job should re-analyze all invoices periodically for patterns that only become visible with more historical data (e.g., gradual price manipulation across 6 months of invoices).

### Should every transaction receive a risk score?
**YES.** Currently only invoices receive risk scores (`0.01 Safe` to `0.96 High Risk`). Customer POS bills and manual expense entries should also receive anomaly scores in Phase 2.

### Should the system store: Risk Score + Detection Reason + Model Version + Evidence?
**YES.** The `fraud_alerts` table already stores `type`, `message`, and `severity`. Add `model_version` and `evidence_json` columns to the fraud_alerts table.

### Should fraud alerts go to the owner immediately?
**YES.** Currently alerts are saved to `public.fraud_alerts` and shown in the Dashboard AI Intelligence widget. In Phase 2, a `FraudAlertCreated` event should trigger an immediate Telegram + Email notification to the owner.

---

## 13. AI/ML Architecture

### Do you want a separate AI/ML Platform layer in the HLD?
**YES.** The HLD should show a dedicated **AI Platform Layer** containing:
- OCR Engine (Tesseract.js + NVIDIA Nemotron)
- LLM Serving (Groq API + Gemini via SNS iHub)
- Fraud Detection Engine
- Report Generation Engine

### Which AI capabilities should be shown separately?

| Capability | Model/Service | Status |
|:---|:---|:---:|
| OCR Data Extraction | Tesseract.js + NVIDIA Nemotron (llama-3.2-11b-vision) | ✅ Active |
| Fraud Detection | Rule-based engine in `invoices.js` | ✅ Active |
| Financial Insights Generation | Groq `llama-3.1-8b-instant` | ✅ Active |
| AI Business Assistant (Chat) | Groq `llama-3.1-8b-instant` (4 specialized agents) | ✅ Active |
| Low-Stock Alert Message | **Gemini 3.5 Flash** via SNS iHub LLM Node | ✅ Active |
| Growth Advisor | Groq `llama-3.1-8b-instant` | ✅ Active |
| Weekly Summary | Groq `llama-3.1-8b-instant` | ✅ Active |
| AI Image Generation | **HuggingFace** via SNS iHub | 🧪 Experimental |
| Sales Forecasting | Not implemented | 🔮 Future |
| Demand Forecasting | Not implemented | 🔮 Future |

### Should the AI pipeline contain: Raw Data → Feature Engineering → Model Training → Model Serving?
**Phase 3 only.** Currently all AI is inference-only (calling external APIs). Model training is not needed for MVP.

### Where will ML models run?
- **Current**: External cloud APIs (NVIDIA via `integrate.api.nvidia.com`, Groq via `api.groq.com`, Gemini via SNS iHub)
- **Phase 2**: FastAPI ML service for custom fraud detection models (Isolation Forest / XGBoost)

### Should model training happen periodically or continuously?
**Periodically (Phase 3).** Weekly batch retraining on the latest transaction and invoice data.

### Where should training datasets be stored?
**Phase 3**: Amazon S3 / Supabase Storage with versioned dataset snapshots.

### Should predictions be stored in PostgreSQL or a separate prediction store?
**PostgreSQL initially** (add a `predictions` or `ai_scores` table). Move to a dedicated vector/prediction store (Pinecone, pgvector) in Phase 3.

### Should the architecture show model monitoring?
**YES (Phase 3).** Track model accuracy over time — specifically fraud detection false positive/negative rates.

### Should the system track model versions?
**YES (Phase 3).** Add a `model_version` field to all AI-generated outputs (fraud_alerts, predictions).

---

## 14. AI Business Assistant

### Should the AI Assistant have a separate service?
**YES (Phase 2).** Currently the AI chat logic is in `backend/routes/ai.js`. Extract into a dedicated AI Assistant Service with its own context management, conversation history, and rate limiting.

### Should it access business data through APIs or directly access databases?
**Through internal APIs only.** The `getStoreContextData()` function in `ai.js` queries the database and assembles a context string. The LLM never directly touches the database.

### Should the AI Assistant use RAG (Retrieval Augmented Generation)?
**YES (Phase 2).** Instead of loading all store data into a single context string, implement RAG:
1. Store all financial records as vector embeddings
2. When a query arrives, retrieve only the top-K most relevant records
3. Inject retrieved context into the LLM prompt

### Should the assistant have access to: Sales, Expenses, Inventory, Customers, Vendors, Payments, Reports, Predictions?
**YES** — confirmed in `getStoreContextData()` function which already queries: `invoices`, `inventory`, `expenses`, `transactions`, `fraud_alerts`, `vendors`, `customer_bills` — 7 parallel Supabase queries assembled into a live context string.

### Should the assistant respect the user's RBAC permissions?
**YES.** The `AI_ACCESS: ['owner']` permission in `rbac.js` confirms that only owners can access the full AI Assistant. Employees cannot access financial AI insights.

### Should sensitive financial information be filtered before being sent to an external LLM?
**YES.** The system prompt explicitly states: *"Use ONLY the numbers present in the provided store context."* No raw transaction IDs, customer PII, or supplier GSTIN numbers are sent to external LLMs — only aggregated metric summaries are injected.

### Which LLM provider should the HLD show?
Show **three LLM providers** as confirmed by the codebase:
1. **Groq API** (`llama-3.1-8b-instant`) — Primary AI Chat + Report Generation
2. **NVIDIA Nemotron** (`llama-3.2-11b-vision-instruct`) — OCR bill extraction
3. **Gemini 3.5 Flash** — SNS iHub Low-Stock alert message generation (confirmed in SNS-Workbench.json)

### Should the AI Assistant support regional Indian languages?
**YES (Phase 2).** Show this as a planned feature. The Groq `llama-3.1-8b-instant` model supports Hindi and other Indian languages through appropriate system prompt instruction.

---

## 15. Analytics Architecture

### Should analytics be handled by a separate Analytics Service?
**YES (Phase 2).** Currently analytics are computed on-the-fly in `dashboard.js` and `reports.js` by querying the transactional Supabase database directly. This should be separated.

### Do you want a dedicated data warehouse?
**Phase 3 only.** Start with PostgreSQL read replicas + materialized views. Migrate to BigQuery or Snowflake at enterprise scale.

### Should the architecture show:
```
Operational DB → Event Bus → Data Pipeline → Data Warehouse → Analytics/BI
```
**YES (Phase 3).** For MVP, show: `Operational DB → Reports Service → Dashboard`.

### Which warehouse do you prefer?
**PostgreSQL initially** (with materialized views and read replicas). **BigQuery** as Phase 3 target for its native support for partitioned financial time-series tables.

### Should dashboards query the transactional database or an analytics store?
**Both, split by data freshness:**
- **Real-time KPIs** (Today's sales, current stock): Query transactional Supabase DB (with Redis cache)
- **Historical trends & reports**: Query read replica or pre-aggregated materialized views

### Should historical financial data be aggregated separately?
**YES (Phase 2).** Create daily/weekly/monthly aggregation jobs that pre-compute P&L summaries into a `financial_snapshots` table.

---

## 16. Notification Architecture

### Should Notification Service be independent?
**YES** — and it is **already partially independent** via the SNS iHub Agentbuilder Workbench. The `SNS-Workbench.json` shows a completely separate notification pipeline running on `api.agents.snsihub.ai` that is triggered by webhook events from the Express backend.

### Which channels should it support?

| Channel | Status | Evidence |
|:---|:---:|:---|
| **In-App (Dashboard Bell)** | ✅ Active | `fraud_alerts` and low-stock status shown in dashboard |
| **Telegram** | ✅ Active | `@PaymentaReminderBot` — confirmed in SNS-Workbench with real execution logs (message_id: 28) |
| **Email (Gmail)** | ✅ Active | OTP delivery + Welcome emails — confirmed in SNS-Workbench Gmail nodes |
| **WhatsApp** | 🔮 Future | `VITE_WEBHOOK_URL` env variable already set up for n8n/WhatsApp agent |
| **SMS** | 🔮 Future | Not yet implemented |
| **Push Notification** | 🔮 Future | Requires mobile app |

### Should notifications be triggered through events?
**YES — already implemented.** The flow confirmed by SNS-Workbench.json:
```
StockLow Event (qty < 10)
  → SNS iHub Webhook Trigger
    → Supabase getManyRows (fetch inventory)
      → Code Execute (filter low-stock items)
        → LLM Node (Gemini 3.5 Flash — generate alert message)
          → Telegram Send Message (⚠️ Inventory Alert dispatched)
```

### Should notification preferences be configurable per user?
**YES (Phase 2).** The `public.settings` table should include notification preference columns (enable_telegram, enable_email, alert_threshold_override).

### Should notifications have priority levels?

| Priority | Events |
|:---:|:---|
| 🔴 **CRITICAL** | Duplicate fraud invoice detected (risk_score > 0.9) |
| 🟠 **HIGH** | Stock quantity critically low (< 5 units), Payment overdue > 30 days |
| 🟡 **MEDIUM** | Low stock alert (< threshold), Salary due in 3 days |
| 🟢 **LOW** | Weekly report ready, New employee added |

---

## 17. Payment Architecture

### Should Payment Service be included in the current HLD?
**YES** — show it as a current (limited) service. `backend/routes/payments.js` exists but is minimal. The HLD should show it as a planned expansion point.

### Which payment methods should be supported?

| Method | Status | Notes |
|:---|:---:|:---|
| **Cash** | ✅ Active | `payment_mode: 'Cash'` in customer_bills |
| **UPI** | ✅ Active | `payment_mode: 'UPI'` in customer_bills |
| **Card** | ✅ Active | `payment_mode: 'Card'` in customer_bills |
| **Credit/Udhar** | ✅ Active | `status: 'Pending'` + `due_date` — confirmed in data.json |
| **Bank Transfer** | 🔮 Future | Manual entry possible, no gateway integration |

### Should payment gateways be integrated now or shown as future integrations?
**Future integrations.** Show **Razorpay**, **PhonePe**, and **Paytm** as planned Phase 2 external integrations.

### Should payment reconciliation be a separate service?
**YES (Phase 2).** Reconciling incoming UPI settlements from payment gateway reports against `customer_bills` records requires a dedicated Reconciliation Service.

---

## 18. Compliance Architecture

### Should Compliance Service be independent?
**YES (Phase 2).** Currently GST compliance logic is computed on-the-fly in `ai.js` insights and `reports.js`. Compliance needs its own service to maintain tax calculation rules independently.

### Should it consume events?
**YES.** The Compliance Service should subscribe to:
- `InvoiceVerified` → Record eligible Input Tax Credit (ITC)
- `SaleCompleted` → Record output GST liability
- `ExpenseRecorded` → Check if expense is eligible ITC

### Should the architecture show GST calculation separately?
**YES.** Show the GST Engine as a sub-component with:
- GST Rate Master table (`public.official_gst_rates`)
- ITC eligibility checker
- GSTR-1 (outward supplies) aggregator
- GSTR-3B (net tax liability) calculator

### Should GSTR-1/GSTR-3B generation be part of the current HLD?
**YES** — show it as a current feature with data flow from `invoices` and `customer_bills` tables.

### Should tax rules be stored in a separate master-data system/table?
**YES.** `public.official_gst_rates` table (confirmed in `supabase_schema.sql` DROP TABLE statement) stores the official Indian GST slab master data (0%, 5%, 12%, 18%, 28%).

---

## 19. Audit & Security

### Should Audit Log Service be independent?
**YES (Phase 2).** Currently audit logs are written inline by each route handler (`db.insert('activity_logs', ...)`). Extract to an independent Audit Service with an immutable append-only store.

### Should audit logs be immutable?
**YES.** The `activity_logs` table should be **write-only** with no UPDATE or DELETE permissions. Implemented via Supabase RLS policy restricting DELETE operations.

### Which actions must be audited?
From `invoices.js`, `customer_bills.js`, and HLD documentation:
- ✅ Invoice saved (OCR or manual)
- ✅ Stock quantity added/deducted
- ✅ Inventory price updated
- ✅ Salary processed
- ✅ Customer bill created
- ✅ Expense recorded
- ✅ Settings updated
- ✅ User login/logout
- ✅ Failed authentication attempts

### Should audit logs be stored separately from transactional data?
**YES (Phase 2).** Move `activity_logs` to a separate append-only PostgreSQL table or dedicated time-series store (e.g., TimescaleDB or CloudWatch Logs).

### Should sensitive data be encrypted at rest?
**YES.** Supabase encrypts all data at rest by default (AES-256). The `password_hash` field must use bcrypt/Argon2id.

### Should encryption keys be managed using KMS/Vault?
**YES (Phase 2 Production).** Use **AWS KMS** or **HashiCorp Vault** for managing NVIDIA API keys, Groq API keys, and Supabase secrets. Currently managed via `.env` files.

### Should secrets management be shown?
**YES.** Show `.env` for development and **AWS Secrets Manager / HashiCorp Vault** for production.

### Should WAF and DDoS protection be included?
**YES.** **Cloudflare** (free tier) for DDoS protection and basic WAF. The OCR endpoint (`POST /api/invoices/scan-file`) accepts 10MB payloads and is an obvious DDoS/abuse target.

### Should API rate limiting be shown?
**YES.** Implement rate limiting on:
- `/api/invoices/scan-file`: 10 requests/minute per `x-shop-id`
- `/api/ai/chat`: 30 requests/minute per `x-shop-id`
- `/api/auth/login`: 5 attempts/minute per IP

### Should the architecture include security monitoring/SIEM?
**YES (Phase 2).** Show **Supabase Audit** + **CloudWatch / Grafana** for security event correlation and anomaly detection.

---

## 20. Object Storage

### Which files need object storage?

| File Type | Status | Storage |
|:---|:---:|:---|
| **Supplier Invoice Images (PNG/JPG)** | 🔧 Phase 2 | Supabase Storage Bucket |
| **Vendor Bill PDFs** | 🔧 Phase 2 | Supabase Storage Bucket |
| **Generated PDF Reports** | 🔧 Phase 2 | Supabase Storage Bucket |
| **GST Export Documents** | 🔮 Future | Supabase Storage / S3 |
| **Customer Receipt PDFs** | 🔮 Future | Generated on-demand, not stored |
| **AI-Generated Images** | 🧪 Experimental | HuggingFace output confirmed in SNS-Workbench |

### Should object storage be shown separately from PostgreSQL?
**YES.** Show **Supabase Storage** as a distinct component alongside Supabase PostgreSQL in the HLD.

### Should files be encrypted?
**YES.** Supabase Storage encrypts files at rest. Apply server-side encryption for all uploaded invoice images.

### Should signed URLs be used for private documents?
**YES.** All stored invoice images should be accessed via **time-bound signed URLs** (e.g., 1-hour expiry) returned from the API. No direct public access to storage buckets.

---

## 21. Observability

### Do you want a dedicated observability section?
**YES.** Show as a Phase 2 addition.

### Should the architecture include:

| Capability | Tool | Priority |
|:---|:---|:---:|
| **Metrics** | Prometheus + Grafana | Phase 2 |
| **Logs** | Supabase Logs (current) + Loki | Phase 2 |
| **Distributed Tracing** | Jaeger | Phase 3 |
| **Error Tracking** | Sentry | Phase 2 |
| **Health Checks** | `/api/health` (confirmed in `index.js`) | ✅ Current |
| **Alerts** | Grafana Alerts / CloudWatch | Phase 2 |

The `/api/health` endpoint is already live:
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', system: 'FinSight AI Express API Backend', timestamp: ... });
});
```

### Should each microservice expose health/readiness endpoints?
**YES.** All services must expose `/health` and `/ready` endpoints.

### Should business metrics be monitored?
**YES.** Track:
- Fraud detection rate (flagged invoices / total invoices)
- OCR success rate (NVIDIA Vision vs. Tesseract fallback)
- AI chat response latency
- Failed payment rate
- Stock-out frequency

---

## 22. Deployment & Infrastructure

### Where should FinGuard be deployed?
- **Backend API**: **Railway** or **Render** (confirmed in `final_hld.md` — low-cost, git-push deployment)
- **Frontend SPA**: **Vercel** or **Netlify** (static React build)
- **Database**: **Supabase** (managed PostgreSQL, already live)
- **Automation Workflows**: **SNS iHub** (agentbuilder — already live, confirmed in SNS-Workbench.json)

### Should Docker be included?
**YES.** The backend should be containerized with Docker. `final_hld.md` mentions Docker Compose for local Redis + API.

### Should Kubernetes be included?
**Show as future scaling architecture.** Kubernetes (EKS/GKE) is appropriate when the platform scales beyond single-container Railway deployments. Not required for Year 1.

### Should the HLD show:
```
Internet → CDN/WAF → Load Balancer → Kubernetes → Services → Databases
```
**YES for the future architecture.** For current MVP, simplify to:
```
Internet → Cloudflare CDN/WAF → Vercel (Frontend) + Railway (Backend) → Supabase PostgreSQL
```

### Do you want auto-scaling?
**YES (Phase 2).** Railway and Render support auto-scaling via horizontal pod replicas. Show auto-scaling for the API and OCR processing containers.

### Should the architecture show multiple availability zones?
**YES (Phase 2).** Supabase Pro plan supports multi-AZ replication. Show primary and read replica in separate AZs.

### Should CI/CD be included?
**YES.** Use **GitHub Actions** for automated testing, build, and deployment:
```
git push → GitHub Actions → npm test → Docker build → Deploy to Railway/Vercel
```

---

## 23. Reliability & Failure Handling

### What should happen if the OCR service goes down?
**Confirmed auto-fallback already implemented in `invoices.js`:**
```
NVIDIA Vision API fails → Auto-fallback to Tesseract.js local OCR
Tesseract.js fails → Return error, user can manually enter invoice data
```
No data loss occurs. The user is informed to enter invoice details manually.

### What happens if the AI service is unavailable?
**Confirmed fallback already implemented in `ai.js`:**
```javascript
// If Groq API fails:
let reply = `[Offline Mode] Hello! I am your Finora AI Assistant...`
// Returns pre-computed store context metrics without LLM processing
```

### What happens if the notification service fails?
The SNS iHub webhook dispatch is fire-and-forget. If it fails:
- Core business operation (POS sale, invoice save) is **not affected** — already committed to DB
- Notification failure is logged
- Phase 2: Implement retry with 3 attempts + DLQ for failed webhook payloads

### What happens if the webhook pipeline (SNS iHub) is temporarily unavailable?
Business operations continue normally. Only outbound notifications (Telegram alerts, email digests) are delayed. The system does not depend on the webhook pipeline for transactional data.

### Should failed operations be retried automatically?
**YES.** Implement retry logic with exponential backoff for:
- NVIDIA Vision API calls (3 retries before Tesseract fallback)
- Groq API calls (2 retries before offline fallback)
- Supabase database connections (automatic via `@supabase/supabase-js` client)

### Should the system support idempotency for invoices/payments?
**YES.** Invoice saves should check for idempotency by invoice ID (already partially done via `checkDuplicateInDb()`). Add an idempotency key header for POS checkout to prevent duplicate bill submissions from network retry.

### Should circuit breakers be included?
**YES (Phase 2).** Implement circuit breakers for external API calls (NVIDIA, Groq, Supabase) using a Node.js circuit breaker library (`opossum` or `cockatiel`).

### Should the architecture include disaster recovery?
**YES.** The dual-storage strategy (`data.json` local + Supabase cloud) provides basic DR. Phase 2 adds:
- Daily automated Supabase backups
- Cross-region read replicas
- Documented RTO (Recovery Time Objective): < 4 hours, RPO (Recovery Point Objective): < 24 hours

---

## 24. Non-Functional Requirements

### What is the expected number of businesses?

| Timeframe | Businesses | Reasoning |
|:---:|:---:|:---|
| **Year 1** | 500–2,000 | Direct sales to Tier 1/2 cities, CA referrals, initial marketing |
| **Year 2** | 5,000–15,000 | Partnership channel + word-of-mouth + freemium to paid conversion |
| **Year 3** | 50,000–100,000 | Scaled digital acquisition, enterprise chains, WhatsApp bot virality |

### What is the expected number of concurrent users?
- **Year 1 Peak**: 200–500 concurrent users (assuming 10% of 2,000 businesses active simultaneously)
- **Year 2 Peak**: 2,000–5,000 concurrent
- **Year 3 Peak**: 20,000–50,000 concurrent

### What response time should normal APIs target?

| API Type | Target Latency |
|:---|:---:|
| Dashboard KPI stats | < 500ms |
| POS checkout | < 800ms |
| Invoice OCR scan | < 8 seconds (NVIDIA) / < 15 seconds (Tesseract fallback) |
| AI Chat query | < 3 seconds |
| Report generation | < 5 seconds (async webhook) |

### What availability target do you want?
**99.5% uptime (Year 1)** → **99.9% uptime (Year 2)** → **99.95% uptime (Year 3)**

### How much data do you expect to generate per day?
Per active business per day:
- ~5–20 POS bills + 2–5 vendor invoices + 1–3 expense entries + activity logs = ~100–500 database records/day
- At 2,000 businesses: ~200,000–1,000,000 records/day

### Which operations require real-time processing?
- POS checkout (customer cannot wait > 2 seconds at checkout counter)
- Invoice fraud duplicate check (must complete before save)
- Stock deduction on sale (must be atomic)
- Dashboard KPI refresh (< 5 minutes stale tolerance)

### Which operations can be asynchronous?
- Report generation (2-Day digest, Weekly P&L)
- Low-stock notification sending (Telegram/Email alerts)
- OCR background reprocessing
- AI growth advice generation
- Salary due reminders
- Analytics aggregation

---

## 25. Core Business Flows for the HLD Diagram

### Flows to include in the HLD:

| Flow | Include? | Evidence |
|:---|:---:|:---|
| **Customer Sale Flow (POS)** | ✅ YES | Confirmed in `customer_bills.js` + SNS-Workbench webhook |
| **Supplier Invoice / OCR Flow** | ✅ YES | Confirmed in `invoices.js` — Tesseract → NVIDIA → Fraud → DB |
| **Fraud Detection Flow** | ✅ YES | `checkDuplicateInDb()` active in invoices |
| **Inventory Prediction / Low-Stock Flow** | ✅ YES | Confirmed in SNS-Workbench: Supabase → Gemini → Telegram |
| **AI Assistant Flow** | ✅ YES | `ai.js` with 4 Groq agents + live context injection |
| **Weekly AI Report Flow** | ✅ YES | `reports.js` → Groq → WEBHOOK_URL_1 dispatch |
| **Notification Flow** | ✅ YES | SNS-Workbench: Telegram + Gmail (OTP, Welcome, Low-Stock) |
| **Payment / Credit Flow** | ✅ YES | `customer_bills.js` — Cash/UPI/Credit + due date tracking |
| **Compliance / GST Flow** | ✅ YES | `ai.js` insights → ITC calculation + GSTR summary |

---

## 26. Final HLD Diagram Style

### How many architectural sections?
**Option B — 10–12 detailed sections** is the correct level for this project:
1. Client Layer (Web App, Telegram Bot, Email Client, Future Mobile)
2. CDN / WAF / DDoS Layer (Cloudflare)
3. API Gateway & Rate Limiting (validateShopIsolation / Kong)
4. Core Business Services Layer (13 Express Route Modules)
5. AI / ML Platform Layer (Groq, NVIDIA, Gemini)
6. External Automation / Event Bus (SNS iHub Workbench + Webhooks)
7. Database Layer (Supabase PostgreSQL + Local JSON Fallback)
8. Cache Layer (Redis — Phase 2)
9. Object Storage (Supabase Storage Bucket)
10. Notification Delivery Layer (Telegram, Gmail, Future WhatsApp/SMS)
11. Observability Layer (Health Endpoint, Sentry, Grafana — Phase 2)
12. CI/CD & Infrastructure (GitHub Actions + Railway + Vercel)

### Should every microservice show its major responsibilities inside the box?
**YES.** Each service box should list 2–3 key responsibilities.

### Should every database show what data it stores?
**YES.** Database boxes should list the primary tables they own (e.g., Supabase PostgreSQL: `users, invoices, inventory, customer_bills, transactions, expenses, employees, vendors, fraud_alerts, activity_logs`).

### Should synchronous and asynchronous communication use different arrow styles?
**YES.** Use:
- **Solid arrows** (→) for synchronous REST API calls
- **Dashed arrows** (--→) for asynchronous webhook/event-driven communication
- **Double arrows** (⇔) for database read/write operations

### Should external systems be shown?
**YES.** Show external systems as distinct boxes outside the main architecture boundary:
- **Groq Cloud API** (AI Chat + Reports)
- **NVIDIA Nemotron Vision API** (OCR)
- **Gemini (via SNS iHub)** (Low-stock alerts)
- **Supabase** (Database + Auth + Storage)
- **Telegram Bot API** (Confirmed active delivery)
- **Gmail API / Google OAuth** (OTP + Welcome emails — confirmed)
- **HuggingFace** (Experimental image generation — confirmed in SNS-Workbench)
- **SNS iHub Agentbuilder Platform** (Automation Orchestrator)

### Should the diagram show both current architecture and future scaling architecture?
**YES.** Split into two sections:
- **Current Architecture (Phase 1 MVP)** — Everything described as "✅ Active"
- **Future Architecture (Phase 2-3)** — Components marked "🔮 Future" / "Phase 2-3"

### Do you want the final HLD to be optimized for company/mentor presentation or technical documentation?
**Both.** Create two versions:
- **Executive Version**: 6–8 sections, focus on business flows, clean visual layout for mentor/investor presentation
- **Technical Version**: 12+ sections, full arrow labeling with HTTP methods, table names, event types, for technical documentation and interview defense

---

*Document compiled from analysis of: `backend/index.js`, `backend/db.js`, `backend/middleware/rbac.js`, `backend/routes/` (13 files), `backend/data.json` (5,164 lines), `backend/supabase_schema.sql` (369 lines), `docs/architecture/final_hld.md`, `docs/architecture/low_level_design.md`, `docs/architecture/high_level_design.md`, and `SNS-Workbench.json` (7,748 lines — SNS iHub agentbuilder automation platform export).*
