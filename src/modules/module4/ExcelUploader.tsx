import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import type { ParseResult } from '@/utils/excelParser'
import { parseHosXPExport } from '@/utils/excelParser'

interface ExcelUploaderProps {
  onParsed: (result: ParseResult) => void
}

export function ExcelUploader({ onParsed }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setParseErrors(['กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น'])
        return
      }
      setFileName(file.name)
      setParseErrors([])

      const reader = new FileReader()
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const result = await parseHosXPExport(arrayBuffer)
        if (result.errors.length > 0) {
          setParseErrors(result.errors)
        }
        onParsed(result)
      }
      reader.onerror = () => {
        setParseErrors(['ไม่สามารถอ่านไฟล์ได้'])
      }
      reader.readAsArrayBuffer(file)
    },
    [onParsed],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="grid gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-apple-blue bg-apple-blue/5' : 'border-border hover:border-apple-blue/50'}
        `}
        onClick={() => document.getElementById('excel-file-input')?.click()}
      >
        <input
          id="excel-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />
        {fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="h-10 w-10 text-apple-blue" />
            <span className="text-sm font-medium">{fileName}</span>
            <span className="text-xs text-muted-foreground">คลิกเพื่อเลือกไฟล์ใหม่</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm font-medium">ลากไฟล์ Excel มาวาง หรือคลิกเพื่อเลือก</span>
            <span className="text-xs text-muted-foreground">รองรับเฉพาะ .xlsx, .xls</span>
          </div>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3">
          {parseErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
