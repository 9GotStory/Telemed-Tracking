import { DRUG_SOURCES_EXISTING, DRUG_SOURCES_NEW } from '@/constants/drugSources'
import type { DrugSource } from '@/types/visit'

interface DrugSourceSelectorProps {
  value: DrugSource
  onChange: (value: DrugSource) => void
  disabled?: boolean
  /** Show only hosp_stock (for existing drugs) or include hosp_pending (for new drugs) */
  variant?: 'existing' | 'new'
}

const SOURCE_SETS = {
  existing: DRUG_SOURCES_EXISTING,
  new: DRUG_SOURCES_NEW,
} as const

export function DrugSourceSelector({ value, onChange, disabled, variant = 'existing' }: DrugSourceSelectorProps) {
  const sources = SOURCE_SETS[variant]

  // Single option — just show label, no toggle needed
  if (sources.length <= 1) {
    return (
      <span className="rounded-md bg-btn-default-light px-2 py-1 text-xs font-medium text-muted-foreground">
        {sources[0].label}
      </span>
    )
  }

  return (
    <div className="flex gap-1">
      {sources.map((src) => {
        const isSelected = value === src.value
        return (
          <button
            key={src.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(src.value as DrugSource)}
            className={`
              rounded-md px-2 py-1 text-xs font-medium transition-colors
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSelected
                ? 'bg-apple-blue text-white'
                : 'bg-btn-default-light text-muted-foreground hover:bg-btn-default-light/80'
              }
            `}
            title={src.description}
          >
            {src.label}
          </button>
        )
      })}
    </div>
  )
}
