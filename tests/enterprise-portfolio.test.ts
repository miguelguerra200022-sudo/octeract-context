import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { TesseractPortfolioEngine } from '../src/enterprise/portfolio.ts';
import { type HyperVertex, type AuditReport } from '../src/core/types.ts';

describe('Tesseract Portfolio Frontier Engine (Triángulo Mágico de la Inversión)', () => {
  const mockVertices: HyperVertex[] = [
    {
      id: 'src/core/types.ts',
      hexCode: '0x1000',
      path: 'src/core/types.ts',
      cell: 'Types',
      coordinate: [0.5, 0.5, 0.5, 0.5],
      lines: 300,
      sizeBytes: 8000,
      tokenEstimate: 1200,
      symbols: [],
      dependencies: [],
      dependents: ['src/core/auditor.ts', 'src/core/indexer.ts', 'src/core/hypercube.ts', 'src/core/shadow.ts', 'src/core/flow.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/parsers/base.ts',
      hexCode: '0x2000',
      path: 'src/parsers/base.ts',
      cell: 'CoreLogic',
      coordinate: [0.2, 0.2, 0.2, 0.2],
      lines: 40,
      sizeBytes: 900,
      tokenEstimate: 150,
      symbols: [],
      dependencies: [],
      dependents: ['src/parsers/ts-parser.ts', 'src/parsers/py-parser.ts'],
      lastModified: Date.now(),
    },
    {
      id: 'src/core/auditor.ts',
      hexCode: '0x3000',
      path: 'src/core/auditor.ts',
      cell: 'Security',
      coordinate: [0.8, 0.8, 0.8, 0.8],
      lines: 1500,
      sizeBytes: 60000,
      tokenEstimate: 10000,
      symbols: [],
      dependencies: ['src/core/types.ts', 'src/core/hypercube.ts', 'src/core/security.ts', 'src/core/diagnostic.ts'],
      dependents: ['src/cli/commands.ts'],
      lastModified: Date.now(),
    },
  ];

  const mockAuditReport: AuditReport = {
    timestamp: Date.now(),
    totalFilesAudited: 3,
    healthScore: 100,
    totalFractures: 0,
    fracturesByType: {
      BROKEN_IMPORT: 0,
      CONTRACT_MISMATCH: 0,
      CIRCULAR_DEPENDENCY: 0,
      ORPHAN_NODE: 0,
      TOPOLOGICAL_SINK: 0,
      UNMATCHED_EVENT: 0,
      UNREACHABLE_ISLAND: 0,
      DEAD_CODE: 0,
      FLOATING_PROMISE: 0,
      DEAD_EXPORT: 0,
      BOUNDARY_VIOLATION: 0,
      HALLUCINATED_DEPENDENCY: 0,
      SECRET_LEAK: 0,
      TRUNCATED_FILE: 0,
      BIN_EXEC_FRACTURE: 0,
      PACKAGING_EXPORT_FRACTURE: 0,
      CI_WORKFLOW_FRACTURE: 0,
      DEPENDENCY_LEAK_FRACTURE: 0,
      CASE_SENSITIVITY_FRACTURE: 0,
      RELEASE_SYNC_FRACTURE: 0,
    },
    fractures: [],
    status: 'PERFECT_SYMMETRY',
  };

  test('1. Evalúa el Triángulo Mágico (Rentabilidad, Seguridad, Liquidez)', () => {
    const engine = new TesseractPortfolioEngine();
    const evaluation = engine.evaluatePortfolio(mockVertices, mockAuditReport);

    assert.strictEqual(evaluation.totalAssets, 3);
    assert.ok(evaluation.triangle.rentabilidad.tokenAlphaPercent > 90, 'Token Alpha debe superar el 90%');
    assert.strictEqual(evaluation.triangle.seguridad.safetyScore, 100, 'Salud de seguridad debe ser 100');
    assert.ok(evaluation.triangle.liquidez.globalLiquidityRatio > 0, 'Debe tener ratio de liquidez positivo');
  });

  test('2. Sharpe Ratio y ordenamiento de activos óptimos', () => {
    const engine = new TesseractPortfolioEngine();
    const evaluation = engine.evaluatePortfolio(mockVertices, mockAuditReport);

    assert.ok(evaluation.topSharpeAssets.length > 0);
    // Verificar que los activos están ordenados de forma descendente por Sharpe
    for (let i = 0; i < evaluation.topSharpeAssets.length - 1; i++) {
      assert.ok(
        evaluation.topSharpeAssets[i].sharpeRatio >= evaluation.topSharpeAssets[i + 1].sharpeRatio,
        'Los activos deben estar ordenados por Sharpe Ratio descendente'
      );
    }

    const baseParser = evaluation.topSharpeAssets.find((a) => a.file === 'src/parsers/base.ts');
    assert.ok(baseParser, 'Debe incluir base.ts');
    assert.ok(baseParser.sharpeRatio > 0, 'Sharpe Ratio debe ser positivo');
  });

  test('3. Criterio de Kelly para dimensionamiento seguro de lotes (Batch Sizing)', () => {
    const engine = new TesseractPortfolioEngine();
    const evaluation = engine.evaluatePortfolio(mockVertices, mockAuditReport);

    for (const asset of evaluation.topSharpeAssets) {
      assert.ok(asset.kellyBatchSizeLines >= 15, 'Lote mínimo de Kelly es 15 líneas');
      assert.ok(asset.kellyBatchSizeLines <= 300, 'Lote máximo seguro de Kelly es 300 líneas');
    }
  });

  test('4. Asesor para Vibe Coders genera recomendaciones claras', () => {
    const engine = new TesseractPortfolioEngine();
    const evaluation = engine.evaluatePortfolio(mockVertices, mockAuditReport);
    const advice = evaluation.vibeAdvice;

    assert.strictEqual(advice.healthMood, 'EXCELENTE');
    assert.ok(advice.bestMove.action.length > 0, 'Debe tener una mejor jugada');
    assert.ok(advice.dangerZone.avoidAction.length > 0, 'Debe señalar una zona de peligro');
    assert.ok(advice.bestMove.expectedTokensNeeded > 0, 'Debe estimar tokens necesarios');
  });

  test('5. Manejo robusto de proyectos vacíos', () => {
    const engine = new TesseractPortfolioEngine();
    const evaluation = engine.evaluatePortfolio([]);

    assert.strictEqual(evaluation.totalAssets, 0);
    assert.strictEqual(evaluation.triangle.rentabilidad.tokenAlphaPercent, 0);
    assert.ok(evaluation.vibeAdvice.headline.length > 0);
  });
});
