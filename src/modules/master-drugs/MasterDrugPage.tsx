import { useState, useMemo } from 'react'
import { Plus, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { QueryError } from '@/components/common/QueryError'
import { useDrugList, useDrugDelete } from './useMasterDrug'
import { DrugTable } from './DrugTable'
import { DrugForm } from './DrugForm'
import { DrugImport } from './DrugImport'
import type { MasterDrug } from '@/types/drug'

const ACTIVE_FILTERS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'Y', label: 'ใช้งาน' },
  { value: 'N', label: 'ไม่ใช้งาน' },
] as const

export default function MasterDrugPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDrug, setEditingDrug] = useState<MasterDrug | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterDrug | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importKey, setImportKey] = useState(0)

  const filters = useMemo(() => {
    const f: { active?: 'Y' | 'N'; search?: string } = {}
    if (activeFilter !== 'all') f.active = activeFilter as 'Y' | 'N'
    if (searchQuery.trim()) f.search = searchQuery.trim()
    return f
  }, [activeFilter, searchQuery])

  const { data: drugs = [], isLoading, isError, refetch } = useDrugList(filters)
  const deleteMutation = useDrugDelete()

  const handleEdit = (drug: MasterDrug) => {
    setEditingDrug(drug)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingDrug(null)
    setFormOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget || deleteMutation.isPending) return
    deleteMutation.mutate(deleteTarget.drug_id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">คลังชื่อยา</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setImportKey((k) => k + 1); setImportOpen(true) }}>
              <Upload className="h-4 w-4 mr-1" />
              นำเข้า
            </Button>
            <Button className="bg-apple-blue hover:bg-apple-blue/90" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มยา
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <Select value={activeFilter} onValueChange={(v) => { if (v) setActiveFilter(v) }}>
            <SelectTrigger className="w-32" aria-label="กรองตามสถานะ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVE_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อยา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดข้อมูล..." />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : (
          <DrugTable
            data={drugs}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      <DrugForm
        open={formOpen}
        onOpenChange={setFormOpen}
        drug={editingDrug}
      />

      {/* Import Dialog */}
      <DrugImport
        key={importKey}
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="ยืนยันการลบยา"
        description={
          deleteTarget
            ? `ต้องการลบ "${deleteTarget.drug_name} ${deleteTarget.strength}" ออกจากรายการ? ยาจะถูกเปลี่ยนสถานะเป็น "ไม่ใช้งาน" และจะไม่ปรากฏในรายการเลือกยา`
            : ''
        }
        confirmLabel={deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </PageWrapper>
  )
}
