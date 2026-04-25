import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            variant="outline"
            {...props}
            disabled={disabled}
            className={className ?? 'w-[220px] justify-start text-left font-normal'}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? format(value, 'd MMMM yyyy', { locale: th })
              : <span className="text-muted-foreground">{placeholder}</span>
            }
          </Button>
        )}
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={th}
        />
      </PopoverContent>
    </Popover>
  )
}
