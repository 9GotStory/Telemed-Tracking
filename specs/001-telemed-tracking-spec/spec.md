# Feature Specification: Telemed Tracking คปสอ.สอง — Full System

**Feature Branch**: `001-telemed-tracking-spec`
**Created**: 2026-04-22
**Status**: Draft
**Input**: Project scope from README.md and requirements from FEATURES.md. Defines 6 operational modules, Master Drug workflow, Dashboard, and role-based access for 4 user roles.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - IT Super Admin Manages Daily Telemed Operations (Priority: P1)

The IT staff at สสอ.สอง (super_admin) logs in each morning to manage the
telemedicine tracking system. They check equipment readiness for the next
day's clinics, import patient data from HosXP Excel exports, review drug
confirmations from รพ.สต. staff, and follow up on cases after service
completion. They also receive Telegram alerts at 07:00 reminding them to
check equipment before clinic days.

**Why this priority**: This is the primary operational workflow that the
entire system exists to support. Without it, no telemed tracking happens.

**Independent Test**: Can be fully tested by completing a full daily cycle:
receive Telegram alert → check equipment readiness (Module 2) → import
patient data (Module 4) → attach telemed link (Module 3) → confirm drugs
(Module 5) → follow up on cases (Module 6).

**Acceptance Scenarios**:

1. **Given** it is the day before a scheduled clinic session, **When** the
   07:00 GAS trigger fires, **Then** a Telegram message is sent listing
   each รพ.สต. that has a clinic tomorrow, including clinic type,
   appointment count, equipment status, and a link to the readiness
   checklist.
2. **Given** the super_admin opens Module 2 (readiness checklist), **When**
   they fill in the checklist for a รพ.สต. (cam, mic, pc, internet,
   software), **Then** the system automatically computes overall_status
   as "ready" (all Y), "not_ready" (pc or internet is N), or "need_fix"
   (other fields N but pc+internet OK).
3. **Given** the super_admin has an Excel export from HosXP, **When** they
   upload it through Module 4 selecting รพ.สต., date, and clinic type,
   **Then** a preview table shows all parsed rows, they can edit
   clinic_type per patient, and confirming creates VISIT_SUMMARY and
   VISIT_MEDS records with default values (source=hosp_stock,
   is_changed=N, round=1, status=draft).
4. **Given** a confirmed drug list exists for a patient, **When** the
   super_admin views the case in Module 6, **Then** they see the
   patient's phone number (clickable on mobile), the actual drug list
   with changed drugs highlighted, and pending drug deliveries flagged,
   and can record follow-up notes.

---

### User Story 2 - รพ.สต. Staff Confirms Drug Dispensing (Priority: P1)

A nurse at a รพ.สต. (staff_hsc) logs in on clinic day to see which
patients are scheduled. They open each patient's drug list, verify which
drugs were actually dispensed, select the drug source (from their own
stock, from the hospital batch, or pending delivery), and confirm. If the
doctor changed any prescriptions, they edit the drug entries. If a patient
did not attend, they mark them as absent.

**Why this priority**: Drug confirmation is the critical data-collection
step that feeds into case tracking. Without it, follow-up cannot begin.

**Independent Test**: Can be tested by logging in as staff_hsc for a
specific รพ.สต., viewing the day's patient list, confirming drugs for
one patient (no changes), editing drugs for another (change + new drug),
and marking a third as absent.

**Acceptance Scenarios**:

1. **Given** a staff_hsc user is logged in, **When** they open Module 5,
   **Then** they see only patients from their own hosp_code for the
   selected date, with no telephone numbers or HN visible in the list
   view (those fields are excluded by the GAS response).
2. **Given** a patient's drug list is displayed, **When** the nurse
   presses "Confirm All" without changes, **Then** all drugs are marked
   as confirmed (status=confirmed), and the VISIT_SUMMARY record is
   updated: dispensing_confirmed=Y.
3. **Given** a patient's drug list is displayed, **When** the nurse edits
   a drug entry (changes drug or adds a new one from Master Drug
   dropdown), **Then** the changed/new drug is marked is_changed=Y, the
   VISIT_SUMMARY has_drug_change flag is set to Y, and if source is
   hosp_pending then drug_source_pending is set to Y.
4. **Given** a patient did not attend, **When** the nurse presses "Did
   not attend", **Then** attended is set to N in VISIT_SUMMARY and all
   VISIT_MEDS for that VN are set to status=cancelled.

---

### User Story 3 - Admin Hospital Staff Imports Data and Manages Schedules (Priority: P2)

An admin at รพ.สอง (admin_hosp) manages the clinic schedule, imports
patient data from HosXP, and attaches telemed meeting links to scheduled
sessions. They can see data from all facilities and manage the Master
Drug list.

**Why this priority**: This role enables the preparatory work before
clinic day. It is important but secondary to the actual service-day
workflows.

**Independent Test**: Can be tested by creating a clinic schedule entry,
importing a round-1 Excel file, attaching a telemed link to the schedule,
and performing a round-2 import to detect drug changes.

**Acceptance Scenarios**:

1. **Given** an admin_hosp user is logged in, **When** they create a
   clinic schedule in Module 3 with date, clinic type, รพ.สต., time, and
   appointment count, **Then** the schedule entry appears in the weekly
   view and the system can calculate actual attendance in real-time.
2. **Given** a schedule entry exists without a telemed link, **When** the
   admin_hosp attaches a meeting URL, **Then** staff_hsc users at that
   รพ.สต. can click the link directly from Module 3.
3. **Given** a round-1 import has been completed, **When** the admin_hosp
   imports a round-2 Excel file, **Then** the system matches VNs,
   compares drug lists, and flags each visit as matched or mismatch.
4. **Given** the admin_hosp opens the Master Drug page, **When** they
   add a new drug (name, strength, unit), **Then** it appears in the
   active drug list and is available in Module 5 dropdowns. If they try
   to change a drug_name that is already referenced in VISIT_MEDS, the
   system shows a warning and blocks the change.

---

### User Story 4 - Equipment Registration and Status Tracking (Priority: P2)

Any user can register telemed equipment at their facility and track its
status. super_admin and admin_hosp see all facilities; staff_hsc sees
only their own. Equipment can be added as Set A (desktop + camera +
microphone) or Set B (laptop with built-in peripherals), with details
on OS, installed software, internet speed, and responsible person.

**Why this priority**: Equipment readiness is a prerequisite for clinic
operations, but equipment registration is a one-time setup task.

**Independent Test**: Can be tested by adding a Set A equipment entry for
a รพ.สต., editing its details, and soft-deleting it (status=inactive).

**Acceptance Scenarios**:

1. **Given** any logged-in user, **When** they add equipment in Module 1
   specifying set type, device type, OS, status, software list, and
   internet speed, **Then** the entry is saved and visible to users with
   appropriate access.
2. **Given** a staff_hsc user at รพ.สต. นาหลวง, **When** they view
   Module 1, **Then** they see only equipment registered at their own
   hosp_code.
3. **Given** an equipment entry exists, **When** the user soft-deletes
   it, **Then** its status changes to "inactive" and it no longer appears
   in the active equipment list, but the row is preserved in the
   database.

---

### User Story 5 - Public Dashboard for Monitoring (Priority: P3)

Any visitor (no login required) can view the public dashboard showing
equipment status per facility, upcoming appointments for the next 7 days,
monthly session statistics, attendance rates by clinic type and by
รพ.สต., and case follow-up pipeline counts. No patient-identifiable
data is displayed.

**Why this priority**: The dashboard is a reporting and transparency tool
that adds value but does not drive daily operations.

**Independent Test**: Can be tested by opening the /dashboard URL without
logging in and verifying that aggregate statistics are displayed and no
patient names, phone numbers, VN, or HN values are visible.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they navigate to the
   dashboard URL, **Then** they see equipment readiness status per
   รพ.สต. (ready/not ready + last check date).
2. **Given** clinic sessions exist in the database, **When** the
   dashboard loads, **Then** it displays upcoming appointments for the
   next 7 days and monthly session counts.
3. **Given** patient visit data exists, **When** the dashboard displays
   attendance rates, **Then** it shows aggregate percentages by clinic
   type and by รพ.สต. with no individual patient information visible.

---

### User Story 6 - Super Admin Manages System Settings and Users (Priority: P3)

The super_admin configures Telegram notification settings, manages user
accounts (approve new registrations, assign roles, suspend users), and
accesses the audit log for all system actions.

**Why this priority**: Administrative functions are essential for system
maintenance but are infrequent and can be addressed after operational
features are complete.

**Independent Test**: Can be tested by registering a new user, approving
   it as super_admin, updating a Telegram setting, and viewing the audit
   log for the actions performed.

**Acceptance Scenarios**:

1. **Given** a new user has registered with status=pending, **When** the
   super_admin approves them and assigns a role, **Then** the user can
   log in with that role's permissions.
2. **Given** the super_admin configures Telegram settings (bot token,
   chat ID, alert time), **When** they press "Test Send", **Then** a test
   message is delivered to the configured Telegram chat.
3. **Given** any data-modifying action has occurred, **When** the
   super_admin views the audit log, **Then** every CREATE, UPDATE,
   DELETE, LOGIN, IMPORT, and APPROVE action is listed with user, target,
   and timestamp.

---

### Edge Cases

- What happens when a VN in an import file already exists in
  VISIT_SUMMARY during a round-1 import? The system rejects that VN and
  reports it in the import summary.
- What happens when a drug_name in the import file does not exist in
  MASTER_DRUGS? The system warns the user and lists the unknown drugs;
  the user must add them to Master Drugs before confirming the import.
- What happens when the Telegram Bot Token is invalid? The "Test Send"
  action returns an error and the user is notified; daily alerts are
  skipped silently until fixed.
- What happens when a staff_hsc user tries to access data for a
  different hosp_code? The GAS backend rejects the request and the
  frontend hides the data through role-based filtering.
- What happens when a session token expires during an active session?
  The next API call returns "Unauthorized" and the frontend redirects
  to the login page.
- What happens when two rows for the same VN have conflicting patient
  data (different name, DOB, or phone)? The entire VN group is rejected
  during import validation.
- What happens when the backend is temporarily unreachable? The system
  displays a clear error message ("Unable to connect to server") with a
  retry button. No data is cached locally; all operations require a
  live connection.

## Clarifications

### Session 2026-04-22

- Q: Can a nurse record multiple follow-ups for the same visit, or only one? → A: Multiple follow-ups allowed — nurse can record several contacts over time for the same visit; "pending follow-up" means no record exists yet, "followed up" means at least one exists.
- Q: How can users recover or reset a forgotten password? → A: Admin-assisted reset — super_admin or admin_hosp can set a new temporary password for any user; the user must change it on next login.
- Q: What should the user experience be when the GAS backend is temporarily unreachable? → A: Show a clear error message ("Unable to connect to server") with a retry button; no data is cached locally.
- Q: How are concurrent edits to the same record handled in Google Sheets? → A: Last-write-wins with audit trail — accept the latest save and log both old and new values in AUDIT_LOG; no conflict detection.
- Q: What is the data retention and archival policy? → A: Keep all data indefinitely in the active spreadsheet; archive older data to a separate archive spreadsheet only if performance degrades (manual admin action).

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization**

- **FR-001**: System MUST allow registration with hosp_code, password,
  first name, last name, and phone number; new accounts start with
  status=pending until an admin approves them.
- **FR-002**: System MUST validate that the hosp_code exists in the
  HOSPITAL master list and is active before allowing registration.
- **FR-003**: System MUST assign the maximum allowed role based on
  hosp_type (สสอ.=super_admin, รพ.=admin_hosp, รพ.สต.=staff_hsc)
  during registration; the approving admin may assign a lower role.
- **FR-004**: System MUST create a session token upon successful login
  that expires after 8 hours, stored in sessionStorage on the client.
- **FR-005**: System MUST send the session token in the query string
  (GET requests) or request body (POST requests) — never in headers.
- **FR-006**: System MUST allow super_admin and admin_hosp to reset a
  user's password to a temporary value; the affected user MUST be
  required to set a new password on their next login.

**Module 1 — Equipment Registry**

- **FR-010**: System MUST allow users to register telemed equipment with
  set type (A or B), device type, OS, status, backup flag, installed
  software, internet speed, responsible person, and contact.
- **FR-011**: System MUST filter equipment visibility: staff_hsc sees
  only their own facility; staff_hosp and above see all facilities.
- **FR-012**: System MUST implement soft-delete for equipment (set
  status=inactive) rather than physical row deletion.

**Module 2 — Readiness Checklist**

- **FR-020**: System MUST send a Telegram notification at 07:00 on the
  day before each scheduled clinic, listing affected รพ.สต., clinic
  type, appointment count, and current equipment status.
- **FR-021**: System MUST provide a checklist interface with 5 boolean
  fields (cam_ok, mic_ok, pc_ok, internet_ok, software_ok) and auto-
  compute overall_status: ready (all Y), not_ready (pc or internet N),
  need_fix (other N but pc+internet OK).
- **FR-022**: System MUST display readiness history per facility and
  allow filtering to show only unchecked facilities for the current day.

**Module 3 — Clinic Schedule & Telemed Link**

- **FR-030**: System MUST allow creating clinic schedule entries with
  date, clinic type, รพ.สต., time, and appointment count.
- **FR-031**: System MUST compute actual_count in real-time from
  VISIT_SUMMARY (count of rows matching service_date + hosp_code +
  clinic_type where attended=Y), never storing it in the schedule.
- **FR-032**: System MUST allow staff_hosp and above to attach a telemed
  meeting link to each schedule session; staff_hsc can click the link to
  join.
- **FR-033**: System MUST support 6 clinic types: PCU-DM, PCU-HT,
  ANC-nutrition, ANC-parent, postpartum-EPI, postpartum-dev.

**Master Drug Management**

- **FR-040**: System MUST allow super_admin and admin_hosp to manage the
  Master Drug list: add, edit, and soft-delete (active=N) drugs.
- **FR-041**: System MUST prevent changing drug_name in MASTER_DRUGS if
  that drug is referenced in any VISIT_MEDS row.
- **FR-042**: System MUST support importing the Master Drug list from
  Excel (drug_name, strength, unit, active columns).
- **FR-043**: System MUST provide drug search and filtering by
  active/inactive status.

**Module 4 — Patient Data Import**

- **FR-050**: System MUST parse Excel files (.xlsx) client-side using
  SheetJS, validate column headers, and display a preview table before
  confirmation.
- **FR-051**: System MUST allow batch-level selection of รพ.สต., date,
  and clinic type, with per-patient clinic_type override in the preview.
- **FR-052**: System MUST validate: VN uniqueness (round 1) or VN
  existence (round 2), drug_name presence in MASTER_DRUGS, consistent
  patient data across rows with the same VN, and valid formats for tel,
  dob, qty.
- **FR-053**: System MUST default imported drug records to:
  source=hosp_stock, is_changed=N, round=1 (or 2), status=draft.
- **FR-054**: System MUST support round-2 import that matches VNs,
  compares drug lists, and sets diff_status (matched/mismatch/pending).

**Module 5 — Drug Confirmation**

- **FR-060**: System MUST display patients for a selected date filtered
  by role (staff_hsc sees only their hosp_code).
- **FR-061**: System MUST exclude tel and hn fields from Module 5 API
  responses (visitMeds.list and visitSummary.list).
- **FR-062**: System MUST support 4 confirmation actions: confirm all
  (no changes), edit drug entries, add new drugs, and mark as absent.
- **FR-063**: System MUST auto-update VISIT_SUMMARY flags when drugs
  are confirmed: dispensing_confirmed=Y, has_drug_change=Y if any
  drug was changed, drug_source_pending=Y if any source is hosp_pending.
- **FR-064**: System MUST provide drug source selection (hsc_stock,
  hosp_stock, hosp_pending) for each drug entry.

**Module 6 — Case Follow-up**

- **FR-070**: System MUST show patients eligible for follow-up:
  dispensing_confirmed=Y and not yet in FOLLOWUP table. Multiple
  follow-up records per visit are allowed (e.g., re-contact after
  unanswered call, side-effect check-in weeks later). A visit is
  considered "followed up" once at least one FOLLOWUP record exists;
  additional records can be added at any time.
- **FR-071**: System MUST display patient phone number (clickable tel:
  link for mobile) and full drug list with is_changed and
  drug_source_pending flags highlighted.
- **FR-072**: System MUST allow recording: followup_date,
  general_condition, side_effect, drug_adherence, other_note.
  Each follow-up creates a new record; previous records for the same
  VN are preserved and viewable in the follow-up history.
- **FR-073**: System MUST restrict access to super_admin and admin_hosp
  only.

**Dashboard**

- **FR-080**: System MUST provide a public dashboard accessible without
  login showing: equipment status per facility, 7-day upcoming
  appointments, monthly session counts, attendance rates by clinic type
  and by รพ.สต., and follow-up pipeline counts.
- **FR-081**: System MUST NOT display any patient-identifiable data
  (name, phone, VN, HN, individual drug lists) on the public dashboard.

**Users Management**

- **FR-090**: super_admin MUST be able to manage all users across all
  facilities; admin_hosp MUST be able to manage staff_hosp and staff_hsc
  users.
- **FR-091**: System MUST support user approval, role assignment, role
  modification, and account suspension.

**Settings**

- **FR-095**: super_admin MUST be able to configure Telegram Bot Token,
  Chat ID, alert time, system name, and toggle notifications on/off.
- **FR-096**: System MUST provide a "Test Send" button for Telegram
  configuration verification.

### Key Entities

- **Hospital**: Master registry of healthcare facilities identified by
  hosp_code, with hosp_type determining role eligibility.
- **User**: Staff member with a role (super_admin, admin_hosp,
  staff_hosp, staff_hsc), linked to a facility via hosp_code.
- **Facility**: A รพ.สต. location with contact information, linked to
  Hospital via hosp_code.
- **Equipment**: Telemed hardware registered per facility, supporting
  Set A (desktop+camera+mic) and Set B (laptop), with status tracking.
- **ReadinessLog**: Daily equipment checklist with 5 boolean checks and
  auto-computed overall status.
- **ClinicSchedule**: A telemed session defined by date, facility,
  clinic type, time, and appointment count. Does NOT store actual_count.
- **MasterDrug**: Drug catalog entry identified by drug_name (natural
  key), with soft-delete support.
- **VisitSummary**: One record per patient visit (VN as primary key),
  linking to facility, date, clinic type, with flags for drug changes,
  source pending, and dispensing confirmation.
- **VisitMed**: Individual drug entry per visit, linked to VisitSummary
  via VN and MasterDrug via drug_name. Tracks source, change status, and
  import round.
- **Followup**: Post-service follow-up record linked to a visit via VN.
- **AuditLog**: Immutable log of all data-modifying actions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff at all 16 facilities (รพ.สอง + 15 รพ.สต.) can log in
  and see data appropriate to their role within 30 seconds of opening the
  application.
- **SC-002**: The full daily workflow (readiness check → import → drug
  confirmation → follow-up) can be completed by a single operator within
  30 minutes for a typical clinic day (20-30 patients).
- **SC-003**: Excel import of a 100-row file (30 patients with 3-4 drugs
  each) completes parsing and validation within 5 seconds in the browser,
  with a clear preview showing all rows before confirmation.
- **SC-004**: Telegram alerts are delivered by 07:05 on the day before
  each scheduled clinic session (99% reliability over a 30-day period).
- **SC-005**: 100% of patient-identifiable data (names, phone numbers,
  VN, HN) is excluded from the public dashboard and from Module 5 list
  views (verified by API response inspection).
- **SC-006**: staff_hsc users cannot access or modify data from any
  facility other than their own, enforced at both the frontend UI layer
  and the GAS backend layer.
- **SC-007**: Drug confirmation workflow supports all 4 cases (confirm
  all, edit drug, add drug, mark absent) with no more than 3 clicks per
  patient from the patient list to completion.

## Assumptions

- Users have stable internet connectivity on desktop or mobile devices;
  the web app is not designed for full offline use.
- Data entry is in Thai language for patient names and notes; the
  application UI uses Thai labels and Buddhist Era (พ.ศ.) date format.
- HosXP exports Excel files in a consistent column format as specified in
  SPEC.md; the system does not connect to HosXP directly.
- One รพ.สต. has at most one clinic session of one type per day
  (matches the actual schedule for May-June 2026).
- The Google Spreadsheet backend is shared by all users; concurrent
  write conflicts are rare because each รพ.สต. edits only their own
  data. When conflicts do occur, the last write wins; all changes are
  logged in AUDIT_LOG (old and new values) for traceability.
- Mobile responsiveness is required because nurses use phones for
  follow-up calls in Module 6.
- Telegram Bot API is the only notification channel; no email or SMS.
- Session tokens are cryptographically random UUIDs generated by GAS
  (Utilities.getUuid()).
- All data is retained indefinitely in the active Google Spreadsheet.
  If performance degrades due to row volume (Google Sheets slows above
  ~50,000 rows), historical data may be archived to a separate
  spreadsheet as a manual admin action. No automated archival is
  implemented in the initial system.
