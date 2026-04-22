import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDrugImport } from './useMasterDrug'

interface DrugImportProps {
  open: boolean
  onClose: () => void
}

interface ParsedDrug {
  drug_name: string
  strength: string
  unit: string
}

export function DrugImport({ open, onClose }: DrugImportProps) {
  const [parsedDrugs, setParsedDrugs] = useState<ParsedDrug[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const importMutation = useDrugImport()
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setParseErrors([])
    setImportResult(null)

    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

      if (rows.length === 0) {
        setParseErrors(['ไฟล์ไม่มีข้อมูล'])
        return
      }

      const drugs: ParsedDrug[] = []
      const errors: string[] = []

      rows.forEach((row, idx) => {
        const drugName = String(row['drug_name'] ?? row['ชื่อยา'] ?? '').trim()
        const strength = String(row['strength'] ?? row['ความแรง'] ?? '').trim()
        const unit = String(row['unit'] ?? row['หน่วย'] ?? '').trim()

        if (!drugName) {
          errors.push(`แถว ${idx + 2}: ไม่มีชื่อยา`)
          return
        }
        if (!strength) {
          errors.push(`แถว ${idx + 2}: ไม่มีความแรง`)
          return
        }
        if (!unit) {
          errors.push(`แถว ${idx + 2}: ไม่มีหน่วย`)
          return
        }
        drugs.push({ drug_name: drugName, strength, unit })
      })

      setParseErrors(errors)
      setParsedDrugs(drugs)
    } catch {
      setParseErrors(['ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์'])
    }
  }

  const handleImport = () => {
    if (parsedDrugs.length === 0) return

    const drugsWithActive = parsedDrugs.map((d) => ({
      ...d,
      active: 'Y' as const,
    }))

    importMutation.mutate(drugsWithActive, {
      onSuccess: (result) => {
        setImportResult(result)
      },
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {importResult ? 'ผลการนำเข้า' : 'นำเข้ารายการยา'}
          </DialogTitle>
        </DialogHeader>

        {/* Import result view */}
        {importResult ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <span className="text-sm">นำเข้าสำเร็จ</span>
              <span className="text-lg font-bold text-green-600">{importResult.imported}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
              <span className="text-sm">ข้าม (ซ้ำ)</span>
              <span className="text-lg font-bold text-yellow-600">{importResult.skipped}</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium text-destructive">ข้อผิดพลาด:</p>
                <ul className="mt-1 text-xs text-destructive">
                  {importResult.errors.map((err, i) => (
                    <li key={`err-${i}`}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => handleOpenChange(false)} className="bg-apple-blue hover:bg-apple-blue/90">
                ปิด
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              อัปโหลดไฟล์ Excel (.xlsx) ที่มีคอลัมน์: drug_name, strength, unit
            </p>

            {/* File upload zone */}
            <div>
              <label
                htmlFor="drug-file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-apple-blue/50 hover:bg-apple-blue/5"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">
                  {fileName ?? 'คลิกเพื่อเลือกไฟล์ .xlsx'}
                </span>
              </label>
              <Input
                id="drug-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Parse errors — show alongside preview for partial errors */}
            {parseErrors.length > 0 && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                พบข้อผิดพลาด {parseErrors.length} รายการ:
                <ul className="mt-1 ml-5 list-disc text-xs">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={`pe-${i}`}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...และอีก {parseErrors.length - 5} รายการ</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table — H5: show alongside errors for partial validation */}
            {parsedDrugs.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">ชื่อยา</th>
                      <th className="px-3 py-2 text-left font-medium">ความแรง</th>
                      <th className="px-3 py-2 text-left font-medium">หน่วย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedDrugs.map((drug, i) => (
                      <tr key={`drug-${i}`} className="border-t">
                        <td className="px-3 py-1.5">{drug.drug_name}</td>
                        <td className="px-3 py-1.5">{drug.strength}</td>
                        <td className="px-3 py-1.5">{drug.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="mr-1 inline h-3.5 w-3.5" />
                  {parsedDrugs.length} รายการพร้อมนำเข้า
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-apple-blue hover:bg-apple-blue/90"
                disabled={parsedDrugs.length === 0 || importMutation.isPending}
                onClick={handleImport}
              >
                {importMutation.isPending ? 'กำลังนำเข้า...' : `นำเข้า ${parsedDrugs.length} รายการ`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
