import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MANAGED_ROLES } from '@/constants/roles'
import type { UserRole } from '@/types/user'
import { useAuthStore } from '@/stores/authStore'

interface RoleSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_hosp: 'Admin รพ.',
  staff_hosp: 'จนท. รพ.',
  staff_hsc: 'จนท. รพ.สต.',
}

export function RoleSelector({ value, onValueChange }: RoleSelectorProps) {
  const user = useAuthStore((s) => s.user)
  const callerRole = (user?.role ?? 'staff_hsc') as UserRole
  const managed = MANAGED_ROLES[callerRole] ?? []

  if (managed.length === 0) return null

  const handleValueChange = (val: string | null) => {
    if (val) onValueChange(val)
  }

  return (
    <Select value={value} onValueChange={handleValueChange} items={managed.map(role => ({ label: ROLE_LABELS[role] ?? role, value: role }))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="เลือกบทบาท" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {managed.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
