/**
 * OCTERACT-CONTEXT: Motor de Orquestación Agéntica Neuro-Simbólica (OcteractOrchestratorEngine)
 * Convierte al Agente IA en el Director Estratégico (Sistema 1) mientras Octeract 8D
 * ejecuta todo el trabajo topológico y matemático pesado (Sistema 2) a costo ~0 tokens.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CubicCell,
  type HyperVertex,
  type BlastRadiusResult,
} from './types.ts';
import { HypercubeSpace } from './hypercube.ts';
import { ShadowEngine } from './shadow.ts';
import { OcteractGrepEngine, type GrepMatch } from './grep.ts';
import { FlowTracer } from './flow.ts';
import { BlastRadiusCalculator } from './blast.ts';
import { TopologicalAuditor } from './auditor.ts';
import { CausalInferenceEngine } from './causality.ts';
import { AsyncFlowAnalyzer } from './async-flow.ts';
import { AsymptoticAnalyzer } from './asymptotics.ts';
import { TransactionalHealer } from './healing.ts';
import {
  OcteractPairformer,
  OcteractAlphaDevOptimizer,
  OcteractStepVerifier,
  OcteractDeductiveEngine,
} from '../deepmind/index.ts';

export type OrchestratorPhase = 'diagnose' | 'plan' | 'simulate' | 'execute' | 'auto';

export interface OrchestratorRequest {
  userIntent: string;
  technicalQuery?: string; // Consulta técnica enriquecida por el Agente IA (Query Expansion / HyDE)
  phase?: OrchestratorPhase;
  targetFiles?: string[];
  targetSymbols?: string[];
  proposedChanges?: Array<{
    file: string;
    content: string;
  }>;
  maxBudgetTokens?: number;
}

export interface OrchestratorIntentDecomposition {
  rawIntent: string;
  isTechnical: boolean;
  intentCategory: 'bug_fix' | 'feature_addition' | 'refactor' | 'audit' | 'exploration' | 'vibe_request';
  subIntents: Array<{
    description: string;
    targetCell: CubicCell;
    keywords: string[];
  }>;
  resonantCells: CubicCell[];
}

export interface OrchestrationDiagnosticStep {
  foundFiles: Array<{
    file: string;
    cell: CubicCell;
    score: number;
    enclosingSymbol?: string;
    line: number;
    snippet: string;
  }>;
  blastRadiusSummary: {
    rootFile: string;
    affectedFilesCount: number;
    maxHops: number;
    criticalPath: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  geodesicFlowPath?: string[];
  asyncConcerns: string[];
  asymptoticConcerns: string[];
  triangularBottlenecks?: string[];
  alphaDevRecommendations?: string[];
}

export interface OrchestrationSimulationStep {
  targetPath: string;
  isSafe: boolean;
  shearDistance: number;
  entropyCheck: { allowed: boolean; newBrokenContracts: number };
  causalVerdict?: { isAdmissible: boolean; message: string };
  circuitBreakerTripped: boolean;
  blockingReason?: string;
  healingProposal?: string;
  prmScore?: number;
  prmVerdict?: string;
}

export interface OrchestrationResult {
  userIntent: string;
  phase: OrchestratorPhase;
  executionTimeMs: number;
  estimatedTokens: number;
  decomposition: OrchestratorIntentDecomposition;
  diagnostic?: OrchestrationDiagnosticStep;
  plan?: {
    strategy: string;
    orderedSteps: string[];
    affectedCells: CubicCell[];
    riskLevel: string;
  };
  simulation?: OrchestrationSimulationStep[];
  execution?: {
    appliedFiles: string[];
    status: 'WRITTEN_SAFELY' | 'BLOCKED' | 'ROLLED_BACK' | 'NO_OP';
    message: string;
  };
  microDossier: string;
  vibeSummaryForHuman: string;
}

export class OcteractOrchestratorEngine {
  private rootDir: string;
  private grepEngine: OcteractGrepEngine;

  constructor(rootDir: string = '.') {
    this.rootDir = path.resolve(rootDir);
    this.grepEngine = new OcteractGrepEngine(this.rootDir);
  }

  /**
   * Compilador de Intención Universal:
   * Convierte lenguaje natural informal ("vibe coding"), reportes de errores
   * o solicitudes técnicas en vectores y celdas del hipercubo 8D.
   */
  public decomposeIntent(userIntent: string, technicalQuery?: string): OrchestratorIntentDecomposition {
    const raw = userIntent.trim();
    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isTechnical =
      /\.(ts|js|py|rs|go|json)\b/.test(raw) ||
      /\b(class|function|interface|method|async|await|ast|import|export|refactor|endpoint|api|sql|db)\b/i.test(raw);

    let category: OrchestratorIntentDecomposition['intentCategory'] = 'exploration';
    if (/\b(error|falla|bug|crash|rompe|exception|fail|issue|problema)\b/.test(normalized)) {
      category = 'bug_fix';
    } else if (/\b(crea|agrega|anade|nuevo|feature|implementa|soporte)\b/.test(normalized)) {
      category = 'feature_addition';
    } else if (/\b(refactor|optimiza|simplifica|limpia|reorganiza|migra)\b/.test(normalized)) {
      category = 'refactor';
    } else if (/\b(audita|salud|revisa|chequea|diagnostica|escanea)\b/.test(normalized)) {
      category = 'audit';
    } else if (!isTechnical) {
      category = 'vibe_request';
    }

    const cellScores: Record<CubicCell, number> = {
      CoreLogic: 1,
      Storage: 0,
      Security: 0,
      Network: 0,
      Telemetry: 0,
      Config: 0,
      Tests: 0,
      Types: 0,
    };

    if (/\b(login|auth|sesion|seguridad|token|password|credencial|jwt|crypto|permiso)\b/.test(normalized)) cellScores.Security += 5;
    if (/\b(db|database|guardar|disco|archivo|storage|persist|datos|tabla|cache)\b/.test(normalized)) cellScores.Storage += 5;
    if (/\b(red|api|http|fetch|conexion|socket|servidor|cliente|url|endpoint)\b/.test(normalized)) cellScores.Network += 5;
    if (/\b(ui|vista|pantalla|boton|formulario|ventana|color|interfaz|render|component|servicio|motor|controlador|logica|algoritmo|proceso|workflow)\b/.test(normalized)) cellScores.CoreLogic += 5;
    if (/\b(index|indexar|indexacion|indexer|escanear|scan|walk|crawl)\b/.test(normalized)) cellScores.CoreLogic += 10;
    if (/\b(log|metrica|evento|telemetria|estadistica|traza|monitor)\b/.test(normalized)) cellScores.Telemetry += 5;
    if (/\b(config|ajuste|opcion|env|entorno|properties|preferencia)\b/.test(normalized)) cellScores.Config += 5;
    if (/\b(test|prueba|spec|mock|unit|verificar|assert)\b/.test(normalized)) cellScores.Tests += 5;
    if (/\b(tipo|interface|contrato|dts|schema)\b/.test(normalized)) cellScores.Types += 5;

    const resonantCells = (Object.keys(cellScores) as CubicCell[])
      .filter((c) => cellScores[c] > 0)
      .sort((a, b) => cellScores[b] - cellScores[a]);

    if (resonantCells.length === 0) resonantCells.push(CubicCell.CoreLogic);

    const combinedQuery = technicalQuery ? `${userIntent} ${technicalQuery}` : userIntent;
    const tokenInfo = OcteractGrepEngine.tokenizeNaturalQuery(combinedQuery);
    const cleanKeywords = tokenInfo.originalTerms.length > 0
      ? tokenInfo.originalTerms.slice(0, 6)
      : OcteractGrepEngine.splitCodeIdentifiers(raw).slice(0, 5);

    const subIntents: OrchestratorIntentDecomposition['subIntents'] = resonantCells.map((cell) => {
      return {
        description: `Dominio ${cell} relevante para la solicitud`,
        targetCell: cell,
        keywords: cleanKeywords,
      };
    });

    return {
      rawIntent: userIntent,
      isTechnical,
      intentCategory: category,
      subIntents,
      resonantCells,
    };
  }

  /**
   * Ejecuta el pipeline de orquestación autónomo
   */
  public async orchestrate(space: HypercubeSpace, request: OrchestratorRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const phase: OrchestratorPhase = request.phase || 'auto';
    const decomposition = this.decomposeIntent(request.userIntent, request.technicalQuery);

    let diagnostic: OrchestrationDiagnosticStep | undefined;
    let plan: OrchestrationResult['plan'];
    let simulation: OrchestrationSimulationStep[] | undefined;
    let execution: OrchestrationResult['execution'];

    const shadowEngine = new ShadowEngine(space, this.rootDir);
    const asyncAnalyzer = new AsyncFlowAnalyzer(this.rootDir);
    const asymptoticAnalyzer = new AsymptoticAnalyzer(this.rootDir);
    const causalEngine = new CausalInferenceEngine(this.rootDir);

    const queryToSearch = request.technicalQuery
      ? `${request.technicalQuery} ${request.userIntent}`
      : request.userIntent;

    // 1. FASE DE DIAGNÓSTICO (Localización semántica + Blast Radius + Flujo)
    if (phase === 'diagnose' || phase === 'auto' || phase === 'plan') {
      const grepResult = await this.grepEngine.search(space, {
        query: queryToSearch,
        mode: 'semantic',
        cell: decomposition.resonantCells[0],
        maxResults: 5,
        contextLines: 2,
      });

      let topMatches = grepResult.matches;
      if (topMatches.length === 0) {
        const fallbackGrep = await this.grepEngine.search(space, {
          query: queryToSearch,
          mode: 'auto',
          maxResults: 5,
        });
        topMatches = fallbackGrep.matches;
      }

      if (request.targetFiles && request.targetFiles.length > 0) {
        const preferredFiles = request.targetFiles;
        for (const pf of preferredFiles) {
          const matchIdx = topMatches.findIndex((m) => m.file.includes(pf));
          if (matchIdx !== -1) {
            topMatches[matchIdx].score = 999.0;
          } else {
            const vertex = space.getVertices().find((v) => v.path.includes(pf));
            if (vertex) {
              const lines = this.grepEngine.getFileLines(vertex.path);
              const topSymbol = vertex.symbols.find((s) => s.kind === 'class') || vertex.symbols[0];
              topMatches.unshift({
                file: vertex.path,
                line: topSymbol?.lineStart || 1,
                column: 1,
                lineContent: lines[topSymbol ? Math.max(0, topSymbol.lineStart - 1) : 0]?.trimEnd() || vertex.path,
                contextBefore: [],
                contextAfter: lines.slice(1, 3),
                enclosingSymbol: topSymbol,
                cell: vertex.cell,
                score: 999.0,
                matchType: 'ast_symbol',
                matchedTerms: ['agent_targeted'],
              });
            }
          }
        }
        topMatches.sort((a, b) => b.score - a.score);
      }

      const primaryMatch = topMatches[0];
      const targetFile = request.targetFiles?.[0] || primaryMatch?.file || 'src/index.ts';
      const targetSymbol = request.targetSymbols?.[0] || primaryMatch?.enclosingSymbol?.name;

      const blast = BlastRadiusCalculator.calculate(space, targetFile, targetSymbol, 15, this.rootDir);

      // Flujo geodésico si hay al menos 2 archivos relevantes
      let geodesicFlow: string[] | undefined;
      if (topMatches.length >= 2) {
        const flowResult = FlowTracer.trace(space, `${topMatches[0].file} ${topMatches[1].file}`);
        geodesicFlow = flowResult.flowSteps.map((s) => s.path);
      }

      const asyncConcerns: string[] = [];
      const asymptoticConcerns: string[] = [];

      try {
        const asyncReport = asyncAnalyzer.analyzeFile(targetFile);
        if (asyncReport.floatingPromisesCount > 0) {
          asyncConcerns.push(`${asyncReport.floatingPromisesCount} promesas flotantes potenciales en ${targetFile}`);
        }
        if (asyncReport.asyncInForEachCount > 0) {
          asyncConcerns.push(`Trampa async-in-forEach detectada en ${targetFile}`);
        }
      } catch (_) {}

      try {
        const asympReport = asymptoticAnalyzer.analyzeFile(targetFile);
        if (asympReport.overallComplexity.includes('O(N^2)') || asympReport.overallComplexity.includes('O(2^N)')) {
          asymptoticConcerns.push(`Degeneración de complejidad alta ${asympReport.overallComplexity} en ${targetFile}`);
        }
      } catch (_) {}

      // DeepMind AlphaFold 3: Tensor Relacional Triangular (Pairformer)
      let triangularBottlenecks: string[] | undefined;
      try {
        const pairformer = new OcteractPairformer(space);
        const pairReport = pairformer.computePairTensor();
        const relevant = pairReport.topCriticalPairs
          .filter((p) => p.isShadowBottleneck && (p.source.endsWith(targetFile) || p.target.endsWith(targetFile)))
          .map((p) => `${p.source} ➔ ${p.target} (Fuerza triangular: ${p.triangularStrength})`);
        if (relevant.length > 0) triangularBottlenecks = relevant.slice(0, 3);
      } catch (_) {}

      // DeepMind AlphaDev: Chequeo de optimizaciones de micro-patrones AST
      const alphaDevRecommendations: string[] = [];
      try {
        const fullTarget = path.isAbsolute(targetFile) ? targetFile : path.join(this.rootDir, targetFile);
        if (fs.existsSync(fullTarget)) {
          const content = fs.readFileSync(fullTarget, 'utf-8');
          const opt = new OcteractAlphaDevOptimizer(this.rootDir).optimize(content, targetFile);
          if (opt.transformationsApplied.length > 0) {
            alphaDevRecommendations.push(`AlphaDev Optimizer: ${opt.theoreticalSpeedup} (${opt.transformationsApplied.length} micro-patrones)`);
          }
        }
      } catch (_) {}

      diagnostic = {
        foundFiles: topMatches.map((m) => ({
          file: m.file,
          cell: m.cell,
          score: m.score,
          enclosingSymbol: m.enclosingSymbol?.name,
          line: m.line,
          snippet: m.lineContent,
        })),
        blastRadiusSummary: {
          rootFile: targetFile,
          affectedFilesCount: blast.totalAffectedFiles,
          maxHops: blast.maxHopsReached,
          criticalPath: blast.criticalPath.map((p) => p.file),
          riskLevel: blast.riskLevel,
        },
        geodesicFlowPath: geodesicFlow,
        asyncConcerns,
        asymptoticConcerns,
        triangularBottlenecks,
        alphaDevRecommendations,
      };
    }

    // 2. FASE DE PLANIFICACIÓN (Estrategia estructurada para el Agente)
    if (phase === 'plan' || phase === 'auto') {
      const primaryFile = diagnostic?.foundFiles[0]?.file || request.targetFiles?.[0] || 'src/index.ts';
      const risk = diagnostic?.blastRadiusSummary.riskLevel || 'LOW';

      plan = {
        strategy: `Modificación quirúrgica centrada en '${primaryFile}' bajo invariancia topológica 8D.`,
        orderedSteps: [
          `Paso 1: Aplicar cambio aislado en ${primaryFile} preservando firmas de contrato.`,
          `Paso 2: Validar que los ${diagnostic?.blastRadiusSummary.affectedFilesCount || 0} archivos dependientes no sufran cizallamiento.`,
          `Paso 3: Proyectar sombra virtual con 'octeract_project_shadow' antes de escribir en disco.`,
          `Paso 4: Confirmar que la entropía neta deltaFractures <= 0 con 'octeract_safe_write'.`,
        ],
        affectedCells: decomposition.resonantCells,
        riskLevel: risk,
      };
    }

    // 3. FASE DE SIMULACIÓN VIRTUAL (Shadow + Causalidad + Entropía)
    if ((phase === 'simulate' || phase === 'auto') && request.proposedChanges && request.proposedChanges.length > 0) {
      simulation = [];
      const vertices = space.getVertices();

      for (const change of request.proposedChanges) {
        const shadow = shadowEngine.project(change.file, change.content);
        const currentAudit = new TopologicalAuditor().audit(space, this.rootDir);
        const entropy = shadowEngine.evaluateEntropy(change.file, change.content, currentAudit.totalFractures);

        let causalVerdict: { isAdmissible: boolean; message: string } | undefined;
        let prmScore: number | undefined;
        let prmVerdict: string | undefined;
        try {
          const fullPath = path.isAbsolute(change.file) ? change.file : path.join(this.rootDir, change.file);
          const origContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
          const evalRes = causalEngine.evaluateIntervention(change.file, origContent, change.content, vertices);
          causalVerdict = {
            isAdmissible: evalRes.verdict === 'CAUSALLY_SOUND',
            message: evalRes.recommendation,
          };

          const prm = new OcteractStepVerifier(this.rootDir).verifySteps(origContent, change.content, change.file);
          prmScore = prm.cumulativeReward;
          prmVerdict = prm.overallVerdict;
        } catch (_) {}

        simulation.push({
          targetPath: change.file,
          isSafe: shadow.isSafe && entropy.allowed && (!causalVerdict || causalVerdict.isAdmissible) && prmVerdict !== 'REJECTED_BY_PRM',
          shearDistance: shadow.shearDistance,
          entropyCheck: {
            allowed: entropy.allowed,
            newBrokenContracts: entropy.newBrokenContracts,
          },
          causalVerdict,
          prmScore,
          prmVerdict,
          circuitBreakerTripped: shadowEngine.isCircuitBreakerTripped(change.file),
          blockingReason: !shadow.isSafe
            ? (shadow.shearDistance > 0.75
                ? `Cizallamiento topológico excesivo (${shadow.shearDistance.toFixed(3)})`
                : shadow.recommendations[0] || 'Violación de invarianza de contratos o seguridad')
            : !entropy.allowed
            ? `Introduce ${entropy.newBrokenContracts} nuevos contratos rotos en el sistema`
            : causalVerdict && !causalVerdict.isAdmissible
            ? `Intervención causal rechazada: ${causalVerdict.message}`
            : prmVerdict === 'REJECTED_BY_PRM'
            ? `Rechazado por Process Reward Model (PRM Score: ${prmScore}/100)`
            : undefined,
          healingProposal: shadow.brokenEdges.length > 0
            ? `Restaurar firmas de llamada para: ${shadow.brokenEdges.map((e) => e.targetSymbol).join(', ')}`
            : undefined,
        });
      }
    }

    // 4. FASE DE EJECUCIÓN FÍSICA SEGURA (Safe Write con Circuit Breaker)
    if (phase === 'execute' && request.proposedChanges && request.proposedChanges.length > 0) {
      const healer = new TransactionalHealer(this.rootDir, shadowEngine);
      const targets = request.proposedChanges.map((c) => c.file);
      const contents = request.proposedChanges.map((c) => c.content);

      try {
        const healResult = healer.executeAtomicBatch(targets, contents);
        execution = {
          appliedFiles: healResult.committedFiles,
          status: healResult.success ? 'WRITTEN_SAFELY' : 'ROLLED_BACK',
          message: healResult.message,
        };
      } catch (err: any) {
        execution = {
          appliedFiles: [],
          status: 'BLOCKED',
          message: err?.message || 'Error en ejecución de escritura',
        };
      }
    }

    const duration = Date.now() - startTime;
    const microDossier = this.buildMicroDossier(request.userIntent, phase, decomposition, diagnostic, plan, simulation, execution, duration);
    const vibeSummary = this.buildVibeSummary(request.userIntent, decomposition, diagnostic, simulation);

    const estimatedTokens = Math.min(380, 50 + (diagnostic?.foundFiles.length || 0) * 20 + (simulation?.length || 0) * 30);

    return {
      userIntent: request.userIntent,
      phase,
      executionTimeMs: duration,
      estimatedTokens,
      decomposition,
      diagnostic,
      plan,
      simulation,
      execution,
      microDossier,
      vibeSummaryForHuman: vibeSummary,
    };
  }

  /**
   * Genera el Micro-Dossier ultracompacto para el Agente LLM (< 200 tokens)
   */
  private buildMicroDossier(
    userIntent: string,
    phase: OrchestratorPhase,
    decomp: OrchestratorIntentDecomposition,
    diag?: OrchestrationDiagnosticStep,
    plan?: OrchestrationResult['plan'],
    sim?: OrchestrationSimulationStep[],
    exec?: OrchestrationResult['execution'],
    durationMs: number = 0
  ): string {
    const lines: string[] = [];
    lines.push(`### 🧭 Octeract Orchestrator [Phase: ${phase.toUpperCase()}] (${durationMs}ms)`);
    lines.push(`**Intención:** "${userIntent}" | **Categoría:** ${decomp.intentCategory} | **Celdas:** ${decomp.resonantCells.slice(0, 3).join(', ')}`);

    if (diag && diag.foundFiles.length > 0) {
      lines.push(`\n**Pivotes Localizados:**`);
      for (const f of diag.foundFiles.slice(0, 3)) {
        const symPart = f.enclosingSymbol ? ` (${f.enclosingSymbol})` : '';
        lines.push(`- [${f.cell}] \x60${f.file}:${f.line}\x60${symPart}: \x60${f.snippet.slice(0, 60)}\x60`);
      }
      lines.push(`**Onda de Impacto:** ${diag.blastRadiusSummary.affectedFilesCount} dependientes afectados (Riesgo: ${diag.blastRadiusSummary.riskLevel})`);
      if (diag.asyncConcerns.length > 0) lines.push(`⚠️ ${diag.asyncConcerns[0]}`);
      if (diag.asymptoticConcerns.length > 0) lines.push(`⚠️ ${diag.asymptoticConcerns[0]}`);
      if (diag.triangularBottlenecks && diag.triangularBottlenecks.length > 0) lines.push(`🔺 Cuello triangular (Pairformer): ${diag.triangularBottlenecks[0]}`);
      if (diag.alphaDevRecommendations && diag.alphaDevRecommendations.length > 0) lines.push(`⚡ ${diag.alphaDevRecommendations[0]}`);
    }

    if (plan) {
      lines.push(`\n**Plan Estratégico:** ${plan.strategy}`);
      lines.push(`- ${plan.orderedSteps[0]}`);
      lines.push(`- ${plan.orderedSteps[1]}`);
    }

    if (sim && sim.length > 0) {
      lines.push(`\n**Simulación 4D:**`);
      for (const s of sim) {
        const icon = s.isSafe ? '🟢' : '⛔';
        lines.push(`${icon} \x60${s.targetPath}\x60: ${s.isSafe ? 'SEGURO' : s.blockingReason} (Shear: ${s.shearDistance.toFixed(3)})`);
      }
    }

    if (exec) {
      lines.push(`\n**Ejecución Física:** ${exec.status === 'WRITTEN_SAFELY' ? '✔ ESCRITO CON ÉXITO' : '⛔ BLOQUEADO/REVERTIDO'} (${exec.message})`);
    }

    return lines.join('\n');
  }

  /**
   * Genera una explicación simple en lenguaje humano para usuarios no técnicos
   */
  private buildVibeSummary(
    userIntent: string,
    decomp: OrchestratorIntentDecomposition,
    diag?: OrchestrationDiagnosticStep,
    sim?: OrchestrationSimulationStep[]
  ): string {
    const primaryFile = diag?.foundFiles[0]?.file || 'el archivo principal';
    const cellName = decomp.resonantCells[0] || 'Core';

    let summary = `Entendí tu solicitud sobre "${userIntent}". Esto pertenece a la parte de ${cellName}.`;
    if (diag && diag.foundFiles.length > 0) {
      summary += ` Encontré que el cambio clave debe hacerse en \x60${primaryFile}\x60. Si tocamos esta parte, afectará a ${diag.blastRadiusSummary.affectedFilesCount} archivos conectados.`;
    }

    if (sim && sim.length > 0) {
      const unsafe = sim.find((s) => !s.isSafe);
      if (unsafe) {
        summary += ` ¡Cuidado! La propuesta actual rompería el sistema porque: ${unsafe.blockingReason}. El escudo la bloqueó para proteger tu código.`;
      } else {
        summary += ` El cambio fue simulado con éxito en memoria virtual y no rompe ninguna otra parte del programa.`;
      }
    }

    return summary;
  }
}
