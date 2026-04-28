import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useLogin } from '@/hooks/useAuth'
import { getRoleHomePath } from '@/hooks/useAuth'
import { loginSchema, type LoginFormValues } from '@/services/authService'
import { useDebugMount } from '@/hooks/useDebugLog'
import { HospCodeSelect } from '@/components/common/HospCodeSelect'
import { useHospitalsList } from '@/hooks/useHospitals'

export default function LoginPage() {
  useDebugMount('LoginPage')
  const { user } = useAuthStore()
  const loginMutation = useLogin()
  const { data: hospitals = [] } = useHospitalsList()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { hosp_code: '', password: '' },
  })

  const onSubmit = (data: LoginFormValues) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data, {
      onError: (error) => {
        setError('root', { message: error.message })
      },
    })
  }

  // Already logged in → redirect to role-appropriate home
  if (user) return <Navigate to={getRoleHomePath(user.role)} replace />

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl tracking-tight">เข้าสู่ระบบ</CardTitle>
        <CardDescription>Telemed Tracking คปสอ.สอง</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {errors.root && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

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
              <p role="alert" className="text-xs text-destructive">
                {errors.hosp_code.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-apple-blue hover:bg-apple-blue/90"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-apple-blue hover:underline">
              สมัครสมาชิก
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
