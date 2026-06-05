# 🏠 Homepost Tenant Portal

Homepost is a radically simple web-based property management portal designed for individual owners managing 1–5 properties. It is built for micro-landlords who want to handle maintenance requests, share documents, and seamlessly communicate with tenants without the bloat of enterprise property management software.

## 🏗 Architecture Overview

Homepost follows a modern decoupled Client-Server architecture:

- **Frontend (Client):** A responsive Single Page Application (SPA) built with Next.js 14 and React. It serves as the user interface for both landlords and tenants, communicating with the backend purely via REST API calls. Authentication is handled on the edge via Clerk middleware, ensuring secure routes.
- **Backend (API):** A high-performance, asynchronous REST API powered by FastAPI (Python). It acts as the central brain of the application, enforcing role-based access control (RBAC), executing business logic, and querying the database via SQLModel.
- **Data Layer:** A robust PostgreSQL database serving as the single source of truth for properties, units, users, and maintenance tickets.
- **Storage & Services:** Static assets (like lease PDFs and maintenance photos) bypass the backend entirely via presigned URLs, uploading directly from the client to Cloudflare R2 object storage. Background jobs run via an integrated APScheduler to dispatch automated email reminders via Resend.

## ✨ Features

- **Automated Onboarding:** Secure token-based invite system for tenants to join specific units automatically.
- **Maintenance Ticketing:** Tenants can submit requests with multiple photo attachments. Landlords can track status (`open` → `in_progress` → `resolved`), adjust priority, and append internal notes.
- **Document Hub:** Centralized file sharing for property-wide house rules or unit-specific lease agreements.
- **Property Announcements:** Landlords can broadcast announcements to all tenants residing in a specific property.
- **Automated Reminders:** A daily asynchronous job evaluates lease expirations and rent due dates, automatically dispatching proactive email reminders (5 days prior for rent, 30 days prior for leases).
- **Aggregated Dashboards:** Real-time data aggregation feeds a comprehensive Bento-grid dashboard for landlords, visualizing occupancy, pending tenant approvals, and urgent maintenance.

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 14 (App Router), React 18 |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Radix UI |
| **Backend API** | FastAPI (Python, Async), Uvicorn |
| **Database** | PostgreSQL 16 |
| **ORM & Validation** | SQLModel (SQLAlchemy + Pydantic) |
| **Authentication** | Clerk (JWT-based) |
| **File Storage** | Cloudflare R2 (S3-compatible) |
| **Transactional Email** | Resend |
| **Background Jobs** | APScheduler |

## ☁️ Infrastructure & Deployment

The application is engineered to be entirely cloud-native:

- **Frontend Deployment:** Hosted on Vercel for edge-optimized delivery and seamless Next.js integration.
- **Backend Deployment:** Containerized via Docker and deployed on Render/Railway.
- **File Transfers:** Direct-to-cloud uploads. The frontend requests a short-lived (1-hour) presigned URL from the FastAPI backend, allowing clients to securely upload media directly to Cloudflare R2 without bottlenecking the API server bandwidth.

## 📄 License

[MIT](LICENSE)
