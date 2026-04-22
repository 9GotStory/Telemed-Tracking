import type { UserRole } from '@/types/user'

/** Role hierarchy — higher index = more permissions */
export const ROLE_HIERARCHY: UserRole[] = ['staff_hsc', 'staff_hosp', 'admin_hosp', 'super_admin']

/** Maximum allowed role per hosp_type during registration */
export const HOSP_TYPE_MAX_ROLE: Record<string, UserRole> = {
  'สสอ.': 'super_admin',
  'รพ.': 'admin_hosp',
  'รพ.สต.': 'staff_hsc',
}

/** Module access matrix — which roles can access each module */
export const MODULE_ACCESS: Record<string, UserRole[]> = {
  dashboard: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'], // Public dashboard
  module1: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'], // Equipment
  module2: ['super_admin', 'admin_hosp'], // Readiness
  module3: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'], // Schedule (create: admin+)
  module4: ['super_admin', 'admin_hosp', 'staff_hosp'], // Import
  module5: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'], // Drug confirm
  module6: ['super_admin', 'admin_hosp'], // Follow-up
  'master-drugs': ['super_admin', 'admin_hosp'], // Master drug
  users: ['super_admin', 'admin_hosp'], // User management
  settings: ['super_admin'], // System settings
}

/** Which roles a manager can assign/see */
export const MANAGED_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: ['admin_hosp', 'staff_hosp', 'staff_hsc'],
  admin_hosp: ['staff_hosp', 'staff_hsc'],
  staff_hosp: [],
  staff_hsc: [],
}

/** Roles allowed to create/modify resources per module */
export const WRITE_ACCESS: Record<string, UserRole[]> = {
  module1: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'],
  module2: ['super_admin', 'admin_hosp'],
  module3: ['super_admin', 'admin_hosp'],
  module4: ['super_admin', 'admin_hosp', 'staff_hosp'],
  module5: ['super_admin', 'admin_hosp', 'staff_hosp', 'staff_hsc'],
  module6: ['super_admin', 'admin_hosp'],
  'master-drugs': ['super_admin', 'admin_hosp'],
  users: ['super_admin', 'admin_hosp'],
  settings: ['super_admin'],
}
