import type { AuthUser } from '../types/auth'

export const ROLE_ADMIN = 'ROLE_ADMIN'
export const ROLE_ADMIN_SUPPORT = 'ROLE_ADMIN_SUPPORT'
export const ROLE_ADMIN_FINANCE = 'ROLE_ADMIN_FINANCE'
export const ADMIN_ORGANIZER_READ_ONLY_MESSAGE =
  'Lecture seule : les admins peuvent consulter cet espace, mais seul l’organisateur peut le modifier.'

export type AdminRole =
  | typeof ROLE_ADMIN
  | typeof ROLE_ADMIN_SUPPORT
  | typeof ROLE_ADMIN_FINANCE

function userRoles(user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined): string[] {
  if (!user) {
    return []
  }

  return Array.from(new Set([user.role, user.baseRole, ...user.roles].filter(Boolean)))
}

export function hasRole(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
  role: string,
): boolean {
  return userRoles(user).includes(role)
}

export function isAdminUser(user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined): boolean {
  return userRoles(user).some((role) =>
    isAdminRoleName(role),
  )
}

export function isAdminRoleName(role: string | null | undefined): boolean {
  return [ROLE_ADMIN, ROLE_ADMIN_SUPPORT, ROLE_ADMIN_FINANCE].includes(role ?? '')
}

export function isSuperAdmin(user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined): boolean {
  return hasRole(user, ROLE_ADMIN)
}

export function canManageAdminAccounts(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return isSuperAdmin(user)
}

export function canManageAdminContent(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return hasRole(user, ROLE_ADMIN) || hasRole(user, ROLE_ADMIN_SUPPORT)
}

export function canManageAdminFinance(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return hasRole(user, ROLE_ADMIN) || hasRole(user, ROLE_ADMIN_FINANCE)
}

export function canViewAdminOrders(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return canManageAdminContent(user) || canManageAdminFinance(user)
}

export function canViewAdminLogs(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return isAdminUser(user)
}

export function canUseOrganizerAdminTools(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return hasRole(user, 'ROLE_ORGANIZER') || isAdminUser(user)
}

export function canEditOrganizerResource(
  user: Pick<AuthUser, 'role' | 'baseRole' | 'roles'> | null | undefined,
): boolean {
  return hasRole(user, 'ROLE_ORGANIZER') && !isAdminUser(user)
}
