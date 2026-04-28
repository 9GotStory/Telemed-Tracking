import { Monitor, Laptop, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { EquipmentWithHospName } from '@/types/equipment'

interface EquipmentTableProps {
  data: EquipmentWithHospName[]
  onEdit: (item: EquipmentWithHospName) => void
  onDelete: (item: EquipmentWithHospName) => void
  showHospName: boolean
}

const statusMap: Record<string, { variant: 'active' | 'pending' | 'inactive' | 'error'; label: string }> = {
  ready: { variant: 'active', label: 'พร้อมใช้งาน' },
  maintenance: { variant: 'pending', label: 'ซ่อมบำรุง' },
  broken: { variant: 'error', label: 'ชำรุด' },
  inactive: { variant: 'inactive', label: 'ไม่ใช้งาน' },
}

export function EquipmentTable({ data, onEdit, onDelete, showHospName }: EquipmentTableProps) {
  const columns: Column<EquipmentWithHospName>[] = [
    ...(showHospName
      ? [{
          key: 'hosp_name',
          header: 'สถานพยาบาล',
          sortable: true,
          render: (row: EquipmentWithHospName) => row.hosp_name,
        }]
      : []),
    {
      key: 'set_type',
      header: 'ชุดอุปกรณ์',
      sortable: true,
      className: 'w-40',
      render: (row) => {
        const isSetA = row.set_type === 'A'
        return (
          <span className="inline-flex items-center gap-1.5 font-medium">
            {isSetA
              ? <Monitor className="h-3.5 w-3.5 text-apple-blue" />
              : <Laptop className="h-3.5 w-3.5 text-apple-blue" />
            }
            {isSetA ? 'Desktop' : 'Notebook'}
          </span>
        )
      },
    },
    {
      key: 'os',
      header: 'OS',
      sortable: true,
      className: 'w-32',
    },
    {
      key: 'status',
      header: 'สถานะ',
      sortable: true,
      className: 'w-32',
      render: (row) => {
        const info = statusMap[row.status] ?? { variant: 'pending' as const, label: row.status }
        return <StatusBadge variant={info.variant}>{info.label}</StatusBadge>
      },
    },
    {
      key: 'internet_mbps',
      header: 'Internet',
      sortable: true,
      className: 'w-20 text-right',
      render: (row) => row.internet_mbps != null ? `${row.internet_mbps} Mbps` : '-',
    },
    {
      key: 'responsible_person',
      header: 'ผู้รับผิดชอบ',
      sortable: true,
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
            title="แก้ไข"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
            title="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<EquipmentWithHospName>
      columns={columns}
      data={data}
      keyExtractor={(row) => row.equip_id}
      emptyMessage="ไม่พบข้อมูลอุปกรณ์"
    />
  )
}
