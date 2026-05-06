import type { UpcomingAppointment } from '@/services/dashboardService'
import { formatBuddhist } from '@/utils/dateUtils'
import { isBefore, startOfDay, parseISO, isValid } from 'date-fns'

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

function isPastDate(dateStr: string): boolean {
  const parsed = parseISO(dateStr)
  if (!isValid(parsed)) return false
  return isBefore(startOfDay(parsed), startOfDay(new Date()))
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">
        ไม่มีนัดหมายในเดือนนี้
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">นัดหมาย</caption>
        <thead>
          <tr className="border-b text-left text-[rgba(0,0,0,0.48)]">
            <th className="pb-2 pr-4 font-medium text-xs">วันที่</th>
            <th className="pb-2 pr-4 font-medium text-xs">สถานพยาบาล</th>
            <th className="pb-2 pr-4 font-medium text-xs">เวลา</th>
            <th className="pb-2 font-medium text-xs text-right">จำนวนผู้ป่วย</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const past = isPastDate(appt.service_date)
            const rowClass = past ? 'opacity-45' : ''
            const badgeClass = past
              ? 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.32)]'
              : 'bg-[#0071e3]/10 text-[#0071e3]'

            return (
              <tr key={`${appt.service_date}-${appt.hosp_name}-${appt.clinic_type}`} className={`border-b border-[rgba(0,0,0,0.06)] last:border-0 ${rowClass}`}>
                <td className="py-3 pr-4 text-[#1d1d1f] font-medium">
                  {formatBuddhist(appt.service_date)}
                </td>
                <td className="py-3 pr-4 text-[#1d1d1f]">{appt.hosp_name}</td>
                <td className="py-3 pr-4 text-[rgba(0,0,0,0.48)]">{appt.service_time || '-'}</td>
                <td className="py-3 text-right">
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                    {appt.appoint_count}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
