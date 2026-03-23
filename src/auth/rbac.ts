/**
 * T1-02: RBAC (Role-Based Access Control) System
 * Define roles, permisos y validación de acceso
 */

export type Permission = 
  | 'asset:read'
  | 'asset:create'
  | 'asset:update'
  | 'asset:delete'
  | 'discovery:start'
  | 'discovery:view'
  | 'user:manage'
  | 'settings:view'
  | 'settings:update'
  | 'reports:view'
  | 'reports:export';

export type Role = 'Owner' | 'Admin' | 'Analyst' | 'ReadOnly';

/**
 * Matriz de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Owner: [
    'asset:read',
    'asset:create',
    'asset:update',
    'asset:delete',
    'discovery:start',
    'discovery:view',
    'user:manage',
    'settings:view',
    'settings:update',
    'reports:view',
    'reports:export',
  ],
  Admin: [
    'asset:read',
    'asset:create',
    'asset:update',
    'asset:delete',
    'discovery:start',
    'discovery:view',
    'user:manage',
    'settings:view',
    'reports:view',
    'reports:export',
  ],
  Analyst: [
    'asset:read',
    'asset:create',
    'asset:update',
    'discovery:view',
    'discovery:start',
    'reports:view',
  ],
  ReadOnly: [
    'asset:read',
    'discovery:view',
    'reports:view',
  ],
};

/**
 * Verifica si un rol tiene permiso para una acción
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Verifica múltiples permisos (cumple cualquiera)
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Verifica que cumple todos los permisos requeridos
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every(p => hasPermission(role, p));
}
