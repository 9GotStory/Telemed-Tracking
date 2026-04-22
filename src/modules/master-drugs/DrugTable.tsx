import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { MasterDrug } from '@/types/drug'

interface DrugTableProps {
  data: MasterDrug[]
  onEdit: (item: MasterDrug) => void
  onDelete: (item: MasterDrug) => void
}

export function DrugTable({ data, onEdit, onDelete }: DrugTableProps) {
  const columns: Column<MasterDrug>[] = [
    {
      key: 'drug_name',
      header: 'ชื่อยา',
      sortable: true,
      className: 'min-w-[200px]',
      render: (row) => (
        <span className="font-medium">{row.drug_name}</span>
      ),
    },
    {
      key: 'strength',
      header: 'ความแรง',
      sortable: true,
      className: 'w-32',
    },
    {
      key: 'unit',
      header: 'หน่วย',
      sortable: true,
      className: 'w-24',
    },
    {
      key: 'active',
      header: 'สถานะ',
      sortable: true,
      className: 'w-28',
      render: (row) => (
        <StatusBadge variant={row.active === 'Y' ? 'active' : 'inactive'}>
          {row.active === 'Y' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
            aria-label="แก้ไข"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
            aria-label="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<MasterDrug>
      columns={columns}
      data={data}
      keyExtractor={(row) => row.drug_id}
      emptyMessage="ไม่พบข้อมูลยา"
    />
  )
}
