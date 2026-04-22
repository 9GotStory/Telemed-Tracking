# Tasks: Telemed Tracking คปสอ.สอง — Full System

**Input**: Design documents from `/specs/001-telemed-tracking-spec/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted per template guidance.

**Organization**: Tasks grouped by user story priority. US1 (P1) is the MVP — full daily operational workflow. Each phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Scaffold the React + TypeScript project with all declared dependencies and configuration

- [x] T001 Initialize Vite 8 + React 19 + TypeScript 5 (strict) project with `npm create vite@latest` in repo root
- [x] T002 Install dependencies: react-router-dom@7, zustand@5, @tanstack/react-query@5, react-hook-form@7, @hookform/resolvers, zod@3, xlsx@0.18, date-fns@4, lucide-react in `package.json`
- [x] T003 [P] Install dev dependencies: tailwindcss@4, @tailwindcss/vite, postcss, autoprefixer in `package.json`
- [x] T004 [P] Configure TypeScript strict mode in `tsconfig.json` with path alias `@` → `src/`
- [x] T005 Configure Tailwind CSS 4 with Vite plugin in `vite.config.ts` — add system font stack (SF Pro / Segoe UI / Roboto / Noto Sans Thai / Sarabun) per research.md R3
- [x] T006 [P] Configure Tailwind theme extensions in CSS: Apple Blue (#0071e3), dark surface tokens (#272729-#2a2a2d), DESIGN.md typography scale, border-radius scale, shadow tokens
- [x] T007 [P] Initialize shadcn/ui with `npx shadcn@latest init` — configure components.json pointing to `src/components/ui/`, Tailwind CSS mode
- [x] T008 [P] Install shadcn/ui components: Button, Input, Label, Dialog, Select, Table, Card, Badge, Toast, Sheet, Dropdown Menu, Tabs, Separator, Tooltip, Textarea, Checkbox in `src/components/ui/`
- [x] T009 [P] Create `.env.example` with VITE_GAS_API_URL, VITE_APP_URL, VITE_APP_NAME, VITE_DASHBOARD_PATH per SPEC.md Section 10
- [x] T010 Create directory structure matching plan.md Project Structure: `src/{components/{layout,common},modules/{auth,module1..6,master-drugs,dashboard,users,settings},stores,hooks,services,types,utils,constants}` and `backend/`

**Checkpoint**: Project builds with `npm run dev` — blank Vite + React app running on localhost:5173

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story module work begins

**⚠️ CRITICAL**: No module work can begin until this phase is complete

### TypeScript Types

- [x] T011 [P] Create Hospital type in `src/types/hospital.ts` — interface Hospital with hosp_code, hosp_name, hosp_type, active per SCHEMA.md
- [x] T012 [P] Create User types in `src/types/user.ts` — UserRole union, UserStatus union, User interface per SCHEMA.md
- [x] T013 [P] Create Equipment types in `src/types/equipment.ts` — EquipSetType, EquipStatus unions, Equipment interface per SCHEMA.md
- [x] T014 [P] Create Visit types in `src/types/visit.ts` — ClinicType, DiffStatus, DrugSource, MedStatus unions; VisitSummary, VisitMed interfaces per SCHEMA.md
- [x] T015 [P] Create Drug type in `src/types/drug.ts` — MasterDrug interface per SCHEMA.md
- [x] T016 [P] Create Schedule type in `src/types/schedule.ts` — ClinicSchedule interface with optional actual_count per SCHEMA.md
- [x] T017 [P] Create Readiness types in `src/types/readiness.ts` — OverallStatus union, ReadinessLog interface per SCHEMA.md
- [x] T018 [P] Create Followup type in `src/types/followup.ts` — Followup interface per SCHEMA.md
- [x] T019 [P] Create AuditLog type in `src/types/auditLog.ts` — AuditAction union, AuditLog interface per SCHEMA.md
- [x] T020 [P] Create Facility type in `src/types/facility.ts` — Facility interface per SCHEMA.md
- [x] T021 [P] Create API response types in `src/types/api.ts` — generic GasResponse<T> wrapper { success, data, error }, LoginResponse type

### Constants

- [x] T022 [P] Create role constants and permission matrix in `src/constants/roles.ts` — ROLE_PERMISSIONS mapping each role to allowed actions per SPEC.md Section 3 Role Permissions Matrix
- [x] T023 [P] Create clinic type constants in `src/constants/clinicTypes.ts` — CLINIC_TYPES array with value + Thai label for all 6 types per SPEC.md Section 4 Module 3
- [x] T024 [P] Create drug source constants in `src/constants/drugSources.ts` — DRUG_SOURCES array with value + Thai label for hsc_stock, hosp_stock, hosp_pending per SPEC.md Section 4 Module 5

### Core Services & Utilities

- [x] T025 Create GAS fetch wrapper in `src/services/api.ts` — gasGet<T> (query params, no headers) and gasPost<T> (body JSON, no Content-Type) per CLAUDE.md GAS Communication Pattern. Read VITE_GAS_API_URL from env, getToken() from sessionStorage. Throw on !json.success. Return type is unknown — callers validate with Zod
- [x] T026 [P] Create date utilities in `src/utils/dateUtils.ts` — buddhistToISO (DD/MM/YYYY พ.ศ. → ISO), formatBuddhist (ISO → พ.ศ. display), formatDate (ISO → readable Thai format) using date-fns per research.md R6
- [x] T027 [P] Create role guard utilities in `src/utils/roleGuard.ts` — canAccess(hosp_code, user), canManage(targetRole, userRole), isModuleAllowed(module, role) functions per SPEC.md Role Permissions Matrix
- [x] T028 [P] Create Excel parser utility in `src/utils/excelParser.ts` — SheetJS wrapper: parseHosXPExport(arrayBuffer) → validates column headers, groups by VN, returns structured data per SPEC.md Section 6

### State Management

- [x] T029 Create auth store in `src/stores/authStore.ts` — Zustand store: token (from sessionStorage), user (role, hosp_code, first_name, last_name), isAuthenticated, setAuth(), clearAuth(), hydrate() per plan.md State Management Architecture
- [x] T030 Create UI store in `src/stores/uiStore.ts` — Zustand store: sidebarOpen, toggleSidebar(), toasts queue per plan.md State Management Architecture

### Layout & Common Components

- [x] T031 Create app entry in `src/main.tsx` — React 19 createRoot, BrowserRouter, QueryClientProvider (staleTime: 30s, retry: 1), App component
- [x] T032 Create Sidebar in `src/components/layout/Sidebar.tsx` — Dark glass nav (rgba(0,0,0,0.8) + backdrop-filter blur), module links with Lucide icons, collapsible on mobile via Sheet, active state Apple Blue underline, role-based link visibility per DESIGN.md
- [x] T033 Create Header in `src/components/layout/Header.tsx` — App name from env, user dropdown (name + role badge), logout button, breadcrumb from route
- [x] T034 Create PageWrapper in `src/components/layout/PageWrapper.tsx` — Responsive container (max-w-[980px] centered), #f5f5f7 background, padding per DESIGN.md spacing
- [x] T035 [P] Create StatusBadge in `src/components/common/StatusBadge.tsx` — Variant-based badge: active/ready (Apple Blue bg), pending/warning (#fafafc bg), inactive/error (#1d1d1f bg), 8px radius, 14px weight 600 per DESIGN.md
- [x] T036 [P] Create ConfirmModal in `src/components/common/ConfirmModal.tsx` — shadcn Dialog wrapper with title, description, confirm/cancel buttons (Apple Blue + dark variant) per DESIGN.md
- [x] T037 [P] Create LoadingSpinner in `src/components/common/LoadingSpinner.tsx` — Centered spinner component with optional text
- [x] T038 Create RoleGuard component in `src/components/common/RoleGuard.tsx` — Accepts allowedRoles prop, checks authStore, redirects to /login if not authenticated, shows nothing if role insufficient
- [x] T039 Create DataTable in `src/components/common/DataTable.tsx` — Generic table with sort headers, optional pagination, filter controls (11px radius buttons), responsive stacked view on mobile per DESIGN.md Data Tables pattern

### Router

- [x] T040 Create React Router config in `src/router.tsx` — All 12 routes: /login, /register (public), /dashboard (public), /module1-6, /master-drugs, /users, /settings (protected). ProtectedRoute wrapper using RoleGuard per plan.md Layout System. AppLayout wrapping Sidebar+Header+PageWrapper for protected routes

**Checkpoint**: Foundation ready — blank app renders with sidebar, header, routing works, all types and constants available, api.ts and stores functional. `npm run build` passes with no type errors.

---

## Phase 3: Auth — Login & Register (Prerequisite for All Stories)

**Purpose**: Authentication system required before any module can be used

**Independent Test**: Register a new user → login → see dashboard redirect → logout → session cleared

- [x] T041 Create Zod schemas for auth in `src/services/authService.ts` — loginSchema (hosp_code 5 chars, password min 8), registerSchema (hosp_code, password, first_name, last_name, tel 9-10 digits) per contracts/auth.md
- [x] T042 Add auth GAS actions in `src/services/authService.ts` — login(payload), register(payload), logout() functions calling gasPost with Zod-validated responses per contracts/auth.md
- [x] T043 Create auth hooks in `src/hooks/useAuth.ts` — useLogin() (mutation → setAuth on success), useRegister() (mutation), useLogout() (mutation → clearAuth + redirect) per plan.md TanStack Query hooks
- [x] T044 Create Login page in `src/modules/auth/LoginPage.tsx` — Form with hosp_code + password inputs, submit calls useLogin, error display per DESIGN.md Forms spec, link to Register. Full-page layout (no sidebar), centered card
- [x] T045 Create Register page in `src/modules/auth/RegisterPage.tsx` — Form with hosp_code, password, first_name, last_name, tel inputs, submit calls useRegister, Zod validation inline, success message "Awaiting approval", link back to Login
- [x] T046 Implement session management — On app load (main.tsx): call authStore.hydrate() to restore from sessionStorage. Add global error handler: if any GAS call returns "Unauthorized", call clearAuth() and redirect to /login
- [x] T047 Implement GAS auth handlers in `backend/Code.gs` — doGet/doPost entry points, validateSession(token), routeAction router, hashPassword/verifyPassword (iterated HMAC-SHA256 per research.md R1), buildResponse helper per CLAUDE.md GAS Pattern

**Checkpoint**: User can register (status=pending), login (after manual DB activation), see authenticated routes, logout clears session. GAS backend handles auth.login, auth.register, auth.logout.

---

## Phase 4: US4 - Equipment Registry (Priority: P2) 🎯 Simplest Standalone Module

**Goal**: Any user can register telemed equipment and track its status at their facility

**Independent Test**: Login as staff_hsc → add Set A equipment → edit OS field → soft-delete → verify inactive equipment hidden from list

- [x] T048 [US4] Create equipment Zod schemas in `src/services/equipmentService.ts` — EquipmentSchema for form validation, EquipmentListResponseSchema for API response per contracts/equipment.md
- [x] T049 [US4] Add equipment GAS actions in `src/services/equipmentService.ts` — list(filters), save(data), delete(equipId) functions per contracts/equipment.md
- [x] T050 [US4] Create equipment hooks in `src/modules/module1/useEquipment.ts` — useEquipmentList(filters), useEquipmentSave(), useEquipmentDelete() with cache invalidation per plan.md TanStack Query hooks
- [x] T051 [P] [US4] Create EquipmentForm in `src/modules/module1/EquipmentForm.tsx` — React Hook Form + Zod: set_type (A/B toggle), device_type, OS, status, is_backup, software checkboxes, internet_mbps, responsible_person/tel, note per DESIGN.md Forms spec
- [x] T052 [P] [US4] Create EquipmentTable in `src/modules/module1/EquipmentTable.tsx` — DataTable showing equip list: hosp_name, set_type badge, device_type, status (StatusBadge), OS, actions (edit/delete). staff_hsc sees only their hosp_code per DESIGN.md Data Tables
- [x] T053 [US4] Create EquipmentPage in `src/modules/module1/EquipmentPage.tsx` — Page with header "ทะเบียนอุปกรณ์", filter by hosp_code (admin+) / status, EquipmentTable, FAB/button to open EquipmentForm dialog, soft-delete with ConfirmModal
- [x] T054 [US4] Implement GAS equipment handlers in `backend/Code.gs` — equipment.list (role-filtered, JOIN FACILITIES for hosp_name), equipment.save (generate UUID, validate hosp_code ownership), equipment.delete (set status=inactive, AUDIT_LOG) per contracts/equipment.md

**Checkpoint**: Module 1 fully functional. Can add/edit/soft-delete equipment. Role-based visibility works. GAS backend handles all equipment actions.

---

## Phase 5: US3 - Master Drug Management (Priority: P2)

**Goal**: Admin can manage the drug catalog used by Module 4 and Module 5

**Independent Test**: Login as admin_hosp → add new drug → edit strength → soft-delete → verify FK protection when drug is referenced in VISIT_MEDS

- [x] T055 [US3] Create drug Zod schemas in `src/services/drugService.ts` — MasterDrugSchema, DrugListResponseSchema per contracts/master-drug.md
- [x] T056 [US3] Add drug GAS actions in `src/services/drugService.ts` — list(filters), save(data), delete(drugId), importExcel(drugs[]) functions per contracts/master-drug.md
- [x] T057 [US3] Create drug hooks in `src/modules/master-drugs/useMasterDrug.ts` — useDrugList(filters), useDrugSave(), useDrugDelete(), useDrugImport() with cache invalidation
- [x] T058 [US3] Create DrugForm in `src/modules/master-drugs/DrugForm.tsx` — React Hook Form + Zod: drug_name, strength, unit fields. Show warning if drug_name change blocked (referenced in VISIT_MEDS)
- [x] T059 [US3] Create DrugTable in `src/modules/master-drugs/DrugTable.tsx` — DataTable: drug_name, strength, unit, active status (StatusBadge), actions. Filter by active/inactive, text search on drug_name
- [x] T060 [US3] Create DrugImport in `src/modules/master-drugs/DrugImport.tsx` — Excel upload + SheetJS parse, preview table, confirm import with summary ("Imported X / Skipped Y / Errors Z")
- [x] T061 [US3] Create MasterDrugPage in `src/modules/master-drugs/MasterDrugPage.tsx` — Page with header "คลังชื่อยา", DrugTable, add/edit via DrugForm dialog, import via DrugImport. RoleGuard: super_admin + admin_hosp only
- [x] T062 [US3] Implement GAS master drug handlers in `backend/Code.gs` — masterDrug.list (with search filter), masterDrug.save (FK check before drug_name change), masterDrug.delete (active=N), masterDrug.import (batch insert, skip duplicates, AUDIT_LOG) per contracts/master-drug.md

**Checkpoint**: Master Drug management complete. Can add/edit/soft-delete/search/import drugs. FK protection on drug_name changes works. Data available for Module 4/5 dropdowns.

---

## Phase 6: US1 - Daily Workflow Part A: Schedule & Readiness (Priority: P1) 🎯 MVP Core

**Goal**: Super admin can create clinic schedules, attach telemed links, and perform equipment readiness checks before clinic days

**Independent Test**: Create a schedule entry for tomorrow → attach telemed link → perform readiness checklist → verify overall_status computed correctly → verify Telegram alert concept

- [ ] T063 [US1] Create schedule Zod schemas in `src/services/scheduleService.ts` — ClinicScheduleSchema, ScheduleListResponseSchema per contracts/schedule.md
- [ ] T064 [US1] Add schedule GAS actions in `src/services/scheduleService.ts` — list(filters), save(data), setLink(scheduleId, url), recordIncident(scheduleId, note) per contracts/schedule.md
- [ ] T065 [US1] Create schedule hooks in `src/modules/module3/useSchedule.ts` — useScheduleList(filters), useScheduleSave(), useScheduleSetLink(), useScheduleRecordIncident()
- [ ] T066 [US1] Create ScheduleForm in `src/modules/module3/ScheduleForm.tsx` — React Hook Form: service_date, clinic_type (Select from CLINIC_TYPES), hosp_code (Select from facilities), service_time, appoint_count. RoleGuard: super_admin + admin_hosp for create
- [ ] T067 [US1] Create TelemedLinkInput in `src/modules/module3/TelemedLinkInput.tsx` — Input field for meeting URL + save button. staff_hsc sees readonly link + "เปิดลิงก์" button (opens URL). staff_hosp+ sees editable input + save per SPEC.md Module 3
- [ ] T068 [US1] Create ScheduleGrid in `src/modules/module3/ScheduleGrid.tsx` — Weekly view: 7-column grid (Mon-Sun), rows per รพ.สต. Each cell shows clinic_type badge + time + appoint_count/actual_count. Click cell → detail dialog with TelemedLinkInput + incident note. Mobile: scrollable day-by-day list
- [ ] T069 [US1] Create SchedulePage in `src/modules/module3/SchedulePage.tsx` — Page with header "ตารางคลินิก", week/month navigation tabs, ScheduleGrid, add schedule via ScheduleForm dialog. Filter by hosp_code, clinic_type
- [ ] T070 [US1] Implement GAS schedule handlers in `backend/Code.gs` — schedule.list (with actual_count computed from VISIT_SUMMARY), schedule.save, schedule.setLink, schedule.recordIncident per contracts/schedule.md
- [ ] T071 [US1] Create readiness Zod schemas in `src/services/readinessService.ts` — ReadinessLogSchema (5 boolean fields + note), ReadinessListResponseSchema per contracts/readiness.md
- [ ] T072 [US1] Add readiness GAS actions in `src/services/readinessService.ts` — list(filters), save(data) per contracts/readiness.md
- [ ] T073 [US1] Create readiness hooks in `src/modules/module2/useReadiness.ts` — useReadinessList(filters), useReadinessSave()
- [ ] T074 [US1] Create ReadinessChecklist in `src/modules/module2/ReadinessChecklist.tsx` — 5 checkbox fields (cam_ok, mic_ok, pc_ok, internet_ok, software_ok), note textarea, auto-computed overall_status badge (ready/not_ready/need_fix per SPEC.md rules), save button
- [ ] T075 [US1] Create ReadinessHistory in `src/modules/module2/ReadinessHistory.tsx` — Table of past readiness checks per hosp_code: check_date, overall_status (StatusBadge), note, checked_by. Filterable by date range
- [ ] T076 [US1] Create ReadinessPage in `src/modules/module2/ReadinessPage.tsx` — Page with header "ตรวจสอบความพร้อม", list of รพ.สต. with clinics tomorrow (each showing status), click to open ReadinessChecklist, ReadinessHistory expandable per facility. Filter "unchecked only" toggle
- [ ] T077 [US1] Implement GAS readiness handlers in `backend/Code.gs` — readiness.list (JOIN FACILITIES for hosp_name), readiness.save (compute overall_status, upsert by hosp_code+check_date, AUDIT_LOG) per contracts/readiness.md

**Checkpoint**: Modules 2+3 functional. Can create schedules, attach links, perform readiness checks with auto-computed status. actual_count computed in real-time. Telegram trigger logic in GAS (can test manually).

---

## Phase 7: US1 - Daily Workflow Part B: Import & Drug Confirmation (Priority: P1) 🎯 MVP Core

**Goal**: Super admin can import patient data from HosXP Excel, and รพ.สต. staff can confirm drug dispensing

**Independent Test**: Upload HosXP Excel → preview parsed data → confirm import → verify VISIT_SUMMARY + VISIT_MEDS created → login as staff_hsc → confirm drugs for a patient → mark another as absent

- [ ] T078 [US1] Create import Zod schemas in `src/services/importService.ts` — ImportPreviewSchema, ImportConfirmSchema, VisitRowSchema (parsed Excel row) per contracts/import.md
- [ ] T079 [US1] Add import GAS actions in `src/services/importService.ts` — preview(data), confirm(data) per contracts/import.md
- [ ] T080 [US1] Create import hooks in `src/modules/module4/useImport.ts` — useImportPreview() (mutation), useImportConfirm() (mutation) with cache invalidation for visitSummary
- [ ] T081 [US1] Create ExcelUploader in `src/modules/module4/ExcelUploader.tsx` — Drag-and-drop zone + file picker, accepts .xlsx only, calls excelParser.parseHosXPExport, shows parse status/errors per plan.md Module 4 UI Pattern
- [ ] T082 [US1] Create PreviewTable in `src/modules/module4/PreviewTable.tsx` — Editable table of parsed rows grouped by VN: patient_name, dob, tel, drug_name, strength, qty, unit, sig. Inline Select for clinic_type per patient. Color-code invalid rows (VN duplicate, unknown drug). Batch-level รพ.สต./date/clinic_type selectors at top
- [ ] T083 [US1] Create ImportSummary in `src/modules/module4/ImportSummary.tsx` — Card showing: total rows, unique VNs, valid VNs, error count, unknown drugs list. Expandable error details. Confirm button (disabled if errors exist)
- [ ] T084 [US1] Create ImportPage in `src/modules/module4/ImportPage.tsx` — Wizard flow: Step 1 (ExcelUploader + batch selectors) → Step 2 (PreviewTable + validation) → Step 3 (ImportSummary + confirm). RoleGuard: admin_hosp+ per SPEC.md
- [ ] T085 [US1] Implement GAS import handlers in `backend/Code.gs` — import.preview (VN uniqueness check, drug_name validation, consistent patient data), import.confirm (insert VISIT_SUMMARY + VISIT_MEDS with defaults, handle round 2 diff logic, AUDIT_LOG) per contracts/import.md
- [ ] T086 [US1] Create visit service in `src/services/visitService.ts` — visitSummary.list(filters) and visitMeds.list(vn) functions with Zod schemas per contracts/visit-summary.md and contracts/visit-meds.md. CRITICAL: visitSummary.list response excludes tel/hn per SPEC.md security rules
- [ ] T087 [US1] Add visitMeds.save GAS action in `src/services/visitService.ts` — save(data) with action_type confirm_all/edit/absent per contracts/visit-meds.md
- [ ] T088 [US1] Create drug confirmation hooks in `src/modules/module5/useDrugConfirm.ts` — useVisitSummaryList(filters), useVisitMedsList(vn), useVisitMedsSave(), useMarkAbsent()
- [ ] T089 [US1] Create DrugSourceSelector in `src/modules/module5/DrugSourceSelector.tsx` — 3-button toggle: คลัง รพ.สต. (hsc_stock), ยา รพ. (hosp_stock), รอส่งจาก รพ. (hosp_pending). Per-drug selection per SPEC.md Module 5
- [ ] T090 [US1] Create DrugConfirmationPanel in `src/modules/module5/DrugConfirmationPanel.tsx` — Drug list per patient: drug_name, strength, qty, source (DrugSourceSelector), is_changed flag. Buttons: "ยืนยันทั้งหมด" (confirm_all), "เพิ่มยา" (add from Master Drug dropdown), "ไม่มารับบริการ" (mark absent with ConfirmModal) per SPEC.md Module 5
- [ ] T091 [US1] Create PatientList in `src/modules/module5/PatientList.tsx` — Card-based patient list: patient_name, clinic_type badge, dispensing_confirmed status (StatusBadge: รอยืนยัน/ยืนยันแล้ว/ไม่มา). Click card → expand DrugConfirmationPanel. Filter by date, hosp_code, status. Summary bar: "ยืนยันแล้ว X / ค้าง Y / ไม่มา Z"
- [ ] T092 [US1] Create DrugConfirmPage in `src/modules/module5/DrugConfirmPage.tsx` — Page with header "ยืนยันรายการยา", default date=today, PatientList. staff_hsc: filtered to own hosp_code. staff_hosp+: see all
- [ ] T093 [US1] Implement GAS visit/meds handlers in `backend/Code.gs` — visitSummary.list (exclude tel/hn, role-filtered), visitMeds.list (exclude tel/hn, role-filtered), visitMeds.save (handle confirm_all/edit/absent, auto-update VISIT_SUMMARY flags, AUDIT_LOG) per contracts/visit-summary.md and contracts/visit-meds.md

**Checkpoint**: Modules 4+5 functional. Can import Excel with preview/validation, drugs appear in Module 5, staff_hsc can confirm/mark absent, admin can edit drugs. Sensitive fields (tel/hn) excluded from API responses.

---

## Phase 8: US1+US2 - Daily Workflow Part C: Case Follow-up (Priority: P1) 🎯 MVP Complete

**Goal**: Admin can follow up on confirmed cases after service — view patient contact info, record follow-up notes, see drug change flags

**Independent Test**: After drug confirmation → open Module 6 → see pending follow-up cases → record follow-up for one case → verify "ติดตามแล้ว" badge → add second follow-up to same case

- [ ] T094 [US1] Create followup Zod schemas in `src/services/followupService.ts` — FollowupSaveSchema (followup_date, general_condition, side_effect, drug_adherence, other_note), FollowupListResponseSchema per contracts/followup.md. CRITICAL: Response includes tel and hn (Module 6 only)
- [ ] T095 [US1] Add followup GAS actions in `src/services/followupService.ts` — list(filters), save(data) per contracts/followup.md
- [ ] T096 [US1] Create followup hooks in `src/modules/module6/useFollowup.ts` — useFollowupList(filters), useFollowupSave()
- [ ] T097 [US1] Create PatientContactCard in `src/modules/module6/PatientContactCard.tsx` — Patient name, tel (clickable `tel:` link for mobile), hosp_name, clinic_type, service_date. Drug list with is_changed=Y highlighted (Apple Blue text) and drug_source_pending=Y flagged (warning icon)
- [ ] T098 [US1] Create FollowupForm in `src/modules/module6/FollowupForm.tsx` — React Hook Form: followup_date (date picker), general_condition (textarea), side_effect (textarea), drug_adherence (textarea), other_note (textarea) per SPEC.md Module 6
- [ ] T099 [US1] Create FollowupList in `src/modules/module6/FollowupList.tsx` — List of visits with dispensing_confirmed=Y: patient name, hosp_name, clinic_type, followup_status badge (รอติดตาม/ติดตามแล้ว). Click → expand PatientContactCard + FollowupForm + follow-up history timeline. Filter by status, hosp_code, date
- [ ] T100 [US1] Create FollowupPage in `src/modules/module6/FollowupPage.tsx` — Page with header "ติดตาม Case", FollowupList, RoleGuard: super_admin + admin_hosp only per SPEC.md Module 6
- [ ] T101 [US1] Implement GAS followup handlers in `backend/Code.gs` — followup.list (LEFT JOIN FOLLOWUP on VISIT_SUMMARY, include tel/hn, compute followup_status: pending/followed, include VISIT_MEDS), followup.save (insert new record, AUDIT_LOG) per contracts/followup.md

**Checkpoint**: Module 6 functional. Can see pending follow-ups with full patient data (tel/HN), record follow-up notes, view history. Multiple follow-ups per visit work. MVP (US1) is now COMPLETE — full daily workflow operational.

---

## Phase 9: US5 - Public Dashboard (Priority: P3)

**Goal**: Unauthenticated visitors can view aggregate statistics — no patient-identifiable data

**Independent Test**: Open /dashboard without login → see equipment status, upcoming appointments, attendance rates, follow-up pipeline → verify NO patient names/phone/VN/HN visible

- [ ] T102 [US5] Create dashboard Zod schemas in `src/services/dashboardService.ts` — DashboardStatsSchema with nested arrays for equipment_status, upcoming_appointments, attendance_by_clinic, attendance_by_facility, followup_pipeline per contracts/dashboard.md
- [ ] T103 [US5] Add dashboard GAS action in `src/services/dashboardService.ts` — getStats() calling gasGet('dashboard.stats') with Zod validation per contracts/dashboard.md
- [ ] T104 [US5] Create dashboard hooks in `src/modules/dashboard/useDashboard.ts` — useDashboardStats() with useQuery, no token needed (public endpoint)
- [ ] T105 [US5] Create StatsCards in `src/modules/dashboard/StatsCards.tsx` — Row of summary cards: total sessions this month, attendance rate %, follow-up completion %, equipment readiness %. Apple-style cards: no borders, 8px radius, subtle shadow per DESIGN.md
- [ ] T106 [US5] Create EquipmentStatusGrid in `src/modules/dashboard/EquipmentStatusGrid.tsx` — Grid of รพ.สต. cards: hosp_name, status (StatusBadge), last check date. Alternating #f5f5f7 backgrounds
- [ ] T107 [US5] Create UpcomingAppointments in `src/modules/dashboard/UpcomingAppointments.tsx` — Table: date, hosp_name, clinic_type, time, appoint_count for next 7 days
- [ ] T108 [US5] Create AttendanceChart in `src/modules/dashboard/AttendanceChart.tsx` — Two views: by clinic_type and by รพ.สต. Show appoint_count vs attended count, percentage rates
- [ ] T109 [US5] Create FollowupPipeline in `src/modules/dashboard/FollowupPipeline.tsx` — Two number cards: "ติดตามแล้ว X" and "รอติดตาม Y" — aggregate counts only, no patient details
- [ ] T110 [US5] Create DashboardPage in `src/modules/dashboard/DashboardPage.tsx` — Full-width layout (no sidebar, no auth required), hero section with system name on dark bg, then StatsCards, EquipmentStatusGrid, UpcomingAppointments, AttendanceChart, FollowupPipeline sections alternating backgrounds per DESIGN.md. Route: /dashboard (from VITE_DASHBOARD_PATH)
- [ ] T111 [US5] Implement GAS dashboard handler in `backend/Code.gs` — dashboard.stats (aggregate from EQUIPMENT, READINESS_LOG, CLINIC_SCHEDULE, VISIT_SUMMARY, FOLLOWUP; strip ALL sensitive fields; no token required) per contracts/dashboard.md

**Checkpoint**: Public dashboard accessible at /dashboard without login. All aggregate statistics display correctly. Zero patient-identifiable data in API response or UI.

---

## Phase 10: US6 - User Management & System Settings (Priority: P3)

**Goal**: Super admin can manage user accounts (approve, assign roles, suspend) and configure Telegram notification settings

**Independent Test**: Register new user → login as super_admin → approve user → change role → test Telegram send button → view audit log entries for all actions

- [ ] T112 [US6] Create users Zod schemas in `src/services/usersService.ts` — UserListResponseSchema, UserApproveSchema, UserUpdateSchema, PasswordResetSchema per contracts/users.md
- [ ] T113 [US6] Add users GAS actions in `src/services/usersService.ts` — list(filters), approve(data), update(data), resetPassword(data) per contracts/users.md
- [ ] T114 [US6] Create users hooks in `src/modules/users/useUsers.ts` — useUsersList(filters), useUserApprove(), useUserUpdate(), usePasswordReset()
- [ ] T115 [US6] Create RoleSelector in `src/modules/users/RoleSelector.tsx` — Dropdown with available roles based on caller's permission level. admin_hosp sees staff_hosp + staff_hsc only. super_admin sees all
- [ ] T116 [US6] Create ApprovalForm in `src/modules/users/ApprovalForm.tsx` — Dialog: show user details (hosp_code, name, tel), RoleSelector, approve/reject buttons. On approve → call useUserApprove with selected role
- [ ] T117 [US6] Create UserTable in `src/modules/users/UserTable.tsx` — DataTable: hosp_code, name, tel, role (StatusBadge), status (StatusBadge), created_at, actions (approve/edit role/reset password/suspend). Filter by status (pending/active/inactive), role, hosp_code
- [ ] T118 [US6] Create UsersPage in `src/modules/users/UsersPage.tsx` — Page with header "จัดการผู้ใช้", pending users count badge, UserTable, ApprovalForm dialog. RoleGuard: super_admin (all users), admin_hosp (staff_hosp + staff_hsc only)
- [ ] T119 [US6] Create settings Zod schemas in `src/services/settingsService.ts` — SettingsSchema, TelegramTestSchema per contracts/settings.md
- [ ] T120 [US6] Add settings GAS actions in `src/services/settingsService.ts` — get(), save(data) per contracts/settings.md
- [ ] T121 [US6] Create settings hooks in `src/modules/settings/useSettings.ts` — useSettingsGet(), useSettingsSave()
- [ ] T122 [US6] Create TelegramSettings in `src/modules/settings/TelegramSettings.tsx` — Form: bot_token, chat_id, alert_time, system_name, telegram_active toggle, app_url. "ทดสอบส่ง" button calling settings.save with telegram_test=true. Per DESIGN.md Forms spec
- [ ] T123 [US6] Create SettingsPage in `src/modules/settings/SettingsPage.tsx` — Page with header "ตั้งค่าระบบ", TelegramSettings card. RoleGuard: super_admin only per SPEC.md
- [ ] T124 [US6] Implement GAS users handlers in `backend/Code.gs` — users.list (role-filtered), users.approve (validate role permissions, set status=active), users.update (validate permissions, clear session on suspend), users.resetPassword (hash new password, clear session) per contracts/users.md
- [ ] T125 [US6] Implement GAS settings handlers in `backend/Code.gs` — settings.get (read SETTINGS sheet), settings.save (update key-value pairs, handle telegram_test by calling Telegram Bot API sendMessage), AUDIT_LOG per contracts/settings.md
- [ ] T126 [US6] Implement GAS Telegram trigger in `backend/Code.gs` — dailyTrigger() function: check SETTINGS.telegram_active, query CLINIC_SCHEDULE for tomorrow's clinics, JOIN FACILITIES + EQUIPMENT for status, format message per SPEC.md Section 7, send via UrlFetchApp to Telegram Bot API. Set up GAS time-driven trigger for 07:00 daily

**Checkpoint**: Users can be approved/role-changed/suspended. Telegram settings configurable with test send. Daily trigger sends reminders. Audit log records all admin actions.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final quality improvements across all modules

- [ ] T127 Add unauthorized response interceptor — In services/api.ts: detect "Unauthorized" error from any GAS call, call authStore.clearAuth(), redirect to /login automatically per SPEC.md Section 8
- [ ] T128 [P] Add password change on first login — In LoginPage or App: detect flag from GAS (if user was password-reset), show password change dialog before allowing access per spec.md clarification
- [ ] T129 [P] Implement audit log viewer — Add audit log display in SettingsPage (super_admin): DataTable of AUDIT_LOG entries with user, action, module, target, timestamp, old/new values per SCHEMA.md
- [ ] T130 [P] Add responsive testing and mobile polish — Test all modules at <640px, 640-1024px, >1024px breakpoints. Ensure touch targets ≥44px, cards stack on mobile, sidebar collapses properly per DESIGN.md Section 8
- [ ] T131 [P] Add error boundaries — React ErrorBoundary wrapper around each module route. Show user-friendly error card with retry button per SPEC.md edge case "backend unreachable"
- [ ] T132 [P] Add toast notifications on save/delete success — Wire up uiStore toast queue with shadcn Toaster. Show success/error toasts after mutations across all modules
- [ ] T133 Verify all GAS CORS compliance — Audit every fetch call in services/ to confirm: GET has no headers and token in query params, POST has no Content-Type header and token in body per Constitution Principle I
- [ ] T134 Verify all Zod schema validation — Audit every service function to confirm GAS responses are parsed through Zod before use per Constitution Principle II
- [ ] T135 Run full type-check with `npm run build` — Ensure zero TypeScript errors in strict mode across all files
- [ ] T136 Seed Google Sheets with initial data — HOSPITAL (16 facilities), FACILITIES (15 รพ.สต.), SETTINGS (default key-values), MASTER_DRUGS (initial drug list) per SCHEMA.md sample data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all modules
- **Phase 3 (Auth)**: Depends on Phase 2 — BLOCKS all protected modules
- **Phase 4 (US4 Equipment)**: Depends on Phase 3 — independently testable
- **Phase 5 (US3 Master Drug)**: Depends on Phase 3 — independently testable, provides drug data for Phase 7
- **Phase 6 (US1 Schedule+Readiness)**: Depends on Phase 3 — independently testable
- **Phase 7 (US1 Import+Drug Confirm)**: Depends on Phase 5 (Master Drug data) + Phase 6 (Schedule for actual_count)
- **Phase 8 (US1+US2 Followup)**: Depends on Phase 7 (confirmed drug data)
- **Phase 9 (US5 Dashboard)**: Depends on Phase 2 only — can start after foundation, but most useful after Phase 6+
- **Phase 10 (US6 Settings+Users)**: Depends on Phase 3 — independently testable
- **Phase 11 (Polish)**: After all desired phases complete

### User Story Dependencies

- **US1 (P1)**: Phases 6+7+8 — the full daily workflow. Depends on Auth + Master Drug
- **US2 (P1)**: Embedded in Phase 7 (staff_hsc drug confirmation perspective)
- **US3 (P2)**: Phases 5+6+7 (admin schedule creation + master drug + import)
- **US4 (P2)**: Phase 4 — fully standalone
- **US5 (P3)**: Phase 9 — standalone, no login required
- **US6 (P3)**: Phase 10 — standalone admin functions

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel. Across phases:
- Phase 4 (Equipment) and Phase 5 (Master Drug) can run in parallel after Phase 3
- Phase 9 (Dashboard) can run in parallel with Phases 4-8
- Phase 10 (Settings+Users) can run in parallel with Phases 4-8

### Critical Path (MVP)

```
Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7 → Phase 8
                                      (Master Drug) (Schedule) (Import+Drug) (Followup)
```

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All type files can be created simultaneously:
T011 (hospital.ts) + T012 (user.ts) + T013 (equipment.ts) + ... + T021 (api.ts)

# All constants can be created simultaneously:
T022 (roles.ts) + T023 (clinicTypes.ts) + T024 (drugSources.ts)

# After types + constants are done, in parallel:
T025 (api.ts) + T026 (dateUtils.ts) + T027 (roleGuard.ts) + T028 (excelParser.ts)

# After api.ts, in parallel:
T029 (authStore) + T030 (uiStore)

# After stores, in parallel:
T031-T040 (layout + common components + router)
```

## Parallel Example: Phases 4+5+9+10

```bash
# After Phase 3 (Auth), these phases can run simultaneously:
Phase 4:  T048-T054  (Equipment — Module 1)
Phase 5:  T055-T062  (Master Drug)
Phase 9:  T102-T111  (Dashboard)
Phase 10: T112-T126  (Users + Settings)
# Then continue with Phases 6-8 for the MVP workflow
```

---

## Implementation Strategy

### MVP First (US1 — Full Daily Workflow)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: Auth
4. Complete Phase 5: Master Drug (prerequisite for import/drug modules)
5. Complete Phase 6: Schedule + Readiness
6. Complete Phase 7: Import + Drug Confirmation
7. Complete Phase 8: Follow-up
8. **STOP and VALIDATE**: Run full daily cycle end-to-end
9. Deploy MVP

### Incremental Delivery

1. Setup + Foundational + Auth → Foundation ready
2. + Phase 4 (Equipment) → Module 1 usable independently
3. + Phase 5+6+7+8 (MVP) → Full daily workflow operational
4. + Phase 9 (Dashboard) → Public monitoring
5. + Phase 10 (Settings+Users) → Admin management
6. + Phase 11 (Polish) → Production-ready

### Estimated Scope

- **Total tasks**: 136
- **MVP tasks** (Phases 1-3 + 5-8): ~101 tasks
- **Post-MVP tasks** (Phases 4, 9-11): ~35 tasks
- **Per user story**:
  - US1 (P1): Phases 6+7+8 = ~39 tasks (core workflow)
  - US2 (P1): Embedded in Phase 7 = ~6 tasks (staff_hsc perspective)
  - US3 (P2): Phases 5+6+7 = ~30 tasks (admin features)
  - US4 (P2): Phase 4 = ~7 tasks (equipment)
  - US5 (P3): Phase 9 = ~10 tasks (dashboard)
  - US6 (P3): Phase 10 = ~15 tasks (settings+users)

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps task to specific user story for traceability
- GAS backend tasks (Code.gs) are interleaved with frontend phases
- Each phase is independently testable via its checkpoint criteria
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- All tasks follow the strict checklist format with ID, optional [P], optional [Story], description + file path
