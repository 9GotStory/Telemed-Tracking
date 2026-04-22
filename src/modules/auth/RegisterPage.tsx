import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useRegister } from '@/hooks/useAuth'
import { registerSchema, type RegisterFormValues } from '@/services/authService'

export default function RegisterPage() {
  const { user } = useAuthStore()
  const registerMutation = useRegister()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hosp_code: '',
      password: '',
      first_name: '',
      last_name: '',
      tel: '',
    },
  })

  const onSubmit = (data: RegisterFormValues) => {
    if (registerMutation.isPending) return
    registerMutation.mutate(data, {
      onSuccess: () => {
        setSubmitted(true)
      },
      onError: (error) => {
        setError('root', { message: error.message })
      },
    })
  }

  // Already logged in → redirect (after all hooks)
  if (user) return <Navigate to="/module1" replace />

  // Success state — show awaiting approval message
  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl tracking-tight">ลงทะเบียนสำเร็จ</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            การลงทะเบียนของคุณอยู่ระหว่างรอการอนุมัติ
            กรุณารอผู้ดูแลระบบอนุมัติบัญชีก่อนเข้าใช้งาน
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4 w-full">
              กลับไปเข้าสู่ระบบ
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl tracking-tight">สมัครสมาชิก</CardTitle>
        <CardDescription>กรอกข้อมูลเพื่อลงทะเบียน</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {errors.root && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reg-hosp_code">รหัสสถานพยาบาล</Label>
            <Input
              id="reg-hosp_code"
              placeholder="เช่น 10669"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={!!errors.hosp_code}
              aria-describedby={errors.hosp_code ? 'reg-hosp_code-error' : undefined}
              {...register('hosp_code')}
            />
            {errors.hosp_code && (
              <p id="reg-hosp_code-error" role="alert" className="text-xs text-destructive">
                {errors.hosp_code.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-first_name">ชื่อ</Label>
            <Input
              id="reg-first_name"
              autoComplete="given-name"
              aria-invalid={!!errors.first_name}
              aria-describedby={errors.first_name ? 'reg-first_name-error' : undefined}
              {...register('first_name')}
            />
            {errors.first_name && (
              <p id="reg-first_name-error" role="alert" className="text-xs text-destructive">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-last_name">นามสกุล</Label>
            <Input
              id="reg-last_name"
              autoComplete="family-name"
              aria-invalid={!!errors.last_name}
              aria-describedby={errors.last_name ? 'reg-last_name-error' : undefined}
              {...register('last_name')}
            />
            {errors.last_name && (
              <p id="reg-last_name-error" role="alert" className="text-xs text-destructive">
                {errors.last_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-tel">เบอร์โทรศัพท์</Label>
            <Input
              id="reg-tel"
              placeholder="0812345678"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.tel}
              aria-describedby={errors.tel ? 'reg-tel-error' : undefined}
              {...register('tel')}
            />
            {errors.tel && (
              <p id="reg-tel-error" role="alert" className="text-xs text-destructive">
                {errors.tel.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reg-password">รหัสผ่าน</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="reg-password-error" role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-apple-blue hover:bg-apple-blue/90"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="text-apple-blue hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
