# Implementation Plan: Telemed Tracking คปสอ.สอง — Full System

**Branch**: `001-telemed-tracking-spec` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-telemed-tracking-spec/spec.md`

## Summary

ระบบติดตามการดำเนินงาน Telemedicine สำหรับ สสอ.สอง ครอบคลุม รพ.สอง + รพ.สต. 15 แห่ง — 6 operational modules, Master Drug management, public Dashboard, user management, and system settings. React 19 + TypeScript frontend on Cloudflare Pages communicates with Google Apps Script backend via Simple Request pattern (no CORS preflight). Zustand manages auth/UI state; TanStack Query handles all async data. DESIGN.md mandates Apple-inspired visual system: black/#f5f5f7 alternating sections, SF Pro typography, single Apple Blue accent, dark glass navigation, and 8-tier responsive breakpoints.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `"strict": true`)
**Primary Dependencies**: React 19, React Router 7, shadcn/ui + Tailwind CSS 4, Zustand 5, TanStack Query 5, React Hook Form 7, Zod 3, SheetJS (xlsx) 0.18.x, date-fns 4, Lucide React
**Storage**: Google Sheets (12 sheets: HOSPITAL, USERS, FACILITIES, EQUIPMENT, READINESS_LOG, CLINIC_SCHEDULE, MASTER_DRUGS, VISIT_SUMMARY, VISIT_MEDS, FOLLOWUP, AUDIT_LOG, SETTINGS)
**Testing**: Vitest + React Testing Library v16 + service-layer mocking (unit/integration)
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge latest 2 versions) on desktop and mobile
**Project Type**: Web application (SPA) + Google Apps Script backend
**Performance Goals**: Excel parsing <5s for 100 rows, login <30s, full daily workflow <30 min for 20-30 patients
**Constraints**: GAS CORS Simple Request only (no `Content-Type: application/json`, no custom headers), sessionStorage for tokens only, no offline support, GAS V8 runtime
**Scale/Scope**: 16 facilities, ~20-30 patients/clinic day, 6 clinic types, 4 user roles, 12 routes, ~50 UI screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate (all PASS)

| # | Principle | Status | Evidence |
|---|-----------|--------|----------|
| I | GAS CORS Compliance | PASS | All requests route through `services/api.ts` (`gasGet`/`gasPost`). GET: token in query param. POST: token in body, no Content-Type header. No custom headers. |
| II | Strict TypeScript | PASS | `"strict": true` in tsconfig. All GAS responses validated with Zod schemas before consumption. Types in `src/types/`. No `any` without comment. |
| III | UI/UX Design System | PASS | shadcn/ui + Tailwind only. No custom CSS files. DESIGN.md defines color palette, typography, spacing. Apple Blue (#0071e3) sole accent. |
| IV | Data Integrity & Soft-Delete | PASS | Equipment: `status=inactive`. Master Drugs: `active=N`. VN never self-generated. `actual_count` computed, not stored. |
| V | RBAC & Data Security | PASS | Dual-layer: Frontend RoleGuard + GAS query filtering. `staff_hsc` sees own `hosp_code` only. Sensitive fields excluded from API responses per module. |
| VI | Service Layer Architecture | PASS | Components → Service → `gasGet`/`gasPost`. Zustand for client state only (no API calls in stores). GAS actions: `module.verb` convention. |

### Post-Design Re-Check (Phase 1)

All six principles upheld in data-model.md, contracts/, and project structure. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/001-telemed-tracking-spec/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — GAS API contracts
│   ├── auth.md
│   ├── users.md
│   ├── equipment.md
│   ├── readiness.md
│   ├── schedule.md
│   ├── master-drug.md
│   ├── import.md
│   ├── visit-summary.md
│   ├── visit-meds.md
│   ├── followup.md
│   ├── dashboard.md
│   └── settings.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── Code.gs                 # Google Apps Script (deploy separately via GAS editor)

src/
├── main.tsx                # App entry, React Router setup
├── App.tsx                 # Root component with providers
├── components/
│   ├── ui/                 # shadcn/ui components (managed by CLI only)
│   ├── layout/
│   │   ├── Sidebar.tsx             # Dark glass nav, collapsible
│   │   ├── Header.tsx              # App name, user info, breadcrumb
│   │   └── PageWrapper.tsx         # Content area with responsive container
│   └── common/
│       ├── StatusBadge.tsx         # Color-coded status indicators
│       ├── ConfirmModal.tsx        # Confirmation dialog
│       ├── LoadingSpinner.tsx      # Loading state
│       ├── RoleGuard.tsx           # Route-level role protection
│       ├── DataTable.tsx           # Reusable table with sort/filter/pagination
│       └── Toast.tsx               # Notification toasts
├── modules/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── useAuth.ts             # TanStack Query mutation hooks
│   ├── module1/
│   │   ├── EquipmentPage.tsx
│   │   ├── EquipmentForm.tsx
│   │   ├── EquipmentTable.tsx
│   │   └── useEquipment.ts
│   ├── module2/
│   │   ├── ReadinessPage.tsx
│   │   ├── ReadinessChecklist.tsx
│   │   ├── ReadinessHistory.tsx
│   │   └── useReadiness.ts
│   ├── module3/
│   │   ├── SchedulePage.tsx
│   │   ├── ScheduleGrid.tsx        # Weekly/monthly view
│   │   ├── ScheduleForm.tsx
│   │   ├── TelemedLinkInput.tsx
│   │   └── useSchedule.ts
│   ├── module4/
│   │   ├── ImportPage.tsx
│   │   ├── ExcelUploader.tsx
│   │   ├── PreviewTable.tsx
│   │   ├── ImportSummary.tsx
│   │   └── useImport.ts
│   ├── module5/
│   │   ├── DrugConfirmPage.tsx
│   │   ├── PatientList.tsx
│   │   ├── DrugConfirmationPanel.tsx
│   │   ├── DrugSourceSelector.tsx
│   │   └── useDrugConfirm.ts
│   ├── module6/
│   │   ├── FollowupPage.tsx
│   │   ├── FollowupList.tsx
│   │   ├── FollowupForm.tsx
│   │   ├── PatientContactCard.tsx
│   │   └── useFollowup.ts
│   ├── master-drugs/
│   │   ├── MasterDrugPage.tsx
│   │   ├── DrugTable.tsx
│   │   ├── DrugForm.tsx
│   │   ├── DrugImport.tsx
│   │   └── useMasterDrug.ts
│   ├── dashboard/
│   │   ├── DashboardPage.tsx       # Public, no auth required
│   │   ├── StatsCards.tsx
│   │   ├── EquipmentStatusGrid.tsx
│   │   ├── UpcomingAppointments.tsx
│   │   ├── AttendanceChart.tsx
│   │   ├── FollowupPipeline.tsx
│   │   └── useDashboard.ts
│   ├── users/
│   │   ├── UsersPage.tsx
│   │   ├── UserTable.tsx
│   │   ├── ApprovalForm.tsx
│   │   ├── RoleSelector.tsx
│   │   └── useUsers.ts
│   └── settings/
│       ├── SettingsPage.tsx
│       ├── TelegramSettings.tsx
│       └── useSettings.ts
├── stores/
│   ├── authStore.ts         # user, role, hosp_code, token (Zustand)
│   └── uiStore.ts           # sidebar collapsed state (Zustand)
├── hooks/
│   ├── useAuth.ts           # Auth mutation/query hooks
│   └── useRoleGuard.ts      # Role checking hook
├── services/
│   ├── api.ts               # gasGet/gasPost wrappers (CORS-safe)
│   ├── authService.ts
│   ├── equipmentService.ts
│   ├── readinessService.ts
│   ├── scheduleService.ts
│   ├── visitService.ts       # visitSummary + visitMeds actions
│   ├── drugService.ts        # masterDrug actions
│   ├── importService.ts      # import.preview + import.confirm
│   ├── followupService.ts
│   ├── usersService.ts
│   ├── settingsService.ts
│   └── dashboardService.ts
├── types/
│   ├── hospital.ts
│   ├── user.ts
│   ├── equipment.ts
│   ├── readiness.ts
│   ├── schedule.ts
│   ├── visit.ts              # VisitSummary, VisitMed, ClinicType, DrugSource
│   ├── drug.ts               # MasterDrug
│   ├── followup.ts
│   ├── auditLog.ts
│   ├── facility.ts
│   └── api.ts                # Generic GAS response wrapper types
├── utils/
│   ├── dateUtils.ts          # พ.ศ./ค.ศ. formatting with date-fns
│   ├── excelParser.ts        # SheetJS wrapper for HosXP Excel
│   └── roleGuard.ts          # Permission checking functions
├── constants/
│   ├── roles.ts              # Role enum + permission matrix
│   ├── clinicTypes.ts        # 6 clinic types with Thai labels
│   └── drugSources.ts        # Drug source values with Thai labels
└── router.tsx                # React Router route definitions with guards
```

**Structure Decision**: Single-project web application structure. Frontend is a Vite SPA in `src/`. GAS backend lives in `backend/Code.gs` and is deployed separately via GAS editor (no clasp). No monorepo tooling needed — the backend is a single file.

## State Management Architecture

### Zustand Stores (Client State Only)

```
authStore.ts
├── token: string | null          # From sessionStorage
├── user: { role, hosp_code, first_name, last_name } | null
├── isAuthenticated: boolean
├── setAuth(token, user)          # On login
├── clearAuth()                   # On logout / token expiry
└── hydrate()                     # Read from sessionStorage on app load

uiStore.ts
├── sidebarOpen: boolean          # Mobile sidebar toggle
├── toggleSidebar()
└── notifications: Notification[] # Toast queue
```

### TanStack Query (All Async State)

Each module's `use*.ts` hook file exports query and mutation hooks:

```
useEquipment.ts
├── useEquipmentList(filters)     → useQuery(['equipment', filters])
├── useEquipmentSave()            → useMutation + invalidateQueries
└── useEquipmentDelete()          → useMutation + invalidateQueries

useSchedule.ts
├── useScheduleList(filters)      → useQuery(['schedule', filters])
├── useScheduleSave()             → useMutation
├── useScheduleSetLink()          → useMutation
└── useScheduleRecordIncident()   → useMutation

useImport.ts
├── useImportPreview()            → useMutation (validates parsed Excel data)
└── useImportConfirm()            → useMutation (sends confirmed data to GAS)

useDrugConfirm.ts
├── useVisitSummaryList(filters)  → useQuery(['visitSummary', filters])
├── useVisitMedsList(vn)          → useQuery(['visitMeds', vn])
├── useVisitMedsSave()            → useMutation
└── useMarkAbsent()               → useMutation
```

**Query Key Strategy**: `['module', action, ...filterParams]` — enables precise cache invalidation per module.

**Cache Policy**:
- Stale time: 30 seconds (data is collaboratively edited)
- Refetch on window focus: enabled
- Retry: 1 attempt on failure (GAS may have brief latency)

## UI Component Hierarchy & DESIGN.md Mapping

### Layout System

```
App.tsx
├── <QueryClientProvider>
├── <BrowserRouter>
│   ├── <Routes>
│   │   ├── /login → LoginPage (no layout)
│   │   ├── /register → RegisterPage (no layout)
│   │   ├── /dashboard → DashboardPage (public, no sidebar)
│   │   └── <ProtectedRoute> (authenticated routes)
│   │       └── <AppLayout>
│   │           ├── <Sidebar> (dark glass, collapsible)
│   │           ├── <Header> (breadcrumb + user menu)
│   │           └── <PageWrapper> (content area)
│   │               ├── /module1 → EquipmentPage
│   │               ├── /module2 → ReadinessPage
│   │               ├── /module3 → SchedulePage
│   │               ├── /module4 → ImportPage
│   │               ├── /module5 → DrugConfirmPage
│   │               ├── /module6 → FollowupPage
│   │               ├── /master-drugs → MasterDrugPage
│   │               ├── /users → UsersPage
│   │               └── /settings → SettingsPage
```

### DESIGN.md Styling Mapping

**Navigation / Sidebar** (Constitution Principle III: Dark Glass)
- Background: `rgba(0, 0, 0, 0.8)` with `backdrop-filter: saturate(180%) blur(20px)`
- Text: `#ffffff` at 14px SF Pro Text
- Active item: Apple Blue underline + lighter background
- Mobile: Full-screen overlay on hamburger toggle
- 48px height on desktop, full-screen drawer on mobile

**Page Sections** (Constitution Principle III: Binary Rhythm)
- Primary pages: `#f5f5f7` background (light gray)
- Hero/Dashboard cards: Alternating black (`#000`) and `#f5f5f7` sections
- Cards: No borders, 8px border-radius, `rgba(0, 0, 0, 0.22) 3px 5px 30px` shadow

**Data Tables** (Module-specific)
- Header row: Bold 14px SF Pro Text, `#1d1d1f` on `#fafafc`
- Body: 17px SF Pro Text, `rgba(0, 0, 0, 0.8)`
- Row hover: `#fafafc` background
- Sort/filter buttons: 11px radius, 3px border `rgba(0,0,0,0.04)`

**Forms**
- Labels: 17px SF Pro Text weight 600, `#1d1d1f`
- Inputs: shadcn/ui Input with 8px radius, `#f5f5f7` background
- Validation errors: Red text below input
- Submit: Apple Blue (#0071e3) button, 8px radius, 8px 15px padding

**Status Badges** (Monochrome + Blue)
- Ready/Active: Apple Blue background, white text
- Pending/Warning: `#fafafc` background, `rgba(0,0,0,0.8)` text
- Inactive/Error: `#1d1d1f` background, white text
- All badges: 8px radius, 14px SF Pro Text weight 600

**Responsive Breakpoints** (from DESIGN.md Section 8)
- Mobile (<640px): Single column, stacked cards, hamburger nav
- Tablet (640-1024px): 2-column grids, compact sidebar
- Desktop (>1024px): Full layout, expanded sidebar, max-width 980px content

### Module-Specific UI Patterns

**Module 3 — Schedule Grid**:
- Weekly view: 7-column grid (Mon-Sun), rows = รพ.สต.
- Each cell shows clinic type badge + time + appoint_count/actual_count
- Click cell → detail modal with telemed link
- Mobile: Scrollable day-by-day list instead of grid

**Module 4 — Excel Import**:
- Drop zone with drag-and-drop + file picker
- Preview table with inline editing for clinic_type per patient
- Import summary card: "Success X / Error Y" with expandable error list
- Wizard-style flow: Upload → Preview → Confirm

**Module 5 — Drug Confirmation**:
- Patient list as cards (not table) for mobile-friendly layout
- Each card: Patient name, clinic type, status badge
- Expand card → drug list with edit/add/confirm buttons
- Drug source selector: 3-button toggle (hsc_stock / hosp_stock / hosp_pending)

**Module 6 — Follow-up**:
- Patient contact card with `tel:` link (green click-to-call on mobile)
- Drug list with `is_changed=Y` highlighted in Apple Blue
- `drug_source_pending=Y` flagged with amber warning
- Follow-up form: textarea fields for notes

## GAS Backend Architecture

### Entry Points

```javascript
doGet(e)   → parse e.parameter → validateSession(token) → routeAction(action, params, user)
doPost(e)  → JSON.parse(e.postData.contents) → validateSession(token) → routeAction(action, data, user)
```

### Router Pattern

```javascript
function routeAction(action, data, user) {
  const routes = {
    'auth.logout':       () => handleLogout(user),
    'users.list':        () => requireAdmin(user, () => listUsers(user, data)),
    'equipment.list':    () => listEquipment(user, data),
    'equipment.save':    () => saveEquipment(user, data),
    // ... all actions
  }
  const handler = routes[action]
  if (!handler) return buildResponse({ success: false, error: 'Unknown action' })
  return handler()
}
```

## Complexity Tracking

No violations. All six constitution principles are satisfied in the current design.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
