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
  staff_sao: 'เจ้าหน้าที่ สสอ.',
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

  const displayLabel = ROLE_LABELS[value] || value || 'เลือกบทบาท'

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue>{displayLabel}</SelectValue>
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
