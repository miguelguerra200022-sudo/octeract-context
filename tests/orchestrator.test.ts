import { test } from 'node:test';
import * as assert from 'node:assert';
import { OcteractOrchestratorEngine } from '../src/core/orchestrator.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell } from '../src/core/types.ts';
import { MCPServer } from '../src/mcp/server.ts';

test('OcteractOrchestratorEngine: Descomposición de Intención Humana a Celdas 8D', () => {
  const orchestrator = new OcteractOrchestratorEngine('.');

  // 1. Consulta coloquial de Vibe Coding
  const vibeDecomp = orchestrator.decomposeIntent('Quiero que la pantalla de login se vea moderna y no falle al guardar credenciales en la base de datos');
  assert.strictEqual(vibeDecomp.isTechnical, false);
  assert.ok(vibeDecomp.resonantCells.includes(CubicCell.Security), 'Debe resonar con Security');
  assert.ok(vibeDecomp.resonantCells.includes(CubicCell.Storage), 'Debe resonar con Storage');
  assert.ok(vibeDecomp.resonantCells.includes(CubicCell.CoreLogic), 'Debe resonar con CoreLogic');

  // 2. Consulta técnica de bug
  const techDecomp = orchestrator.decomposeIntent('Error de timeout HTTP en endpoint de red con promesas flotantes');
  assert.strictEqual(techDecomp.isTechnical, true);
  assert.strictEqual(techDecomp.intentCategory, 'bug_fix');
  assert.strictEqual(techDecomp.resonantCells[0], CubicCell.Network);
});

test('OcteractOrchestratorEngine: Fase de Diagnóstico y Generación de Micro-Dossier (< 200 tokens)', async () => {
  const space = new HypercubeSpace();

  space.addVertex({
    id: 'src/auth/service.ts',
    path: 'src/auth/service.ts',
    cell: CubicCell.Security,
    coordinate: [0.2, 0.2, 0.2, 0.2],
    hexCode: '0x2222',
    tokenEstimate: 200,
    lines: 50,
    dependencies: [],
    dependents: ['src/ui/login.ts'],
    symbols: [
      {
        name: 'validateUserToken',
        kind: 'function',
        lineStart: 10,
        lineEnd: 25,
        dependencies: [],
      },
    ],
  });

  space.addVertex({
    id: 'src/ui/login.ts',
    path: 'src/ui/login.ts',
    cell: CubicCell.UI,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    hexCode: '0x1111',
    tokenEstimate: 180,
    lines: 40,
    dependencies: ['src/auth/service.ts'],
    dependents: [],
    symbols: [
      {
        name: 'renderLoginForm',
        kind: 'function',
        lineStart: 5,
        lineEnd: 30,
        dependencies: [],
      },
    ],
  });

  const orchestrator = new OcteractOrchestratorEngine('.');
  const result = await orchestrator.orchestrate(space, {
    userIntent: 'El login de usuario tiene problemas con el token de seguridad',
    phase: 'diagnose',
  });

  assert.strictEqual(result.phase, 'diagnose');
  assert.ok(result.diagnostic, 'Debe incluir paso diagnóstico');
  assert.ok(result.diagnostic.foundFiles.length > 0, 'Debe localizar archivo pivote');
  assert.strictEqual(result.diagnostic.foundFiles[0].file, 'src/auth/service.ts');
  assert.ok(result.estimatedTokens < 300, 'Consumo de tokens ultra eficiente');
  assert.ok(result.microDossier.includes('validateUserToken'));
  assert.ok(result.vibeSummaryForHuman.length > 20, 'Explicación accesible para humanos');
});

test('OcteractOrchestratorEngine: Servidor MCP invoca octeract_orchestrate y alias tesseract_orchestrate', async () => {
  const server = new MCPServer({ rootDir: '/sdcard/Antigravity/IdeasMillonarias/TESSERACT-CONTEXT' });
  
  const res1 = await server.callTool('octeract_orchestrate', {
    userIntent: 'Optimizar el árbol de búsqueda en el octeracto 8D',
    phase: 'diagnose',
  });
  assert.ok(typeof res1 === 'string');
  assert.ok(res1.includes('Octeract Orchestrator'));

  const res2 = await server.callTool('tesseract_orchestrate', {
    userIntent: 'Auditar la salud de la arquitectura',
    phase: 'plan',
  });
  assert.ok(typeof res2 === 'string');
  assert.ok(res2.includes('Octeract Orchestrator'));
});
