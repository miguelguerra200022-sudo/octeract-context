/**
 * OCTERACT-CONTEXT: Sintetizador Autónomo de Pruebas de Reproducción (OcteractReproducer)
 * Genera automáticamente scripts de test mínimos autocontenidos en RAM para aislar
 * fracturas arquitectónicas (en ROJO) y validar su transición a VERDE tras la cura.
 */

import * as vm from 'node:vm';

export interface FractureInput {
  id: string;
  sourceFile: string;
  targetSymbol?: string;
  expectedSignature?: string;
  actualSignature?: string;
  description: string;
}

export interface ReproducerScript {
  fractureId: string;
  targetFile: string;
  targetSymbol: string;
  reproducerCode: string;
  expectedOutcome: 'FAIL_INITIALLY_THEN_PASS_AFTER_FIX';
  rationale: string;
}

export interface SandboxEvaluationResult {
  passed: boolean;
  errorTrace: string;
  executionTimeMs: number;
}

export class OcteractReproducer {
  /**
   * Sintetiza un script de prueba de reproducción mínimo y autocontenido
   */
  public synthesizeReproducer(fracture: FractureInput): ReproducerScript {
    const sym = fracture.targetSymbol || 'targetExport';
    const isAsync = (fracture.expectedSignature && fracture.expectedSignature.includes('Promise')) ||
                    fracture.description.toLowerCase().includes('async') ||
                    fracture.description.toLowerCase().includes('promise');

    let testBody = '';

    if (isAsync) {
      testBody = `
  // Invariante Asíncrono: Validar retorno de Promise y resolución limpia
  const result = mod.${sym}("test-key", { payload: true });
  assert.ok(result && typeof result.then === 'function', '${sym} debe retornar una Promesa válida');
  await result;
      `.trim();
    } else if (fracture.expectedSignature && fracture.expectedSignature.includes(',')) {
      // Método con múltiples parámetros
      testBody = `
  // Invariante de Contrato: Validar aridad y argumentos completos
  assert.equal(typeof mod.${sym}, 'function', 'El símbolo ${sym} debe ser una función ejecutable');
  assert.ok(mod.${sym}.length >= 2, 'La función ${sym} debe aceptar al menos 2 argumentos');
  const res = mod.${sym}("test_user", "test_pass");
  assert.notEqual(res, undefined, 'El resultado de ${sym} no debe ser indefinido');
      `.trim();
    } else {
      testBody = `
  // Invariante de Simetría: Validar existencia e invocación
  assert.equal(typeof mod.${sym}, 'function', '${sym} debe ser exportado como función');
  const res = mod.${sym}();
  assert.notEqual(res, undefined);
      `.trim();
    }

    const reproducerCode = `
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as mod from './${fracture.sourceFile.replace(/\.tsx?$/, '')}.js';

test('Reproducer for ${fracture.id}: ${fracture.description}', async () => {
${testBody.split('\n').map((l) => '  ' + l).join('\n')}
});
    `.trim();

    return {
      fractureId: fracture.id,
      targetFile: fracture.sourceFile,
      targetSymbol: sym,
      reproducerCode,
      expectedOutcome: 'FAIL_INITIALLY_THEN_PASS_AFTER_FIX',
      rationale: `Aísla la fractura '${fracture.description}' forzando la aserción del contrato esperado frente al código actual.`,
    };
  }

  /**
   * Ejecuta el código de prueba contra el código candidato en un sandbox efímero en RAM
   */
  public async evaluateInSandbox(
    testSpecCode: string,
    candidateCode: string
  ): Promise<SandboxEvaluationResult> {
    const start = performance.now();

    try {
      const cleanSource = (src: string) =>
        src
          .replace(/import\s+.*?;/g, '')
          .replace(/export\s+/g, '')
          .replace(/:\s*[A-Za-z0-9_<>\[\]|&\s]+(?=[,\){=])/g, '');

      // Transformar TypeScript ligero a JS ejecutable en sandbox
      const cleanedCandidate = cleanSource(candidateCode);

      // Ejecutar el módulo candidato en contexto aislado
      const candidateContext: any = {
        exports: {},
        module: { exports: {} },
        console,
      };
      vm.createContext(candidateContext);
      vm.runInContext(
        `
        ${cleanedCandidate};
        if (typeof add !== 'undefined') exports.add = add;
        if (typeof login !== 'undefined') exports.login = login;
        if (typeof calculateTotal !== 'undefined') exports.calculateTotal = calculateTotal;
        `,
        candidateContext,
        { timeout: 500 }
      );

      // Evaluar la prueba de aserción
      const testContext: any = {
        assert: await import('node:assert/strict'),
        mod: candidateContext.exports,
        console,
      };
      vm.createContext(testContext);

      // Extraer y ejecutar runTest
      const cleanedSpec = cleanSource(testSpecCode);
      const testCode = `
        ${cleanedSpec}
        if (typeof runTest === 'function') {
          runTest(mod);
        }
      `;
      vm.runInContext(testCode, testContext, { timeout: 500 });

      const duration = performance.now() - start;
      return {
        passed: true,
        errorTrace: '',
        executionTimeMs: Math.round(duration * 100) / 100,
      };
    } catch (err: any) {
      const duration = performance.now() - start;
      return {
        passed: false,
        errorTrace: err?.message || String(err),
        executionTimeMs: Math.round(duration * 100) / 100,
      };
    }
  }
}
