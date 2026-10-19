import { test } from 'node:test';
import * as assert from 'node:assert';
import { FlowTracer } from '../src/core/flow.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

test('FlowTracer: Extracción de palabras clave arquitectónicas', () => {
  const query = '¿Cómo hace el sistema para autenticar al usuario y guardar la sesión en disco?';
  const kws = FlowTracer.extractKeywords(query);

  assert.ok(kws.includes('autenticar'), 'Debe incluir autenticar');
  assert.ok(kws.includes('usuario'), 'Debe incluir usuario');
  assert.ok(kws.includes('guardar'), 'Debe incluir guardar');
  assert.ok(kws.includes('sesion'), 'Debe incluir sesion sin tilde');
  assert.ok(kws.includes('disco'), 'Debe incluir disco');
  assert.ok(!kws.includes('como'), 'No debe incluir stopword "como"');
  assert.ok(!kws.includes('para'), 'No debe incluir stopword "para"');
});

test('FlowTracer: Trazado geodésico en R^4 y estimación de tokens', () => {
  const space = new HypercubeSpace();

  // Vértice 1: Login UI
  space.addVertex({
    id: 'src/ui/login.ts',
    path: 'src/ui/login.ts',
    cell: CubicCell.UI,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    hexCode: '0x1111',
    tokenEstimate: 200,
    lines: 40,
    dependencies: ['./authService'],
    dependents: [],
    symbols: [
      { name: 'renderLogin', kind: 'function', lineStart: 5, lineEnd: 20, dependencies: [] },
    ],
  });

  // Vértice 2: AuthService
  space.addVertex({
    id: 'src/auth/authService.ts',
    path: 'src/auth/authService.ts',
    cell: CubicCell.Security,
    coordinate: [0.2, 0.2, 0.2, 0.2],
    hexCode: '0x2222',
    tokenEstimate: 350,
    lines: 80,
    dependencies: ['../storage/sessionStorage'],
    dependents: ['src/ui/login.ts'],
    symbols: [
      { name: 'authenticateUser', kind: 'method', signature: '(u: string, p: string): Promise<boolean>', lineStart: 10, lineEnd: 30, dependencies: [] },
    ],
  });

  // Vértice 3: SessionStorage
  space.addVertex({
    id: 'src/storage/sessionStorage.ts',
    path: 'src/storage/sessionStorage.ts',
    cell: CubicCell.Storage,
    coordinate: [0.8, 0.8, 0.8, 0.8],
    hexCode: '0x8888',
    tokenEstimate: 300,
    lines: 60,
    dependencies: [],
    dependents: ['src/auth/authService.ts'],
    symbols: [
      { name: 'saveSessionDisk', kind: 'method', signature: '(token: string): void', lineStart: 15, lineEnd: 40, dependencies: [] },
    ],
  });

  const report = FlowTracer.trace(space, '¿Cómo autenticar usuario y guardar sesión?');

  assert.ok(report.flowSteps.length >= 2, 'Debe trazar al menos 2 pasos en la cadena');
  assert.ok(report.asciiDiagram.includes('FLUJO TOPOLÓGICO 4D'), 'Debe generar el diagrama ASCII');
  assert.ok(report.estimatedTokens < 600, 'Debe consumir menos de 600 tokens');
  assert.ok(report.directAnswerForAI.length > 20, 'Debe incluir una respuesta directa para la IA');
});
