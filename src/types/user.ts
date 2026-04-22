export type UserRole = 'super_admin' | 'admin_hosp' | 'staff_hosp' | 'staff_hsc'
export type UserStatus = 'pending' | 'active' | 'inactive'

export interface User {
  user_id: string
  hosp_code: string
  first_name: string
  last_name: string
  tel: string
  role: UserRole
  status: UserStatus
  approved_by: string | null
  created_at: string
  last_login: string | null
}

/** Auth user stored in authStore — excludes sensitive fields */
export interface AuthUser {
  user_id: string
  hosp_code: string
  first_name: string
  last_name: string
  role: UserRole
  hosp_name: string
}
