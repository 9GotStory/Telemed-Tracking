import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ReadinessLogWithHospName } from '@/types/readiness'
import { READINESS_STATUS_VARIANT, READINESS_STATUS_LABEL } from '@/types/readiness'

interface ReadinessHistoryProps {
  data: ReadinessLogWithHospName[]
}

function CheckCell({ value }: { value: 'Y' | 'N' }) {
  return (
    <span className={value === 'Y' ? 'text-green-600 font-medium' : 'text-red-400'}>
      {value === 'Y' ? '✓' : '✗'}
    </span>
  )
}

export function ReadinessHistory({ data }: ReadinessHistoryProps) {
  const columns: Column<ReadinessLogWithHospName>[] = [
    {
      key: 'check_date',
      header: 'วันที่ตรวจ',
      sortable: true,
      className: 'w-36',
      render: (row) => {
        try {
          return format(parseISO(row.check_date), 'd MMM yyyy', { locale: th })
        } catch {
          return row.check_date
        }
      },
    },
    {
      key: 'overall_status',
      header: 'สถานะ',
      sortable: true,
      className: 'w-32',
      render: (row) => {
        const info = READINESS_STATUS_VARIANT[row.overall_status] ?? 'pending'
        const label = READINESS_STATUS_LABEL[row.overall_status] ?? row.overall_status
        return <StatusBadge variant={info}>{label}</StatusBadge>
      },
    },
    {
      key: 'cam_ok',
      header: 'กล้อง',
      className: 'w-20 text-center',
      render: (row) => <CheckCell value={row.cam_ok} />,
    },
    {
      key: 'mic_ok',
      header: 'ไมค์',
      className: 'w-20 text-center',
      render: (row) => <CheckCell value={row.mic_ok} />,
    },
    {
      key: 'pc_ok',
      header: 'คอม',
      className: 'w-20 text-center',
      render: (row) => <CheckCell value={row.pc_ok} />,
    },
    {
      key: 'internet_ok',
      header: 'เน็ต',
      className: 'w-20 text-center',
      render: (row) => <CheckCell value={row.internet_ok} />,
    },
    {
      key: 'software_ok',
      header: 'ซอฟต์แวร์',
      className: 'w-24 text-center',
      render: (row) => <CheckCell value={row.software_ok} />,
    },
    {
      key: 'note',
      header: 'หมายเหตุ',
      className: 'min-w-[120px]',
      render: (row) => row.note || '-',
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
