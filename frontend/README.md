# FinSight AI — Decoupled React Vite Web Application

## Overview
This folder contains the decoupled frontend single-page web application for **FinSight AI** ("See beyond the numbers").

- **Tech Stack**: React 18, Vite, React Router DOM, Lucide Icons, Vanilla CSS Design Tokens (`#F3CD97` highlight).
- **Port**: `5173` (http://localhost:5173)

## Features Included
1. **Business Owner Command Dashboard**:
   - Profit & Loss, Revenue, Pending Credit Bills, Money Out KPIs.
   - Dynamic **Shop Stock Details** card with live units remaining.
   - Dynamic **Active Suppliers** card with direct navigation link.
   - **Cashflow History (Money In vs Money Out)** table connected to live transactions.
   - Multi-category **AI Intelligence & Fraud Feed**.
2. **Supplier Invoice Upload Page**:
   - OCR Extraction, Duplicate Bill Detection, side-by-side compact financial controls.
   - Automatic stock count auto-increment on vendor bill upload.
3. **POS Billing Page**:
   - Point-of-Sale bill generation.
   - Automatic stock count auto-deduction on customer receipt creation.
4. **Supplier & Vendor Management**:
   - Active vendor profiles, total billed/paid metrics, itemized receipt breakdown modal.

## How to Run Frontend Independently
```bash
cd frontend
npm install
npm run dev
```
