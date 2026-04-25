import { CheckCircle2, Circle } from 'lucide-react'

export interface ChecklistField {
  label: string
  filled: boolean
}

interface FormChecklistCardProps {
  fields: ChecklistField[]
  title?: string
}

/**
 * Shows a checklist of required form fields.
 * Filled = green check + muted text, empty = hollow circle + normal text.
 */
export function FormChecklistCard({ fields, title = 'ข้อมูลที่จำเป็น' }: FormChecklistCardProps) {
  const filledCount = fields.filter((f) => f.filled).length

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">
          {filledCount}/{fields.length}
        </span>
      </div>
      <ul className="grid gap-1.5">
        {fields.map((field) => (
          <li key={field.label} className="flex items-center gap-2 text-sm">
            {field.filled ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
            )}
            <span className={field.filled ? 'text-muted-foreground line-through' : ''}>
              {field.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
