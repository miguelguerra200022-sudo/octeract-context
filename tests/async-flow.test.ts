import test from 'node:test';
import assert from 'node:assert';
import { AsyncFlowAnalyzer } from '../src/core/async-flow.ts';

test('AsyncFlowAnalyzer: Código sincrónico puro obtiene complejidad OMEGA mínima', () => {
  const analyzer = new AsyncFlowAnalyzer();
  const code = `
    export function calculateTax(amount: number): number {
      return amount * 0.16;
    }
  `;

  const report = analyzer.analyzeContent(code, 'tax.ts');
  assert.strictEqual(report.isSafe, true);
  assert.strictEqual(report.floatingPromisesCount, 0);
  assert.strictEqual(report.asyncComplexityScore, 0.10);
  assert.strictEqual(report.verdict, 'ASYNC_FLOW_SAFE');
});

test('AsyncFlowAnalyzer: Detecta trampa forEach(async) y promesas flotantes', () => {
  const analyzer = new AsyncFlowAnalyzer();
  const buggyCode = `
    export async function saveAll(items: Item[]) {
      // Antipatrón peligroso: forEach con callback async (se sale del loop antes de que terminen)
      items.forEach(async (item) => {
        await saveItem(item);
      });
      // Promesa flotante sin await ni catch
      sendTelemetryAsync();
    }
  `;

  const report = analyzer.analyzeContent(buggyCode, 'batch.ts');
  assert.strictEqual(report.isSafe, false);
  assert.ok(report.floatingPromisesCount >= 1);
  assert.ok(report.unhandledForks.length >= 1);
  assert.strictEqual(report.verdict, 'UNHANDLED_ASYNC_FORK_DETECTED');

  const fracture = analyzer.createFractureIfUnsafe(report);
  assert.ok(fracture);
  assert.strictEqual(fracture?.type, 'UNHANDLED_ASYNC_FRACTURE');
});
