import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HospCodeItem {
  hosp_code: string
  hosp_name: string
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
 * Designed to receive Controller's `field` props directly:
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
  return (
    <Select
      value={value}
      onValueChange={(v) => { if (v) onChange(v) }}
      disabled={disabled}
      items={items.map(item => ({ label: `${item.hosp_name} (${item.hosp_code})`, value: item.hosp_code }))}
    >
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.hosp_code} value={item.hosp_code}>
              {item.hosp_name} ({item.hosp_code})
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
