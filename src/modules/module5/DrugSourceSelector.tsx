import { DRUG_SOURCES } from '@/constants/drugSources'
import type { DrugSource } from '@/types/visit'

interface DrugSourceSelectorProps {
  value: DrugSource
  onChange: (value: DrugSource) => void
}

export function DrugSourceSelector({ value, onChange }: DrugSourceSelectorProps) {
  return (
    <div className="flex gap-1">
      {DRUG_SOURCES.map((src) => {
        const isSelected = value === src.value
        return (
          <button
            key={src.value}
            type="button"
            onClick={() => onChange(src.value as DrugSource)}
            className={`
              rounded-md px-2 py-1 text-xs font-medium transition-colors
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
