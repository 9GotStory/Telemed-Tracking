import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useDrugSave } from './useMasterDrug'
import { drugSchema, type DrugFormValues } from '@/services/drugService'
import type { MasterDrug } from '@/types/drug'

interface DrugFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drug?: MasterDrug | null
}

function getFormDefaults(drug: MasterDrug | null | undefined): DrugFormValues {
  return drug
    ? {
        drug_id: drug.drug_id,
        drug_name: drug.drug_name,
        strength: drug.strength,
        unit: drug.unit,
      }
    : {
        drug_name: '',
        strength: '',
        unit: '',
      }
}

export function DrugForm({ open, onOpenChange, drug }: DrugFormProps) {
  const saveMutation = useDrugSave()
  const isEditing = !!drug

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(drugSchema),
    defaultValues: getFormDefaults(drug),
  })

  // Reset form when dialog opens or drug changes
  useEffect(() => {
    if (open) {
      reset(getFormDefaults(drug))
    }
  }, [open, drug, reset])

  const onSubmit = (data: DrugFormValues) => {
    if (saveMutation.isPending) return
    saveMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false)
      },
      onError: (error) => {
        // FK violation: drug_name change blocked
        if (error.message.includes('referenced')) {
          setError('root', { type: 'manual', message: error.message })
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขยา' : 'เพิ่มยา'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'แบบฟอร์มแก้ไขข้อมูลยา' : 'แบบฟอร์มเพิ่มยาใหม่ในระบบ'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as (data: DrugFormValues) => void)} className="grid gap-4">
          {/* Drug Name */}
          <div className="grid gap-2">
            <Label htmlFor="drug-name">ชื่อยา</Label>
            <Input
              id="drug-name"
              placeholder="เช่น Metformin"
              {...register('drug_name')}
            />
            {errors.drug_name && (
              <p role="alert" className="text-xs text-destructive">{errors.drug_name.message}</p>
            )}
          </div>

          {/* Strength */}
          <div className="grid gap-2">
            <Label htmlFor="drug-strength">ความแรง</Label>
            <Input
              id="drug-strength"
              placeholder="เช่น 500 mg"
              {...register('strength')}
            />
            {errors.strength && (
              <p role="alert" className="text-xs text-destructive">{errors.strength.message}</p>
            )}
          </div>

          {/* Unit */}
          <div className="grid gap-2">
            <Label htmlFor="drug-unit">หน่วย</Label>
            <Input
              id="drug-unit"
              placeholder="เช่น เม็ด"
              {...register('unit')}
            />
            {errors.unit && (
              <p role="alert" className="text-xs text-destructive">{errors.unit.message}</p>
            )}
          </div>

          {/* Root error (FK violation etc.) */}
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
