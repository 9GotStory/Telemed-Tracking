import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { QueryError } from '@/components/common/QueryError'
import { useAuthStore } from '@/stores/authStore'
import { useEquipmentList, useEquipmentDelete } from './useEquipment'
import { EquipmentTable } from './EquipmentTable'
import { EquipmentForm } from './EquipmentForm'
import type { EquipmentWithHospName } from '@/types/equipment'
import type { EquipStatus } from '@/types/equipment'
import { useDebugMount } from '@/hooks/useDebugLog'

const STATUS_FILTERS = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'ready', label: 'พร้อมใช้งาน' },
  { value: 'maintenance', label: 'ซ่อมบำรุง' },
  { value: 'broken', label: 'ชำรุด' },
] as const

export default function EquipmentPage() {
  useDebugMount('EquipmentPage')
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EquipmentWithHospName | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EquipmentWithHospName | null>(null)

  // staff_hsc auto-filters on GAS side, but we pass hosp_code for clarity
  const filters = useMemo(() => {
    const f: { hosp_code?: string; status?: EquipStatus } = {}
    if (statusFilter !== 'all') f.status = statusFilter as EquipStatus
    return f
  }, [statusFilter])

  const { data: equipment = [], isLoading, isError, refetch } = useEquipmentList(filters)
  const deleteMutation = useEquipmentDelete()

  const showHospName = user?.role === 'admin_hosp' || user?.role === 'super_admin'

  const handleEdit = (item: EquipmentWithHospName) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.equip_id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">ทะเบียนอุปกรณ์</h1>
          <Button
            className="bg-apple-blue hover:bg-apple-blue/90"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มอุปกรณ์
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }} items={STATUS_FILTERS.map(f => ({ label: f.label, value: f.value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {user && (
            <span className="text-xs text-muted-foreground">
              {user.hosp_name}
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดข้อมูล..." />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <EquipmentTable
            data={equipment}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            showHospName={showHospName}
          />
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      <EquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editingItem}
        defaultHospCode={user?.role === 'staff_hosp' || user?.role === 'staff_hsc' ? user?.hosp_code : undefined}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="ยืนยันการลบอุปกรณ์"
        description={
          deleteTarget
            ? `ต้องการลบ "${deleteTarget.device_type} ชุด ${deleteTarget.set_type}" ของ ${deleteTarget.hosp_name}? อุปกรณ์จะถูกเปลี่ยนสถานะเป็น "ไม่ใช้งาน"`
            : ''
        }
        confirmLabel={deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </PageWrapper>
  )
}
