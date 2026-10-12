# 🛠️ Finora AI - Complete Low-Level Design (LLD) Specification

This document details the Low-Level Design (LLD) of the **Finora AI** platform, addressing all component-level operational flows, API routes, database schemas, validation schemas, security layers, background jobs, and system testing specifications.

---

## 1. Database Design

### 1.1 Complete Entity Schema Blueprint

```text
  +------------------+
  |      users       |
  |  PK: id          |
  +--------+---------+
           | 1
           |
           | 1..* (Created by Owner)
  +--------v---------+
  |    employees     |
  |  PK: id          |
  |  FK: user_id     |
  +------------------+
```

```text
  +------------------+             +----------------------+
  |     vendors      | 1           |       invoices       |
  |  PK: id          | +---------> |  PK: id              |
  |  FK: user_id     |             |  FK: user_id         |
  +------------------+             |  FK: supplier_name   |
                                   +----------+-----------+
                                              | 1
                                              |
                                              | 1..* (Embedded JSON Array)
                                   +----------v-----------+
                                   |    invoice_items     |
                                   +----------------------+
```

```text
  +------------------+             +----------------------+
  |    inventory     |             |    customer_bills    |
  |  PK: id          |             |  PK: id              |
  |  FK: user_id     |             |  FK: user_id         |
  +------------------+             +----------+-----------+
                                              | 1
                                              |
                                              | 1..* (Embedded JSON Array)
                                   +----------v-----------+
                                   |      bill_items      |
                                   +----------------------+
```

```text
  +------------------+             +----------------------+
  |     expenses     |             |     transactions     |
  |  PK: id          |             |  PK: id              |
  |  FK: user_id     |             |  FK: user_id         |
  +------------------+             +----------------------+
```

### 1.2 Table Definitions & Constraints

#### Table: `users`
* **`id`**: INTEGER, Primary Key, Auto-Increment.
* **`user_id`**: VARCHAR(64), Unique Constraint, Mandatory. (Example: `OWNER-1611`, `EMP-4821`).
* **`company_name`**: VARCHAR(128), Mandatory.
* **`company_address`**: TEXT, Optional.
* **`business_type`**: VARCHAR(64), Optional (Default: `General Store`).
* **`employee_count`**: VARCHAR(16), Optional.
* **`mobile_number`**: VARCHAR(15), Unique, Mandatory.
* **`email`**: VARCHAR(128), Unique, Mandatory.
* **`password_hash`**: VARCHAR(256), Mandatory (Argon2id/Bcrypt).
* **`role`**: VARCHAR(32), Mandatory (Enums: `owner`, `cashier`, `store_manager`, `financier`, `accountant`).
* **`owner_id`**: VARCHAR(64), Mandatory for employees (Self-reference if owner).
* **`created_at`**: TIMESTAMP, Default: `CURRENT_TIMESTAMP`.

#### Table: `invoices` (Vendor Bills)
* **`id`**: VARCHAR(64), Primary Key (UUID format).
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`invoice_number`**: VARCHAR(64), Mandatory.
* **`supplier_name`**: VARCHAR(128), Mandatory.
* **`invoice_date`**: DATE, Mandatory.
* **`subtotal`**: NUMERIC(12, 2), Mandatory.
* **`tax_gst`**: NUMERIC(12, 2), Mandatory.
* **`grand_total`**: NUMERIC(12, 2), Mandatory.
* **`status`**: VARCHAR(32), Mandatory (Enums: `Verified`, `Flagged High Risk`, `Pending`, `Paid`).
* **`risk_score`**: VARCHAR(64), Optional.
* **`duplicate_reason`**: TEXT, Optional.
* **`items`**: JSONB (Array of invoice items), Mandatory.
* **`raw_text`**: TEXT, Optional (Extracted raw OCR string).
* **`created_at`**: TIMESTAMP, Default: `CURRENT_TIMESTAMP`.

#### Table: `customer_bills` (POS Sales)
* **`id`**: VARCHAR(64), Primary Key (UUID format).
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`bill_number`**: VARCHAR(64), Unique per shop, Mandatory.
* **`customer_name`**: VARCHAR(128), Mandatory.
* **`customer_phone`**: VARCHAR(15), Optional (Default: `'N/A'`).
* **`subtotal`**: NUMERIC(12, 2), Mandatory.
* **`tax_gst`**: NUMERIC(12, 2), Mandatory.
* **`grand_total`**: NUMERIC(12, 2), Mandatory.
* **`profit_earned`**: NUMERIC(12, 2), Mandatory.
* **`status`**: VARCHAR(32), Mandatory (Enums: `Paid`, `Pending`).
* **`due_date`**: DATE, Optional.
* **`payment_date`**: DATE, Optional.
* **`items`**: JSONB (Array of cart items), Mandatory.
* **`created_at`**: TIMESTAMP, Default: `CURRENT_TIMESTAMP`.

#### Table: `inventory`
* **`id`**: VARCHAR(64), Primary Key (UUID format or barcode).
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`name`**: VARCHAR(128), Mandatory.
* **`category`**: VARCHAR(64), Optional.
* **`stockQty`**: INTEGER, Mandatory (Validation: `>= 0`).
* **`minAlertThreshold`**: INTEGER, Default: `15`.
* **`unitPrice`**: VARCHAR(32), Mandatory.
* **`status`**: VARCHAR(32), Mandatory (Enums: `Healthy Stock`, `Low Stock Alert`).
* **`supplier`**: VARCHAR(128), Optional.

#### Table: `expenses`
* **`id`**: VARCHAR(64), Primary Key (UUID format).
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`category`**: VARCHAR(64), Mandatory (Enums: `Staff Salary`, `Rent`, `Utilities`, `Procurement`, `Miscellaneous`).
* **`amount`**: NUMERIC(12, 2), Mandatory (Validation: `> 0`).
* **`date`**: DATE, Mandatory.
* **`paidTo`**: VARCHAR(128), Optional.
* **`status`**: VARCHAR(32), Mandatory (Enums: `Paid`, `Pending`).

#### Table: `transactions`
* **`id`**: VARCHAR(64), Primary Key.
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`date`**: DATE, Mandatory.
* **`type`**: VARCHAR(8), Mandatory (Enums: `'IN'`, `'OUT'`).
* **`description`**: TEXT, Mandatory.
* **`category`**: VARCHAR(64), Mandatory.
* **`amount`**: VARCHAR(32), Mandatory.
* **`balance`**: VARCHAR(32), Mandatory.
* **`created_at`**: TIMESTAMP, Default: `CURRENT_TIMESTAMP`.

#### Table: `employees`
* **`id`**: VARCHAR(64), Primary Key.
* **`user_id`**: VARCHAR(64), ForeignKey(`users.user_id`), Scoping Key, Mandatory.
* **`name`**: VARCHAR(128), Mandatory.
* **`role`**: VARCHAR(64), Mandatory.
* **`phone`**: VARCHAR(15), Mandatory.
* **`salary`**: VARCHAR(32), Mandatory.
* **`salary_date`**: VARCHAR(8), Mandatory.
* **`payment_status`**: VARCHAR(32), Default: `'Unpaid'`.
* **`payment_history`**: JSONB, Default: `'[]'`.

### 1.3 Database Relationships & Indexing Strategy

```text
Entity Scoping:
All business entities contain `user_id` referencing users.user_id for strict tenant isolation.
```

#### Database Indexes (Supabase/PostgreSQL)
To ensure rapid search and compliance boundaries under load:
1. `idx_invoices_tenant_num` on `invoices(user_id, invoice_number)` - Prevents cross-shop duplicates and accelerates document searches.
2. `idx_customer_bills_tenant_status` on `customer_bills(user_id, status)` - Speeds up calculation of outstanding customer credit accounts.
3. `idx_inventory_tenant_sku` on `inventory(user_id, id)` - Instant barcode product lookup during POS checkouts.
4. `idx_transactions_tenant_date` on `transactions(user_id, date DESC)` - Speeds up ledger queries and financial analytics loading.

#### Database Transaction Management (ACID)
For multi-record operations (e.g. POS Billing creating a bill and deducting inventory):
```sql
BEGIN TRANSACTION;
-- 1. Insert customer bill
INSERT INTO customer_bills (...) VALUES (...);
-- 2. Deduct item stock (Repeat for each item in cart)
UPDATE inventory SET stockQty = stockQty - $1 WHERE id = $2 AND user_id = $3;
-- 3. Check for threshold breach & insert activity log
INSERT INTO activity_logs (...) VALUES (...);
COMMIT;
```
* **Failure Handling:** If any update statement fails (e.g., database constraint breach or inventory item not found), the database transaction is automatically rolled back (`ROLLBACK;`) to preserve consistency.

---

## 2. POS / Sales Flow

### 2.1 Sales Lifecycle
```text
[POS Interface] 
   |-- 1. Scanned Barcodes match items in local State
   |-- 2. Click "Complete Sale"
   v
[HTTP POST /api/customer-bills]
   |
   +---> 1. validateShopIsolation() checks headers
   +---> 2. verifyStockAvailability() maps quantities
   |        |-- IF qty_requested > stockQty: Rejects checkout (400 Bad Request)
   v
[BEGIN TRANSACTION]
   |-- 1. Insert row into customer_bills
   |-- 2. Loop & update inventory quantities
   |-- 3. IF status === 'Paid': Insert row into transactions (IN)
   v
[COMMIT]
   |
   v
[JSON Response returned to client]
```

### 2.2 Billing Computations
* **Calculations:**
  * $\text{Subtotal} = \sum (\text{item.price} \times \text{item.qty}) - \text{Discounts}$
  * $\text{Tax GST} = \text{Subtotal} \times 0.18$ (Fixed 18% GST standard in calculations)
  * $\text{Grand Total} = \text{Subtotal} + \text{Tax GST}$
* **Payment Types:** Represented by the `payment_mode` field (`Cash`, `UPI`, `Card`, `Credit`). Credit payment status defaults to `Pending` with `due_date` required.
* **Returns & Cancellations:** Completed bills can be marked `Cancelled` by the Owner. This generates a corresponding transaction refund (OUT) and restores item quantities to inventory.

---

## 3. Invoice Module

### 3.1 Endpoint specifications

* **`GET /api/invoices`** (Owner, Financier, Cashier)
  * Returns active shop invoices.
* **`POST /api/invoices`** (Owner, Financier, Cashier)
  * Creates manually entered invoice. Auto-runs duplicate check.
* **`POST /api/invoices/upload`** (Owner, Financier)
  * Scans vendor invoice via OCR. Parses data, runs fraud check, returns invoice JSON.

### 3.2 Duplicate Bill Detection Algorithm
When an invoice is submitted:
```javascript
function verifyDuplicate(existingList, newInvoice) {
  const newNormNo = newInvoice.invoice_number.toLowerCase().replace(/[^a-z0-9]/g, '');
  const newNormVendor = newInvoice.supplier_name.toLowerCase().trim();
  const newTotal = parseFloat(newInvoice.grand_total);

  for (const item of existingList) {
    const activeNormNo = item.invoice_number.toLowerCase().replace(/[^a-z0-9]/g, '');
    const activeNormVendor = item.supplier_name.toLowerCase().trim();
    const activeTotal = parseFloat(item.grand_total);

    // Rule 1: Match same vendor and exact same invoice number
    if (newNormNo && activeNormNo && newNormNo === activeNormNo && newNormVendor === activeNormVendor) {
      return { duplicate: true, reason: `Duplicate invoice number ${item.invoice_number} detected from vendor ${item.supplier_name}` };
    }
    // Rule 2: Match same vendor and same grand total amount within +/- Rs 5
    if (newNormVendor === activeNormVendor && Math.abs(newTotal - activeTotal) <= 5.0) {
      return { duplicate: true, reason: `Matching invoice amount (${activeTotal}) previously recorded from vendor ${item.supplier_name}` };
    }
  }
  return { duplicate: false };
}
```

---

## 4. Inventory Module

### 4.1 Stock Mutation Pathways
* **Add Stock (Incoming Bills):** Automated adjustment matching invoice items. Matches by item description (case-insensitive) to increment `stockQty`.
* **Deduct Stock (POS Sale):** Decrements `stockQty` upon checkout.
* **Manual Adjustments:** Updates logged in `activity_logs`. The `minAlertThreshold` defaults to `15`. If updated stock falls below threshold:
  1. `status` changes to `'Low Stock Alert'`.
  2. Live notification feed aggregates this event as a warning flag.

---

## 5. Expense & Finance Module

### 5.1 Financial Ledgers
* **Representations:**
  * All income transactions (POS checkout cash/UPI/Card) are recorded with type `IN` and a positive amount string.
  * All outbound payouts (salaries, raw materials purchases) are recorded with type `OUT` and a negative amount string (e.g. `-₹ 25,000`).
* **Reporting Calculations:**
  * **Revenue:** Calculated as $\sum (\text{customer\_bills.grand\_total})$ where `status === 'Paid'`.
  * **Expenses:** Calculated as $\sum (\text{expenses.amount}) + \sum (\text{invoices.grand\_total})$.
  * **Net Profit:** $\text{Revenue} - \text{Expenses}$.

---

## 6. Authentication & RBAC

### 6.1 Authentication Flow

```text
[Frontend LoginPage] 
        |-- 1. Input userId / Password
        |-- 2. Call POST /api/auth/login
        v
[Backend Auth Router]
        |-- 1. Retrieve user record from DB
        |-- 2. Verify hashed password comparison
        |-- 3. If correct, generate JWT token
        v
[Return HTTP 200]
        |-- Payload: { token, user: { user_id, role, owner_id, company_name } }
```

### 6.2 Token Management
* **JWT Properties:** Signed using the backend secret. Contains `user_id`, `role`, `owner_id` (shop identifier) inside the encrypted payload.
* **Expiration:** Standard expiration set to `12h`. Refresh tokens are bypassed for simplicity; the client requests fresh login on expiration.
* **Authorization Headers:**
  * Requests transmit token as `Authorization: Bearer <token>`.
  * Middleware decrypts claims, verifies tenant ID, and sets permissions mapping.

### 6.3 Permissions Matrix

| Endpoint Route | cashier | store_manager | financier | accountant | owner |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /api/dashboard/stats` | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| `POST /api/invoices` | ✅ | ❌ | ✅ | ❌ | ✅ |
| `POST /api/customer-bills` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `GET /api/inventory` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PUT /api/inventory/:id` | ❌ | ✅ | ❌ | ❌ | ✅ |
| `DELETE /api/inventory/:id` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /api/employees` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `POST /api/reports/*` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 7. Multi-Tenant Security

### 7.1 Entity Relationships
* **User to Owner Scoping:** Every employee is mapped to their business owner via the `owner_id` attribute.
* **Multi-Branch Hierarchy:** Supports single owner scoping where employees act on the `owner_id` (referred to as `shop_id` in API headers).
* **Prevention of Header Spoofing:** In production, the backend ignores raw client header parameters. Instead, the verified `owner_id` is extracted directly from the decrypted JWT payload inside the auth middleware.

---

## 8. AI Assistant

### 8.1 Context Processing & Safety
* **Context Assembly:** When a chat query is requested, the system compiles a localized summary of current store data metrics. No raw transaction logs are sent.
* **Assistants Prompts Configuration:**
  * **Finance:** Scoped to margins, taxes, expenses.
  * **Inventory:** Scoped to stock valuations, low stock alert details, vendor item mapping.
  * **Vendor:** Scoped to delivery performance, bulk rate margins.
  * **Fraud/Growth:** Scoped to anomaly feeds, marketing advice.
* **Hallucination Prevention:** Prompts explicitly direct models: *"Use ONLY the numbers present in the provided store context. If the metrics are not present, respond that the data is not available. Do not invent any numbers."*

---

## 9. OCR Pipeline

### 9.1 Technical Processing Specifications
* **OCR File Upload Endpoint:** `POST /api/invoices/scan-file`.
* **Accepted Formats:** `image/jpeg`, `image/png`. Max size: `4MB`.
* **Execution Pathway:**
  1. Multer parses in-memory file buffer.
  2. Buffer is passed to **Tesseract.js** to extract raw ASCII text.
  3. Raw text is formatted into a prompt and dispatched to the **NVIDIA Nemotron Vision API** endpoint.
  4. Returns structured JSON containing fields: `supplierName`, `invoiceNumber`, `invoiceDate`, `subtotal`, `taxGst`, `grandTotal`, `items`.

---

## 10. Fraud Detection

### 10.1 Fraud Anomaly Risk Matrix
Risk calculations follow these defined severity steps:
* **Duplicate Invoice Number:** High Risk (Score: `0.95`). Logs high priority security warning.
* **Invoice Total Mismatch:** Medium Risk (Score: `0.50`). Triggered if sum of line items differs from invoice total by more than ₹10.
* **Suspect Invoice Amount:** High Risk (Score: `0.96`). Same vendor and grand total amount matches an invoice created within 30 days.

---

## 11. Notifications & Events

### 11.1 System Event Triggers

| Event Trigger | Category | Type | Target |
| :--- | :--- | :--- | :--- |
| `INVOICE_CREATED` | Invoice | Asynchronous | Run Duplicate Verification |
| `SALE_COMPLETED` | Billing | Synchronous | Update Stock Levels |
| `STOCK_LOW` | Inventory | Asynchronous | Create Live Dashboard Notification |
| `PAYMENT_OVERDUE` | Finance | Asynchronous | Flag Customer Account, Notify Owner |

---

## 12. Background Jobs

### 12.1 Scheduled Tasks Architecture
* **Task Engine:** Powered by **BullMQ** using Redis as task cache store.
* **Scheduled Reports Job:** Generates a weekly summary from sales, expenses, and inventory data.
* **Overdue Payments Scanner:** Fires daily (cron expression: `0 1 * * *`). Checks customer credit bills with pending statuses past due date.

---

## 13. Frontend LLD

### 13.1 Client Framework & Routing
* **Pages Layout:** Router mapped inside [`App.jsx`](file:///d:/SNS%20-%20cohart%20pp/FinGuard%20AI/frontend/src/App.jsx). Routes include: `LoginPage`, `SignupPage`, `BusinessOwnerDashboard`, `CreateInvoiceFullPage`, `UploadInvoiceFullPage`.
* **State Management:** Uses React **Context API** to maintain user authentication status, role permissions, and active store settings.
* **Error Boundaries:** Displays inline alerts for network disconnects without crashing the shell viewport.
