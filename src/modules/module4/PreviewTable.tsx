import { useMemo } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ParsedRow } from '@/utils/excelParser'
import type { ImportPreviewResponse } from '@/services/importService'

interface PreviewTableProps {
  rows: ParsedRow[]
  groupedByVN: Record<string, ParsedRow[]>
  previewResult: ImportPreviewResponse | null
  invalidRows?: Record<number, string[]>
}

export function PreviewTable({ rows, groupedByVN, previewResult, invalidRows = {} }: PreviewTableProps) {
  // VNs with errors from backend preview (step 3)
  const errorVNs = useMemo(() => {
    if (!previewResult) return new Set<string>()
    return new Set(previewResult.errors.map((e) => e.vn))
  }, [previewResult])

  const errorByVN = useMemo(() => {
    if (!previewResult) return new Map<string, string>()
    return new Map(previewResult.errors.map((e) => [e.vn, e.error]))
  }, [previewResult])

  // VNs with errors from frontend parsing (step 2+)
  const invalidVNs = useMemo(() => {
    const set = new Set<string>()
    const idxArr = Object.keys(invalidRows).map(Number)
    for (const idx of idxArr) {
      const row = rows[idx]
      if (row?.vn) set.add(row.vn)
    }
    return set
  }, [invalidRows, rows])

  const allErrorVNs = useMemo(() => {
    const merged = new Set(errorVNs)
    for (const vn of invalidVNs) merged.add(vn)
    return merged
  }, [errorVNs, invalidVNs])

  const drugCountByVN = useMemo(() => {
    const map = new Map<string, number>()
    for (const [vn, vRows] of Object.entries(groupedByVN)) {
      map.set(vn, vRows.length)
    }
    return map
  }, [groupedByVN])

  if (rows.length === 0) return null

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-btn-default-light/50">
            <th className="px-3 py-2 text-left font-semibold">VN</th>
            <th className="px-3 py-2 text-left font-semibold">ชื่อ-สกุล</th>
            <th className="px-3 py-2 text-left font-semibold">ยา</th>
            <th className="px-3 py-2 text-left font-semibold">จำนวน</th>
            <th className="px-3 py-2 text-left font-semibold">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedByVN).map(([vn, vRows]) => {
            const isError = allErrorVNs.has(vn)
            const errorMsg = errorByVN.get(vn)
            const firstRow = vRows[0]

            return vRows.map((row, idx) => (
              <tr
                key={`${vn}-${idx}`}
                className={`border-t ${isError ? 'bg-destructive/5' : 'hover:bg-btn-default-light/20'}`}
              >
                {idx === 0 ? (
                  <td rowSpan={vRows.length} className="px-3 py-1.5 align-top font-mono text-xs">
                    {vn}
                    {isError && (
                      <div className="mt-1 text-xs text-destructive font-sans">{errorMsg}</div>
                    )}
                  </td>
                ) : null}
                {idx === 0 ? (
                  <td rowSpan={vRows.length} className="px-3 py-1.5 align-top">
                    {firstRow.patient_name}
                  </td>
                ) : null}
                <td className="px-3 py-1.5">{row.drug_name} {row.strength}</td>
                <td className="px-3 py-1.5">
                  {row.qty} {row.unit}
                </td>
                {idx === 0 ? (
                  <td rowSpan={vRows.length} className="px-3 py-1.5 align-top">
                    <StatusBadge variant={isError ? 'error' : 'active'}>
                      {isError ? 'ผิดพลาด' : 'ถูกต้อง'}
                    </StatusBadge>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {drugCountByVN.get(vn) ?? 0} รายการยา
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}
