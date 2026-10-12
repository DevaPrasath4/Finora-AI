# FinSight AI — Decoupled Node.js Express REST API & Supabase Backend

## Overview
This folder contains the decoupled backend REST API server for **FinSight AI**.

- **Tech Stack**: Node.js, Express.js, Supabase (`@supabase/supabase-js`), CORS.
- **Port**: `5000` (http://localhost:5000)

## API Endpoints Available
- `GET /api/health` — Health check & status
- `POST /api/auth/login` — User authentication & credential verification
- `GET /api/dashboard/stats` — Live financial metrics (Sales, Expenses, Profit, Pending Bills)
- `GET /api/invoices` — List saved supplier invoices
- `POST /api/invoices` — Upload & save OCR extracted vendor bill
- `GET /api/inventory` — Store stock & inventory list
- `POST /api/inventory` — Add or update stock items
- `GET /api/vendors` — Active supplier & vendor profiles
- `GET /api/employees` — Store staff & attendance ledger
- `POST /api/ai/query` — AI Assistant query engine

## How to Run Backend Independently
```bash
cd backend
npm install
npm start
```

## Database Modes
The backend uses Supabase when `SUPABASE_ENABLED=true` is set alongside a valid
`SUPABASE_URL` and server-side key. The frontend requires
`VITE_SUPABASE_ENABLED=true`, a valid `VITE_SUPABASE_URL`, and its public anon
key in `frontend/.env`. Do not put a Supabase secret/service-role key or
database password in a `VITE_` variable.

## Code-Based Automation Endpoint
The endpoint is `POST /api/automation` and requires
the same shop identity as other business endpoints (`x-user-id`; `x-shop-id`
defaults to the user ID). Select one action per request:

- `send_otp_email`: `email`, `otp`, and optionally `owner_name`.
- `send_welcome_email`: `email`, `shop_name`, and the optional owner/account fields.
- `low_stock_alert`: checks the signed-in shop's inventory and sends a Telegram alert for stock below 10.
- `summarize_report`: `period` (`Last 2 Days` or `Last 7 Days`) and `summary` or `aiExecutiveSummary`; appends the generated text to Google Docs and sends it to Telegram.
- `growth_advice`: `type: "GROWTH_ADVICE"` and `aiGrowthAdvice`; reads the configured Google Doc, generates an image, and sends it to Telegram.

Configure service credentials in the backend `.env` file. Google actions need
either `GOOGLE_ACCESS_TOKEN` or `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_REFRESH_TOKEN`. The Google identity needs Gmail-send and Google Docs
read/write permissions. Set `GOOGLE_SENDER_EMAIL` only to an authorized sender
alias. Telegram actions need `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
AI/image actions need `GEMINI_API_KEY` and `HUGGINGFACE_API_TOKEN`; optional
model settings are `GEMINI_MODEL` and `HUGGINGFACE_IMAGE_MODEL`. Report actions
also need `GOOGLE_DOC_ID_LAST_2_DAYS` and/or `GOOGLE_DOC_ID_LAST_7_DAYS`, while
growth advice needs `GOOGLE_GROWTH_DOC_ID`.

Run the backend tests with `npm test` from this folder.
