import test from 'node:test';
import assert from 'node:assert';
import { MCPServer } from '../src/mcp/server.ts';

test('MCPServer: Protocolo JSON-RPC 2.0 y Herramientas 4D', async () => {
  const server = new MCPServer({ rootDir: '.' });
  await server.init();

  // 1. Prueba de initialize
  const initRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  });

  assert.strictEqual(initRes.id, 1);
  assert.ok(initRes.result.serverInfo.name === 'octeract-context' || initRes.result.serverInfo.name === 'tesseract-context');
  assert.ok(initRes.result.capabilities.tools);

  // 2. Prueba de tools/list
  const toolsRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  });

  assert.strictEqual(toolsRes.id, 2);
  const toolNames = toolsRes.result.tools.map((t: any) => t.name);
  assert.ok(toolNames.includes('tesseract_slice'));
  assert.ok(toolNames.includes('tesseract_project_shadow'));
  assert.ok(toolNames.includes('tesseract_rotate'));
  assert.ok(toolNames.includes('tesseract_traverse_hamming'));
  assert.ok(toolNames.includes('tesseract_fractal_zoom'));
  assert.ok(toolNames.includes('tesseract_hyper_stats'));
  assert.ok(toolNames.includes('tesseract_trial_heal'));
  assert.ok(toolNames.includes('tesseract_auto_heal'));
  assert.ok(toolNames.includes('tesseract_blast_radius'));

  // 3. Prueba de tools/call: tesseract_hyper_stats
  const statsRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'tesseract_hyper_stats',
      arguments: {},
    },
  });

  assert.strictEqual(statsRes.id, 3);
  assert.ok(statsRes.result.content[0].text);
  const parsedStats = JSON.parse(statsRes.result.content[0].text);
  assert.ok('totalVertices' in parsedStats);
  assert.ok('healthStatus' in parsedStats);

  // 4. Prueba de tools/call: tesseract_project_shadow
  const shadowRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'tesseract_project_shadow',
      arguments: {
        targetPath: 'src/core/types.ts',
        proposedContent: 'export const hello = "world";',
      },
    },
  });

  assert.strictEqual(shadowRes.id, 4);
  const shadowData = JSON.parse(shadowRes.result.content[0].text);
  assert.ok('shearDistance' in shadowData);
  assert.ok('isSafe' in shadowData);

  // 5. Prueba de tools/call: tesseract_trial_heal
  const trialRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'tesseract_trial_heal',
      arguments: {
        targetPath: 'src/core/types.ts',
        proposedContent: 'export interface DummyInterface { id: string; }',
      },
    },
  });

  assert.strictEqual(trialRes.id, 5);
  const trialData = JSON.parse(trialRes.result.content[0].text);
  assert.ok('trialStatus' in trialData);
  assert.ok('rollbackExecuted' in trialData);
  assert.ok('richDossierForAI' in trialData);
});

test('MCPServer: Herramientas de la Suite Voynich & Código EVA', async () => {
  const server = new MCPServer({ rootDir: '.' });
  await server.init();

  // 1. octeract_eva_ast
  const evaRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: {
      name: 'octeract_eva_ast',
      arguments: { targetPath: 'src/voynich/eva-ast.ts' },
    },
  });
  assert.strictEqual(evaRes.id, 10);
  const evaData = JSON.parse(evaRes.result.content[0].text);
  assert.ok(evaData.totalDeclarations > 0);
  assert.ok(evaData.tokenReductionPercent > 50);

  // 2. octeract_montemurro_cluster
  const mmRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/call',
    params: {
      name: 'octeract_montemurro_cluster',
      arguments: { clusterCount: 3 },
    },
  });
  assert.strictEqual(mmRes.id, 11);
  const mmData = JSON.parse(mmRes.result.content[0].text);
  assert.ok(mmData.totalFilesAnalyzed > 0);
  assert.ok(mmData.clusters.length > 0);

  // 3. octeract_slot_machine_validate
  const slotRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 12,
    method: 'tools/call',
    params: {
      name: 'octeract_slot_machine_validate',
      arguments: { statement: 'public async executeTask(id: string): Promise<boolean>' },
    },
  });
  assert.strictEqual(slotRes.id, 12);
  const slotData = JSON.parse(slotRes.result.content[0].text);
  assert.strictEqual(slotData.valid, true);
  assert.strictEqual(slotData.identifier, 'executeTask');

  // 4. octeract_currier_classify
  const currierRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 13,
    method: 'tools/call',
    params: {
      name: 'octeract_currier_classify',
      arguments: { targetPath: 'src/voynich/currier.ts' },
    },
  });
  assert.strictEqual(currierRes.id, 13);
  const currierData = JSON.parse(currierRes.result.content[0].text);
  assert.ok(currierData.dialect);

  // 5. octeract_entropy_h2
  const entropyRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 14,
    method: 'tools/call',
    params: {
      name: 'octeract_entropy_h2',
      arguments: { targetPath: 'src/voynich/entropy-guard.ts' },
    },
  });
  assert.strictEqual(entropyRes.id, 14);
  const entropyData = JSON.parse(entropyRes.result.content[0].text);
  assert.strictEqual(entropyData.isSafe, true);
  assert.strictEqual(entropyData.verdict, 'HEALTHY');

  // 6. octeract_cardan_fuzz
  const cardanRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 15,
    method: 'tools/call',
    params: {
      name: 'octeract_cardan_fuzz',
      arguments: { targetPath: 'src/voynich/cardan-grille.ts', maxMutants: 5 },
    },
  });
  assert.strictEqual(cardanRes.id, 15);
  const cardanData = JSON.parse(cardanRes.result.content[0].text);
  assert.ok(cardanData.totalMutantsGenerated > 0);
});
