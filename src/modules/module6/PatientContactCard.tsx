import { useMemo, useCallback } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EditablePhone } from '@/components/common/EditablePhone'
import { DatePicker } from '@/components/common/DatePicker'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { FollowupItem, FollowupMed } from '@/services/followupService'
import type { DeliveryField } from '@/services/visitService'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import { formatBuddhist, formatDateThai } from '@/utils/dateUtils'
import { format, parseISO, isValid, differenceInYears } from 'date-fns'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import { useUpdateDeliveryDate } from '@/modules/module5/useDrugTracking'
import { useAuthStore } from '@/stores/authStore'

function calcAge(dob: string): string | null {
  if (!dob) return null
  let isoStr = dob.trim()

  // Handle Excel serial number stored as string (e.g. "44196")
  const num = Number(isoStr)
  if (!isNaN(num) && num > 10000 && num < 100000) {
    const epoch = new Date(1899, 11, 30)
    epoch.setDate(epoch.getDate() + num)
    const y = epoch.getFullYear()
    const m = String(epoch.getMonth() + 1).padStart(2, '0')
    const d = String(epoch.getDate()).padStart(2, '0')
    isoStr = `${y}-${m}-${d}`
  }

  // Handle possible Buddhist year (e.g. 2570-01-15 → subtract 543)
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const year = parseInt(match[1], 10)
    if (year > 2400) isoStr = `${year - 543}-${match[2]}-${match[3]}`
  }
  const d = parseISO(isoStr)
  if (!isValid(d)) return null
  const age = differenceInYears(new Date(), d)
  return age >= 0 ? String(age) : null
}

function DeliveryStep({
  label,
  date,
  onDateChange,
}: {
  label: string
  date: string
  onDateChange: (date: string) => void
}) {
  const formatted = date ? formatDateThai(date) : ''
  const dateObj = useMemo(() => {
    if (!date) return undefined
    const d = parseISO(date)
    return isValid(d) ? d : undefined
  }, [date])

  const handleChange = useCallback((d: Date | undefined) => {
    onDateChange(d ? format(d, 'yyyy-MM-dd') : '')
  }, [onDateChange])

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
        formatted ? 'bg-apple-blue text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {formatted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </div>
      <span className="font-medium">{label}</span>
      <DatePicker
        value={dateObj}
        onChange={handleChange}
        placeholder="เลือกวันที่"
        className="text-xs"
      />
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
  const updateDelivery = useUpdateDeliveryDate()
  const { user } = useAuthStore()
  const canViewSensitive = user?.role === 'admin_hosp' || user?.role === 'super_admin'
  const age = calcAge(item.dob)

  const mutateDelivery = updateDelivery.mutate
  const handleDeliveryDateChange = useCallback((field: DeliveryField) => (date: string) => {
    mutateDelivery({ vn: item.vn, field, date })
  }, [item.vn, mutateDelivery])

  return (
    <div className="grid gap-3">
      {/* Patient info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">ชื่อ-สกุล</span>
          <div className="font-medium">{item.patient_name}</div>
        </div>
        {age != null && (
          <div>
            <span className="text-muted-foreground">อายุ</span>
            <div className="font-medium">{age} ปี</div>
          </div>
        )}
        {canViewSensitive && (
          <div>
            <span className="text-muted-foreground">HN</span>
            <div className="font-medium">{item.hn}</div>
          </div>
        )}
        {canViewSensitive && (
          <div>
            <span className="text-muted-foreground">โทร</span>
            <div>
              <EditablePhone tel={item.tel} vn={item.vn} />
            </div>
          </div>
        )}
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
          <Table>
            <TableHeader>
              <TableRow className="bg-btn-default-light/50">
                <TableHead className="px-3 py-1.5 font-semibold">ยา</TableHead>
                <TableHead className="px-3 py-1.5 font-semibold">จำนวน</TableHead>
                <TableHead className="px-3 py-1.5 font-semibold">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.meds.map((med: FollowupMed) => (
                <TableRow key={med.med_id}>
                  <TableCell className="px-3 py-1.5">
                    <span className={med.is_changed === 'Y' ? 'text-apple-blue font-medium' : ''}>
                      {med.drug_name}
                    </span>
                    <div className="text-xs text-muted-foreground">{med.strength} · {med.sig}</div>
                  </TableCell>
                  <TableCell className="px-3 py-1.5">{med.qty} {med.unit}</TableCell>
                  <TableCell className="px-3 py-1.5">
                    {med.is_changed === 'Y' && (
                      <StatusBadge variant="pending">เปลี่ยนแปลง</StatusBadge>
                    )}
                    {med.source === 'hosp_pending' && (
                      <StatusBadge variant="warning">
                        <AlertTriangle className="h-3 w-3" /> รอส่ง
                      </StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Drug flags */}
      <div className="flex gap-2 flex-wrap">
        {item.has_drug_change === 'Y' && (
          <StatusBadge variant="pending">มีการเปลี่ยนแปลงยา</StatusBadge>
        )}
        {item.drug_source_pending === 'Y' && (
          <StatusBadge variant="warning">มียาที่รอส่งจาก รพ.</StatusBadge>
        )}
      </div>

      {/* Delivery tracking — editable */}
      {item.drug_source_pending === 'Y' && (
        <LoadingOverlay loading={updateDelivery.isPending} text="กำลังบันทึก...">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">ติดตามการจัดส่งยา</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <DeliveryStep label="รพ.จัดส่ง" date={item.drug_sent_date} onDateChange={handleDeliveryDateChange('drug_sent_date')} />
              <DeliveryStep label="รพ.สต.ได้รับ" date={item.drug_received_date} onDateChange={handleDeliveryDateChange('drug_received_date')} />
              <DeliveryStep label="ส่งมอบคนไข้" date={item.drug_delivered_date} onDateChange={handleDeliveryDateChange('drug_delivered_date')} />
            </div>
          </div>
        </LoadingOverlay>
      )}
    </div>
  )
}
