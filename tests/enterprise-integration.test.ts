import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MCPServer } from '../src/mcp/server.ts';

test('EnterpriseIntegration: Herramientas MCP expuestas y ejecutables', async () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_integration_mcp');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const server = new MCPServer({ rootDir: tempDir });

    // 1. Herramienta tesseract_license_info
    const licenseInfo = await server.callTool('tesseract_license_info', {});
    assert.equal(licenseInfo.tier, 'community');
    assert.equal(licenseInfo.maxFiles, 2500);

    // 2. Herramienta tesseract_swe_ci_verify
    const sweResult = await server.callTool('tesseract_swe_ci_verify', {
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.03
    });
    assert.equal(sweResult.approved, true);

    // 3. Herramienta tesseract_mesh_audit
    const meshResult = await server.callTool('tesseract_mesh_audit', {});
    assert.equal(meshResult.score, 100);
    assert.equal(meshResult.fractures.length, 0);

    // 4. Herramienta tesseract_lsc_rewrite
    const pkgDir = path.join(tempDir, 'packages', 'core');
    fs.mkdirSync(pkgDir, { recursive: true });
    const utilFile = path.join(pkgDir, 'util.ts');
    fs.writeFileSync(utilFile, 'export function oldFunc() { return 42; }', 'utf-8');

    const lscResult = await server.callTool('tesseract_lsc_rewrite', {
      sourceFile: path.join('packages', 'core', 'util.ts'),
      oldSymbol: 'oldFunc',
      newSymbol: 'modernFunc',
      dryRun: false
    });
    assert.equal(lscResult.execution.success, true);
    assert.equal(lscResult.semanticVerification.preserved, true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
