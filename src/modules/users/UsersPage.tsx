import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QueryError } from '@/components/common/QueryError'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserTable } from './UserTable'
import { ApprovalForm } from './ApprovalForm'
import { useUsersList } from './useUsers'
import type { UserFilters, UserItem } from '@/services/usersService'
import { useDebugMount } from '@/hooks/useDebugLog'

const STATUS_OPTIONS = [
  { value: '__all__', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'รออนุมัติ' },
  { value: 'active', label: 'ใช้งานอยู่' },
  { value: 'inactive', label: 'ระงับ' },
] as const

const ROLE_OPTIONS = [
  { value: '__all__', label: 'ทุกบทบาท' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_hosp', label: 'Admin รพ.' },
  { value: 'staff_sao', label: 'เจ้าหน้าที่ สสอ.' },
  { value: 'staff_hosp', label: 'จนท. รพ.' },
  { value: 'staff_hsc', label: 'จนท. รพ.สต.' },
] as const

export default function UsersPage() {
  useDebugMount('UsersPage')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [roleFilter, setRoleFilter] = useState('__all__')
  const [approveUser, setApproveUser] = useState<UserItem | null>(null)

  const filters = useMemo<UserFilters>(() => {
    const f: UserFilters = {}
    if (statusFilter !== '__all__') f.status = statusFilter
    if (roleFilter !== '__all__') f.role = roleFilter
    return f
  }, [statusFilter, roleFilter])

  const { data: users = [], isLoading, isError, refetch } = useUsersList(filters)
  const pendingCount = users.filter((u) => u.status === 'pending').length

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'ทุกสถานะ'
  const roleLabel = ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label ?? 'ทุกบทบาท'

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">จัดการผู้ใช้</h1>
          <p className="text-sm text-muted-foreground mt-1">
            อนุมัติและจัดการบัญชีผู้ใช้งาน
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                รออนุมัติ {pendingCount}
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
            <SelectTrigger className="w-full">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v) => { if (v) setRoleFilter(v) }}>
            <SelectTrigger className="w-full">
              <SelectValue>{roleLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* User table */}
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดข้อมูล..." />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <UserTable users={users} onApprove={(u) => setApproveUser(u)} />
        )}

        {/* Approval dialog */}
        <ApprovalForm
          user={approveUser}
          open={!!approveUser}
          onOpenChange={(open) => { if (!open) setApproveUser(null) }}
        />
      </div>
    </PageWrapper>
  )
}
