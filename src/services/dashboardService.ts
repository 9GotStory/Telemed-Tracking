import { z } from 'zod'
import { gasGet } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T102)
// ---------------------------------------------------------------------------

const equipmentStatusSchema = z.object({
  hosp_code: z.string(),
  hosp_name: z.string(),
  status: z.string(),
  last_check_date: z.string(),
})

const upcomingAppointmentSchema = z.object({
  service_date: z.string(),
  hosp_name: z.string(),
  clinic_type: z.string(),
  service_time: z.string(),
  appoint_count: z.number(),
})

const attendanceRowSchema = z.object({
  hosp_name: z.string(),
  total_appointed: z.number(),
  total_attended: z.number(),
  rate: z.number(),
})

const followupPipelineSchema = z.object({
  followed: z.number(),
  pending: z.number(),
})

const monthlySessionsSchema = z.record(z.string(), z.number())

const monthlyAttendanceRowSchema = z.object({
  month: z.string(),
  total_appointed: z.number(),
  total_attended: z.number(),
  rate: z.number(),
})

const monthlyFollowupRowSchema = z.object({
  month: z.string(),
  followed: z.number(),
  pending: z.number(),
})

export const dashboardStatsSchema = z.object({
  equipment_status: z.array(equipmentStatusSchema),
  upcoming_appointments: z.array(upcomingAppointmentSchema),
  monthly_sessions: monthlySessionsSchema,
  attendance_by_facility: z.array(attendanceRowSchema),
  followup_pipeline: followupPipelineSchema,
  monthly_attendance: z.array(monthlyAttendanceRowSchema).optional(),
  monthly_followup: z.array(monthlyFollowupRowSchema).optional(),
})

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>
export type UpcomingAppointment = z.infer<typeof upcomingAppointmentSchema>
export type AttendanceRow = z.infer<typeof attendanceRowSchema>
export type FollowupPipeline = z.infer<typeof followupPipelineSchema>
export type MonthlyAttendanceRow = z.infer<typeof monthlyAttendanceRowSchema>
export type MonthlyFollowupRow = z.infer<typeof monthlyFollowupRowSchema>
export type DashboardStats = z.infer<typeof dashboardStatsSchema>

// ---------------------------------------------------------------------------
// GAS Actions (T103)
// ---------------------------------------------------------------------------

export const dashboardService = {
  /** Get aggregate dashboard stats — public endpoint, no token required */
  async getStats(): Promise<DashboardStats> {
    const raw = await gasGet<unknown>('dashboard.stats')
    return dashboardStatsSchema.parse(raw)
  },
}
