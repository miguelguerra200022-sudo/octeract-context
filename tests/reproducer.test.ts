import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractReproducer } from '../src/core/reproducer.ts';

describe('OcteractReproducer (Test-Driven Reproduction)', () => {
  test('synthesizes runnable ESM reproducer script for contract mismatch fracture', () => {
    const reproducer = new OcteractReproducer();
    const script = reproducer.synthesizeReproducer({
      id: 'FRACTURE_CONTRACT_001',
      sourceFile: 'src/services/auth.ts',
      targetSymbol: 'login',
      expectedSignature: 'login(user: string, pass: string): boolean',
      actualSignature: 'login(user: string): boolean',
      description: 'Missing second parameter pass: string in login method',
    });

    assert.ok(script.reproducerCode.includes('import'), 'Must contain ESM import');
    assert.ok(script.reproducerCode.includes('assert'), 'Must contain assert statement');
    assert.ok(script.reproducerCode.includes('login'), 'Must reference target symbol');
    assert.equal(script.expectedOutcome, 'FAIL_INITIALLY_THEN_PASS_AFTER_FIX');
    assert.equal(script.fractureId, 'FRACTURE_CONTRACT_001');
  });

  test('synthesizes reproducer for async unhandled promise fracture', () => {
    const reproducer = new OcteractReproducer();
    const script = reproducer.synthesizeReproducer({
      id: 'FRACTURE_ASYNC_002',
      sourceFile: 'src/db/storage.ts',
      targetSymbol: 'saveData',
      expectedSignature: 'saveData(key: string, val: any): Promise<void>',
      actualSignature: 'saveData(key: string, val: any): void',
      description: 'saveData returns void instead of awaiting Promise',
    });

    assert.ok(script.reproducerCode.includes('async'));
    assert.ok(script.reproducerCode.includes('Promise'));
    assert.ok(script.reproducerCode.includes('saveData'));
  });

  test('evaluates candidate patch against reproducer in ephemeral sandbox', async () => {
    const reproducer = new OcteractReproducer();

    const buggyCode = `
export function add(a: number): number {
  return a; // Bug: missing b
}
    `.trim();

    const fixedCode = `
export function add(a: number, b: number): number {
  return a + b;
}
    `.trim();

    const testSpec = `
import * as assert from 'node:assert/strict';
export function runTest(mod: any) {
  assert.equal(typeof mod.add, 'function');
  assert.equal(mod.add(2, 3), 5, 'add(2, 3) must equal 5');
}
    `.trim();

    const evalBuggy = await reproducer.evaluateInSandbox(testSpec, buggyCode);
    assert.equal(evalBuggy.passed, false, 'Buggy code must fail reproducer (RED)');
    assert.ok(evalBuggy.errorTrace.length > 0);

    const evalFixed = await reproducer.evaluateInSandbox(testSpec, fixedCode);
    assert.equal(evalFixed.passed, true, 'Fixed code must pass reproducer (GREEN)');
  });
});
