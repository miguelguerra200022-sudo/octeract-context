import { test, describe, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { PreflightAuditor } from '../src/core/preflight.ts';
import { type HyperVertex } from '../src/core/types.ts';

describe('Preflight & Packaging Auditor (The 5th Dimension: P-Axis)', () => {
  let tempDir: string;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tesseract-preflight-test-'));
  });

  after(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorar errores de limpieza temporal
    }
  });

  test('1. Detecta binario fantasma y binario sin shebang o con CRLF', () => {
    const pkgDir = path.join(tempDir, 'bin-tests');
    fs.mkdirSync(pkgDir, { recursive: true });
    const binDir = path.join(pkgDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    // Archivo con CRLF y sin shebang
    const badBinPath = path.join(binDir, 'cli.js');
    fs.writeFileSync(badBinPath, 'console.log("no shebang and crlf");\r\n', 'utf8');

    const pkg = {
      name: 'test-cli',
      version: '1.0.0',
      bin: {
        'my-cli': 'bin/cli.js',
        'ghost-cli': 'bin/ghost.js',
      },
    };
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

    const auditor = new PreflightAuditor(pkgDir);
    const fractures = auditor.auditAll();

    const ghost = fractures.find((f) => f.id === 'BIN_GHOST_ghost-cli');
    assert.ok(ghost, 'Debe detectar el binario fantasma');
    assert.strictEqual(ghost?.severity, 'CRITICAL');

    const noShebang = fractures.find((f) => f.id === 'BIN_NO_SHEBANG_my-cli');
    assert.ok(noShebang, 'Debe detectar la falta de shebang');

    const crlf = fractures.find((f) => f.id === 'BIN_CRLF_my-cli');
    assert.ok(crlf, 'Debe detectar terminaciones CRLF \\r');
  });

  test('2. Detecta trampa de dist desaparecido y orden de condiciones en exports', () => {
    const pkgDir = path.join(tempDir, 'packaging-tests');
    fs.mkdirSync(pkgDir, { recursive: true });

    // package.json que apunta a dist pero no tiene array files
    const pkg = {
      name: 'test-pkg',
      version: '1.0.0',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          default: './dist/index.js',
          import: './dist/index.mjs',
          require: './dist/index.cjs',
        },
      },
    };
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
    fs.writeFileSync(path.join(pkgDir, '.gitignore'), 'node_modules\ndist\n', 'utf8');

    const auditor = new PreflightAuditor(pkgDir);
    const fractures = auditor.auditAll();

    const disappearingDist = fractures.find((f) => f.id === 'PACKAGING_DISAPPEARING_DIST');
    assert.ok(disappearingDist, 'Debe detectar la trampa de dist ignorado sin files array');

    const exportsOrder = fractures.find((f) => f.id.startsWith('EXPORTS_ORDER_DEFAULT'));
    assert.ok(exportsOrder, 'Debe detectar que "default" no está al final de exports');
  });

  test('3. Detecta llamadas circulares npx en workflows de CI/CD', () => {
    const pkgDir = path.join(tempDir, 'ci-tests');
    const wfDir = path.join(pkgDir, '.github', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });

    const pkg = {
      name: 'super-lib',
      version: '2.0.0',
    };
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

    const badWorkflow = `
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Self audit
        run: npx -y super-lib audit .
`;
    fs.writeFileSync(path.join(wfDir, 'ci.yml'), badWorkflow, 'utf8');

    const auditor = new PreflightAuditor(pkgDir);
    const fractures = auditor.auditAll();

    const circularNpx = fractures.find((f) => f.type === 'CI_WORKFLOW_FRACTURE' && f.id.includes('CI_CIRCULAR_NPX'));
    assert.ok(circularNpx, 'Debe detectar la llamada circular npx en el workflow de CI');
    assert.strictEqual(circularNpx?.severity, 'CRITICAL');
  });

  test('4. Detecta fugas de devDependencies en código de producción y protocolos workspace:*', () => {
    const pkgDir = path.join(tempDir, 'dep-tests');
    fs.mkdirSync(pkgDir, { recursive: true });

    const pkg = {
      name: 'prod-app',
      version: '1.0.0',
      dependencies: {
        'external-monorepo-pkg': 'workspace:*',
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'esbuild': '^0.20.0',
      },
    };
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

    const mockVertices: HyperVertex[] = [
      {
        id: 'src/core/compiler.ts',
        hexCode: '0x1234',
        path: 'src/core/compiler.ts',
        cell: 'CoreLogic',
        coordinate: [0.5, 0.5, 0.5, 0.5],
        lines: 50,
        sizeBytes: 1000,
        tokenEstimate: 200,
        symbols: [],
        dependencies: ['esbuild', 'node:fs'],
        dependents: [],
        lastModified: Date.now(),
      },
    ];

    const auditor = new PreflightAuditor(pkgDir);
    const fractures = auditor.auditAll(mockVertices);

    const devDepLeak = fractures.find((f) => f.type === 'DEPENDENCY_LEAK_FRACTURE' && f.id.includes('esbuild'));
    assert.ok(devDepLeak, 'Debe detectar que esbuild está en devDependencies pero se importa en src/');

    const workspaceProto = fractures.find((f) => f.id.includes('DEP_UNRESOLVED_WORKSPACE'));
    assert.ok(workspaceProto, 'Debe detectar dependencia no resuelta workspace:*');
  });

  test('5. Detecta colisiones de mayúsculas/minúsculas para Linux y Docker', () => {
    const pkgDir = path.join(tempDir, 'case-tests');
    const srcDir = path.join(pkgDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // Archivo en disco con minúscula
    fs.writeFileSync(path.join(srcDir, 'utils.ts'), 'export const a = 1;', 'utf8');

    const mockVertices: HyperVertex[] = [
      {
        id: 'src/index.ts',
        hexCode: '0x1000',
        path: 'src/index.ts',
        cell: 'CoreLogic',
        coordinate: [0.5, 0.5, 0.5, 0.5],
        lines: 10,
        sizeBytes: 200,
        tokenEstimate: 50,
        symbols: [],
        dependencies: ['./Utils.ts'], // Import con mayúscula
        dependents: [],
        lastModified: Date.now(),
      },
    ];

    const auditor = new PreflightAuditor(pkgDir);
    const fractures = auditor.auditAll(mockVertices);

    const caseCollision = fractures.find((f) => f.type === 'CASE_SENSITIVITY_FRACTURE');
    assert.ok(caseCollision, 'Debe detectar la colisión de mayúsculas/minúsculas entre import y disco');
  });
});
