import { useState, useEffect, useMemo } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import { QueryError } from '@/components/common/QueryError'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Button } from '@/components/ui/button'
import { PatientContactCard } from './PatientContactCard'
import { FollowupForm } from './FollowupForm'
import { useFollowupList, useFollowupDelete } from './useFollowup'
import type { FollowupFilters, FollowupItem, FollowupRecord } from '@/services/followupService'
import { ChevronDown, ChevronUp, Pencil, Trash2, PhoneCall } from 'lucide-react'
import { CLINIC_TYPES, parseClinicTypes } from '@/constants/clinicTypes'
import { formatBuddhist } from '@/utils/dateUtils'

interface FollowupListProps {
  filters: FollowupFilters
}

const statusConfig: Record<string, { variant: 'active' | 'pending'; label: string }> = {
  pending: { variant: 'pending', label: 'รอติดตาม' },
  followed: { variant: 'active', label: 'ติดตามแล้ว' },
}

export function FollowupList({ filters }: FollowupListProps) {
  const { data: items = [], isLoading, isError, isFetching, refetch } = useFollowupList(filters)
  const [expandedVN, setExpandedVN] = useState<string | null>(null)

  // Summary counts — all hooks must be above early returns
  const { pending, followed } = useMemo(() => {
    const p = items.filter((i) => i.followup_status === 'pending').length
    return { pending: p, followed: items.length - p }
  }, [items])

  if (isLoading) {
    return <LoadingSpinner text="กำลังโหลดรายการ..." />
  }

  if (isError) {
    return <QueryError onRetry={() => refetch()} />
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        ไม่พบรายการที่ต้องติดตาม
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {/* Summary bar */}
      <div className="flex gap-3 text-sm">
        <span className="text-muted-foreground">
          ทั้งหมด <strong>{items.length}</strong>
        </span>
        <StatusBadge variant="pending">
          รอติดตาม {pending}
        </StatusBadge>
        <StatusBadge variant="active">
          ติดตามแล้ว {followed}
        </StatusBadge>
      </div>

      {/* Item cards */}
      <div className="grid gap-2">
        {items.map((item) => (
          <FollowupCard
            key={item.vn}
            item={item}
            isExpanded={expandedVN === item.vn}
            isFetching={isFetching}
            onToggle={() => setExpandedVN(expandedVN === item.vn ? null : item.vn)}
            onRefresh={() => refetch()}
          />
        ))}
      </div>
    </div>
  )
}

function FollowupCard({
  item,
  isExpanded,
  isFetching,
  onToggle,
  onRefresh,
}: {
  item: FollowupItem
  isExpanded: boolean
  isFetching: boolean
  onToggle: () => void
  onRefresh: () => void
}) {
  const cfg = statusConfig[item.followup_status] ?? statusConfig.pending
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useFollowupDelete()

  // Reset edit/delete state when card collapses
  useEffect(() => {
    if (!isExpanded) {
      setEditingId(null)
      setDeleteId(null)
    }
  }, [isExpanded])

  const editRecord = editingId
    ? item.followup_records.find((r) => r.followup_id === editingId) ?? null
    : null

  return (
    <div className="rounded-md border">
      {/* Header row — outer container is not interactive, children handle clicks */}
      <div className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-btn-default-light/30 transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
        >
          <span className="font-medium text-sm">{item.patient_name}</span>
          {parseClinicTypes(item.clinic_type).map((ct) => {
            const label = CLINIC_TYPES.find((c) => c.value === ct)?.label ?? ct
            return <StatusBadge key={ct} variant="info">{label}</StatusBadge>
          })}
          <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>
          {item.has_drug_change === 'Y' && (
            <StatusBadge variant="pending">เปลี่ยนยา</StatusBadge>
          )}
          <span className="text-xs text-muted-foreground">
            {item.hosp_name} · {formatBuddhist(item.service_date)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.followup_status === 'pending' && !isExpanded && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={onToggle}
            >
              <PhoneCall className="h-3 w-3" />
              ติดตาม
            </Button>
          )}
          <button type="button" onClick={onToggle} className="p-0.5">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <LoadingOverlay loading={isFetching} text="กำลังโหลดข้อมูล...">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {rec.recorded_by_name ? `${rec.recorded_by_name} · ` : ''}{rec.recorded_at}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setEditingId(rec.followup_id)}
                            title="แก้ไข"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(rec.followup_id)}
                            title="ลบ"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
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
              <h4 className="text-sm font-semibold mb-2">
                {editRecord ? 'แก้ไขการติดตาม' : 'บันทึกการติดตาม'}
              </h4>
              <FollowupForm
                vn={item.vn}
                editRecord={editRecord}
                onCancelEdit={() => setEditingId(null)}
                onSuccess={() => { setEditingId(null); onRefresh() }}
              />
            </div>
          </div>

          {/* Delete confirmation */}
          <ConfirmModal
            open={deleteId !== null}
            onOpenChange={(open) => { if (!open) setDeleteId(null) }}
            title="ลบผลติดตาม"
            description="ยืนยันการลบผลติดตามรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
            confirmLabel="ลบ"
            variant="destructive"
            onConfirm={() => {
              if (deleteId && !deleteMutation.isPending) {
                deleteMutation.mutate(deleteId, { onSettled: () => setDeleteId(null) })
              }
            }}
          />
        </LoadingOverlay>
      )}
    </div>
  )
}
