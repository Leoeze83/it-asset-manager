/**
 * T1-03: Network Discovery Service
 * Scanner de red sin agente usando CIDR ranges
 */

import { TenantId } from '../types/tenant';

export interface DiscoveryService {
  startScan(tenantId: TenantId, cidrRange: string): Promise<string>;
  getStatus(scanId: string): Promise<ScanStatus>;
  stopScan(scanId: string): Promise<void>;
}

export interface ScanStatus {
  scanId: string;
  tenantId: TenantId;
  cidrRange: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  discoveredAssets: DiscoveredAsset[];
  progress: {
    scanned: number;
    total: number;
    percentage: number;
  };
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface DiscoveredAsset {
  ipAddress: string;
  hostname?: string;
  macAddress?: string;
  vendor?: string;
  osType?: string;
  responseTime: number;
  lastSeen: Date;
}

/**
 * Convierte CIDR a rango de IPs
 * Ejemplo: "192.168.1.0/24" → [192.168.1.1 - 192.168.1.254]
 */
export function cidrToIpRange(cidr: string): { start: string; end: string } {
  const [ip, maskStr] = cidr.split('/');
  if (!ip || !maskStr) {
    throw new Error('Invalid CIDR format');
  }

  const mask = parseInt(maskStr, 10);
  if (mask < 0 || mask > 32) {
    throw new Error('Invalid CIDR mask');
  }

  const ipParts = ip.split('.').map(Number);
  if (ipParts.length !== 4 || ipParts.some(p => p < 0 || p > 255)) {
    throw new Error('Invalid IP address');
  }

  // Convertir IP a número
  const ipNum =
    (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

  // Calcular rango
  const hostBits = 32 - mask;
  const hostMask = (1 << hostBits) - 1;
  const networkNum = ipNum & ~hostMask;
  const broadcastNum = networkNum | hostMask;

  const start = networkNum + 1; // Excluir network address
  const end = broadcastNum - 1; // Excluir broadcast address

  const numToIp = (num: number) => {
    return [
      (num >> 24) & 0xff,
      (num >> 16) & 0xff,
      (num >> 8) & 0xff,
      num & 0xff,
    ].join('.');
  };

  return {
    start: numToIp(start),
    end: numToIp(end),
  };
}

/**
 * Deduplicar assets descubiertos por mismo IP
 */
export function deduplicateAssets(
  assets: DiscoveredAsset[]
): DiscoveredAsset[] {
  const seen = new Map<string, DiscoveredAsset>();

  for (const asset of assets) {
    const key = asset.ipAddress;
    const existing = seen.get(key);

    if (!existing || asset.lastSeen > existing.lastSeen) {
      seen.set(key, asset);
    }
  }

  return Array.from(seen.values());
}
