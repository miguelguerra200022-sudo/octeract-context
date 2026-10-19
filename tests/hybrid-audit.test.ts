import { test } from 'node:test';
import * as assert from 'node:assert';
import { TopologicalAuditor } from '../src/core/auditor.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { MCPServer } from '../src/mcp/server.ts';
import { CubicCell } from '../src/core/types.ts';

test('TopologicalAuditor: Generación de Triage Híbrido Teseracto + IA', () => {
  const space = new HypercubeSpace();

  // Vértice A con import roto
  space.addVertex({
    id: 'src/brokenModule.ts',
    path: 'src/brokenModule.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.2, 0.3, 0.4],
    hexCode: '0x1234',
    tokenEstimate: 200,
    lines: 30,
    dependencies: ['./missingService'],
    dependents: ['src/callerA.ts', 'src/callerB.ts'],
    symbols: [{ name: 'doWork', kind: 'function', lineStart: 5, lineEnd: 15, dependencies: [] }],
  });

  // Vértice B como Chokepoint central (muchos dependientes)
  space.addVertex({
    id: 'src/coreHub.ts',
    path: 'src/coreHub.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    hexCode: '0x5555',
    tokenEstimate: 500,
    lines: 120,
    dependencies: [],
    dependents: ['dep1', 'dep2', 'dep3', 'dep4', 'dep5', 'dep6', 'dep7'],
    symbols: [{ name: 'hubCore', kind: 'class', lineStart: 1, lineEnd: 100, dependencies: [] }],
  });

  const auditor = new TopologicalAuditor();
  const triage = auditor.getHybridAuditTriage(space);

  assert.ok(triage.triageItems.length > 0, 'Debe generar items en el triage');
  assert.ok(triage.compactPromptForAI.includes('TRIAGE DE AUDITORÍA NEURONAL ASISTIDA'), 'Debe generar el prompt para IA');
  assert.ok(triage.tokenCostEstimate <= 800, 'El triage debe costar <= 800 tokens');
  assert.ok(triage.triageItems.some(it => it.category === 'STRUCTURAL_FRACTURE'), 'Debe detectar la fractura estructural');
});

test('MCPServer: Herramientas tesseract_trace_flow y tesseract_hybrid_audit', async () => {
  const server = new MCPServer({ rootDir: '.' });
  await server.init();

  // 1. Invocar tesseract_trace_flow
  const flowResult = await server.callTool('tesseract_trace_flow', {
    query: 'como auditar y verificar fracturas en el hipercubo',
  });
  assert.ok(flowResult, 'Debe retornar resultado');
  assert.ok(flowResult.asciiDiagram, 'Debe incluir diagrama');
  assert.ok(flowResult.estimatedTokens < 700, 'Debe ser token-eficiente');

  // 2. Invocar tesseract_hybrid_audit
  const auditResult = await server.callTool('tesseract_hybrid_audit', { detail: false });
  assert.ok(auditResult, 'Debe retornar triage');
  assert.strictEqual(auditResult.status, 'TRIAGE_READY_FOR_AI');
  assert.ok(auditResult.aiSemanticPrompt.length > 0, 'Debe incluir prompt semántico');
});
