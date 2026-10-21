import test from 'node:test';
import assert from 'node:assert';
import { CausalInferenceEngine } from '../src/core/causality.ts';

test('CausalInferenceEngine: Intervención limpia y causalmente sólida', () => {
  const engine = new CausalInferenceEngine();
  const orig = `
    export function processOrder(order: Order) {
      return order.total * 1.15;
    }
  `;
  const cleanPatch = `
    + export function processOrder(order: Order) {
    +   if (!order || typeof order.total !== 'number') {
    +     throw new Error('Invalid order invariant');
    +   }
    +   return order.total * 1.15;
    + }
  `;

  const report = engine.evaluateIntervention('order.ts', orig, cleanPatch);
  assert.strictEqual(report.isSymptomaticPatch, false);
  assert.strictEqual(report.backDoorCriterionSatisfied, true);
  assert.strictEqual(report.verdict, 'CAUSALLY_SOUND');
  assert.ok(report.causalStabilityScore >= 0.70);
});

test('CausalInferenceEngine: Detecta parche sintomático / correlación espuria', () => {
  const engine = new CausalInferenceEngine();
  const orig = `
    export function renderUser(user: User) {
      return '<h1>' + user.profile.name + '</h1>';
    }
  `;
  // IA introduce antipatrón de try-catch swallow o guard superficial enmascarando el error
  const symptomaticPatch = `
    + export function renderUser(user: User) {
    +   try {
    +     return '<h1>' + user.profile.name + '</h1>';
    +   } catch (e) {
    +     return '';
    +   }
    + }
  `;

  const report = engine.evaluateIntervention('userView.ts', orig, symptomaticPatch);
  assert.strictEqual(report.isSymptomaticPatch, true);
  assert.strictEqual(report.backDoorCriterionSatisfied, false);
  assert.strictEqual(report.verdict, 'SPURIOUS_CORRELATION_DETECTED');

  const fracture = engine.createFractureIfSpurious(report);
  assert.ok(fracture);
  assert.strictEqual(fracture?.type, 'SPURIOUS_CORRELATION_FRACTURE');
});
