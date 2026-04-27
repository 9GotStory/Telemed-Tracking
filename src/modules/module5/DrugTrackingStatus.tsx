import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/DatePicker'
import { useUpdateDeliveryDate } from './useDrugTracking'
import type { DeliveryField } from '@/services/visitService'
import type { UserRole } from '@/types/user'
import { Truck, PackageCheck, UserCheck, CheckCircle2, Pencil, X } from 'lucide-react'

interface DrugTrackingStatusProps {
  vn: string
  drugSentDate: string
  drugReceivedDate: string
  drugDeliveredDate: string
  userRole: UserRole
}

interface Stage {
  field: DeliveryField
  label: string
  icon: React.ReactNode
  date: string
  canEdit: boolean
}

export function DrugTrackingStatus({
  vn,
  drugSentDate,
  drugReceivedDate,
  drugDeliveredDate,
  userRole,
}: DrugTrackingStatusProps) {
  const mutation = useUpdateDeliveryDate()
  const [editingField, setEditingField] = useState<DeliveryField | null>(null)

  const stages: Stage[] = [
    {
      field: 'drug_sent_date',
      label: 'รพ.จัดส่ง',
      icon: <Truck className="h-4 w-4" />,
      date: drugSentDate,
      canEdit: userRole === 'super_admin' || userRole === 'staff_hosp' || userRole === 'admin_hosp',
    },
    {
      field: 'drug_received_date',
      label: 'รพ.สต.ได้รับ',
      icon: <PackageCheck className="h-4 w-4" />,
      date: drugReceivedDate,
      canEdit: userRole === 'super_admin' || userRole === 'staff_hsc',
    },
    {
      field: 'drug_delivered_date',
      label: 'ส่งมอบให้คนไข้',
      icon: <UserCheck className="h-4 w-4" />,
      date: drugDeliveredDate,
      canEdit: userRole === 'super_admin' || userRole === 'staff_hsc',
    },
  ]

  const handleSave = (field: DeliveryField, date: Date | undefined) => {
    if (!date) return // dismiss without selection = cancel
    mutation.mutate(
      { vn, field, date: format(date, 'yyyy-MM-dd') },
      { onSettled: () => setEditingField(null) },
    )
  }

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        ติดตามการจัดส่งยา (รอส่งจากรพ.)
      </div>
      <div className="grid gap-2">
        {stages.map((stage, idx) => (
          <div key={stage.field} className="flex items-center gap-2">
            {/* Step indicator */}
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
              stage.date
                ? 'bg-apple-blue text-white'
                : 'bg-muted text-muted-foreground'
            }`}>
              {stage.date ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
            </div>

            {/* Icon + Label */}
            <div className="flex items-center gap-1.5 min-w-30">
              {stage.icon}
              <span className="text-xs font-medium">{stage.label}</span>
            </div>

            {/* Date display or editor */}
            <div className="flex-1">
              {editingField === stage.field ? (
                <div className="flex items-center gap-1">
                  <DatePicker
                    value={stage.date ? parseISO(stage.date) : undefined}
                    onChange={(d) => handleSave(stage.field, d ?? undefined)}
                    disabled={mutation.isPending}
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => setEditingField(null)}
                    disabled={mutation.isPending}
                    title="ยกเลิก"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {stage.date ? (
                    <span className="text-xs text-foreground">
                      {format(parseISO(stage.date), 'd MMM yyyy', { locale: th })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {stage.canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-apple-blue"
                      onClick={() => setEditingField(stage.field)}
                      disabled={mutation.isPending}
                      title={stage.date ? 'แก้ไขวันที่' : 'บันทึกวันที่'}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
