import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { usePasswordReset } from './useUsers'
import type { UserItem } from '@/services/usersService'

const resetFormSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      .optional()
      .or(z.literal('')),
    confirm_password: z.string().optional().or(z.literal('')),
  })
  .refine(
    (d) => {
      if (!d.new_password) return true
      return d.new_password === d.confirm_password
    },
    { message: 'รหัสผ่านไม่ตรงกัน', path: ['confirm_password'] },
  )

type ResetFormValues = z.infer<typeof resetFormSchema>

interface ResultData {
  password: string
  wasAdminSet: boolean
}

interface PasswordResetDialogProps {
  user: UserItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({ user, open, onOpenChange }: PasswordResetDialogProps) {
  const resetMutation = usePasswordReset()
  const [result, setResult] = useState<ResultData | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  const newPasswordValue = watch('new_password')
  const hasPassword = newPasswordValue && newPasswordValue.length > 0

  const onSubmit = (values: ResetFormValues) => {
    if (!user) return
    const adminSet = !!values.new_password

    resetMutation.mutate(
      {
        user_id: user.user_id,
        new_password: values.new_password || undefined,
      },
      {
        onSuccess: (data) => {
          setResult({
            password: data.temp_password ?? '',
            wasAdminSet: adminSet,
          })
          reset()
        },
      },
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
      setResult(null)
    }
    onOpenChange(nextOpen)
  }

  // Show result screen
  if (result && user) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่านสำเร็จ</DialogTitle>
            <DialogDescription>
              {user.first_name} {user.last_name} ({user.hosp_name || user.hosp_code})
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800 mb-2 font-medium">
              {result.wasAdminSet ? 'รหัสผ่านที่ตั้งไว้:' : 'รหัสผ่านชั่วคราว:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-lg font-mono tracking-wider border text-center select-all">
                {result.password}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(result.password)}
              >
                คัดลอก
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            ผู้ใช้จะต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก กรุณาแจ้งรหัสผ่านนี้ให้ผู้ใช้ทราบ
          </div>

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
          <DialogDescription>
            {user && (
              <span>
                {user.first_name} {user.last_name} ({user.hosp_name || user.hosp_code})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            หากไม่กรอกรหัสผ่าน ระบบจะสร้างรหัสผ่านชั่วคราวให้อัตโนมัติ ผู้ใช้จะต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new_password">กำหนดรหัสผ่านใหม่</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
              {...register('new_password')}
            />
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          {hasPassword && (
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...register('confirm_password')}
              />
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
          )}

          {resetMutation.error && (
            <p className="text-sm text-destructive">{resetMutation.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="bg-apple-blue hover:bg-apple-blue/90"
            >
              {resetMutation.isPending ? 'กำลังบันทึก...' : 'รีเซ็ตรหัสผ่าน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
