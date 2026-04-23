import { useState } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DrugConfirmationPanel } from './DrugConfirmationPanel'
import { useVisitMedsList } from './useDrugConfirm'
import type { VisitSummaryItem } from '@/services/visitService'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PatientListProps {
  patients: VisitSummaryItem[]
  isLoading: boolean
}

const statusConfig: Record<string, { variant: 'active' | 'pending' | 'inactive'; label: string }> = {
  Y: { variant: 'active', label: 'ยืนยันแล้ว' },
  N: { variant: 'inactive', label: 'ไม่มา' },
  '': { variant: 'pending', label: 'รอยืนยัน' },
}

export function PatientList({ patients, isLoading }: PatientListProps) {
  const [expandedVN, setExpandedVN] = useState<string | null>(null)

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
  const pending = patients.length - confirmed - absent

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

      {/* Patient cards */}
      <div className="grid gap-2">
        {patients.map((patient) => (
          <PatientCard
            key={patient.vn}
            patient={patient}
            isExpanded={expandedVN === patient.vn}
            onToggle={() => setExpandedVN(expandedVN === patient.vn ? null : patient.vn)}
          />
        ))}
      </div>
    </div>
  )
}

function PatientCard({
  patient,
  isExpanded,
  onToggle,
}: {
  patient: VisitSummaryItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const medsQuery = useVisitMedsList(isExpanded ? patient.vn : '')

  const confirmStatus = statusConfig[patient.dispensing_confirmed] ?? statusConfig['']

  return (
    <div className="rounded-md border">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-btn-default-light/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{patient.patient_name}</span>
          <StatusBadge variant="active">{patient.clinic_type}</StatusBadge>
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

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t">
          {medsQuery.isLoading ? (
            <LoadingSpinner text="กำลังโหลดยา..." />
          ) : (
            <DrugConfirmationPanel
              vn={patient.vn}
              meds={medsQuery.data ?? []}
              dispensingConfirmed={patient.dispensing_confirmed === 'Y'}
            />
          )}
        </div>
      )}
    </div>
  )
}
