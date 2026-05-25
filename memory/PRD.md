# PRD — Pattukottai Estates Property Management Dashboard

## Problem Statement
Property management dashboard for two townhouses in Pattukottai, Tamil Nadu, India.
Tracks: total cost, live appreciation, rental income, expenses, property tax, utilities.

## Core Requirements
- Single user access
- Manual entry + future CSV import
- Annual appreciation-rate based projection
- Advanced rental income tracking with tenant management + payment reminders
- Asia/Kolkata (IST) timezone for all date logic
- "Light Executive — Corporate Bank Dashboard" theme (Cormorant Garamond, navy/gold)

## Architecture
- Backend: FastAPI + Motor (MongoDB) at /app/backend/server.py
- Frontend: React + Shadcn UI + Recharts at /app/frontend/src/
- Email: Resend (key in backend/.env)

## DB Collections
properties, tenants, rent_payments, expenses, utility_payments, property_taxes

## Completed (chronological)
- [DONE] Dashboard scaffold (React + FastAPI + Mongo)
- [DONE] Resend email integration for pending reminders
- [DONE] Edit/Delete across all entities (AlertDialog)
- [DONE] Advanced tenant mgmt: security deposit, lease start, monthly rent history
- [DONE] Close Lease flow with net unrecovered dues vs deposit calc
- [DONE] IST timezone correction for date evaluation
- [DONE] Light Executive theme overhaul + Recharts analytics
- [DONE] Highest market sell offer tracking on property cards
- [DONE] One-click "Mark Paid" on dashboard reminders
- [DONE 2026-02-25] Pending Actions full-sentence fix (removed truncate, added break-words)
- [DONE 2026-02-25] Portfolio-level / General Business Expenses
  - Dialog label: "Property / Scope *"
  - Option: "General Business Expense (Not Tied to a Property)"
  - List badge: "Portfolio / General"
  - Backend already supported Optional[str] property_id; stats aggregate all expenses

## Backlog (Prioritised)
- P1: CSV bulk import for Properties / Tenants / Expenses
- P2: Refactor server.py (>850 lines) → routers + models split
- P2: Edit Expense dialog (only delete currently exists)

## Critical Notes
- Timezone: Asia/Kolkata — DO NOT revert to UTC
- Total Expenses includes: direct expenses + paid utilities + paid taxes + net unrecovered dues from past tenants
- Theme: navy #0F172A, gold #B89D5F, parchment #F4F4EF — strict adherence

## Test Credentials
None — single-user app, no auth implemented.
