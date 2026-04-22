# Quickstart — Telemed Tracking คปสอ.สอง

## Prerequisites

- Node.js 24 LTS
- npm or pnpm
- Google account with access to target Google Spreadsheet
- Google Apps Script project (deployed as Web App, "Anyone can access")

## Frontend Setup

```bash
# Clone repository
git clone <repo-url>
cd telemed-tracking

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your GAS Web App URL:
# VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_ID/exec
# VITE_APP_URL=http://localhost:5173
# VITE_APP_NAME=Telemed Tracking คปสอ.สอง
# VITE_DASHBOARD_PATH=/dashboard

# Start dev server
npm run dev
# → http://localhost:5173
```

## Backend Setup (Google Apps Script)

```bash
# Option 1: Copy backend/Code.gs content into GAS editor
# 1. Open https://script.google.com
# 2. Create new project or open existing
# 3. Paste Code.gs content
# 4. Deploy → New deployment → Web app
#    - Execute as: Me
#    - Who has access: Anyone
# 5. Copy the Web App URL → paste into .env.local VITE_GAS_API_URL

# Option 2: Use clasp (if preferred)
npm install -g @google/clasp
clasp login
clasp clone <scriptId>
# Push changes: clasp push
```

## Google Sheets Setup

Create a Google Spreadsheet with these sheets (exact names):

1. **HOSPITAL** — Seed with facility data (hosp_code, hosp_name, hosp_type, active)
2. **USERS** — Empty, header only
3. **FACILITIES** — Seed with รพ.สต. details
4. **EQUIPMENT** — Empty, header only
5. **READINESS_LOG** — Empty, header only
6. **CLINIC_SCHEDULE** — Empty, header only
7. **MASTER_DRUGS** — Seed with initial drug list
8. **VISIT_SUMMARY** — Empty, header only
9. **VISIT_MEDS** — Empty, header only
10. **FOLLOWUP** — Empty, header only
11. **AUDIT_LOG** — Empty, header only
12. **SETTINGS** — Seed with default key-value rows

See `SCHEMA.md` for exact column headers and sample data.

## Key Development Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run type-check   # TypeScript strict mode check
```

## Architecture Overview

```
Browser (React SPA)
  ↕ HTTPS (Simple Request only — no CORS preflight)
Google Apps Script (Code.gs)
  ↕ Google Sheets API
Google Spreadsheet (12 sheets)
```

## Critical Rules for Development

1. **GAS CORS**: Never set `Content-Type: application/json` or custom headers. Use `gasGet`/`gasPost` from `services/api.ts` exclusively.
2. **Token Storage**: `sessionStorage` only. Never `localStorage` or cookies.
3. **Zod Validation**: Every GAS response must be validated before use. No raw `any`.
4. **Soft Delete**: Equipment → `status=inactive`. Master Drug → `active=N`. Never delete rows.
5. **Role Filtering**: `staff_hsc` sees only their `hosp_code`. Enforce in both frontend and GAS.
6. **Sensitive Fields**: `tel`, `hn` excluded from Module 5 responses. Only Module 6 returns them.
7. **VN**: Never generate VN — always from HosXP Excel import.
8. **Design System**: Follow DESIGN.md strictly. shadcn/ui + Tailwind only. No custom CSS.

## Module Routes

| Route | Module | Auth |
|-------|--------|------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | Public |
| `/module1` | Equipment Registry | All roles |
| `/module2` | Readiness Checklist | super_admin, admin_hosp |
| `/module3` | Clinic Schedule | All roles (create: admin+) |
| `/module4` | Import Patient Data | admin_hosp+ |
| `/module5` | Drug Confirmation | All roles |
| `/module6` | Case Follow-up | super_admin, admin_hosp |
| `/master-drugs` | Master Drug Mgmt | super_admin, admin_hosp |
| `/users` | User Management | super_admin, admin_hosp |
| `/settings` | System Settings | super_admin |
