import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DrugSourceSelector } from './DrugSourceSelector'
import { useVisitMedsSave } from './useDrugConfirm'
import type { VisitMedItem } from '@/services/visitService'
import type { DrugSource } from '@/types/visit'
import { CheckCircle2, XCircle, Plus, Trash2, RotateCcw } from 'lucide-react'
import { DrugSearchInput } from './DrugSearchInput'

interface DrugConfirmationPanelProps {
  vn: string
  meds: VisitMedItem[]
  dispensingConfirmed: boolean
}

interface MedEdit extends VisitMedItem {
  isNew?: boolean
  isRemoved?: boolean
  _uiKey: string
}

export function DrugConfirmationPanel({ vn, meds, dispensingConfirmed }: DrugConfirmationPanelProps) {
  const saveMutation = useVisitMedsSave()
  const keyCounter = useRef(0)
  const makeKey = () => `med-${++keyCounter.current}`

  const [editMeds, setEditMeds] = useState<MedEdit[]>(
    () => meds.map((m) => ({ ...m, _uiKey: m.med_id || makeKey() })),
  )
  const [hasEdits, setHasEdits] = useState(false)

  // Sync editMeds when meds prop changes (e.g. after mutation invalidation)
  useEffect(() => {
    if (!hasEdits) {
      setEditMeds(meds.map((m) => ({ ...m, _uiKey: m.med_id || makeKey() })))
    }
  }, [meds, hasEdits])

  // Reset edit state after successful save so sync effect can pick up fresh data
  useEffect(() => {
    if (saveMutation.isSuccess) {
      setHasEdits(false)
    }
  }, [saveMutation.isSuccess])

  const markEdited = () => setHasEdits(true)

  const handleSourceChange = (idx: number, source: DrugSource) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, source } : m)))
    markEdited()
  }

  const handleNoteChange = (idx: number, note: string) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, note } : m)))
    markEdited()
  }

  const handleFieldChange = (idx: number, field: keyof MedEdit, value: string | number) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))
    markEdited()
  }

  const handleAddMed = (drug?: { drug_name: string; strength: string; unit: string }) => {
    // Prevent duplicate drug (same drug_name + strength) in same patient
    if (drug?.drug_name) {
      const key = `${drug.drug_name.toLowerCase()}|${(drug.strength ?? '').toLowerCase()}`
      const exists = editMeds.some(
        (m) => !m.isRemoved && `${m.drug_name.toLowerCase()}|${m.strength.toLowerCase()}` === key,
      )
      if (exists) {
        toast.error(`${drug.drug_name} ${drug.strength} มีอยู่แล้ว`)
        return
      }
    }
    setEditMeds((prev) => [
      ...prev,
      {
        med_id: '',
        vn,
        drug_name: drug?.drug_name ?? '',
        strength: drug?.strength ?? '',
        qty: 1,
        unit: drug?.unit ?? '',
        sig: '',
        source: 'hosp_stock' as DrugSource,
        is_changed: 'N',
        round: 1,
        status: '',
        note: '',
        updated_by: '',
        updated_at: '',
        isNew: true,
        _uiKey: makeKey(),
      },
    ])
    markEdited()
  }

  const handleRemoveMed = (idx: number) => {
    setEditMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, isRemoved: true } : m))
    )
    markEdited()
  }

  const handleRestoreMed = (idx: number) => {
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, isRemoved: false } : m)))
    markEdited()
  }

  const handleConfirmAll = () => {
    // Validate new meds before saving
    const incomplete = editMeds.filter((m) => m.isNew && !m.isRemoved && !m.drug_name.trim())
    if (incomplete.length > 0) {
      toast.error('กรุณาระบุชื่อยาทุกรายการ')
      return
    }
    saveMutation.mutate({
      vn,
      action_type: 'edit',
      meds: editMeds
        .filter((m) => !(m.isNew && m.isRemoved))
        .map((m) => ({
          med_id: m.isNew ? '' : m.med_id,
          drug_name: m.drug_name,
          strength: m.strength,
          qty: m.qty,
          unit: m.unit,
          sig: m.sig,
          source: m.source,
          note: m.note,
          status: m.isRemoved ? 'cancelled' : 'confirmed',
        })),
    })
  }

  const handleAbsent = () => {
    saveMutation.mutate({
      vn,
      action_type: 'absent',
      meds: [],
    })
  }

  return (
    <div className="grid gap-3">
      {/* Drug list */}
      {editMeds.length === 0 && (
        <div className="text-sm text-muted-foreground py-2">ไม่มีรายการยา</div>
      )}
      {editMeds.length > 0 && (
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-btn-default-light/50">
              <th className="px-3 py-1.5 text-left font-semibold">ยา</th>
              <th className="px-3 py-1.5 text-left font-semibold">จำนวน</th>
              <th className="px-3 py-1.5 text-left font-semibold">แหล่งยา</th>
              <th className="px-3 py-1.5 text-left font-semibold">หมายเหตุ</th>
              {!dispensingConfirmed && (
                <th className="px-3 py-1.5 w-10" />
              )}
            </tr>
          </thead>
          <tbody>
            {editMeds.map((med, idx) => (
              <tr key={med._uiKey} className={`border-t${med.isRemoved ? ' opacity-40 line-through' : ''}`}>
                <td className="px-3 py-1.5">
                  {med.isRemoved ? (
                    <div>
                      <div className="font-medium text-muted-foreground">{med.drug_name}</div>
                      <div className="text-xs text-muted-foreground">{med.strength} · {med.sig}</div>
                      <StatusBadge variant="inactive">ยกเลิก</StatusBadge>
                    </div>
                  ) : med.isNew && !dispensingConfirmed ? (
                    <div className="grid gap-1">
                      <Input
                        value={med.drug_name}
                        onChange={(e) => handleFieldChange(idx, 'drug_name', e.target.value)}
                        className="text-xs h-7"
                        placeholder="ชื่อยา"
                      />
                      <div className="flex gap-1">
                        <Input
                          value={med.strength}
                          onChange={(e) => handleFieldChange(idx, 'strength', e.target.value)}
                          className="text-xs h-7 flex-1"
                          placeholder="ความแรง"
                        />
                        <Input
                          value={med.sig}
                          onChange={(e) => handleFieldChange(idx, 'sig', e.target.value)}
                          className="text-xs h-7 flex-1"
                          placeholder="วิธีใช้"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{med.drug_name}</div>
                      <div className="text-xs text-muted-foreground">{med.strength} · {med.sig}</div>
                      {med.is_changed === 'Y' && (
                        <StatusBadge variant="pending">มีการเปลี่ยนแปลง</StatusBadge>
                      )}
                    </>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {med.isRemoved ? (
                    <span className="text-muted-foreground">{med.qty} {med.unit}</span>
                  ) : med.isNew && !dispensingConfirmed ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min={1}
                        value={med.qty}
                        onChange={(e) => handleFieldChange(idx, 'qty', Number(e.target.value) || 1)}
                        className="text-xs h-7 w-16"
                      />
                      <Input
                        value={med.unit}
                        onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                        className="text-xs h-7 w-16"
                        placeholder="หน่วย"
                      />
                    </div>
                  ) : (
                    `${med.qty} ${med.unit}`
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <DrugSourceSelector
                    value={med.source as DrugSource}
                    onChange={(s) => handleSourceChange(idx, s)}
                    disabled={dispensingConfirmed || med.isRemoved}
                    variant={med.isNew || med.source === 'hosp_pending' ? 'new' : 'existing'}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Textarea
                    value={med.note}
                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                    rows={1}
                    className="text-xs min-h-[28px]"
                    placeholder="หมายเหตุ..."
                    disabled={dispensingConfirmed || !!med.isRemoved}
                  />
                </td>
                {!dispensingConfirmed && (
                  <td className="px-1 py-1.5">
                    {med.isRemoved ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-green-600"
                        onClick={() => handleRestoreMed(idx)}
                        title="เรียกคืน"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMed(idx)}
                        title="ยกเลิกยา"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Add drug — search from master + manual fallback */}
      {!dispensingConfirmed && (
        <div className="grid gap-2">
          <DrugSearchInput onSelect={(drug) => handleAddMed(drug)} />
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground justify-start"
            onClick={() => handleAddMed()}
            disabled={saveMutation.isPending}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            กรอกชื่อยาเอง
          </Button>
        </div>
      )}

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
              {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกและยืนยัน'}
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
        {dispensingConfirmed && (
          <StatusBadge variant="active">ยืนยันแล้ว</StatusBadge>
        )}
      </div>
    </div>
  )
}
