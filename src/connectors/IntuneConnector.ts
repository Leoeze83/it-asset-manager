/**
 * T1-05: Microsoft Intune Connector
 * Sincroniza dispositivos y licencias desde Microsoft Graph API
 */

import { BaseConnector, SyncResult, ConnectorConfig } from './BaseConnector';
import { TenantId } from '../types/tenant';

export interface IntuneDevice {
  id: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  osVersion: string;
  serialNumber: string;
  imei: string;
  lastModifiedDateTime: string;
}

export interface IntuneTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Conector para Microsoft Intune vía Microsoft Graph API
 * Sincroniza dispositivos inscritos y metadatos
 */
export class IntuneConnector extends BaseConnector {
  private tokenExpiresAt: number = 0;
  private accessToken: string = '';
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0';

  override getName(): string {
    return 'Microsoft Intune';
  }

  /**
   * Conectar usando OAuth2 client credentials flow
   */
  override async connect(): Promise<void> {
    try {
      await this.refreshAccessToken();
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Intune: ${(error as Error).message}`);
    }
  }

  override async disconnect(): Promise<void> {
    this.connected = false;
    this.accessToken = '';
    this.tokenExpiresAt = 0;
  }

  /**
   * Sincronizar dispositivos desde Intune
   */
  override async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      // Obtener dispositivos con retry logic
      const devices = await this.retry(() =>
        this.fetchDevices()
      );

      itemsSynced = devices.length;

      // TODO: Mapear dispositivos a Assets en Firestore
      // for (const device of devices) {
      //   try {
      //     await this.mapAndStoreDevice(device);
      //   } catch (error) {
      //     itemsFailed++;
      //     errors.push((error as Error).message);
      //   }
      // }

      return {
        connectorId: this.getId(),
        status: itemsFailed === 0 ? 'success' : 'partial',
        itemsSynced,
        itemsFailed,
        duration: Date.now() - startTime,
        errors,
        lastSync: new Date(),
      };
    } catch (error) {
      return {
        connectorId: this.getId(),
        status: 'failed',
        itemsSynced,
        itemsFailed: itemsFailed || 1,
        duration: Date.now() - startTime,
        errors: [(error as Error).message],
        lastSync: new Date(),
      };
    }
  }

  override async getMetrics(): Promise<Record<string, any>> {
    return {
      connected: this.isConnected(),
      tokenValid: this.isTokenValid(),
      lastSync: new Date().toISOString(),
      type: 'Intune',
    };
  }

  /**
   * Renovar token de acceso usando OAuth2
   */
  private async refreshAccessToken(): Promise<void> {
    const credentials = this.config.credentials;
    if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.tenantId) {
      throw new Error('Missing Intune credentials');
    }

    const tokenUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      throw new Error(`OAuth2 request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as IntuneTokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  /**
   * Verificar si token sigue siendo válido
   */
  private isTokenValid(): boolean {
    return this.tokenExpiresAt > Date.now() + 60000; // Refresh si expira en < 1 min
  }

  /**
   * Obtener dispositivos desde Microsoft Graph
   */
  private async fetchDevices(): Promise<IntuneDevice[]> {
    if (!this.isTokenValid()) {
      await this.refreshAccessToken();
    }

    const url = `${this.graphApiUrl}/deviceManagement/managedDevices?$select=id,deviceName,manufacturer,model,osVersion,serialNumber,imei,lastModifiedDateTime`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { value: IntuneDevice[] };
    return data.value || [];
  }
}
