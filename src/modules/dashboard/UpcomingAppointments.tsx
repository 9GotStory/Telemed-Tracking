import type { UpcomingAppointment } from '@/services/dashboardService'
import { formatBuddhist } from '@/utils/dateUtils'
import { CLINIC_TYPES } from '@/constants/clinicTypes'

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

function getClinicLabel(clinicType: string): string {
  const found = CLINIC_TYPES.find((ct) => ct.value === clinicType)
  return found ? found.label : clinicType
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-[rgba(0,0,0,0.48)]">
        ไม่มีนัดใน 7 วันข้างหน้า
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[rgba(0,0,0,0.48)]">
            <th className="pb-2 pr-4 font-medium">วันที่</th>
            <th className="pb-2 pr-4 font-medium">รพ.สต.</th>
            <th className="pb-2 pr-4 font-medium">คลินิก</th>
            <th className="pb-2 pr-4 font-medium">เวลา</th>
            <th className="pb-2 font-medium text-right">จำนวนนัด</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt, i) => (
            <tr key={i} className="border-b border-[rgba(0,0,0,0.06)]">
              <td className="py-2.5 pr-4 text-[#1d1d1f]">{formatBuddhist(appt.service_date)}</td>
              <td className="py-2.5 pr-4 text-[#1d1d1f]">{appt.hosp_name}</td>
              <td className="py-2.5 pr-4">
                <span className="inline-flex items-center rounded-md bg-[#fafafc] px-2 py-0.5 text-xs font-semibold text-[#1d1d1f]">
                  {getClinicLabel(appt.clinic_type)}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-[rgba(0,0,0,0.48)]">{appt.service_time}</td>
              <td className="py-2.5 text-right font-medium text-[#1d1d1f]">{appt.appoint_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
