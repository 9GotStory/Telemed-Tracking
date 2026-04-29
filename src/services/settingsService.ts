import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas (T119)
// ---------------------------------------------------------------------------

const settingsEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
})

const settingsResponseSchema = z.object({
  settings: z.array(settingsEntrySchema),
})

const messageResponseSchema = z.object({
  message: z.string(),
})

const sheetMismatchSchema = z.object({
  index: z.number(),
  expected: z.string(),
  actual: z.string(),
})

const sheetVerifyResultSchema = z.object({
  ok: z.boolean(),
  expected: z.array(z.string()),
  actual: z.array(z.string()),
  mismatches: z.array(sheetMismatchSchema),
  error: z.string().optional(),
})

const verifyReportSchema = z.object({
  ok: z.boolean(),
  sheets: z.record(sheetVerifyResultSchema),
})

const userDumpRowSchema = z.object({
  row: z.number(),
  cells: z.record(z.string()),
})

const dumpUsersResponseSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(userDumpRowSchema),
})

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type SettingsEntry = z.infer<typeof settingsEntrySchema>
export type SheetMismatch = z.infer<typeof sheetMismatchSchema>
export type SheetVerifyResult = z.infer<typeof sheetVerifyResultSchema>
export type VerifyReport = z.infer<typeof verifyReportSchema>
export type UserDumpRow = z.infer<typeof userDumpRowSchema>

export interface SettingsSaveData {
  settings: SettingsEntry[]
  telegram_test?: boolean
}

export { dumpUsersResponseSchema }

// ---------------------------------------------------------------------------
// GAS Actions (T120)
// ---------------------------------------------------------------------------

export const settingsService = {
  /** Get all settings from SETTINGS sheet */
  async get(): Promise<{ settings: SettingsEntry[] }> {
    const raw = await gasGet<unknown>('settings.get')
    return settingsResponseSchema.parse(raw)
  },

  /** Save settings key-value pairs; optionally send Telegram test message */
  async save(data: SettingsSaveData): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('settings.save', data)
    return messageResponseSchema.parse(raw)
  },

  /** Verify all sheet headers match expected column definitions (super_admin only) */
  async verifySheets(): Promise<VerifyReport> {
    const raw = await gasPost<unknown>('system.verify')
    return verifyReportSchema.parse(raw)
  },

  /** Dump raw USERS sheet data for admin inspection (super_admin only) */
  async dumpUsers(): Promise<{ headers: string[]; rows: UserDumpRow[] }> {
    const raw = await gasPost<unknown>('system.dumpUsers')
    return dumpUsersResponseSchema.parse(raw)
  },
}
