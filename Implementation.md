# Micro-Landlord Tenant Portal: MVP Implementation Guide

## 1. Product Philosophy: Radical Simplicity
This product is built for the individual owner managing a few flats (e.g., a Koramangala 2BHK or an Indiranagar PG), not a massive property management firm. 
* **In Scope:** Maintenance requests, announcements, document sharing (leases, rules), and role-based access.
* **Out of Scope (MVP):** Rent collection, accounting, background checks, lease generation.

---

## 2. Tech Stack Architecture
* **Frontend:** Next.js 14 (App Router) — Vercel deployment.
* **Backend API:** FastAPI (Python) — Async, type-safe, auto-documenting.
* **Database:** PostgreSQL (via Supabase or local Docker).
* **ORM:** SQLModel (combines SQLAlchemy + Pydantic).
* **Storage:** Cloudflare R2 (via `boto3` presigned URLs).
* **Auth:** Clerk (JWTs verified in FastAPI dependencies).
* **Transactional Comms:** Resend (Email).

---

## 3. Directory Structure
Keep domains isolated. This prevents spaghetti code as the app scales.

```text
app/
├── core/            # Config, DB connections, Security
├── dependencies/    # Auth, tenant isolation logic
├── models/          # SQLModel schemas
├── routers/         # API endpoints (auth, landlord, tenant)
└── services/        # Third-party integrations (R2, Resend)