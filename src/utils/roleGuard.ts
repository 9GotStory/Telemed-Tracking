import type { UserRole } from '@/types/user'
import { ROLE_HIERARCHY, MODULE_ACCESS, MANAGED_ROLES, WRITE_ACCESS } from '@/constants/roles'

/**
 * Check if a user can access data for a given hosp_code.
 * staff_hsc can only see their own facility.
 */
export function canAccessHospCode(userRole: UserRole, userHospCode: string, targetHospCode: string): boolean {
  if (userRole === 'staff_hsc') {
    return userHospCode === targetHospCode
  }
  return true // staff_hosp and above see all
}

/**
 * Check if a user with managerRole can manage a target role.
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  const managed = MANAGED_ROLES[managerRole]
  return managed.includes(targetRole)
}

/**
 * Check if a role can access a specific module.
 */
export function isModuleAllowed(module: string, role: UserRole): boolean {
  const allowed = MODULE_ACCESS[module]
  return allowed ? allowed.includes(role) : false
}

/**
 * Check if roleA has equal or higher privileges than roleB.
 */
export function hasRoleLevel(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(roleB)
}

/**
 * Check if a role can create/modify resources in a module.
 */
export function canWrite(module: string, role: UserRole): boolean {
  return WRITE_ACCESS[module]?.includes(role) ?? false
}
