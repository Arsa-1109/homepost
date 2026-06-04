# Micro-Landlord Tenant Portal — Task Tracker

## Phase 1: Environment & Foundation
- [x] 1.1 — Create Docker Compose for PostgreSQL
- [x] 1.2 — Initialize Next.js 14 Frontend
- [x] 1.3 — Initialize FastAPI Backend
- [x] 1.4 — Configure CORS
- [x] 1.5 — Create Backend Config Module
- [x] 1.6 — Create Async Database Engine

## Phase 2: Database Schema & ORM
- [x] 2.1 — Define `User` Model
- [x] 2.2 — Define `Property` Model
- [x] 2.3 — Define `Unit` Model
- [x] 2.4 — Define `TenantProfile` Model
- [x] 2.5 — Define `MaintenanceRequest` Model
- [x] 2.6 — Define `Announcement` Model
- [x] 2.7 — Define `Document` Model
- [x] 2.8 — Define `Invite` Model
- [x] 2.9 — Create Model Registry
- [x] 2.10 — Initialize Alembic
- [x] 2.11 — Run Initial Migration

## Phase 3: Auth & Security
- [x] 3.1 — Implement Clerk JWT Verification
- [x] 3.2 — Write `get_current_user` Dependency
- [x] 3.3 — Write `get_current_landlord` Dependency
- [x] 3.4 — Write `get_current_tenant_profile` Dependency
- [x] 3.5 — Set Up Clerk in Next.js Frontend
- [x] 3.6 — Create Authenticated API Fetch Utility

## Phase 4: Onboarding & Invite System
- [x] 4.1 — Onboarding: Landlord Self-Registration
- [x] 4.2 — Onboarding: Tenant Pending Request
- [x] 4.3 — Onboarding: Accept Invite Token
- [x] 4.4 — Landlord: Generate Invite
- [x] 4.5 — Landlord: Approve/Deny Pending Tenant
- [x] 4.6 — Frontend: Onboarding Page
- [x] 4.7 — Frontend: Invite Join Page

## Phase 5: Core Domain Logic
- [x] 5.1 — Landlord: CRUD Properties
- [x] 5.2 — Landlord: CRUD Units
- [x] 5.3 — Tenant: Submit Maintenance Request
- [x] 5.4 — Tenant: Reopen Maintenance Request
- [x] 5.5 — Landlord: Manage Maintenance Requests
- [x] 5.6 — Landlord: CRUD Announcements
- [x] 5.7 — Tenant: View Announcements
- [x] 5.8 — Register All Routers

## Phase 6: Storage, Communications & Scheduling
- [x] 6.1 — Create R2 Client Service
- [x] 6.2 — Presigned URL Endpoint
- [x] 6.3 — Image Download URL Endpoint
- [x] 6.4 — Document Upload & Listing Endpoints
- [x] 6.5 — Tenant: View & Download Documents
- [x] 6.6 — Create Resend Email Service
- [x] 6.7 — Wire Email Triggers to Endpoints
- [x] 6.8 — Create APScheduler Service
- [x] 6.9 — Frontend: Image Upload Utility

## Phase 7: Frontend UI
- [x] 7.1 — Design System Setup
- [x] 7.2 — Root Layout + Theme Toggle
- [x] 7.3 — Public Landing Page
- [x] 7.4 — Landlord Sidebar Layout
- [x] 7.5 — Tenant Bottom Tab Layout
- [x] 7.6 — Landlord Dashboard Page
- [x] 7.7 — Tenant Dashboard Page
- [x] 7.8 — Maintenance Request Form (Tenant)
- [x] 7.9 — Maintenance Request List & Detail Pages
- [x] 7.10 — Remaining CRUD Pages
