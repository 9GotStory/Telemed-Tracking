import { StatusBadge } from '@/components/common/StatusBadge'
import type { FollowupItem, FollowupMed } from '@/services/followupService'
import { Phone, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import { formatBuddhist } from '@/utils/dateUtils'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'

function DeliveryStep({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
        date ? 'bg-apple-blue text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {date ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </div>
      <span className="font-medium">{label}</span>
      {date ? (
        <span className="text-muted-foreground">{format(parseISO(date), 'd MMM yyyy', { locale: th })}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

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
          <div><StatusBadge variant="info">{getClinicLabel(item.clinic_type)}</StatusBadge></div>
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

      {/* Delivery tracking summary */}
      {item.drug_source_pending === 'Y' && (
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">ติดตามการจัดส่งยา</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <DeliveryStep label="รพ.จัดส่ง" date={item.drug_sent_date} />
            <DeliveryStep label="รพ.สต.ได้รับ" date={item.drug_received_date} />
            <DeliveryStep label="ส่งมอบคนไข้" date={item.drug_delivered_date} />
          </div>
        </div>
      )}
    </div>
  )
}
