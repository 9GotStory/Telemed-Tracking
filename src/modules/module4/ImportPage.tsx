import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/DatePicker'
import { ExcelUploader } from './ExcelUploader'
import { PreviewTable } from './PreviewTable'
import { ImportSummary } from './ImportSummary'
import { RegistrationForm } from './RegistrationForm'
import { useImportPreview, useImportConfirm } from './useImport'
import { CLINIC_TYPES } from '@/constants/clinicTypes'
import type { ParsedRow, ParseResult } from '@/utils/excelParser'
import { useAuthStore } from '@/stores/authStore'
import { useFacilitiesList } from '@/hooks/useFacilities'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useDebugMount } from '@/hooks/useDebugLog'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3
type Tab = 'register' | 'import'

export default function ImportPage() {
  useDebugMount('ImportPage')
  const [activeTab, setActiveTab] = useState<Tab>('register')

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">นำเข้าข้อมูลผู้ป่วย</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ลงทะเบียนนัดล่วงหน้า หรือนำเข้าข้อมูลจาก HosXP Excel export
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-md border p-1">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={cn(
              'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'register'
                ? 'bg-apple-blue text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            ลงทะเบียนนัด
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={cn(
              'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'import'
                ? 'bg-apple-blue text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            นำเข้า Excel
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'register' && <RegistrationForm />}
        {activeTab === 'import' && <ImportExcelFlow />}
      </div>
    </PageWrapper>
  )
}

/** Original Excel import flow, extracted into its own component */
function ImportExcelFlow() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [hospCode, setHospCode] = useState(user?.role === 'staff_hsc' ? (user.hosp_code ?? '') : '')
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined)
  const [clinicType, setClinicType] = useState('')

  const previewMutation = useImportPreview()
  const confirmMutation = useImportConfirm()

  const { data: facilities = [] } = useFacilitiesList()

  const serviceDateStr = serviceDate ? format(serviceDate, 'yyyy-MM-dd') : ''

  const groupedByVN = useMemo(() => {
    if (!parseResult) return {} as Record<string, ParsedRow[]>
    return parseResult.groupedByVN
  }, [parseResult])

  const canGoToStep3 = hospCode !== '' && serviceDateStr !== '' && clinicType !== ''

  const buildVisits = (vnFilter?: Set<string>) =>
    Object.entries(groupedByVN)
      .filter(([vn]) => !vnFilter || vnFilter.has(vn))
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

  const handlePreview = () => {
    if (!parseResult) return

    previewMutation.mutate(
      {
        round: 1,
        hosp_code: hospCode,
        service_date: serviceDateStr,
        clinic_type: clinicType,
        visits: buildVisits(),
      },
      {
        onSuccess: () => setStep(3),
      },
    )
  }

  const handleConfirm = () => {
    if (!parseResult || !previewMutation.data) return

    const validVNs = new Set(previewMutation.data.valid.map((v) => v.vn))

    confirmMutation.mutate(
      {
        round: 1,
        hosp_code: hospCode,
        service_date: serviceDateStr,
        clinic_type: clinicType,
        visits: buildVisits(validVNs),
      },
      {
        onSuccess: () => {
          setStep(1)
          setParseResult(null)
          setServiceDate(undefined)
          setClinicType('')
          previewMutation.reset()
          if (user?.role !== 'staff_hsc') setHospCode('')
        },
      },
    )
  }

  return (
    <>
      {/* Import guide */}
      {step === 1 && (
        <div className="rounded-md border bg-btn-default-light/30 p-3 grid gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Info className="h-4 w-4 text-apple-blue shrink-0" />
            รูปแบบไฟล์ที่รองรับ
          </div>
          <p className="text-muted-foreground text-xs pl-6">
            ไฟล์ Excel (.xlsx, .xls) ที่ export จาก HosXP โดยมีคอลัมน์ดังนี้:
          </p>
          <div className="pl-6 overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pr-4 py-1 font-medium">คอลัมน์</th>
                  <th className="pr-4 py-1 font-medium">Header ที่รองรับ</th>
                  <th className="py-1 font-medium">ตัวอย่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr><td className="pr-4 py-1 font-medium text-foreground">VN *</td><td className="pr-4 py-1 text-muted-foreground">vn, VN</td><td className="py-1 text-muted-foreground">ตัวเลข 12 หลัก <span className="font-mono">690425231611</span></td></tr>
                <tr><td className="pr-4 py-1 font-medium text-foreground">HN *</td><td className="pr-4 py-1 text-muted-foreground">hn, HN</td><td className="py-1 text-muted-foreground">ตัวเลข 6 หลัก <span className="font-mono">000001</span></td></tr>
                <tr><td className="pr-4 py-1 font-medium text-foreground">ชื่อ-สกุล *</td><td className="pr-4 py-1 text-muted-foreground">ชื่อ-สกุล, ชื่อ สกุล, ชื่อ-นามสกุล</td><td className="py-1 text-muted-foreground">สมชาย ใจดี</td></tr>
                <tr><td className="pr-4 py-1 text-muted-foreground">วันเกิด</td><td className="pr-4 py-1 text-muted-foreground">วันเกิด, dob, DOB</td><td className="py-1 text-muted-foreground">2523-01-15</td></tr>
                <tr><td className="pr-4 py-1 text-muted-foreground">เบอร์โทร</td><td className="pr-4 py-1 text-muted-foreground">เบอร์โทร, tel, Tel</td><td className="py-1 text-muted-foreground">0812345678</td></tr>
                <tr><td className="pr-4 py-1 font-medium text-foreground">ชื่อยา *</td><td className="pr-4 py-1 text-muted-foreground">ชื่อยา, drug_name, Drug</td><td className="py-1 text-muted-foreground">Paracetamol</td></tr>
                <tr><td className="pr-4 py-1 text-muted-foreground">ความแรง</td><td className="pr-4 py-1 text-muted-foreground">ความแรง, strength</td><td className="py-1 text-muted-foreground">500 mg</td></tr>
                <tr><td className="pr-4 py-1 font-medium text-foreground">จำนวน *</td><td className="pr-4 py-1 text-muted-foreground">จำนวน, qty</td><td className="py-1 text-muted-foreground">ตัวเลข ≥ 1</td></tr>
                <tr><td className="pr-4 py-1 text-muted-foreground">หน่วย</td><td className="pr-4 py-1 text-muted-foreground">หน่วย, unit</td><td className="py-1 text-muted-foreground">เม็ด</td></tr>
                <tr><td className="pr-4 py-1 text-muted-foreground">วิธีใช้</td><td className="pr-4 py-1 text-muted-foreground">วิธีใช้, sig</td><td className="py-1 text-muted-foreground">1x3 หลังอาหาร</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            * คอลัมน์ที่จำเป็น — ผู้ป่วย 1 คน (VN เดียวกัน) สามารถมีได้หลายบรรทัด
          </p>
        </div>
      )}

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
            <Select value={hospCode} onValueChange={(v) => { if (v) setHospCode(v) }} items={facilities.map(f => ({ label: `${f.hosp_name} (${f.hosp_code})`, value: f.hosp_code }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือก รพ.สต." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {facilities.map((f) => (
                    <SelectItem key={f.hosp_code} value={f.hosp_code}>
                      {f.hosp_name} ({f.hosp_code})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>วันที่ให้บริการ</Label>
            <DatePicker
              value={serviceDate}
              onChange={setServiceDate}
              placeholder="เลือกวันที่"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>ประเภทคลินิก</Label>
            <Select value={clinicType} onValueChange={(v) => { if (v) setClinicType(v) }} items={CLINIC_TYPES.map(ct => ({ label: ct.label, value: ct.value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CLINIC_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectGroup>
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
            invalidRows={parseResult.invalidRows}
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
            invalidRows={parseResult.invalidRows}
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
    </>
  )
}
