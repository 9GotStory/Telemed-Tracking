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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useEquipmentSave } from './useEquipment'
import { equipmentSchema, type EquipmentFormValues } from '@/services/equipmentService'
import type { EquipmentWithHospName } from '@/types/equipment'
import { useAuthStore } from '@/stores/authStore'
import { HospCodeSelect } from '@/components/common/HospCodeSelect'
import { useFacilitiesList } from '@/hooks/useFacilities'

const SET_TYPES = [
  { value: 'A', label: 'ชุด A (Desktop + Camera + Mic)' },
  { value: 'B', label: 'ชุด B (Notebook)' },
] as const

const DEVICE_TYPES = [
  { value: 'computer', label: 'คอมพิวเตอร์' },
  { value: 'notebook', label: 'โน้ตบุ๊ก' },
  { value: 'camera', label: 'กล้อง' },
  { value: 'mic', label: 'ไมโครโฟน' },
] as const

const STATUSES = [
  { value: 'ready', label: 'พร้อมใช้งาน' },
  { value: 'maintenance', label: 'ซ่อมบำรุง' },
  { value: 'broken', label: 'ชำรุด' },
] as const

const SOFTWARE_OPTIONS = [
  'MOPH Meet',
  'Google Meet',
  'Zoom',
  'Microsoft Teams',
  'Jitsi Meet',
  'Other',
]

function getFormDefaults(equipment: EquipmentWithHospName | null | undefined, defaultHospCode?: string): EquipmentFormValues {
  return equipment
    ? {
        equip_id: equipment.equip_id,
        hosp_code: equipment.hosp_code,
        set_type: equipment.set_type as 'A' | 'B',
        device_type: equipment.device_type as 'computer' | 'notebook' | 'camera' | 'mic',
        os: equipment.os,
        status: equipment.status as 'ready' | 'maintenance' | 'broken',
        is_backup: equipment.is_backup as 'Y' | 'N',
        software: equipment.software,
        internet_mbps: equipment.internet_mbps,
        responsible_person: equipment.responsible_person,
        responsible_tel: equipment.responsible_tel,
        note: equipment.note,
      }
    : {
        hosp_code: defaultHospCode ?? '',
        set_type: 'A',
        device_type: 'computer',
        status: 'ready',
        is_backup: 'N',
        os: '',
        software: '',
        internet_mbps: null,
        responsible_person: '',
        responsible_tel: '',
        note: '',
      }
}

interface EquipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: EquipmentWithHospName | null
  defaultHospCode?: string
}

export function EquipmentForm({ open, onOpenChange, equipment, defaultHospCode }: EquipmentFormProps) {
  const { user } = useAuthStore()
  const saveMutation = useEquipmentSave()
  const isEditing = !!equipment
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
    resolver: zodResolver(equipmentSchema),
    defaultValues: getFormDefaults(equipment, defaultHospCode),
  })

  // C1: Reset form values when dialog opens or equipment changes
  useEffect(() => {
    if (open) {
      reset(getFormDefaults(equipment, defaultHospCode))
    }
  }, [open, equipment, defaultHospCode, reset])

  const currentSetType = watch('set_type')
  const currentSoftware = watch('software') ?? ''

  const onSubmit = (data: EquipmentFormValues) => {
    if (saveMutation.isPending) return
    saveMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  // C2: Controlled software toggle — reads and writes through RHF state only
  const toggleSoftware = (name: string) => {
    const list = currentSoftware
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const idx = list.indexOf(name)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push(name)
    }
    setValue('software', list.join(', '), { shouldValidate: true })
  }

  // H3: Admin users (admin_hosp, super_admin) can select hospital; staff_hsc is locked to own
  const canChooseHosp = user?.role === 'admin_hosp' || user?.role === 'super_admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as (data: EquipmentFormValues) => void)} className="grid gap-4">
          {/* Hospital — visible for admin roles */}
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
                <p role="alert" className="text-xs text-destructive">
                  {errors.hosp_code.message}
                </p>
              )}
            </div>
          )}

          {/* Set Type */}
          <div className="grid gap-2">
            <Label>ชุดอุปกรณ์</Label>
            <Select
              value={watch('set_type')}
              onValueChange={(v) => {
                if (!v) return
                setValue('set_type', v as 'A' | 'B', { shouldValidate: true })
                if (v === 'B') setValue('device_type', 'notebook', { shouldValidate: true })
              }}
              items={SET_TYPES.map(t => ({ label: t.label, value: t.value }))}
            >
              <SelectTrigger className="w-full" aria-label="ชุดอุปกรณ์">
                <SelectValue placeholder="เลือกชุด" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.set_type && (
              <p role="alert" className="text-xs text-destructive">
                {errors.set_type.message}
              </p>
            )}
          </div>

          {/* Device Type */}
          <div className="grid gap-2">
            <Label>ประเภทอุปกรณ์</Label>
            <Select
              value={watch('device_type')}
              onValueChange={(v) => {
                if (!v) return
                setValue('device_type', v as EquipmentFormValues['device_type'], { shouldValidate: true })
              }}
              disabled={currentSetType === 'B'}
              items={DEVICE_TYPES.map(d => ({ label: d.label, value: d.value }))}
            >
              <SelectTrigger className="w-full" aria-label="ประเภทอุปกรณ์">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DEVICE_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.device_type && (
              <p role="alert" className="text-xs text-destructive">{errors.device_type.message}</p>
            )}
          </div>

          {/* OS */}
          <div className="grid gap-2">
            <Label htmlFor="eq-os">ระบบปฏิบัติการ</Label>
            <Input id="eq-os" placeholder="เช่น Windows 11" {...register('os')} />
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label>สถานะ</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => {
                if (!v) return
                setValue('status', v as 'ready' | 'maintenance' | 'broken', { shouldValidate: true })
              }}
              items={STATUSES.map(s => ({ label: s.label, value: s.value }))}
            >
              <SelectTrigger className="w-full" aria-label="สถานะ">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.status && (
              <p role="alert" className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Backup toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="eq-backup"
              className="h-4 w-4 rounded border-border"
              checked={watch('is_backup') === 'Y'}
              onChange={(e) => setValue('is_backup', e.target.checked ? 'Y' : 'N', { shouldValidate: true })}
            />
            <Label htmlFor="eq-backup" className="font-normal">อุปกรณ์สำรอง</Label>
          </div>

          {/* Software — fully controlled to prevent checkbox/input desync (C2) */}
          <div className="grid gap-2">
            <Label>ซอฟต์แวร์</Label>
            <div className="flex flex-wrap gap-2">
              {SOFTWARE_OPTIONS.map((name) => (
                <label key={name} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={currentSoftware.includes(name)}
                    onChange={() => toggleSoftware(name)}
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <Input
              placeholder="อื่นๆ (คั่นด้วย comma)"
              value={currentSoftware}
              onChange={(e) => setValue('software', e.target.value, { shouldValidate: true })}
              className="text-sm"
            />
          </div>

          {/* Internet speed */}
          <div className="grid gap-2">
            <Label htmlFor="eq-internet">ความเร็วอินเทอร์เน็ต (Mbps)</Label>
            <Input
              id="eq-internet"
              type="number"
              inputMode="numeric"
              placeholder="เช่น 30"
              {...register('internet_mbps')}
            />
          </div>

          {/* Responsible person */}
          <div className="grid gap-2">
            <Label htmlFor="eq-person">ผู้รับผิดชอบ</Label>
            <Input id="eq-person" {...register('responsible_person')} />
          </div>

          {/* Responsible tel */}
          <div className="grid gap-2">
            <Label htmlFor="eq-tel">เบอร์โทรผู้รับผิดชอบ</Label>
            <Input id="eq-tel" inputMode="tel" {...register('responsible_tel')} />
          </div>

          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="eq-note">หมายเหตุ</Label>
            <Textarea id="eq-note" rows={2} {...register('note')} />
          </div>

          {/* Root error */}
          {errors.root && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

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
