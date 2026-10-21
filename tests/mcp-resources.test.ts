/**
 * TESSERACT-CONTEXT: Pruebas Unitarias de MCP Resources y MCP Prompts
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { MCPServer } from '../src/mcp/server.ts';

test('MCPServer: Expone protocolo completo de Resources (tesseract://health, sarif, topology, cells)', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const server = new MCPServer({ rootDir: root });
  await server.init();

  // 1. resources/list
  const listMsg = { id: 1, method: 'resources/list', params: {} };
  const listRes = await server.handleMessage(listMsg);

  assert.equal(listRes.id, 1);
  assert.ok(Array.isArray(listRes.result.resources));
  const uris = listRes.result.resources.map((r: any) => r.uri);
  assert.ok(uris.includes('octeract://health') || uris.includes('tesseract://health'));
  assert.ok(uris.includes('octeract://sarif') || uris.includes('tesseract://sarif'));
  assert.ok(uris.includes('octeract://topology') || uris.includes('tesseract://topology'));
  assert.ok(uris.includes('octeract://cells') || uris.includes('tesseract://cells'));

  // 2. resources/read tesseract://health
  const readHealthMsg = { id: 2, method: 'resources/read', params: { uri: 'tesseract://health' } };
  const readHealthRes = await server.handleMessage(readHealthMsg);
  assert.equal(readHealthRes.id, 2);
  const healthContent = JSON.parse(readHealthRes.result.contents[0].text);
  assert.equal(typeof healthContent.healthScore, 'number');

  // 3. resources/read tesseract://sarif
  const readSarifMsg = { id: 3, method: 'resources/read', params: { uri: 'tesseract://sarif' } };
  const readSarifRes = await server.handleMessage(readSarifMsg);
  assert.equal(readSarifRes.id, 3);
  const sarifContent = JSON.parse(readSarifRes.result.contents[0].text);
  assert.equal(sarifContent.version, '2.1.0');
});

test('MCPServer: Expone protocolo completo de Prompts (tesseract-safe-refactor y audit-diagnostic)', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const server = new MCPServer({ rootDir: root });
  await server.init();

  // 1. prompts/list
  const listMsg = { id: 10, method: 'prompts/list', params: {} };
  const listRes = await server.handleMessage(listMsg);
  assert.equal(listRes.id, 10);
  assert.ok(Array.isArray(listRes.result.prompts));
  const promptNames = listRes.result.prompts.map((p: any) => p.name);
  assert.ok(promptNames.includes('octeract-safe-refactor') || promptNames.includes('tesseract-safe-refactor'));
  assert.ok(promptNames.includes('octeract-audit-diagnostic') || promptNames.includes('tesseract-audit-diagnostic'));

  // 2. prompts/get tesseract-safe-refactor
  const getPromptMsg = {
    id: 11,
    method: 'prompts/get',
    params: {
      name: 'tesseract-safe-refactor',
      arguments: { targetPath: 'src/core/auditor.ts', goal: 'Optimizar bucle Knip' },
    },
  };
  const getPromptRes = await server.handleMessage(getPromptMsg);
  assert.equal(getPromptRes.id, 11);
  assert.ok(getPromptRes.result.messages[0].content.text.includes('src/core/auditor.ts'));
  assert.ok(getPromptRes.result.messages[0].content.text.includes('tesseract_blast_radius'));
  assert.ok(getPromptRes.result.messages[0].content.text.includes('tesseract_trial_heal'));
  assert.ok(getPromptRes.result.messages[0].content.text.includes('tesseract_safe_write'));
});
