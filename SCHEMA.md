# SCHEMA.md — Google Sheets Database Schema
# Telemed Tracking คปสอ.สอง v1.1.0

## Overview

ฐานข้อมูลทั้งหมดอยู่ใน Google Spreadsheet เดียว แต่ละ Sheet = 1 table
แถวแรกของทุก Sheet = header row (ชื่อ column)
แถว 2 เป็นต้นไป = ข้อมูล

### Key Relationships

```
HOSPITAL ──── USERS (hosp_code)
HOSPITAL ──── FACILITIES (hosp_code)
FACILITIES ── EQUIPMENT (hosp_code)
FACILITIES ── READINESS_LOG (hosp_code)
FACILITIES ── CLINIC_SCHEDULE (hosp_code)
FACILITIES ── VISIT_SUMMARY (hosp_code)

VISIT_SUMMARY ── VISIT_MEDS (vn)
VISIT_SUMMARY ── FOLLOWUP (vn)

MASTER_DRUGS ── VISIT_MEDS (drug_name)
USERS ──────── AUDIT_LOG (user_id)
```

---

## Sheet: `HOSPITAL`

Master รหัสสถานพยาบาล ใช้ตรวจสอบตอนสมัคร/login และกำหนด role สูงสุด

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| hosp_code | text | ✔ | PK รหัสมาตรฐาน สป.สช. เช่น 00588 |
| hosp_name | text | ✔ | ชื่อสถานพยาบาล |
| hosp_type | text | ✔ | `สสอ.` / `รพ.` / `รพ.สต.` |
| active | Y/N | ✔ | Y = รับสมัคร User ได้ |

**ตัวอย่างข้อมูลเริ่มต้น:**

| hosp_code | hosp_name | hosp_type | active |
|---|---|---|---|
| 00588 | สำนักงานสาธารณสุขอำเภอสอง | สสอ. | Y |
| 11111 | โรงพยาบาลสอง | รพ. | Y |
| 10669 | รพ.สต.นาหลวง | รพ.สต. | Y |
| 10670 | รพ.สต.สะเอียบ | รพ.สต. | Y |
| ... | ... | รพ.สต. | Y |

---

## Sheet: `USERS`

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| user_id | text | ✔ | PK auto-generate (UUID v4) |
| hosp_code | text | ✔ | FK → HOSPITAL.hosp_code |
| first_name | text | ✔ | |
| last_name | text | ✔ | |
| tel | text | ✔ | เบอร์โทรส่วนตัว |
| password_hash | text | ✔ | SHA-256 hash ห้ามเก็บ plain text |
| role | text | ✔ | `super_admin` / `admin_hosp` / `staff_hosp` / `staff_hsc` |
| status | text | ✔ | `pending` / `active` / `inactive` |
| approved_by | text | | user_id ของคนอนุมัติ |
| session_token | text | | token ปัจจุบัน (ส่งผ่าน query param หรือ body เท่านั้น) |
| session_expires | datetime | | หมดอายุ 8 ชั่วโมงหลัง login |
| created_at | datetime | ✔ | |
| last_login | datetime | | |

**หมายเหตุ:** 1 hosp_code มีได้หลาย user account (เจ้าหน้าที่หลายคนในสถานพยาบาลเดียวกัน) GAS login match ด้วย `hosp_code + password_hash` — ถ้ามีหลาย user ที่ใช้ hosp_code เดียวกัน แต่ละคนต้องมี password ต่างกัน

---

## Sheet: `FACILITIES`

ข้อมูลพื้นฐาน รพ.สต. แต่ละแห่ง

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| hosp_code | text | ✔ | PK FK → HOSPITAL.hosp_code |
| hosp_name | text | ✔ | |
| contact_name | text | | ผู้รับผิดชอบประจำแห่ง |
| contact_tel | text | | เบอร์ติดต่อแห่ง |
| active | Y/N | ✔ | |

---

## Sheet: `EQUIPMENT`

อุปกรณ์ Telemed ประจำแห่ง (soft delete ด้วย status = inactive)

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| equip_id | text | ✔ | PK auto-generate |
| hosp_code | text | ✔ | FK → FACILITIES.hosp_code |
| set_type | text | ✔ | `A` = คอม+กล้อง+ไมค์ / `B` = โน๊ตบุ๊ค |
| device_type | text | ✔ | `computer` / `notebook` / `camera` / `mic` |
| os | text | | `Windows 11` / `Windows 10` / `macOS` |
| status | text | ✔ | `ready` / `maintenance` / `broken` / `inactive` |
| is_backup | Y/N | ✔ | Y = อุปกรณ์สำรอง |
| software | text | | comma-separated: `MOPH Meet,Google Meet,Zoom,MS Teams,Line` |
| internet_mbps | number | | ความเร็ว internet |
| responsible_person | text | | ชื่อผู้รับผิดชอบเครื่อง |
| responsible_tel | text | | เบอร์ผู้รับผิดชอบเครื่อง |
| note | text | | |
| updated_at | datetime | ✔ | |
| updated_by | text | ✔ | user_id |

---

## Sheet: `READINESS_LOG`

บันทึกผลตรวจความพร้อมอุปกรณ์ก่อนวันบริการ

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| log_id | text | ✔ | PK auto-generate |
| hosp_code | text | ✔ | FK → FACILITIES.hosp_code |
| check_date | date | ✔ | วันที่ตรวจ (ก่อนวันบริการ 1 วัน) |
| cam_ok | Y/N | ✔ | กล้องผ่าน |
| mic_ok | Y/N | ✔ | ไมค์ผ่าน |
| pc_ok | Y/N | ✔ | เปิดเครื่องได้ |
| internet_ok | Y/N | ✔ | internet เสถียร |
| software_ok | Y/N | ✔ | ซอฟต์แวร์พร้อม |
| overall_status | text | ✔ | `ready` / `need_fix` / `not_ready` |
| note | text | | หมายเหตุ |
| checked_by | text | ✔ | user_id |
| checked_at | datetime | ✔ | |

**Design note:** READINESS_LOG ใช้ `hosp_code + check_date` เป็น composite key (ไม่ใช่ schedule_id) หมายความว่า 1 รพ.สต. มีได้ 1 readiness record ต่อวัน ซึ่งตรงกับ Assumption ที่ว่า 1 แห่งมีคลินิกเดียวต่อวัน ถ้าในอนาคตมี 2 คลินิกต่อวันในแห่งเดียวกัน ต้องเพิ่ม `schedule_id` FK ใน READINESS_LOG

---

## Sheet: `CLINIC_SCHEDULE`

ตารางคลินิก Telemed รายวัน

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| schedule_id | text | ✔ | PK auto-generate |
| service_date | date | ✔ | วันที่ให้บริการ |
| hosp_code | text | ✔ | FK → FACILITIES.hosp_code |
| clinic_type | text | ✔ | `PCU-DM` / `PCU-HT` / `ANC-nutrition` / `ANC-parent` / `postpartum-EPI` / `postpartum-dev` |
| service_time | text | ✔ | เช่น `09.00-10.00` |
| appoint_count | number | ✔ | จำนวนนัด (กรอกตอนสร้าง) |
| telemed_link | text | | URL ของ session |
| link_added_by | text | | FK → USERS.user_id (ผู้แนบ link) |
| incident_note | text | | เหตุขัดข้องระหว่างบริการ |
| updated_at | datetime | ✔ | |

**หมายเหตุ:** `actual_count` ไม่เก็บที่นี่
GAS คำนวณ realtime: `นับ VISIT_SUMMARY ที่ service_date + hosp_code + clinic_type ตรงกัน และ attended = Y`

**Assumption ของ actual_count:**
สูตรคำนวณนี้ถือว่า 1 รพ.สต. มีได้เพียง 1 clinic_type ต่อ 1 วัน ซึ่งตรงกับตารางจริงของ คปสอ.สอง (พ.ค.–มิ.ย. 2569) ถ้าในอนาคตมีการจัด 2 คลินิกต่างประเภทในแห่งเดียวกันวันเดียวกัน การคำนวณยังถูกต้องเพราะ filter ด้วย `clinic_type` ด้วย แต่ถ้าจัด 2 session **ประเภทเดียวกัน** ในเวลาต่างกัน ต้องเพิ่ม `schedule_id` เข้าใน VISIT_SUMMARY เพื่อแยก session

---

## Sheet: `MASTER_DRUGS`

คลังชื่อยาสำหรับ dropdown ใน Module 5

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| drug_id | text | ✔ | PK auto-generate |
| drug_name | text | ✔ | ชื่อยา generic |
| strength | text | ✔ | เช่น `500 mg` |
| unit | text | ✔ | เช่น `เม็ด` |
| active | Y/N | ✔ | Y = แสดงใน dropdown |

---

## Sheet: `VISIT_SUMMARY`

สรุปข้อมูล 1 row ต่อ 1 visit (1 ผู้ป่วย ต่อ 1 วันบริการ)

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| vn | text | ✔ | PK เลขเปิด visit จาก HosXP (unique) |
| hn | text | ✔ | |
| patient_name | text | ✔ | |
| dob | date | ✔ | วันเกิด (คำนวณอายุ) |
| tel | text | ✔ | เบอร์โทรผู้ป่วย สำหรับ Module 6 |
| clinic_type | text | ✔ | ระบุต่อรายบุคคลตอน import |
| hosp_code | text | ✔ | FK → FACILITIES.hosp_code |
| service_date | date | ✔ | |
| attended | Y/N | | Y = มาจริง / N = ไม่มา / ว่าง = ยังไม่บันทึก (default หลัง import รอบ 1) |
| has_drug_change | Y/N | | Y = มียาที่เปลี่ยน (is_changed = Y ใน VISIT_MEDS) |
| drug_source_pending | Y/N | | Y = มียาที่รอส่งจาก รพ. (source = hosp_pending) |
| dispensing_confirmed | Y/N | | Y = รพ.สต. ยืนยันการจ่ายยาแล้ว |
| import_round1_at | datetime | | เวลา import รอบ 1 |
| import_round2_at | datetime | | เวลา import รอบ 2 |
| diff_status | text | | `pending` / `matched` / `mismatch` |
| confirmed_by | text | | user_id ที่ยืนยัน |
| confirmed_at | datetime | | |

**Design decision:** VISIT_SUMMARY เชื่อมกับ CLINIC_SCHEDULE ผ่าน `service_date + hosp_code + clinic_type` แทน `schedule_id` เพื่อความยืดหยุ่น หากในอนาคตต้องการ link ตรง ให้เพิ่ม `schedule_id` FK

---

## Sheet: `VISIT_MEDS`

รายการยา 1 row ต่อ 1 รายการยา ต่อ 1 visit

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| med_id | text | ✔ | PK auto-generate |
| vn | text | ✔ | FK → VISIT_SUMMARY.vn |
| drug_name | text | ✔ | FK → MASTER_DRUGS.drug_name |
| strength | text | ✔ | |
| qty | number | ✔ | |
| unit | text | ✔ | |
| sig | text | ✔ | วิธีกิน |
| source | text | ✔ | `hsc_stock` / `hosp_stock` / `hosp_pending` |
| is_changed | Y/N | ✔ | Y = เปลี่ยนจากรายการเบื้องต้น |
| round | number | ✔ | `1` = import รอบแรก / `2` = import ยืนยัน |
| status | text | ✔ | `draft` / `confirmed` / `cancelled` |
| note | text | | |
| updated_by | text | ✔ | user_id |
| updated_at | datetime | ✔ | |

**source values:**
- `hsc_stock` — ยาจากคลัง รพ.สต. จ่ายได้ทันที
- `hosp_stock` — ยาจาก รพ. ที่อยู่ใน batch แล้ว **(ค่า default ของทุกรายการใน import รอบ 1)**
- `hosp_pending` — รพ. จะส่งมาภายหลัง → trigger `drug_source_pending = Y` ใน VISIT_SUMMARY

**หมายเหตุ drug_name FK Policy:**
`VISIT_MEDS.drug_name` อ้างอิงถึง `MASTER_DRUGS.drug_name` โดยใช้ชื่อยาเป็น reference key (ไม่ใช่ drug_id) เพราะ Google Sheets ไม่มี FK constraint ข้อตกลงคือ `drug_name` ใน MASTER_DRUGS ห้ามแก้ไขหลังจากมีข้อมูลใน VISIT_MEDS แล้ว ถ้าต้องการเปลี่ยนชื่อยาให้ set `active = N` แล้วสร้าง record ใหม่แทน

---

## Sheet: `FOLLOWUP`

บันทึกการติดตาม case โดยพยาบาล สสอ.

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| followup_id | text | ✔ | PK auto-generate |
| vn | text | ✔ | FK → VISIT_SUMMARY.vn |
| followup_date | date | ✔ | วันที่โทรติดตาม |
| general_condition | text | | อาการทั่วไป |
| side_effect | text | | ผลข้างเคียงยา (เน้นยาที่ is_changed = Y) |
| drug_adherence | text | | ความร่วมมือกินยา |
| other_note | text | | อื่นๆ |
| recorded_by | text | ✔ | user_id |
| recorded_at | datetime | ✔ | |

---

## Sheet: `AUDIT_LOG`

บันทึกทุก action ที่เปลี่ยนแปลงข้อมูล ดูได้เฉพาะ super_admin

| column | type | required | หมายเหตุ |
|---|---|:---:|---|
| log_id | text | ✔ | PK auto-generate |
| user_id | text | ✔ | FK → USERS.user_id |
| action | text | ✔ | `CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `IMPORT` / `APPROVE` |
| module | text | ✔ | ชื่อ Sheet / Module ที่เกิดการกระทำ |
| target_id | text | | ID ของ record ที่ถูกกระทำ |
| old_value | text | | JSON string ค่าก่อนเปลี่ยน |
| new_value | text | | JSON string ค่าหลังเปลี่ยน |
| created_at | datetime | ✔ | |

---

## Sheet: `SETTINGS`

การตั้งค่าระบบ แก้ไขได้เฉพาะ super_admin

| key | value (ตัวอย่าง) | หมายเหตุ |
|---|---|---|
| telegram_bot_token | 123456:ABCdef... | |
| telegram_chat_id | -1001234567890 | group chat ID |
| alert_time | 07:00 | เวลาส่งแจ้งเตือน |
| system_name | Telemed Tracking คปสอ.สอง | แสดงใน header |
| telegram_active | Y | Y = เปิดการแจ้งเตือน |
| app_url | https://telemed-song.pages.dev | URL ของ Cloudflare Pages ใช้แนบใน Telegram message |

---

## TypeScript Interfaces Reference

```typescript
// types/facility.ts
interface Facility {
  hosp_code: string     // PK FK → HOSPITAL.hosp_code
  hosp_name: string
  contact_name?: string
  contact_tel?: string
  active: 'Y' | 'N'
}

// types/hospital.ts
interface Hospital {
  hosp_code: string
  hosp_name: string
  hosp_type: 'สสอ.' | 'รพ.' | 'รพ.สต.'
  active: 'Y' | 'N'
}

// types/user.ts
type UserRole = 'super_admin' | 'admin_hosp' | 'staff_hosp' | 'staff_hsc'
type UserStatus = 'pending' | 'active' | 'inactive'

interface User {
  user_id: string
  hosp_code: string
  first_name: string
  last_name: string
  tel: string
  // password_hash ไม่อยู่ใน interface เพราะไม่ส่งออก frontend
  role: UserRole
  status: UserStatus
  approved_by?: string
  // session_token และ session_expires ใช้ใน GAS เท่านั้น ไม่ส่งออก frontend
  created_at: string
  last_login?: string
}

// types/equipment.ts
type EquipSetType = 'A' | 'B'
type EquipStatus = 'ready' | 'maintenance' | 'broken' | 'inactive'

interface Equipment {
  equip_id: string
  hosp_code: string
  set_type: EquipSetType
  device_type: 'computer' | 'notebook' | 'camera' | 'mic'
  os?: string
  status: EquipStatus
  is_backup: 'Y' | 'N'
  software?: string
  internet_mbps?: number
  responsible_person?: string
  responsible_tel?: string
  note?: string
  updated_at: string
  updated_by: string
}

// types/visit.ts
type ClinicType = 'PCU-DM' | 'PCU-HT' | 'ANC-nutrition' | 'ANC-parent' | 'postpartum-EPI' | 'postpartum-dev'
type DiffStatus = 'pending' | 'matched' | 'mismatch'
type DrugSource = 'hsc_stock' | 'hosp_stock' | 'hosp_pending'
type MedStatus = 'draft' | 'confirmed' | 'cancelled'

interface VisitSummary {
  vn: string
  hn: string
  patient_name: string
  dob: string
  tel: string
  clinic_type: ClinicType
  hosp_code: string
  service_date: string
  attended?: 'Y' | 'N'
  has_drug_change?: 'Y' | 'N'
  drug_source_pending?: 'Y' | 'N'
  dispensing_confirmed?: 'Y' | 'N'
  import_round1_at?: string
  import_round2_at?: string
  diff_status?: DiffStatus
  confirmed_by?: string
  confirmed_at?: string
}

interface VisitMed {
  med_id: string
  vn: string
  drug_name: string
  strength: string
  qty: number
  unit: string
  sig: string
  source: DrugSource
  is_changed: 'Y' | 'N'
  round: 1 | 2
  status: MedStatus
  note?: string
  updated_by: string
  updated_at: string
}

// types/drug.ts
interface MasterDrug {
  drug_id: string
  drug_name: string
  strength: string
  unit: string
  active: 'Y' | 'N'
}


// types/readiness.ts
type OverallStatus = 'ready' | 'need_fix' | 'not_ready'

interface ReadinessLog {
  log_id: string
  hosp_code: string
  check_date: string       // YYYY-MM-DD
  cam_ok: 'Y' | 'N'
  mic_ok: 'Y' | 'N'
  pc_ok: 'Y' | 'N'
  internet_ok: 'Y' | 'N'
  software_ok: 'Y' | 'N'
  overall_status: OverallStatus
  note?: string
  checked_by: string       // user_id
  checked_at: string
}

// types/schedule.ts
interface ClinicSchedule {
  schedule_id: string    // PK จาก CLINIC_SCHEDULE
  service_date: string
  hosp_code: string
  clinic_type: ClinicType
  service_time: string
  appoint_count: number
  telemed_link?: string
  link_added_by?: string // user_id
  incident_note?: string
  updated_at: string
  actual_count?: number  // computed จาก VISIT_SUMMARY ไม่เก็บใน Sheet
  // หมายเหตุ: ไม่มี updated_by เพราะ link_added_by เป็น field เดียวที่ track ผู้แก้ไข link
}

// types/followup.ts
interface Followup {
  followup_id: string
  vn: string
  followup_date: string
  general_condition?: string
  side_effect?: string
  drug_adherence?: string
  other_note?: string
  recorded_by: string
  recorded_at: string
}

// types/auditLog.ts
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT' | 'APPROVE'

interface AuditLog {
  log_id: string
  user_id: string        // FK → USERS.user_id (ผู้กระทำ action)
  action: AuditAction
  module: string
  target_id?: string
  old_value?: string     // JSON string
  new_value?: string     // JSON string
  created_at: string
}

```
