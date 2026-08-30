# 🏠 Homepost — Modern Property Management Portal

> **Radically simple, high-performance property management designed for micro-landlords (1–5 properties).**  
> Manage maintenance requests, track leases, broadcast announcements, share documents, and streamline tenant onboarding without the complexity and bloat of enterprise property management suites.

---

## 🌟 Key Highlights

- ⚡ **Modern Full-Stack Architecture:** Next.js 16 (App Router), React 19, Tailwind CSS v4, FastAPI (Python async), and PostgreSQL 16.
- 🎭 **Interactive Zero-Auth Demo Mode:** One-click instant test-drive for Landlord and Resident roles with safe session isolation and pre-seeded demo portfolios.
- 🛠️ **End-to-End Maintenance Workflow:** Multi-photo uploads, real-time lifecycle tracking (`open` → `in_progress` → `resolved`), landlord internal notes, and event audit trails.
- 🔑 **Automated Tenant Onboarding & Access Requests:** Secure tokenized invite links, customizable lease dates, and automated access approvals/rejections.
- ☁️ **Direct-to-Cloud Uploads (Cloudflare R2):** High-speed direct uploads via short-lived presigned URLs with strict RBAC and storage quota enforcement—eliminating API bandwidth bottlenecks.
- ⏰ **Automated Notification Jobs:** Background cron jobs evaluate lease expirations (30-day notice) and rent due dates (5-day notice) via Resend.
- 🧪 **Enterprise Test Coverage:** Comprehensive testing suites spanning `pytest` (backend logic, security, RBAC), `Vitest` (frontend units/components), and `Playwright` (end-to-end user flows).

---

## 🏗️ Architecture & Technology Stack

Homepost is engineered with a decoupled, cloud-native architecture optimized for speed, reliability, and security:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (Next.js 16 / React 19)         │
│  - App Router & Server Components                      │
│  - Tailwind CSS v4 & Motion UI                         │
│  - Clerk Auth Middleware & Zero-Auth Demo Engine       │
└───────────────┬────────────────────────┬───────────────┘
                │ REST API (JSON)        │ Direct Upload (Presigned)
                ▼                        ▼
┌────────────────────────────────┐   ┌───────────────────────────┐
│     Backend (FastAPI / Async)  │   │   Cloudflare R2 Storage   │
│  - SQLModel (SQLAlchemy + Pyd) │   │  - Maintenance photos     │
│  - RBAC & Rate Limiting        │   │  - Lease documents & PDFs │
│  - Alembic Database Migrations │   └───────────────────────────┘
│  - APScheduler Cron Engine     │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│      PostgreSQL 16 Database    │
│  - Relational Schema & Indices │
│  - Idempotent Seed Automation  │
└────────────────────────────────┘
```

### Stack Breakdown

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), TypeScript, [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), Lucide Icons, Sonner Toast |
| **Authentication** | [Clerk](https://clerk.com/) (Edge JWT verification) + Zero-Auth Demo Mode Provider |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+, Async), Uvicorn, Pydantic Settings, SlowAPI Rate Limiter |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/), [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy 2.0 Core), [Alembic](https://alembic.sqlalchemy.org/) migrations |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible API presigned uploads via `boto3`) |
| **Email & Jobs** | [Resend](https://resend.com/) transactional email, [APScheduler](https://apscheduler.readthedocs.io/) async scheduler |
| **Testing** | [pytest](https://docs.pytest.org/) & `pytest-asyncio`, [Vitest](https://vitest.dev/) & Testing Library, [Playwright](https://playwright.dev/) (E2E) |
| **Containerization** | Docker, Docker Compose |

---

## ✨ Core Features & Workflows

### 🎭 Instant Zero-Auth Demo Mode
- **Zero-Friction Evaluation:** Experience the application as either a **Landlord** (`Marcus Vance`) or a **Resident** (`Sarah Jenkins`) with a single click—no signup or credit card required.
- **Isolated Demo State:** Utilizes secure client-side demo tokens and scoped storage without risking production or user data. Clean exit handlers prevent session leakage.

### 🏢 Property & Unit Portfolio Management
- Multi-property and unit tracking with real-time occupancy metrics.
- Comprehensive bento-grid dashboard highlighting pending access requests, open work orders, and financial summaries.

### 🔑 Tenant Onboarding & Access Requests
- **Tokenized Invites:** Generate secure, expiring invite links assigned to specific units with pre-filled lease terms.
- **Access Approval Workflow:** Landlords can review, accept, or reject incoming resident link requests with automatic profile activation.

### 🛠️ Maintenance Request Lifecycle
- **Tenant Submission:** Submit issues with description, urgency level (`low`, `medium`, `high`, `emergency`), and multi-photo uploads.
- **Landlord Operations:** Update ticket status (`open` → `in_progress` → `resolved`), assign priority, write internal notes, and track the full audit history.

### 📁 Document Hub & Broadcast Announcements
- **Shared Hub:** Upload and categorize property-wide house rules and unit-specific lease agreements.
- **Broadcast System:** Send announcements to all units across a property or target individual units with attachment support.

---

## 📂 Codebase Directory Structure

```
Rental/
├── backend/
│   ├── alembic/                 # Database migration scripts
│   ├── app/
│   │   ├── core/                # Config, database engine, security, rate limiting
│   │   ├── dependencies/        # Auth verification, RBAC, DB session injectors
│   │   ├── models/              # SQLModel schema definitions
│   │   ├── routers/             # API routes (landlord, tenant, onboarding, uploads, health)
│   │   ├── schemas/             # Pydantic validation & transfer schemas
│   │   └── services/            # Storage (R2), email (Resend), scheduler services
│   ├── tests/                   # Pytest test suite (unit, RBAC, security, lifecycle)
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # CLI database seeder
│   └── Dockerfile               # Backend production container
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (landlord, tenant, join, sync-role)
│   │   ├── components/          # Reusable UI & shadcn components
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # API client, Clerk mock auth, Demo mode utilities
│   ├── tests/                   # Vitest component & unit tests
│   ├── e2e/                     # Playwright end-to-end tests
│   └── package.json             # Frontend dependencies & scripts
├── docs/                        # Architecture guides & specifications
├── docker-compose.yml           # Local PostgreSQL service
└── README.md
```

---

## 🧪 Testing Suites

Homepost includes comprehensive automated testing across all layers:

### Backend Tests (`pytest`)
Runs unit, integration, RBAC, rate-limiting, and security verification tests:
```bash
cd backend
pytest -v
```

To run a specific test suite:
```bash
pytest tests/test_landlord.py -v
pytest tests/test_tenant.py -v
pytest tests/test_uploads_rbac_quota.py -v
```

### Frontend Unit & Component Tests (`Vitest`)
Runs component unit tests and utility assertions:
```bash
cd frontend
npm test
```

### End-to-End Tests (`Playwright`)
Executes full browser automation and end-to-end user journeys:
```bash
cd frontend
# Run all E2E tests headlessly
npm run test:e2e

# Run with interactive UI mode
npx playwright test --ui
```

---

## 🗄️ Database Migrations (Alembic)

When modifying SQLModel entities in `backend/app/models/`:

```bash
cd backend

# Generate a new migration revision
alembic revision --autogenerate -m "describe changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## 🐳 Production Deployment & Cloud Hosting

- **Frontend:** Optimized for zero-config deployment on [Vercel](https://vercel.com/) with Edge route protection.
- **Backend:** Containerized with multi-stage Docker build ready for [Render](https://render.com/), [Railway](https://railway.app/), or any Kubernetes cluster.
- **Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) S3-compatible zero-egress bucket.
- **Database:** Managed [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or AWS RDS PostgreSQL.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).
