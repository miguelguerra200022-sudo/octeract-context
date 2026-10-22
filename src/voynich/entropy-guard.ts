/**
 * OCTERACT-CONTEXT: Guardia de Entropía Condicional de Segundo Orden (h2)
 * Implementa el cálculo de Markov y entropía condicional de Bennett-Lindemann
 * del manuscrito Voynich para detectar alucinaciones y código basura/perezoso.
 */

export type EntropyVerdict = 'HEALTHY' | 'COLLAPSED_LAZY' | 'HYPER_CHAOTIC';

export interface EntropyReport {
  h1: number;             // Entropía de Shannon de 1er orden (bits/carácter)
  h2: number;             // Entropía condicional de 2do orden (bits/transición)
  verdict: EntropyVerdict;
  isSafe: boolean;
  details: string;
  charLength: number;
  uniqueBigrams: number;
}

export class OcteractEntropyGuard {
  /**
   * Calcula la entropía condicional de segundo orden h2 = H(C1, C2) - H(C1)
   */
  public computeSecondOrderEntropy(sourceText: string): EntropyReport {
    const text = sourceText.replace(/\r\n/g, '\n').trim();
    if (!text || text.length < 5) {
      return {
        h1: 0,
        h2: 0,
        verdict: 'HEALTHY',
        isSafe: true,
        details: 'Texto demasiado corto para análisis de bigramas.',
        charLength: text.length,
        uniqueBigrams: 0,
      };
    }

    const n = text.length;

    // 1. Frecuencias unigramas P(c)
    const unigrams: Map<string, number> = new Map();
    for (let i = 0; i < n; i++) {
      const c = text[i];
      unigrams.set(c, (unigrams.get(c) || 0) + 1);
    }

    let h1 = 0;
    for (const count of unigrams.values()) {
      const p = count / n;
      if (p > 0) h1 -= p * Math.log2(p);
    }

    // 2. Frecuencias bigramas P(c1, c2)
    const bigrams: Map<string, number> = new Map();
    for (let i = 0; i < n - 1; i++) {
      const bg = text[i] + text[i + 1];
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }

    let hJoint = 0;
    const numBigrams = n - 1;
    for (const count of bigrams.values()) {
      const p = count / numBigrams;
      if (p > 0) hJoint -= p * Math.log2(p);
    }

    // 3. Entropía condicional h2 = H(C1, C2) - H(C1)
    let h2 = Math.max(0, hJoint - h1);

    // Detección heurística de truncamiento perezoso repetitivo
    const hasLazyTruncation = new RegExp('\\/\\/' + '\\s*\\.\\.\\.\\s*rest of code', 'i').test(text);

    let verdict: EntropyVerdict = 'HEALTHY';
    let isSafe = true;
    let details = 'El código mantiene un equilibrio entrópico natural saludable.';

    if (h2 < 1.4 || hasLazyTruncation) {
      verdict = 'COLLAPSED_LAZY';
      isSafe = false;
      details = `Entropía condicional colapsada (h2=${h2.toFixed(2)} < 1.40). Patrón de código repetitivo, perezoso o truncado detectado.`;
    } else if (h1 > 5.5 || (h1 > 4.5 && h2 > 4.4)) {
      verdict = 'HYPER_CHAOTIC';
      isSafe = false;
      details = `Hiper-entropía detectada (h1=${h1.toFixed(2)}, h2=${h2.toFixed(2)}). Código caótico, posibles alucinaciones o símbolos aleatorios.`;
    }

    return {
      h1: parseFloat(h1.toFixed(3)),
      h2: parseFloat(h2.toFixed(3)),
      verdict,
      isSafe,
      details,
      charLength: n,
      uniqueBigrams: bigrams.size,
    };
  }
}
