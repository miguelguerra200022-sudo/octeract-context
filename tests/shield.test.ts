import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { MCPServer } from '../src/mcp/server.ts';
import { runUniversalInit } from '../src/cli/init.ts';

test('Tesseract Shield: tesseract_safe_write bloquea mutaciones destructivas', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_shield');
  if (fs.existsSync(tempFixture)) {
    fs.rmSync(tempFixture, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const originalAuth = `
export class AuthService {
  constructor(private key: string) {}
  login(token: string): boolean {
    return token.length > 5;
  }
  validateSession(sessionId: string): boolean {
    return true;
  }
}
`;
  fs.writeFileSync(path.join(tempFixture, 'src', 'auth.ts'), originalAuth, 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  // Intento destructivo: borrar validateSession y constructor
  const blockedResult = await server.callTool('tesseract_safe_write', {
    targetPath: 'src/auth.ts',
    proposedContent: 'export class AuthService { login() { return true; } }',
  });

  assert.strictEqual(blockedResult.isSafe, false);
  assert.strictEqual(blockedResult.status, 'BLOCKED_BY_4D_SHIELD');
  assert.ok(blockedResult.shearDistance > 0.75);
  assert.ok(blockedResult.actionRequired.includes('ESCRITURA FÍSICAMENTE BLOQUEADA'));

  // Verificar que el disco NO fue alterado
  const diskContent = fs.readFileSync(path.join(tempFixture, 'src', 'auth.ts'), 'utf-8');
  assert.strictEqual(diskContent, originalAuth);

  // Limpiar
  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('Tesseract Shield: tesseract_safe_write permite cambios seguros bajo simetría 4D', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_safe');
  if (fs.existsSync(tempFixture)) {
    fs.rmSync(tempFixture, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const originalAuth = `
export class AuthService {
  constructor(private key: string) {}
  login(token: string): boolean {
    return token.length > 5;
  }
}
`;
  fs.writeFileSync(path.join(tempFixture, 'src', 'auth.ts'), originalAuth, 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  const safeContent = originalAuth + '\n// Comentario no destructivo que mantiene contratos\n';

  const safeResult = await server.callTool('tesseract_safe_write', {
    targetPath: 'src/auth.ts',
    proposedContent: safeContent,
  });

  assert.strictEqual(safeResult.isSafe, true);
  assert.strictEqual(safeResult.status, 'WRITTEN_SAFELY');
  assert.ok(safeResult.shearDistance < 0.75);

  // Verificar que el archivo sí se escribió
  const written = fs.readFileSync(path.join(tempFixture, 'src', 'auth.ts'), 'utf-8');
  assert.strictEqual(written, safeContent);

  // Limpiar
  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('Tesseract Init: Genera reglas autónomas y .mcp.json universal', async () => {
  const tempDir = path.join(import.meta.dirname, 'temp_init_test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  await runUniversalInit(tempDir);

  assert.ok(fs.existsSync(path.join(tempDir, '.mcp.json')));
  assert.ok(fs.existsSync(path.join(tempDir, 'AGENTS.md')));
  assert.ok(fs.existsSync(path.join(tempDir, '.cursorrules')));
  assert.ok(fs.existsSync(path.join(tempDir, '.windsurfrules')));
  assert.ok(fs.existsSync(path.join(tempDir, '.clinerules')));
  assert.ok(fs.existsSync(path.join(tempDir, '.tesseract', 'config.json')));

  const agentsMd = fs.readFileSync(path.join(tempDir, 'AGENTS.md'), 'utf-8');
  assert.ok(agentsMd.includes('TESSERACT 4D CONTEXT & AUTONOMOUS SHIELD PROTOCOL'));
  assert.ok(agentsMd.includes('tesseract_safe_write'));

  // Limpiar
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('Tesseract Shield: Bloquea truncamiento perezoso de IA (Eje X)', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_trunc');
  if (fs.existsSync(tempFixture)) fs.rmSync(tempFixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const initialCode = `export class UserService {\n  findUser(id: string) { return id; }\n  deleteUser(id: string) { return true; }\n}`;
  fs.writeFileSync(path.join(tempFixture, 'src', 'user.ts'), initialCode, 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  const truncatedCode = `export class UserService {\n  // ... rest of code\n}`;
  const result = await server.callTool('tesseract_safe_write', {
    targetPath: 'src/user.ts',
    proposedContent: truncatedCode,
  });

  assert.strictEqual(result.isSafe, false);
  assert.strictEqual(result.status, 'BLOCKED_BY_4D_SHIELD');
  assert.strictEqual(result.axes?.xSyntax?.isTruncated, true);
  assert.ok(result.axes?.xSyntax?.issues?.some((i: string) => i.includes('truncamiento')));

  // Disco sin cambios
  assert.strictEqual(fs.readFileSync(path.join(tempFixture, 'src', 'user.ts'), 'utf-8'), initialCode);
  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('Tesseract Shield: Bloquea bucles infinitos en micro-sandbox (Eje Z)', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_loop');
  if (fs.existsSync(tempFixture)) fs.rmSync(tempFixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const initialCode = `export function compute() { return 42; }`;
  fs.writeFileSync(path.join(tempFixture, 'src', 'compute.ts'), initialCode, 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  const infiniteLoopCode = `export function compute() {\n  while (true) {}\n}`;
  const result = await server.callTool('tesseract_safe_write', {
    targetPath: 'src/compute.ts',
    proposedContent: infiniteLoopCode,
  });

  assert.strictEqual(result.isSafe, false);
  assert.strictEqual(result.status, 'BLOCKED_BY_4D_SHIELD');
  assert.strictEqual(result.axes?.zRuntime?.passed, false);
  assert.ok(result.axes?.zRuntime?.issues?.some((i: string) => i.includes('Bucle infinito') || i.includes('Sandbox')));

  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('Tesseract Shield: Bloquea fuga de secretos con Entropía de Shannon (Eje W)', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_secret');
  if (fs.existsSync(tempFixture)) fs.rmSync(tempFixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  const initialCode = `export const config = { timeout: 5000 };`;
  fs.writeFileSync(path.join(tempFixture, 'src', 'config.ts'), initialCode, 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  const leakCode = `export const config = {\n  timeout: 5000,\n  apiKey: 'sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'\n};`;
  const result = await server.callTool('tesseract_safe_write', {
    targetPath: 'src/config.ts',
    proposedContent: leakCode,
  });

  assert.strictEqual(result.isSafe, false);
  assert.strictEqual(result.status, 'BLOCKED_BY_4D_SHIELD');
  assert.strictEqual(result.axes?.wSecurity?.passed, false);
  assert.ok(result.axes?.wSecurity?.leakedSecrets?.length > 0);

  fs.rmSync(tempFixture, { recursive: true, force: true });
});

test('MCPServer: Herramientas tesseract_blast_radius y tesseract_synthesize_patch', async () => {
  const tempFixture = path.join(import.meta.dirname, 'temp_fixture_mcp_tools');
  if (fs.existsSync(tempFixture)) fs.rmSync(tempFixture, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempFixture, 'src'), { recursive: true });

  fs.writeFileSync(path.join(tempFixture, 'src', 'auth.ts'), 'export class AuthService { login() { return true; } }', 'utf-8');

  const server = new MCPServer({ rootDir: tempFixture });
  await server.init();

  const blastResult = await server.callTool('tesseract_blast_radius', {
    targetFile: 'src/auth.ts',
    maxHops: 3,
  });

  assert.ok(blastResult.targetFile);
  assert.ok(blastResult.summaryPromptForAI.includes('BLAST RADIUS ANALYSIS'));

  const patchResult = await server.callTool('tesseract_synthesize_patch', {
    targetPath: 'src/auth.ts',
    symbolName: 'validateSession',
  });

  assert.ok(patchResult.patch.includes('validateSession'));

  fs.rmSync(tempFixture, { recursive: true, force: true });
});
