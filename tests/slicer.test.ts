import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractProgramSlicer } from '../src/core/slicer.ts';

describe('OcteractProgramSlicer (Weiser Algorithm)', () => {
  test('computes backward slice isolating only statements that affect target variable', () => {
    const code = `
function calculateMetrics(a: number, b: number) {
  let unused1 = 100;
  let x = a + 1;
  let unused2 = unused1 * 2;
  let result = x * b;
  console.log("debug", unused2);
  return result;
}
    `.trim();

    const slicer = new OcteractProgramSlicer();
    const slice = slicer.computeSlice(code, {
      targetVariable: 'result',
      direction: 'backward',
    });

    assert.ok(slice.slicedCode.includes('let x = a + 1;'), 'Should include definition of x');
    assert.ok(slice.slicedCode.includes('let result = x * b;'), 'Should include definition of result');
    assert.ok(!slice.slicedCode.includes('unused1'), 'Should strip unused1');
    assert.ok(!slice.slicedCode.includes('unused2'), 'Should strip unused2');
    assert.ok(!slice.slicedCode.includes('console.log("debug"'), 'Should strip debug logs');
    assert.ok(slice.tokenReductionPercent > 30, `Expected token reduction > 30%, got ${slice.tokenReductionPercent}%`);
    assert.equal(slice.direction, 'backward');
  });

  test('computes forward slice tracking impact of a modified variable', () => {
    const code = `
function processOrder(price: number, taxRate: number) {
  let tax = price * taxRate;
  let total = price + tax;
  let shipping = 10;
  let discount = 5;
  let finalPrice = total - discount;
  return { finalPrice, shipping };
}
    `.trim();

    const slicer = new OcteractProgramSlicer();
    const slice = slicer.computeSlice(code, {
      targetVariable: 'tax',
      direction: 'forward',
    });

    assert.ok(slice.slicedCode.includes('let tax = price * taxRate;'));
    assert.ok(slice.slicedCode.includes('let total = price + tax;'));
    assert.ok(slice.slicedCode.includes('let finalPrice = total - discount;'));
    assert.ok(!slice.slicedCode.includes('let shipping = 10;'));
    assert.equal(slice.direction, 'forward');
  });

  test('slices within a specific method in a TypeScript class', () => {
    const code = `
export class OrderService {
  private cache: Map<string, any> = new Map();

  calculateTotal(items: number[], tax: number): number {
    let debugCount = items.length;
    let subtotal = items.reduce((acc, x) => acc + x, 0);
    let auditLog = "calculating";
    let total = subtotal * (1 + tax);
    return total;
  }

  otherMethod(): void {
    console.log("other");
  }
}
    `.trim();

    const slicer = new OcteractProgramSlicer();
    const slice = slicer.computeSlice(code, {
      targetSymbol: 'calculateTotal',
      targetVariable: 'total',
      direction: 'backward',
    });

    assert.ok(slice.slicedCode.includes('calculateTotal'));
    assert.ok(slice.slicedCode.includes('let subtotal ='));
    assert.ok(slice.slicedCode.includes('let total ='));
    assert.ok(!slice.slicedCode.includes('debugCount'));
    assert.ok(!slice.slicedCode.includes('auditLog'));
  });
});
