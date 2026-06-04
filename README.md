# 🏠 Homepost Tenant Portal

A radically simple property management portal for individual owners managing 1–5 properties. Built for landlords who want to handle maintenance requests, share documents, and communicate with tenants — without the bloat of enterprise property management software.

## ✨ Features (MVP)

- **Maintenance Requests** — Tenants submit requests with up to 3 photos; landlords track and update status
- **Announcements** — Landlords post property-wide announcements
- **Document Sharing** — Upload and share lease PDFs, house rules, and other documents
- **Role-Based Access** — Landlord, Tenant, and invite-gated onboarding
- **Rent & Lease Counters** — Visual countdowns with automated email reminders
- **Email Notifications** — Status updates, approvals, and reminders via Resend

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python, Async) |
| Database | PostgreSQL 16 |
| ORM | SQLModel (SQLAlchemy + Pydantic) |
| Auth | Clerk (JWT) |
| Storage | Cloudflare R2 (presigned URLs) |
| Email | Resend |
| Deploy | Vercel (frontend) + Railway (backend) |

## 📁 Project Structure

```text
Rental/
├── frontend/              # Next.js 14 application
├── backend/               # FastAPI application
├── docker-compose.yml     # Local PostgreSQL
├── .github/workflows/     # CI/CD pipelines
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- Docker Desktop (for local PostgreSQL)
- A [Clerk](https://clerk.com) account
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket
- A [Resend](https://resend.com) account

### 1. Clone & Setup

```bash
git clone <repo-url>
cd Rental
```

### 2. Start the Database

```bash
docker compose up -d
```

### 3. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Edit with your credentials
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # Edit with your credentials
npm run dev
```

Frontend runs at `http://localhost:3000`.

## 📝 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_JWKS_URL` | Clerk JWKS endpoint for JWT verification |
| `CLERK_ISSUER` | Clerk issuer URL |
| `R2_ENDPOINT_URL` | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `RESEND_API_KEY` | Resend API key |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## 📄 License

[MIT](LICENSE)
