/**
 * TESSERACT-CONTEXT: Pruebas Unitarias del Auditor Topológico Determinista sin IA (0 Tokens)
 * y de la Protección de 5 Capas contra el Bucle Infinito de Refactorización (Hydra Bug Loop)
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { TopologicalAuditor } from '../src/core/auditor.ts';
import { ShadowEngine } from '../src/core/shadow.ts';
import { BlastRadiusCalculator } from '../src/core/blast.ts';
import { MCPServer } from '../src/mcp/server.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

test('TopologicalAuditor: Detección de BROKEN_IMPORT determinista', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  const fileA: HyperVertex = {
    id: 'src/services/orderService.ts',
    hexCode: '0x1000',
    path: 'src/services/orderService.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.3, 0.4, 0.1],
    lines: 40,
    sizeBytes: 1200,
    tokenEstimate: 300,
    symbols: [
      {
        name: 'OrderService',
        kind: 'class',
        lineStart: 5,
        lineEnd: 35,
        dependencies: ['nonExistentPaymentGateway'],
      },
      {
        name: 'nonExistentPaymentGateway',
        kind: 'import',
        lineStart: 1,
        lineEnd: 1,
        dependencies: ['./nonExistentPaymentGateway'],
      },
    ],
    dependencies: ['src/services/nonExistentPaymentGateway.ts'],
    dependents: [],
    inDegree: 0,
    outDegree: 1,
    lastModified: Date.now(),
  };

  space.addVertex(fileA);

  const report = auditor.audit(space);
  assert.equal(report.fracturesByType.BROKEN_IMPORT, 1);
  assert.equal(report.fractures[0].type, 'BROKEN_IMPORT');
  assert.equal(report.fractures[0].source, 'src/services/orderService.ts');
  assert.ok(report.healthScore < 100);
});

test('TopologicalAuditor: Detección de CONTRACT_MISMATCH con sugerencia fuzzy de autocuración', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  // Módulo destino que exporta 'getUserProfile'
  const userModule: HyperVertex = {
    id: 'src/auth/user.ts',
    hexCode: '0x2000',
    path: 'src/auth/user.ts',
    cell: CubicCell.Security,
    coordinate: [0.1, 0.2, 0.8, 0.3],
    lines: 60,
    sizeBytes: 1500,
    tokenEstimate: 400,
    symbols: [
      {
        name: 'getUserProfile',
        kind: 'function',
        lineStart: 10,
        lineEnd: 25,
        dependencies: [],
      },
    ],
    dependencies: [],
    dependents: ['src/auth/authService.ts'],
    inDegree: 1,
    outDegree: 0,
    lastModified: Date.now(),
  };

  // Módulo llamador que intenta importar 'getUserProfileData' (desfase de contrato)
  const authService: HyperVertex = {
    id: 'src/auth/authService.ts',
    hexCode: '0x2100',
    path: 'src/auth/authService.ts',
    cell: CubicCell.Security,
    coordinate: [0.2, 0.3, 0.7, 0.2],
    lines: 50,
    sizeBytes: 1300,
    tokenEstimate: 350,
    symbols: [
      {
        name: 'getUserProfileData',
        kind: 'import',
        lineStart: 2,
        lineEnd: 2,
        dependencies: ['./user'],
      },
    ],
    dependencies: ['src/auth/user.ts'],
    dependents: [],
    inDegree: 0,
    outDegree: 1,
    lastModified: Date.now(),
  };

  space.addVertex(userModule);
  space.addVertex(authService);

  const report = auditor.audit(space);
  const mismatch = report.fractures.find((f) => f.type === 'CONTRACT_MISMATCH');
  assert.ok(mismatch, 'Debe detectar CONTRACT_MISMATCH');
  assert.equal(mismatch.missingSymbol, 'getUserProfileData');
  assert.equal(mismatch.similarCandidate, 'getUserProfile');
  assert.ok(mismatch.healingStrategy.includes('getUserProfile'));
});

test('TopologicalAuditor: Detección de CIRCULAR_DEPENDENCY en R^4', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  const nodeA: HyperVertex = {
    id: 'src/core/nodeA.ts',
    hexCode: '0x3000',
    path: 'src/core/nodeA.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [],
    dependencies: ['src/core/nodeB.ts'],
    dependents: ['src/core/nodeB.ts'],
    inDegree: 1,
    outDegree: 1,
    lastModified: Date.now(),
  };

  const nodeB: HyperVertex = {
    id: 'src/core/nodeB.ts',
    hexCode: '0x3100',
    path: 'src/core/nodeB.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.5, 0.6, 0.5, 0.5],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [],
    dependencies: ['src/core/nodeA.ts'],
    dependents: ['src/core/nodeA.ts'],
    inDegree: 1,
    outDegree: 1,
    lastModified: Date.now(),
  };

  space.addVertex(nodeA);
  space.addVertex(nodeB);

  const report = auditor.audit(space);
  assert.ok(report.fracturesByType.CIRCULAR_DEPENDENCY >= 1);
  const cycle = report.fractures.find((f) => f.type === 'CIRCULAR_DEPENDENCY');
  assert.ok(cycle);
  assert.ok(cycle.cyclePath && cycle.cyclePath.length >= 2);
});

test('ShadowEngine: 5-Layer Protection (Circuit Breaker, MicroSlice y Entropía)', () => {
  const space = new HypercubeSpace();

  const providerVertex: HyperVertex = {
    id: 'src/api/dataProvider.ts',
    hexCode: '0x4000',
    path: 'src/api/dataProvider.ts',
    cell: CubicCell.Storage,
    coordinate: [0.4, 0.4, 0.9, 0.2],
    lines: 80,
    sizeBytes: 2400,
    tokenEstimate: 600,
    symbols: [
      { name: 'fetchRecord', kind: 'function', lineStart: 10, lineEnd: 25, dependencies: [] },
      { name: 'storeRecord', kind: 'function', lineStart: 28, lineEnd: 45, dependencies: [] },
    ],
    dependencies: [],
    dependents: ['src/api/consumer1.ts', 'src/api/consumer2.ts'],
    inDegree: 2,
    outDegree: 0,
    lastModified: Date.now(),
  };

  space.addVertex(providerVertex);
  const shadow = new ShadowEngine(space);

  // 1. Prueba de Micro-Slice (< 800 tokens)
  const microSlice = shadow.generateCallSiteMicroSlice('src/api/dataProvider.ts');
  assert.ok(microSlice.includes('fetchRecord'));
  assert.ok(microSlice.includes('storeRecord'));
  assert.ok(microSlice.includes('src/api/consumer1.ts'));
  assert.ok(microSlice.includes('REGLA DE NO-REGRESIÓN'));

  // 2. Prueba de Reducción Estricta de Entropía (Eliminar fetchRecord genera aristas rotas)
  const badProposedCode = `export class DataProvider { storeRecord() { return true; } }`;
  const entropyResult = shadow.evaluateEntropy('src/api/dataProvider.ts', badProposedCode, 0);
  assert.equal(entropyResult.allowed, false);
  assert.ok(entropyResult.reason?.includes('Violación de Entropía'));

  // 3. Prueba de Circuit Breaker (Máximo 2 intentos fallidos)
  assert.equal(shadow.isCircuitBreakerTripped('src/api/dataProvider.ts'), false);
  shadow.recordFailedAttempt('src/api/dataProvider.ts');
  assert.equal(shadow.isCircuitBreakerTripped('src/api/dataProvider.ts'), false);
  shadow.recordFailedAttempt('src/api/dataProvider.ts');
  assert.equal(shadow.isCircuitBreakerTripped('src/api/dataProvider.ts'), true);

  // Reset del interruptor
  shadow.resetAttempts('src/api/dataProvider.ts');
  assert.equal(shadow.isCircuitBreakerTripped('src/api/dataProvider.ts'), false);
});

test('MCPServer: Herramientas tesseract_audit_health y tesseract_diagnose_fracture', async () => {
  const server = new MCPServer({ rootDir: process.cwd() });
  await server.init();

  // 1. Invocar tesseract_audit_health
  const auditRes = await server.callTool('tesseract_audit_health', { detail: false });
  assert.ok(typeof auditRes.healthScore === 'number');
  assert.ok(typeof auditRes.totalFractures === 'number');
  assert.ok(auditRes.zeroTokenNote.includes('Cero tokens consumidos'));

  // 2. Invocar tesseract_diagnose_fracture
  const diagRes = await server.callTool('tesseract_diagnose_fracture', { type: 'BROKEN_IMPORT' });
  assert.ok(diagRes.status === 'NO_FRACTURE_FOUND' || Array.isArray(diagRes.evidence));
  if (Array.isArray(diagRes.evidence)) {
    assert.ok(diagRes.tokenEconomy.includes('< 600 tokens'));
  }
});

test('TopologicalAuditor: Detección de TOPOLOGICAL_SINK (Callejón sin salida en celda activa)', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  // Módulo en celda Storage con inDegree = 2 pero outDegree = 0 (sumidero ciego)
  const sinkVertex: HyperVertex = {
    id: 'src/storage/blackHoleSink.ts',
    hexCode: '0x5000',
    path: 'src/storage/blackHoleSink.ts',
    cell: CubicCell.Storage,
    coordinate: [0.3, 0.4, 0.8, 0.2],
    lines: 40,
    sizeBytes: 1200,
    tokenEstimate: 300,
    symbols: [
      {
        name: 'saveConfig',
        kind: 'function',
        lineStart: 5,
        lineEnd: 15,
        dependencies: [],
      },
    ],
    dependencies: [],
    dependents: ['src/workbench/settings.ts', 'src/workbench/editor.ts'],
    inDegree: 2,
    outDegree: 0,
    lastModified: Date.now(),
  };

  space.addVertex(sinkVertex);

  const report = auditor.audit(space);
  assert.ok(report.fracturesByType.TOPOLOGICAL_SINK >= 1);
  const sinkFracture = report.fractures.find((f) => f.type === 'TOPOLOGICAL_SINK');
  assert.ok(sinkFracture);
  assert.equal(sinkFracture.source, 'src/storage/blackHoleSink.ts');
  assert.ok(sinkFracture.description.includes('Topological Sink'));
});

test('TopologicalAuditor: Detección de UNREACHABLE_ISLAND (Subgrafo desconectado de raíces)', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  // Punto de entrada raíz
  const mainVertex: HyperVertex = {
    id: 'src/main.ts',
    hexCode: '0x0001',
    path: 'src/main.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.1, 0.5, 0.1],
    lines: 20,
    sizeBytes: 500,
    tokenEstimate: 120,
    symbols: [],
    dependencies: ['src/app.ts'],
    dependents: [],
    inDegree: 0,
    outDegree: 1,
    lastModified: Date.now(),
  };

  const appVertex: HyperVertex = {
    id: 'src/app.ts',
    hexCode: '0x0002',
    path: 'src/app.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.2, 0.5, 0.1],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [],
    dependencies: [],
    dependents: ['src/main.ts'],
    inDegree: 1,
    outDegree: 0,
    lastModified: Date.now(),
  };

  // Subgrafo isla: islandA <-> islandB, nunca alcanzados desde main.ts
  const islandA: HyperVertex = {
    id: 'src/experimental/zombieA.ts',
    hexCode: '0x9001',
    path: 'src/experimental/zombieA.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.8, 0.8, 0.5, 0.9],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [],
    dependencies: ['src/experimental/zombieB.ts'],
    dependents: ['src/experimental/zombieB.ts'],
    inDegree: 1,
    outDegree: 1,
    lastModified: Date.now(),
  };

  const islandB: HyperVertex = {
    id: 'src/experimental/zombieB.ts',
    hexCode: '0x9002',
    path: 'src/experimental/zombieB.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.8, 0.9, 0.5, 0.9],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [],
    dependencies: ['src/experimental/zombieA.ts'],
    dependents: ['src/experimental/zombieA.ts'],
    inDegree: 1,
    outDegree: 1,
    lastModified: Date.now(),
  };

  space.addVertex(mainVertex);
  space.addVertex(appVertex);
  space.addVertex(islandA);
  space.addVertex(islandB);

  const report = auditor.audit(space);
  assert.ok(report.fracturesByType.UNREACHABLE_ISLAND >= 1);
  const islandFracture = report.fractures.find((f) => f.type === 'UNREACHABLE_ISLAND');
  assert.ok(islandFracture);
  assert.ok(islandFracture.description.includes('Zombie Island') || islandFracture.description.includes('inalcanzable'));
  assert.equal(islandFracture.unreachableClusterSize, 2);
});

test('TopologicalAuditor: Detección de FLOATING_PROMISE determinista', () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_floating_promise_test');
  if (fs.existsSync(tempFixture)) fs.rmSync(tempFixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const apiCode = `
export async function fetchRemoteData(id: string): Promise<{ data: string }> {
  return { data: 'ok' };
}
`;
  const callerCode = `
import { fetchRemoteData } from './api.ts';

export function processJob() {
  fetchRemoteData('job-123'); // Promesa flotante sin await ni catch
  return true;
}
`;

  fs.writeFileSync(path.join(tempFixture, 'src', 'api.ts'), apiCode, 'utf-8');
  fs.writeFileSync(path.join(tempFixture, 'src', 'job.ts'), callerCode, 'utf-8');

  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  const apiVertex: HyperVertex = {
    id: 'src/api.ts',
    hexCode: '0x3001',
    path: 'src/api.ts',
    cell: CubicCell.Network,
    coordinate: [0.1, 0.2, 0.5, 0.1],
    lines: 6,
    sizeBytes: 150,
    tokenEstimate: 40,
    symbols: [{ name: 'fetchRemoteData', kind: 'function', lineStart: 2, lineEnd: 4, signature: 'async function fetchRemoteData(): Promise', dependencies: [] }],
    dependencies: [],
    dependents: ['src/job.ts'],
    lastModified: Date.now(),
  };

  const jobVertex: HyperVertex = {
    id: 'src/job.ts',
    hexCode: '0x3002',
    path: 'src/job.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.3, 0.3, 0.5, 0.1],
    lines: 8,
    sizeBytes: 180,
    tokenEstimate: 50,
    symbols: [{ name: 'processJob', kind: 'function', lineStart: 4, lineEnd: 7, dependencies: ['fetchRemoteData'] }],
    dependencies: ['./api.ts'],
    dependents: [],
    lastModified: Date.now(),
  };

  space.addVertex(apiVertex);
  space.addVertex(jobVertex);

  const report = auditor.audit(space, tempFixture);
  const floating = report.fractures.find((f) => f.type === 'FLOATING_PROMISE');
  assert.ok(floating, 'Debe detectar la promesa flotante');
  assert.equal(floating.source, 'src/job.ts');
  assert.equal(floating.symbolName, 'fetchRemoteData');
  assert.ok(floating.importerLine?.includes("fetchRemoteData('job-123')"));
  assert.ok(floating.synthesizedPatch?.startsWith('await '));

  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('TopologicalAuditor: Detección de DEAD_EXPORT (Knip-Style)', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  const helperVertex: HyperVertex = {
    id: 'src/utils/mathHelper.ts',
    hexCode: '0x4001',
    path: 'src/utils/mathHelper.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.5, 0.5, 0.5, 0.1],
    lines: 20,
    sizeBytes: 500,
    tokenEstimate: 120,
    symbols: [
      { name: 'calculateComplexHyperVolume', kind: 'function', lineStart: 2, lineEnd: 10, dependencies: [] },
    ],
    dependencies: [],
    dependents: [], // Nadie lo consume
    lastModified: Date.now(),
  };

  space.addVertex(helperVertex);

  const report = auditor.audit(space);
  const dead = report.fractures.find((f) => f.type === 'DEAD_EXPORT');
  assert.ok(dead, 'Debe detectar exportación muerta');
  assert.equal(dead.symbolName, 'calculateComplexHyperVolume');
  assert.equal(dead.source, 'src/utils/mathHelper.ts');
});

test('TopologicalAuditor: Detección de BOUNDARY_VIOLATION (Ortogonalidad de Celdas 4D)', () => {
  const space = new HypercubeSpace();
  const auditor = new TopologicalAuditor();

  const storageVertex: HyperVertex = {
    id: 'src/storage/diskStore.ts',
    hexCode: '0x5001',
    path: 'src/storage/diskStore.ts',
    cell: CubicCell.Storage,
    coordinate: [0.2, 0.2, 0.8, 0.2],
    lines: 40,
    sizeBytes: 1000,
    tokenEstimate: 250,
    symbols: [{ name: 'DiskStore', kind: 'class', lineStart: 2, lineEnd: 30, dependencies: [] }],
    dependencies: [],
    dependents: ['src/types/models.ts'],
    lastModified: Date.now(),
  };

  // Celda Types importa de Storage -> Violación estricta
  const typesVertex: HyperVertex = {
    id: 'src/types/models.ts',
    hexCode: '0x5002',
    path: 'src/types/models.ts',
    cell: CubicCell.Types,
    coordinate: [0.1, 0.1, 0.9, 0.1],
    lines: 20,
    sizeBytes: 400,
    tokenEstimate: 100,
    symbols: [{ name: 'UserModel', kind: 'interface', lineStart: 2, lineEnd: 15, dependencies: [] }],
    dependencies: ['../storage/diskStore.ts'],
    dependents: [],
    lastModified: Date.now(),
  };

  space.addVertex(storageVertex);
  space.addVertex(typesVertex);

  const report = auditor.audit(space);
  const violation = report.fractures.find((f) => f.type === 'BOUNDARY_VIOLATION');
  assert.ok(violation, 'Debe detectar violación de frontera dimensional');
  assert.equal(violation.cellViolation?.fromCell, CubicCell.Types);
  assert.equal(violation.cellViolation?.toCell, CubicCell.Storage);
});

test('BlastRadiusCalculator: Cálculo de impacto interprocedural a 3 saltos', () => {
  const space = new HypercubeSpace();

  const vA: HyperVertex = {
    id: 'src/core/auth.ts',
    hexCode: '0x1000',
    path: 'src/core/auth.ts',
    cell: CubicCell.Security,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [{ name: 'AuthToken', kind: 'class', lineStart: 1, lineEnd: 20, dependencies: [] }],
    dependencies: [],
    dependents: ['src/services/session.ts'],
    lastModified: Date.now(),
  };

  const vB: HyperVertex = {
    id: 'src/services/session.ts',
    hexCode: '0x1100',
    path: 'src/services/session.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.2, 0.2, 0.2],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [{ name: 'SessionService', kind: 'class', lineStart: 1, lineEnd: 20, dependencies: [] }],
    dependencies: ['src/core/auth.ts'],
    dependents: ['src/ui/loginView.ts'],
    lastModified: Date.now(),
  };

  const vC: HyperVertex = {
    id: 'src/ui/loginView.ts',
    hexCode: '0x1110',
    path: 'src/ui/loginView.ts',
    cell: CubicCell.Config,
    coordinate: [0.3, 0.3, 0.3, 0.3],
    lines: 30,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [{ name: 'LoginView', kind: 'class', lineStart: 1, lineEnd: 20, dependencies: [] }],
    dependencies: ['src/services/session.ts'],
    dependents: [],
    lastModified: Date.now(),
  };

  space.addVertex(vA);
  space.addVertex(vB);
  space.addVertex(vC);

  const blast = BlastRadiusCalculator.calculate(space, 'src/core/auth.ts', 'AuthToken', 3);

  assert.equal(blast.totalAffectedFiles, 2);
  assert.equal(blast.hops[1].length, 1);
  assert.equal(blast.hops[1][0].file, 'src/services/session.ts');
  assert.equal(blast.hops[2].length, 1);
  assert.equal(blast.hops[2][0].file, 'src/ui/loginView.ts');
  assert.ok(blast.summaryPromptForAI.includes('BLAST RADIUS ANALYSIS'));
});

test('TopologicalAuditor.synthesizePatch: Genera adaptadores y correcciones zero-touch', () => {
  const mismatchPatch = TopologicalAuditor.synthesizePatch({
    id: 'test-mismatch',
    type: 'CONTRACT_MISMATCH',
    severity: 'HIGH',
    source: 'src/caller.ts',
    target: 'src/target.ts',
    missingSymbol: 'getOldConfig',
    similarCandidate: 'getConfig',
    rippleImpact: 5,
    affectedDependents: [],
    healingStrategy: 'Re-exportar con alias',
  });

  assert.ok(mismatchPatch.includes('export { getConfig as getOldConfig };'));

  const floatingPatch = TopologicalAuditor.synthesizePatch({
    id: 'test-floating',
    type: 'FLOATING_PROMISE',
    severity: 'HIGH',
    source: 'src/job.ts',
    importerLine: 'saveProfile(user);',
    rippleImpact: 1,
    affectedDependents: [],
    healingStrategy: 'Anteponer await',
  });

  assert.strictEqual(floatingPatch, '// Corrección de promesa flotante:\nawait saveProfile(user);');
});

test('BlastRadiusCalculator: Propagación de Ola Infinita de Mancha (Taint Wave) y Dossier Enriquecido', () => {
  const space = new HypercubeSpace();

  const vA: HyperVertex = {
    id: 'src/models/user.ts',
    hexCode: '0x1001',
    path: 'src/models/user.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    lines: 20,
    sizeBytes: 400,
    tokenEstimate: 100,
    symbols: [{ name: 'getUserId', kind: 'function', lineStart: 2, lineEnd: 10, dependencies: [] }],
    dependencies: [],
    dependents: ['src/services/auth.ts', 'src/utils/unrelated.ts'],
    lastModified: Date.now(),
  };

  const vB: HyperVertex = {
    id: 'src/services/auth.ts',
    hexCode: '0x1002',
    path: 'src/services/auth.ts',
    cell: CubicCell.Security,
    coordinate: [0.2, 0.2, 0.2, 0.2],
    lines: 30,
    sizeBytes: 600,
    tokenEstimate: 150,
    symbols: [
      { name: 'authenticateSession', kind: 'function', lineStart: 2, lineEnd: 20, dependencies: ['getUserId'] },
    ],
    dependencies: ['src/models/user.ts'],
    dependents: ['src/controllers/login.ts'],
    lastModified: Date.now(),
  };

  const vC: HyperVertex = {
    id: 'src/controllers/login.ts',
    hexCode: '0x1003',
    path: 'src/controllers/login.ts',
    cell: CubicCell.Network,
    coordinate: [0.3, 0.3, 0.3, 0.3],
    lines: 40,
    sizeBytes: 800,
    tokenEstimate: 200,
    symbols: [
      { name: 'handleLogin', kind: 'function', lineStart: 2, lineEnd: 30, dependencies: ['authenticateSession'] },
    ],
    dependencies: ['src/services/auth.ts'],
    dependents: ['src/ui/app.ts'],
    lastModified: Date.now(),
  };

  const vD: HyperVertex = {
    id: 'src/ui/app.ts',
    hexCode: '0x1004',
    path: 'src/ui/app.ts',
    cell: CubicCell.Config,
    coordinate: [0.4, 0.4, 0.4, 0.4],
    lines: 50,
    sizeBytes: 1000,
    tokenEstimate: 250,
    symbols: [{ name: 'renderApp', kind: 'function', lineStart: 2, lineEnd: 40, dependencies: ['handleLogin'] }],
    dependencies: ['src/controllers/login.ts'],
    dependents: [], // Terminal sink
    lastModified: Date.now(),
  };

  const vE: HyperVertex = {
    id: 'src/utils/unrelated.ts',
    hexCode: '0x1005',
    path: 'src/utils/unrelated.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    lines: 15,
    sizeBytes: 300,
    tokenEstimate: 80,
    symbols: [{ name: 'formatDate', kind: 'function', lineStart: 2, lineEnd: 10, dependencies: [] }], // NO usa getUserId
    dependencies: ['src/models/user.ts'],
    dependents: [],
    lastModified: Date.now(),
  };

  space.addVertex(vA);
  space.addVertex(vB);
  space.addVertex(vC);
  space.addVertex(vD);
  space.addVertex(vE);

  const blast = BlastRadiusCalculator.calculate(space, 'src/models/user.ts', 'getUserId', 10);

  // Verificaciones de la ola infinita y análisis de mancha
  assert.ok(blast.maxHopsReached >= 3, 'Debe alcanzar al menos 3 saltos en la ola');
  assert.ok(blast.totalTrueFractures >= 3, 'Debe haber al menos 3 fracturas verificadas en la cadena');
  assert.ok(blast.totalStructuralDependents >= 4, 'Total de dependientes estructurales');

  // Comprobar que src/utils/unrelated.ts NO fue contagiado falsamente
  const unrelatedInTree = blast.taintWaveTree.some((n) => n.file === 'src/utils/unrelated.ts');
  assert.strictEqual(unrelatedInTree, false, 'No debe contagiar archivos que no consumen el símbolo dañado');

  // Comprobar la cadena causal en taintWaveTree
  const inAuth = blast.taintWaveTree.find((n) => n.file === 'src/services/auth.ts');
  assert.ok(inAuth);
  assert.equal(inAuth.taintedSymbol, 'authenticateSession');
  assert.equal(inAuth.causalParentFile, 'src/models/user.ts');

  // Comprobar Terminal Sink
  const sinkApp = blast.terminalSinks.find((s) => s.file === 'src/ui/app.ts');
  assert.ok(sinkApp, 'src/ui/app.ts debe ser detectado como Terminal Sink');

  // Comprobar Camino Crítico más profundo
  assert.ok(blast.criticalPath.length >= 4);
  assert.equal(blast.criticalPath[0], 'src/models/user.ts');
  assert.equal(blast.criticalPath[blast.criticalPath.length - 1], 'src/ui/app.ts');

  // Comprobar Dossier Enriquecido
  assert.ok(blast.richDossierForAI.includes('DOMINO WAVEFRONT: TRUE FRACTURE PROPAGATION'));
  assert.ok(blast.richDossierForAI.includes('Árbol Causal del Efecto Dominó'));
  assert.ok(blast.richDossierForAI.includes('Camino Crítico más Profundo'));
  assert.ok(blast.richDossierForAI.includes('Puntos de Colapso Terminal'));
  assert.ok(blast.richDossierForAI.includes('Parche Zero-Touch de Contención Quirúrgica'));
});
