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
