# FEATURES.md — Feature List
# Telemed Tracking คปสอ.สอง v1.1.0

## สถานะ Features

| สัญลักษณ์ | ความหมาย |
|---|---|
| [ ] | ยังไม่ได้พัฒนา |
| [x] | พัฒนาแล้ว |
| [-] | บางส่วน / In Progress |

---

## Auth — ระบบ Login / Register

- [ ] หน้า Register กรอก hosp_code, password, ชื่อ, นามสกุล, เบอร์โทร
- [ ] ตรวจสอบ hosp_code ว่าอยู่ใน HOSPITAL และ active = Y
- [ ] hosp_type กำหนด role สูงสุดที่สมัครได้
- [ ] บันทึก status = pending รอ Admin อนุมัติ
- [ ] หน้า Login กรอกเพียง hosp_code + password
- [ ] GAS สร้าง session token หมดอายุ 8 ชั่วโมง
- [ ] เก็บ token ใน sessionStorage
- [ ] ส่ง token ทุก request ใน query param (GET) หรือ body (POST) — ห้ามใส่ใน header
- [ ] Logout ลบ token ทั้งฝั่ง client และ GAS
- [ ] แสดง error ที่ชัดเจนเมื่อ login ผิดหรือ pending

---

## Users — จัดการผู้ใช้งาน

- [ ] แสดงรายการ User รอ approve (super_admin เห็นทุกแห่ง / admin_hosp เห็นเฉพาะ รพ.+รพ.สต.)
- [ ] อนุมัติ User + กำหนด role
- [ ] ปฏิเสธ / ระงับ User
- [ ] แก้ไข role ของ User ที่มีอยู่แล้ว
- [ ] แสดงรายการ User ทั้งหมดพร้อม filter ตาม hosp_code, role, status
- [ ] super_admin จัดการ User ทุกระดับทุกหน่วยงาน
- [ ] admin_hosp จัดการได้เฉพาะ staff_hosp และ staff_hsc

---

## Module 1 — ทะเบียนอุปกรณ์

- [ ] แสดงรายการอุปกรณ์ทุกแห่ง (super_admin / admin_hosp / staff_hosp)
- [ ] แสดงรายการอุปกรณ์เฉพาะแห่งตนเอง (staff_hsc)
- [ ] เพิ่มอุปกรณ์ชุด A (คอมพิวเตอร์ตั้งโต๊ะ + กล้อง USB + ไมค์แยก)
- [ ] เพิ่มอุปกรณ์ชุด B (โน๊ตบุ๊ค built-in กล้อง+ไมค์)
- [ ] ระบุ OS, สถานะ (พร้อมใช้/ซ่อมบำรุง/ชำรุด)
- [ ] ระบุอุปกรณ์สำรอง (is_backup = Y)
- [ ] ระบุซอฟต์แวร์ที่ติดตั้ง (checkbox: MOPH Meet, Google Meet, Zoom, MS Teams, Line)
- [ ] ระบุความเร็ว internet (Mbps)
- [ ] ระบุผู้รับผิดชอบเครื่องและเบอร์โทร
- [ ] แก้ไขข้อมูลอุปกรณ์
- [ ] Soft delete (เปลี่ยน status = inactive ไม่ลบ row)
- [ ] แสดงสถานะรวมของแต่ละแห่งบน dashboard card

---

## Module 2 — ตรวจสอบความพร้อม

- [ ] Telegram Bot แจ้งเตือนอัตโนมัติ 07:00 น. วันก่อนมีคลินิก
- [ ] ข้อความแจ้งเตือนระบุแห่ง, คลินิก, จำนวนนัด, สถานะอุปกรณ์ปัจจุบัน, ลิงก์ checklist
- [ ] หน้า checklist แสดงรายการ รพ.สต. ที่มีคลินิกวันถัดไป
- [ ] บันทึก checklist: cam_ok, mic_ok, pc_ok, internet_ok, software_ok
- [ ] สถานะสรุปอัตโนมัติจากกฎ: `ready` = ทุก field Y / `not_ready` = pc_ok=N หรือ internet_ok=N / `need_fix` = field อื่นเป็น N แต่ pc_ok และ internet_ok ยัง Y
- [ ] ช่องหมายเหตุ
- [ ] แสดงประวัติการตรวจย้อนหลังรายแห่ง
- [ ] filter แสดงเฉพาะแห่งที่ยังไม่ได้ตรวจวันนี้

---

## Module 3 — ตารางคลินิกและ Telemed Link

- [ ] สร้างตารางคลินิก: วันที่, ประเภทคลินิก, รพ.สต., เวลา, จำนวนนัด
- [ ] แสดงตารางรายสัปดาห์/รายเดือน
- [ ] staff_hosp ขึ้นไปแนบ Telemed Link ต่อ session
- [ ] staff_hsc กดเปิด Telemed Link จากหน้านี้ได้เลย
- [ ] แสดงจำนวนผู้มาจริง (computed realtime จาก VISIT_SUMMARY)
- [ ] บันทึกเหตุขัดข้องระหว่างบริการ
- [ ] แจ้งเตือนถ้า session ยังไม่มี Telemed Link ใกล้วันบริการ
- [ ] filter ตาม รพ.สต. / คลินิก / เดือน

---

## Master Drug — จัดการคลังชื่อยา

**Path:** `/master-drugs` | **Access:** super_admin, admin_hosp

- [ ] แสดงรายการยาทั้งหมดใน MASTER_DRUGS พร้อม filter active/inactive
- [ ] Import Master Drug List จาก Excel (super_admin / admin_hosp)
- [ ] เพิ่มยาใหม่รายตัวผ่านฟอร์ม (drug_name, strength, unit)
- [ ] แก้ไขข้อมูลยา (ห้ามแก้ drug_name ถ้ามีข้อมูลใน VISIT_MEDS แล้ว)
- [ ] ปิดใช้งานยา (active = N) แทนการลบ เพื่อรักษา data integrity
- [ ] ค้นหาและกรองรายการยา
- [ ] แสดงคำเตือนถ้าพยายามแก้ drug_name ที่มีข้อมูลใน VISIT_MEDS แล้ว

---

## Module 4 — Import ข้อมูลผู้ป่วย

- [ ] อัปโหลดไฟล์ Excel (.xlsx) จาก HosXP
- [ ] SheetJS parse Excel ใน browser ก่อน upload
- [ ] ตรวจสอบ column headers ให้ตรงกับ format ที่กำหนด
- [ ] เลือก รพ.สต., วันที่, ประเภทคลินิก (batch level)
- [ ] Preview table แสดงข้อมูลทุก row ก่อน confirm
- [ ] แก้ไข clinic_type รายบุคคลใน preview
- [ ] ตรวจสอบ drug_name ว่าอยู่ใน MASTER_DRUGS (แจ้งเตือนถ้าไม่มี)
- [ ] ตรวจสอบ VN ซ้ำ (import รอบ 1) / VN ต้องมีอยู่แล้ว (import รอบ 2)
- [ ] confirm นำเข้า → GAS บันทึกลง VISIT_SUMMARY + VISIT_MEDS ด้วย default: source=hosp_stock, is_changed=N, round=1, status=draft
- [ ] Import รอบ 2: match VN diff ยา flag mismatch อัตโนมัติ
- [ ] แสดงสรุปผลหลัง import: นำเข้าสำเร็จ X รายการ, ข้อผิดพลาด Y รายการ

---

## Module 5 — ยืนยันรายการยาจริง

- [ ] แสดงรายชื่อผู้ป่วยของวันที่เลือก กรองตาม role (staff_hsc เห็นเฉพาะแห่งตน) — `visitSummary.list` ต้องไม่ส่ง `tel` กลับ (แสดงเฉพาะใน Module 6)
- [ ] กดเข้าดูรายละเอียดยาต่อผู้ป่วยแต่ละคน
- [ ] กรณีที่ 1: กด "ยืนยัน" ทั้งหมดเมื่อยาไม่เปลี่ยน
- [ ] กรณีที่ 2: Edit รายการยาที่ปรับ → เลือกยาใหม่จาก Master Drug dropdown/autocomplete
- [ ] กรณีที่ 3: เพิ่มยาใหม่ → เลือกจาก Master Drug
- [ ] กรณีที่ 4: กด "ไม่มารับบริการ" → attended = N
- [ ] ระบุแหล่งยา: คลัง รพ.สต. / ยาของ รพ. / ส่งมาจาก รพ. ภายหลัง
- [ ] ระบบ auto-update is_changed, has_drug_change, drug_source_pending, dispensing_confirmed
- [ ] แสดง badge สถานะแต่ละ visit (รอยืนยัน / ยืนยันแล้ว / ไม่มา)
- [ ] filter ตามวันที่ / รพ.สต. / สถานะการยืนยัน
- [ ] แสดงสรุป: ยืนยันแล้ว X / ยังค้าง Y / ไม่มา Z

---

## Module 6 — ติดตาม Case

- [ ] แสดงรายชื่อผู้ป่วยที่ต้องติดตาม (`dispensing_confirmed = Y` AND ไม่มีใน FOLLOWUP = "รอติดตาม")
- [ ] แสดงเบอร์โทรพร้อม link tel: สำหรับโทรได้บนมือถือ
- [ ] แสดงรายการยาจริงที่ได้รับ
- [ ] highlight ยาที่ is_changed = Y (ต้องถามผลข้างเคียงเพิ่ม)
- [ ] highlight ยาที่ source = hosp_pending (ต้องตรวจว่าได้รับแล้วหรือยัง)
- [ ] บันทึก: followup_date, general_condition, side_effect, drug_adherence, other_note
- [ ] แสดง badge ว่า "ติดตามแล้ว" หรือ "รอติดตาม"
- [ ] filter ตาม รพ.สต. / คลินิก / สถานะ / วันที่บริการ
- [ ] แสดงประวัติการติดตามย้อนหลังต่อ visit

---

## Dashboard สาธารณะ

- [ ] URL แยก เข้าได้โดยไม่ต้อง login
- [ ] สถานะอุปกรณ์รายแห่ง: พร้อม/ไม่พร้อม + วันตรวจล่าสุด
- [ ] ตารางนัดล่วงหน้า 7 วัน
- [ ] จำนวน session รายเดือน
- [ ] อัตราการมาตามนัด (%) แยกคลินิก
- [ ] อัตราการมาตามนัด (%) แยก รพ.สต.
- [ ] Pipeline ติดตาม case: ติดตามแล้ว / ค้าง (ตัวเลขรวม ไม่แสดงรายบุคคล)
- [ ] ไม่แสดง ชื่อผู้ป่วย, เบอร์, VN, HN, รายการยารายบุคคล

---

## Settings

- [ ] กรอก Telegram Bot Token
- [ ] กรอก Telegram Chat ID
- [ ] กรอก Web App URL (app_url) สำหรับแนบใน Telegram message
- [ ] ตั้งเวลาแจ้งเตือน (default 07:00)
- [ ] ชื่อระบบที่แสดงใน header
- [ ] Toggle เปิด/ปิดการแจ้งเตือน
- [ ] ปุ่ม "ทดสอบส่ง Telegram" ก่อนใช้งานจริง
- [ ] เฉพาะ super_admin เข้าได้

---

## Shared / Common Features

- [ ] Responsive design รองรับมือถือ (พยาบาลใช้โทรศัพท์ติดตาม)
- [ ] แสดงวันที่ในรูปแบบ พ.ศ. (พ.ศ. 2569) ผ่าน `dateUtils.ts` ใน src/utils/
- [ ] Loading state ทุก async action
- [ ] Error handling แสดง error message ที่เข้าใจได้
- [ ] Confirm dialog ก่อน delete / action สำคัญ
- [ ] Toast notification หลัง save สำเร็จ
- [ ] RoleGuard component ป้องกัน route ที่ไม่มีสิทธิ์
- [ ] Redirect อัตโนมัติเมื่อ session หมดอายุ
- [ ] GAS API visitMeds.list ไม่ส่ง `tel` และ `hn` กลับ (เฉพาะ followup.list เท่านั้นที่ส่ง)
- [ ] Audit Log บันทึกทุก action ที่เปลี่ยนแปลงข้อมูล
- [ ] Zod schema validate ทุก GAS API response ก่อนนำไปใช้ใน component
- [ ] GAS fetch wrapper (api.ts) ไม่ set Content-Type header — ใช้ text/plain (Simple Request) เสมอ
- [ ] Token ส่งใน query param (GET) หรือ body (POST) เท่านั้น ห้ามใส่ใน header
