import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractCardanGrilleFuzzer } from '../src/voynich/cardan-grille.ts';

test('OcteractCardanGrilleFuzzer: generates high-speed synthetic mutants in RAM (>1000/sec)', () => {
  const fuzzer = new OcteractCardanGrilleFuzzer();

  const sampleCode = `
    export function validateAccess(role: string, age: number, isVerified: boolean): boolean {
      if (role === 'admin' && isVerified) {
        return true;
      }
      if (age >= 18 && role !== 'guest') {
        return true;
      }
      return false;
    }
  `;

  const start = performance.now();
  const mutants = fuzzer.generateMutants(sampleCode, 20);
  const duration = performance.now() - start;

  assert.ok(mutants.length >= 5, `Debe generar al menos 5 mutantes válidos, generó ${mutants.length}`);
  assert.ok(duration < 50, `Generación en RAM debe tardar < 50ms, tardó ${duration.toFixed(2)}ms`);

  // Cada mutante debe contener una alteración de operador o valor
  for (const m of mutants) {
    assert.notEqual(m.mutatedCode, sampleCode);
    assert.ok(m.mutationDescription.length > 0);
    assert.ok(m.lineIndex >= 0);
  }
});

test('OcteractCardanGrilleFuzzer: fuzzes against test predicate and calculates mutation score', () => {
  const fuzzer = new OcteractCardanGrilleFuzzer();

  const code = `
    export function isAdult(age: number): boolean {
      return age >= 18;
    }
  `;

  // Simulamos una suite de tests rigurosa que prueba casos límite
  const strictTest = (mutatedCode: string) => {
    // Si el mutante cambia >= 18 por > 18 o < 18, debe fallar la aserción
    return mutatedCode.includes('age >= 18');
  };

  const report = fuzzer.fuzzAgainstTest(code, strictTest, 10);

  assert.ok(report.totalMutants > 0);
  assert.ok(report.killedMutants > 0, 'La suite estricta debe matar a los mutantes que alteran la condición');
  assert.ok(report.mutationScorePercent >= 50, 'El mutation score debe ser alto para una prueba estricta');
});
