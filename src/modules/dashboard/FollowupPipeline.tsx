import type { FollowupPipeline as FollowupPipelineData } from '@/services/dashboardService'

interface FollowupPipelineProps {
  pipeline: FollowupPipelineData
}

export function FollowupPipeline({ pipeline }: FollowupPipelineProps) {
  const total = pipeline.followed + pipeline.pending

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
        <div className="text-sm text-[rgba(0,0,0,0.48)] mb-1">ติดตามแล้ว</div>
        <div className="text-3xl font-semibold text-[#0071e3]">{pipeline.followed}</div>
        {total > 0 && (
          <div className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
            {Math.round((pipeline.followed / total) * 100)}%
          </div>
        )}
      </div>
      <div className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
        <div className="text-sm text-[rgba(0,0,0,0.48)] mb-1">รอติดตาม</div>
        <div className="text-3xl font-semibold text-[#1d1d1f]">{pipeline.pending}</div>
        {total > 0 && (
          <div className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
            {Math.round((pipeline.pending / total) * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}
