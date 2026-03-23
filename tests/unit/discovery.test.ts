/**
 * Tests para T1-03: Discovery Service
 * Validar conversión CIDR y deduplicación
 */

import {
  cidrToIpRange,
  deduplicateAssets,
  type DiscoveredAsset,
} from '../src/services/discoveryService';

describe('T1-03: Discovery Service', () => {
  describe('CIDR to IP Range', () => {
    it('should convert /24 CIDR', () => {
      const range = cidrToIpRange('192.168.1.0/24');
      expect(range.start).toBe('192.168.1.1');
      expect(range.end).toBe('192.168.1.254');
    });

    it('should convert /25 CIDR', () => {
      const range = cidrToIpRange('10.0.0.0/25');
      expect(range.start).toBe('10.0.0.1');
      expect(range.end).toBe('10.0.0.126');
    });

    it('should throw on invalid CIDR', () => {
      expect(() => cidrToIpRange('192.168.1.0')).toThrow('Invalid CIDR format');
      expect(() => cidrToIpRange('192.168.1.0/33')).toThrow('Invalid CIDR mask');
      expect(() => cidrToIpRange('999.999.999.999/24')).toThrow('Invalid IP');
    });
  });

  describe('Asset Deduplication', () => {
    it('should deduplicate by IP address', () => {
      const assets: DiscoveredAsset[] = [
        {
          ipAddress: '192.168.1.10',
          hostname: 'laptop-old',
          macAddress: 'AA:BB:CC:DD:EE:FF',
          responseTime: 100,
          lastSeen: new Date('2024-01-01'),
        },
        {
          ipAddress: '192.168.1.10',
          hostname: 'laptop-new',
          macAddress: 'AA:BB:CC:DD:EE:FF',
          responseTime: 50,
          lastSeen: new Date('2024-01-02'),
        },
      ];

      const deduped = deduplicateAssets(assets);
      expect(deduped.length).toBe(1);
      expect(deduped[0].hostname).toBe('laptop-new'); // Más reciente
    });

    it('should keep unique IPs', () => {
      const assets: DiscoveredAsset[] = [
        {
          ipAddress: '192.168.1.10',
          responseTime: 100,
          lastSeen: new Date('2024-01-01'),
        },
        {
          ipAddress: '192.168.1.11',
          responseTime: 100,
          lastSeen: new Date('2024-01-01'),
        },
        {
          ipAddress: '192.168.1.12',
          responseTime: 100,
          lastSeen: new Date('2024-01-01'),
        },
      ];

      const deduped = deduplicateAssets(assets);
      expect(deduped.length).toBe(3);
    });
  });
});
