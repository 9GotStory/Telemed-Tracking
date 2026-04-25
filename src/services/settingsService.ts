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

// ---------------------------------------------------------------------------
// Exported Types
// ---------------------------------------------------------------------------

export type SettingsEntry = z.infer<typeof settingsEntrySchema>

export interface SettingsSaveData {
  settings: SettingsEntry[]
  telegram_test?: boolean
}

export interface SheetMismatch {
  index: number
  expected: string
  actual: string
}

export interface SheetVerifyResult {
  ok: boolean
  expected: string[]
  actual: string[]
  mismatches: SheetMismatch[]
  error?: string
}

export interface VerifyReport {
  ok: boolean
  sheets: Record<string, SheetVerifyResult>
}

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
    return raw as VerifyReport
  },
}
