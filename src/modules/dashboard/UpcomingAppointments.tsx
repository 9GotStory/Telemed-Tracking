import type { UpcomingAppointment } from '@/services/dashboardService'
import { formatBuddhist } from '@/utils/dateUtils'

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">
        ไม่มีนัดหมายใน 7 วันข้างหน้า
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">นัดหมายใน 7 วันข้างหน้า</caption>
        <thead>
          <tr className="border-b text-left text-[rgba(0,0,0,0.48)]">
            <th className="pb-2 pr-4 font-medium text-xs">วันที่</th>
            <th className="pb-2 pr-4 font-medium text-xs">สถานพยาบาล</th>
            <th className="pb-2 pr-4 font-medium text-xs">เวลา</th>
            <th className="pb-2 font-medium text-xs text-right">จำนวนผู้ป่วย</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt, i) => (
            <tr key={i} className="border-b border-[rgba(0,0,0,0.06)] last:border-0">
              <td className="py-3 pr-4 text-[#1d1d1f] font-medium">
                {formatBuddhist(appt.service_date)}
              </td>
              <td className="py-3 pr-4 text-[#1d1d1f]">{appt.hosp_name}</td>
              <td className="py-3 pr-4 text-[rgba(0,0,0,0.48)]">{appt.service_time || '-'}</td>
              <td className="py-3 text-right">
                <span className="inline-flex items-center justify-center rounded-full bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                  {appt.appoint_count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
