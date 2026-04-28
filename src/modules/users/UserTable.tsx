import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Button } from '@/components/ui/button'
import { useUserUpdate } from './useUsers'
import { PasswordResetDialog } from './PasswordResetDialog'
import type { UserItem } from '@/services/usersService'
import { formatBuddhist } from '@/utils/dateUtils'
import { useState } from 'react'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_hosp: 'Admin รพ.',
  staff_hosp: 'จนท. รพ.',
  staff_hsc: 'จนท. รพ.สต.',
}

const STATUS_VARIANT: Record<string, 'active' | 'pending' | 'inactive'> = {
  active: 'active',
  pending: 'pending',
  inactive: 'inactive',
}

interface UserTableProps {
  users: UserItem[]
  onApprove: (user: UserItem) => void
}

export function UserTable({ users, onApprove }: UserTableProps) {
  const updateMutation = useUserUpdate()
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const [resetUser, setResetUser] = useState<UserItem | null>(null)

  const handleSuspend = (user: UserItem) => {
    setConfirmAction({
      title: 'ระงับผู้ใช้',
      description: `ต้องการระงับ ${user.first_name} ${user.last_name} หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้`,
      onConfirm: () => {
        updateMutation.mutate(
          { user_id: user.user_id, status: 'inactive' },
          { onSuccess: () => setConfirmAction(null) },
        )
      },
    })
  }

  const handleReactivate = (user: UserItem) => {
    updateMutation.mutate({ user_id: user.user_id, status: 'active' })
  }

  if (users.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">ไม่พบผู้ใช้</div>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">ชื่อผู้ใช้</th>
              <th className="pb-2 pr-3 font-medium">สถานพยาบาล</th>
              <th className="pb-2 pr-3 font-medium">ชื่อ-สกุล</th>
              <th className="pb-2 pr-3 font-medium">เบอร์โทร</th>
              <th className="pb-2 pr-3 font-medium">บทบาท</th>
              <th className="pb-2 pr-3 font-medium">สถานะ</th>
              <th className="pb-2 pr-3 font-medium">สมัครเมื่อ</th>
              <th className="pb-2 font-medium text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const statusVariant = STATUS_VARIANT[user.status] ?? 'pending'
              return (
                <tr key={user.user_id} className="border-b hover:bg-btn-default-light/30">
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-sm font-medium">{user.username}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs">
                    <span className="font-medium">{user.hosp_name || user.hosp_code}</span>
                    <span className="text-muted-foreground ml-1">({user.hosp_code})</span>
                  </td>
                  <td className="py-2.5 pr-3">{user.first_name} {user.last_name}</td>
                  <td className="py-2.5 pr-3">{user.tel}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge variant="info">{ROLE_LABELS[user.role] ?? user.role}</StatusBadge>
                  </td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge variant={statusVariant}>{user.status}</StatusBadge>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {formatBuddhist(user.created_at.split('T')[0])}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      {user.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => onApprove(user)}>
                          อนุมัติ
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setResetUser(user)}>
                            รีเซ็ตพาส
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleSuspend(user)}>
                            ระงับ
                          </Button>
                        </>
                      )}
                      {user.status === 'inactive' && (
                        <Button size="sm" variant="outline" onClick={() => handleReactivate(user)}>
                          เปิดใช้ใหม่
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {confirmAction && (
        <ConfirmModal
          open
          onOpenChange={() => setConfirmAction(null)}
          title={confirmAction.title}
          description={confirmAction.description}
          onConfirm={confirmAction.onConfirm}
        />
      )}

      <PasswordResetDialog
        user={resetUser}
        open={!!resetUser}
        onOpenChange={(open) => { if (!open) setResetUser(null) }}
      />
    </>
  )
}
