import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnterpriseLicenseManager, type LicensePayload } from '../src/enterprise/license.ts';

test('EnterpriseLicenseManager: Generación de claves Ed25519 y emisión de token legítimo', () => {
  const { publicKey, privateKey } = EnterpriseLicenseManager.generateKeyPair();
  assert.ok(publicKey.includes('BEGIN PUBLIC KEY'));
  assert.ok(privateKey.includes('BEGIN PRIVATE KEY'));

  const payload: LicensePayload = {
    orgName: 'Acme Corp Enterprise',
    tier: 'enterprise',
    maxFiles: -1,
    features: ['swe_ci', 'lsc_monorepo', 'mesh_microservices', 'airgap_audit'],
    issuedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 año
  };

  const token = EnterpriseLicenseManager.issueToken(payload, privateKey);
  assert.ok(token.startsWith('TESS3-ENTERPRISE-'));

  const manager = new EnterpriseLicenseManager(publicKey);
  const result = manager.verifyToken(token);
  assert.equal(result.valid, true);
  assert.equal(result.payload?.orgName, 'Acme Corp Enterprise');
  assert.equal(result.payload?.tier, 'enterprise');
  assert.equal(result.payload?.maxFiles, -1);
});

test('EnterpriseLicenseManager: Rechaza token manipulado o con firma forjada', () => {
  const { publicKey, privateKey } = EnterpriseLicenseManager.generateKeyPair();
  const payload: LicensePayload = {
    orgName: 'Hacker Inc',
    tier: 'enterprise',
    maxFiles: -1,
    features: ['swe_ci', 'lsc_monorepo'],
    issuedAt: Date.now(),
    expiresAt: Date.now() + 100000
  };

  const token = EnterpriseLicenseManager.issueToken(payload, privateKey);
  const parts = token.split('.');
  // Manipular garantizadamente la firma
  const tamperedSig = parts[1][0] === 'X' ? 'Y' + parts[1].slice(1) : 'X' + parts[1].slice(1);
  const tamperedToken = `${parts[0]}.${tamperedSig}`;

  const manager = new EnterpriseLicenseManager(publicKey);
  const result = manager.verifyToken(tamperedToken);
  assert.equal(result.valid, false);
  assert.ok(result.reason?.includes('Firma criptográfica inválida'));
});

test('EnterpriseLicenseManager: Rechaza token expirado', () => {
  const { publicKey, privateKey } = EnterpriseLicenseManager.generateKeyPair();
  const payload: LicensePayload = {
    orgName: 'Expired Corp',
    tier: 'pro',
    maxFiles: 20000,
    features: ['swe_ci'],
    issuedAt: Date.now() - 20000,
    expiresAt: Date.now() - 1000 // Expiró hace 1 segundo
  };

  const token = EnterpriseLicenseManager.issueToken(payload, privateKey);
  const manager = new EnterpriseLicenseManager(publicKey);
  const result = manager.verifyToken(token);
  assert.equal(result.valid, false);
  assert.ok(result.reason?.includes('expirada'));
});

test('EnterpriseLicenseManager: Validación de tiers y control de características (RBAC)', () => {
  const { publicKey, privateKey } = EnterpriseLicenseManager.generateKeyPair();
  const manager = new EnterpriseLicenseManager(publicKey);

  // Por defecto sin licencia: Tier Community
  const defaultStatus = manager.getLicenseStatus();
  assert.equal(defaultStatus.tier, 'community');
  assert.equal(defaultStatus.maxFiles, 2500);

  // Probar assertFeature en Community
  assert.throws(() => {
    manager.assertFeature('mesh_microservices');
  }, /Requiere tier enterprise/);

  // Activar Pro
  const proPayload: LicensePayload = {
    orgName: 'Medium Business Ltd',
    tier: 'pro',
    maxFiles: 20000,
    features: ['swe_ci'],
    issuedAt: Date.now(),
    expiresAt: Date.now() + 10000000
  };
  const proToken = EnterpriseLicenseManager.issueToken(proPayload, privateKey);
  
  const tempDir = path.join(process.cwd(), 'tests', 'temp_license_test');
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const activated = manager.activateLicense(proToken, tempDir);
    assert.equal(activated, true);

    const proStatus = manager.getLicenseStatus(tempDir);
    assert.equal(proStatus.active, true);
    assert.equal(proStatus.tier, 'pro');
    assert.equal(proStatus.maxFiles, 20000);

    // Permitido en Pro
    assert.doesNotThrow(() => {
      manager.assertFeature('swe_ci', tempDir);
      manager.assertFileLimit(15000, tempDir);
    });

    // Bloqueado en Pro por exceder límite de archivos
    assert.throws(() => {
      manager.assertFileLimit(25000, tempDir);
    }, /Límite de archivos excedido/);

    // Bloqueado en Pro (mesh_microservices es solo Enterprise)
    assert.throws(() => {
      manager.assertFeature('mesh_microservices', tempDir);
    }, /Requiere tier enterprise/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
