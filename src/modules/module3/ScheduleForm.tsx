import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useFacilitiesList } from '@/hooks/useFacilities'

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
      }
    : {
        hosp_code: defaultHospCode ?? '',
        service_date: defaultDate ?? '',
        clinic_type: '',
        service_time: '',
        appoint_count: 0,
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
  const { data: facilities = [] } = useFacilitiesList()

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขตารางคลินิก' : 'เพิ่มตารางคลินิก'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Service Date */}
          <div className="grid gap-2">
            <Label htmlFor="sched-date">วันที่ให้บริการ</Label>
            <Input
              id="sched-date"
              type="date"
              {...register('service_date')}
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
                    items={facilities}
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
            >
              <SelectTrigger aria-label="ประเภทคลินิก">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {CLINIC_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clinic_type && (
              <p role="alert" className="text-xs text-destructive">{errors.clinic_type.message}</p>
            )}
          </div>

          {/* Service Time */}
          <div className="grid gap-2">
            <Label htmlFor="sched-time">เวลาให้บริการ</Label>
            <Input
              id="sched-time"
              placeholder="เช่น 09.00-10.00"
              {...register('service_time')}
            />
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
