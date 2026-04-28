import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DrugSourceSelector } from './DrugSourceSelector'
import { useVisitMedsSave } from './useDrugConfirm'
import type { VisitMedItem } from '@/services/visitService'
import type { DrugSource } from '@/types/visit'
import { CheckCircle2, XCircle, Plus, Trash2, RotateCcw, Undo2 } from 'lucide-react'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import { DrugSearchInput } from './DrugSearchInput'
import { DRUG_UNITS } from '@/constants/drugUnits'

interface DrugConfirmationPanelProps {
  vn: string
  meds: VisitMedItem[]
  dispensingConfirmed: boolean
  isAbsent?: boolean
}

interface MedEdit extends VisitMedItem {
  isNew?: boolean
  isRemoved?: boolean
  _uiKey: string
}

export function DrugConfirmationPanel({ vn, meds, dispensingConfirmed, isAbsent }: DrugConfirmationPanelProps) {
  const saveMutation = useVisitMedsSave()
  const keyCounter = useRef(0)
  const makeKey = () => `med-${++keyCounter.current}`

  const [editMeds, setEditMeds] = useState<MedEdit[]>(
    () => meds.map((m, i) => ({ ...m, _uiKey: m.med_id || `med-init-${i}` })),
  )
  const [hasEdits, setHasEdits] = useState(false)
  const saveHandledRef = useRef(false)

  // Reset saveHandledRef when a new mutation starts
  useEffect(() => {
    if (saveMutation.isPending) saveHandledRef.current = false
  }, [saveMutation.isPending])

  // Readonly after confirmed or absent — use undo button to revert
  const isReadonly = dispensingConfirmed || !!isAbsent

  const activeMeds = useMemo(() => meds.filter((m) => m.status !== 'cancelled'), [meds])

  // Sync editMeds when meds prop changes — React recommended render-time pattern
  const [prevActiveMeds, setPrevActiveMeds] = useState(activeMeds)
  if (activeMeds !== prevActiveMeds) {
    setPrevActiveMeds(activeMeds)
    if (!hasEdits) {
      setEditMeds(activeMeds.map((m, i) => ({ ...m, _uiKey: m.med_id || `med-sync-${i}` })))
    }
  }

  // Reset hasEdits after successful save and immediately sync fresh data
  // Combined into one effect to avoid race condition between reset and sync
  useEffect(() => {
    if (saveMutation.isSuccess && !saveHandledRef.current) {
      saveHandledRef.current = true
      setHasEdits(false)
      setEditMeds(activeMeds.map((m, i) => ({ ...m, _uiKey: m.med_id || `med-save-${i}` })))
    }
  }, [saveMutation.isSuccess, activeMeds])

  const markEdited = () => { if (!isReadonly) setHasEdits(true) }

  const handleSourceChange = (idx: number, source: DrugSource) => {
    if (isReadonly) return
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, source } : m)))
    markEdited()
  }

  const handleNoteChange = (idx: number, note: string) => {
    if (isReadonly) return
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, note } : m)))
    markEdited()
  }

  const handleFieldChange = (idx: number, field: keyof MedEdit, value: string | number) => {
    if (isReadonly) return
    setEditMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))
    markEdited()
  }

  const handleAddMed = (drug?: { drug_name: string; strength: string; unit: string }) => {
    if (isReadonly) return
    // Prevent duplicate drug (same drug_name + strength) in same patient
    if (drug?.drug_name) {
      const key = `${drug.drug_name.toLowerCase()}|${(drug.strength ?? '').toLowerCase()}`
      const exists = editMeds.some(
        (m) => !m.isRemoved && `${m.drug_name.toLowerCase()}|${(m.strength ?? '').toLowerCase()}` === key,
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
        source: 'hosp_stock',
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
    if (isReadonly) return
    setEditMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, isRemoved: true } : m))
    )
    markEdited()
  }

  const handleRestoreMed = (idx: number) => {
    if (isReadonly) return
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

  const handleUndoAbsent = () => {
    saveMutation.mutate({
      vn,
      action_type: 'undo_absent',
      meds: [],
    })
  }

  const handleUndoConfirm = () => {
    saveMutation.mutate({
      vn,
      action_type: 'undo_confirm',
      meds: [],
    })
  }

  return (
    <LoadingOverlay loading={saveMutation.isPending} text="กำลังบันทึก..." className="grid gap-3">
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
              {!isReadonly && (
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
                  ) : !isReadonly && med.isNew ? (
                    <div className="grid gap-1">
                      <Input
                        value={med.drug_name}
                        onChange={(e) => handleFieldChange(idx, 'drug_name', e.target.value)}
                        className="text-xs h-7"
                        placeholder="เช่น Metformin"
                      />
                      <div className="flex gap-1">
                        <Input
                          value={med.strength}
                          onChange={(e) => handleFieldChange(idx, 'strength', e.target.value)}
                          className="text-xs h-7 flex-1"
                          placeholder="เช่น 500 mg"
                        />
                        <Input
                          value={med.sig}
                          onChange={(e) => handleFieldChange(idx, 'sig', e.target.value)}
                          className="text-xs h-7 flex-1"
                          placeholder="เช่น 1 เม็ด เช้าและเย็นหลังอาหาร"
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
                  ) : !isReadonly && med.isNew ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min={1}
                        value={med.qty}
                        onChange={(e) => handleFieldChange(idx, 'qty', Math.max(1, Number(e.target.value) || 1))}
                        className="text-xs h-7 w-16"
                        placeholder="จำนวน"
                      />
                      <Select
                        value={med.unit || undefined}
                        onValueChange={(v) => { if (v) handleFieldChange(idx, 'unit', v) }}
                      >
                        <SelectTrigger className="text-xs h-7 w-auto min-w-28">
                          <SelectValue placeholder="เลือกหน่วย" />
                        </SelectTrigger>
                        <SelectContent>
                          {DRUG_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    `${med.qty} ${med.unit}`
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <DrugSourceSelector
                    value={med.source as DrugSource}
                    onChange={(s) => handleSourceChange(idx, s)}
                    disabled={isReadonly || med.isRemoved}
                    variant={med.isNew || med.source === 'hosp_pending' ? 'new' : 'existing'}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Textarea
                    value={med.note}
                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                    rows={1}
                    className="text-xs min-h-7"
                    placeholder="หมายเหตุ..."
                    disabled={isReadonly || !!med.isRemoved}
                  />
                </td>
                {!isReadonly && (
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
      {!isReadonly && !isAbsent && (
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
        {dispensingConfirmed && !isAbsent && (
          <>
            <StatusBadge variant="active">ยืนยันแล้ว</StatusBadge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndoConfirm}
              disabled={saveMutation.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {saveMutation.isPending ? 'กำลังย้อนสถานะ...' : 'ย้อนสถานะ'}
            </Button>
          </>
        )}
        {isAbsent && (
          <>
            <StatusBadge variant="inactive">ไม่มารับบริการ</StatusBadge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndoAbsent}
              disabled={saveMutation.isPending}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              {saveMutation.isPending ? 'กำลังย้อนสถานะ...' : 'ผู้ป่วยมาแล้ว'}
            </Button>
          </>
        )}
        {!dispensingConfirmed && !isAbsent && (
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
      </div>
    </LoadingOverlay>
  )
}
