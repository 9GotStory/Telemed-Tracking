# Telemed Tracking คปสอ.สอง

ระบบติดตามการดำเนินงาน Telemedicine โรคเรื้อรัง สำนักงานสาธารณสุขอำเภอสอง จังหวัดแพร่

> ระบบนี้ **ไม่ใช่** ระบบ Telemedicine เอง แต่เป็นระบบ **ติดตาม/กำกับ** การดำเนินงานของ คปสอ.สอง

---

## ขอบเขตระบบ

ครอบคลุม รพ.สอง และ รพ.สต. 15 แห่งในอำเภอสอง จังหวัดแพร่

| Module | ชื่อ | ผู้ใช้หลัก |
|---|---|---|
| 1 | ทะเบียนอุปกรณ์ Telemed | ทุก role |
| 2 | ตรวจสอบความพร้อมก่อนวันบริการ | IT สสอ. |
| 3 | ตารางคลินิกและ Telemed Link | สสอ. / รพ. / รพ.สต. |
| 4 | Import ข้อมูลผู้ป่วยและรายการยา | IT สสอ. / Admin รพ. |
| 5 | ยืนยันรายการยาจริง | รพ.สต. / Staff รพ. |
| 6 | ติดตาม Case หลังบริการ | พยาบาล สสอ. |
| M | Master Drug Management | super_admin, admin_hosp |
| — | Dashboard สาธารณะ | สาธารณะ (ไม่ต้อง login) |

---

## Tech Stack

| ส่วน | เทคโนโลยี | Version |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Build | Vite | 8.x |
| Language | TypeScript | 5.x |
| Framework | React | 19.x |
| Routing | React Router | 7.x |
| UI | shadcn/ui + Tailwind CSS | 4.x |
| Global State | Zustand | 5.x |
| Async State | TanStack Query | 5.x |
| Form | React Hook Form + Zod | 7.x / 3.x |
| Excel | SheetJS (xlsx) | 0.18.x |
| Date | date-fns | 4.x |
| Backend | Google Apps Script | V8 Runtime |
| Database | Google Sheets | — |
| Notification | Telegram Bot API | — |
| Deploy | Cloudflare Pages | — |

---

## เริ่มต้นพัฒนา

### ความต้องการ

- Node.js 24 LTS
- npm หรือ pnpm
- Google Account สำหรับ GAS และ Sheets
- Telegram Bot Token (ขอจาก @BotFather)

### ติดตั้ง

```bash
git clone <repo-url>
cd telemed-tracking
npm install
```

### ตั้งค่า Environment

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:

```env
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_APP_URL=https://telemed-song.pages.dev
VITE_APP_NAME=Telemed Tracking คปสอ.สอง
VITE_DASHBOARD_PATH=/dashboard
```

### รัน Development

```bash
npm run dev
```

เปิด `http://localhost:5173`

### Build Production

```bash
npm run build
```

ไฟล์ output อยู่ใน `dist/`

---

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── ui/              shadcn/ui components
│   ├── layout/          Sidebar, Header, PageWrapper
│   └── common/          StatusBadge, ConfirmModal, RoleGuard
├── modules/
│   ├── auth/            Login, Register
│   ├── module1/         ทะเบียนอุปกรณ์
│   ├── module2/         ตรวจความพร้อม
│   ├── module3/         ตารางคลินิก
│   ├── module4/         Import ข้อมูล
│   ├── module5/         ยืนยันรายการยา
│   ├── module6/         ติดตาม Case
│   ├── dashboard/       Dashboard สาธารณะ
│   ├── users/           จัดการ User
│   └── settings/        ตั้งค่าระบบ
├── stores/              Zustand stores
├── hooks/               Custom React hooks
├── services/            GAS API calls
├── types/               TypeScript interfaces
├── utils/               helper functions
└── constants/           ค่าคงที่
```

---

## ระบบ Google Sheets (Backend Database)

Google Spreadsheet 1 ไฟล์ ประกอบด้วย 12 Sheet:

| Sheet | หน้าที่ |
|---|---|
| HOSPITAL | Master รหัสสถานพยาบาล |
| USERS | ข้อมูลผู้ใช้งาน |
| FACILITIES | ทะเบียน รพ.สต. |
| EQUIPMENT | อุปกรณ์ Telemed ประจำแห่ง |
| READINESS_LOG | บันทึกผลตรวจความพร้อม |
| CLINIC_SCHEDULE | ตารางคลินิก + Telemed Link |
| MASTER_DRUGS | คลังชื่อยา |
| VISIT_SUMMARY | สรุปข้อมูลผู้ป่วยต่อ visit |
| VISIT_MEDS | รายการยาต่อ visit |
| FOLLOWUP | บันทึกการติดตาม case |
| AUDIT_LOG | บันทึก action ทั้งหมด |
| SETTINGS | การตั้งค่าระบบ |

ดูโครงสร้างละเอียดใน [SCHEMA.md](./SCHEMA.md)

---

## สิทธิ์ผู้ใช้

| Role | ใช้งานโดย | ขอบเขต |
|---|---|---|
| `super_admin` | IT สสอ. | ทุกอย่าง + Logs + Settings |
| `admin_hosp` | Admin รพ.สอง | เหมือน super_admin ยกเว้น Logs/Settings/Users สสอ. |
| `staff_hosp` | Staff รพ.สอง | เห็นทุกแห่ง แก้ไขรายการยาได้ทุก รพ.สต. |
| `staff_hsc` | Staff รพ.สต. | เฉพาะแห่งตัวเองเท่านั้น |
| Dashboard | สาธารณะ | อ่านเฉพาะสถิติ ไม่มีข้อมูลรายบุคคล |

---

## การ Deploy

### Frontend (Cloudflare Pages)

1. Push code ขึ้น GitHub
2. เชื่อม repo กับ Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `dist`
5. ตั้งค่า Environment Variables ใน Cloudflare Dashboard

### Backend (Google Apps Script)

1. สร้าง Google Spreadsheet และ Apps Script project
2. Copy code จาก `backend/Code.gs` ไปยัง GAS editor
   (backend/ directory อยู่ที่ root ของ project นอก src/)
3. Deploy → New deployment → Web App
   - Execute as: Me
   - Who has access: Anyone
4. Copy Web App URL → ใส่ใน `VITE_GAS_API_URL`
5. ตั้งค่า Time-driven trigger สำหรับ Telegram แจ้งเตือน (07:00 น. ทุกวัน)

> **CORS Note:** GAS ไม่รองรับ preflight request (HTTP OPTIONS) ระบบนี้ใช้ Simple Request เท่านั้น
> GET ส่ง token ใน query param / POST ส่ง body เป็น JSON string โดยไม่ set Content-Type header
> ดูรายละเอียดใน [CLAUDE.md](./CLAUDE.md) และ [SPEC.md](./SPEC.md) Section 9

### ตั้งค่าครั้งแรก

1. กรอกข้อมูล `hosp_code` ของ รพ.สต. ทั้ง 15 แห่งลง Sheet `HOSPITAL`
2. Login ด้วย `super_admin` account แรก
3. เข้า Settings → กรอก Telegram Bot Token, Chat ID และ Web App URL (`app_url`) → ทดสอบส่ง Telegram
4. สร้าง User และกำหนด role ให้แต่ละแห่ง
5. Import Master Drug List จาก HosXP (ทำครั้งเดียว — ไปที่ /master-drugs แล้วเลือก Import Excel)
6. Import ตาราง Telemed (ใช้ข้อมูลจากภาพตาราง พ.ค.–มิ.ย. 2569)

---

## Flow การใช้งานประจำวัน

```
ก่อนวันบริการ:
  07:00 น. → Telegram แจ้งเตือน IT สสอ.
  IT สสอ. → ตรวจ checklist อุปกรณ์ (Module 2)
  รพ.สอง → Export Excel จาก HosXP
  IT/Admin → Import รอบ 1 (Module 4) เลือก รพ.สต. + วันที่ + คลินิก
  Staff รพ. → แนบ Telemed Link (Module 3)

วันบริการ:
  รพ.สต. → เปิด Web App → กด Telemed Link เข้า meeting
  ผู้ป่วย → Tele กับแพทย์ → แพทย์บันทึกลง HosXP
  รพ.สต. → ยืนยันรายการยา / แก้ไขถ้าหมอปรับยา (Module 5)

หลังวันบริการ:
  รพ.สอง → Export Excel รอบ 2 จาก HosXP
  IT/Admin → Import รอบ 2 ตรวจสอบ diff
  หลัง 3-7 วัน → พยาบาล สสอ. ติดตาม case (Module 6)
```

---

## เอกสารเพิ่มเติม

| ไฟล์ | เนื้อหา |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | คำแนะนำสำหรับ AI เมื่อทำงานในโปรเจกต์นี้ |
| [SPEC.md](./SPEC.md) | Technical Specification ละเอียด |
| [SCHEMA.md](./SCHEMA.md) | โครงสร้าง Google Sheets Database |
| [FEATURES.md](./FEATURES.md) | รายการ Features ทั้งหมด + สถานะ |

---

## ข้อมูลสถานพยาบาล

ตาราง Telemed โรคเรื้อรัง คปสอ.สอง (พ.ค.–มิ.ย. 2569) มี รพ.สต. 15 แห่ง ได้แก่
นาหลวง, สะเอียบ, ป่าเลา, นาไร่เดียว, ลูนิเกตุ, ห้วยหม้าย, ห้วยขอน, เตาปูน,
บ้านหนุน, วังดิน, หนองเสี้ยว, วังฟ่อน, หัวเมือง, ทุ่งน้าว, แดนชุมพล

---

*พัฒนาโดย สสอ.สอง จังหวัดแพร่*
