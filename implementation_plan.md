# Micro-Landlord Tenant Portal — Final MVP Implementation Plan

> **Mantra:** Radical Simplicity.
> **In Scope:** Maintenance requests (5-state + priority), announcements, document sharing, role-based access (4 roles), rent/lease date counters with email reminders, invite system, empathetic UX.
> **Out of Scope:** Rent collection, payment gateways, accounting, background checks, lease generation.

---

## Design Decisions Summary (from /grill-me session)

| Decision | Choice |
|---|---|
| **Styling** | Tailwind CSS + shadcn/ui + next-themes |
| **Theme** | Dual (dark slate + warm amber; light off-white + amber). Animated toggle. WCAG-compliant. |
| **Roles** | `landlord` · `tenant` · `tenant_pending` · `unassigned` |
| **Onboarding** | Invite-token fast track OR landlord-email pending flow (approve/deny) |
| **Maintenance statuses** | `open` → `in_progress` → `resolved` → `closed` + tenant reopen (`resolved` → `open`) |
| **Priority** | `low` · `medium` · `high` · `urgent` (set by tenant, changeable by landlord) |
| **Images per request** | Up to 3 (JSON array of R2 object keys) |
| **Image serving** | Presigned GET URLs (private bucket, short TTL) |
| **User sync** | Auto-create on first API call (no Clerk webhooks for MVP) |
| **Scheduler** | APScheduler inside FastAPI (daily rent/lease reminder check) |
| **Backend deploy** | Railway (Docker-based) |
| **Frontend deploy** | Vercel |
| **Error UX** | Empathetic, conversational error messages — never show raw HTTP codes |
| **Property view** | Adaptive routing — single property: direct dashboard. Multi-property: spring-animated context switcher |
| **Email triggers** | Tenant email only on status changes AWAY from "open" (no redundant creation email) |

---
---

## Deliverable 1: The Scaffolding Blueprint

### 1.1 — Monorepo Root

```bash
# From c:\Users\arsal\Desktop\Codes\Rental
mkdir frontend backend
```

Final top-level layout:

```text
Rental/
├── frontend/          # Next.js 14 App Router
├── backend/           # FastAPI (Python)
├── docker-compose.yml # Local PostgreSQL
├── Implementation.md
└── documentation-tutor.md
```

---

### 1.2 — Next.js 14 Frontend Initialization

```bash
cd frontend
npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Post-init installs:

```bash
npm install @clerk/nextjs next-themes
npx -y shadcn@latest init
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

### 1.3 — Next.js Page Structure

```text
frontend/src/app/
├── layout.tsx                          # Root layout: <html>, <ClerkProvider>, <ThemeProvider>
├── page.tsx                            # Public landing page (marketing)
├── sign-in/[[...sign-in]]/page.tsx     # Clerk sign-in
├── sign-up/[[...sign-up]]/page.tsx     # Clerk sign-up
├── onboarding/page.tsx                 # Role selection (Landlord / Tenant)
├── join/[token]/page.tsx               # Invite token validation + tenant fast-track
│
├── (landlord)/                         # Route group — sidebar layout (desktop)
│   ├── layout.tsx                      # Sidebar nav + property context switcher
│   ├── dashboard/page.tsx              # Overview: properties, pending tenants, recent requests
│   ├── properties/page.tsx             # List properties
│   ├── properties/[id]/page.tsx        # Property detail (units, tenants, invites)
│   ├── requests/page.tsx               # All maintenance requests across properties
│   ├── requests/[id]/page.tsx          # Request detail + status update
│   ├── announcements/page.tsx          # Manage announcements
│   ├── documents/page.tsx              # Manage documents
│   └── settings/page.tsx               # Profile, invites management
│
└── (tenant)/                           # Route group — bottom tab bar (mobile-first)
    ├── layout.tsx                      # Bottom tab nav
    ├── dashboard/page.tsx              # Rent counter, lease counter, recent requests
    ├── requests/page.tsx               # My maintenance requests
    ├── requests/new/page.tsx           # Submit new request (up to 3 images)
    ├── requests/[id]/page.tsx          # Request detail (reopen option)
    ├── announcements/page.tsx          # View property announcements
    ├── documents/page.tsx              # View & download documents
    └── settings/page.tsx               # Profile
```

---

### 1.4 — FastAPI Backend Initialization

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**`backend/requirements.txt`**:

```text
fastapi[standard]==0.115.*
uvicorn[standard]==0.34.*
sqlmodel==0.0.22
asyncpg==0.30.*
alembic==1.14.*
python-jose[cryptography]==3.3.*
httpx==0.28.*
boto3==1.35.*
resend==2.5.*
python-dotenv==1.1.*
python-multipart==0.0.20
apscheduler==3.10.*
pydantic-settings==2.7.*
```

```bash
pip install -r requirements.txt
```

Backend directory structure:

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Pydantic BaseSettings
│   │   ├── database.py        # Async engine + session
│   │   └── security.py        # Clerk JWT verification
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py            # get_current_user, get_current_landlord, get_current_tenant_profile
│   ├── models/
│   │   ├── __init__.py        # Model registry
│   │   ├── user.py
│   │   ├── property.py
│   │   ├── unit.py
│   │   ├── tenant_profile.py
│   │   ├── maintenance_request.py
│   │   ├── announcement.py
│   │   ├── document.py
│   │   └── invite.py          # NEW: invite token model
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── onboarding.py      # NEW: role selection + invite validation
│   │   ├── landlord.py
│   │   ├── tenant.py
│   │   └── uploads.py
│   └── services/
│       ├── __init__.py
│       ├── storage.py         # R2 presigned URLs
│       ├── email.py           # Resend integration
│       └── scheduler.py       # NEW: APScheduler rent/lease reminders
├── alembic/
├── alembic.ini
├── requirements.txt
├── .env
└── Dockerfile
```

**`backend/.env`**:

```dotenv
DATABASE_URL=postgresql+asyncpg://landlord:landlord@localhost:5432/tenant_portal
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
CLERK_ISSUER=https://<your-clerk-domain>
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=tenant-portal
RESEND_API_KEY=re_xxx
```

---

### 1.5 — Docker Compose (Local PostgreSQL)

**`docker-compose.yml`** (project root):

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    container_name: tenant_portal_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: landlord
      POSTGRES_PASSWORD: landlord
      POSTGRES_DB: tenant_portal
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
```

---
---

## Deliverable 2: The Data Flow & Architecture Map

### 2.1 — Tenant Submits Maintenance Request (with up to 3 images)

```mermaid
sequenceDiagram
    participant T as Tenant (Next.js)
    participant C as Clerk
    participant F as FastAPI Backend
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2

    Note over T: Tenant fills form: title, description,<br/>priority, selects up to 3 images

    %% Auth
    T->>C: Get session JWT
    C-->>T: Signed JWT

    %% Upload images (repeat for each image, up to 3)
    loop For each image (1-3)
        T->>F: POST /api/v1/uploads/presigned-url<br/>Authorization: Bearer JWT<br/>{ filename, content_type }
        F->>F: Verify JWT via Clerk JWKS
        F->>R2: Generate presigned PUT URL<br/>(boto3, 1hr TTL)
        R2-->>F: presigned_url + object_key
        F-->>T: { presigned_url, object_key }
        T->>R2: PUT presigned_url<br/>Body: raw image bytes
        R2-->>T: 200 OK
    end

    %% Submit request with collected object_keys
    T->>F: POST /api/v1/maintenance-requests<br/>Authorization: Bearer JWT<br/>{ title, description, priority,<br/>unit_id, image_keys: [key1, key2, key3] }
    F->>F: Verify JWT
    F->>F: Depends: get_current_tenant_profile<br/>→ validate tenant owns unit_id
    F->>DB: INSERT MaintenanceRequest<br/>(status="open", image_keys=[...])
    DB-->>F: Created record
    F-->>T: 201 { id, status: "open" }

    %% Notify landlord (fire-and-forget)
    F->>F: Lookup landlord email<br/>(Property → Unit → Owner)
    F->>F: services/email.py → Resend API
    Note over F: "New maintenance request<br/>from Tenant X for Unit Y<br/>Priority: HIGH"
```

### 2.2 — Tenant Onboarding (Invite Token Path)

```mermaid
sequenceDiagram
    participant T as New User (Browser)
    participant C as Clerk
    participant F as FastAPI
    participant DB as PostgreSQL

    T->>T: Clicks invite link:<br/>/join/abc123xyz
    T->>C: Sign up via Clerk
    C-->>T: Signed JWT (new user)

    T->>F: POST /api/v1/onboarding/accept-invite<br/>Authorization: Bearer JWT<br/>{ token: "abc123xyz" }
    F->>F: Verify JWT → extract clerk_id
    F->>DB: SELECT Invite WHERE token="abc123xyz"<br/>AND status="pending" AND expires_at > now()
    DB-->>F: Invite { unit_id, created_by }

    alt Token valid
        F->>DB: INSERT User (clerk_id, role="tenant")
        F->>DB: INSERT TenantProfile (user_id, unit_id)
        F->>DB: UPDATE Invite SET status="accepted"
        F-->>T: 201 { role: "tenant", unit_id }
        Note over T: Redirect to /tenant/dashboard
    else Token invalid/expired
        F-->>T: 400 { message: "That link didn't<br/>seem to work..." }
        Note over T: Show empathetic error<br/>with retry options
    end
```

### 2.3 — Tenant Onboarding (Pending Path — no token)

```mermaid
sequenceDiagram
    participant T as New User (Browser)
    participant C as Clerk
    participant F as FastAPI
    participant DB as PostgreSQL
    participant E as Resend Email

    T->>C: Sign up via Clerk
    C-->>T: Signed JWT

    T->>T: Selects "I am a Tenant"<br/>Enters landlord's email

    T->>F: POST /api/v1/onboarding/request-access<br/>Authorization: Bearer JWT<br/>{ landlord_email: "owner@example.com" }
    F->>F: Verify JWT → extract clerk_id
    F->>DB: SELECT User WHERE email="owner@example.com"<br/>AND role="landlord"

    alt Landlord found
        F->>DB: INSERT User (clerk_id, role="tenant_pending",<br/>requested_landlord_id=landlord.id)
        F->>E: Send email to landlord:<br/>"A new tenant wants to join your portal"
        F-->>T: 202 { message: "Your request has<br/>been sent to your landlord" }
        Note over T: Show "Waiting for approval" screen
    else Landlord NOT found
        F-->>T: 400 { message: "We couldn't find a landlord<br/>with that email..." }
        Note over T: Show empathetic error with<br/>suggestions to check spelling<br/>or ask for invite link
    end
```

### Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **Presigned URLs (client upload)** | Image bytes never touch our server. FastAPI stays stateless & lightweight. |
| **Up to 3 images as JSON array** | Avoids a junction table. `image_keys: list[str]` in the model. Simpler than a separate `Image` table for MVP. |
| **JWT verified on every call** | Fully stateless. No session cookies on the backend. |
| **`get_current_tenant_profile` dependency** | Enforces data isolation — tenant can only act on their assigned unit. The "Invisible Firewall." |
| **Invite token in URL path** (`/join/[token]`) | Cleaner than query params. Next.js catches it as a dynamic segment. Server-side validation. |
| **Fire-and-forget emails** | `try/except` around Resend calls. Email failure never rolls back a DB transaction. |
| **Empathetic error messages** | Backend returns structured `{ message, suggestion }`. Frontend renders conversational copy. |

---
---

## Deliverable 3: MVP Execution Task List (Kanban Style)

> [!IMPORTANT]
> Tasks are strictly ordered — no task is blocked by a future task. Each task lists affected files and implementation logic.

---

### Phase 1: Environment & Foundation

#### Task 1.1 — Create Docker Compose for PostgreSQL
- **Files:** `docker-compose.yml`
- **Logic:** Define `postgres:16-alpine` with `tenant_portal` DB, persistent volume, port 5432.
- **Verify:** `docker compose up -d` → connect with psql or DBeaver.

#### Task 1.2 — Initialize Next.js 14 Frontend
- **Files:** `frontend/` (scaffold)
- **Logic:** `npx create-next-app@latest` with App Router, TypeScript, Tailwind, src dir.
- **Post-init:** Install `@clerk/nextjs`, `next-themes`. Run `npx shadcn@latest init`.
- **Verify:** `npm run dev` → localhost:3000 works.

#### Task 1.3 — Initialize FastAPI Backend
- **Files:** `backend/requirements.txt`, `backend/app/main.py`, all `__init__.py` files, `backend/.env`
- **Logic:** Create venv, install deps, write `main.py` stub with CORS and `/health` endpoint.
- **Verify:** `uvicorn app.main:app --reload` → `GET /health` returns `{"status": "ok"}`.

#### Task 1.4 — Configure CORS
- **Files:** `backend/app/main.py`
- **Logic:** Allow origin `http://localhost:3000`, credentials true, all methods/headers.
- **Verify:** Frontend `fetch("/health")` — no CORS error in browser console.

#### Task 1.5 — Create Backend Config Module
- **Files:** `backend/app/core/config.py`
- **Logic:** `pydantic-settings` `BaseSettings` loading all env vars. Singleton via `@lru_cache`.
- **Verify:** Import in Python shell → all values loaded from `.env`.

#### Task 1.6 — Create Async Database Engine
- **Files:** `backend/app/core/database.py`
- **Logic:** `create_async_engine` with asyncpg. `async_sessionmaker`. `get_session` async generator for `Depends()`.
- **Verify:** App starts without DB connection errors.

---

### Phase 2: Database Schema & ORM

#### Task 2.1 — Define `User` Model
- **Files:** `backend/app/models/user.py`
- **Fields:** `id` (UUID PK), `clerk_id` (unique, indexed), `email`, `full_name`, `role` (enum: `landlord`/`tenant`/`tenant_pending`/`unassigned`), `requested_landlord_id` (nullable FK → self, for pending tenants), `created_at`, `updated_at`.
- **Depends on:** Task 1.6.

#### Task 2.2 — Define `Property` Model
- **Files:** `backend/app/models/property.py`
- **Fields:** `id` (UUID), `owner_id` (FK → User), `name`, `address`, `city`, `created_at`.
- **Depends on:** Task 2.1.

#### Task 2.3 — Define `Unit` Model
- **Files:** `backend/app/models/unit.py`
- **Fields:** `id` (UUID), `property_id` (FK → Property), `unit_label` (e.g., "Flat 2A"), `rent_due_day` (int, 1–31, default 1), `created_at`.
- **Depends on:** Task 2.2.

#### Task 2.4 — Define `TenantProfile` Model
- **Files:** `backend/app/models/tenant_profile.py`
- **Fields:** `id` (UUID), `user_id` (FK → User, unique), `unit_id` (FK → Unit), `lease_start` (date), `lease_end` (date), `is_active` (bool), `created_at`.
- **Depends on:** Task 2.1, 2.3.

#### Task 2.5 — Define `MaintenanceRequest` Model
- **Files:** `backend/app/models/maintenance_request.py`
- **Fields:** `id` (UUID), `tenant_id` (FK → TenantProfile), `unit_id` (FK → Unit), `title`, `description`, `image_keys` (JSON array, up to 3 R2 object keys), `priority` (enum: `low`/`medium`/`high`/`urgent`), `status` (enum: `open`/`in_progress`/`resolved`/`closed`), `created_at`, `updated_at`.
- **Depends on:** Task 2.4.

#### Task 2.6 — Define `Announcement` Model
- **Files:** `backend/app/models/announcement.py`
- **Fields:** `id` (UUID), `property_id` (FK → Property), `author_id` (FK → User), `title`, `body`, `created_at`.
- **Depends on:** Task 2.2.

#### Task 2.7 — Define `Document` Model
- **Files:** `backend/app/models/document.py`
- **Fields:** `id` (UUID), `property_id` (FK → Property), `uploaded_by` (FK → User), `title`, `file_key` (R2 key), `file_type`, `created_at`.
- **Depends on:** Task 2.2.

#### Task 2.8 — Define `Invite` Model *(NEW)*
- **Files:** `backend/app/models/invite.py`
- **Fields:** `id` (UUID), `unit_id` (FK → Unit), `created_by` (FK → User, landlord), `token` (str, unique, indexed — UUID4), `status` (enum: `pending`/`accepted`/`expired`), `expires_at` (datetime), `created_at`.
- **Depends on:** Task 2.3.

#### Task 2.9 — Create Model Registry
- **Files:** `backend/app/models/__init__.py`
- **Logic:** Import all 8 models. Export `__all__`.

#### Task 2.10 — Initialize Alembic
- **Files:** `backend/alembic.ini`, `backend/alembic/env.py`
- **Logic:** `alembic init alembic`. Edit `env.py` for async engine + model imports.
- **Verify:** `alembic revision --autogenerate -m "initial schema"` succeeds.

#### Task 2.11 — Run Initial Migration
- **Files:** `backend/alembic/versions/<hash>_initial_schema.py`
- **Logic:** `alembic upgrade head`.
- **Verify:** Connect to DB → 8 tables exist with correct columns + FK constraints.

---

### Phase 3: Auth & Security (The Invisible Firewall)

#### Task 3.1 — Implement Clerk JWT Verification
- **Files:** `backend/app/core/security.py`
- **Logic:** Fetch JWKS from Clerk (cached with TTL via `httpx`). Write `verify_clerk_token(token)` using `python-jose` — validate `iss`, `exp`, `azp`. Return decoded payload.
- **Depends on:** Task 1.5.

#### Task 3.2 — Write `get_current_user` Dependency
- **Files:** `backend/app/dependencies/auth.py`
- **Logic:** Extract Bearer token → `verify_clerk_token()` → query DB for `User` by `clerk_id`. If not found → auto-create with `role=unassigned` (pre-onboarding state). Return `User`.
- **Depends on:** Task 3.1, 2.1.

#### Task 3.3 — Write `get_current_landlord` Dependency
- **Files:** `backend/app/dependencies/auth.py`
- **Logic:** Calls `get_current_user`. If `role != "landlord"` → `HTTPException(403)` with empathetic message.
- **Depends on:** Task 3.2.

#### Task 3.4 — Write `get_current_tenant_profile` Dependency
- **Files:** `backend/app/dependencies/auth.py`
- **Logic:** Calls `get_current_user`. If `role != "tenant"` → 403. Query `TenantProfile` where `user_id` + `is_active=True`. If not found → 404 with empathetic message. Return `TenantProfile`.
- **Depends on:** Task 3.2, 2.4.

#### Task 3.5 — Set Up Clerk in Next.js Frontend
- **Files:** `frontend/src/app/layout.tsx`, `frontend/src/middleware.ts`, `frontend/.env.local`
- **Logic:** Wrap root layout in `<ClerkProvider>` + `<ThemeProvider>`. Create `middleware.ts` with `clerkMiddleware()`. Define public routes: `/`, `/sign-in`, `/sign-up`, `/join/[token]`. Protected: `/(landlord)/**`, `/(tenant)/**`.
- **Depends on:** Task 1.2.

#### Task 3.6 — Create Authenticated API Fetch Utility
- **Files:** `frontend/src/lib/api.ts`
- **Logic:** `apiFetch(path, options)` — gets Clerk token, attaches Bearer header, prefixes `NEXT_PUBLIC_API_URL`. Handles 401/403 gracefully with empathetic redirects.
- **Depends on:** Task 3.5.

---

### Phase 4: Onboarding & Invite System *(NEW PHASE)*

#### Task 4.1 — Onboarding: Landlord Self-Registration
- **Files:** `backend/app/routers/onboarding.py`
- **Endpoint:** `POST /api/v1/onboarding/register-landlord`
- **Logic:** Depends `get_current_user`. If user already has a role (not `unassigned`) → reject. Set `role = "landlord"`. Return user.
- **Depends on:** Task 3.2.

#### Task 4.2 — Onboarding: Tenant Pending Request (no token)
- **Files:** `backend/app/routers/onboarding.py`
- **Endpoint:** `POST /api/v1/onboarding/request-access` — Body: `{ landlord_email }`.
- **Logic:** Look up landlord by email. If not found → 400 empathetic error. If found → set `role = "tenant_pending"`, set `requested_landlord_id`. Send email to landlord via Resend.
- **Depends on:** Task 3.2, 5.4 (email service — can stub initially).

#### Task 4.3 — Onboarding: Accept Invite Token
- **Files:** `backend/app/routers/onboarding.py`
- **Endpoint:** `POST /api/v1/onboarding/accept-invite` — Body: `{ token }`.
- **Logic:** Validate token (pending + not expired). Create/update user → `role = "tenant"`. Create `TenantProfile` linked to invite's `unit_id`. Mark invite as `accepted`. Return tenant profile.
- **Depends on:** Task 2.8, 3.2.

#### Task 4.4 — Landlord: Generate Invite
- **Files:** `backend/app/routers/landlord.py`
- **Endpoint:** `POST /api/v1/units/{unit_id}/invites` — Depends `get_current_landlord`.
- **Logic:** Validate unit ownership. Generate UUID4 token. Create `Invite` record (expires in 7 days). Return `{ token, invite_url }`.
- **Depends on:** Task 2.8, 3.3.

#### Task 4.5 — Landlord: Approve/Deny Pending Tenant
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:**
  - `POST /api/v1/pending-tenants/{user_id}/approve` — Body: `{ unit_id }`. Set `role = "tenant"`, create `TenantProfile`. Email tenant: "You've been approved!"
  - `POST /api/v1/pending-tenants/{user_id}/deny` — Set `role = "unassigned"`. Email tenant: empathetic denial with retry guidance.
  - `GET /api/v1/pending-tenants` — List all `tenant_pending` users linked to this landlord.
- **Depends on:** Task 3.3, 4.2.

#### Task 4.6 — Frontend: Onboarding Page
- **Files:** `frontend/src/app/onboarding/page.tsx`
- **Logic:** Role selection screen ("I'm a Landlord" / "I'm a Tenant"). Tenant path shows landlord email input. Calls appropriate onboarding endpoint. Redirects to correct dashboard on success. Shows empathetic errors on failure.
- **Depends on:** Task 3.6, 4.1, 4.2.

#### Task 4.7 — Frontend: Invite Join Page
- **Files:** `frontend/src/app/join/[token]/page.tsx`
- **Logic:** Server component extracts `token` from URL. After Clerk auth, calls `accept-invite` endpoint. On success → redirect to tenant dashboard. On failure → empathetic error with retry options.
- **Depends on:** Task 3.6, 4.3.

---

### Phase 5: Core Domain Logic (Landlord vs. Tenant)

#### Task 5.1 — Landlord: CRUD Properties
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:** `POST`, `GET` (list), `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` under `/api/v1/properties`.
- **Logic:** All depend on `get_current_landlord`. Ownership enforced: `WHERE owner_id == user.id`.
- **Depends on:** Task 3.3, 2.2.

#### Task 5.2 — Landlord: CRUD Units
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:** `POST`, `GET`, `PATCH`, `DELETE` under `/api/v1/properties/{prop_id}/units`.
- **Logic:** Validate property ownership before any unit operation. `rent_due_day` field included in create/update.
- **Depends on:** Task 5.1.

#### Task 5.3 — Tenant: Submit Maintenance Request
- **Files:** `backend/app/routers/tenant.py`
- **Endpoints:**
  - `POST /api/v1/maintenance-requests` — Body: `{ title, description, priority, unit_id, image_keys[] }`. Depends `get_current_tenant_profile`. Validates `unit_id == profile.unit_id`.
  - `GET /api/v1/maintenance-requests` — List tenant's own requests.
  - `GET /api/v1/maintenance-requests/{id}` — Detail (ownership check).
- **Email trigger:** On create → email landlord (fire-and-forget). **No email to tenant on creation.**
- **Depends on:** Task 3.4, 2.5.

#### Task 5.4 — Tenant: Reopen Maintenance Request
- **Files:** `backend/app/routers/tenant.py`
- **Endpoint:** `POST /api/v1/maintenance-requests/{id}/reopen`
- **Logic:** Only allowed when `status == "resolved"`. Sets status back to `"open"`. Emails landlord: "Tenant X reopened request Y."
- **Depends on:** Task 5.3.

#### Task 5.5 — Landlord: Manage Maintenance Requests
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:**
  - `GET /api/v1/properties/{prop_id}/maintenance-requests` — List all across property's units.
  - `PATCH /api/v1/maintenance-requests/{id}/status` — Body: `{ status }`. Validated transitions only.
  - `PATCH /api/v1/maintenance-requests/{id}/priority` — Landlord can change priority.
- **Email trigger:** On status change (away from "open") → email tenant with empathetic update.
- **Depends on:** Task 5.3, 5.1.

#### Task 5.6 — Landlord: CRUD Announcements
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:** `POST`, `GET`, `DELETE` under `/api/v1/properties/{prop_id}/announcements`.
- **Depends on:** Task 5.1, 2.6.

#### Task 5.7 — Tenant: View Announcements
- **Files:** `backend/app/routers/tenant.py`
- **Endpoint:** `GET /api/v1/announcements` — Returns announcements for tenant's property (via `profile.unit → property_id`).
- **Depends on:** Task 5.6, 3.4.

#### Task 5.8 — Register All Routers
- **Files:** `backend/app/main.py`
- **Logic:** `app.include_router()` for health, onboarding, landlord, tenant, uploads. All under `/api/v1` prefix.
- **Verify:** `GET /docs` shows all endpoints grouped in Swagger UI.
- **Depends on:** Task 5.1–5.7.

---

### Phase 6: Storage, Communications & Scheduling

#### Task 6.1 — Create R2 Client Service
- **Files:** `backend/app/services/storage.py`
- **Logic:** `boto3.client("s3", endpoint_url=R2_ENDPOINT_URL)`. Two functions:
  - `generate_presigned_upload_url(object_key, content_type, expires=3600)` → presigned PUT URL.
  - `generate_presigned_download_url(object_key, expires=3600)` → presigned GET URL.
- **Key format:** `maintenance/{request_id}/{uuid}.{ext}`, `documents/{property_id}/{uuid}.{ext}`.
- **Depends on:** Task 1.5.

#### Task 6.2 — Presigned URL Endpoint
- **Files:** `backend/app/routers/uploads.py`
- **Endpoint:** `POST /api/v1/uploads/presigned-url` — Body: `{ filename, content_type }`. Depends `get_current_user`. Returns `{ presigned_url, object_key }`.
- **Depends on:** Task 6.1, 3.2.

#### Task 6.3 — Image Download URL Endpoint
- **Files:** `backend/app/routers/uploads.py`
- **Endpoint:** `GET /api/v1/uploads/download-url?key=xxx` — Depends `get_current_user`. Returns `{ download_url }` (presigned GET, short TTL).
- **Depends on:** Task 6.1, 3.2.

#### Task 6.4 — Document Upload & Listing Endpoints
- **Files:** `backend/app/routers/landlord.py`
- **Endpoints:**
  - `POST /api/v1/properties/{prop_id}/documents` — Save metadata after R2 upload. Body: `{ title, file_key, file_type }`.
  - `GET /api/v1/properties/{prop_id}/documents` — List documents.
- **Depends on:** Task 6.2, 2.7, 5.1.

#### Task 6.5 — Tenant: View & Download Documents
- **Files:** `backend/app/routers/tenant.py`
- **Endpoints:**
  - `GET /api/v1/documents` — List documents for tenant's property.
  - `GET /api/v1/documents/{id}/download-url` — Presigned GET URL.
- **Depends on:** Task 6.4, 3.4.

#### Task 6.6 — Create Resend Email Service
- **Files:** `backend/app/services/email.py`
- **Logic:** Initialize `resend.api_key`. Empathetic HTML email templates (inline for MVP):
  - `send_maintenance_notification(landlord_email, tenant_name, unit_label, title, priority)`
  - `send_status_update(tenant_email, title, new_status)` — only for changes AWAY from "open"
  - `send_pending_tenant_notification(landlord_email, tenant_name, tenant_email)`
  - `send_approval_notification(tenant_email, property_name, unit_label)`
  - `send_denial_notification(tenant_email)` — empathetic with retry guidance
  - `send_rent_reminder(tenant_email, unit_label, days_until_due)`
  - `send_lease_expiry_reminder(tenant_email, unit_label, days_until_expiry)`
- **All calls wrapped in `try/except` — fire-and-forget.**
- **Depends on:** Task 1.5.

#### Task 6.7 — Wire Email Triggers to Endpoints
- **Files:** `backend/app/routers/tenant.py`, `backend/app/routers/landlord.py`, `backend/app/routers/onboarding.py`
- **Logic:** Add `send_*` calls at the appropriate points:
  - Maintenance creation → email landlord
  - Status change (not "open") → email tenant
  - Pending tenant request → email landlord
  - Approve/deny → email tenant
- **Depends on:** Task 6.6, 5.3, 5.5, 4.2, 4.5.

#### Task 6.8 — Create APScheduler Service
- **Files:** `backend/app/services/scheduler.py`
- **Logic:**
  1. Initialize `AsyncIOScheduler`.
  2. Daily job at 9:00 AM IST:
     - Query all active `TenantProfile` records with `lease_end` within 30 days → send lease expiry reminder.
     - Query all active `TenantProfile` → join `Unit` → check `rent_due_day`. If rent due in ≤ 5 days → send rent reminder.
  3. Start scheduler on FastAPI `lifespan` startup event.
- **Depends on:** Task 6.6, 2.4, 2.3.

#### Task 6.9 — Frontend: Image Upload Utility
- **Files:** `frontend/src/lib/upload.ts`
- **Logic:** `uploadFile(file: File)` → calls presigned-url endpoint → PUTs to R2 → returns `object_key`. `uploadFiles(files: File[])` handles up to 3 with `Promise.all`.
- **Depends on:** Task 3.6, 6.2.

---

### Phase 7: Frontend UI (Build Out)

> [!NOTE]
> Frontend page implementation tasks are listed here for completeness but can be parallelized. Each page uses shadcn/ui components, the dual theme system, and the `apiFetch` utility.

#### Task 7.1 — Design System Setup
- **Files:** `frontend/src/app/globals.css`, `frontend/tailwind.config.ts`
- **Logic:** Define CSS custom properties for the stepped dark slate palette and off-white light palette. Amber/gold accent tokens. Configure shadcn/ui theme. Set up Google Font (Inter or Outfit).

#### Task 7.2 — Root Layout + Theme Toggle
- **Files:** `frontend/src/app/layout.tsx`
- **Logic:** `<ClerkProvider>` → `<ThemeProvider>` → `<html>`. Animated theme toggle with CSS icon morphing. `forced-colors` media query support.

#### Task 7.3 — Public Landing Page
- **Files:** `frontend/src/app/page.tsx`
- **Logic:** Marketing page with hero section, feature highlights, CTA to sign up. No auth required.

#### Task 7.4 — Landlord Sidebar Layout
- **Files:** `frontend/src/app/(landlord)/layout.tsx`
- **Logic:** Fixed sidebar with nav links (Dashboard, Properties, Requests, Announcements, Documents, Settings). Adaptive property context switcher in header (hidden if 1 property, spring-animated dropdown if >1). `focus-visible` amber rings.

#### Task 7.5 — Tenant Bottom Tab Layout
- **Files:** `frontend/src/app/(tenant)/layout.tsx`
- **Logic:** Mobile-first bottom tab bar (Dashboard, Requests, Announcements, Documents, Settings). Smooth View Transition API on tab switch.

#### Task 7.6 — Landlord Dashboard Page
- **Files:** `frontend/src/app/(landlord)/dashboard/page.tsx`
- **Logic:** Overview cards: total properties, total units, open requests (by priority), pending tenant approvals. Recent activity feed.

#### Task 7.7 — Tenant Dashboard Page
- **Files:** `frontend/src/app/(tenant)/dashboard/page.tsx`
- **Logic:** Rent due countdown ("Rent due in X days"). Lease expiry countdown. Recent maintenance requests. Latest announcements.

#### Task 7.8 — Maintenance Request Form (Tenant)
- **Files:** `frontend/src/app/(tenant)/requests/new/page.tsx`
- **Logic:** Form: title, description, priority dropdown, image upload zone (drag & drop, up to 3). Uses `uploadFiles()` utility. Shows upload progress. Empathetic validation messages.

#### Task 7.9 — Maintenance Request List & Detail Pages
- **Files:** `frontend/src/app/(tenant)/requests/page.tsx`, `frontend/src/app/(tenant)/requests/[id]/page.tsx`, `frontend/src/app/(landlord)/requests/page.tsx`, `frontend/src/app/(landlord)/requests/[id]/page.tsx`
- **Logic:** List with status badges + priority indicators. Detail page shows images (presigned download URLs), status timeline, reopen button (tenant, when resolved), status update controls (landlord).

#### Task 7.10 — Remaining CRUD Pages
- **Files:** Properties, Announcements, Documents pages for both landlord and tenant route groups.
- **Logic:** Standard list/detail/create forms using shadcn/ui components. All use `apiFetch` utility.

---

## Verification Plan

### Automated Tests
1. **Backend health:** `curl http://localhost:8000/health` → `{"status": "ok"}`
2. **DB migration:** `alembic upgrade head` + `alembic downgrade base` — reversible
3. **JWT verification:** Unit test `verify_clerk_token()` with valid + expired JWTs
4. **Endpoint tests:** `httpx.AsyncClient` + FastAPI `TestClient` for each router
5. **Swagger UI:** All endpoints visible and documented at `/docs`
6. **Invite flow:** Generate invite → use token → tenant created with correct unit
7. **Pending flow:** Request access → landlord approves → tenant activated

### Manual Verification
1. **Full Clerk flow:** Sign up → onboarding → role assigned → correct dashboard rendered
2. **Invite token flow:** Landlord generates invite → share link → tenant clicks → auto-assigned
3. **Maintenance with images:** Submit request with 3 photos → images in R2 → presigned download renders them
4. **Email delivery:** Maintenance request → landlord gets Resend email. Status change → tenant gets email.
5. **Rent reminders:** Set `rent_due_day` to today + 3 → wait for scheduler → check email delivery
6. **Theme toggle:** Switch dark ↔ light → animations smooth, accessibility maintained
7. **Mobile UX:** Open tenant dashboard on phone-sized viewport → bottom tabs work correctly
