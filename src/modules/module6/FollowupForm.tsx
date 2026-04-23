import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { followupSchema, type FollowupFormValues } from '@/services/followupService'
import { useFollowupSave } from './useFollowup'

interface FollowupFormProps {
  vn: string
  onSuccess?: () => void
}

export function FollowupForm({ vn, onSuccess }: FollowupFormProps) {
  const saveMutation = useFollowupSave()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowupFormValues>({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      vn,
      followup_date: new Date().toISOString().split('T')[0],
      general_condition: '',
      side_effect: '',
      drug_adherence: '',
      other_note: '',
    },
  })

  const onSubmit = (data: FollowupFormValues) => {
    saveMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <input type="hidden" {...register('vn')} />

      <div className="grid gap-1.5">
        <Label>วันที่ติดตาม</Label>
        <Input
          type="date"
          {...register('followup_date')}
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
        <Textarea
          {...register('drug_adherence')}
          rows={2}
          placeholder="ผู้ป่วยรับประทานยาตามสั่งหรือไม่..."
        />
      </div>

      <div className="grid gap-1.5">
        <Label>หมายเหตุอื่นๆ</Label>
        <Textarea
          {...register('other_note')}
          rows={2}
          placeholder="บันทึกเพิ่มเติม..."
        />
      </div>

      <Button
        type="submit"
        className="bg-apple-blue hover:bg-apple-blue/90 self-end"
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการติดตาม'}
      </Button>
    </form>
  )
}
