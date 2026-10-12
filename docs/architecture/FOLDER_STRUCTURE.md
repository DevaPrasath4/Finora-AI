# FinGuard AI - Optimized Production Monorepo Folder Structure

This repository structure is optimized for **FinGuard AI**, an AI-powered financial management, automation, and intelligence platform built for Small & Medium Scale Businesses (SMBs).

---

```
FinGuard-AI/
├── frontend/                        # React Native (React Native Web + Vite) Frontend
│   ├── public/                      # Static Assets (Images, Icons, Fonts)
│   │   └── assets/                  # Hero Mockups, OCR & Security Visuals
│   ├── src/
│   │   ├── components/              # Reusable UI Components & Sections
│   │   │   ├── Navbar.jsx           # Glassmorphic Cream Navigation Header
│   │   │   ├── HeroSection.jsx      # Animated Hero Banner & Executive Showcase
│   │   │   ├── RoleShowcase.jsx     # Interactive RBAC Solution Switcher
│   │   │   ├── FeaturesGrid.jsx     # 6-Card Core Capabilities Matrix
│   │   │   ├── AiDemoSimulator.jsx  # Interactive Gemini LLM Advisory Terminal
│   │   │   ├── RoiCalculator.jsx    # Operational Efficiency Impact Estimator
│   │   │   ├── ArchitectureSection.jsx # Microservices Infrastructure Breakdown
│   │   │   ├── PricingSection.jsx   # Enterprise Deployment Models
│   │   │   ├── TestimonialsSection.jsx # Customer Case Studies & Verification
│   │   │   └── Footer.jsx           # Enterprise Footers, Security Badges & Lead Form
│   │   ├── pages/                   # Application Views (Dashboard, Invoices, Compliance, Audit)
│   │   │   ├── Login.jsx            # RBAC Authentication Page
│   │   │   ├── Dashboard.jsx        # Executive 360° Financial Overview
│   │   │   ├── Invoices.jsx         # OCR Scanner & Invoice Ledger
│   │   │   ├── Inventory.jsx        # Stock Levels & Demand Forecasting
│   │   │   ├── Vendors.jsx          # Low-Cost Supplier Comparison
│   │   │   ├── FraudAlerts.jsx      # Real-Time Anomaly Governance
│   │   │   ├── Compliance.jsx       # GST Reports (GSTR-1, GSTR-3B)
│   │   │   └── Reports.jsx          # Weekly Executive PDF/Excel Reports
│   │   ├── services/
│   │   │   ├── api.js               # Axios Client & FastAPI Gateway Integration
│   │   │   └── authService.js       # JWT Session & Role Permissions
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # RBAC State Provider
│   │   ├── styles/
│   │   │   └── global.css           # Cream White & Warm Nude Aesthetic Tokens
│   │   ├── App.jsx                  # Main Application Entry
│   │   └── main.jsx                 # DOM Mount & React Native Web Polyfills
│   ├── index.html                   # HTML Shell & Google Fonts
│   ├── vite.config.js               # Vite + React Native Web Alias Setup
│   └── package.json
│
├── api-gateway/                     # Central FastAPI API Gateway
│   ├── app/
│   │   ├── main.py                  # Entry Point & Router Registry
│   │   ├── routes/                  # Gateway Proxy Routes to Microservices
│   │   ├── middleware/              # CORS, Rate Limiting, Request Logging
│   │   ├── authentication/          # JWT Verification & RBAC Claim Guard
│   │   └── config.py                # Environment & Service URL Configurations
│   ├── Dockerfile
│   └── requirements.txt
│
├── services/                        # Independent Microservices Architecture
│   │
│   ├── user-service/                # Auth & RBAC Management
│   │   ├── app/
│   │   │   ├── main.py              # Service API Entry
│   │   │   ├── models/              # User and role data models
│   │   │   ├── routes/              # User Admin & Role Assignment APIs
│   │   │   └── permissions/         # Department Permission Enforcement
│   │   └── requirements.txt
│   │
│   ├── invoice-service/             # Invoice OCR & Reconciliation Service
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── ocr/                 # OCR Engine (Google Vision / Tesseract)
│   │   │   ├── routes/              # Upload, Scan, & Ledger APIs
│   │   │   └── pdf/                 # Invoice PDF Generation
│   │   └── requirements.txt
│   │
│   ├── transaction-service/         # Bank Ledger & Reconciliation
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── reconciliation/      # Bank Statement vs Invoice Auto-Match
│   │   │   └── routes/
│   │   └── requirements.txt
│   │
│   ├── inventory-service/           # Stock & Demand Forecasting Service
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── stock/               # Inventory Balance Tracking
│   │   │   ├── alerts/              # Low-Stock Alert Triggers
│   │   │   └── history/             # Usage Velocity Metrics
│   │   └── requirements.txt
│   │
│   ├── fraud-service/               # AI Anomaly & Fraud Detection Engine
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── rules/               # Rule Engine (Duplicate Bill Checks, Overbilling)
│   │   │   ├── anomaly_detection/   # ML Isolation Forest Anomaly Scoring
│   │   │   └── alerts/              # High-Risk Disbursement Lock
│   │   └── requirements.txt
│   │
│   ├── vendor-service/              # Vendor Cost Optimization & PO Service
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── comparison/          # Lowest Supplier Rate Matching Engine
│   │   │   ├── routes/
│   │   │   └── po_generator/        # Purchase Order Dispatch
│   │   └── requirements.txt
│   │
│   ├── compliance-service/          # Tax & GST Reporting Service
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── gst/                 # GSTR-1 & GSTR-3B Tax Filing Generators
│   │   │   └── routes/
│   │   └── requirements.txt
│   │
│   ├── ai-service/                  # Google Gemini LLM Advisory Engine
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── financial_advisor/   # Gemini Advisory Prompt Pipelines
│   │   │   ├── forecasting/         # Cash Flow & Liquidity Predictors
│   │   │   └── prompts/             # Enterprise System Prompts
│   │   └── requirements.txt
│   │
│   ├── notification-service/        # Multi-Channel Alert Dispatch
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── whatsapp/            # WhatsApp Business API Client
│   │   │   ├── sms/                 # SMS Alert Dispatch
│   │   │   └── email/               # Email Digest Generator
│   │   └── requirements.txt
│   │
│   └── audit-service/               # Immutable Security Audit Logging
│       ├── app/
│       │   ├── main.py
│       │   ├── audit_logger/        # Tamper-Evident Ledger Logger
│       │   └── routes/
│       └── requirements.txt
│
├── ml/                              # Machine Learning Models & Pipelines
│   ├── fraud_detection/             # Anomaly Scoring & Pattern Recognition
│   ├── demand_forecasting/          # Time-Series Demand Forecasting
│   └── price_optimization/          # Vendor Pricing Analytics
│
├── messaging/                       # Apache Kafka Event Streaming
│   ├── kafka/
│   │   ├── producers/               # Invoice, Stock, & Payment Event Producers
│   │   ├── consumers/               # Fraud & Notification Event Consumers
│   │   └── topics/                  # Event Topic Definitions
│   └── events/                      # Shared Event Schemas
│
├── shared/                          # Cross-Service Libraries
│   ├── schemas/                     # Pydantic Base Data Models
│   ├── security/                    # JWT & AES-256 Encryption Utilities
│   └── constants/                   # Department & Role Definitions
│
├── infrastructure/                  # Deployment & Observability
│   ├── docker/                      # Container Definitions
│   ├── kubernetes/                  # Helm Charts & Manifests
│   └── monitoring/                  # Prometheus, Grafana, Loki Setup
│
├── docs/                            # Documentation
│   ├── architecture/                # HLD, LLD & Architecture Diagrams
│   └── api/                         # OpenAPI Specifications
│
├── .env.example                     # Environment Variables Template
├── docker-compose.yml               # Local Multi-Service Compose Setup
└── README.md                        # Master Project Documentation
```
