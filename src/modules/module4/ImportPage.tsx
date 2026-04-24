import { useState, useMemo } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExcelUploader } from './ExcelUploader'
import { PreviewTable } from './PreviewTable'
import { ImportSummary } from './ImportSummary'
import { useImportPreview, useImportConfirm } from './useImport'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { ParsedRow, ParseResult } from '@/utils/excelParser'
import type { ImportPreviewRequest } from '@/services/importService'
import { useAuthStore } from '@/stores/authStore'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Step = 1 | 2 | 3

export default function ImportPage() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [hospCode, setHospCode] = useState(user?.hosp_code ?? '')
  const [serviceDate, setServiceDate] = useState('')
  const [clinicType, setClinicType] = useState('')

  const previewMutation = useImportPreview()
  const confirmMutation = useImportConfirm()

  const { data: facilities = [] } = useFacilitiesList()

  // Group by VN for display
  const groupedByVN = useMemo(() => {
    if (!parseResult) return {} as Record<string, ParsedRow[]>
    return parseResult.groupedByVN
  }, [parseResult])

  const canGoToStep3 = hospCode !== '' && serviceDate !== '' && clinicType !== ''

  const handlePreview = () => {
    if (!parseResult) return

    const visits = Object.entries(groupedByVN).map(([vn, rows]) => ({
      vn,
      hn: rows[0].hn,
      patient_name: rows[0].patient_name,
      dob: rows[0].dob,
      tel: rows[0].tel,
      drugs: rows.map((r) => ({
        drug_name: r.drug_name,
        strength: r.strength,
        qty: r.qty,
        unit: r.unit,
        sig: r.sig,
      })),
    }))

    const data: ImportPreviewRequest = {
      round: 1,
      hosp_code: hospCode,
      service_date: serviceDate,
      clinic_type: clinicType,
      visits,
    }

    previewMutation.mutate(data, {
      onSuccess: () => setStep(3),
    })
  }

  const handleConfirm = () => {
    if (!parseResult || !previewMutation.data) return

    const validVNs = new Set(previewMutation.data.valid.map((v) => v.vn))
    const visits = Object.entries(groupedByVN)
      .filter(([vn]) => validVNs.has(vn))
      .map(([vn, rows]) => ({
        vn,
        hn: rows[0].hn,
        patient_name: rows[0].patient_name,
        dob: rows[0].dob,
        tel: rows[0].tel,
        drugs: rows.map((r) => ({
          drug_name: r.drug_name,
          strength: r.strength,
          qty: r.qty,
          unit: r.unit,
          sig: r.sig,
        })),
      }))

    confirmMutation.mutate(
      {
        round: 1,
        hosp_code: hospCode,
        service_date: serviceDate,
        clinic_type: clinicType,
        visits,
      },
      {
        onSuccess: () => {
          setStep(1)
          setParseResult(null)
        },
      },
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">นำเข้าข้อมูลผู้ป่วย</h1>
          <p className="text-sm text-muted-foreground mt-1">
            นำเข้าข้อมูลจาก HosXP Excel export
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  step >= s
                    ? 'bg-apple-blue text-white'
                    : 'bg-btn-default-light text-muted-foreground'
                }`}
              >
                {s}
              </span>
              <span className={step >= s ? 'font-medium' : 'text-muted-foreground'}>
                {s === 1 ? 'เลือกไฟล์' : s === 2 ? 'ตั้งค่า' : 'ตรวจสอบ'}
              </span>
              {s < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Batch selectors (visible from step 2) */}
        {step >= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md border p-3">
            <div className="grid gap-1.5">
              <Label>รพ.สต.</Label>
              <Select value={hospCode} onValueChange={(v) => { if (v) setHospCode(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก รพ.สต." />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.hosp_code} value={f.hosp_code}>
                      {f.hosp_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>วันที่ให้บริการ</Label>
              <Input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>ประเภทคลินิก</Label>
              <Select value={clinicType} onValueChange={(v) => { if (v) setClinicType(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {CLINIC_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <ExcelUploader
            onParsed={(result) => {
              setParseResult(result)
              if (result.rows.length > 0) setStep(2)
            }}
          />
        )}

        {/* Step 2: Preview table */}
        {step === 2 && parseResult && (
          <div className="grid gap-4">
            <PreviewTable
              rows={parseResult.rows}
              groupedByVN={groupedByVN}
              previewResult={null}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                กลับ
              </Button>
              <Button
                className="bg-apple-blue hover:bg-apple-blue/90"
                disabled={!canGoToStep3}
                onClick={handlePreview}
              >
                ตรวจสอบข้อมูล
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation summary + confirm */}
        {step === 3 && parseResult && (
          <div className="grid gap-4">
            <PreviewTable
              rows={parseResult.rows}
              groupedByVN={groupedByVN}
              previewResult={previewMutation.data ?? null}
            />
            <ImportSummary
              summary={previewMutation.data ?? null}
              isConfirming={confirmMutation.isPending}
              onConfirm={handleConfirm}
              hasParsedData={parseResult.rows.length > 0}
            />
            <div>
              <Button variant="outline" onClick={() => { previewMutation.reset(); setStep(2) }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                กลับ
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
