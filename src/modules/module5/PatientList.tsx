import { useState, useCallback, useMemo, useEffect } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EditablePhone } from '@/components/common/EditablePhone'
import { Button } from '@/components/ui/button'
import { DrugConfirmationPanel } from './DrugConfirmationPanel'
import { DrugTrackingStatus } from './DrugTrackingStatus'
import { useVisitMedsList, useBatchConfirm } from './useDrugConfirm'
import { useAuthStore } from '@/stores/authStore'
import type { VisitSummaryItem } from '@/services/visitService'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, X } from 'lucide-react'

interface PatientListProps {
  patients: VisitSummaryItem[]
  isLoading: boolean
}

function getStatusBadge(patient: VisitSummaryItem) {
  if (patient.dispensing_confirmed === 'Y') return { variant: 'active' as const, label: 'ยืนยันแล้ว' }
  if (patient.attended === 'N') return { variant: 'inactive' as const, label: 'ไม่มารับบริการ' }
  return { variant: 'pending' as const, label: 'รอยืนยัน' }
}

export function PatientList({ patients, isLoading }: PatientListProps) {
  const [expandedVN, setExpandedVN] = useState<string | null>(null)
  const [selectedVNs, setSelectedVNs] = useState<Set<string>>(new Set())
  const batchMutation = useBatchConfirm()

  // Clear batch selection when patients list changes (date/hosp filter changed)
  // Keep expandedVN open so user sees the mutation result
  useEffect(() => {
    setSelectedVNs(new Set())
  }, [patients])

  // All hooks MUST be above early returns — React Rules of Hooks
  const selectableVNs = useMemo(
    () => new Set(
      patients
        .filter((p) => p.dispensing_confirmed !== 'Y' && p.attended !== 'N')
        .map((p) => p.vn),
    ),
    [patients],
  )

  const allSelectableSelected = selectableVNs.size > 0 && [...selectableVNs].every((vn) => selectedVNs.has(vn))
  const someSelected = selectedVNs.size > 0

  const toggleSelect = useCallback((vn: string) => {
    setSelectedVNs((prev) => {
      const next = new Set(prev)
      next.has(vn) ? next.delete(vn) : next.add(vn)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelectableSelected) {
      setSelectedVNs(new Set())
    } else {
      setSelectedVNs(new Set(selectableVNs))
    }
  }, [allSelectableSelected, selectableVNs])

  const clearSelection = useCallback(() => setSelectedVNs(new Set()), [])

  if (isLoading) {
    return <LoadingSpinner text="กำลังโหลดรายการ..." />
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        ไม่พบข้อมูลผู้ป่วย
      </div>
    )
  }

  // Summary counts
  const confirmed = patients.filter((p) => p.dispensing_confirmed === 'Y').length
  const absent = patients.filter((p) => p.attended === 'N').length
  const pending = patients.filter((p) => p.dispensing_confirmed !== 'Y' && p.attended !== 'N').length

  const handleBatchAction = (action: 'confirm' | 'absent') => {
    batchMutation.mutate(
      { action, vns: [...selectedVNs] },
      { onSettled: () => clearSelection() },
    )
  }

  return (
    <div className="grid gap-3">
      {/* Summary bar */}
      <div className="flex gap-3 text-sm">
        <span className="text-muted-foreground">
          ทั้งหมด <strong>{patients.length}</strong>
        </span>
        <span className="text-green-600">
          ยืนยันแล้ว <strong>{confirmed}</strong>
        </span>
        <span className="text-amber-600">
          ค้าง <strong>{pending}</strong>
        </span>
        <span className="text-destructive">
          ไม่มา <strong>{absent}</strong>
        </span>
      </div>

      {/* Select all row */}
      {patients.length > 1 && pending > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelectableSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelectableSelected
            }}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-muted-foreground">
            เลือกทั้งหมด ({pending} รอยืนยัน)
          </span>
        </div>
      )}

      {/* Patient cards */}
      <div className="grid gap-2">
        {patients.map((patient) => (
          <PatientCard
            key={patient.vn}
            patient={patient}
            isExpanded={expandedVN === patient.vn}
            selectable={selectableVNs.has(patient.vn)}
            isSelected={selectedVNs.has(patient.vn)}
            onToggleExpand={() => setExpandedVN(expandedVN === patient.vn ? null : patient.vn)}
            onToggleSelect={() => toggleSelect(patient.vn)}
          />
        ))}
      </div>

      {/* Batch action bar */}
      {someSelected && (
        <div className="sticky bottom-4 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">
            เลือก <strong>{selectedVNs.size}</strong> คน
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            className="bg-apple-blue hover:bg-apple-blue/90"
            onClick={() => handleBatchAction('confirm')}
            disabled={batchMutation.isPending}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            มารับบริการแล้ว
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBatchAction('absent')}
            disabled={batchMutation.isPending}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            ไม่มารับบริการ
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            disabled={batchMutation.isPending}
            title="ยกเลิกการเลือก"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function PatientCard({
  patient,
  isExpanded,
  selectable,
  isSelected,
  onToggleExpand,
  onToggleSelect,
}: {
  patient: VisitSummaryItem
  isExpanded: boolean
  selectable: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
}) {
  const medsQuery = useVisitMedsList(isExpanded ? patient.vn : '')
  const { user } = useAuthStore()

  const confirmStatus = getStatusBadge(patient)

  return (
    <div className="rounded-md border">
      {/* Header row */}
      <div className="flex items-center">
        {/* Checkbox */}
        <div className="pl-3 shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!selectable}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 disabled:opacity-30"
          />
        </div>

        {/* Expandable header */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 text-left px-3 py-3 flex items-center justify-between hover:bg-btn-default-light/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">{patient.patient_name}</span>
            <StatusBadge variant="info">{patient.clinic_type}</StatusBadge>
            <StatusBadge variant={confirmStatus.variant}>{confirmStatus.label}</StatusBadge>
            {patient.has_drug_change === 'Y' && (
              <StatusBadge variant="pending">มีการเปลี่ยนแปลงยา</StatusBadge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {patient.hosp_name}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t">
          {/* Tel verification */}
          <div className="pt-2 pb-1 text-sm grid grid-cols-[auto_1fr] gap-x-3 items-center">
            <span className="text-muted-foreground">เบอร์โทร</span>
            <EditablePhone tel={patient.tel} vn={patient.vn} />
          </div>
          {medsQuery.isLoading ? (
            <LoadingSpinner text="กำลังโหลดยา..." />
          ) : medsQuery.isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-destructive mb-2">ไม่สามารถโหลดข้อมูลยาได้</p>
              <Button size="sm" variant="outline" onClick={() => medsQuery.refetch()}>
                ลองอีกครั้ง
              </Button>
            </div>
          ) : (
            <>
              <DrugConfirmationPanel
                vn={patient.vn}
                meds={medsQuery.data ?? []}
                dispensingConfirmed={patient.dispensing_confirmed === 'Y'}
                isAbsent={patient.attended === 'N'}
              />
              {patient.drug_source_pending === 'Y' && patient.dispensing_confirmed === 'Y' && user?.role && (
                <DrugTrackingStatus
                  vn={patient.vn}
                  drugSentDate={patient.drug_sent_date ?? ''}
                  drugReceivedDate={patient.drug_received_date ?? ''}
                  drugDeliveredDate={patient.drug_delivered_date ?? ''}
                  userRole={user.role}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
