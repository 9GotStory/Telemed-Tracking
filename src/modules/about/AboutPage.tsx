import { Link } from 'react-router-dom'
import { useHospitalsList } from '@/hooks/useHospitals'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Activity,
  ArrowLeft,
  Building2,
  Heart,
  MonitorSmartphone,
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
                      รพ.สอง
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#1d1d1f]">{mainHosp.hosp_name}</span>
                  <span className="text-xs text-[rgba(0,0,0,0.48)] ml-2">({mainHosp.hosp_code})</span>
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
                        {h.hosp_type === 'สสช.' && (
                          <span className="text-xs text-[rgba(0,0,0,0.48)]">(สสช.)</span>
                        )}
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
                        สสอ.สอง
                      </span>
                      <span className="text-sm font-medium text-[#1d1d1f] ml-2">{h.hosp_name}</span>
                      <span className="text-xs text-[rgba(0,0,0,0.48)] ml-2">({h.hosp_code})</span>
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
