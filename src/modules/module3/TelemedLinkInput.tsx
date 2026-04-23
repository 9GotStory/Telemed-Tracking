import { useState, useEffect } from 'react'
import { Link, Save, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useScheduleSetLink } from './useSchedule'
import { useAuthStore } from '@/stores/authStore'

interface TelemedLinkInputProps {
  scheduleId: string
  currentLink: string
}

export function TelemedLinkInput({ scheduleId, currentLink }: TelemedLinkInputProps) {
  const { user } = useAuthStore()
  const [link, setLink] = useState(currentLink)
  const setLinkMutation = useScheduleSetLink()

  const canEdit = user?.role === 'staff_hosp' || user?.role === 'admin_hosp' || user?.role === 'super_admin'

  useEffect(() => {
    setLink(currentLink)
  }, [currentLink])

  const handleSave = () => {
    if (setLinkMutation.isPending) return
    setLinkMutation.mutate(
      { scheduleId, telemedLink: link },
      { onSuccess: () => {} },
    )
  }

  // Read-only view for staff_hsc
  if (!canEdit) {
    if (!currentLink) {
      return (
        <div className="text-sm text-muted-foreground py-1">
          ยังไม่มีลิงก์ Telemed
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <a
          href={currentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-apple-blue hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          เปิดลิงก์ Telemed
        </a>
      </div>
    )
  }

  // Editable view for staff_hosp and above
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://meet.moph.go.th/..."
          className="pl-8 text-sm"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={setLinkMutation.isPending || link === currentLink}
        className="shrink-0"
      >
        {setLinkMutation.isPending ? (
          <span className="text-xs">กำลังบันทึก...</span>
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
      </Button>
      {currentLink && (
        <a
          href={currentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      )}
    </div>
  )
}
