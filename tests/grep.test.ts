import { test } from 'node:test';
import * as assert from 'node:assert';
import { OcteractGrepEngine } from '../src/core/grep.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell } from '../src/core/types.ts';
import { MCPServer } from '../src/mcp/server.ts';

test('OcteractGrepEngine: Descomposición de identificadores (CamelCase, PascalCase, snake_case)', () => {
  const tokens1 = OcteractGrepEngine.splitCodeIdentifiers('handleUserLoginSession');
  assert.deepStrictEqual(tokens1.sort(), ['handle', 'login', 'session', 'user'].sort());

  const tokens2 = OcteractGrepEngine.splitCodeIdentifiers('SQL_Database_Repository_Impl');
  assert.ok(tokens2.includes('sql'));
  assert.ok(tokens2.includes('database'));
  assert.ok(tokens2.includes('repository'));
  assert.ok(tokens2.includes('impl'));
});

test('OcteractGrepEngine: Tokenización en lenguaje natural y expansión semántica', () => {
  const query = '¿Me puedes buscar el login y cómo autenticar usuario?';
  const { originalTerms, expandedTerms } = OcteractGrepEngine.tokenizeNaturalQuery(query);

  assert.ok(originalTerms.includes('login'), 'Debe incluir login');
  assert.ok(originalTerms.includes('autenticar'), 'Debe incluir autenticar');
  assert.ok(originalTerms.includes('usuario'), 'Debe incluir usuario');
  assert.ok(!originalTerms.includes('puedes'), 'Stopword filtrada');
  assert.ok(!originalTerms.includes('como'), 'Stopword filtrada');

  // Expansión semántica
  assert.ok(expandedTerms.includes('auth'), 'Debe expandir a auth');
  assert.ok(expandedTerms.includes('session'), 'Debe expandir a session');
  assert.ok(expandedTerms.includes('credential'), 'Debe expandir a credential');
});

test('OcteractGrepEngine: Búsqueda Semántica con Resonancia 8D y Micro-Snippets', async () => {
  const space = new HypercubeSpace();

  space.addVertex({
    id: 'src/auth/loginService.ts',
    path: 'src/auth/loginService.ts',
    cell: CubicCell.Security,
    coordinate: [0.1, 0.1, 0.1, 0.1],
    hexCode: '0x1111',
    tokenEstimate: 200,
    lines: 50,
    dependencies: [],
    dependents: [],
    symbols: [
      {
        name: 'authenticateUserCredentials',
        kind: 'method',
        signature: '(username: string, password: string): Promise<SessionToken>',
        lineStart: 12,
        lineEnd: 30,
        dependencies: [],
      },
    ],
  });

  space.addVertex({
    id: 'src/db/userStorage.ts',
    path: 'src/db/userStorage.ts',
    cell: CubicCell.Storage,
    coordinate: [0.8, 0.8, 0.8, 0.8],
    hexCode: '0x8888',
    tokenEstimate: 300,
    lines: 70,
    dependencies: [],
    dependents: [],
    symbols: [
      {
        name: 'saveUserDataRecord',
        kind: 'method',
        signature: '(id: string, data: any): void',
        lineStart: 5,
        lineEnd: 25,
        dependencies: [],
      },
    ],
  });

  const grep = new OcteractGrepEngine('.');
  const result = await grep.search(space, {
    query: '¿Dónde se realiza el login y autenticación de credenciales?',
    mode: 'semantic',
  });

  assert.ok(result.totalMatches > 0, 'Debe encontrar coincidencias');
  const topMatch = result.matches[0];
  assert.strictEqual(topMatch.file, 'src/auth/loginService.ts');
  assert.strictEqual(topMatch.cell, CubicCell.Security);
  assert.strictEqual(topMatch.enclosingSymbol?.name, 'authenticateUserCredentials');
  assert.ok(topMatch.score > 5, 'Puntuación ponderada con resonancia 8D');
  assert.ok(result.estimatedTokens < 300, 'Presupuesto ultra eficiente de tokens');
  assert.ok(result.markdownDossier.includes('authenticateUserCredentials'));
});

test('OcteractGrepEngine: Servidor MCP maneja octeract_grep y aliases tesseract_grep / octeract_search', async () => {
  const server = new MCPServer({ rootDir: '/sdcard/Antigravity/IdeasMillonarias/TESSERACT-CONTEXT' });
  
  (server as any).space.addVertex({
    id: 'src/network/client.ts',
    path: 'src/network/client.ts',
    cell: CubicCell.Network,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    hexCode: '0x5555',
    tokenEstimate: 150,
    lines: 40,
    dependencies: [],
    dependents: [],
    symbols: [
      {
        name: 'dispatchHttpRequest',
        kind: 'function',
        lineStart: 8,
        lineEnd: 22,
        dependencies: [],
      },
    ],
  });

  const res1 = await server.callTool('octeract_grep', { query: 'dispatchHttpRequest', mode: 'exact' });
  assert.ok(typeof res1 === 'string');
  assert.ok(res1.includes('dispatchHttpRequest'));

  const res2 = await server.callTool('tesseract_grep', { query: 'dispatchHttpRequest' });
  assert.ok(typeof res2 === 'string');
  assert.ok(res2.includes('dispatchHttpRequest'));

  const res3 = await server.callTool('octeract_search', { query: 'dispatchHttpRequest' });
  assert.ok(typeof res3 === 'string');
  assert.ok(res3.includes('dispatchHttpRequest'));
});
