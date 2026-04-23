import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ReadinessLogWithHospName, OverallStatus } from '@/types/readiness'

interface ReadinessHistoryProps {
  data: ReadinessLogWithHospName[]
}

const statusMap: Record<OverallStatus, { variant: 'active' | 'pending' | 'inactive'; label: string }> = {
  ready: { variant: 'active', label: 'พร้อม' },
  need_fix: { variant: 'pending', label: 'ต้องแก้ไข' },
  not_ready: { variant: 'inactive', label: 'ไม่พร้อม' },
}

export function ReadinessHistory({ data }: ReadinessHistoryProps) {
  const columns: Column<ReadinessLogWithHospName>[] = [
    {
      key: 'check_date',
      header: 'วันที่ตรวจ',
      sortable: true,
      className: 'w-28',
    },
    {
      key: 'overall_status',
      header: 'สถานะ',
      sortable: true,
      className: 'w-28',
      render: (row) => {
        const info = statusMap[row.overall_status] ?? { variant: 'pending' as const, label: row.overall_status }
        return <StatusBadge variant={info.variant}>{info.label}</StatusBadge>
      },
    },
    {
      key: 'cam_ok',
      header: 'กล้อง',
      className: 'w-16 text-center',
      render: (row) => row.cam_ok === 'Y' ? '✓' : '✗',
    },
    {
      key: 'mic_ok',
      header: 'ไมค์',
      className: 'w-16 text-center',
      render: (row) => row.mic_ok === 'Y' ? '✓' : '✗',
    },
    {
      key: 'pc_ok',
      header: 'คอม',
      className: 'w-16 text-center',
      render: (row) => row.pc_ok === 'Y' ? '✓' : '✗',
    },
    {
      key: 'internet_ok',
      header: 'เน็ต',
      className: 'w-16 text-center',
      render: (row) => row.internet_ok === 'Y' ? '✓' : '✗',
    },
    {
      key: 'software_ok',
      header: 'ซอฟต์แวร์',
      className: 'w-20 text-center',
      render: (row) => row.software_ok === 'Y' ? '✓' : '✗',
    },
    {
      key: 'note',
      header: 'หมายเหตุ',
      className: 'max-w-[200px] truncate',
    },
  ]

  return (
    <DataTable<ReadinessLogWithHospName>
      columns={columns}
      data={data}
      keyExtractor={(row) => row.log_id}
      emptyMessage="ไม่มีประวัติการตรวจสอบ"
    />
  )
}
