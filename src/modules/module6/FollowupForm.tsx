import { useEffect, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO, isValid } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/common/DatePicker'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import { followupSchema, type FollowupFormValues, type FollowupUpdateValues } from '@/services/followupService'
import type { FollowupRecord } from '@/services/followupService'
import { useFollowupSave, useFollowupUpdate } from './useFollowup'
import { todayISO } from '@/utils/dateUtils'
import { X } from 'lucide-react'

interface FollowupFormProps {
  vn: string
  editRecord?: FollowupRecord | null
  onCancelEdit?: () => void
  onSuccess?: () => void
}

export function FollowupForm({ vn, editRecord, onCancelEdit, onSuccess }: FollowupFormProps) {
  const saveMutation = useFollowupSave()
  const updateMutation = useFollowupUpdate()
  const isEditing = !!editRecord
  const isPending = saveMutation.isPending || updateMutation.isPending

  const cleanDefaults = (): FollowupFormValues => ({
    vn,
    followup_date: editRecord?.followup_date ?? todayISO(),
    general_condition: editRecord?.general_condition ?? '',
    side_effect: editRecord?.side_effect ?? '',
    drug_adherence: editRecord?.drug_adherence ?? '',
    other_note: editRecord?.other_note ?? '',
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FollowupFormValues>({
    resolver: zodResolver(followupSchema),
    defaultValues: cleanDefaults(),
  })

  // Re-initialize form when editRecord changes
  useEffect(() => {
    reset({
      vn,
      followup_date: editRecord?.followup_date ?? todayISO(),
      general_condition: editRecord?.general_condition ?? '',
      side_effect: editRecord?.side_effect ?? '',
      drug_adherence: editRecord?.drug_adherence ?? '',
      other_note: editRecord?.other_note ?? '',
    })
  }, [editRecord, vn, reset])

  // DatePicker integration: form stores 'yyyy-MM-dd' string, DatePicker uses Date
  const followupDateStr = watch('followup_date') ?? ''
  const followupDateObj = useMemo(() => {
    if (!followupDateStr) return undefined
    const d = parseISO(followupDateStr)
    return isValid(d) ? d : undefined
  }, [followupDateStr])

  const handleDateChange = useCallback((d: Date | undefined) => {
    setValue('followup_date', d ? format(d, 'yyyy-MM-dd') : '', { shouldValidate: true })
  }, [setValue])

  const onSubmit = (data: FollowupFormValues) => {
    if (isEditing && editRecord) {
      const updateData: FollowupUpdateValues = {
        ...data,
        followup_id: editRecord.followup_id,
      }
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onCancelEdit?.()
          onSuccess?.()
        },
      })
    } else {
      saveMutation.mutate(data, {
        onSuccess: () => {
          reset({ vn, followup_date: todayISO(), general_condition: '', side_effect: '', drug_adherence: '', other_note: '' })
          onSuccess?.()
        },
      })
    }
  }

  return (
    <LoadingOverlay loading={isPending} text="กำลังบันทึก...">
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <input type="hidden" {...register('vn')} />

      <div className="grid gap-1.5">
        <Label>วันที่ติดตาม</Label>
        <DatePicker
          value={followupDateObj}
          onChange={handleDateChange}
          placeholder="เลือกวันที่"
          className="w-full"
        />
        {errors.followup_date && (
          <span className="text-xs text-destructive">{errors.followup_date.message}</span>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label>อาการทั่วไป</Label>
        <Textarea
          {...register('general_condition')}
          rows={2}
          placeholder="สภาพทั่วไปของผู้ป่วย..."
        />
      </div>

      <div className="grid gap-1.5">
        <Label>ผลข้างเคียง</Label>
        <Textarea
          {...register('side_effect')}
          rows={2}
          placeholder="อาการข้างเคียงจากยา (ถ้ามี)..."
        />
      </div>

      <div className="grid gap-1.5">
        <Label>การรับประทานยา</Label>
        <Select
          value={watch('drug_adherence') ?? 'ไม่ได้ระบุ'}
          onValueChange={(v) => setValue('drug_adherence', (v != null && v !== 'ไม่ได้ระบุ') ? v : '', { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="เลือก..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ไม่ได้ระบุ">—</SelectItem>
            <SelectItem value="กินยาครบตามสั่ง">กินยาครบตามสั่ง</SelectItem>
            <SelectItem value="กินยาไม่ครบ">กินยาไม่ครบ</SelectItem>
            <SelectItem value="ไม่ได้กินยาเลย">ไม่ได้กินยาเลย</SelectItem>
            <SelectItem value="มีนัดมารับยา">มีนัดมารับยา</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>หมายเหตุอื่นๆ</Label>
        <Textarea
          {...register('other_note')}
          rows={2}
          placeholder="บันทึกเพิ่มเติม..."
        />
      </div>

      <div className="flex gap-2 self-end">
        {isEditing && onCancelEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => { onCancelEdit() }}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-1" />
            ยกเลิก
          </Button>
        )}
        <Button
          type="submit"
          className="bg-apple-blue hover:bg-apple-blue/90"
          disabled={isPending}
        >
          {isPending
            ? 'กำลังบันทึก...'
            : isEditing
              ? 'แก้ไขการติดตาม'
              : 'บันทึกการติดตาม'}
        </Button>
      </div>
    </form>
    </LoadingOverlay>
  )
}
