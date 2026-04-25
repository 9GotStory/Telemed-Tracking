import { z } from 'zod'
import { gasGet } from '@/services/api'

const hospitalItemSchema = z.object({
  hosp_code: z.string(),
  hosp_name: z.string(),
  hosp_type: z.string(),
})

const hospitalListSchema = z.array(hospitalItemSchema)

export interface HospitalItem {
  hosp_code: string
  hosp_name: string
  hosp_type: string
}

export const hospitalService = {
  /** List active hospitals — public GET, no token required */
  async list(): Promise<HospitalItem[]> {
    const raw = await gasGet<unknown>('hospital.list')
    return hospitalListSchema.parse(raw)
  },
}
