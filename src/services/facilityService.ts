import { z } from 'zod'
import { gasGet } from '@/services/api'

const facilityItemSchema = z.object({
  hosp_code: z.string(),
  hosp_name: z.string(),
})

const facilityListSchema = z.array(facilityItemSchema)

export interface FacilityItem {
  hosp_code: string
  hosp_name: string
}

export const facilityService = {
  /** List active facilities — GET, filtered by role on GAS side */
  async list(): Promise<FacilityItem[]> {
    const raw = await gasGet<unknown>('facilities.list')
    return facilityListSchema.parse(raw)
  },
}
