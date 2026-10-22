/**
 * OCTERACT-CONTEXT: Particionador de Dialectos Currier A vs B (Lenguajes de Voynich)
 * Clasifica archivos de código en Dialectos arquitectónicos diferenciados
 * (UI Declarativo, Núcleo Imperativo Asíncrono y Contratos Puros de Tipos)
 * ajustando dinámicamente las tolerancias de cizallamiento hiperdimensional.
 */

export type CurrierDialect =
  | 'DIALECT_A_DECLARATIVE_UI'
  | 'DIALECT_B_IMPERATIVE_CORE'
  | 'DIALECT_C_CONTRACT_TYPES';

export interface CurrierClassificationResult {
  filePath: string;
  dialect: CurrierDialect;
  confidence: number;
  recommendedShearTolerance: number;
  dialectFeatures: {
    declarativeScore: number;
    imperativeScore: number;
    contractScore: number;
  };
}

export class OcteractCurrierClassifier {
  /**
   * Clasifica un archivo de código según su huella léxica y estocástica de dialecto
   */
  public classify(filePath: string, content: string): CurrierClassificationResult {
    const raw = content.trim();
    if (!raw) {
      return {
        filePath,
        dialect: 'DIALECT_C_CONTRACT_TYPES',
        confidence: 1.0,
        recommendedShearTolerance: 0.05,
        dialectFeatures: { declarativeScore: 0, imperativeScore: 0, contractScore: 1 },
      };
    }

    let decScore = 0;
    let impScore = 0;
    let conScore = 0;

    // 1. Rasgos de Dialecto A (Declarativo / React / JSX / Vue / UI)
    if (/<[A-Za-z0-9_$]+(\s|>|\/)/.test(raw)) decScore += 4;
    if (/\b(className|onClick|onChange|props|render|useState|useEffect|useMemo|useCallback)\b/.test(raw)) decScore += 4;
    if (/\b(React|Vue|Component|style|css|html|template)\b/i.test(raw)) decScore += 3;
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || filePath.endsWith('.vue')) decScore += 3;

    // 2. Rasgos de Dialecto B (Imperativo / Async / Core / Algoritmos)
    if (/\b(async|await|Promise)\b/.test(raw)) impScore += 3;
    if (/\b(for\s*\(|while\s*\(|switch\s*\(|if\s*\()\b/.test(raw)) impScore += 3;
    if (/\b(try\s*\{|catch\s*\(|throw\s+new)\b/.test(raw)) impScore += 3;
    if (/\b(fs\.|Buffer\.|stream\.|http\.|socket\.|child_process|execSync)\b/.test(raw)) impScore += 4;
    if (/\b(class\s+[A-Za-z0-9_$]+\s*\{)/.test(raw)) impScore += 2;

    // 3. Rasgos de Dialecto C (Contratos / Tipos Puros)
    const typeCount = (raw.match(/\b(interface|type)\s+[A-Za-z0-9_$]+/g) || []).length;
    conScore += typeCount * 2.5;
    if (filePath.endsWith('.d.ts') || filePath.includes('types.ts')) conScore += 5;

    // Si casi no hay sentencias ejecutables (bucles, asignaciones, llamadas), favorecer Dialecto C
    const hasExecutableBody = /\b(return|await|while|for|if|try|const\s+[a-zA-Z0-9_$]+\s*=)\b/.test(raw);
    if (!hasExecutableBody && typeCount > 0) {
      conScore += 6;
      impScore = Math.max(0, impScore - 4);
      decScore = Math.max(0, decScore - 4);
    }

    const total = Math.max(1, decScore + impScore + conScore);
    const pDec = decScore / total;
    const pImp = impScore / total;
    const pCon = conScore / total;

    let dialect: CurrierDialect = 'DIALECT_B_IMPERATIVE_CORE';
    let maxP = pImp;
    let tolerance = 0.10;

    if (pDec > pImp && pDec > pCon) {
      dialect = 'DIALECT_A_DECLARATIVE_UI';
      maxP = pDec;
      tolerance = 0.25;
    } else if (pCon > pImp && pCon > pDec) {
      dialect = 'DIALECT_C_CONTRACT_TYPES';
      maxP = pCon;
      tolerance = 0.05;
    } else {
      dialect = 'DIALECT_B_IMPERATIVE_CORE';
      maxP = pImp;
      tolerance = 0.10;
    }

    return {
      filePath,
      dialect,
      confidence: parseFloat(Math.min(0.99, Math.max(0.5, maxP + 0.2)).toFixed(2)),
      recommendedShearTolerance: tolerance,
      dialectFeatures: {
        declarativeScore: decScore,
        imperativeScore: impScore,
        contractScore: conScore,
      },
    };
  }
}
