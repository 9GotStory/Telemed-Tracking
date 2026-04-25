import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RoleSelector } from './RoleSelector'
import { useUserApprove } from './useUsers'
import type { UserItem } from '@/services/usersService'

interface ApprovalFormProps {
  user: UserItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApprovalForm({ user, open, onOpenChange }: ApprovalFormProps) {
  const [role, setRole] = useState('')
  const approveMutation = useUserApprove(() => {
    setRole('')
    onOpenChange(false)
  })

  if (!user) return null

  const handleApprove = () => {
    if (!role) return
    approveMutation.mutate({ user_id: user.user_id, role })
  }

  const handleReject = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>อนุมัติผู้ใช้</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">รหัสสถานพยาบาล</span>
              <div className="font-medium">{user.hosp_name || user.hosp_code} ({user.hosp_code})</div>
            </div>
            <div>
              <span className="text-muted-foreground">ชื่อ-สกุล</span>
              <div className="font-medium">{user.first_name} {user.last_name}</div>
            </div>
            <div>
              <span className="text-muted-foreground">เบอร์โทร</span>
              <div className="font-medium">{user.tel}</div>
            </div>
            <div>
              <span className="text-muted-foreground">สถานะ</span>
              <div className="font-medium">{user.status}</div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground">กำหนดบทบาท</span>
            <div className="mt-1">
              <RoleSelector value={role} onValueChange={setRole} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReject}>
            ปิด
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!role || approveMutation.isPending}
            className="bg-apple-blue hover:bg-apple-blue/90"
          >
            {approveMutation.isPending ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
