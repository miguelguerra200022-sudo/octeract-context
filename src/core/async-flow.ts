/**
 * TESSERACT-CONTEXT: Async Flow & Event Loop Dynamics Engine (Eje OMEGA)
 * Análisis estático de microtasks, promesas flotantes (floating promises)
 * y condiciones de carrera en el event loop.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type AsyncFlowReport,
  type TopologicalFracture,
} from './types.ts';

export class AsyncFlowAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Analiza el flujo asíncrono en el código fuente
   */
  public analyzeContent(content: string, filePath: string = 'memory.ts'): AsyncFlowReport {
    const lines = content.split('\n');
    const unhandledForks: { line: number; expression: string }[] = [];
    const asyncRaceRisks: { line: number; variable: string; reason: string }[] = [];
    let floatingPromisesCount = 0;
    let hasAsync = false;

    // Patrón clásico de trampa async: forEach con async callback
    const forEachAsyncRegex = /\.forEach\s*\(\s*async\s*(\([^)]*\)|\w+)\s*=>/;
    // Patrón de promesa flotante sin await ni return
    const floatingCallRegex = /^\s*(?!await\b|return\b|const\b|let\b|var\b|void\b|if\b|\/\/|\*|\/\*)([a-zA-Z0-9_$]+Async|[a-zA-Z0-9_$.]+\.(fetch|save|send|write|delete|update|exec|run|query|commit)\s*\([^)]*\))\s*;?$/;

    // Seguimiento de variables mutadas dentro de bloques async
    let inAsyncFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (/\basync\b/.test(line)) {
        hasAsync = true;
        inAsyncFunction = true;
      }

      // 1. Detección de la Trampa forEach(async)
      if (forEachAsyncRegex.test(line)) {
        unhandledForks.push({
          line: i + 1,
          expression: trimmed,
        });
        floatingPromisesCount++;
      }

      // 2. Detección de Llamadas Asíncronas Flotantes (Floating Promises)
      if (floatingCallRegex.test(line)) {
        unhandledForks.push({
          line: i + 1,
          expression: trimmed,
        });
        floatingPromisesCount++;
      }

      // 3. Detección de condiciones de carrera sobre contadores/colecciones globales
      if (inAsyncFunction && /\b(this\.\w+|\w+)\s*(\+\+|--|\+=|-=)\s*/.test(line)) {
        const match = line.match(/\b(this\.\w+|\w+)\s*(\+\+|--|\+=|-=)/);
        if (match && !/for\s*\(/.test(line)) {
          asyncRaceRisks.push({
            line: i + 1,
            variable: match[1],
            reason: `Mutación asíncrona no atómica de '${match[1]}' dentro de contexto async sin mecanismo de sincronización.`,
          });
        }
      }
    }

    let asyncScore = 0.10; // Base sincrónico puro
    if (hasAsync) {
      asyncScore = 0.50;
      if (floatingPromisesCount > 0) {
        asyncScore += Math.min(0.40, floatingPromisesCount * 0.15);
      }
      if (asyncRaceRisks.length > 0) {
        asyncScore += 0.10;
      }
    }
    asyncScore = Math.min(1.0, asyncScore);

    const isSafe = floatingPromisesCount === 0 && asyncRaceRisks.length === 0;
    const verdict = isSafe ? 'ASYNC_FLOW_SAFE' : 'UNHANDLED_ASYNC_FORK_DETECTED';

    const recommendation = !isSafe
      ? 'Asegure todas las promesas usando await, Promise.all() o void explícito. Reemplace .forEach(async) por for...of o Promise.all(.map()).'
      : 'Flujo asíncrono seguro y determinista.';

    return {
      filePath,
      asyncComplexityScore: parseFloat(asyncScore.toFixed(3)),
      floatingPromisesCount,
      unhandledForks,
      asyncRaceRisks,
      isSafe,
      verdict,
      recommendation,
    };
  }

  /**
   * Analiza un archivo físico
   */
  public analyzeFile(filePath: string): AsyncFlowReport {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        filePath,
        asyncComplexityScore: 0.10,
        floatingPromisesCount: 0,
        unhandledForks: [],
        asyncRaceRisks: [],
        isSafe: true,
        verdict: 'ASYNC_FLOW_SAFE',
      };
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return this.analyzeContent(content, filePath);
  }

  /**
   * Genera una fractura topológica si se detecta un fork asíncrono no gestionado
   */
  public createFractureIfUnsafe(report: AsyncFlowReport): TopologicalFracture | undefined {
    if (!report.isSafe) {
      return {
        id: `ASYNC-${path.basename(report.filePath)}-${Date.now()}`,
        type: 'UNHANDLED_ASYNC_FRACTURE',
        severity: report.floatingPromisesCount > 2 ? 'CRITICAL' : 'HIGH',
        source: report.filePath,
        description: `Bifurcación Asíncrona Peligrosa: se detectaron ${report.floatingPromisesCount} promesas flotantes sin await / forEach(async) y ${report.asyncRaceRisks.length} riesgos de condición de carrera en el event loop.`,
        suggestedFix: report.recommendation,
        shearDistance: parseFloat(report.asyncComplexityScore.toFixed(3)),
      };
    }
    return undefined;
  }
}
