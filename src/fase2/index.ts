/**
 * Fase 2 - Sprint 1 Exports
 * Punto central para importar tipos, middlewares y servicios
 */

// T1-01: Multi-tenant Types
export {
  TenantId,
  createTenantId,
  isTenantId,
  User,
  Asset,
  Tenant,
  DiscoveryScan,
} from './types/tenant';

export {
  extractTenantMiddleware,
  validateTenantIsolation,
  type TenantRequest,
} from './middleware/tenantMiddleware';

// T1-02: RBAC
export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from './auth/rbac';

export {
  checkPermission,
  requireRole,
  requireAllPermissions,
  type AuthenticatedRequest,
} from './auth/rbacMiddleware';

// T1-03: Discovery
export {
  cidrToIpRange,
  deduplicateAssets,
  type DiscoveryService,
  type ScanStatus,
  type DiscoveredAsset,
} from './services/discoveryService';

// T1-04: Connector Framework
export {
  BaseConnector,
  ConnectorFactory,
  DummyConnector,
  type IConnector,
  type SyncResult,
  type ConnectorConfig,
} from './connectors/BaseConnector';

// T1-05: Intune Connector
export {
  IntuneConnector,
  type IntuneDevice,
  type IntuneTokenResponse,
} from './connectors/IntuneConnector';
