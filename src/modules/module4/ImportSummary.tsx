import { AlertCircle, CheckCircle2, XCircle, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ImportPreviewResponse } from '@/services/importService'

interface ImportSummaryProps {
  summary: ImportPreviewResponse | null
  isConfirming: boolean
  onConfirm: () => void
  hasParsedData: boolean
}

export function ImportSummary({ summary, isConfirming, onConfirm, hasParsedData }: ImportSummaryProps) {
  if (!summary && !hasParsedData) return null

  const hasErrors = summary ? summary.errors.length > 0 : false
  const canConfirm = hasParsedData && summary && !hasErrors

  return (
    <div className="grid gap-4">
      {summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground">ทั้งหมด</div>
              <div className="text-lg font-semibold">{summary.summary.total_rows}</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground">VN ไม่ซ้ำ</div>
              <div className="text-lg font-semibold">{summary.summary.unique_vns}</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" /> ถูกต้อง
              </div>
              <div className="text-lg font-semibold text-green-600">{summary.summary.valid_vns}</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" /> ผิดพลาด
              </div>
              <div className="text-lg font-semibold text-destructive">{summary.summary.error_vns}</div>
            </div>
          </div>

          {/* Unknown drugs */}
          {summary.unknown_drugs.length > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <FileQuestion className="h-4 w-4" />
                ยาที่ไม่พบในคลัง ({summary.unknown_drugs.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {summary.unknown_drugs.map((drug) => (
                  <span key={drug} className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {drug}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error details */}
          {summary.errors.length > 0 && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                รายการที่ผิดพลาด ({summary.errors.length})
              </div>
              <div className="mt-2 space-y-1">
                {summary.errors.map((err, i) => (
                  <div key={i} className="text-xs text-destructive">
                    <span className="font-mono">{err.vn}</span>: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm button */}
      <Button
        className="bg-apple-blue hover:bg-apple-blue/90 self-end"
        disabled={!canConfirm || isConfirming}
        onClick={onConfirm}
      >
        {isConfirming ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้าข้อมูล'}
      </Button>
    </div>
  )
}
