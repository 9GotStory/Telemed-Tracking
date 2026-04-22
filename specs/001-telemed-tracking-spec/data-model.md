# Data Model — Telemed Tracking คปสอ.สอง

## Overview

All data resides in a single Google Spreadsheet. Each Sheet = 1 table. First row = headers. Row 2+ = data. No SQL, no joins at the database level — all relationships are enforced in GAS code and validated by the frontend via Zod schemas.

## Entity Relationship Diagram

```
HOSPITAL (hosp_code PK)
├─── USERS (hosp_code FK → HOSPITAL)
├─── FACILITIES (hosp_code PK FK → HOSPITAL)
│    ├─── EQUIPMENT (hosp_code FK → FACILITIES)
│    ├─── READINESS_LOG (hosp_code FK → FACILITIES)
│    ├─── CLINIC_SCHEDULE (hosp_code FK → FACILITIES)
│    └─── VISIT_SUMMARY (hosp_code FK → FACILITIES)
│         ├─── VISIT_MEDS (vn FK → VISIT_SUMMARY)
│         │    └─── MASTER_DRUGS (drug_name FK → natural key)
│         └─── FOLLOWUP (vn FK → VISIT_SUMMARY)

USERS (user_id PK)
└─── AUDIT_LOG (user_id FK → USERS)
```

## Entities

### Hospital

Master registry of healthcare facilities. Seeded data. Determines max role on registration.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| hosp_code | text | PK | Standard สป.สช. code, e.g., `00588` |
| hosp_name | text | ✔ | Display name |
| hosp_type | text | ✔ | `สสอ.` / `รพ.` / `รพ.สต.` |
| active | Y/N | ✔ | Y = allows user registration |

**Validation**: `hosp_code` must be exactly 5 digits. `hosp_type` must be one of 3 values.

**State Transitions**: None. Seeded data, rarely modified.

---

### User

Staff member with role-based access. One hosp_code may have multiple user accounts.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| user_id | text | PK | UUID v4, auto-generated |
| hosp_code | text | FK ✔ | → HOSPITAL.hosp_code |
| first_name | text | ✔ | |
| last_name | text | ✔ | |
| tel | text | ✔ | 9-10 digit phone number |
| password_hash | text | ✔ | SHA-256 + salt (never sent to frontend) |
| role | text | ✔ | `super_admin` / `admin_hosp` / `staff_hosp` / `staff_hsc` |
| status | text | ✔ | `pending` → `active` → `inactive` |
| approved_by | text | | → USERS.user_id |
| session_token | text | | UUID, cleared on logout |
| session_expires | datetime | | 8 hours from login |
| created_at | datetime | ✔ | |
| last_login | datetime | | |

**State Transitions**:
```
pending → active    (admin approves)
pending → inactive  (admin rejects)
active → inactive   (admin suspends)
inactive → active   (admin re-enables)
```

**Validation**: `role` must match `hosp_type` constraint (สสอ.=super_admin max, รพ.=admin_hosp max, รพ.สต.=staff_hsc max). Password min 8 chars.

**Security**: `password_hash`, `session_token`, `session_expires` are NEVER included in frontend responses.

---

### Facility

Extended info for รพ.สต. locations. One-to-one with HOSPITAL for รพ.สต. entries.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| hosp_code | text | PK FK ✔ | → HOSPITAL.hosp_code |
| hosp_name | text | ✔ | |
| contact_name | text | | Responsible person |
| contact_tel | text | | Contact phone |
| active | Y/N | ✔ | |

---

### Equipment

Telemed hardware per facility. Supports soft-delete.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| equip_id | text | PK | UUID v4 |
| hosp_code | text | FK ✔ | → FACILITIES.hosp_code |
| set_type | text | ✔ | `A` (desktop+camera+mic) / `B` (laptop) |
| device_type | text | ✔ | `computer` / `notebook` / `camera` / `mic` |
| os | text | | `Windows 11` / `Windows 10` / `macOS` |
| status | text | ✔ | `ready` / `maintenance` / `broken` / `inactive` |
| is_backup | Y/N | ✔ | Y = backup device |
| software | text | | Comma-separated list |
| internet_mbps | number | | Speed in Mbps |
| responsible_person | text | | |
| responsible_tel | text | | |
| note | text | | |
| updated_at | datetime | ✔ | |
| updated_by | text | FK ✔ | → USERS.user_id |

**Soft Delete**: Set `status = inactive`. Never remove row.

**Validation**: `set_type` determines valid `device_type` combinations:
- Set A: Must have at least `computer` + optionally `camera`, `mic`
- Set B: Must be `notebook` only

---

### ReadinessLog

Daily equipment checklist. One record per facility per day (composite key: hosp_code + check_date).

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| log_id | text | PK | UUID v4 |
| hosp_code | text | FK ✔ | → FACILITIES.hosp_code |
| check_date | date | ✔ | Date of check (day before service) |
| cam_ok | Y/N | ✔ | |
| mic_ok | Y/N | ✔ | |
| pc_ok | Y/N | ✔ | |
| internet_ok | Y/N | ✔ | |
| software_ok | Y/N | ✔ | |
| overall_status | text | ✔ | Auto-computed (see rules) |
| note | text | | |
| checked_by | text | FK ✔ | → USERS.user_id |
| checked_at | datetime | ✔ | |

**Computed Field — overall_status**:
```
IF all 5 fields = Y              → "ready"
IF pc_ok = N OR internet_ok = N  → "not_ready"
ELSE (other N but pc+internet OK) → "need_fix"
```

---

### ClinicSchedule

Telemed session definition. Does NOT store actual_count.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| schedule_id | text | PK | UUID v4 |
| service_date | date | ✔ | |
| hosp_code | text | FK ✔ | → FACILITIES.hosp_code |
| clinic_type | text | ✔ | 6 types (see below) |
| service_time | text | ✔ | e.g., `09.00-10.00` |
| appoint_count | number | ✔ | Expected appointments |
| telemed_link | text | | Meeting URL |
| link_added_by | text | FK | → USERS.user_id |
| incident_note | text | | Service disruption notes |
| updated_at | datetime | ✔ | |

**Clinic Types**: `PCU-DM`, `PCU-HT`, `ANC-nutrition`, `ANC-parent`, `postpartum-EPI`, `postpartum-dev`

**Computed — actual_count**: Count of VISIT_SUMMARY rows matching `service_date + hosp_code + clinic_type` where `attended = Y`. Computed by GAS at query time, never stored.

---

### MasterDrug

Drug catalog. Natural key = drug_name (not drug_id).

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| drug_id | text | PK | UUID v4 |
| drug_name | text | ✔ | **Natural key** — immutable if referenced in VISIT_MEDS |
| strength | text | ✔ | e.g., `500 mg` |
| unit | text | ✔ | e.g., `เม็ด` |
| active | Y/N | ✔ | Y = shown in dropdowns |

**Integrity Rule**: If any VISIT_MEDS row references this drug_name, the drug_name field CANNOT be changed. Deactivation (active=N) is always allowed.

---

### VisitSummary

One row per patient visit. Primary key = VN (from HosXP).

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| vn | text | PK | From HosXP, never self-generated |
| hn | text | ✔ | |
| patient_name | text | ✔ | |
| dob | date | ✔ | Buddhist Era display, stored as Gregorian |
| tel | text | ✔ | Sensitive — Module 6 only |
| clinic_type | text | ✔ | |
| hosp_code | text | FK ✔ | |
| service_date | date | ✔ | |
| attended | Y/N | | Blank after round 1 import |
| has_drug_change | Y/N | | Auto-set from VISIT_MEDS |
| drug_source_pending | Y/N | | Auto-set from VISIT_MEDS |
| dispensing_confirmed | Y/N | | Set when drugs confirmed |
| import_round1_at | datetime | | |
| import_round2_at | datetime | | |
| diff_status | text | | `pending` / `matched` / `mismatch` |
| confirmed_by | text | FK | → USERS.user_id |
| confirmed_at | datetime | | |

**Link to Schedule**: Via `service_date + hosp_code + clinic_type` (not schedule_id).

**Sensitive Fields**: `tel` and `hn` excluded from visitSummary.list and visitMeds.list responses. Only included in followup.list (Module 6).

---

### VisitMed

Individual drug entry per visit. Multiple rows per VN.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| med_id | text | PK | UUID v4 |
| vn | text | FK ✔ | → VISIT_SUMMARY.vn |
| drug_name | text | FK ✔ | → MASTER_DRUGS.drug_name |
| strength | text | ✔ | |
| qty | number | ✔ | Positive integer |
| unit | text | ✔ | |
| sig | text | ✔ | Dosage instructions |
| source | text | ✔ | `hsc_stock` / `hosp_stock` / `hosp_pending` |
| is_changed | Y/N | ✔ | Y = modified from original |
| round | number | ✔ | 1 or 2 |
| status | text | ✔ | `draft` / `confirmed` / `cancelled` |
| note | text | | |
| updated_by | text | FK ✔ | |
| updated_at | datetime | ✔ | |

**Default on Import (Round 1)**: `source=hosp_stock`, `is_changed=N`, `round=1`, `status=draft`

**Auto-update on Confirmation**:
- Any drug changed → `is_changed=Y` on that row, `has_drug_change=Y` on VISIT_SUMMARY
- Any drug `source=hosp_pending` → `drug_source_pending=Y` on VISIT_SUMMARY
- Patient absent → all VISIT_MEDS `status=cancelled`, VISIT_SUMMARY `attended=N`

---

### Followup

Post-service follow-up records. Multiple records per VN allowed.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| followup_id | text | PK | UUID v4 |
| vn | text | FK ✔ | → VISIT_SUMMARY.vn |
| followup_date | date | ✔ | |
| general_condition | text | | |
| side_effect | text | | Focus on is_changed=Y drugs |
| drug_adherence | text | | |
| other_note | text | | |
| recorded_by | text | FK ✔ | → USERS.user_id |
| recorded_at | datetime | ✔ | |

**Business Rule**: A visit is "followed up" when at least 1 FOLLOWUP record exists. Additional records can be added at any time.

---

### AuditLog

Immutable log of all data-modifying actions. Append-only.

| Field | Type | Required | Notes |
|-------|------|:-------:|-------|
| log_id | text | PK | UUID v4 |
| user_id | text | FK ✔ | → USERS.user_id |
| action | text | ✔ | `CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `IMPORT` / `APPROVE` |
| module | text | ✔ | Sheet/module name |
| target_id | text | | ID of affected record |
| old_value | text | | JSON string |
| new_value | text | | JSON string |
| created_at | datetime | ✔ | |

---

### Settings

Key-value configuration. Not a traditional entity — stored as 2-column sheet.

| Key | Example Value | Notes |
|-----|---------------|-------|
| telegram_bot_token | `123456:ABCdef...` | |
| telegram_chat_id | `-1001234567890` | Group chat ID |
| alert_time | `07:00` | Daily alert time |
| system_name | `Telemed Tracking คปสอ.สอง` | Displayed in header |
| telegram_active | `Y` | Y/N toggle |
| app_url | `https://telemed-song.pages.dev` | For Telegram message links |

**Access**: super_admin only. GAS reads settings at runtime for Telegram triggers.
