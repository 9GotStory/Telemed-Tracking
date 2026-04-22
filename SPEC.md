# SPEC.md — Technical Specification
# Telemed Tracking คปสอ.สอง v1.1.0

## 1. System Overview

### วัตถุประสงค์
ระบบติดตามการดำเนินงาน Telemedicine โรคเรื้อรัง คปสอ.สอง จังหวัดแพร่
ครอบคลุม รพ.สอง และ รพ.สต. 15 แห่งในอำเภอสอง

### สิ่งที่ระบบทำ
- ติดตามความพร้อมอุปกรณ์ Telemed แต่ละแห่ง
- บริหารตารางคลินิกและ Telemed Link
- นำเข้าข้อมูลผู้ป่วยและรายการยาจาก HosXP (Excel)
- บันทึกยาจริงที่ผู้ป่วยได้รับ และตรวจสอบกับข้อมูลจาก รพ.
- ติดตาม case หลังบริการโดยพยาบาล สสอ.
- แสดง Dashboard สถิติสาธารณะ

### สิ่งที่ระบบ **ไม่** ทำ
- ไม่ใช่ระบบ Telemedicine (ไม่มี video call)
- ไม่เชื่อมต่อ HosXP โดยตรง (รับข้อมูลผ่าน Excel export)
- ไม่ใช่ระบบ EMR หรือ HIS

---

## 2. Architecture

```
[React + TypeScript]  →  HTTPS/JSON  →  [Google Apps Script]
   Cloudflare Pages                         Web App URL
                                               ↓
                                        [Google Sheets]
                                         (ฐานข้อมูล)

[Telegram Bot API]  ←  GAS Time Trigger  (แจ้งเตือน IT)
```

### Frontend
- Static Site บน Cloudflare Pages
- React 19 + TypeScript 5 (strict)
- Vite 8 เป็น build tool
- shadcn/ui + Tailwind CSS 4 เป็น UI layer
- Zustand 5 จัดการ session/auth state
- TanStack Query 5 จัดการ async data + cache

### Backend (Google Apps Script)
- Runtime: V8
- Entry point: `doGet(e)` และ `doPost(e)`
- Auth: ตรวจสอบ session token ทุก request (token อยู่ใน query param หรือ body เท่านั้น)
- Response: JSON เสมอ `{ success: boolean, data: unknown, error?: string }` ผ่าน `ContentService.createTextOutput()` (Frontend ต้อง validate ด้วย Zod ก่อนใช้)
- CORS: GAS set `Access-Control-Allow-Origin: *` อัตโนมัติเมื่อ Deploy as "Anyone can access"
- ข้อจำกัดสำคัญ: GAS ไม่รองรับ HTTP OPTIONS (preflight) — ดู Section 9 GAS CORS Strategy

### Database (Google Sheets)
- 1 Spreadsheet = ระบบทั้งหมด
- แต่ละ Sheet = 1 table
- ดูโครงสร้างละเอียดใน SCHEMA.md

---

## 3. Authentication & Authorization

### Registration Flow
1. ผู้ใช้กรอก `hosp_code`, password, ชื่อ, นามสกุล, เบอร์โทร
2. GAS ตรวจสอบ `hosp_code` ใน Sheet `HOSPITAL` (ต้องมีและ `active = Y`)
3. `hosp_type` ใน `HOSPITAL` กำหนด role สูงสุดที่สมัครได้
4. บันทึกลง `USERS` ด้วย `status = pending` — 1 hosp_code มีได้หลาย user account (ไม่มีการ reject ถ้า hosp_code ซ้ำ)
5. Super Admin หรือ Admin รพ. อนุมัติและกำหนด role

### Login Flow
1. ผู้ใช้กรอก `hosp_code` + password
2. GAS ตรวจสอบ hash และ `status = active`
3. GAS สร้าง session token ด้วย `Utilities.getUuid()` (cryptographically secure ใน GAS V8)
4. บันทึก token ใน Sheet `USERS` ช่อง `session_token` + `session_expires`
5. Frontend เก็บ token ใน `sessionStorage`
6. ทุก request ส่ง token ใน query param (GET) หรือ body (POST) — ห้ามใส่ใน header (ดู Section 9)

**Login Error Cases:**
- `hosp_code` ไม่มีใน HOSPITAL → `{ success: false, error: "Invalid credentials" }`
- password ผิด → `{ success: false, error: "Invalid credentials" }` (ไม่บอกว่าผิดตรงไหน)
- `status = pending` → `{ success: false, error: "Account pending approval" }`
- `status = inactive` → `{ success: false, error: "Account disabled" }`

### Role Permissions Matrix

| Permission | super_admin | admin_hosp | staff_hosp | staff_hsc |
|---|:---:|:---:|:---:|:---:|
| จัดการ Users ทุกระดับ | ✔ | ✘ | ✘ | ✘ |
| จัดการ Users รพ./รพ.สต. | ✔ | ✔ | ✘ | ✘ |
| อนุมัติ User ใหม่ | ✔ | ✔ | ✘ | ✘ |
| Import Excel (Module 4) | ✔ | ✔ | บางส่วน | ✘ |
| จัดการ Master Drug | ✔ | ✔ | ✘ | ✘ |
| แนบ Telemed Link | ✔ | ✔ | ✔ | ✘ |
| เห็นข้อมูลทุกแห่ง | ✔ | ✔ | ✔ | เฉพาะแห่งตน |
| จัดการอุปกรณ์ Module 1 | ✔ | ✔ | ✔ | เฉพาะแห่งตน |
| เพิ่ม/แก้ไข/ลบ รายการยา | ✔ | ✔ | ✔ (ทุกแห่ง) | เฉพาะแห่งตน |
| Module 6 ติดตาม case | ✔ | ✔ | ✘ | ✘ |
| ดู Audit Logs | ✔ | ✘ | ✘ | ✘ |
| ตั้งค่าระบบ | ✔ | ✘ | ✘ | ✘ |

### hosp_type → role สูงสุดที่สมัครได้

| hosp_type | role สูงสุด |
|---|---|
| สสอ. | super_admin |
| รพ. | admin_hosp (admin_hosp สามารถ assign role staff_hosp ให้ผู้ใช้ใน hosp_code เดียวกันได้ผ่านหน้า Users) |
| รพ.สต. | staff_hsc |

---

## 4. Module Specifications

### Auth — Login / Register

**Path:** `/login`, `/register`
**Access:** สาธารณะ (ไม่ต้อง login)

ดูรายละเอียด Registration/Login Flow ใน Section 3

---

### Users — จัดการผู้ใช้งาน

**Path:** `/users`
**Access:** super_admin (ทุก User) / admin_hosp (เฉพาะ staff_hosp และ staff_hsc)

**Features:**
- แสดงรายการ User รอ approve และ User ทั้งหมด (admin_hosp เห็นเฉพาะ staff_hosp และ staff_hsc ทุกแห่ง ไม่เห็น super_admin)
- อนุมัติ User + กำหนด role
- ปฏิเสธ / ระงับ User (users.update status=inactive)
- แก้ไข role ของ User ที่มีอยู่

**Sheets:** `USERS`, `HOSPITAL`

---

### Module 1 — ทะเบียนอุปกรณ์

**Path:** `/module1`
**Access:** ทุก role (staff_hsc เห็นเฉพาะแห่งตน)

**Features:**
- แสดงรายการอุปกรณ์กรองตาม role
- เพิ่ม/แก้ไข/ลบ (soft delete → `status = inactive`)
- ชุดอุปกรณ์ 2 แบบ: A (คอม+กล้อง+ไมค์) / B (โน๊ตบุ๊ค built-in)
- ระบุ OS, สถานะ, ซอฟต์แวร์, internet_mbps, ผู้รับผิดชอบ

**Sheets:** `EQUIPMENT`, `FACILITIES`

---

### Module 2 — ตรวจสอบความพร้อม

**Path:** `/module2`
**Access:** super_admin เป็นหลัก (IT สสอ.) / admin_hosp เข้าได้เพื่อกำกับดูแล แต่ผู้ตรวจหลักคือ super_admin

**Features:**
- Telegram Bot แจ้งเตือนอัตโนมัติ 07:00 น. วันก่อนมีคลินิก
- ข้อความแจ้งเตือนประกอบด้วย ชื่อ รพ.สต., คลินิก, จำนวนนัด, สถานะอุปกรณ์, ลิงก์ checklist
- บันทึก checklist: cam_ok, mic_ok, pc_ok, internet_ok, software_ok, overall_status, note

**กฎคำนวณ `overall_status` อัตโนมัติ:**
- `ready` — ทุก field เป็น Y ทั้งหมด
- `not_ready` — `pc_ok = N` หรือ `internet_ok = N` (อุปกรณ์หลักล้มเหลว ไม่สามารถให้บริการได้)
- `need_fix` — มีบาง field เป็น N แต่ไม่ใช่ pc_ok หรือ internet_ok (ยังพอให้บริการได้แต่ควรแก้ไข)

**Trigger:** GAS Time-driven trigger ทุกวัน 07:00 น.

**Sheets:** `READINESS_LOG`, `CLINIC_SCHEDULE`

---

### Module 3 — ตารางคลินิกและ Telemed Link

**Path:** `/module3`
**Access:** ดู = ทุก role / เพิ่มตาราง = super_admin, admin_hosp / แนบ Link = staff_hosp ขึ้นไป / บันทึกผล = ทุก role

**Features:**
- สร้างตารางคลินิก: วันที่, ประเภทคลินิก, รพ.สต., เวลา, จำนวนนัด
- แนบ Telemed Link (MOPH Meet / Google Meet / Zoom / MS Teams) ต่อ session
- staff_hsc กดเปิด link ได้จากหน้านี้โดยตรง
- actual_count คำนวณ realtime จาก VISIT_SUMMARY (ไม่เก็บใน Sheet นี้)
- บันทึกเหตุขัดข้องระหว่างบริการ

**ประเภทคลินิก:**
- `PCU-DM` — เบาหวาน
- `PCU-HT` — ความดันโลหิตสูง
- `ANC-nutrition` — ANC โภชนาการ
- `ANC-parent` — ANC พ่อแม่
- `postpartum-EPI` — หลังคลอด EPI
- `postpartum-dev` — หลังคลอด พัฒนาการเด็ก

**Sheets:** `CLINIC_SCHEDULE`, `VISIT_SUMMARY` (read-only สำหรับคำนวณ actual_count)

---

### Master Drug Management — จัดการคลังชื่อยา

**Path:** `/master-drugs`
**Access:** super_admin, admin_hosp

**Features:**
- แสดงรายการยาทั้งหมด พร้อม filter active/inactive
- เพิ่มยาใหม่รายตัวผ่านฟอร์ม (drug_name, strength, unit)
- แก้ไขข้อมูลยา — ห้ามแก้ `drug_name` ถ้ามีข้อมูลใน VISIT_MEDS แล้ว
- ปิดใช้งานยา (soft delete → `active = N`) ไม่ลบ row
- Import Master Drug List จาก Excel (masterDrug.import)

**Sheets:** `MASTER_DRUGS`, `VISIT_MEDS` (ตรวจสอบ FK ก่อนอนุญาตแก้ drug_name)

---

### Module 4 — Import ข้อมูลผู้ป่วยและรายการยา

**Path:** `/module4`
**Access:** super_admin, admin_hosp / staff_hosp ที่ถูก admin_hosp กำหนด role ให้เข้าได้ (GAS ตรวจสอบจาก USERS.role — role staff_hosp เข้าได้โดยอัตโนมัติ)

**Excel Format (ไฟล์ที่ 1 — ก่อนวันบริการ):**
1 แถวต่อ 1 รายการยา ต่อ 1 ผู้ป่วย

| column | ประเภท |
|---|---|
| vn | text |
| hn | text |
| patient_name | text |
| dob | date (DD/MM/YYYY **ปี พ.ศ.**) |
| tel | text |
| drug_name | text |
| strength | text |
| qty | number |
| unit | text |
| sig | text |

**Import Flow (2 ขั้นตอน):**
1. เลือก รพ.สต. + วันที่รับบริการ + ประเภทคลินิก (batch level) → อัปโหลดไฟล์
2. ระบบแสดง preview table → แก้ไข clinic_type รายบุคคลได้ → confirm → นำเข้า

**ค่า default ของ VISIT_MEDS เมื่อ import รอบ 1:**
- `source = hosp_stock` — ยาทุกตัวในรอบ 1 มาจาก batch ที่ รพ.สอง เตรียมมา
- `is_changed = N` — ยังไม่มีการปรับเปลี่ยน
- `round = 1`
- `status = draft` — รอ รพ.สต. ยืนยัน

**Import รอบที่ 2 (หลังวันบริการ):**
- Format เดียวกัน
- GAS match ด้วย VN แล้ว diff รายการยากับรอบ 1
- `diff_status = matched` ถ้าตรง / `mismatch` ถ้าไม่ตรง / `pending` ก่อน import รอบ 2
- เมื่อ `mismatch`: super_admin หรือ admin_hosp ต้องตรวจสอบด้วยตัวเอง โดยเปรียบเทียบข้อมูลใน Module 5 กับ import รอบ 2 แล้วแก้ไขผ่าน visitMeds.save

**Excel Format (Master Drug — ครั้งเดียว):**

| column | ประเภท |
|---|---|
| drug_name | text |
| strength | text |
| unit | text |
| active | Y/N |

**Sheets:** `VISIT_SUMMARY`, `VISIT_MEDS`, `MASTER_DRUGS`

---

### Module 5 — ยืนยันรายการยาจริง

**Path:** `/module5`
**Access:** staff_hsc (เฉพาะแห่งตน) / staff_hosp ขึ้นไป (ทุกแห่ง)

**Flow:**
- เปิดมาเห็นรายชื่อผู้ป่วย default = วันนี้ (service_date = today) กรองตาม role
- กดเข้าคนไข้แต่ละคน เห็นรายการยาเบื้องต้น

**กรณีที่ 1 — ยาไม่เปลี่ยน:** กด "ยืนยัน" ทั้งหมด

**กรณีที่ 2 — ปรับยา:** Edit → เลือกยาใหม่จาก Master Drug dropdown → ระบุ source → Save

**กรณีที่ 3 — เพิ่มยาใหม่:** "เพิ่มยา" → เลือกจาก Master Drug → ระบุ source (ไม่มี default — user ต้องเลือกเองเสมอ) → Save

**กรณีที่ 4 — ผู้ป่วยไม่มา:** กด "ไม่มารับบริการ" → `attended = N` ใน VISIT_SUMMARY และ VISIT_MEDS ทุกรายการของ VN นั้นจะถูก set `status = cancelled`

**drug source (3 ค่า):**
- `hsc_stock` — คลัง รพ.สต.
- `hosp_stock` — ยาของ รพ. ที่มีอยู่แล้วใน batch
- `hosp_pending` — รพ. จะส่งมาภายหลัง → flag `drug_source_pending = Y`

**Auto-update หลัง confirm:**
- `is_changed = Y` สำหรับยาที่แก้/เพิ่ม
- `has_drug_change = Y` ใน VISIT_SUMMARY
- `drug_source_pending = Y` ใน VISIT_SUMMARY ถ้ามี hosp_pending
- `dispensing_confirmed = Y` ใน VISIT_SUMMARY

**Sheets:** `VISIT_MEDS`, `VISIT_SUMMARY`, `MASTER_DRUGS`

---

### Module 6 — ติดตาม Case

**Path:** `/module6`
**Access:** super_admin, admin_hosp เท่านั้น

**แสดงต่อ 1 visit:**
- ชื่อผู้ป่วย + เบอร์โทร (กดโทรได้บนมือถือ)
- รพ.สต. + คลินิก + วันที่บริการ
- รายการยาจริง + flag `is_changed = Y` (จาก VISIT_MEDS) + flag `drug_source_pending = Y` (จาก VISIT_SUMMARY — ยาบางตัวรอส่งจาก รพ.)

**บันทึก:**
- followup_date, general_condition, side_effect, drug_adherence, other_note

**Sheets:** `FOLLOWUP`, `VISIT_SUMMARY`, `VISIT_MEDS`

**หมายเหตุ:** "ติดตามแล้ว" = มี row ใน FOLLOWUP ที่ VN ตรงกัน / "รอติดตาม" = dispensing_confirmed=Y แต่ไม่มีใน FOLLOWUP — GAS ต้อง LEFT JOIN เพื่อแยกสถานะ

---

### Dashboard สาธารณะ

**Path:** `/dashboard` (URL แยก ไม่ต้อง login)
**Access:** ทุกคน

**แสดง:**
- สถานะอุปกรณ์รายแห่ง (พร้อม/ไม่พร้อม + วันตรวจล่าสุด)
- ตารางนัดล่วงหน้า 7 วัน
- สถิติการให้บริการรายเดือน
- อัตราการมาตามนัดแยกคลินิก/แยก รพ.สต.
- Pipeline ติดตาม case (ตัวเลขรวม ไม่แสดงรายบุคคล)

**ห้ามแสดง:** ชื่อผู้ป่วย, เบอร์โทร, VN, HN, รายการยารายบุคคล

---

### Settings

**Path:** `/settings`
**Access:** super_admin เท่านั้น

**ตั้งค่า:**
- Telegram Bot Token
- Telegram Chat ID
- Web App URL (`app_url`) — URL ของ Cloudflare Pages ใช้แนบใน Telegram message
- เวลาแจ้งเตือน (default 07:00)
- ชื่อระบบ
- เปิด/ปิดการแจ้งเตือน
- ปุ่ม "ทดสอบส่ง Telegram"

---

## 5. API Design (GAS Endpoints)

GAS รับ request เดียวทุกอย่างผ่าน `doGet()` / `doPost()` โดยใช้ query parameter `action` เป็นตัวแยก

### Request Format

```
GET  https://script.google.com/macros/s/{ID}/exec?action=xxx&token=yyy&param=zzz
     (token และ params ทั้งหมดอยู่ใน query string ไม่มี header ใดๆ)

POST https://script.google.com/macros/s/{ID}/exec
     Body (text/plain): { "action": "xxx", "token": "yyy", "data": { ... } }
     (ห้ามใส่ Content-Type: application/json และห้ามใส่ header ใดๆ — ดู Section 9)
```

### Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

> **หมายเหตุ:** `data` type คือ `unknown` (TypeScript) — Frontend ต้อง validate ด้วย Zod schema ก่อนนำไปใช้เสมอ ห้ามใช้ `as any` หรือ cast โดยไม่ validate

### Actions หลัก

| Action | Method | Module |
|---|---|---|
| `auth.login` | POST | Auth — response data: `{ token, role, hosp_code, first_name, last_name }` |
| `auth.register` | POST | Auth |
| `auth.logout` | POST | Auth — GAS ต้อง clear `session_token` และ `session_expires` ใน USERS sheet |
| `users.list` | GET | Users |
| `users.approve` | POST | Users |
| `users.update` | POST | Users — แก้ไข role/status |
| `equipment.list` | GET | Module 1 |
| `equipment.save` | POST | Module 1 — เพิ่ม/แก้ไข |
| `equipment.delete` | POST | Module 1 — soft delete (status = inactive) |
| `readiness.list` | GET | Module 2 — ดูประวัติการตรวจ |
| `readiness.save` | POST | Module 2 — บันทึก checklist |
| `schedule.list` | GET | Module 3 |
| `schedule.save` | POST | Module 3 |
| `schedule.setLink` | POST | Module 3 — แนบ Telemed Link |
| `schedule.recordIncident` | POST | Module 3 — บันทึกเหตุขัดข้อง |
| `masterDrug.list` | GET | Module 4/5 — dropdown ยา |
| `masterDrug.import` | POST | Module 4 — import Master Drug |
| `masterDrug.save` | POST | Master Drug — เพิ่ม/แก้ไขยารายตัว |
| `masterDrug.delete` | POST | Master Drug — ปิดใช้งานยา (soft delete: `active = N`) |
| `import.preview` | POST | Module 4 — server-side validate: เช็ค VN ซ้ำ + drug_name ใน MASTER_DRUGS (preview UI ทำใน browser ด้วย SheetJS ก่อนเรียก action นี้) |
| `import.confirm` | POST | Module 4 — นำเข้าจริง (body ระบุ `round: 1` หรือ `round: 2` เพื่อแยก logic) |
| `visitSummary.list` | GET | Module 5 — รายชื่อผู้ป่วยตาม hosp_code + service_date (ไม่ส่ง `tel` กลับ) |
| `visitMeds.list` | GET | Module 5 — รายการยาต่อ visit **ไม่ส่ง `tel` และ `hn` กลับ** |
| `visitMeds.save` | POST | Module 5 |
| `followup.list` | GET | Module 6 |
| `followup.save` | POST | Module 6 |
| `dashboard.stats` | GET | Dashboard — aggregate จาก EQUIPMENT, CLINIC_SCHEDULE, VISIT_SUMMARY, FOLLOWUP; "case ค้าง" = dispensing_confirmed=Y AND ไม่มีใน FOLLOWUP (LEFT JOIN) |
| `settings.get` | GET | Settings |
| `settings.save` | POST | Settings |

---

## 6. Excel Import Specification

### SheetJS Flow (Frontend)

```
อัปโหลดไฟล์ .xlsx
    ↓ SheetJS parse ใน browser (ไม่ upload ก่อน)
    ↓ validate column headers
    ↓ group rows ตาม VN
    ↓ แสดง preview table (แก้ไข clinic_type รายบุคคลได้)
    ↓ ผู้ใช้ confirm
    ↓ ส่ง JSON ไป GAS action=import.confirm
    ↓ GAS บันทึกลง VISIT_SUMMARY + VISIT_MEDS
```

### Validation Rules

- VN ต้องไม่ซ้ำกับที่มีอยู่ใน `VISIT_SUMMARY` (import รอบ 1)
- VN ต้องมีอยู่ใน `VISIT_SUMMARY` แล้ว (import รอบ 2)
- `drug_name` ต้องตรงกับ `MASTER_DRUGS` (หรือแจ้งเตือนให้เพิ่ม master ก่อน)
- `tel` ต้องเป็นตัวเลข 9-10 หลัก
- `dob` ต้องเป็น date ที่ valid
- `qty` ต้องเป็น positive integer (> 0)
- `hn` ต้องไม่ว่าง
- `drug_name` + `strength` + `unit` ต้องไม่เป็น empty string
- แถวที่มี VN เดียวกันต้องมี `hn`, `patient_name`, `dob`, `tel` ตรงกันทุกแถว หากไม่ตรงให้ reject ทั้ง VN นั้น

---

## 7. Notification: Telegram Bot

### Trigger
GAS Time-driven trigger ทุกวัน 07:00 น.

### Logic
1. ดึง `CLINIC_SCHEDULE` ที่ `service_date = วันพรุ่งนี้` — ถ้าไม่มีรายการ ให้หยุดทำงาน (skip) ไม่ส่งข้อความ
2. JOIN กับ `FACILITIES` โดยใช้ `hosp_code` เพื่อดึง `hosp_name` สำหรับใส่ใน message
3. สำหรับแต่ละ schedule ดึงสถานะอุปกรณ์จาก `EQUIPMENT` + `READINESS_LOG`
4. ถ้า `SETTINGS.telegram_active = Y` → ส่งข้อความไป `telegram_chat_id`

### รูปแบบข้อความ

```
[Telemed สสอ.สอง] แจ้งเตือน {วันที่}
มีคลินิก {clinic_type} ที่ {hosp_name} เวลา {service_time}
จำนวนนัด: {appoint_count} ราย
สถานะอุปกรณ์: {overall_status}
→ ตรวจสอบ: {app_url}/module2
```

`{app_url}` ดึงมาจาก SETTINGS sheet key `app_url` ในเวลา runtime ของ GAS (GAS ไม่สามารถอ่าน env var ของ Frontend ได้)

### ตั้งค่า
กรอก Bot Token และ Chat ID ผ่านหน้า Settings ใน Web App
ทดสอบด้วยปุ่ม "ทดสอบส่ง"

---

## 8. Security Considerations

- Password เก็บเป็น hash ด้วย SHA-256 + salt (หรือ stronger เช่น bcrypt ถ้า GAS รองรับ) ห้ามเก็บ plain text และห้ามใช้ plain SHA-256 โดยไม่มี salt
- Session token มีอายุ 8 ชั่วโมง หมดอายุต้อง login ใหม่
- staff_hsc ทุก query ต้อง filter ด้วย hosp_code เสมอ ทั้งฝั่ง Frontend และ GAS
- Dashboard สาธารณะ GAS ต้องกรองข้อมูล sensitive ออกก่อน response
- ข้อมูล `tel` และ `hn` ของผู้ป่วยแสดงได้เฉพาะ Module 6 (admin_hosp ขึ้นไปเท่านั้น) GAS action `visitMeds.list` ต้อง exclude `tel` และ `hn` ออกจาก response ก่อนส่งกลับ
- Audit Log บันทึกทุก action ที่เปลี่ยนแปลงข้อมูล
- เมื่อ GAS ตรวจพบ token หมดอายุหรือไม่ถูกต้อง ให้ return `{ success: false, error: "Unauthorized" }` Frontend ต้องตรวจ error นี้และ redirect ไป `/login` อัตโนมัติ

---

## 9. GAS CORS Strategy

GAS Web App ไม่รองรับ HTTP OPTIONS (preflight request) ซึ่ง browser ส่งก่อนทุก request ที่มี
`Content-Type: application/json` หรือ custom header ดังนั้นต้องใช้ Simple Request เท่านั้น

### กฎ Simple Request ที่ GAS รองรับ

| Method | Content-Type | Token | ใช้กับ | ผล CORS |
|---|---|---|---|---|
| GET | ไม่มี | query param | อ่านข้อมูล | ✅ ผ่าน |
| POST | text/plain (default) | body | เขียน/แก้ไข | ✅ ผ่าน |
| POST | application/json | ใดๆ | ห้ามใช้ | ❌ fail |
| GET/POST | ใดๆ | header | ห้ามใช้ | ❌ fail |

### Pattern สำหรับ GET

```typescript
// token และ params ทั้งหมดอยู่ใน query string
// ข้อควรระวัง: params ต้องไม่มี key ชื่อ "action" หรือ "token" เพราะจะทับค่าที่ set ไว้
const query = new URLSearchParams({ action, token: getToken(), ...params })
const res = await fetch(`${GAS_URL}?${query}`)
// ไม่มี headers option ใดๆ
```

### Pattern สำหรับ POST

```typescript
// ไม่ set headers — Content-Type จะเป็น text/plain โดย default
// token อยู่ใน body ไม่ใช่ header
const res = await fetch(GAS_URL, {
  method: 'POST',
  body: JSON.stringify({ action, token: getToken(), data })
})
```

### GAS รับ body ด้วย e.postData.contents

```javascript
function doPost(e) {
  const payload = JSON.parse(e.postData.contents) // รับ text/plain body เป็น JSON
  const { token, action, data } = payload
  const user = validateSession(token)
  if (!user) return buildResponse({ success: false, error: 'Unauthorized' })
  return routeAction(action, data, user)
}

function doGet(e) {
  // e.parameter เป็น GAS special object ไม่รองรับ spread operator
  const token  = e.parameter.token
  const action = e.parameter.action
  const user = validateSession(token)
  if (!user) return buildResponse({ success: false, error: 'Unauthorized' })
  return routeAction(action, e.parameter, user)
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
```

---

## 10. Deployment

### Frontend (Cloudflare Pages)
```bash
npm run build          # Vite build → dist/
# Push to GitHub → Cloudflare Pages auto-deploy
```

### Backend (GAS)
```
# ตั้งค่าครั้งแรก:
clasp login            # เข้าสู่ระบบ Google
clasp clone <scriptId> # หรือสร้างใหม่ด้วย clasp create
# จากนั้น:
clasp push             # หรือ copy-paste ใน GAS editor
Deploy as Web App → Execute as: Me → Anyone can access
```

### Environment
```env
# .env.local (ไม่ commit)
VITE_GAS_API_URL=https://script.google.com/macros/s/xxx/exec
VITE_APP_URL=https://telemed-song.pages.dev
VITE_APP_NAME=Telemed Tracking คปสอ.สอง
VITE_DASHBOARD_PATH=/dashboard
```

- `VITE_GAS_API_URL` — GAS Web App endpoint สำหรับ API calls
- `VITE_APP_URL` — URL ของ Cloudflare Pages ที่ user เปิด ใช้ใน Telegram notification และต้องบันทึกลง `SETTINGS` sheet key `app_url` ด้วยเพื่อให้ GAS ใช้ได้
