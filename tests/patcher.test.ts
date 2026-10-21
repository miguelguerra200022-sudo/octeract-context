import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractSpeculativePatcher } from '../src/core/patcher.ts';

describe('OcteractSpeculativePatcher (AST Grafting)', () => {
  test('replaces targeted method inside class cleanly preserving comments and other methods', () => {
    const original = `
// Important authentication logic
export class AuthService {
  // Check user credentials
  login(u: string, p: string): boolean {
    return false;
  }

  logout(): void {
    console.log("bye");
  }
}
    `.trim();

    const patcher = new OcteractSpeculativePatcher();
    const result = patcher.graftMethod(
      original,
      'AuthService',
      'login',
      `  login(u: string, p: string): boolean {\n    return u === 'admin' && p === 'secret';\n  }`
    );

    assert.ok(result.success, 'Graft should succeed');
    assert.ok(result.patchedCode.includes("u === 'admin'"), 'Must contain updated logic');
    assert.ok(result.patchedCode.includes('// Important authentication logic'), 'Preserve header comment');
    assert.ok(result.patchedCode.includes('logout(): void'), 'Preserve neighboring methods');
    assert.ok(!result.patchedCode.includes('return false;'), 'Old method body must be replaced');
    assert.ok(result.diff.includes('+'), 'Must produce unified diff');
  });

  test('replaces standalone exported function atomically', () => {
    const original = `
import { config } from './config.js';

export function calculateTax(amount: number): number {
  return amount * 0.1;
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2);
}
    `.trim();

    const patcher = new OcteractSpeculativePatcher();
    const result = patcher.graftFunction(
      original,
      'calculateTax',
      `export function calculateTax(amount: number, rate: number = 0.15): number {\n  return amount * rate;\n}`
    );

    assert.ok(result.success);
    assert.ok(result.patchedCode.includes('rate: number = 0.15'));
    assert.ok(result.patchedCode.includes('export function formatCurrency'));
  });

  test('handles non-existent target gracefully returning error', () => {
    const original = `export class Sample { run() {} }`;
    const patcher = new OcteractSpeculativePatcher();
    const result = patcher.graftMethod(original, 'Sample', 'nonExistentMethod', `foo() {}`);

    assert.equal(result.success, false);
    assert.ok(result.error?.includes('not found'));
  });
});
