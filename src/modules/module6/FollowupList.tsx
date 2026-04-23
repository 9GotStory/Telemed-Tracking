import { useState } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PatientContactCard } from './PatientContactCard'
import { FollowupForm } from './FollowupForm'
import { useFollowupList } from './useFollowup'
import type { FollowupFilters, FollowupItem, FollowupRecord } from '@/services/followupService'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatBuddhist } from '@/utils/dateUtils'

interface FollowupListProps {
  filters: FollowupFilters
}

const statusConfig: Record<string, { variant: 'active' | 'pending'; label: string }> = {
  pending: { variant: 'pending', label: 'รอติดตาม' },
  followed: { variant: 'active', label: 'ติดตามแล้ว' },
}

export function FollowupList({ filters }: FollowupListProps) {
  const { data: items = [], isLoading } = useFollowupList(filters)
  const [expandedVN, setExpandedVN] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingSpinner text="กำลังโหลดรายการ..." />
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        ไม่พบรายการที่ต้องติดตาม
      </div>
    )
  }

  // Summary counts
  const pending = items.filter((i) => i.followup_status === 'pending').length
  const followed = items.length - pending

  return (
    <div className="grid gap-3">
      {/* Summary bar */}
      <div className="flex gap-3 text-sm">
        <span className="text-muted-foreground">
          ทั้งหมด <strong>{items.length}</strong>
        </span>
        <span className="text-amber-600">
          รอติดตาม <strong>{pending}</strong>
        </span>
        <span className="text-green-600">
          ติดตามแล้ว <strong>{followed}</strong>
        </span>
      </div>

      {/* Item cards */}
      <div className="grid gap-2">
        {items.map((item) => (
          <FollowupCard
            key={item.vn}
            item={item}
            isExpanded={expandedVN === item.vn}
            onToggle={() => setExpandedVN(expandedVN === item.vn ? null : item.vn)}
          />
        ))}
      </div>
    </div>
  )
}

function FollowupCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: FollowupItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const cfg = statusConfig[item.followup_status] ?? statusConfig.pending

  return (
    <div className="rounded-md border">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-btn-default-light/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{item.patient_name}</span>
          <StatusBadge variant="active">{item.clinic_type}</StatusBadge>
          <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>
          {item.has_drug_change === 'Y' && (
            <StatusBadge variant="pending">เปลี่ยนยา</StatusBadge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {item.hosp_name} · {formatBuddhist(item.service_date)}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t grid gap-4">
          {/* Patient contact */}
          <div className="pt-3">
            <PatientContactCard item={item} />
          </div>

          {/* Follow-up history */}
          {item.followup_records.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">ประวัติการติดตาม</h4>
              <div className="space-y-2">
                {item.followup_records.map((rec: FollowupRecord) => (
                  <div key={rec.followup_id} className="rounded-md bg-btn-default-light/30 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{formatBuddhist(rec.followup_date)}</span>
                      <span className="text-xs text-muted-foreground">{rec.recorded_at}</span>
                    </div>
                    {rec.general_condition && (
                      <div><span className="text-muted-foreground">อาการ:</span> {rec.general_condition}</div>
                    )}
                    {rec.side_effect && (
                      <div><span className="text-muted-foreground">ผลข้างเคียง:</span> {rec.side_effect}</div>
                    )}
                    {rec.drug_adherence && (
                      <div><span className="text-muted-foreground">การกินยา:</span> {rec.drug_adherence}</div>
                    )}
                    {rec.other_note && (
                      <div><span className="text-muted-foreground">หมายเหตุ:</span> {rec.other_note}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up form */}
          <div>
            <h4 className="text-sm font-semibold mb-2">บันทึกการติดตาม</h4>
            <FollowupForm vn={item.vn} />
          </div>
        </div>
      )}
    </div>
  )
}
