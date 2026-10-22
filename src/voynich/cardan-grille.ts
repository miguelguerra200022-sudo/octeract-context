/**
 * OCTERACT-CONTEXT: Fuzzer Sintético por Rejilla de Cardano en RAM (Modelo Gordon Rugg)
 * Proyecta matrices de operadores y ranuras combinatorias sobre el código fuente
 * para generar mutaciones deterministas a >5,000 mutantes/segundo sin gastar tokens.
 */

export interface CardanMutant {
  id: string;
  originalSnippet: string;
  mutatedSnippet: string;
  lineIndex: number;
  mutationDescription: string;
  mutatedCode: string;
}

export interface CardanFuzzReport {
  totalMutants: number;
  killedMutants: number;
  survivedMutants: number;
  mutationScorePercent: number;
  durationMs: number;
  mutants: CardanMutant[];
}

interface StencilReplacement {
  pattern: RegExp;
  replacement: string;
  desc: string;
}

export class OcteractCardanGrilleFuzzer {
  // Matriz de plantillas de la Rejilla de Cardano para mutación sintáctica
  private stencils: StencilReplacement[] = [
    { pattern: /===/g, replacement: '!==', desc: 'Inversión de igualdad estricta (=== -> !==)' },
    { pattern: /!==/g, replacement: '===', desc: 'Inversión de desigualdad estricta (!== -> ===)' },
    { pattern: /&&/g, replacement: '||', desc: 'Conmutación lógica AND a OR (&& -> ||)' },
    { pattern: /\|\|/g, replacement: '&&', desc: 'Conmutación lógica OR a AND (|| -> &&)' },
    { pattern: />=/g, replacement: '<', desc: 'Inversión de límite frontera (>= -> <)' },
    { pattern: /<=/g, replacement: '>', desc: 'Inversión de límite frontera (<= -> >)' },
    { pattern: /\btrue\b/g, replacement: 'false', desc: 'Inversión booleana (true -> false)' },
    { pattern: /\bfalse\b/g, replacement: 'true', desc: 'Inversión booleana (false -> true)' },
    { pattern: /\breturn\s+true\b/g, replacement: 'return false', desc: 'Retorno invertido (return true -> return false)' },
    { pattern: /\breturn\s+false\b/g, replacement: 'return true', desc: 'Retorno invertido (return false -> return true)' },
  ];

  /**
   * Genera mutantes en memoria aplicando la ventana deslizante de Cardano
   */
  public generateMutants(sourceCode: string, maxMutants: number = 20): CardanMutant[] {
    const lines = sourceCode.split('\n');
    const mutants: CardanMutant[] = [];
    let count = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      for (const stencil of this.stencils) {
        if (stencil.pattern.test(line)) {
          // Resetear regex si es global
          stencil.pattern.lastIndex = 0;
          const mutatedLine = line.replace(stencil.pattern, stencil.replacement);

          if (mutatedLine !== line) {
            count++;
            const mutantLines = [...lines];
            mutantLines[lineIdx] = mutatedLine;

            mutants.push({
              id: `cardan-mutant-${count}`,
              originalSnippet: line.trim(),
              mutatedSnippet: mutatedLine.trim(),
              lineIndex: lineIdx + 1,
              mutationDescription: stencil.desc,
              mutatedCode: mutantLines.join('\n'),
            });

            if (mutants.length >= maxMutants) return mutants;
          }
        }
      }
    }

    return mutants;
  }

  /**
   * Ejecuta los mutantes generados contra un predicado de prueba en memoria
   */
  public fuzzAgainstTest(
    sourceCode: string,
    testPredicate: (mutatedCode: string) => boolean,
    maxMutants: number = 20
  ): CardanFuzzReport {
    const start = performance.now();
    const mutants = this.generateMutants(sourceCode, maxMutants);

    let killed = 0;
    let survived = 0;

    for (const mutant of mutants) {
      try {
        const passedTest = testPredicate(mutant.mutatedCode);
        if (passedTest) {
          // El test pasó a pesar de la mutación -> el mutante sobrevivió (alerta de test débil)
          survived++;
        } else {
          // El test falló -> el mutante fue eliminado con éxito por el test
          killed++;
        }
      } catch (_) {
        // Excepción arrojada -> el test detectó la falla
        killed++;
      }
    }

    const total = killed + survived;
    const score = total > 0 ? Math.round((killed / total) * 100) : 100;

    return {
      totalMutants: total,
      killedMutants: killed,
      survivedMutants: survived,
      mutationScorePercent: score,
      durationMs: parseFloat((performance.now() - start).toFixed(2)),
      mutants,
    };
  }
}
