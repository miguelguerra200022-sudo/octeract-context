import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepContractDiagnostic } from '../src/core/diagnostic.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell } from '../src/core/types.ts';

test('DeepContractDiagnostic: Extrae discrepancias de tipos en contratos rotos', () => {
  const callee = 'export function login(user: string, token: string): Promise<boolean> { return Promise.resolve(true); }';
  const caller = 'login("alice");';

  const diff = DeepContractDiagnostic.diffSignatures(callee, caller);
  assert.ok(diff.missingArgs.includes('token'), 'Debe detectar argumento token faltante');
  assert.equal(diff.expectedParamCount, 2);
  assert.equal(diff.actualParamCount, 1);
  assert.equal(diff.isAsyncExpected, true);
});

test('DeepContractDiagnostic: Traza la cadena crítica de colapso (Critical Backbone) hacia un Terminal Sink', () => {
  const space = new HypercubeSpace();

  // Cadena causal: Epicentro (range.ts) -> Clipboard (clipboard.ts) -> Terminal Sink (uiWidget.ts)
  space.addVertex({
    id: 'src/range.ts',
    path: '/repo/src/range.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    lines: 100,
    sizeBytes: 1000,
    tokenEstimate: 200,
    symbols: [{ name: 'Range', kind: 'class', line: 1, isExported: true }],
    dependencies: [],
    dependents: ['src/clipboard.ts'],
    inDegree: 0,
    outDegree: 1,
    lastModified: Date.now(),
  });

  space.addVertex({
    id: 'src/clipboard.ts',
    path: '/repo/src/clipboard.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.2, 0.2, 0.2],
    lines: 150,
    sizeBytes: 1500,
    tokenEstimate: 300,
    symbols: [{ name: 'ClipboardHelper', kind: 'class', line: 1, isExported: true }],
    dependencies: ['src/range.ts'],
    dependents: ['src/uiWidget.ts'],
    inDegree: 1,
    outDegree: 1,
    lastModified: Date.now(),
  });

  space.addVertex({
    id: 'src/uiWidget.ts',
    path: '/repo/src/uiWidget.ts',
    cell: CubicCell.UI,
    coordinate: [0.9, 0.9, 0.9, 0.9],
    lines: 300,
    sizeBytes: 3000,
    tokenEstimate: 600,
    symbols: [{ name: 'WidgetView', kind: 'class', line: 1, isExported: true }],
    dependencies: ['src/clipboard.ts'],
    dependents: [],
    inDegree: 1,
    outDegree: 0, // Terminal sink
    lastModified: Date.now(),
  });

  const backbone = DeepContractDiagnostic.traceCriticalBackbone('src/range.ts', space);
  assert.ok(backbone.length >= 2, 'Debe encontrar un camino de colapso hacia el sink');
  assert.equal(backbone[0], 'src/range.ts');
  assert.equal(backbone[backbone.length - 1], 'src/uiWidget.ts', 'El final del camino debe ser el terminal sink');
});
