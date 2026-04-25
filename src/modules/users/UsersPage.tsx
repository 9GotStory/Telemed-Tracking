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

export default function UsersPage() {
  useDebugMount('UsersPage')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [approveUser, setApproveUser] = useState<UserItem | null>(null)

  const filters = useMemo<UserFilters>(() => {
    const f: UserFilters = {}
    if (statusFilter && statusFilter !== '__all__') f.status = statusFilter
    if (roleFilter && roleFilter !== '__all__') f.role = roleFilter
    return f
  }, [statusFilter, roleFilter])

  const { data: users = [], isLoading, isError, refetch } = useUsersList(filters)
  const pendingCount = users.filter((u) => u.status === 'pending').length

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
          <Select value={statusFilter || '__all__'} onValueChange={(v) => { if (v) setStatusFilter(v === '__all__' ? '' : v) }} items={[{ label: 'ทุกสถานะ', value: '__all__' }, { label: 'รออนุมัติ', value: 'pending' }, { label: 'ใช้งานอยู่', value: 'active' }, { label: 'ระงับ', value: 'inactive' }]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__all__">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รออนุมัติ</SelectItem>
                <SelectItem value="active">ใช้งานอยู่</SelectItem>
                <SelectItem value="inactive">ระงับ</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={roleFilter || '__all__'} onValueChange={(v) => { if (v) setRoleFilter(v === '__all__' ? '' : v) }} items={[{ label: 'ทุกบทบาท', value: '__all__' }, { label: 'Super Admin', value: 'super_admin' }, { label: 'Admin รพ.', value: 'admin_hosp' }, { label: 'จนท. รพ.', value: 'staff_hosp' }, { label: 'จนท. รพ.สต.', value: 'staff_hsc' }]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="ทุกบทบาท" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__all__">ทุกบทบาท</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin_hosp">Admin รพ.</SelectItem>
                <SelectItem value="staff_hosp">จนท. รพ.</SelectItem>
                <SelectItem value="staff_hsc">จนท. รพ.สต.</SelectItem>
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
