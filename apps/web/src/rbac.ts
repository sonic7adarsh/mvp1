export type Role = 'customer' | 'seller' | 'rider' | 'admin'

export function canRoleAccess(required: Role, active: Role | null) {
  return active === required
}

export function hasAnyRole(active: Role | null, roles: Role[]) {
  return !!active && roles.includes(active)
}