import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  OcteractDoctor,
  OcteractSee,
  OcteractImpact,
  OcteractSafeWrite,
  OcteractAsk,
} from '../src/unified/index.ts';
import { MCPServer } from '../src/mcp/server.ts';

test('OcteractDoctor: diagnoses codebase health, dragons, biomes and recommendations', async () => {
  const report = await OcteractDoctor.diagnose(process.cwd());

  assert.ok(typeof report.healthScore === 'number');
  assert.ok(report.healthScore >= 0 && report.healthScore <= 100);
  assert.ok(['PRISTINE', 'STABLE', 'DEGRADED', 'CRITICAL_COLLAPSE'].includes(report.verdict));
  assert.ok(report.totalFiles > 0);
  assert.ok(Array.isArray(report.fractures));
  assert.ok(Array.isArray(report.boundaryLeaks));
  assert.ok(Array.isArray(report.dominantBiomes));
  assert.ok(report.dominantBiomes.length > 0);
  assert.ok(Array.isArray(report.topRecommendations));
  assert.ok(report.topRecommendations.length > 0);
  assert.ok(typeof report.summaryMarkdown === 'string');
  assert.ok(report.summaryMarkdown.includes('Octeract Doctor Report'));
});

test('OcteractSee: origami folding and selective unfolding with high token savings', async () => {
  const targetFile = 'src/dragon/dragonFold.ts';
  const result = await OcteractSee.inspect(targetFile, {
    symbol: 'foldCode',
    mode: 'origami',
  });

  assert.strictEqual(result.filePath.replace(/\\/g, '/'), 'src/dragon/dragonFold.ts');
  assert.strictEqual(result.mode, 'origami');
  assert.strictEqual(result.symbol, 'foldCode');
  assert.ok(result.originalTokensApprox > 0);
  assert.ok(result.compressedTokensApprox > 0);
  assert.ok(result.compressionSavingsPercent >= 0);
  assert.ok(result.content.includes('OcteractDragonFold'));
  assert.ok(result.content.includes('foldCode'));

  // Skeleton mode
  const skelResult = await OcteractSee.inspect(targetFile, { mode: 'skeleton' });
  assert.strictEqual(skelResult.mode, 'skeleton');
  assert.ok(skelResult.compressionSavingsPercent > 30);
});

test('OcteractImpact: Heighway dragon shockwave and 4D ripple effect cascade', async () => {
  const targetFile = 'src/dragon/dragonFold.ts';
  const report = await OcteractImpact.analyze(targetFile, {
    symbol: 'foldCode',
    maxHops: 5,
  });

  assert.ok(report.epicenter.file.includes('dragonFold.ts'));
  assert.ok(report.impactScore >= 0 && report.impactScore <= 100);
  assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CATASTROPHIC'].includes(report.riskLevel));
  assert.ok(typeof report.totalAffectedNodes === 'number');
  assert.ok(Array.isArray(report.tier1DirectDependents));
  assert.ok(Array.isArray(report.safeRefactorOrder));
  assert.ok(report.safeRefactorOrder.length > 0);
  assert.ok(report.summaryMarkdown.includes('Octeract Impact Report'));
});

test('OcteractSafeWrite: blocks destructive truncated code and allows safe changes', async () => {
  const testFile = 'tests/tmp_safe_write_trial.ts';

  try {
    // 1. Destructive truncated AI change should be blocked
    const blockedRes = await OcteractSafeWrite.write(
      testFile,
      '// ... rest of code here\nexport function broken() {}'
    );
    assert.strictEqual(blockedRes.status, 'BLOCKED_BY_4D_SHIELD');
    assert.ok(blockedRes.shearDistance > 0);

    // 2. Clean, safe code should succeed
    const safeRes = await OcteractSafeWrite.write(
      testFile,
      'export function safeUtility(x: number): number {\n  return x * 2;\n}\n'
    );
    assert.strictEqual(safeRes.status, 'WRITTEN_SAFELY');
    assert.ok(fs.existsSync(testFile));
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
});

test('OcteractAsk: answers natural language question with causal tracing and line locations', async () => {
  const result = await OcteractAsk.query('¿Donde se implementa el plegado de tokens origami?');

  assert.ok(result.query.includes('origami'));
  assert.ok(typeof result.answer === 'string');
  assert.ok(result.answer.length > 0);
  assert.ok(Array.isArray(result.relevantFiles));
  assert.ok(Array.isArray(result.keySymbols));
});

test('MCPServer: profile switching (essential vs full) and backwards-compatible callTool', async () => {
  const server = new MCPServer({ rootDir: process.cwd(), profile: 'essential' });
  await server.init();

  // 1. In essential mode, tools/list returns only ~14 tools (7 master + 7 aliases)
  const essentialTools = (server as any).getToolDefinitions();
  assert.ok(essentialTools.length < 25);
  const toolNames = essentialTools.map((t: any) => t.name);
  assert.ok(toolNames.includes('octeract_doctor'));
  assert.ok(toolNames.includes('octeract_see'));
  assert.ok(toolNames.includes('octeract_impact'));
  assert.ok(toolNames.includes('octeract_safe_write'));
  assert.ok(toolNames.includes('octeract_ask'));
  assert.ok(toolNames.includes('octeract_switch_profile'));

  // 2. Profile status
  const statusRes = await server.callTool('octeract_profile_status', {});
  assert.strictEqual(statusRes.status, 'SUCCESS');
  assert.strictEqual(statusRes.isEssential, true);
  assert.strictEqual(statusRes.profile, 'essential');

  // 3. Master tool call: octeract_doctor
  const doctorRes = await server.callTool('octeract_doctor', {});
  assert.ok(doctorRes.healthScore >= 0);
  assert.ok(doctorRes.totalFiles > 0);

  // 4. Backward compatibility: Calling specialized tool directly in essential profile works!
  const coordsRes = await server.callTool('octeract_dragon_coords', {
    targetPath: 'src/index.ts',
  });
  assert.ok(coordsRes.dragonCoordinate.hash);

  // 5. Switch profile to full
  const switchRes = await server.callTool('octeract_switch_profile', { profile: 'full' });
  assert.strictEqual(switchRes.status, 'SUCCESS');
  assert.strictEqual(switchRes.profile, 'full');

  const fullTools = (server as any).getToolDefinitions();
  assert.ok(fullTools.length > 100);
});
