# Property Management Dashboard - PRD

## Original Problem Statement
User purchased 2 townhouses in India, Tamil Nadu, Pattukottai. Needs a dashboard that calculates total cost of property, live appreciation, rental income, management expenses, property tax, water and electricity payments, etc.

## User Choices
- Data Entry: Both manual and import options
- Appreciation: Rate-based (annual %)
- Rental: Advanced with tenant management + payment reminders
- Access: Single user

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React 19 + Shadcn UI + Phosphor Icons + Recharts
- **Design**: Organic & Earthy theme (Forest Green #2C4C3B + Terracotta #D96C4E + Warm Sand #F7F5F0)
- **Typography**: Work Sans (headings), Manrope (body), JetBrains Mono (code)

## Core Requirements (Static)
1. Property CRUD with appreciation calculation (compound annual rate)
2. Tenant management with payment status tracking
3. Expense tracking with categories (maintenance, repairs, insurance, other)
4. Utility payments (water, electricity) with due dates
5. Property tax records by year
6. Dashboard stats (total value, appreciation, rental income, net profit)
7. Payment reminders for overdue items
8. CSV export for tenants and expenses

## What's Been Implemented (2026-02)
- ✅ Full backend with all CRUD endpoints (23 tests passing)
- ✅ Dashboard with 4 stats cards (Property Value, Appreciation, Annual Rental, Net Profit)
- ✅ Property cards with live appreciation calculation
- ✅ Tenant management with payment status (paid/pending/overdue)
- ✅ Expense tracking with category color coding
- ✅ Utility payments with overdue detection
- ✅ Property tax tracking by year
- ✅ Payment reminders section (rent pending, overdue utilities, unpaid taxes)
- ✅ CSV export for expenses and tenants
- ✅ All Add dialogs with form validation
- ✅ Promise.allSettled error resilience
- ✅ Datetime timezone-naive/aware compatibility fix

## Prioritized Backlog

### P1 - Important Enhancements
- Replace native HTML date inputs with shadcn Calendar+Popover component
- Add charts (income vs expenses, monthly cash flow) using Recharts
- Edit functionality for properties, expenses, utilities
- CSV import for bulk data entry
- Property-level filtering on lists

### P2 - Nice to Have
- Email/SMS payment reminders (via SendGrid/Twilio)
- Document storage for receipts/contracts
- Profit/Loss statement PDF generation
- Multi-user access with role-based permissions
- Historical appreciation graph
- Rental yield calculator

## Test Credentials
No authentication required - single-user app.

## Next Action Items
1. Add charts for visual analytics (income vs expenses, cash flow)
2. Add edit functionality for existing records
3. Implement CSV import for bulk data entry
4. Consider adding automated payment reminder notifications via email
