# CLAUDE.md — Telemed Tracking คปสอ.สอง
# v1.2.0 — อัปเดต UI/UX Design Policy & Spec-Driven Development

## Project Overview

ระบบติดตามการดำเนินงาน Telemedicine ของ สำนักงานสาธารณสุขอำเภอสอง (สสอ.สอง) จังหวัดแพร่
ไม่ใช่ระบบ Telemedicine เอง แต่เป็นระบบ **ติดตาม/กำกับ** การดำเนินงานของ คปสอ.สอง
ประกอบด้วย รพ.สอง + รพ.สต. 15 แห่งในอำเภอสอง

---

## Tech Stack (ห้ามเปลี่ยนโดยไม่ได้รับอนุญาต)

| ส่วน | เทคโนโลยี | Version |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Build Tool | Vite | 8.x |
| **Style Guide** | **DESIGN.md** | **Strictly Follow** |
| Language | TypeScript | 5.x (strict mode) |
| Framework | React | 19.x |
| Routing | React Router | 7.x |
| UI Library | shadcn/ui + Tailwind CSS | 4.x |
| Icons | Lucide React | Latest Stable |
| Global State | Zustand | 5.x |
| Async State | TanStack Query | 5.x |
| Form | React Hook Form + Zod | 7.x / 3.x |
| Excel Parser | SheetJS (xlsx) | 0.18.x |
| Date Utils | date-fns | 4.x |
| Backend | Google Apps Script (V8 Runtime) | — |
| Database | Google Sheets | — |
| Notification | Telegram Bot API | — |
| Deploy | Cloudflare Pages | — |

---

## UI/UX & Design Rules (Strict Enforcement)

- **Design System:** ต้องยึดถือมาตรฐานและโครงสร้าง Component ใน `DESIGN.md` เป็นกฎสูงสุดในการสร้าง UI
- **Aesthetic:** เน้นการออกแบบที่สะอาดตา (Clean & Modern) และปฏิบัติตาม Guideline เรื่องสีและฟอนต์อย่างเคร่งครัด
- **Component Consistency:** ใช้คอมโพเนนต์จาก `shadcn/ui` และ `Tailwind CSS` utility classes เท่านั้น ห้ามเขียน Custom CSS แยกต่างหากหากไม่จำเป็นอย่างยิ่ง เพื่อให้ง่ายต่อการดูแลรักษา

---

## GitHub Spec Kit Workflow

โปรเจกต์นี้ใช้แนวทาง **Spec-Driven Development (SDD)** ผ่านคำสั่ง `/speckit`:
1. **Constitution:** ยึดกฎข้อบังคับสูงสุดจากไฟล์นี้ (`CLAUDE.md`) และ `DESIGN.md` (ห้ามละเมิดเรื่อง GAS CORS และ UI/UX)
2. **Specification:** อ้างอิงบริบททางธุรกิจและฟีเจอร์จาก `README.md` และ `FEATURES.md`
3. **Planning:** วางแผนสถาปัตยกรรมและ State Management ผ่าน `SPEC.md` และ `SCHEMA.md`
4. **Execution:** AI Agent จะอ่านบริบทจากไฟล์หน่วยความจำที่ถูกสร้างขึ้นอัตโนมัติเมื่อรัน `/speckit.tasks` และ `/speckit.implement`

---

## Project Structure

```
backend/
└── Code.gs          # Google Apps Script — GAS backend (deploy แยกต่างหากผ่าน GAS editor)
src/
├── components/
│   ├── ui/              # shadcn/ui components (ห้ามแก้ไขโดยตรง ใช้ shadcn CLI)
│   ├── layout/          # Sidebar, Header, PageWrapper
│   └── common/          # StatusBadge, ConfirmModal, LoadingSpinner, RoleGuard
├── modules/
│   ├── auth/            # Login, Register
│   ├── module1/         # ทะเบียนอุปกรณ์
│   ├── module2/         # ตรวจสอบความพร้อม
│   ├── module3/         # ตารางคลินิก + Telemed Link
│   ├── module4/         # Import ข้อมูลผู้ป่วย
│   ├── module5/         # ยืนยันรายการยา
│   ├── module6/         # ติดตาม Case
│   ├── master-drugs/    # จัดการคลังชื่อยา
│   ├── dashboard/       # Dashboard สาธารณะ (ไม่ต้อง login)
│   ├── users/           # จัดการ User
│   └── settings/        # ตั้งค่าระบบ
├── stores/
│   ├── authStore.ts     # user, role, hosp_code, session token
│   └── uiStore.ts       # sidebar state, notifications
├── hooks/               # Custom React hooks
├── services/
│   ├── api.ts           # GAS fetch wrapper หลัก (ต้องผ่านนี้เสมอ)
│   ├── authService.ts
│   ├── equipmentService.ts
│   ├── visitService.ts
│   ├── followupService.ts
│   ├── usersService.ts
│   ├── settingsService.ts
│   ├── dashboardService.ts
│   ├── drugService.ts       # จัดการ masterDrug.* API actions (list, save, delete, import)
│   └── scheduleService.ts
├── types/               # TypeScript interfaces ทั้งหมด
│   ├── hospital.ts
│   ├── user.ts
│   ├── equipment.ts
│   ├── visit.ts
│   ├── drug.ts
│   ├── schedule.ts
│   ├── readiness.ts
│   ├── facility.ts
│   ├── auditLog.ts
│   └── followup.ts
├── utils/
│   ├── dateUtils.ts     # format วันที่ พ.ศ./ค.ศ.
│   ├── excelParser.ts   # SheetJS wrapper
│   └── roleGuard.ts     # ตรวจสิทธิ์ตาม role
└── constants/
    ├── roles.ts
    ├── clinicTypes.ts
    └── drugSources.ts
```

---

## Role System

| Role | ค่าใน code | ใช้งานโดย |
|---|---|---|
| `super_admin` | super_admin | IT สสอ. |
| `admin_hosp` | admin_hosp | Admin รพ.สอง |
| `staff_hosp` | staff_hosp | จนท./พยาบาล รพ.สอง |
| `staff_hsc` | staff_hsc | จนท./พยาบาล รพ.สต. |
| Dashboard | ไม่มี login | สาธารณะ |

- `staff_hsc` เห็นและแก้ไขได้เฉพาะ `hosp_code` ของตัวเองเท่านั้น (filter ทุก query ทั้ง Frontend และ GAS)
- `staff_hosp` ขึ้นไปเห็นข้อมูลทุกแห่ง
- `super_admin` เท่านั้นที่ดู Audit Logs และตั้งค่าระบบได้

---

## GAS Communication Pattern (สำคัญมาก)

GAS Web App มีข้อจำกัด CORS ที่ต้องเข้าใจและปฏิบัติตามอย่างเคร่งครัด

### ทำไม GAS ถึงมีปัญหา CORS

Browser แบ่ง request เป็น 2 ประเภท

**Simple Request** ส่งตรงได้โดยไม่มี preflight OPTIONS ก่อน เงื่อนไขคือ
- Method เป็น GET หรือ POST
- Content-Type เป็น `text/plain`, `application/x-www-form-urlencoded`, หรือ `multipart/form-data`
- ไม่มี custom header เพิ่มเติม

**Preflighted Request** browser ส่ง OPTIONS ก่อน ซึ่ง GAS ตอบไม่ได้ → CORS error ทันที เกิดขึ้นเมื่อ
- ใช้ `Content-Type: application/json`
- มี custom header เช่น `X-Session-Token`, `Authorization`

### กฎที่ต้องปฏิบัติตามทุก request

**GET — อ่านข้อมูล**
Token และ params ทั้งหมดส่งเป็น query string ไม่มี header ใดๆ

```typescript
// ✅ ถูกต้อง
const url = `${GAS_URL}?action=visitMeds.list&token=${token}&hosp_code=${hospCode}`
const res = await fetch(url)

// ❌ ผิด — custom header ทำให้เกิด preflight
const res = await fetch(url, { headers: { 'X-Session-Token': token } })
```

**POST — เขียนข้อมูล**
Body เป็น JSON string แต่ไม่ set Content-Type header
Token อยู่ใน body ไม่ใช่ header

```typescript
// ✅ ถูกต้อง — Content-Type เป็น text/plain โดย default
const res = await fetch(GAS_URL, {
  method: 'POST',
  body: JSON.stringify({ action: 'visitMeds.save', token: sessionToken, data: { ... } })
  // ห้ามใส่ headers ใดๆ
})

// ❌ ผิด — application/json ทำให้เกิด preflight
const res = await fetch(GAS_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
})
```

### GAS รับ body ด้วย e.postData.contents

```javascript
// Code.gs
function doPost(e) {
  const payload = JSON.parse(e.postData.contents) // รับ text/plain body
  const { token, action, data } = payload

  const user = validateSession(token)
  if (!user) return buildResponse({ success: false, error: 'Unauthorized' })
  return routeAction(action, data, user)
}

function doGet(e) {
  // e.parameter เป็น GAS special object ไม่รองรับ spread operator
  // ต้องใช้ e.parameter.key โดยตรง
  const token  = e.parameter.token
  const action = e.parameter.action

  const user = validateSession(token)
  if (!user) return buildResponse({ success: false, error: 'Unauthorized' })
  return routeAction(action, e.parameter, user)
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
  // GAS set Access-Control-Allow-Origin: * อัตโนมัติเมื่อ Deploy as "Anyone can access"
}
```

### services/api.ts — Base Fetch Wrapper

```typescript
const GAS_URL = import.meta.env.VITE_GAS_API_URL

function getToken(): string {
  return sessionStorage.getItem('session_token') ?? ''
}

// GET — token ใน query param
// หมายเหตุ: return type เป็น unknown — caller ต้อง validate ด้วย Zod schema ก่อนใช้งาน
export async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ action, token: getToken(), ...params })
  const res = await fetch(`${GAS_URL}?${query}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'GAS error')
  return json.data as T  // caller ต้อง: const data = MySchema.parse(await gasGet(...))
}

// POST — token ใน body, ไม่ set Content-Type header
// หมายเหตุ: caller ต้อง validate response ด้วย Zod ก่อนใช้งาน
export async function gasPost<T>(action: string, data: unknown = {}): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action, token: getToken(), data })
    // ห้ามใส่ headers ใดๆ
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'GAS error')
  return json.data as T  // caller ต้อง: const data = MySchema.parse(await gasPost(...))
}
```

### ตาราง pattern สรุป

| Method | Content-Type | Token อยู่ที่ | ใช้กับ | ผล CORS |
|---|---|---|---|---|
| GET | ไม่มี | query param | อ่านข้อมูล | ✅ ผ่าน |
| POST | text/plain (default) | body | เขียน/แก้ไข | ✅ ผ่าน |
| POST | application/json | ใดๆ | ห้ามใช้กับ GAS | ❌ preflight fail |
| GET/POST | ใดๆ | header | ห้ามใช้กับ GAS | ❌ preflight fail |

---

## Key Business Rules

### VN (Visit Number)
- VN คือเลขเปิด visit จาก HosXP ของ รพ.สอง เป็น unique ต่อ 1 การมาพบแพทย์
- ใช้เป็น primary key ของ `VISIT_SUMMARY` และ `VISIT_MEDS`
- ห้ามสร้าง VN เอง ต้องมาจาก HosXP เสมอ

### hosp_code
- รหัสมาตรฐาน สป.สช. ใช้ระบุสถานพยาบาลทุกแห่ง
- ตัวอย่าง: `00588` = สสอ.สอง, `11111` = รพ.สอง, `10669` = รพ.สต.นาหลวง
- ใช้เป็น login credential คู่กับ password
- ต้องตรงกับ Sheet `HOSPITAL` เท่านั้น ถ้าไม่ตรงสมัคร/login ไม่ได้

### Session Token
- เก็บใน `sessionStorage` เท่านั้น (ไม่ใช้ localStorage หรือ cookie)
- ส่งใน body (POST) หรือ query param (GET) เท่านั้น ห้ามใส่ใน header
- อายุ 8 ชั่วโมง GAS ตรวจ `session_expires` ทุก request
- Logout ต้อง clear ทั้ง sessionStorage และ GAS Sheet (session_token = '')

### drug source
- `hosp_stock` — ยาของ รพ. ที่อยู่ใน batch **(default สำหรับทุกรายการใน import รอบ 1)**
- `hosp_pending` — ยาที่ รพ. จะส่งมาภายหลัง → flag ให้พยาบาลติดตาม

### drug_name FK Policy
- VISIT_MEDS อ้างอิง MASTER_DRUGS ด้วย `drug_name` (natural key ไม่ใช่ drug_id)
- ห้ามเปลี่ยน `drug_name` ใน MASTER_DRUGS ถ้ามีข้อมูลใน VISIT_MEDS แล้ว
- การ "ลบ" ยาออกจาก dropdown ให้ set `active = N` ไม่ใช่ลบ row

### actual_count (Module 3)
- ไม่เก็บใน `CLINIC_SCHEDULE` โดยตรง
- GAS คำนวณ realtime: นับ VISIT_SUMMARY ที่ service_date + hosp_code + clinic_type ตรงกัน และ attended = Y
- Assumption: 1 รพ.สต. มีได้เพียง 1 clinic_type ต่อ 1 วัน (ตรงกับตารางจริง คปสอ.สอง)

### Soft Delete
- อุปกรณ์ Module 1: เปลี่ยน status = inactive ไม่ลบ row จริง
- Master Drug: เปลี่ยน active = N ไม่ลบ row จริง

### Data Visibility — Security
- tel และ hn ของผู้ป่วย: แสดงได้เฉพาะ Module 6 (admin_hosp ขึ้นไปเท่านั้น)
- GAS action visitMeds.list ต้อง exclude tel และ hn จาก response
- Dashboard สาธารณะ: GAS กรอง sensitive fields ทั้งหมดออกก่อน response

---

## TypeScript Rules

- ใช้ strict mode ทั้งหมด ("strict": true ใน tsconfig)
- ห้ามใช้ any ยกเว้นจำเป็นจริงๆ และต้อง comment อธิบาย
- ทุก GAS response ต้องมี Zod schema validate ก่อนนำไปใช้
- Interface ทั้งหมดอยู่ใน src/types/ แยกตาม domain

---

## Environment Variables

```env
VITE_GAS_API_URL=[https://script.google.com/macros/s/xxx/exec](https://script.google.com/macros/s/xxx/exec)
VITE_APP_URL=[https://telemed-song.pages.dev](https://telemed-song.pages.dev)
VITE_APP_NAME=Telemed Tracking คปสอ.สอง
VITE_DASHBOARD_PATH=/dashboard
```

| Variable | ใช้ใน |
|---|---|
| VITE_GAS_API_URL | services/api.ts — endpoint ของ GAS Web App |
| VITE_APP_URL | GAS SETTINGS sheet key app_url — ใช้แนบใน Telegram message |
| VITE_APP_NAME | Header, title ของ Web App |
| VITE_DASHBOARD_PATH | Route ของ Dashboard สาธารณะ |

---

## Naming Conventions

- Components: PascalCase (VisitMedsTable.tsx)
- Hooks: camelCase ขึ้นต้นด้วย use (useVisitMeds.ts)
- Services: camelCase ลงท้ายด้วย Service (visitService.ts)
- Stores: camelCase ลงท้ายด้วย Store (authStore.ts)
- Constants: SCREAMING_SNAKE_CASE (CLINIC_TYPES, DRUG_SOURCES)
- Types/Interfaces: PascalCase (VisitSummary, VisitMed)
- GAS action names: module.verb เช่น visitMeds.list, equipment.save

---

## DO NOT

- **ห้าม** ใช้ Content-Type: application/json กับ GAS → preflight CORS error
- **ห้าม** ใส่ token หรือข้อมูลใดๆ ใน request header เมื่อเรียก GAS
- **ห้าม** เก็บ password หรือ token ใน localStorage หรือ state ใดๆ
- **ห้าม** แสดงข้อมูลผู้ป่วย (ชื่อ, เบอร์, VN, HN) ใน Dashboard สาธารณะ
- **ห้าม** staff_hsc เห็นข้อมูลแห่งอื่น ต้อง filter ทั้ง Frontend และ GAS
- **ห้าม** แก้ไขไฟล์ใน src/components/ui/ โดยตรง ให้ใช้ shadcn CLI
- **ห้าม** เปลี่ยน tech stack หรือละเมิด UI/UX Guidelines ใน `DESIGN.md` โดยไม่ได้รับอนุญาต
- **ห้าม** เรียก GAS โดยตรงจาก component ให้ผ่าน services/api.ts เสมอ
- **ห้าม** ลบ row จริงใน MASTER_DRUGS (`active = N`) หรือ EQUIPMENT (`status = inactive`) ให้ใช้ soft delete เสมอ
- **ห้าม** สร้าง VN เอง ต้องมาจาก HosXP เสมอ

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/001-telemed-tracking-spec/plan.md
<!-- SPECKIT END -->
