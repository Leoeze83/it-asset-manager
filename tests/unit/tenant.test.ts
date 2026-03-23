/**
 * Tests para T1-01: Multi-tenant System
 * Validar aislamiento de tenant y tipos
 */

import { createTenantId, isTenantId } from '../src/types/tenant';

describe('T1-01: Multi-tenant Types', () => {
  it('should create valid tenantId', () => {
    const tenantId = createTenantId('company-abc');
    expect(tenantId).toBe('company-abc');
  });

  it('should throw on invalid tenantId', () => {
    expect(() => createTenantId('')).toThrow('Invalid tenantId');
    expect(() => createTenantId('  ')).toThrow('Invalid tenantId');
  });

  it('should validate tenantId', () => {
    expect(isTenantId('valid-tenant')).toBe(true);
    expect(isTenantId('')).toBe(false);
    expect(isTenantId(null)).toBe(false);
    expect(isTenantId(123)).toBe(false);
  });
});
