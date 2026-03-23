/**
 * T1-04: Connector Framework
 * Interfaz base para implementar conectores a diferentes fuentes
 */

import { TenantId } from '../types/tenant';

export interface SyncResult {
  connectorId: string;
  status: 'success' | 'partial' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  duration: number; // ms
  errors: string[];
  lastSync: Date;
}

export interface ConnectorConfig {
  name: string;
  type: string;
  enabled: boolean;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
}

/**
 * Interfaz que todo conector debe implementar
 */
export interface IConnector {
  getId(): string;
  getName(): string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sync(options?: any): Promise<SyncResult>;
  getMetrics(): Promise<Record<string, any>>;
  isConnected(): boolean;
}

/**
 * Clase base abstracta para conectores
 * Proporciona retry logic, logging, y manejo de errores
 */
export abstract class BaseConnector implements IConnector {
  protected tenantId: TenantId;
  protected config: ConnectorConfig;
  protected connected: boolean = false;
  protected readonly maxRetries: number = 3;
  protected readonly retryDelayMs: number = 1000;

  constructor(tenantId: TenantId, config: ConnectorConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  getId(): string {
    return `${this.config.type}-${this.tenantId}`;
  }

  getName(): string {
    return this.config.name;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Implementar en subclases para conectar a la fuente
   */
  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract sync(options?: any): Promise<SyncResult>;

  abstract getMetrics(): Promise<Record<string, any>>;

  /**
   * Retry logic con exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed after ${retries} retries: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Validar configuración
   */
  protected validateConfig(): void {
    if (!this.config || !this.config.type) {
      throw new Error('Invalid connector configuration');
    }
  }
}

/**
 * Factory para crear conectores
 */
export class ConnectorFactory {
  private static connectors = new Map<string, typeof BaseConnector>();

  static register(type: string, connectorClass: typeof BaseConnector): void {
    this.connectors.set(type, connectorClass);
  }

  static create(
    type: string,
    tenantId: TenantId,
    config: ConnectorConfig
  ): IConnector {
    const ConnectorClass = this.connectors.get(type);
    if (!ConnectorClass) {
      throw new Error(`Unknown connector type: ${type}`);
    }
      return new (ConnectorClass as any)(tenantId, config);
  }
}

/**
 * Conector dummy para testing
 */
export class DummyConnector extends BaseConnector {
  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sync(): Promise<SyncResult> {
    return {
      connectorId: this.getId(),
      status: 'success',
      itemsSynced: 0,
      itemsFailed: 0,
      duration: 100,
      errors: [],
      lastSync: new Date(),
    };
  }

  async getMetrics(): Promise<Record<string, any>> {
    return {
      status: 'connected',
      uptime: 0,
    };
  }
}
