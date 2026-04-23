import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordChangeSchema, type PasswordChangeValues } from '@/services/authService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

export function PasswordChangeDialog() {
  const { forceChange, user, clearAuth } = useAuthStore()

  const changeMutation = useMutation({
    mutationFn: (data: { new_password: string }) => authService.changePassword(data),
    onSuccess: () => {
      sessionStorage.removeItem('force_change')
      useAuthStore.setState({ forceChange: false })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
  })

  const onSubmit = (values: PasswordChangeValues) => {
    changeMutation.mutate({ new_password: values.new_password })
  }

  const handleLogout = () => {
    clearAuth()
  }

  return (
    <Dialog open={forceChange} onOpenChange={(open) => { if (!open) handleLogout() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          บัญชีของคุณถูกรีเซ็ตรหัสผ่าน กรุณาตั้งรหัสผ่านใหม่
          {user && (
            <span className="block mt-1 font-medium text-foreground">
              {user.first_name} {user.last_name} ({user.hosp_code})
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new_password">รหัสผ่านใหม่</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...register('new_password')}
            />
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>

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

          {changeMutation.error && (
            <p className="text-sm text-destructive">{changeMutation.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleLogout}>
              ออกจากระบบ
            </Button>
            <Button
              type="submit"
              disabled={changeMutation.isPending}
              className="bg-apple-blue hover:bg-apple-blue/90"
            >
              {changeMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
