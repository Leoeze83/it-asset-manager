/**
 * Tests para T1-02: RBAC System
 * Validar matriz de permisos
 */

import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  ROLE_PERMISSIONS,
  Role,
} from '../src/auth/rbac';

describe('T1-02: RBAC Permissions', () => {
  it('should grant Owner all permissions', () => {
    const ownerPerms = ROLE_PERMISSIONS['Owner'];
    expect(ownerPerms.length).toBeGreaterThan(0);
    expect(ownerPerms).toContain('asset:delete');
    expect(ownerPerms).toContain('user:manage');
  });

  it('should deny ReadOnly certain permissions', () => {
    const readOnlyPerms = ROLE_PERMISSIONS['ReadOnly'];
    expect(readOnlyPerms).not.toContain('asset:delete');
    expect(readOnlyPerms).not.toContain('user:manage');
  });

  it('should check single permission', () => {
    expect(hasPermission('Owner', 'asset:delete')).toBe(true);
    expect(hasPermission('ReadOnly', 'asset:delete')).toBe(false);
    expect(hasPermission('Analyst', 'asset:create')).toBe(true);
  });

  it('should check any permission', () => {
    expect(
      hasAnyPermission('ReadOnly', ['asset:delete', 'asset:read'])
    ).toBe(true);
    expect(
      hasAnyPermission('ReadOnly', ['asset:delete', 'user:manage'])
    ).toBe(false);
  });

  it('should check all permissions', () => {
    expect(
      hasAllPermissions('Owner', ['asset:delete', 'user:manage'])
    ).toBe(true);
    expect(
      hasAllPermissions('Analyst', ['asset:delete', 'asset:create'])
    ).toBe(false);
  });
});
