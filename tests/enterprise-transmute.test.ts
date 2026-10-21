import { test } from 'node:test';
import * as assert from 'node:assert';
import { TesseractAtomicTransmuter } from '../src/enterprise/transmute.ts';
import { type HyperVertex } from '../src/core/types.ts';

test('TesseractAtomicTransmuter: Calcula la clausura transitiva G* y receta de transmutación', () => {
  const transmuter = new TesseractAtomicTransmuter();

  const mockVertices: HyperVertex[] = [
    {
      id: 'src/parsers/base.ts',
      path: 'src/parsers/base.ts',
      hexCode: '0x1000',
      cell: 'CoreLogic',
      coordinate: [0.2, 0.2, 0.8, 0.1],
      lines: 30,
      sizeBytes: 500,
      tokenEstimate: 100,
      symbols: [{ name: 'LanguageParser', kind: 'interface', lineStart: 1, lineEnd: 10, dependencies: [] }],
      dependencies: [],
      dependents: ['src/parsers/ts-parser.ts', 'src/parsers/py-parser.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/parsers/ts-parser.ts',
      path: 'src/parsers/ts-parser.ts',
      hexCode: '0x1001',
      cell: 'CoreLogic',
      coordinate: [0.22, 0.21, 0.8, 0.1],
      lines: 50,
      sizeBytes: 800,
      tokenEstimate: 200,
      symbols: [{ name: 'TypeScriptParser', kind: 'class', lineStart: 1, lineEnd: 20, dependencies: [] }],
      dependencies: ['src/parsers/base.ts'],
      dependents: ['src/core/indexer.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/parsers/py-parser.ts',
      path: 'src/parsers/py-parser.ts',
      hexCode: '0x1002',
      cell: 'CoreLogic',
      coordinate: [0.23, 0.22, 0.8, 0.1],
      lines: 40,
      sizeBytes: 700,
      tokenEstimate: 180,
      symbols: [{ name: 'PythonParser', kind: 'class', lineStart: 1, lineEnd: 15, dependencies: [] }],
      dependencies: ['src/parsers/base.ts'],
      dependents: [],
      lastModified: Date.now(),
    },
    {
      id: 'src/core/indexer.ts',
      path: 'src/core/indexer.ts',
      hexCode: '0x1003',
      cell: 'CoreLogic',
      coordinate: [0.3, 0.3, 0.7, 0.2],
      lines: 100,
      sizeBytes: 2000,
      tokenEstimate: 500,
      symbols: [{ name: 'ProjectIndexer', kind: 'class', lineStart: 1, lineEnd: 40, dependencies: [] }],
      dependencies: ['src/parsers/ts-parser.ts'],
      dependents: [],
      lastModified: Date.now(),
    },
  ];

  const report = transmuter.planAtomicTransmutation(
    'src/parsers/base.ts',
    'LanguageParser',
    'LanguageParserV2',
    mockVertices
  );

  assert.strictEqual(report.rootFile, 'src/parsers/base.ts');
  assert.strictEqual(report.rootSymbol, 'LanguageParser');
  // G* debe contener los dependientes transitivos
  assert.ok(report.closedSubgraphFiles.includes('src/parsers/ts-parser.ts'));
  assert.ok(report.closedSubgraphFiles.includes('src/parsers/py-parser.ts'));
  assert.ok(report.closedSubgraphFiles.includes('src/core/indexer.ts'));
  assert.strictEqual(report.verdict, 'ATOMIC_RECIPE_READY');
  assert.ok(report.predictedShearDistance <= 0.10);
});

test('TesseractAtomicTransmuter: Detecta refactorización multiarchivo incompleta y emite ATOMIC_TRANSFORMATION_FRACTURE', () => {
  const transmuter = new TesseractAtomicTransmuter();

  const mockVertices: HyperVertex[] = [
    {
      id: 'src/a.ts',
      path: 'src/a.ts',
      hexCode: '0x1000',
      cell: 'CoreLogic',
      coordinate: [0.1, 0.1, 0.1, 0.1],
      lines: 10,
      sizeBytes: 200,
      tokenEstimate: 50,
      symbols: [{ name: 'coreFunc', kind: 'function', lineStart: 1, lineEnd: 5, dependencies: [] }],
      dependencies: [],
      dependents: ['src/b.ts', 'src/c.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/b.ts',
      path: 'src/b.ts',
      hexCode: '0x1001',
      cell: 'CoreLogic',
      coordinate: [0.2, 0.2, 0.2, 0.2],
      lines: 10,
      sizeBytes: 200,
      tokenEstimate: 50,
      symbols: [],
      dependencies: ['src/a.ts'],
      dependents: [],
      lastModified: Date.now(),
    },
    {
      id: 'src/c.ts',
      path: 'src/c.ts',
      hexCode: '0x1002',
      cell: 'CoreLogic',
      coordinate: [0.3, 0.3, 0.3, 0.3],
      lines: 10,
      sizeBytes: 200,
      tokenEstimate: 50,
      symbols: [],
      dependencies: ['src/a.ts'],
      dependents: [],
      lastModified: Date.now(),
    },
  ];

  // La IA modificó src/a.ts y src/b.ts, pero olvidó src/c.ts
  const updatedFiles = ['src/a.ts', 'src/b.ts'];
  const fractures = transmuter.auditAtomicTransmutation(
    'src/a.ts',
    'coreFunc',
    'coreFuncV2',
    updatedFiles,
    mockVertices
  );

  assert.strictEqual(fractures.length, 1);
  assert.strictEqual(fractures[0].type, 'ATOMIC_TRANSFORMATION_FRACTURE');
  assert.strictEqual(fractures[0].severity, 'CRITICAL');
  assert.ok(fractures[0].description.includes('src/c.ts'));
});
