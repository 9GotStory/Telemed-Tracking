import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useRegister } from '@/hooks/useAuth'
import { registerSchema, type RegisterFormValues } from '@/services/authService'
import { useDebugMount } from '@/hooks/useDebugLog'
import { HospCodeSelect } from '@/components/common/HospCodeSelect'
import { useHospitalsList } from '@/hooks/useHospitals'
import { Check, X, User } from 'lucide-react'

/** Username requirements for the hint display */
const USERNAME_RULES = [
  { label: '4-20 ตัวอักษร', test: (v: string) => v.length >= 4 && v.length <= 20 },
  { label: 'ภาษาอังกฤษตัวพิมพ์เล็ก, ตัวเลข, _', test: (v: string) => /^[a-z0-9_]+$/.test(v) },
]

export default function RegisterPage() {
  useDebugMount('RegisterPage')
  const { user } = useAuthStore()
  const registerMutation = useRegister()
  const [submitted, setSubmitted] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)
  const { data: hospitals = [] } = useHospitalsList()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      hosp_code: '',
      password: '',
      first_name: '',
      last_name: '',
      tel: '',
    },
  })

  const usernameValue = watch('username')

  const onSubmit = (data: RegisterFormValues) => {
    if (registerMutation.isPending) return
    registerMutation.mutate(data, {
      onSuccess: (res) => {
        setAutoApproved(res.auto_approved ?? false)
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
          {autoApproved ? (
            <>
              <p className="text-sm text-muted-foreground">
                บัญชีของคุณพร้อมใช้งานแล้ว
              </p>
              <Link to="/login">
                <Button className="mt-4 w-full bg-apple-blue hover:bg-apple-blue/90">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                การลงทะเบียนของคุณอยู่ระหว่างรอการอนุมัติ
                กรุณารอผู้ดูแลระบบอนุมัติบัญชีก่อนเข้าใช้งาน
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4 w-full">
                  กลับไปเข้าสู่ระบบ
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
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

          {/* Username field */}
          <div className="grid gap-2">
            <Label htmlFor="reg-username">ชื่อผู้ใช้</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-username"
                placeholder="somchai"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="pl-9"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'reg-username-error' : undefined}
                {...register('username')}
              />
            </div>
            {/* Username rule hints */}
            {usernameValue.length > 0 && (
              <div className="space-y-1">
                {USERNAME_RULES.map((rule) => {
                  const passed = rule.test(usernameValue)
                  return (
                    <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                      {passed ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passed ? 'text-green-600' : 'text-muted-foreground'}>
                        {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.username && (
              <p id="reg-username-error" role="alert" className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Hospital select */}
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
              <p id="reg-hosp_code-error" role="alert" className="text-xs text-destructive">
                {errors.hosp_code.message}
              </p>
            )}
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Tel */}
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

          {/* Password */}
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
