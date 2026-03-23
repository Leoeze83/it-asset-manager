# Fase 2 Sprint 1 - Guía de Desarrollo Rápida

**Objetivo**: Acelerar desarrollo de las 5 tareas con templates y patrones listos.

---

## T1-01: Multi-tenant Core - Estructura Base

### 1. Tipos TypeScript

**Archivo**: `src/types.ts`

```typescript
// Agregar al archivo existente
export type TenantId = string & { readonly __brand: 'TenantId' };

export function createTenantId(id: string): TenantId {
  if (!id || typeof id !== 'string') throw new Error('Invalid tenantId');
  return id as TenantId;
}

export interface User {
  id: string;
  email: string;
  tenantId: TenantId;  // ← NUEVO
  role: 'Owner' | 'Admin' | 'Analyst' | 'ReadOnly';
  createdAt: Date;
}

export interface Asset {
  id: string;
  tenantId: TenantId;  // ← NUEVO
  hostname: string;
  ipAddress: string;
  status: 'active' | 'discovered' | 'inactive' | 'retired';
  agentVersion?: string;
  lastHeartbeat?: Date;
  metadata?: Record<string, any>;
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
  createdBy: string;
}
```

### 2. Middleware para extraer tenantId

**Archivo**: `src/middleware/tenantMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { TenantId, createTenantId } from '../types';

// Extender express Request
declare global {
  namespace Express {
    interface Request {
      tenantId: TenantId;
      userId: string;
    }
  }
}

export middleware function extractTenantId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // De Firebase Auth custom claims o header
    const tenantId = req.user?.tenantId || req.header('X-Tenant-Id');
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing tenantId' });
    }

    req.tenantId = createTenantId(tenantId);
    req.userId = req.user?.uid || '';
    
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid tenantId format' });
  }
}
```

### 3. Firestore Rules actualizadas

**Archivo**: `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Validar autenticación
    function isSignedIn() {
      return request.auth != null;
    }

    // Validar tenantId
    function userTenantId() {
      return request.auth.token.tenantId ?? request.auth.uid;
    }

    function isSameTenant(tenantId) {
      return userTenantId() == tenantId;
    }

    // Documentos de usuarios
    match /users/{userId} {
      allow read, write: if isSignedIn() && isSameTenant(resource.data.tenantId);
    }

    // Documentos de activos
    match /assets/{assetId} {
      allow read: if isSignedIn() && isSameTenant(resource.data.tenantId);
      allow write: if isSignedIn() && 
                      isSameTenant(resource.data.tenantId) &&
                      request.resource.data.tenantId == resource.data.tenantId; // Prevent tenant change
    }

    // Configuración por tenant
    match /tenants/{tenantId} {
      allow read: if isSignedIn() && isSameTenant(tenantId);
      allow write: if isSignedIn() && 
                       isSameTenant(tenantId) &&
                       hasRole(tenantId, 'Owner');
    }
  }
}
```

### 4. Queries con tenantId

**Archivo**: `src/services/assetService.ts`

```typescript
import { FirebaseFirestore } from '@firebase/firestore';
import { TenantId } from '../types';

export class AssetService {
  constructor(private db: FirebaseFirestore) {}

  async getAssetsByTenant(tenantId: TenantId) {
    const query = this.db
      .collection('assets')
      .where('tenantId', '==', tenantId);
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  async createAsset(tenantId: TenantId, data: any) {
    // Forzar tenantId en creación
    const assetData = {
      ...data,
      tenantId,
      createdAt: new Date(),
    };

    return this.db.collection('assets').add(assetData);
  }
}
```

---

## T1-02: RBAC - Estructura Base

### 1. Roles y Permisos

**Archivo**: `src/rbac/permissions.ts`

```typescript
export enum Role {
  Owner = 'Owner',
  Admin = 'Admin',
  Analyst = 'Analyst',
  ReadOnly = 'ReadOnly',
}

export enum Resource {
  Assets = 'Assets',
  Settings = 'Settings',
  Reports = 'Reports',
  Users = 'Users',
  Discovery = 'Discovery',
  Connectors = 'Connectors',
}

export enum Action {
  Create = 'Create',
  Read = 'Read',
  Update = 'Update',
  Delete = 'Delete',
  Execute = 'Execute', // Para discovery, sync
}

export type Permission = `${Resource}:${Action}`;

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Owner]: [
    // Todo acceso
    'Assets:Create', 'Assets:Read', 'Assets:Update', 'Assets:Delete',
    'Settings:Create', 'Settings:Read', 'Settings:Update', 'Settings:Delete',
    'Reports:Create', 'Reports:Read', 'Reports:Update', 'Reports:Delete',
    'Users:Create', 'Users:Read', 'Users:Update', 'Users:Delete',
    'Discovery:Execute', 'Discovery:Read',
    'Connectors:Create', 'Connectors:Read', 'Connectors:Update', 'Connectors:Delete',
  ],
  [Role.Admin]: [
    'Assets:Create', 'Assets:Read', 'Assets:Update',
    'Settings:Read', 'Settings:Update', // No puede crear/eliminar configuración
    'Reports:Create', 'Reports:Read', 'Reports:Update',
    'Users:Read', 'Users:Update', // Solo ver y editar usuarios, no crear/eliminar
    'Discovery:Execute', 'Discovery:Read',
    'Connectors:Read', 'Connectors:Update', // Puede actualizar pero no crear/eliminar
  ],
  [Role.Analyst]: [
    'Assets:Read', // Solo lectura de activos
    'Settings:Read',
    'Reports:Create', 'Reports:Read',
    'Discovery:Read', // Puede ver discovery pero no ejecutar
  ],
  [Role.ReadOnly]: [
    'Assets:Read',
    'Settings:Read',
    'Reports:Read',
    'Discovery:Read',
  ],
};

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const permission: Permission = `${resource}:${action}`;
  return ROLE_PERMISSIONS[role].includes(permission);
}
```

### 2. Middleware RBAC

**Archivo**: `src/middleware/rbacMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { Resource, Action, hasPermission, Role } from '../rbac/permissions';

export function checkPermission(resource: Resource, action: Action) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role as Role;
      
      if (!userRole) {
        return res.status(401).json({ error: 'User role not found' });
      }

      if (!hasPermission(userRole, resource, action)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: `${resource}:${action}`,
          userRole,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Uso en rutas:
// router.post('/assets', checkPermission(Resource.Assets, Action.Create), createAsset);
```

---

## T1-03: Discovery MVP - Network Scanner

### 1. Librería de descobrimiento

**Instalación**:
```bash
npm install node-ping node-snmp --save
```

### 2. Servicio de Discovery

**Archivo**: `src/services/discoveryService.ts`

```typescript
import { TenantId } from '../types';
import ping from 'node-ping';

export interface DiscoveryScan {
  id: string;
  tenantId: TenantId;
  cidrRange: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  discoveredHosts: string[];
  duplicates: number;
  errors: string[];
}

export class DiscoveryService {
  constructor(private db: any, private logger: any) {}

  async startScan(
    tenantId: TenantId,
    cidrRange: string,
    label: string
  ): Promise<DiscoveryScan> {
    const scan: DiscoveryScan = {
      id: crypto.randomUUID(),
      tenantId,
      cidrRange,
      label,
      status: 'running',
      startTime: new Date(),
      discoveredHosts: [],
      duplicates: 0,
      errors: [],
    };

    // Guardar en BD
    await this.db.collection('discovery_scans').doc(scan.id).set(scan);

    // Ejecutar escaneo en background
    this.executeScan(scan).catch(err => {
      this.logger.error(`Scan ${scan.id} failed:`, err);
      scan.status = 'failed';
      scan.errors.push(err.message);
      this.db.collection('discovery_scans').doc(scan.id).update(scan);
    });

    return scan;
  }

  private async executeScan(scan: DiscoveryScan) {
    const ips = this.cidrToIps(scan.cidrRange);
    
    for (const ip of ips) {
      try {
        const res = await ping.promise.probe(ip, { timeout: 2 });
        
        if (res.alive) {
          scan.discoveredHosts.push(ip);
          
          // Deduplicar y crear Asset
          const existing = await this.checkIfExists(scan.tenantId, ip);
          if (!existing) {
            await this.createDiscoveredAsset(scan.tenantId, ip, scan.label);
          } else {
            scan.duplicates++;
          }
        }
      } catch (error) {
        this.logger.warn(`Ping failed for ${ip}:`, error.message);
      }
    }

    scan.status = 'completed';
    scan.endTime = new Date();
    await this.db.collection('discovery_scans').doc(scan.id).update(scan);
  }

  private cidrToIps(cidr: string): string[] {
    // Implementar conversión CIDR → IPs (librería: 'cidr-js')
    // Por now: formato simplificado
    const [base, mask] = cidr.split('/');
    const [a, b, c, d] = base.split('.').map(Number);
    const ips: string[] = [];

    const count = Math.pow(2, 32 - parseInt(mask));
    for (let i = 0; i < Math.min(count, 256); i++) {
      ips.push(`${a}.${b}.${c}.${d + i}`);
    }
    return ips;
  }

  private async checkIfExists(tenantId: TenantId, ip: string): Promise<boolean> {
    const query = this.db
      .collection('assets')
      .where('tenantId', '==', tenantId)
      .where('ipAddress', '==', ip)
      .limit(1);

    const snapshot = await query.get();
    return !snapshot.empty;
  }

  private async createDiscoveredAsset(tenantId: TenantId, ip: string, label: string) {
    const hostname = await this.resolveHostname(ip);
    await this.db.collection('assets').add({
      tenantId,
      hostname: hostname || `discovered-${ip}`,
      ipAddress: ip,
      status: 'discovered',
      sourceLabel: label,
      createdAt: new Date(),
    });
  }

  private async resolveHostname(ip: string): Promise<string | null> {
    // Usar librería dns o network tools
    // Por now: retornar null (fallback es IP)
    return null;
  }
}
```

### 3. Ruta API para Discovery

**Archivo**: `src/api/discovery.ts`

```typescript
import express from 'express';
import { checkPermission } from '../middleware/rbacMiddleware';
import { Resource, Action } from '../rbac/permissions';
import { DiscoveryService } from '../services/discoveryService';

const router = express.Router();

router.post('/scans', checkPermission(Resource.Discovery, Action.Execute), async (req, res) => {
  const { cidrRange, label } = req.body;
  
  const service = new DiscoveryService(req.db, req.logger);
  const scan = await service.startScan(req.tenantId, cidrRange, label);
  
  res.json({ scan, message: 'Scan started in background' });
});

router.get('/scans', checkPermission(Resource.Discovery, Action.Read), async (req, res) => {
  const scans = await req.db
    .collection('discovery_scans')
    .where('tenantId', '==', req.tenantId)
    .orderBy('startTime', 'desc')
    .limit(50)
    .get();

  res.json(scans.docs.map(doc => doc.data()));
});

export default router;
```

---

## T1-04: Connectors Framework

### 1. Interfaz de Conector

**Archivo**: `src/connectors/types.ts`

```typescript
export interface ConnectorConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  credentials?: Record<string, any>;
}

export interface SyncResult {
  success: number;
  errors: number;
  skipped: number;
  duration: number; // ms
  timestamp: Date;
}

export interface IConnector {
  config: ConnectorConfig;
  
  // Conectar a fuente externa
  connect(): Promise<void>;
  
  // Desconectar
  disconnect(): Promise<void>;
  
  // Sincronizar datos
  sync(options?: any): Promise<SyncResult>;
  
  // Obtener métricas
  getMetrics(): Promise<Record<string, any>>;
  
  // Tests
  testConnection(): Promise<boolean>;
}
```

### 2. Clase Base Abstracta

**Archivo**: `src/connectors/BaseConnector.ts`

```typescript
import { IConnector, ConnectorConfig, SyncResult } from './types';

export abstract class BaseConnector implements IConnector {
  config: ConnectorConfig;
  private retryAttempts = 3;
  private retryDelayMs = 1000;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Implementado por subclass
  }

  async disconnect(): Promise<void> {
    // Implementado por subclass
  }

  async sync(options?: any): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      await this.connect();
      const result = await this.executeSync(options);
      await this.disconnect();
      
      return {
        ...result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  protected async executeSync(options?: any): Promise<Omit<SyncResult, 'duration' | 'timestamp'>> {
    throw new Error('executeSync must be implemented');
  }

  protected async retryAsync<T>(
    fn: () => Promise<T>,
    label: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === this.retryAttempts) throw error;
        
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`[${label}] Retry attempt ${attempt}/${this.retryAttempts} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  async getMetrics(): Promise<Record<string, any>> {
    return {
      connectorId: this.config.id,
      connectorName: this.config.name,
      status: this.config.enabled ? 'enabled' : 'disabled',
    };
  }

  async testConnection(): Promise<boolean> {
    throw new Error('testConnection must be implemented');
  }
}
```

### 3. Conector Dummy para Testing

**Archivo**: `src/connectors/DummyConnector.ts`

```typescript
import { BaseConnector } from './BaseConnector';

export class DummyConnector extends BaseConnector {
  async testConnection(): Promise<boolean> {
    return true;
  }

  protected async executeSync() {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular work
    return {
      success: 10,
      errors: 0,
      skipped: 0,
    };
  }
}
```

---

## T1-05: Conector Intune Básico

### 1. Instalación

```bash
npm install @azure/identity @microsoft/microsoft-graph-client --save
```

### 2. Conector Intune

**Archivo**: `src/connectors/IntuneConnector.ts`

```typescript
import { BaseConnector } from './BaseConnector';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

export class IntuneConnector extends BaseConnector {
  private client: Client | null = null;

  async testConnection(): Promise<boolean> {
    try {
      const creds = this.config.credentials || {};
      const credential = new ClientSecretCredential(
        creds.tenantId,
        creds.clientId,
        creds.clientSecret
      );
      
      const client = Client.init({
        authProvider: async (done) => {
          const token = await credential.getToken(['https://graph.microsoft.com/.default']);
          done(null, token.token);
        },
      });

      // Test simple: obtener 1 dispositivo
      const devices = await client
        .api('/deviceManagement/managedDevices')
        .top(1)
        .get();

      return !!devices;
    } catch (error) {
      console.error('Intune test failed:', error);
      return false;
    }
  }

  async connect(): Promise<void> {
    const creds = this.config.credentials || {};
    const credential = new ClientSecretCredential(
      creds.tenantId,
      creds.clientId,
      creds.clientSecret
    );

    this.client = Client.init({
      authProvider: async (done) => {
        const token = await credential.getToken(['https://graph.microsoft.com/.default']);
        done(null, token.token);
      },
    });
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }

  protected async executeSync() {
    if (!this.client) throw new Error('Not connected');

    let success = 0;
    let errors = 0;

    try {
      const devices = await this.retryAsync(
        () => this.client!.api('/deviceManagement/managedDevices').get(),
        'Intune fetch devices'
      );

      for (const device of devices.value || []) {
        try {
          // Mapear dispositivo de Intune → Asset
          const mappedAsset = {
            hostname: device.deviceName,
            ipAddress: device.lastModifiedDateTime, // placeholder
            intuneDev iceId: device.id,
            createdAt: new Date(),
          };
          
          // Aquí guardaría en Firestore
          success++;
        } catch (error) {
          errors++;
          console.error(`Failed to sync device ${device.id}:`, error);
        }
      }
    } catch (error) {
      throw new Error(`Intune sync failed: ${error.message}`);
    }

    return { success, errors, skipped: 0 };
  }
}
```

---

## 📝 Testing Template

### Tests RBAC

**Archivo**: `tests/unit/rbac/permissions.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { hasPermission, Role, Resource, Action } from '../../../src/rbac/permissions';

describe('RBAC Permissions', () => {
  it('Owner should have all permissions', () => {
    expect(hasPermission(Role.Owner, Resource.Assets, Action.Delete)).toBe(true);
    expect(hasPermission(Role.Owner, Resource.Settings, Action.Update)).toBe(true);
  });

  it('ReadOnly should only read', () => {
    expect(hasPermission(Role.ReadOnly, Resource.Assets, Action.Read)).toBe(true);
    expect(hasPermission(Role.ReadOnly, Resource.Assets, Action.Create)).toBe(false);
  });
});
```

### Tests Multi-tenant

**Archivo**: `tests/integration/multi-tenant/aislamiento.test.ts`

```typescript
describe('Multi-tenant Aislamiento', () => {
  it('Usuario de Tenant A no puede ver datos de Tenant B', async () => {
    // Crear asset en Tenant B
    // Loguear como usuario de Tenant A
    // Intentar leer asset de Tenant B
    // Debe fallar con 403
  });
});
```

---

## 🔧 Pasos para empezar cada tarea

1. **Crear rama de feature**: `git checkout -b feat/T1-01-multi-tenant`
2. **Implementar criterios de aceptación**
3. **Escribir tests** (primero tests fallan, luego implementar)
4. **Hacer PR** contra `fase2/foundation`
5. **Code review** (2 aprobaciones)
6. **Merge** y **documentar**

---

**Fecha**: 23 de marzo de 2026  
**Actualización**: A medida que el equipo avanze, refinar estos templates
