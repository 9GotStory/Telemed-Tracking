import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useDrugList } from '@/modules/master-drugs/useMasterDrug'
import { Search } from 'lucide-react'

interface DrugSearchInputProps {
  onSelect: (drug: { drug_name: string; strength: string; unit: string }) => void
}

export function DrugSearchInput({ onSelect }: DrugSearchInputProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Debounce search term — 300ms after last keystroke
  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('')
      return
    }
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const { data: results = [], isFetching } = useDrugList({
    active: 'Y',
    search: debouncedQuery || undefined,
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = useCallback((drug: { drug_name: string; strength: string; unit: string }) => {
    onSelect(drug)
    setQuery('')
    setDebouncedQuery('')
    setOpen(false)
  }, [onSelect])

  const showDropdown = open && query.length >= 2

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="text-xs h-7 pl-7"
          placeholder="ค้นหาชื่อยา..."
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {isFetching ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">กำลังค้นหา...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              ไม่พบยา &quot;{query}&quot; — กรอกชื่อยาด้านล่างแทน
            </div>
          ) : (
            results.map((drug) => (
              <button
                key={drug.drug_id}
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center justify-between gap-2"
                onClick={() => handleSelect(drug)}
              >
                <span className="font-medium">{drug.drug_name}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {drug.strength} · {drug.unit}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
