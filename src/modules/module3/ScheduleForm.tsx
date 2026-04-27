import { useEffect, useMemo, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useScheduleSave } from './useSchedule'
import { scheduleSchema, type ScheduleFormValues } from '@/services/scheduleService'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { ClinicScheduleWithActual } from '@/types/schedule'
import { useAuthStore } from '@/stores/authStore'
import { HospCodeSelect } from '@/components/common/HospCodeSelect'
import { FormChecklistCard, type ChecklistField } from '@/components/common/FormChecklistCard'
import { DatePicker } from '@/components/common/DatePicker'
import { useHospitalsList } from '@/hooks/useHospitals'

// Half-hour intervals from 08:00 to 16:30
const TIME_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const min = i % 2 === 0 ? '00' : '30'
  return { value: `${String(hour).padStart(2, '0')}.${min}`, label: `${String(hour).padStart(2, '0')}.${min}` }
})

const TIME_ITEMS = TIME_OPTIONS.map(t => ({ label: t.label, value: t.value }))

/** Parse "09.00-10.00" into [start, end] */
function parseServiceTime(t: string): [string, string] {
  if (!t) return ['', '']
  if (!t.includes('-')) return [t, '']
  const [start, end] = t.split('-')
  return [start, end]
}

function getFormDefaults(
  schedule: ClinicScheduleWithActual | null | undefined,
  defaultHospCode?: string,
  defaultDate?: string,
): ScheduleFormValues {
  return schedule
    ? {
        schedule_id: schedule.schedule_id,
        service_date: schedule.service_date,
        hosp_code: schedule.hosp_code,
        clinic_type: schedule.clinic_type,
        service_time: schedule.service_time,
        appoint_count: schedule.appoint_count,
        drug_delivery_date: schedule.drug_delivery_date ?? '',
      }
    : {
        hosp_code: defaultHospCode ?? '',
        service_date: defaultDate ?? '',
        clinic_type: '',
        service_time: '',
        appoint_count: 0,
        drug_delivery_date: '',
      }
}

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: ClinicScheduleWithActual | null
  defaultHospCode?: string
  defaultDate?: string
}

export function ScheduleForm({ open, onOpenChange, schedule, defaultHospCode, defaultDate }: ScheduleFormProps) {
  const { user } = useAuthStore()
  const saveMutation = useScheduleSave()
  const isEditing = !!schedule
  const { data: hospitals = [] } = useHospitalsList()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: getFormDefaults(schedule, defaultHospCode, defaultDate),
  })

  useEffect(() => {
    if (open) {
      reset(getFormDefaults(schedule, defaultHospCode, defaultDate))
    }
  }, [open, schedule, defaultHospCode, defaultDate, reset])

  const onSubmit = (data: ScheduleFormValues) => {
    if (saveMutation.isPending) return
    saveMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  const canChooseHosp = user?.role === 'admin_hosp' || user?.role === 'super_admin'
  const canSetDeliveryDate = user?.role === 'super_admin' || user?.role === 'admin_hosp' || user?.role === 'staff_hosp'

  // Service date: DatePicker uses Date, form stores 'yyyy-MM-dd' string
  const serviceDateStr = watch('service_date') ?? ''
  const serviceDateObj = useMemo(() => {
    if (!serviceDateStr) return undefined
    try { return parseISO(serviceDateStr) } catch { return undefined }
  }, [serviceDateStr])

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setValue('service_date', format(date, 'yyyy-MM-dd'), { shouldValidate: true })
    }
  }, [setValue])

  // Drug delivery date: DatePicker uses Date, form stores 'yyyy-MM-dd' string
  const deliveryDateStr = watch('drug_delivery_date') ?? ''
  const deliveryDateObj = useMemo(() => {
    if (!deliveryDateStr) return undefined
    try { return parseISO(deliveryDateStr) } catch { return undefined }
  }, [deliveryDateStr])

  const handleDeliveryDateChange = useCallback((date: Date | undefined) => {
    setValue('drug_delivery_date', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })
  }, [setValue])

  // Watched fields for checklist
  const watchedHospCode = watch('hosp_code')
  const watchedDate = watch('service_date')
  const watchedClinicType = watch('clinic_type')

  // Derive start/end from service_time for display
  const currentServiceTime = watch('service_time') ?? ''
  const [startTime, endTime] = useMemo(() => parseServiceTime(currentServiceTime), [currentServiceTime])

  const handleStartTimeChange = (v: string | null) => {
    if (!v) return
    const end = endTime || ''
    const combined = end ? `${v}-${end}` : v
    setValue('service_time', combined, { shouldValidate: true })
  }

  const handleEndTimeChange = (v: string | null) => {
    if (!v) return
    const start = startTime || ''
    if (start) {
      setValue('service_time', `${start}-${v}`, { shouldValidate: true })
    }
  }

  // Filter end time options: must be after start time
  const endTimeOptions = useMemo(() => {
    if (!startTime) return TIME_ITEMS
    const startIdx = TIME_OPTIONS.findIndex(t => t.value === startTime)
    return TIME_ITEMS.filter((_, i) => i > startIdx)
  }, [startTime])

  const checklistFields: ChecklistField[] = [
    ...(canChooseHosp ? [{ label: 'สถานพยาบาล', filled: !!watchedHospCode }] : []),
    { label: 'วันที่ให้บริการ', filled: !!watchedDate },
    { label: 'ประเภทคลินิก', filled: !!watchedClinicType },
    { label: 'เวลาให้บริการ', filled: !!startTime && !!endTime },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขตารางคลินิก' : 'เพิ่มตารางคลินิก'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Service Date */}
          <div className="grid gap-2">
            <Label>วันที่ให้บริการ</Label>
            <DatePicker
              value={serviceDateObj}
              onChange={handleDateChange}
              placeholder="เลือกวันที่"
            />
            {errors.service_date && (
              <p role="alert" className="text-xs text-destructive">{errors.service_date.message}</p>
            )}
          </div>

          {/* Hospital — admin only */}
          {canChooseHosp && (
            <div className="grid gap-2">
              <Label>สถานพยาบาล</Label>
              <Controller
                name="hosp_code"
                control={control}
                render={({ field }) => (
                  <HospCodeSelect
                    value={field.value}
                    onChange={field.onChange}
                    items={hospitals}
                    placeholder="เลือกสถานพยาบาล"
                  />
                )}
              />
              {errors.hosp_code && (
                <p role="alert" className="text-xs text-destructive">{errors.hosp_code.message}</p>
              )}
            </div>
          )}

          {/* Clinic Type */}
          <div className="grid gap-2">
            <Label>ประเภทคลินิก</Label>
            <Select
              value={watch('clinic_type')}
              onValueChange={(v) => {
                if (v) setValue('clinic_type', v, { shouldValidate: true })
              }}
              items={CLINIC_TYPES.map(ct => ({ label: ct.label, value: ct.value }))}
            >
              <SelectTrigger className="w-full" aria-label="ประเภทคลินิก">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CLINIC_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.clinic_type && (
              <p role="alert" className="text-xs text-destructive">{errors.clinic_type.message}</p>
            )}
          </div>

          {/* Service Time — Start / End */}
          <div className="grid gap-2">
            <Label>เวลาให้บริการ</Label>
            <div className="flex items-center gap-2">
              <Select
                value={startTime}
                onValueChange={handleStartTimeChange}
                items={TIME_ITEMS}
              >
                <SelectTrigger className="w-full" aria-label="เวลาเริ่ม">
                  <SelectValue placeholder="เริ่ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground shrink-0">-</span>
              <Select
                value={endTime}
                onValueChange={handleEndTimeChange}
                items={endTimeOptions}
              >
                <SelectTrigger className="w-full" aria-label="เวลาจบ">
                  <SelectValue placeholder="จบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {endTimeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {errors.service_time && (
              <p role="alert" className="text-xs text-destructive">{errors.service_time.message}</p>
            )}
          </div>

          {/* Appointment Count */}
          <div className="grid gap-2">
            <Label htmlFor="sched-count">จำนวนนัดหมาย</Label>
            <Input
              id="sched-count"
              type="number"
              inputMode="numeric"
              min={0}
              {...register('appoint_count')}
            />
            {errors.appoint_count && (
              <p role="alert" className="text-xs text-destructive">{errors.appoint_count.message}</p>
            )}
          </div>

          {/* Drug Delivery Date — admin/staff_hosp only */}
          {canSetDeliveryDate && (
            <div className="grid gap-2">
              <Label>วันที่จัดส่งยา ไป รพ.สต.</Label>
              <DatePicker
                value={deliveryDateObj}
                onChange={handleDeliveryDateChange}
                placeholder="เลือกวันที่จัดส่งยา"
              />
              <p className="text-xs text-muted-foreground">ไม่บังคับ — กำหนดวันที่ส่งยาไปยัง รพ.สต.</p>
            </div>
          )}

          {/* Checklist Card */}
          <FormChecklistCard fields={checklistFields} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-apple-blue hover:bg-apple-blue/90"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'กำลังบันทึก...' : isEditing ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
