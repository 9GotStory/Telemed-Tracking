import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Pencil, Check, X } from 'lucide-react'
import { useUpdateTel } from '@/hooks/useUpdateTel'

/** Thai phone: 9-10 digits starting with 0 (mobile 10, landline 9) */
const TEL_REGEX = /^0\d{8,9}$/

interface EditablePhoneProps {
  tel: string
  vn: string
  /** Whether to show the edit button. Defaults to true. */
  canEdit?: boolean
}

export function EditablePhone({ tel, vn, canEdit = true }: EditablePhoneProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(tel)
  const [error, setError] = useState('')
  const updateTel = useUpdateTel()

  // Sync external tel changes (e.g. optimistic update from another query)
  useEffect(() => {
    if (!isEditing) setValue(tel)
  }, [tel, isEditing])

  const validate = (v: string): boolean => {
    if (!v) return true // allow clearing
    const digits = v.replace(/[-\s]/g, '')
    if (!TEL_REGEX.test(digits)) {
      setError('เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก (ขึ้นต้นด้วย 0)')
      return false
    }
    setError('')
    return true
  }

  const handleSave = () => {
    const trimmed = value.trim().replace(/[-\s]/g, '')
    if (trimmed === tel) {
      setIsEditing(false)
      return
    }
    if (!validate(trimmed)) return
    updateTel.mutate(
      { vn, tel: trimmed },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  const handleCancel = () => {
    setValue(tel)
    setError('')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { handleSave(); return }
    if (e.key === 'Escape') { handleCancel(); return }
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <Input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="เบอร์โทร"
            maxLength={10}
            className="h-7 text-xs flex-1"
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleSave}
            disabled={updateTel.isPending}
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCancel}
            disabled={updateTel.isPending}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  // Display mode
  return (
    <div className="flex items-center gap-1">
      {tel ? (
        <a
          href={`tel:${tel}`}
          className="inline-flex items-center gap-1 text-apple-blue hover:underline text-sm"
        >
          <Phone className="h-3 w-3" />
          {tel}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground italic">ไม่มีเบอร์โทร</span>
      )}
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsEditing(true)}
          title="แก้ไขเบอร์โทร"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
