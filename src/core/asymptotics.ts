/**
 * TESSERACT-CONTEXT: Asymptotic Complexity Engine (Eje PHI / Big-O)
 * Análisis estático determinista de complejidad asintótica en tiempo y espacio.
 * Detecta degradación cuadrática silenciosa O(N^2), bucles anidados y antipatrones de búsqueda.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type AsymptoticComplexity,
  type AsymptoticReport,
  type TopologicalFracture,
} from './types.ts';

export class AsymptoticAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Mapea una notación asintótica a una coordenada normalizada en el eje PHI [0, 1]
   */
  public static complexityToPhi(complexity: AsymptoticComplexity): number {
    switch (complexity) {
      case 'O(1)': return 0.10;
      case 'O(log N)': return 0.30;
      case 'O(N)': return 0.50;
      case 'O(N log N)': return 0.75;
      case 'O(N^2)': return 0.88;
      case 'O(2^N)': return 1.00;
      default: return 0.50;
    }
  }

  /**
   * Mapea una puntuación PHI a la notación asintótica más cercana
   */
  public static phiToComplexity(phi: number): AsymptoticComplexity {
    if (phi <= 0.20) return 'O(1)';
    if (phi <= 0.40) return 'O(log N)';
    if (phi <= 0.65) return 'O(N)';
    if (phi <= 0.80) return 'O(N log N)';
    if (phi <= 0.95) return 'O(N^2)';
    return 'O(2^N)';
  }

  /**
   * Analiza el contenido de un archivo de código y calcula su complejidad asintótica
   */
  public analyzeContent(content: string, filePath: string = 'memory.ts'): AsymptoticReport {
    const lines = content.split('\n');
    let maxLoopDepth = 0;
    let currentLoopDepth = 0;
    let hasQuadraticCollections = false;
    const suspiciousLines: { line: number; reason: string; complexity: AsymptoticComplexity }[] = [];

    // Patrones de inicio de iteración / bucle
    const loopStartRegex = /\b(for\s*\(|while\s*\(|for\s+await\s*\(|\.forEach\(|\.map\(|\.flatMap\(|\.filter\(|\.reduce\()/;
    // Operaciones O(N) sobre colecciones
    const linearCollectionOps = /\.(indexOf|includes|find|findIndex|some|every)\s*\(/;
    // Búsqueda de queries en BD dentro de bucles (patrón N+1)
    const nPlusOneQuery = /\.(query|findOne|findMany|fetch|select|get)\s*\(/;

    // Seguimiento de bloques de llaves
    let braceBalance = 0;
    const loopBraceStack: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Omitir comentarios de una línea
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        continue;
      }

      // Conteo de llaves
      for (const char of line) {
        if (char === '{') {
          braceBalance++;
        } else if (char === '}') {
          braceBalance--;
          if (loopBraceStack.length > 0 && braceBalance < loopBraceStack[loopBraceStack.length - 1]) {
            loopBraceStack.pop();
            currentLoopDepth = Math.max(0, currentLoopDepth - 1);
          }
        }
      }

      // Detección de bucles
      if (loopStartRegex.test(line)) {
        currentLoopDepth++;
        loopBraceStack.push(braceBalance);
        if (currentLoopDepth > maxLoopDepth) {
          maxLoopDepth = currentLoopDepth;
        }

        if (currentLoopDepth >= 2) {
          suspiciousLines.push({
            line: i + 1,
            reason: `Bucle anidado detectado (profundidad ${currentLoopDepth}) induciendo complejidad cuadrática O(N^${currentLoopDepth}).`,
            complexity: currentLoopDepth === 2 ? 'O(N^2)' : 'O(2^N)',
          });
        }
      }

      // Detección de operaciones O(N) dentro de bucles (degeneración cuadrática O(N^2))
      if (currentLoopDepth >= 1) {
        if (linearCollectionOps.test(line)) {
          hasQuadraticCollections = true;
          suspiciousLines.push({
            line: i + 1,
            reason: `Operación de búsqueda lineal O(N) dentro de un bucle activo: genera complejidad compuesta O(N^2). Use un Set o Map para búsqueda O(1).`,
            complexity: 'O(N^2)',
          });
        }

        if (nPlusOneQuery.test(line)) {
          hasQuadraticCollections = true;
          suspiciousLines.push({
            line: i + 1,
            reason: `Consulta de I/O o base de datos dentro de bucle (patrón N+1). Agrupe las consultas en batch.`,
            complexity: 'O(N^2)',
          });
        }
      }
    }

    // Determinar complejidad final
    let baselineComplexity: AsymptoticComplexity = 'O(1)';
    if (maxLoopDepth === 0) {
      baselineComplexity = 'O(1)';
    } else if (maxLoopDepth === 1 && !hasQuadraticCollections) {
      baselineComplexity = 'O(N)';
    } else if (maxLoopDepth === 2 || hasQuadraticCollections) {
      baselineComplexity = 'O(N^2)';
    } else {
      baselineComplexity = 'O(2^N)';
    }

    const phiScore = AsymptoticAnalyzer.complexityToPhi(baselineComplexity);

    return {
      filePath,
      baselineComplexity,
      asymptoticScore: phiScore,
      nestedLoopDepth: maxLoopDepth,
      hasQuadraticCollections,
      suspiciousLines,
      isDegraded: baselineComplexity === 'O(N^2)' || baselineComplexity === 'O(2^N)',
      recommendation: hasQuadraticCollections
        ? 'Reemplace las búsquedas lineales (.find, .includes) dentro de bucles por colecciones hash (Set/Map) con tiempo O(1).'
        : maxLoopDepth >= 2
        ? 'Aplane los bucles anidados utilizando índices de lookup precomputados o algoritmos Divide-and-Conquer.'
        : 'Complejidad asintótica dentro de cotas óptimas.',
    };
  }

  /**
   * Analiza un archivo en el disco
   */
  public analyzeFile(filePath: string): AsymptoticReport {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        filePath,
        baselineComplexity: 'O(1)',
        asymptoticScore: 0.10,
        nestedLoopDepth: 0,
        hasQuadraticCollections: false,
        suspiciousLines: [],
        isDegraded: false,
      };
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return this.analyzeContent(content, filePath);
  }

  /**
   * Compara una versión base con un cambio propuesto para detectar regresión asintótica
   */
  public detectRegression(
    originalContent: string,
    proposedContent: string,
    filePath: string
  ): { isDegraded: boolean; deltaPhi: number; fracture?: TopologicalFracture; report: AsymptoticReport } {
    const baseReport = this.analyzeContent(originalContent, filePath);
    const proposedReport = this.analyzeContent(proposedContent, filePath);

    const deltaPhi = proposedReport.asymptoticScore - baseReport.asymptoticScore;
    const isDegraded = deltaPhi >= 0.25 || (baseReport.asymptoticScore < 0.8 && proposedReport.asymptoticScore >= 0.88);

    proposedReport.proposedComplexity = proposedReport.baselineComplexity;
    proposedReport.baselineComplexity = baseReport.baselineComplexity;
    proposedReport.isDegraded = isDegraded;

    let fracture: TopologicalFracture | undefined;
    if (isDegraded) {
      fracture = {
        id: `ASYMP-${path.basename(filePath)}-${Date.now()}`,
        type: 'ASYMPTOTIC_DEGRADATION_FRACTURE',
        severity: 'CRITICAL',
        source: filePath,
        description: `Regresión Asintótica Silenciosa: el código degeneró de ${baseReport.baselineComplexity} a ${proposedReport.proposedComplexity} (ΔΦ = +${deltaPhi.toFixed(2)}). Se detectaron bucles anidados o lookups lineales en bucle.`,
        suggestedFix: proposedReport.recommendation,
        shearDistance: parseFloat(deltaPhi.toFixed(3)),
      };
    }

    return {
      isDegraded,
      deltaPhi: parseFloat(deltaPhi.toFixed(3)),
      fracture,
      report: proposedReport,
    };
  }
}
