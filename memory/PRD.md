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
properties, tenants, rent_payments, expenses, utility_payments, property_taxes, custom_reminders

## Completed
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
- [DONE 2026-02-25] Portfolio-level / General Business Expenses (property_id optional)
- [DONE 2026-02-25] Expense categories reduced to 3: Maintenance / Repairs / Professional Services
- [DONE 2026-02-25] Vacancy & Unrealized Loss — exact date intervals + daily-rate breakdown
- [DONE 2026-02-25] Status pill colored: Currently Occupied (green) / Currently Vacant (red)
- [DONE 2026-02-25] Charts switched from rolling 12mo → Indian Financial Year (Apr–Mar) dropdown selector
- [DONE 2026-02-25] Zoho-style chart layout: dropdown top-right + right-side KPI summary panel
- [DONE 2026-02-25] Custom Reminders: full CRUD + auto-merged into /api/reminders feed
- [DONE 2026-02-25] Business Overhead YTD card on dashboard (sums portfolio-level expenses for current Indian FY)

## Backlog (Prioritised)
- P1: CSV bulk import for Properties / Tenants / Expenses
- P2: Edit Expense dialog (only delete exists today)
- P2: Refactor server.py (>1200 lines) → routers + models split
- P2: Edit Custom Reminder dialog (currently only create + mark-done + delete)

## Critical Notes
- Timezone: Asia/Kolkata — DO NOT revert to UTC
- Indian FY: April → March (e.g. FY 2024–25 = Apr 2024 → Mar 2025)
- Total Expenses includes: direct expenses + paid utilities + paid taxes + net unrecovered dues from past tenants
- Business Overhead = expenses with empty property_id (portfolio-wide, not tied to any one property)
- Theme: navy #0F172A, gold #B89D5F, parchment #F4F4EF — strict adherence

## Test Credentials
None — single-user app, no auth implemented.
