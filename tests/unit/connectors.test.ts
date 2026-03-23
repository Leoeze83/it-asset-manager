/**
 * Tests para T1-04: Connector Framework
 * Validar patrón Factory y DummyConnector
 */

import {
  ConnectorFactory,
  DummyConnector,
  type ConnectorConfig,
} from '../src/connectors/BaseConnector';
import { createTenantId } from '../src/types/tenant';

describe('T1-04: Connector Framework', () => {
  const tenantId = createTenantId('test-tenant');
  const config: ConnectorConfig = {
    name: 'Test Connector',
    type: 'dummy',
    enabled: true,
  };

  it('should register and create connectors', () => {
    ConnectorFactory.register('dummy', DummyConnector);

    const connector = ConnectorFactory.create('dummy', tenantId, config);
    expect(connector).toBeInstanceOf(DummyConnector);
    expect(connector.getId()).toContain('test-tenant');
  });

  it('should throw on unknown connector type', () => {
    expect(() =>
      ConnectorFactory.create('unknown', tenantId, config)
    ).toThrow('Unknown connector type');
  });

  it('should connect and disconnect', async () => {
    const connector = new DummyConnector(tenantId, config);
    expect(connector.isConnected()).toBe(false);

    await connector.connect();
    expect(connector.isConnected()).toBe(true);

    await connector.disconnect();
    expect(connector.isConnected()).toBe(false);
  });

  it('should sync and return result', async () => {
    const connector = new DummyConnector(tenantId, config);
    await connector.connect();

    const result = await connector.sync();
    expect(result.status).toBe('success');
    expect(result.connectorId).toContain('dummy');
    expect(result.itemsSynced).toBeGreaterThanOrEqual(0);
  });

  it('should provide metrics', async () => {
    const connector = new DummyConnector(tenantId, config);
    const metrics = await connector.getMetrics();
    expect(metrics).toHaveProperty('status');
  });
});
