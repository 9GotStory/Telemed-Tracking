import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/DatePicker'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import {
  appointmentRegisterSchema,
} from '@/services/appointmentService'
import { useAppointmentRegister } from './useAppointment'
import { useAuthStore } from '@/stores/authStore'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AppointmentEntry {
  hn: string
  patient_name: string
  clinic_types: string[]
}

interface FormValues {
  hosp_code: string
  service_date: string
  appointments: AppointmentEntry[]
}

export function RegistrationForm() {
  const { user } = useAuthStore()
  const registerMutation = useAppointmentRegister()
  const { data: facilities = [] } = useFacilitiesList()

  const isStaffHsc = user?.role === 'staff_hsc'
  const defaultHospCode = isStaffHsc ? (user.hosp_code ?? '') : ''

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(appointmentRegisterSchema),
    defaultValues: {
      hosp_code: defaultHospCode,
      service_date: '',
      appointments: [{ hn: '', patient_name: '', clinic_types: [] }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'appointments' })
  const watchedFields = watch('appointments')

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const onSubmit = (data: FormValues) => {
    registerMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.registered > 0) {
          reset({
            hosp_code: isStaffHsc ? defaultHospCode : '',
            service_date: '',
            appointments: [{ hn: '', patient_name: '', clinic_types: [] }],
          })
          setSelectedDate(undefined)
        }
      },
    })
  }

  const toggleClinic = (index: number, clinicValue: string) => {
    const current = watchedFields[index]?.clinic_types ?? []
    const next = current.includes(clinicValue)
      ? current.filter((c) => c !== clinicValue)
      : [...current, clinicValue]
    setValue(`appointments.${index}.clinic_types`, next, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {/* Batch selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border p-3">
        <div className="grid gap-1.5">
          <Label>รพ.สต.</Label>
          {isStaffHsc ? (
            <Input value={defaultHospCode} disabled className="bg-muted" />
          ) : (
            <Select
              value={watch('hosp_code')}
              onValueChange={(v) => { if (v) setValue('hosp_code', v, { shouldValidate: true }) }}
              items={facilities.map((f) => ({ label: `${f.hosp_name} (${f.hosp_code})`, value: f.hosp_code }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือก รพ.สต." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {facilities.map((f) => (
                    <SelectItem key={f.hosp_code} value={f.hosp_code}>
                      {f.hosp_name} ({f.hosp_code})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          {errors.hosp_code && <p className="text-xs text-destructive">{errors.hosp_code.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label>วันที่ให้บริการ</Label>
          <DatePicker
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d)
              setValue('service_date', d ? format(d, 'yyyy-MM-dd') : '', { shouldValidate: true })
            }}
            placeholder="เลือกวันที่"
          />
          {errors.service_date && <p className="text-xs text-destructive">{errors.service_date.message}</p>}
        </div>
      </div>

      {/* Patient list */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">รายชื่อผู้ป่วย ({fields.length})</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ hn: '', patient_name: '', clinic_types: [] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        </div>

        {fields.map((field, index) => {
          const selectedClinics = watchedFields[index]?.clinic_types ?? []
          return (
            <div key={field.id} className="rounded-md border p-3 grid gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    title="ลบรายการ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">HN</Label>
                  <Input
                    {...register(`appointments.${index}.hn`)}
                    placeholder="000001"
                    maxLength={6}
                    className="font-mono"
                  />
                  {errors.appointments?.[index]?.hn && (
                    <p className="text-xs text-destructive">{errors.appointments[index].hn?.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">ชื่อ-สกุล</Label>
                  <Input
                    {...register(`appointments.${index}.patient_name`)}
                    placeholder="สมชาย ใจดี"
                  />
                  {errors.appointments?.[index]?.patient_name && (
                    <p className="text-xs text-destructive">{errors.appointments[index].patient_name?.message}</p>
                  )}
                </div>
              </div>

              {/* Clinic checkboxes */}
              <div className="grid gap-1.5">
                <Label className="text-xs">คลินิก</Label>
                <div className="flex flex-wrap gap-2">
                  {CLINIC_TYPES.map((ct) => {
                    const isSelected = selectedClinics.includes(ct.value)
                    return (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => toggleClinic(index, ct.value)}
                        className="focus:outline-none"
                      >
                        <StatusBadge variant={isSelected ? 'active' : 'info'}>
                          {ct.label}
                        </StatusBadge>
                      </button>
                    )
                  })}
                </div>
                {errors.appointments?.[index]?.clinic_types && (
                  <p className="text-xs text-destructive">{errors.appointments[index].clinic_types?.message}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="bg-apple-blue hover:bg-apple-blue/90"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        ลงทะเบียน
      </Button>
    </form>
  )
}
