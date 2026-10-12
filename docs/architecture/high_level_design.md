# 🏛️ Finora AI - High-Level Design (HLD) Document

This document provides a comprehensive high-level design specification for the **Finora AI** platform, detailing its system components, architectural patterns, data flows, and security protocols.

---

## 1. System Architecture Overview

Finora AI is designed as a modular, multi-tenant Business Intelligence and Financial Management system tailored for Indian retail, wholesale, and supermarket SMEs.

```text
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   +-------------------------------------------------------------------------+   |
|   |                      Vite + React Single Page App                       |   |
|   |         - POS Module  - AI Chat Client  - OCR Upload  - Settings        |   |
|   +-------------------------------------------------------------------------+   |
+----------------------------------------+----------------------------------------+
                                         | Injects tenant headers:
                                         | (x-shop-id, x-user-role)
                                         v
+---------------------------------------------------------------------------------+
|                                 GATEWAY LAYER                                   |
|   +-------------------------------------------------------------------------+   |
|   |                       validateShopIsolation() Middleware                 |   |
|   |                 Enforces multi-tenancy & binds req.shopId               |   |
|   +-------------------------------------------------------------------------+   |
+----------------------------------------+----------------------------------------+
                                         | Scoped Requests
                                         v
+---------------------------------------------------------------------------------+
|                               SERVICES LAYER                                    |
|   +--------------+  +--------------+  +--------------+  +--------------------+  |
|   |  POS Route   |  |   AI Route   |  |  OCR Route   |  |    Reports Route   |  |
|   +------+-------+  +------+-------+  +------+-------+  +---------+----------+  |
|          |                 |                 |                    |             |
+----------v-----------------v-----------------v--------------------v-------------+
|                                DATA LAYER                                       |
|   +-----------------------+ +------------------------+ +---------------------+   |
|   |  Local JSON Database  | |      Groq LLM API      | |  NVIDIA Vision API  |   |
|   |      (data.json)      | | (llama-3.1-8b-instant) | | (Nemotron Vision)   |   |
|   +-----------+-----------+ +------------------------+ +---------------------+   |
|               |                                                   |             |
|               |                                                   v             |
|               |                                        +---------------------+  |
|               |                                        |    Tesseract OCR    |  |
|               |                                        |       Engine        |  |
|               |                                        +---------------------+  |
|               v                                                                 |
|   +-----------------------+                                                     |
|   |   Supabase DB Sync    |                                                     |
|   |     (PostgreSQL)      |                                                     |
|   +-----------------------+                                                     |
+---------------------------------------------------------------------------------+
```

---

## 2. Core Components

### 2.1 Web Client (Frontend)
* Built using **React 18** and **Vite** for rapid hot-reloading and low bundle sizes.
* Incorporates Lucide icons and uses vanilla CSS to render a **Liquid Dark** responsive admin dashboard.
* Uses client-side routing to manage permissions and dynamically display modules depending on user roles.

### 2.2 Application Server (Backend)
* Formulated using **Express.js (Node.js)** as a lightweight REST API.
* Implements a custom middleware validator (`validateShopIsolation`) to capture incoming credentials and intercept requests for cross-shop validation.

### 2.3 Local Database Wrapper
* Manages state read/writes in a centralized, flat JSON repository (`data.json`) via a synchronous helper class.
* Provides quick reads for offline or high-latency locations, acting as the primary database store with secondary cloud hooks.

### 2.4 Vision OCR Engine
* Coordinates **Tesseract.js** for raw image text extraction.
* Couples text data with **NVIDIA Nemotron LLM Vision Models** to normalize unstructured invoice fields into clean JSON formats.

### 2.5 Multi-Agent AI Engine
* Initiates four distinct instances of **Groq LLM Models** (`llama-3.1-8b-instant`), each loaded with specialized store data contexts (Finance, Inventory, Vendors, Growth).

---

## 3. Core Data Flows

### 3.1 Point-of-Sale (POS) Checkout Flow
```text
[Cashier Cart Items] ---> [Confirm Checkout Mode (Paid / Credit)]
                                    |
                                    v
                     [Create Customer Bill in DB]
                                    |
            +-----------------------+-----------------------+
            | (Paid Mode)                                   | (Credit Mode)
            v                                               v
[Insert Income Transaction]                      [Insert Bill with Due Date]
[Auto-add Cash to Ledger]                        [Mark status: 'Pending']
            |                                               |
            +-----------------------+-----------------------+
                                    v
                    [Persist Stock Changes]
                                    |
                                    v
                         [Return Result to Client]
```

### 3.2 Supplier OCR Scanning Flow
1. **Upload:** User uploads a supplier invoice image.
2. **Text Extraction:** Server extracts raw characters using local Tesseract library.
3. **Structured Mapping:** Scanned text is passed to NVIDIA Nemotron to identify fields like supplier name, invoice number, items, and total amount.
4. **Validation:** Checks database for duplicate invoice numbers or similar transactions.
   * If a duplicate is found, the system registers a **HIGH RISK** warning in the database and creates a security alert.
5. **Inventory Sync:** Reconciles invoice line items against current stock, auto-incrementing quantity.

### 3.3 AI Insights Context flow
* **Trigger:** User sends a query in the AI tab.
* **Context Generation:** Backend reads all current database rows (sales, expenses, inventory, vendor records) filtered by the user's `shopId`.
* **Prompt Assembly:** Backend constructs a system prompt containing this structured context.
* **groq Inference:** Groq model processes prompt and returns tailored, data-backed insights.

---

## 4. Multi-Tenant Architecture & Data Isolation

Data security is enforced using shop-level scoping:

* **No Shared Tables:** Every record in the database contains a `user_id` field corresponding to the shop owner's identifier.
* **Middleware Interception:**
  ```javascript
  // backend/middleware/rbac.js
  export function validateShopIsolation() {
    return (req, res, next) => {
      const shopId = req.headers['x-shop-id'];
      const userRole = req.headers['x-user-role'];
      if (!shopId) {
        return res.status(401).json({ success: false, error: 'Shop Identification Header Missing' });
      }
      req.shopId = shopId;
      req.userRole = userRole;
      next();
    };
  };
  ```
* **Database Isolation:** All repository access code systematically filters by `req.shopId` before performing database operations:
  ```javascript
  const invoices = db.getTable('invoices').filter(i => i.user_id === req.shopId);
  ```
