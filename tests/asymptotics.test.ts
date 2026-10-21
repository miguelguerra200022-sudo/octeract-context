import test from 'node:test';
import assert from 'node:assert';
import { AsymptoticAnalyzer } from '../src/core/asymptotics.ts';

test('AsymptoticAnalyzer: Detecta complejidad O(1) en código constante', () => {
  const analyzer = new AsymptoticAnalyzer();
  const code = `
    export function getStatus(code: number): string {
      const map: Record<number, string> = { 200: 'OK', 404: 'NotFound' };
      return map[code] || 'Unknown';
    }
  `;

  const report = analyzer.analyzeContent(code, 'status.ts');
  assert.strictEqual(report.baselineComplexity, 'O(1)');
  assert.strictEqual(report.nestedLoopDepth, 0);
  assert.strictEqual(report.hasQuadraticCollections, false);
  assert.strictEqual(report.isDegraded, false);
});

test('AsymptoticAnalyzer: Detecta complejidad lineal O(N) en bucle simple', () => {
  const analyzer = new AsymptoticAnalyzer();
  const code = `
    export function sum(items: number[]): number {
      let total = 0;
      for (const item of items) {
        total += item;
      }
      return total;
    }
  `;

  const report = analyzer.analyzeContent(code, 'sum.ts');
  assert.strictEqual(report.baselineComplexity, 'O(N)');
  assert.strictEqual(report.nestedLoopDepth, 1);
  assert.strictEqual(report.hasQuadraticCollections, false);
  assert.strictEqual(report.isDegraded, false);
});

test('AsymptoticAnalyzer: Detecta degeneración cuadrática O(N^2) y emite fractura', () => {
  const analyzer = new AsymptoticAnalyzer();
  const originalCode = `
    export function findUsers(users: User[], ids: Set<string>): User[] {
      return users.filter(u => ids.has(u.id));
    }
  `;

  const proposedCode = `
    export function findUsers(users: User[], ids: string[]): User[] {
      // IA perezosa reemplazó Set.has por Array.includes dentro de filter (O(N^2))
      return users.filter(u => ids.includes(u.id));
    }
  `;

  const { isDegraded, deltaPhi, fracture, report } = analyzer.detectRegression(
    originalCode,
    proposedCode,
    'users.ts'
  );

  assert.strictEqual(isDegraded, true);
  assert.ok(deltaPhi >= 0.25, `deltaPhi esperado >= 0.25, recibido: ${deltaPhi}`);
  assert.strictEqual(report.hasQuadraticCollections, true);
  assert.strictEqual(report.proposedComplexity, 'O(N^2)');
  assert.ok(fracture);
  assert.strictEqual(fracture?.type, 'ASYMPTOTIC_DEGRADATION_FRACTURE');
  assert.strictEqual(fracture?.severity, 'CRITICAL');
});
