import type { FollowupPipeline as FollowupPipelineData } from '@/services/dashboardService'
import { PhoneForwarded, Clock } from 'lucide-react'

interface FollowupPipelineProps {
  pipeline: FollowupPipelineData
}

export function FollowupPipeline({ pipeline }: FollowupPipelineProps) {
  const total = pipeline.followed + pipeline.pending

  if (total === 0) {
    return (
      <div className="text-center py-10 text-[rgba(0,0,0,0.48)]">
        ยังไม่มีข้อมูลการติดตามผู้ป่วย
      </div>
    )
  }

  const followedPct = Math.round((pipeline.followed / total) * 100)
  const pendingPct = 100 - followedPct

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10">
            <PhoneForwarded className="h-4 w-4 text-[#0071e3]" />
          </div>
          <span className="text-xs font-medium text-[rgba(0,0,0,0.48)]">ติดตามแล้ว</span>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-[#0071e3]">
          {pipeline.followed}
        </div>
        <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
          {followedPct}% ของทั้งหมด
        </p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,0.06)]">
            <Clock className="h-4 w-4 text-[rgba(0,0,0,0.48)]" />
          </div>
          <span className="text-xs font-medium text-[rgba(0,0,0,0.48)]">รอติดตาม</span>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">
          {pipeline.pending}
        </div>
        <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
          {pendingPct}% ของทั้งหมด
        </p>
      </div>
    </div>
  )
}
