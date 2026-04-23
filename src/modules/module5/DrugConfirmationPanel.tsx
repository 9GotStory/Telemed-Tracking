import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DrugSourceSelector } from './DrugSourceSelector'
import { useVisitMedsSave } from './useDrugConfirm'
import type { VisitMedItem } from '@/services/visitService'
import type { DrugSource } from '@/types/visit'
import { CheckCircle2, XCircle, Plus } from 'lucide-react'

interface DrugConfirmationPanelProps {
  vn: string
  meds: VisitMedItem[]
  dispensingConfirmed: boolean
}

interface MedEdit extends Omit<VisitMedItem, 'source'> {
  source: DrugSource
  isNew?: boolean
}

export function DrugConfirmationPanel({ vn, meds, dispensingConfirmed }: DrugConfirmationPanelProps) {
  const saveMutation = useVisitMedsSave()
  const [editMeds, setEditMeds] = useState<MedEdit[]>(
    () => meds.map((m) => ({ ...m, source: m.source as DrugSource })),
  )
  const [hasEdits, setHasEdits] = useState(false)

  // Sync editMeds when meds prop changes (e.g. after mutation invalidation)
  useEffect(() => {
    if (!hasEdits) {
      setEditMeds(meds.map((m) => ({ ...m, source: m.source as DrugSource })))
    }
  }, [meds, hasEdits])

  const handleSourceChange = (idx: number, source: DrugSource) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, source } : m)))
    setHasEdits(true)
  }

  const handleNoteChange = (idx: number, note: string) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, note } : m)))
    setHasEdits(true)
  }

  const handleConfirmAll = () => {
    saveMutation.mutate({
      vn,
      action_type: 'confirm_all',
      meds: [],
    })
  }

  const handleSaveEdits = () => {
    saveMutation.mutate({
      vn,
      action_type: 'edit',
      meds: editMeds.map((m) => ({
        med_id: m.isNew ? '' : m.med_id,
        drug_name: m.drug_name,
        strength: m.strength,
        qty: m.qty,
        unit: m.unit,
        sig: m.sig,
        source: m.source,
        note: m.note,
      })),
    }, {
      onSuccess: () => setHasEdits(false),
    })
  }

  const handleAbsent = () => {
    saveMutation.mutate({
      vn,
      action_type: 'absent',
      meds: [],
    })
  }

  if (meds.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">ไม่มีรายการยา</div>
  }

  return (
    <div className="grid gap-3">
      {/* Drug list */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-btn-default-light/50">
              <th className="px-3 py-1.5 text-left font-semibold">ยา</th>
              <th className="px-3 py-1.5 text-left font-semibold">จำนวน</th>
              <th className="px-3 py-1.5 text-left font-semibold">แหล่งยา</th>
              <th className="px-3 py-1.5 text-left font-semibold">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {editMeds.map((med, idx) => (
              <tr key={med.med_id || idx} className="border-t">
                <td className="px-3 py-1.5">
                  <div className="font-medium">{med.drug_name}</div>
                  <div className="text-xs text-muted-foreground">{med.strength} · {med.sig}</div>
                  {med.is_changed === 'Y' && (
                    <StatusBadge variant="pending">มีการเปลี่ยนแปลง</StatusBadge>
                  )}
                </td>
                <td className="px-3 py-1.5">{med.qty} {med.unit}</td>
                <td className="px-3 py-1.5">
                  <DrugSourceSelector
                    value={med.source}
                    onChange={(s) => handleSourceChange(idx, s)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Textarea
                    value={med.note}
                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                    rows={1}
                    className="text-xs min-h-[28px]"
                    placeholder="หมายเหตุ..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {!dispensingConfirmed && (
          <>
            <Button
              size="sm"
              className="bg-apple-blue hover:bg-apple-blue/90"
              onClick={handleConfirmAll}
              disabled={saveMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              ยืนยันทั้งหมด
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAbsent}
              disabled={saveMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              ไม่มารับบริการ
            </Button>
          </>
        )}
        {hasEdits && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveEdits}
            disabled={saveMutation.isPending}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </Button>
        )}
        {dispensingConfirmed && (
          <StatusBadge variant="active">ยืนยันแล้ว</StatusBadge>
        )}
      </div>
    </div>
  )
}
