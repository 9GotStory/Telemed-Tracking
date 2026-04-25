import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HospCodeItem {
  hosp_code: string
  hosp_name: string
  hosp_type?: string
}

interface HospCodeSelectProps {
  value: string
  onChange: (value: string) => void
  items: HospCodeItem[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Reusable dropdown for hospital/facility selection.
 * Automatically groups items by hosp_type if available.
 *
 *   <Controller
 *     name="hosp_code"
 *     control={control}
 *     render={({ field }) => (
 *       <HospCodeSelect {...field} items={hospitals} />
 *     )}
 *   />
 */
export function HospCodeSelect({
  value,
  onChange,
  items,
  placeholder = 'เลือกสถานพยาบาล',
  disabled = false,
  className,
}: HospCodeSelectProps) {
  const hasTypes = items.some((item) => item.hosp_type)

  // Build flat items list for Base UI Select value resolution
  const flatItems = items.map((item) => ({
    label: `${item.hosp_name} (${item.hosp_code})`,
    value: item.hosp_code,
  }))

  return (
    <Select
      value={value}
      onValueChange={(v) => { if (v) onChange(v) }}
      disabled={disabled}
      items={flatItems}
    >
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hasTypes ? (
          groupByType(items).map((group) => (
            <SelectGroup key={group.type}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.items.map((item) => (
                <SelectItem key={item.hosp_code} value={item.hosp_code}>
                  {item.hosp_name} ({item.hosp_code})
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.hosp_code} value={item.hosp_code}>
                {item.hosp_name} ({item.hosp_code})
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}

// Group items by hosp_type with display labels
function groupByType(items: HospCodeItem[]) {
  const TYPE_LABELS: Record<string, string> = {
    'รพ.': 'โรงพยาบาล',
    'รพ.สต.': 'รพ.สต.',
    'สสช.': 'สถานบริการสาธารณสุขชุมชน',
  }

  // Preserve insertion order
  const groups = new Map<string, HospCodeItem[]>()
  for (const item of items) {
    const type = item.hosp_type ?? 'อื่นๆ'
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type)!.push(item)
  }

  return Array.from(groups.entries()).map(([type, items]) => ({
    type,
    label: TYPE_LABELS[type] ?? type,
    items,
  }))
}
