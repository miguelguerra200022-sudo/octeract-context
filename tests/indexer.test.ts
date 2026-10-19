import test from 'node:test';
import assert from 'node:assert';
import { ProjectIndexer } from '../src/core/indexer.ts';
import { CubicCell } from '../src/core/types.ts';

test('ProjectIndexer: Clasificación en las 8 Celdas Cúbicas 3D', () => {
  const indexer = new ProjectIndexer();

  assert.strictEqual(indexer.classifyCell('src/auth/jwt.ts', ''), CubicCell.Security);
  assert.strictEqual(indexer.classifyCell('src/services/billing.spec.ts', ''), CubicCell.Tests);
  assert.strictEqual(indexer.classifyCell('src/db/migrations/01_init.sql', ''), CubicCell.Storage);
  assert.strictEqual(indexer.classifyCell('src/routes/api.ts', ''), CubicCell.Network);
  assert.strictEqual(indexer.classifyCell('package.json', ''), CubicCell.Config);
  assert.strictEqual(indexer.classifyCell('src/types/user.d.ts', ''), CubicCell.Types);
  assert.strictEqual(indexer.classifyCell('src/telemetry/logger.ts', ''), CubicCell.Telemetry);
  assert.strictEqual(indexer.classifyCell('src/calculator.ts', ''), CubicCell.CoreLogic);
});

test('ProjectIndexer: Cálculo de Coordenadas 4D acotadas en [0, 1]', () => {
  const indexer = new ProjectIndexer();
  const coord = indexer.computeCoordinate(CubicCell.Security, 250, 15, Date.now());

  assert.strictEqual(coord.length, 4);
  for (let i = 0; i < 4; i++) {
    assert.ok(coord[i] >= 0 && coord[i] <= 1, `Coordenada ${i} fuera de rango [0, 1]: ${coord[i]}`);
  }
});

test('ProjectIndexer: Resolución Canónica estricta anti-colisiones (múltiples utils.ts)', () => {
  const indexer = new ProjectIndexer();
  const idMap = new Map();

  const authUtils = {
    id: 'src/auth/utils.ts',
    path: 'src/auth/utils.ts',
    cell: CubicCell.Security,
    dependencies: [],
    dependents: [],
    coordinate: [0.1, 0.1, 0.1, 0.1],
  };

  const dbUtils = {
    id: 'src/db/utils.ts',
    path: 'src/db/utils.ts',
    cell: CubicCell.Storage,
    dependencies: [],
    dependents: [],
    coordinate: [0.2, 0.2, 0.2, 0.2],
  };

  idMap.set(authUtils.id, authUtils);
  idMap.set(dbUtils.id, dbUtils);

  // Un import './utils' desde src/auth/login.ts DEBE resolver a src/auth/utils.ts
  const resolvedAuth = indexer.resolveCanonicalImport('src/auth/login.ts', './utils', idMap);
  assert.strictEqual(resolvedAuth?.id, 'src/auth/utils.ts', 'Debe resolver al utils de auth, NO de db');

  // Un import './utils' desde src/db/repo.ts DEBE resolver a src/db/utils.ts
  const resolvedDb = indexer.resolveCanonicalImport('src/db/repo.ts', './utils', idMap);
  assert.strictEqual(resolvedDb?.id, 'src/db/utils.ts', 'Debe resolver al utils de db, NO de auth');

  // Un import '../auth/utils' desde src/db/repo.ts debe resolver a src/auth/utils.ts
  const resolvedCross = indexer.resolveCanonicalImport('src/db/repo.ts', '../auth/utils', idMap);
  assert.strictEqual(resolvedCross?.id, 'src/auth/utils.ts', 'Rutas relativas con .. deben resolver con precisión');
});

