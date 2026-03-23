import assert from "node:assert/strict";
import test from "node:test";

import {
  hashSecret,
  validateHeartbeatPayload,
  validateRegisterAgentPayload,
} from "../server.ts";

test("hashSecret is deterministic and non-plain-text", () => {
  const secret = "super-secret-value";
  const hashed = hashSecret(secret);

  assert.equal(hashed, hashSecret(secret));
  assert.notEqual(hashed, secret);
  assert.equal(hashed.length, 64);
});

test("validateRegisterAgentPayload normalizes a valid agent registration", () => {
  const payload = validateRegisterAgentPayload({
    hostname: "DESKTOP-01",
    os: "Windows 11 Pro",
    serialNumber: "ABC-123",
    type: "Desktop",
    specs: "CPU: Ryzen 7; RAM: 32 GB",
    agentVersion: "2.0.0",
  });

  assert.equal(payload.hostname, "DESKTOP-01");
  assert.equal(payload.type, "Desktop");
  assert.equal(payload.serialNumber, "ABC-123");
});

test("validateRegisterAgentPayload rejects oversized or missing fields", () => {
  assert.throws(
    () => validateRegisterAgentPayload({ hostname: "", serialNumber: "ABC-123" }),
    /hostname is required/,
  );

  assert.throws(
    () =>
      validateRegisterAgentPayload({
        hostname: "ok",
        serialNumber: "x".repeat(65),
      }),
    /serialNumber exceeds 64 characters/,
  );
});

test("validateHeartbeatPayload accepts bounded telemetry only", () => {
  const payload = validateHeartbeatPayload({
    id: "asset-1",
    cpu: 45.5,
    ram: 70,
    disk: 88.12,
  });

  assert.equal(payload.id, "asset-1");
  assert.equal(payload.cpu, 45.5);
  assert.equal(payload.ram, 70);
  assert.equal(payload.disk, 88.12);
});

test("validateHeartbeatPayload rejects out-of-range telemetry", () => {
  assert.throws(
    () => validateHeartbeatPayload({ id: "asset-1", cpu: 120 }),
    /cpu must be a number between 0 and 100/,
  );
});
