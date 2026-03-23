/**
 * Tipos para sistema multi-tenant
 * T1-01: Multi-tenant Core
 */

export type TenantId = string & { readonly __brand: 'TenantId' };

export function createTenantId(id: string): TenantId {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid tenantId: must be non-empty string');
  }
  return id as TenantId;
}

export function isTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && value.length > 0;
}

export interface User {
  id: string;
  email: string;
  tenantId: TenantId;
  role: 'Owner' | 'Admin' | 'Analyst' | 'ReadOnly';
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  tenantId: TenantId;
  hostname: string;
  ipAddress: string;
  status: 'active' | 'discovered' | 'inactive' | 'retired';
  agentVersion?: string;
  lastHeartbeat?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: TenantId;
  name: string;
  branding?: {
    logo?: string;
    colorScheme?: string;
  };
  settings?: {
    timezone?: string;
    dataRetentionDays?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveryScan {
  id: string;
  tenantId: TenantId;
  cidrRange: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  discoveredAssets: string[];
  errors?: string[];
}
