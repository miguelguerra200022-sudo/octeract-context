/**
 * TESSERACT-CONTEXT: Motor Transaccional de Autocuración y Verificación en RAM (Transactional Healer)
 * Evalúa arreglos en espacios clonados efímeros, calcula deltas de fracturas y ejecuta rollbacks automáticos
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { HypercubeSpace } from './hypercube.ts';
import { TopologicalAuditor } from './auditor.ts';
import { TesseractShieldSecurity } from './security.ts';
import { TypeScriptParser } from '../parsers/ts-parser.ts';
import {
  CubicCell,
  type HealTrialResult,
  type AutoHealResult,
  type TopologicalFracture,
  type AuditReport,
  type HyperVertex,
  type Point4D,
} from './types.ts';

export class TransactionalHealer {
  private static auditor: TopologicalAuditor = new TopologicalAuditor();
  private static parser: TypeScriptParser = new TypeScriptParser();

  /**
   * Ejecuta un ensayo contrafáctico en memoria RAM sin tocar el disco físico.
   * Clona el hipercubo en RAM, aplica la mutación propuesta, re-audita y calcula el delta.
   * Si detecta CUALQUIER regresión, ejecuta rollback automático descartando la transacción en memoria.
   */
  public static simulateTrial(
    space: HypercubeSpace,
    targetFile: string,
    proposedContent: string,
    rootDir?: string
  ): HealTrialResult {
    const t0 = performance.now();
    const normalizedTarget = targetFile.replace(/\\/g, '/');

    // 1. Auditoría Base Previa (Estado Inicial)
    const preReport = this.auditor.audit(space, rootDir);

    // 2. Escaneo Preventivo en el Exoesqueleto 4D (Sintaxis, Truncamiento, Secretos y Sandbox)
    const trunc = TesseractShieldSecurity.scanTruncation(proposedContent);
    const secrets = TesseractShieldSecurity.scanSecrets(proposedContent);
    const sandbox = TesseractShieldSecurity.runMicroSandbox(proposedContent, 200);

    if (trunc.isTruncated || secrets.length > 0 || !sandbox.passed) {
      const errorReasons: string[] = [];
      if (trunc.isTruncated) errorReasons.push(trunc.reason || 'Truncamiento de código detectado');
      if (secrets.length > 0) errorReasons.push(`Fuga de secretos de alta entropía (${secrets.length} secretos)`);
      if (!sandbox.passed) errorReasons.push(sandbox.error || 'Fallo de ejecución en micro-sandbox');

      const tEnd = performance.now();
      const failSummary = `[ENSAYO EN RAM RECHAZADO] Violación del exoesqueleto 4D: ${errorReasons.join('; ')}`;

      return {
        targetFile: normalizedTarget,
        proposedPatch: proposedContent,
        trialStatus: 'ERROR_SINTAXIS_O_RUNTIME',
        isSafeToCommit: false,
        preHealthScore: preReport.healthScore,
        postHealthScore: preReport.healthScore,
        healthDelta: 0,
        preTotalFractures: preReport.totalFractures,
        postTotalFractures: preReport.totalFractures,
        extinguishedCount: 0,
        regressionCount: errorReasons.length,
        extinguishedFractures: [],
        newRegressions: errorReasons.map((r, idx) => ({
          id: `trial-guard-rejection-${idx}`,
          type: 'TRUNCATED_FILE',
          source: normalizedTarget,
          description: r,
          collisionReason: r,
        })),
        rollbackExecuted: true,
        trialExecutionTimeMs: parseFloat((tEnd - t0).toFixed(2)),
        summaryPromptForAI: failSummary,
        richDossierForAI: failSummary,
      };
    }

    // 3. Clonación Transaccional Efímera en Memoria RAM (< 2ms)
    const shadowSpace = space.clone();

    // 4. Inyección de Mutación en la Transacción en RAM
    const vertices = shadowSpace.getVertices();
    let targetVertex = vertices.find(
      (v) => v.id.endsWith(normalizedTarget) || normalizedTarget.endsWith(v.id)
    );

    const parseResult = this.parser.parse(normalizedTarget, proposedContent);
    const linesCount = proposedContent.split('\n').length;
    const sizeBytes = Buffer.byteLength(proposedContent, 'utf-8');

    if (targetVertex) {
      targetVertex.symbols = parseResult.symbols;
      targetVertex.dependencies = parseResult.dependencies;
      targetVertex.lines = linesCount;
      targetVertex.sizeBytes = sizeBytes;
      targetVertex.tokenEstimate = Math.ceil(sizeBytes / 4);
      targetVertex.lastModified = Date.now();
    } else {
      targetVertex = {
        id: normalizedTarget,
        hexCode: '0xHEAL',
        path: normalizedTarget,
        cell: CubicCell.CoreLogic,
        coordinate: [0.5, 0.5, 0.5, 0.5] as Point4D,
        lines: linesCount,
        sizeBytes,
        tokenEstimate: Math.ceil(sizeBytes / 4),
        symbols: parseResult.symbols,
        dependencies: parseResult.dependencies,
        dependents: [],
        lastModified: Date.now(),
      };
      shadowSpace.addVertex(targetVertex);
    }

    // Re-vincular relaciones de dependientes en el clon
    const idMap = new Map<string, HyperVertex>();
    for (const v of shadowSpace.getVertices()) {
      v.dependents = [];
      idMap.set(v.id.replace(/\\/g, '/'), v);
    }
    for (const v of shadowSpace.getVertices()) {
      for (const dep of v.dependencies) {
        const canonical = this.resolveDep(v.id, dep, idMap);
        if (canonical && !canonical.dependents.includes(v.id)) {
          canonical.dependents.push(v.id);
        }
      }
    }

    // 5. Re-Auditoría Topológica Delta sobre el Espacio Clonado en RAM (0 Tokens)
    const postReport = this.auditor.audit(shadowSpace, rootDir);

    // 6. Cálculo del Delta Causal
    const preFractureKeys = new Set(preReport.fractures.map((f) => `${f.type}:::${f.source}:::${f.target || ''}:::${f.missingSymbol || f.symbolName || ''}`));
    const postFractureKeys = new Set(postReport.fractures.map((f) => `${f.type}:::${f.source}:::${f.target || ''}:::${f.missingSymbol || f.symbolName || ''}`));

    const extinguishedFractures: HealTrialResult['extinguishedFractures'] = [];
    for (const f of preReport.fractures) {
      const key = `${f.type}:::${f.source}:::${f.target || ''}:::${f.missingSymbol || f.symbolName || ''}`;
      if (!postFractureKeys.has(key)) {
        extinguishedFractures.push({
          id: f.id,
          type: f.type,
          source: f.source,
          description: f.description,
        });
      }
    }

    const newRegressions: HealTrialResult['newRegressions'] = [];
    for (const f of postReport.fractures) {
      const key = `${f.type}:::${f.source}:::${f.target || ''}:::${f.missingSymbol || f.symbolName || ''}`;
      if (!preFractureKeys.has(key)) {
        newRegressions.push({
          id: f.id,
          type: f.type,
          source: f.source,
          description: f.description,
          collisionReason: `Regresión generada tras la mutación en '${normalizedTarget}'.`,
        });
      }
    }

    const tEnd = performance.now();
    const trialExecutionTimeMs = parseFloat((tEnd - t0).toFixed(2));
    const healthDelta = postReport.healthScore - preReport.healthScore;

    // 7. Veredicto del Mini-Subagente
    const hasRegressions = newRegressions.length > 0;
    const isSafeToCommit = !hasRegressions && (extinguishedFractures.length > 0 || healthDelta >= 0);
    const trialStatus: HealTrialResult['trialStatus'] = hasRegressions
      ? 'BLOQUEADO_POR_REGRESIONES'
      : 'APROBADO_SIN_REGRESIONES';
    const rollbackExecuted = hasRegressions; // Si hay regresión, la transacción se aborta

    // 8. Generación de Resúmenes y Dossier Causal para la IA
    const summary = `=== TESSERACT IN-MEMORY HEAL TRIAL ===\n` +
      `Objetivo: '${normalizedTarget}' | Estado: [${trialStatus}]\n` +
      `Delta de Salud: ${preReport.healthScore}/100 ➔ ${postReport.healthScore}/100 (${healthDelta >= 0 ? '+' : ''}${healthDelta} pts) en ${trialExecutionTimeMs}ms (0 tokens).\n` +
      `Fracturas Curadas: ${extinguishedFractures.length} | Regresiones Detectadas: ${newRegressions.length}.\n` +
      `Veredicto: ${isSafeToCommit ? 'SEGURO PARA COMMIT A DISCO.' : 'ROLLBACK EN RAM EJECUTADO. DISCO INTACTO.'}`;

    let dossier = `# 💎 TESSERACT IN-MEMORY HEAL TRIAL: POST-MUTATION DELTA REPORT\n\n`;
    dossier += `### 🧪 Ficha de la Transacción en Memoria RAM\n`;
    dossier += `- **Archivo Objetivo:** \`${normalizedTarget}\`\n`;
    dossier += `- **Tiempo de Ensayo y Remapeo en RAM:** \`${trialExecutionTimeMs} ms\` (0 Tokens)\n`;
    dossier += `- **Estado del Ensayo:** \`[${trialStatus}]\`\n`;
    dossier += `- **Acción de Salvaguarda:** \`${rollbackExecuted ? 'ROLLBACK AUTOMÁTICO EJECUTADO EN RAM (Disco Físico Protegido)' : 'TRANSACCIÓN VERIFICADA LIMPIA'}\`\n\n`;

    dossier += `### 📈 Delta Topológico de Salud\n`;
    dossier += `| Indicador | Estado Pre-Arreglo | Estado Post-Arreglo | Delta |\n`;
    dossier += `| :--- | :--- | :--- | :--- |\n`;
    dossier += `| **Puntaje de Salud (HealthScore)** | ${preReport.healthScore} / 100 | ${postReport.healthScore} / 100 | **${healthDelta >= 0 ? '+' : ''}${healthDelta} pts** |\n`;
    dossier += `| **Total de Fracturas Activas** | ${preReport.totalFractures} | ${postReport.totalFractures} | **${postReport.totalFractures - preReport.totalFractures}** |\n`;
    dossier += `| **Fracturas Extinguidas (Curadas)** | - | **${extinguishedFractures.length}** | ✅ |\n`;
    dossier += `| **Nuevas Regresiones (Errores Nuevos)** | - | **${newRegressions.length}** | ${hasRegressions ? '❌' : '🛡️'} |\n\n`;

    if (extinguishedFractures.length > 0) {
      dossier += `### 🟢 Fracturas Extinguidas en Cascada (${extinguishedFractures.length} errores resueltos):\n`;
      for (const ef of extinguishedFractures.slice(0, 10)) {
        dossier += `- **[${ef.type}]** en \`${ef.source}\`: ${ef.description}\n`;
      }
      if (extinguishedFractures.length > 10) {
        dossier += `- *... y ${extinguishedFractures.length - 10} fracturas adicionales curadas en cascada.*\n`;
      }
      dossier += `\n`;
    }

    if (hasRegressions) {
      dossier += `### 🚨 Regresiones Detectadas (El arreglo causaría nuevos fallos colaterales):\n`;
      for (const reg of newRegressions) {
        dossier += `- **[${reg.type}]** en \`${reg.source}\`: ${reg.description}\n`;
      }
      dossier += `\n> **Diagnóstico del Mini-Subagente:** La transacción fue abortada en RAM. Corrige las firmas o contratos en conflicto listados arriba para lograr un ensayo con 0 regresiones.\n\n`;
    } else {
      dossier += `### 🛡️ Certificación de Cero Regresiones\n`;
      dossier += `El remapeo topológico en RAM verificó que **ningún módulo dependiente** se rompe. El parche preserva la simetría 4D de forma absoluta.\n\n`;
    }

    return {
      targetFile: normalizedTarget,
      proposedPatch: proposedContent,
      trialStatus,
      isSafeToCommit,
      preHealthScore: preReport.healthScore,
      postHealthScore: postReport.healthScore,
      healthDelta,
      preTotalFractures: preReport.totalFractures,
      postTotalFractures: postReport.totalFractures,
      extinguishedCount: extinguishedFractures.length,
      regressionCount: newRegressions.length,
      extinguishedFractures,
      newRegressions,
      rollbackExecuted,
      trialExecutionTimeMs,
      summaryPromptForAI: summary,
      richDossierForAI: dossier,
    };
  }

  /**
   * Modo Mini-Subagente Autónomo:
   * Localiza una fractura, sintetiza el parche retrocompatible, lo prueba en RAM,
   * y si es 100% seguro (0 regresiones) lo aplica al disco.
   */
  public static async autoHealFracture(
    space: HypercubeSpace,
    fractureId: string,
    rootDir?: string,
    autoCommit: boolean = false
  ): Promise<AutoHealResult> {
    const preReport = this.auditor.audit(space, rootDir);
    const fracture = preReport.fractures.find(
      (f) => f.id === fractureId || f.source.includes(fractureId) || (f.target && f.target.includes(fractureId))
    );

    if (!fracture) {
      const notFoundResult: HealTrialResult = {
        targetFile: fractureId,
        proposedPatch: '',
        trialStatus: 'ERROR_SINTAXIS_O_RUNTIME',
        isSafeToCommit: false,
        preHealthScore: preReport.healthScore,
        postHealthScore: preReport.healthScore,
        healthDelta: 0,
        preTotalFractures: preReport.totalFractures,
        postTotalFractures: preReport.totalFractures,
        extinguishedCount: 0,
        regressionCount: 0,
        extinguishedFractures: [],
        newRegressions: [],
        rollbackExecuted: false,
        trialExecutionTimeMs: 0,
        summaryPromptForAI: `No se encontró la fractura '${fractureId}'.`,
        richDossierForAI: `No se encontró la fractura '${fractureId}'.`,
      };
      return {
        fractureId,
        targetFile: fractureId,
        synthesizedPatch: '',
        trial: notFoundResult,
        committedToDisk: false,
        message: `No se encontró la fractura con ID '${fractureId}'.`,
      };
    }

    // Determinar archivo a intervenir y sintetizar parche
    const targetFile = fracture.target && fracture.type === 'CONTRACT_MISMATCH' ? fracture.target : fracture.source;
    const synthesizedPatch = fracture.synthesizedPatch || TopologicalAuditor.synthesizePatch(fracture);

    // Obtener contenido actual
    let currentContent = '';
    const fullPath = path.isAbsolute(targetFile)
      ? targetFile
      : rootDir
      ? path.join(rootDir, targetFile)
      : targetFile;

    if (fs.existsSync(fullPath)) {
      try {
        currentContent = fs.readFileSync(fullPath, 'utf-8');
      } catch (_) {}
    }

    // Fusionar el parche retrocompatible al final del archivo
    let modifiedContent = currentContent;
    if (modifiedContent.length > 0) {
      modifiedContent += `\n\n${synthesizedPatch}\n`;
    } else {
      modifiedContent = synthesizedPatch;
    }

    // Ejecutar Ensayo en RAM
    const trial = this.simulateTrial(space, targetFile, modifiedContent, rootDir);

    let committedToDisk = false;
    let message = '';

    if (trial.isSafeToCommit) {
      if (autoCommit && rootDir) {
        try {
          fs.writeFileSync(fullPath, modifiedContent, 'utf-8');
          committedToDisk = true;
          // Actualizar espacio original
          const parseResult = this.parser.parse(targetFile, modifiedContent);
          const targetVertex = space.getVertices().find((v) => v.id === targetFile);
          if (targetVertex) {
            targetVertex.symbols = parseResult.symbols;
            targetVertex.dependencies = parseResult.dependencies;
            targetVertex.lines = modifiedContent.split('\n').length;
          }
          message = `Autocuración completada con éxito: Parche aplicado físicamente a '${targetFile}'. Extinguidas ${trial.extinguishedCount} fracturas con 0 regresiones.`;
        } catch (err: any) {
          message = `Parche verificado en RAM pero falló la escritura a disco: ${err?.message}`;
        }
      } else {
        message = `Parche verificado exitosamente en RAM (0 regresiones, +${trial.healthDelta} pts de salud). Listo para ser confirmado a disco.`;
      }
    } else {
      message = `Autocuración abortada por el mini-subagente: El parche generó ${trial.regressionCount} regresiones. Rollback en RAM ejecutado con éxito.`;
    }

    return {
      fractureId,
      targetFile,
      synthesizedPatch,
      trial,
      committedToDisk,
      message,
    };
  }

  private static resolveDep(importerId: string, specifier: string, idMap: Map<string, HyperVertex>): HyperVertex | null {
    if (specifier.startsWith('.')) {
      const dir = path.posix.dirname(importerId);
      const normalized = path.posix.normalize(path.posix.join(dir, specifier));
      for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js']) {
        const found = idMap.get((normalized + ext).replace(/\\/g, '/'));
        if (found) return found;
      }
    } else {
      const stripped = specifier.replace(/^@\//, '');
      for (const prefix of ['', 'src/', 'lib/']) {
        for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js']) {
          const found = idMap.get((prefix + stripped + ext).replace(/\\/g, '/'));
          if (found) return found;
        }
      }
    }
    return null;
  }
}
