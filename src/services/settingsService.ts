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
}
