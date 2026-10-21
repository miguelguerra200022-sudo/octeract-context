import { test } from 'node:test';
import * as assert from 'node:assert';
import { TesseractSwarmCoordinator } from '../src/enterprise/swarm.ts';
import { type HyperVertex, type AgentSwarmIntent } from '../src/core/types.ts';

test('TesseractSwarmCoordinator: Zonas de Voronoi ortogonales sin colisiones (Lock-Free)', () => {
  const coordinator = new TesseractSwarmCoordinator();

  const mockVertices: HyperVertex[] = [
    {
      id: 'src/ui/dashboard.ts',
      path: 'src/ui/dashboard.ts',
      hexCode: '0x1000',
      cell: 'UI',
      coordinate: [0.1, 0.1, 0.9, 0.2],
      lines: 100,
      sizeBytes: 2000,
      tokenEstimate: 500,
      symbols: [{ name: 'renderDashboard', kind: 'function', lineStart: 1, lineEnd: 20, dependencies: [] }],
      dependencies: [],
      dependents: [],
      lastModified: Date.now(),
    },
    {
      id: 'src/storage/db.ts',
      path: 'src/storage/db.ts',
      hexCode: '0x2000',
      cell: 'Storage',
      coordinate: [0.9, 0.9, 0.1, 0.2],
      lines: 80,
      sizeBytes: 1500,
      tokenEstimate: 400,
      symbols: [{ name: 'saveData', kind: 'function', lineStart: 1, lineEnd: 20, dependencies: [] }],
      dependencies: [],
      dependents: [],
      lastModified: Date.now(),
    },
  ];

  const intents: AgentSwarmIntent[] = [
    { agentId: 'Agent-Frontend', taskDescription: 'Mejorar UI', targetFiles: ['src/ui/dashboard.ts'], priority: 5 },
    { agentId: 'Agent-Backend', taskDescription: 'Optimizar DB', targetFiles: ['src/storage/db.ts'], priority: 5 },
  ];

  const report = coordinator.coordinateSwarm(intents, mockVertices);

  assert.strictEqual(report.totalAgents, 2);
  assert.strictEqual(report.lockFreeAgentsCount, 2);
  assert.strictEqual(report.collidingPairsCount, 0);
  assert.strictEqual(report.verdict, 'ALL_CLEAR_PARALLEL');
  assert.strictEqual(report.zones[0].status, 'ISOLATED_LOCK_FREE');
  assert.strictEqual(report.zones[1].status, 'ISOLATED_LOCK_FREE');
});

test('TesseractSwarmCoordinator: Detecta colisión semántica indirecta y genera fachada de sincronización', () => {
  const coordinator = new TesseractSwarmCoordinator();

  const mockVertices: HyperVertex[] = [
    {
      id: 'src/core/auth.ts',
      path: 'src/core/auth.ts',
      hexCode: '0x3000',
      cell: 'Security',
      coordinate: [0.5, 0.5, 0.5, 0.5],
      lines: 50,
      sizeBytes: 1000,
      tokenEstimate: 300,
      symbols: [{ name: 'loginUser', kind: 'function', lineStart: 1, lineEnd: 10, dependencies: [] }],
      dependencies: [],
      dependents: ['src/ui/loginView.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/ui/loginView.ts',
      path: 'src/ui/loginView.ts',
      hexCode: '0x3001',
      cell: 'UI',
      coordinate: [0.52, 0.48, 0.51, 0.5],
      lines: 60,
      sizeBytes: 1200,
      tokenEstimate: 350,
      symbols: [{ name: 'renderLogin', kind: 'function', lineStart: 1, lineEnd: 15, dependencies: [] }],
      dependencies: ['src/core/auth.ts'],
      dependents: [],
      lastModified: Date.now(),
    },
  ];

  const intents: AgentSwarmIntent[] = [
    { agentId: 'Agent-A', taskDescription: 'Modificar firma de autenticación', targetFiles: ['src/core/auth.ts'], priority: 10 },
    { agentId: 'Agent-B', taskDescription: 'Añadir estilo a vista de login', targetFiles: ['src/ui/loginView.ts'], priority: 5 },
  ];

  const report = coordinator.coordinateSwarm(intents, mockVertices);

  assert.strictEqual(report.totalAgents, 2);
  assert.strictEqual(report.collidingPairsCount, 1);
  assert.strictEqual(report.verdict, 'SYNCHRONIZATION_REQUIRED');
  assert.strictEqual(report.collisions[0].precedenceWinner, 'Agent-A');
  assert.ok(report.collisions[0].recommendedSyncFacade?.includes('loginUser'));
});

test('TesseractSwarmCoordinator: Detecta y previene Deadlock Semántico circular en esperas', () => {
  const coordinator = new TesseractSwarmCoordinator();

  const mockVertices: HyperVertex[] = [
    {
      id: 'src/a.ts',
      path: 'src/a.ts',
      hexCode: '0x4000',
      cell: 'CoreLogic',
      coordinate: [0.4, 0.4, 0.4, 0.4],
      lines: 20,
      sizeBytes: 500,
      tokenEstimate: 100,
      symbols: [{ name: 'symA', kind: 'function', lineStart: 1, lineEnd: 5, dependencies: [] }],
      dependencies: ['src/b.ts'],
      dependents: ['src/b.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/b.ts',
      path: 'src/b.ts',
      hexCode: '0x4001',
      cell: 'CoreLogic',
      coordinate: [0.41, 0.41, 0.41, 0.41],
      lines: 20,
      sizeBytes: 500,
      tokenEstimate: 100,
      symbols: [{ name: 'symB', kind: 'function', lineStart: 1, lineEnd: 5, dependencies: [] }],
      dependencies: ['src/a.ts'],
      dependents: ['src/a.ts'],
      lastModified: Date.now(),
    },
  ];

  // Agente 1 toca a.ts (que depende y es dependiente de b.ts)
  // Agente 2 toca b.ts con misma prioridad
  const intents: AgentSwarmIntent[] = [
    { agentId: 'Agent-1', taskDescription: 'Editar A', targetFiles: ['src/a.ts'], priority: 10 },
    { agentId: 'Agent-2', taskDescription: 'Editar B', targetFiles: ['src/b.ts'], priority: 10 },
  ];

  const report = coordinator.coordinateSwarm(intents, mockVertices);
  assert.ok(report.collidingPairsCount >= 1);
  assert.strictEqual(report.verdict, 'SYNCHRONIZATION_REQUIRED');
});
