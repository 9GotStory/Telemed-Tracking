import { StatusBadge } from '@/components/common/StatusBadge'
import type { FollowupItem, FollowupMed } from '@/services/followupService'
import { Phone, AlertTriangle } from 'lucide-react'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import { formatBuddhist } from '@/utils/dateUtils'

interface PatientContactCardProps {
  item: FollowupItem
}

function getClinicLabel(clinicType: string): string {
  const found = CLINIC_TYPES.find((ct) => ct.value === clinicType)
  return found ? found.label : clinicType
}

export function PatientContactCard({ item }: PatientContactCardProps) {
  return (
    <div className="grid gap-3">
      {/* Patient info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">ชื่อ</span>
          <div className="font-medium">{item.patient_name}</div>
        </div>
        <div>
          <span className="text-muted-foreground">HN</span>
          <div className="font-medium">{item.hn}</div>
        </div>
        <div>
          <span className="text-muted-foreground">โทร</span>
          <div>
            <a
              href={`tel:${item.tel}`}
              className="inline-flex items-center gap-1 text-apple-blue hover:underline"
            >
              <Phone className="h-3 w-3" />
              {item.tel}
            </a>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">วันที่</span>
          <div className="font-medium">{formatBuddhist(item.service_date)}</div>
        </div>
        <div>
          <span className="text-muted-foreground">รพ.สต.</span>
          <div className="font-medium">{item.hosp_name}</div>
        </div>
        <div>
          <span className="text-muted-foreground">คลินิก</span>
          <div><StatusBadge variant="active">{getClinicLabel(item.clinic_type)}</StatusBadge></div>
        </div>
      </div>

      {/* Drug list */}
      {item.meds.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-btn-default-light/50">
                <th className="px-3 py-1.5 text-left font-semibold">ยา</th>
                <th className="px-3 py-1.5 text-left font-semibold">จำนวน</th>
                <th className="px-3 py-1.5 text-left font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {item.meds.map((med: FollowupMed) => (
                <tr key={med.med_id} className="border-t">
                  <td className="px-3 py-1.5">
                    <span className={med.is_changed === 'Y' ? 'text-apple-blue font-medium' : ''}>
                      {med.drug_name}
                    </span>
                    <div className="text-xs text-muted-foreground">{med.strength} · {med.sig}</div>
                  </td>
                  <td className="px-3 py-1.5">{med.qty} {med.unit}</td>
                  <td className="px-3 py-1.5">
                    {med.is_changed === 'Y' && (
                      <span className="text-apple-blue text-xs font-medium">เปลี่ยนแปลง</span>
                    )}
                    {med.source === 'hosp_pending' && (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle className="h-3 w-3" /> รอส่ง
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drug flags */}
      <div className="flex gap-2 flex-wrap">
        {item.has_drug_change === 'Y' && (
          <StatusBadge variant="pending">มีการเปลี่ยนแปลงยา</StatusBadge>
        )}
        {item.drug_source_pending === 'Y' && (
          <StatusBadge variant="pending">มียาที่รอส่งจาก รพ.</StatusBadge>
        )}
      </div>
    </div>
  )
}
