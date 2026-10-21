/**
 * TESSERACT-CONTEXT: Motor de Proyección de Sombras y Cizallamiento Topológico
 * Evalúa el impacto de cambios propuestos antes de que toquen el disco
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CubicCell, type Point4D, type Point8D, type HyperVertex, type HyperEdge, type ShadowProjection } from './types.ts';
import { HypercubeSpace } from './hypercube.ts';
import { TesseractShieldSecurity } from './security.ts';
import { TopologicalAuditor } from './auditor.ts';
import { AsymptoticAnalyzer } from './asymptotics.ts';
import { CausalInferenceEngine } from './causality.ts';
import { AsyncFlowAnalyzer } from './async-flow.ts';

export class ShadowEngine {
  private space: HypercubeSpace;
  private rootDir?: string;
  private attemptCounts: Map<string, number> = new Map();
  private readonly MAX_ATTEMPTS: number = 2;

  constructor(space: HypercubeSpace, rootDir?: string) {
    this.space = space;
    this.rootDir = rootDir;
  }

  public setRootDir(rootDir: string): void {
    this.rootDir = rootDir;
  }

  /**
   * Verifica si el Circuit Breaker ha bloqueado modificaciones en un archivo
   */
  public isCircuitBreakerTripped(targetPath: string): boolean {
    const norm = targetPath.replace(/\\/g, '/');
    return (this.attemptCounts.get(norm) || 0) >= this.MAX_ATTEMPTS;
  }

  /**
   * Registra un intento fallido o destructivo en un archivo
   */
  public recordFailedAttempt(targetPath: string): number {
    const norm = targetPath.replace(/\\/g, '/');
    const next = (this.attemptCounts.get(norm) || 0) + 1;
    this.attemptCounts.set(norm, next);
    return next;
  }

  /**
   * Resetea el contador de intentos al lograr una escritura segura
   */
  public resetAttempts(targetPath: string): void {
    const norm = targetPath.replace(/\\/g, '/');
    this.attemptCounts.delete(norm);
  }

  /**
   * Obtiene la cantidad actual de intentos fallidos
   */
  public getAttemptCount(targetPath: string): number {
    const norm = targetPath.replace(/\\/g, '/');
    return this.attemptCounts.get(norm) || 0;
  }

  /**
   * Genera un micro-slice quirúrgico de los contratos en los call-sites (< 800 tokens para 100 callers)
   * Permite al agente conocer exactamente qué esperan los consumidores sin cargar archivos completos
   */
  public generateCallSiteMicroSlice(targetPath: string): string {
    const vertices = this.space.getVertices();
    const normalizedTarget = targetPath.replace(/\\/g, '/');
    const targetVertex = vertices.find((v) => v.id.endsWith(normalizedTarget) || normalizedTarget.endsWith(v.id));

    if (!targetVertex) {
      return `[MICRO-SLICE 4D] Archivo "${targetPath}" no tiene dependientes conocidos.`;
    }

    const exportedSymbols = targetVertex.symbols.filter(
      (s) => s.kind === 'function' || s.kind === 'class' || s.kind === 'interface' || s.kind === 'type'
    );

    const lines: string[] = [];
    lines.push(`=== MICRO-SLICE DE CONTRATOS: ${targetVertex.id} ===`);
    lines.push(`Total de Callers / Dependientes en el Hipercubo: ${targetVertex.dependents.length}`);
    lines.push(`Contratos Exportados Activos:`);
    for (const s of exportedSymbols) {
      lines.push(`  - [${s.kind}] ${s.name} (Líneas ${s.lineStart}-${s.lineEnd})`);
    }

    lines.push(`\nLlamadas Clave y Dependientes que consumen estos contratos:`);
    const callersSample = targetVertex.dependents.slice(0, 15);
    for (const depId of callersSample) {
      const depVertex = vertices.find((v) => v.id === depId);
      const cell = depVertex ? depVertex.cell : 'Desconocida';
      lines.push(`  * ${depId} (Celda: ${cell})`);
    }
    if (targetVertex.dependents.length > 15) {
      lines.push(`  ... y otros ${targetVertex.dependents.length - 15} callers protegidos por la simetría 4D.`);
    }

    lines.push(`\nREGLA DE NO-REGRESIÓN (Retrocompatibilidad Obligatoria):`);
    lines.push(`Si modificas una función o clase consumida por estos callers, debes conservar su firma original o añadir una sobrecarga/parámetro opcional.`);

    return lines.join('\n');
  }

  /**
   * Evalúa la ley de Reducción Estricta de Entropía (NewErrors == 0)
   */
  public evaluateEntropy(
    targetPath: string,
    proposedContent: string,
    currentTotalFractures: number
  ): { allowed: boolean; reason?: string; newBrokenContracts: number } {
    const shadow = this.project(targetPath, proposedContent);

    if (!shadow.isSafe || shadow.brokenEdges.length > 0) {
      return {
        allowed: false,
        reason: `Violación de Entropía: El cambio generaría deformación topológica o ${shadow.brokenEdges.length || 1} aristas/contratos rotos nuevos. Toda mutación debe reducir o mantener constante el número de fracturas.`,
        newBrokenContracts: Math.max(1, shadow.brokenEdges.length),
      };
    }

    return {
      allowed: true,
      newBrokenContracts: 0,
    };
  }

  /**
   * Proyecta el impacto de un cambio propuesto en el hipercubo
   * @param targetPath Ruta del archivo que se propone modificar
   * @param proposedContent Contenido propuesto por el agente de IA
   */
  public project(targetPath: string, proposedContent: string): ShadowProjection {
    const vertices = this.space.getVertices();
    const normalizedTarget = targetPath.replace(/\\/g, '/');

    const targetVertex = vertices.find((v) => v.id.endsWith(normalizedTarget) || normalizedTarget.endsWith(v.id));

    // Si es un archivo nuevo:
    if (!targetVertex) {
      const trunc = TesseractShieldSecurity.scanTruncation(proposedContent);
      const secrets = TesseractShieldSecurity.scanSecrets(proposedContent);
      const importMatches = Array.from(proposedContent.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
      const hallucinated = TesseractShieldSecurity.scanHallucinatedPackages(importMatches, this.rootDir);
      const sandbox = TesseractShieldSecurity.runMicroSandbox(proposedContent, 200);

      const scoreX = trunc.isTruncated ? 0.0 : 1.0;
      const scoreY = 1.0;
      const scoreZ = sandbox.score;
      const scoreW = secrets.length > 0 ? 0.1 : (hallucinated.length > 0 ? 0.5 : 1.0);

      const stateVector4D: Point4D = [scoreX, scoreY, scoreZ, scoreW];
      const shearVector: Point4D = [
        parseFloat((1 - scoreX).toFixed(3)),
        parseFloat((1 - scoreY).toFixed(3)),
        parseFloat((1 - scoreZ).toFixed(3)),
        parseFloat((1 - scoreW).toFixed(3)),
      ];
      const shearDistance = parseFloat(
        Math.sqrt(shearVector.reduce((acc, v) => acc + v * v, 0)).toFixed(3)
      );

      const isSafe =
        shearDistance <= 0.75 &&
        !trunc.isTruncated &&
        sandbox.passed &&
        secrets.length === 0 &&
        hallucinated.length === 0;

      return {
        targetPath,
        stateVector4D,
        shearVector,
        shearDistance,
        isSafe,
        axes: {
          xSyntax: {
            passed: !trunc.isTruncated,
            score: scoreX,
            issues: trunc.reason ? [trunc.reason] : [],
            isTruncated: trunc.isTruncated,
          },
          yContracts: { passed: true, score: scoreY, issues: [], brokenEdges: [] },
          zRuntime: {
            passed: sandbox.passed,
            score: scoreZ,
            issues: sandbox.error ? [sandbox.error] : [],
            executionTimeout: sandbox.timedOut,
          },
          wSecurity: {
            passed: secrets.length === 0 && hallucinated.length === 0,
            score: scoreW,
            issues: [
              ...secrets.map((s) => `Secreto detectado: ${s.type} (entropía: ${s.entropy})`),
              ...hallucinated.map((h) => `Paquete npm no declarado: ${h}`),
            ],
            leakedSecrets: secrets.map((s) => s.type),
            hallucinatedPackages: hallucinated,
          },
        },
        brokenEdges: [],
        affectedCells: [CubicCell.CoreLogic],
        recommendations: isSafe
          ? ['Archivo nuevo válido. Verificar que se importe en el módulo correspondiente.']
          : ['Archivo nuevo bloqueado por violaciones de seguridad, ejecución o sintaxis en el exoesqueleto 4D.'],
      };
    }

    // -------------------------------------------------------------
    // EJE X: Sintaxis, Integridad y Anti-Truncamiento
    // -------------------------------------------------------------
    const xIssues: string[] = [];
    const trunc = TesseractShieldSecurity.scanTruncation(proposedContent);
    let scoreX = 1.0;

    if (trunc.isTruncated) {
      scoreX = 0.0;
      xIssues.push(trunc.reason || 'Truncamiento de archivo detectado');
    } else {
      const proposedLines = proposedContent.split('\n').length;
      const deltaLines = Math.abs(proposedLines - targetVertex.lines);
      const ratio = deltaLines / Math.max(1, targetVertex.lines);
      scoreX = Math.max(0.15, 1.0 - Math.min(0.85, ratio));
    }

    const xSyntax = {
      passed: !trunc.isTruncated && scoreX >= 0.5,
      score: parseFloat(scoreX.toFixed(3)),
      issues: xIssues,
      isTruncated: trunc.isTruncated,
    };

    // -------------------------------------------------------------
    // EJE Y: Contratos, Símbolos Exportados y Efecto Dominó en Red
    // -------------------------------------------------------------
    let missingSymbolsCount = 0;
    const missingSymbolNames: string[] = [];
    const brokenEdges: HyperEdge[] = [];

    for (const sym of targetVertex.symbols) {
      if (!proposedContent.includes(sym.name)) {
        missingSymbolsCount++;
        missingSymbolNames.push(sym.name);
      }
    }

    const dangerousPatterns = [
      { pattern: /revert\s*\(/i, name: 'Reversión silenciosa de datos sin guardar' },
      { pattern: /discardBackup\s*\(/i, name: 'Destrucción de copias de seguridad de disco' },
      { pattern: /return\s+false\s*;?\s*}\s*$/m, name: 'Supresión de diálogo de confirmación/veto' },
      { pattern: /addToast\s*\([^)]*\)\s*:\s*void\s*\{\s*return\s*;?\s*\}/i, name: 'Mutilación del centro de notificaciones/toasts' },
      { pattern: /assertReturnsDefined|showSaveConfirm/i, name: 'Eliminación de guardias de integridad de datos' },
    ];

    let destructivePatternScore = 0;
    const detectedRisks: string[] = [];
    for (const dp of dangerousPatterns) {
      if (dp.pattern.test(proposedContent)) {
        destructivePatternScore += 0.45;
        detectedRisks.push(dp.name);
      }
    }

    const affectedCellsSet = new Set<CubicCell>([targetVertex.cell]);
    const missingRatio = targetVertex.symbols.length > 0 ? missingSymbolsCount / targetVertex.symbols.length : 0;

    for (const dependentId of targetVertex.dependents) {
      const depVertex = vertices.find((v) => v.id === dependentId);
      if (depVertex) {
        affectedCellsSet.add(depVertex.cell);
      }
      if (missingSymbolsCount > 0 || destructivePatternScore > 0) {
        brokenEdges.push({
          source: targetVertex.id,
          target: dependentId,
          axis: 'Y',
          weight: Math.min(1.0, missingRatio + destructivePatternScore),
          type: 'contract',
          distance4D: 0.5,
          hammingDistance: 2,
        });
      }
    }

    let scoreY = Math.max(0.0, 1.0 - (missingRatio * 0.75 + destructivePatternScore * 0.45));
    if (missingSymbolsCount > 0 && targetVertex.dependents.length > 0) {
      scoreY = Math.min(scoreY, 0.25);
    }

    const yContracts = {
      passed: missingSymbolsCount === 0 && destructivePatternScore === 0 && scoreY >= 0.5,
      score: parseFloat(scoreY.toFixed(3)),
      issues: [
        ...missingSymbolNames.map((s) => `Símbolo eliminado: ${s}`),
        ...detectedRisks,
      ],
      brokenEdges,
    };

    // -------------------------------------------------------------
    // EJE Z: Runtime y Micro-Sandbox Efímero (Timeout 200ms)
    // -------------------------------------------------------------
    const sandbox = TesseractShieldSecurity.runMicroSandbox(proposedContent, 200);
    const scoreZ = sandbox.score;

    const zRuntime = {
      passed: sandbox.passed,
      score: parseFloat(scoreZ.toFixed(3)),
      issues: sandbox.error ? [sandbox.error] : [],
      executionTimeout: sandbox.timedOut,
    };

    // -------------------------------------------------------------
    // EJE W: Seguridad, Entropía de Shannon y Paquetes npm
    // -------------------------------------------------------------
    const secrets = TesseractShieldSecurity.scanSecrets(proposedContent);
    const importMatches = Array.from(proposedContent.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
    const hallucinated = TesseractShieldSecurity.scanHallucinatedPackages(importMatches, this.rootDir);

    const secretPenalty = secrets.length > 0 ? 0.85 : 0;
    const hallPenalty = hallucinated.length * 0.4;
    const scoreW = Math.max(0.0, 1.0 - (secretPenalty + hallPenalty));

    const wSecurity = {
      passed: secrets.length === 0 && hallucinated.length === 0 && scoreW >= 0.7,
      score: parseFloat(scoreW.toFixed(3)),
      issues: [
        ...secrets.map((s) => `Fuga de Secreto: ${s.type} (Línea ${s.line}, entropía ${s.entropy})`),
        ...hallucinated.map((h) => `Dependencia npm no declarada: ${h}`),
      ],
      leakedSecrets: secrets.map((s) => s.type),
      hallucinatedPackages: hallucinated,
    };

    // -------------------------------------------------------------
    // Vector de Estado 4D y Distancia de Cizallamiento Euclidiana
    // S = [x, y, z, w], delta = [1-x, 1-y, 1-z, 1-w]
    // -------------------------------------------------------------
    const stateVector4D: Point4D = [
      parseFloat(scoreX.toFixed(3)),
      parseFloat(scoreY.toFixed(3)),
      parseFloat(scoreZ.toFixed(3)),
      parseFloat(scoreW.toFixed(3)),
    ];

    const shearVector: Point4D = [
      parseFloat((1 - scoreX).toFixed(3)),
      parseFloat((1 - scoreY).toFixed(3)),
      parseFloat((1 - scoreZ).toFixed(3)),
      parseFloat((1 - scoreW).toFixed(3)),
    ];

    const shearDistance = parseFloat(
      Math.sqrt(shearVector.reduce((acc, v) => acc + v * v, 0)).toFixed(3)
    );

    // -------------------------------------------------------------
    // ANÁLISIS OCTODIMENSIONAL 8D (PHI: Asintótica, PSI: Causal, OMEGA: Async, XI: Runtime)
    // -------------------------------------------------------------
    const fullTarget = this.rootDir ? path.resolve(this.rootDir, targetPath) : path.resolve(targetPath);
    const originalContent = fs.existsSync(fullTarget) ? fs.readFileSync(fullTarget, 'utf-8') : '';
    const asympAnalyzer = new AsymptoticAnalyzer(this.rootDir);
    const asympRegression = originalContent.length > 0
      ? asympAnalyzer.detectRegression(originalContent, proposedContent, targetPath)
      : { isDegraded: asympAnalyzer.analyzeContent(proposedContent, targetPath).isDegraded, report: asympAnalyzer.analyzeContent(proposedContent, targetPath), deltaPhi: 0 };
    const asymp = asympRegression.report;
    const causal = new CausalInferenceEngine(this.rootDir).evaluateIntervention(targetPath, originalContent, proposedContent, vertices);
    const asyncFlow = new AsyncFlowAnalyzer(this.rootDir).analyzeContent(proposedContent, targetPath);

    const scorePhi = 1.0 - Math.min(1.0, asymp.asymptoticScore);
    const scorePsi = causal.causalStabilityScore;
    const scoreOmega = asyncFlow.isSafe ? 1.0 : 0.40;
    const scoreXi = 1.0;

    const stateVector8D: Point8D = [
      stateVector4D[0], stateVector4D[1], stateVector4D[2], stateVector4D[3],
      parseFloat(scorePhi.toFixed(3)),
      parseFloat(scorePsi.toFixed(3)),
      parseFloat(scoreOmega.toFixed(3)),
      parseFloat(scoreXi.toFixed(3)),
    ];

    const shearVector8D: Point8D = [
      shearVector[0], shearVector[1], shearVector[2], shearVector[3],
      parseFloat((1 - scorePhi).toFixed(3)),
      parseFloat((1 - scorePsi).toFixed(3)),
      parseFloat((1 - scoreOmega).toFixed(3)),
      parseFloat((1 - scoreXi).toFixed(3)),
    ];

    const shearDistance8D = parseFloat(
      Math.sqrt(shearVector8D.reduce((acc, v) => acc + v * v, 0)).toFixed(3)
    );

    const isSafe =
      shearDistance <= 0.75 &&
      xSyntax.passed &&
      yContracts.passed &&
      zRuntime.passed &&
      wSecurity.passed &&
      !asympRegression.isDegraded;

    // Recomendaciones y Parche Sintetizado
    const recommendations: string[] = [];
    let synthesizedPatch: string | undefined;

    if (asympRegression.isDegraded) {
      recommendations.push(`ALERTA ASINTÓTICA 8D (Eje PHI): Degeneración de rendimiento ${asymp.baselineComplexity} -> ${asymp.proposedComplexity}. ${asymp.recommendation}`);
    }

    if (causal.isSymptomaticPatch) {
      recommendations.push(`ALERTA CAUSAL 8D (Eje PSI): Parche sintomático detectado. ${causal.recommendation}`);
    }

    if (!asyncFlow.isSafe) {
      recommendations.push(`ALERTA ASÍNCRONA 8D (Eje OMEGA): ${asyncFlow.recommendation}`);
    }

    if (missingSymbolsCount > 0) {
      recommendations.push(
        `Se detectó la eliminación de ${missingSymbolsCount} símbolos (${missingSymbolNames.slice(0, 4).join(', ')}) que rompen contratos con ${targetVertex.dependents.length} archivos.`
      );
      recommendations.push(
        `Ley de Retrocompatibilidad 4D: Implementa una fachada o adaptador que conserve la signatura de: ${missingSymbolNames.slice(0, 3).join(', ')}.`
      );

      // Sintetizar parche retrocompatible
      synthesizedPatch = TopologicalAuditor.synthesizePatch({
        id: `synth-patch-${targetVertex.id}`,
        type: 'CONTRACT_MISMATCH',
        severity: 'CRITICAL',
        source: targetVertex.id,
        missingSymbol: missingSymbolNames[0],
        rippleImpact: targetVertex.dependents.length,
        affectedDependents: targetVertex.dependents,
        healingStrategy: `Implementar adaptador o stub retrocompatible para ${missingSymbolNames.join(', ')}`,
      });
    }

    if (trunc.isTruncated) {
      recommendations.push(`ALERTA DE TRUNCAMIENTO: ${trunc.reason}`);
    }

    if (sandbox.timedOut) {
      recommendations.push(`ALERTA RUNTIME: Se detectó bucle infinito o bloqueo de CPU (timeout 200ms en sandbox).`);
    }

    if (secrets.length > 0) {
      recommendations.push(`ALERTA DE SEGURIDAD: Fuga de credenciales detectada. Extraer a process.env.`);
    }

    if (hallucinated.length > 0) {
      recommendations.push(`ALERTA DE DEPENDENCIAS: Paquetes npm no instalados: ${hallucinated.join(', ')}.`);
    }

    for (const risk of detectedRisks) {
      recommendations.push(`ALERTA DE SEGURIDAD 4D: Se detectó patrón destructivo: "${risk}".`);
    }

    if (isSafe) {
      recommendations.push('El cambio es topológicamente seguro. La simetría del octeracto 8D se mantiene.');
    }

    return {
      targetPath,
      stateVector4D,
      stateVector8D,
      shearVector,
      shearVector8D,
      shearDistance,
      shearDistance8D,
      isSafe,
      axes: {
        xSyntax,
        yContracts,
        zRuntime,
        wSecurity,
      },
      brokenEdges,
      affectedCells: Array.from(affectedCellsSet),
      synthesizedPatch,
      recommendations,
    };
  }
}

