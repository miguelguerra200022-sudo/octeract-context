/**
 * OCTERACT UNIFIED FACADE: Apertura Maestra 5 (Motor Semántico de Preguntas)
 * OcteractAsk: Respuestas Geodésicas en Lenguaje Natural con Enlaces Exactos de Código (< 300 tokens)
 */

import * as path from 'node:path';
import { ProjectIndexer } from '../core/indexer.ts';
import { FlowTracer } from '../core/flow.ts';
import { OcteractGrepEngine } from '../core/grep.ts';
import type { OcteractAskOptions, OcteractAskResult } from './types.ts';

export class OcteractAsk {
  /**
   * Responde una pregunta en lenguaje natural sobre el repositorio entregando
   * archivos exactos, líneas y símbolos clave en < 300 tokens.
   */
  public static async query(
    question: string,
    options: OcteractAskOptions = {}
  ): Promise<OcteractAskResult> {
    const root = path.resolve(options.rootDir || '.');
    const indexer = new ProjectIndexer();
    if (!indexer.loadIndex(root)) {
      indexer.indexDirectory({ rootDir: root });
    }

    const space = indexer.getSpace();
    const auditReport = indexer.getAuditReport();
    const fractures = auditReport ? auditReport.fractures : [];

    // 1. Trazado Causal Geodésico 4D/8D
    const trace = FlowTracer.trace(space, question, fractures);

    // 2. Grep Semántico 8D BM25F + Símbolos
    const grepEngine = new OcteractGrepEngine(root);
    const grepRes = await grepEngine.search(space, {
      query: question,
      mode: 'auto',
      maxResults: options.maxResults || 5,
      contextLines: 1,
      includeSnippets: true,
    });

    // 3. Extraer símbolos y archivos relevantes
    const keySymbolsSet = new Set<string>();
    const relevantFilesMap = new Map<string, { path: string; score: number; lines: number[]; snippet?: string }>();

    // Desde el flujo geodésico
    for (const step of trace.flowSteps.slice(0, 4)) {
      const p = step.path.replace(/\\/g, '/');
      if (!relevantFilesMap.has(p)) {
        relevantFilesMap.set(p, {
          path: p,
          score: 80 - step.index * 10,
          lines: [],
        });
      }
      for (const sym of step.keySymbols) {
        keySymbolsSet.add(sym.name);
        if (sym.lineStart) {
          relevantFilesMap.get(p)!.lines.push(sym.lineStart);
        }
      }
    }

    // Desde el motor grep
    for (const match of grepRes.matches) {
      const p = match.file.replace(/\\/g, '/');
      if (!relevantFilesMap.has(p)) {
        relevantFilesMap.set(p, {
          path: p,
          score: Math.round(match.score * 10),
          lines: [match.line],
          snippet: match.lineContent.trim(),
        });
      } else {
        const entry = relevantFilesMap.get(p)!;
        if (!entry.lines.includes(match.line)) {
          entry.lines.push(match.line);
        }
        if (!entry.snippet) entry.snippet = match.lineContent.trim();
      }
      if (match.enclosingSymbol) {
        keySymbolsSet.add(match.enclosingSymbol.name);
      }
    }

    const relevantFiles = Array.from(relevantFilesMap.values()).slice(0, 5);
    const keySymbols = Array.from(keySymbolsSet).slice(0, 8);

    // 4. Sintetizar respuesta directa concisa (< 300 tokens)
    let answer = trace.directAnswerForAI;
    if (!answer || answer.length < 20) {
      if (relevantFiles.length > 0) {
        answer = `La funcionalidad consultada se gestiona principalmente en [${relevantFiles.map((f) => path.basename(f.path)).join(', ')}] mediante los símbolos ${keySymbols.slice(0, 4).join(', ')}.`;
      } else {
        answer = `No se detectó un flujo causal explícito para "${question}". Intenta con términos arquitectónicos más específicos.`;
      }
    }

    const topFile = relevantFiles[0]?.path;
    const topSym = keySymbols[0];
    const suggestedAction = topFile
      ? `octeract see ${topFile}${topSym ? ` ${topSym}` : ''}`
      : undefined;

    return {
      query: question,
      answer,
      relevantFiles,
      keySymbols,
      suggestedAction,
    };
  }
}
