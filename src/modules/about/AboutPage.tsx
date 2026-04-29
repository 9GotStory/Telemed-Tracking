import { Link } from 'react-router-dom'
import { useHospitalsList } from '@/hooks/useHospitals'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Activity,
  ArrowLeft,
  Building2,
  Database,
  Eye,
  FileText,
  Heart,
  Lock,
  MonitorSmartphone,
  Scale,
  Server,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'

const appName = import.meta.env.VITE_APP_NAME || 'Telemed Tracking'

const FEATURES = [
  {
    icon: Building2,
    title: 'ทะเบียนอุปกรณ์',
    desc: 'ติดตามสถานะอุปกรณ์ Telemedicine ของทุกสถานพยาบาล',
  },
  {
    icon: ShieldCheck,
    title: 'ตรวจสอบความพร้อม',
    desc: 'ตรวจสอบความพร้อมก่อนให้บริการ ทั้งกล้อง เสียง อินเทอร์เน็ต และซอฟต์แวร์',
  },
  {
    icon: Stethoscope,
    title: 'ตารางคลินิก',
    desc: 'จัดการตารางนัดหมายและลิงก์ Telemedicine สำหรับแต่ละวัน',
  },
  {
    icon: Users,
    title: 'นำเข้าข้อมูลผู้ป่วย',
    desc: 'นำเข้าข้อมูลผู้ป่วยจาก HosXP เพื่อเตรียมการให้บริการ',
  },
  {
    icon: Activity,
    title: 'ยืนยันรายการยา',
    desc: 'ยืนยันรายการยาที่ต้องจัดส่งให้ผู้ป่วยหลังการให้บริการ',
  },
  {
    icon: Heart,
    title: 'ติดตามผู้ป่วย',
    desc: 'ติดตามสภาวะผู้ป่วยหลังการให้บริการทาง Telemedicine',
  },
]

export default function AboutPage() {
  const { data: hospitals = [], isLoading } = useHospitalsList()

  const mainHosp = hospitals.find((h) => h.hosp_type === 'รพ.')
  const hscList = hospitals.filter((h) => h.hosp_type === 'รพ.สต.' || h.hosp_type === 'สสช.')
  const ssoList = hospitals.filter((h) => h.hosp_type === 'สสอ.')

  return (
    <div className="min-h-svh bg-[#f5f5f7]">
      {/* Hero */}
      <section className="bg-[#000000] text-white py-16">
        <div className="max-w-[980px] mx-auto px-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[#2997ff] text-sm mb-6 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้า Dashboard
          </Link>
          <h1
            className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.07]"
            style={{ letterSpacing: '-0.28px' }}
          >
            เกี่ยวกับระบบ
          </h1>
          <p className="text-white/70 mt-3 text-lg md:text-xl leading-relaxed max-w-2xl">
            {appName} — ระบบติดตามการดำเนินงาน Telemedicine
          </p>
        </div>
      </section>

      <div className="max-w-[980px] mx-auto px-4 py-10 flex flex-col gap-12">
        {/* วัตถุประสงค์ */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            วัตถุประสงค์ของระบบ
          </h2>
          <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
            <p className="text-[rgba(0,0,0,0.8)] leading-relaxed">
              ระบบนี้พัฒนาขึ้นเพื่อ <strong>ติดตามและกำกับดูแล</strong> การดำเนินงาน Telemedicine
              ของ <strong>คปสอ.สอง</strong> จังหวัดแพร่
              ครอบคลุมพื้นที่ <strong>โรงพยาบาลสอง</strong> <strong>รพ.สต.</strong> และ <strong>สสช.</strong> ในเขตอำเภอสอง
            </p>
            <p className="text-[rgba(0,0,0,0.8)] leading-relaxed mt-3">
              ระบบช่วยให้ผู้บริหารและบุคลากร ติดตามสถานะอุปกรณ์,
              จัดการตารางนัดหมาย, ตรวจสอบความพร้อม, และติดตามผู้ป่วยหลังการให้บริการได้อย่างมีประสิทธิภาพ
            </p>
          </div>
        </section>

        {/* ฟีเจอร์หลัก */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            ฟีเจอร์หลักของระบบ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071e3]/10 mb-3">
                    <Icon className="h-4.5 w-4.5 text-[#0071e3]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f] mb-1">{f.title}</h3>
                  <p className="text-xs text-[rgba(0,0,0,0.48)] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* รายชื่อสถานพยาบาล */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            สถานพยาบาล
          </h2>

          {isLoading ? (
            <LoadingSpinner text="กำลังโหลดข้อมูล..." />
          ) : (
            <div className="space-y-4">
              {/* รพ.สอง */}
              {mainHosp && (
                <div className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                      รพ.
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#1d1d1f]">{mainHosp.hosp_name}</span>
                </div>
              )}

              {/* รพ.สต. + สสช. */}
              {hscList.length > 0 && (
                <div className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                      รพ.สต. / สสช.
                    </span>
                    <span className="text-xs text-[rgba(0,0,0,0.48)]">
                      {hscList.length} แห่ง
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5">
                    {hscList.map((h) => (
                      <div key={h.hosp_code} className="flex items-center gap-2 py-1">
                        <MonitorSmartphone className="h-3.5 w-3.5 text-[rgba(0,0,0,0.48)] shrink-0" />
                        <span className="text-sm text-[#1d1d1f]">{h.hosp_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* สสอ. */}
              {ssoList.length > 0 && (
                <div className="rounded-lg bg-white p-5 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
                  {ssoList.map((h) => (
                    <div key={h.hosp_code}>
                      <span className="inline-flex items-center justify-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                        สสอ.
                      </span>
                      <span className="text-sm font-medium text-[#1d1d1f] ml-2">{h.hosp_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ผู้จัดทำ */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            ผู้จัดทำ
          </h2>
          <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3]/10 shrink-0">
                <span className="text-lg font-semibold text-[#0071e3]">TK</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">นายธนกร คำชื่น</h3>
                <p className="text-xs text-[#0071e3] font-medium mt-0.5">นักวิชาการคอมพิวเตอร์</p>
                <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1 leading-relaxed">
                  พัฒนาและออกแบบระบบติดตามการดำเนินงาน Telemedicine
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* แจ้งเกี่ยวกับข้อมูลส่วนบุคคล */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            แจ้งเกี่ยวกับข้อมูลส่วนบุคคล (Privacy Notice)
          </h2>
          <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10">
                <Eye className="h-4 w-4 text-[#0071e3]" />
              </div>
              <span className="text-sm font-medium text-[#1d1d1f]">ภาพรวม</span>
            </div>
            <p className="text-[rgba(0,0,0,0.8)] leading-relaxed">
              {appName} เก็บรวบรวมข้อมูลส่วนบุคคลเพียงเท่าที่จำเป็นต่อการดำเนินงาน
              ติดตามและกำกับดูแลการให้บริการ Telemedicine
              ของสถานพยาบาลในเขตพื้นที่อำเภอสอง จังหวัดแพร่
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3]/10 shrink-0 mt-0.5">
                  <Database className="h-3.5 w-3.5 text-[#0071e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#1d1d1f]">ข้อมูลที่เก็บรวบรวม</h4>
                  <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1 leading-relaxed">
                    ข้อมูลผู้ป่วย (ชื่อ-สกุล, HN, VN, เบอร์โทรศัพท์) ที่จำเป็นต่อการติดตามการให้บริการ,
                    ข้อมูลผู้ใช้งานระบบ (ชื่อ, ชื่อผู้ใช้, รหัสผ่านที่เข้ารหัสแล้ว, รหัสสถานพยาบาล),
                    และข้อมูลการดำเนินงาน (สถานะอุปกรณ์, ตารางนัดหมาย, รายการยา)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3]/10 shrink-0 mt-0.5">
                  <Server className="h-3.5 w-3.5 text-[#0071e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#1d1d1f]">การจัดเก็บข้อมูล</h4>
                  <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1 leading-relaxed">
                    ข้อมูลจัดเก็บในระบบ Google Sheets ภายใต้บัญชีของสำนักงานสาธารณสุขอำเภอสอง
                    โดยมีระบบควบคุมการเข้าถึงตามบทบาทหน้าที่ (Role-Based Access Control)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3]/10 shrink-0 mt-0.5">
                  <Lock className="h-3.5 w-3.5 text-[#0071e3]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#1d1d1f]">การรักษาความปลอดภัย</h4>
                  <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1 leading-relaxed">
                    รหัสผ่านเข้ารหัสด้วยวิธีการแฮช (Hash) ก่อนจัดเก็บ,
                    Session Token จัดเก็บในหน่วยความจำชั่วคราวของเบราว์เซอร์เท่านั้น (Session Storage)
                    และมีอายุการใช้งาน 8 ชั่วโมง,
                    ข้อมูลผู้ป่วยเข้าถึงได้เฉพาะผู้ที่ได้รับอนุญาตตามบทบาทเท่านั้น
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* นโยบายความเป็นส่วนตัว */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </h2>
          <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10">
                <FileText className="h-4 w-4 text-[#0071e3]" />
              </div>
              <span className="text-sm font-medium text-[#1d1d1f]">
                ปรับปรุงล่าสุด: เมษายน 2569
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">1. วัตถุประสงค์</h4>
                <p className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                  นโยบายฉบับนี้อธิบายถึงวิธีการที่ {appName}
                  เก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของผู้ใช้งานและผู้ป่วย
                  โดยมีวัตถุประสงค์เพื่อให้การดำเนินงาน Telemedicine
                  เป็นไปอย่างมีประสิทธิภาพและปลอดภัย
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  2. ประเภทข้อมูลที่เก็บรวบรวม
                </h4>
                <ul className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed space-y-1.5">
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span><strong>ข้อมูลผู้ใช้งานระบบ:</strong> ชื่อ-สกุล, ชื่อผู้ใช้, รหัสผ่าน (เข้ารหัสแล้ว), รหัสสถานพยาบาล, บทบาทหน้าที่</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span><strong>ข้อมูลผู้ป่วย:</strong> ชื่อ-สกุล, HN, VN, เบอร์โทรศัพท์, สถานะการรับบริการ, รายการยา, ผลการติดตาม</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span><strong>ข้อมูลการดำเนินงาน:</strong> สถานะอุปกรณ์, ตารางนัดหมาย, คลินิก, ผลการตรวจสอบความพร้อม</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  3. วัตถุประสงค์การใช้ข้อมูล
                </h4>
                <ul className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed space-y-1.5">
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>ติดตามและกำกับดูแลการดำเนินงาน Telemedicine ของสถานพยาบาลในเขตพื้นที่</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>จัดการตารางนัดหมายและติดตามการให้บริการผู้ป่วย</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>ตรวจสอบสถานะความพร้อมของอุปกรณ์และระบบ</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>ติดตามสภาวะผู้ป่วยหลังการให้บริการ</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>จัดทำรายงานสถิติเพื่อการบริหารจัดการ</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">4. การเปิดเผยข้อมูล</h4>
                <p className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                  ระบบไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลภายนอก
                  ยกเว้นเจ้าหน้าที่ที่ได้รับมอบหมายในสถานพยาบาลที่เกี่ยวข้องเท่านั้น
                  โดยมีระบบควบคุมการเข้าถึงตามบทบาทหน้าที่ดังนี้
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  <div className="rounded-md bg-[rgba(0,0,0,0.03)] px-3 py-2 text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                    <span className="font-medium">สาธารณะ (Dashboard):</span> เห็นเฉพาะข้อมูลสถิติรวม ไม่มีข้อมูลส่วนบุคคล
                  </div>
                  <div className="rounded-md bg-[rgba(0,0,0,0.03)] px-3 py-2 text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                    <span className="font-medium">รพ.สต.:</span> เห็นเฉพาะข้อมูลของสถานพยาบาลตนเอง
                  </div>
                  <div className="rounded-md bg-[rgba(0,0,0,0.03)] px-3 py-2 text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                    <span className="font-medium">รพ.สอง:</span> เห็นข้อมูลทุกสถานพยาบาลในเขตพื้นที่
                  </div>
                  <div className="rounded-md bg-[rgba(0,0,0,0.03)] px-3 py-2 text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                    <span className="font-medium">ผู้ดูแลระบบ:</span> จัดการผู้ใช้งานและตั้งค่าระบบ
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  5. มาตรการรักษาความปลอดภัย
                </h4>
                <ul className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed space-y-1.5">
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>รหัสผ่านถูกแปลงเป็น Hash ก่อนจัดเก็บ ไม่เก็บรหัสผ่านแบบข้อความเขียนตรง (Plaintext)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>Session Token จัดเก็บในหน่วยความจำชั่วคราวของเบราว์เซอร์เท่านั้น (Session Storage) ไม่จัดเก็บใน Local Storage หรือ Cookie</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>Session มีอายุการใช้งาน 8 ชั่วโมง และถูกลบทันทีเมื่อออกจากระบบ</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[rgba(0,0,0,0.48)]">&#8226;</span>
                    <span>การสื่อสารระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ผ่าน HTTPS (SSL/TLS)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  6. สิทธิของเจ้าของข้อมูล
                </h4>
                <p className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                  ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                  เจ้าของข้อมูลมีสิทธิเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของตน
                  สามารถติดต่อได้ที่สำนักงานสาธารณสุขอำเภอสอง จังหวัดแพร่
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  7. ระยะเวลาการเก็บรักษาข้อมูล
                </h4>
                <p className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                  ข้อมูลจัดเก็บตามระยะเวลาที่จำเป็นต่อการดำเนินงานและตามที่กฎหมายกำหนด
                  โดยข้อมูลผู้ป่วยจะถูกเก็บรักษาตามระยะเวลาที่กฎหมายว่าด้วยการเก็บรักษาเวชระเบียนกำหนด
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2">
                  8. ช่องทางการติดต่อ
                </h4>
                <p className="text-xs text-[rgba(0,0,0,0.8)] leading-relaxed">
                  หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวหรือการคุ้มครองข้อมูลส่วนบุคคล
                  สามารถติดต่อสำนักงานสาธารณสุขอำเภอสอง จังหวัดแพร่
                  หรือผู้พัฒนาระบบได้โดยตรง
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-[rgba(0,0,0,0.48)]" />
                <p className="text-xs text-[rgba(0,0,0,0.48)]">
                  อ้างอิง: พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-6">
        <div className="max-w-[980px] mx-auto px-4 text-center">
          <p className="text-xs text-[rgba(0,0,0,0.48)]">
            &copy; {new Date().getFullYear()} {appName} — สสอ.สอง จังหวัดแพร่
          </p>
        </div>
      </footer>
    </div>
  )
}
