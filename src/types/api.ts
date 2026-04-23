import type { UserRole } from '@/types/user'

/** Generic GAS API response wrapper */
export interface GasResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/** Login response from GAS — flat structure per contracts/auth.md */
export interface LoginResponse {
  token: string
  user_id: string
  hosp_code: string
  first_name: string
  last_name: string
  role: UserRole
  hosp_name: string
  force_change?: boolean
}

/** Register response from GAS */
export interface RegisterResponse {
  message: string
}

/** Paginated list response with metadata */
export interface ListResponse<T> {
  items: T[]
  total: number
}

/** Standard filter params for list queries */
export interface ListFilters {
  hosp_code?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}
