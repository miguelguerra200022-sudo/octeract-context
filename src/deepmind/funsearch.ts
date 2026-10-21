/**
 * OCTERACT-DEEPMIND: Motor de Búsqueda Evolutiva en Espacio de Funciones (FunSearch)
 * Inspirado en Google DeepMind FunSearch (Nature 2023):
 * Acopla LLMs con un evaluador automático en sandbox y un modelo de islas genéticas
 * para descubrir algoritmos, parches y optimizaciones en código ejecutable.
 */

import { TesseractShieldSecurity } from '../core/security.ts';
import { AsymptoticAnalyzer } from '../core/asymptotics.ts';
import { ShadowEngine } from '../core/shadow.ts';
import { HypercubeSpace } from '../core/hypercube.ts';

export interface ProgramCandidate {
  id: string;
  code: string;
  score: number; // 0 a 100
  asymptoticComplexity: string;
  shearDistance: number;
  isSafe: boolean;
  generation: number;
  islandId: number;
  passedSandbox: boolean;
  executionTimeMs: number;
  errorMsg?: string;
  metadata?: Record<string, any>;
}

export interface Island {
  id: number;
  name: string;
  generation: number;
  candidates: ProgramCandidate[];
  bestScore: number;
  stagnationCounter: number;
}

export interface FunSearchSpecification {
  functionName: string;
  baselineCode: string;
  requirements: string;
  signatureTemplate: string;
  evaluationCriteria: string[];
  systemPrompt: string;
}

export interface FunSearchReport {
  totalEvaluated: number;
  islandsCount: number;
  eliteCandidate?: ProgramCandidate;
  generationMax: number;
  globalBestScore: number;
  islandsSummary: Array<{
    islandId: number;
    name: string;
    generation: number;
    candidatesCount: number;
    bestScore: number;
  }>;
}

export class OcteractFunSearchEngine {
  private rootDir: string;
  private space?: HypercubeSpace;
  private islands: Map<number, Island> = new Map();
  private readonly numIslands: number;
  private totalEvaluations: number = 0;
  private candidateCounter: number = 0;

  constructor(rootDir: string, space?: HypercubeSpace, numIslands: number = 4) {
    this.rootDir = rootDir;
    this.space = space;
    this.numIslands = numIslands;
    this.initIslands();
  }

  private initIslands(): void {
    const islandNames = [
      'Isla-Alpha (Mínima Complejidad)',
      'Isla-Beta (Invarianza Topológica)',
      'Isla-Gamma (Máxima Concurrencia)',
      'Isla-Delta (Exploración Novedosa)',
    ];
    for (let i = 0; i < this.numIslands; i++) {
      this.islands.set(i, {
        id: i,
        name: islandNames[i % islandNames.length],
        generation: 0,
        candidates: [],
        bestScore: 0,
        stagnationCounter: 0,
      });
    }
  }

  /**
   * Genera la Especificación formal para que el LLM proponga mutaciones en espacio de funciones
   */
  public createSpecification(
    functionName: string,
    baselineCode: string,
    requirements: string
  ): FunSearchSpecification {
    const signatureMatch =
      baselineCode.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\([^)]*\)/) ||
      baselineCode.match(/(?:public|private|static)?\s*(?:async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)/);
    const signatureTemplate = signatureMatch ? signatureMatch[0] : 'function ' + functionName + '()';

    const systemPrompt = [
      "Eres el Sampler de Código del sistema FunSearch (Google DeepMind + Octeract 8D).",
      "Tu tarea es evolucionar y optimizar la función '" + functionName + "' en el espacio de funciones de código ejecutable.",
      "REGLAS ESTRICTAS:",
      "1. Devuelve únicamente la función optimizada ejecutable sin bloques explicativos ni markdown superfluo.",
      "2. La función debe respetar la signatura base para garantizar retrocompatibilidad.",
      "3. Optimiza la complejidad algorítmica (Eje Big-O Φ) y elimina bucles o trampas asíncronas.",
      "4. Código seguro sin secretos ni dependencias no declaradas.",
    ].join('\n');

    return {
      functionName,
      baselineCode,
      requirements,
      signatureTemplate,
      evaluationCriteria: [
        'Ejecución correcta en sandbox sin excepciones (< 200ms)',
        'Cero fugas de memoria o promesas huérfanas',
        'Complejidad asintótica O(1) u O(N) frente a O(N^2)',
        'Cizallamiento topológico Euclidiano <= 0.75 frente al contrato base',
      ],
      systemPrompt,
    };
  }

  /**
   * Evalúa rigurosamente un candidato en el Sandbox Efímero y calcula su fitness score
   */
  public evaluateCandidate(
    code: string,
    targetPath: string,
    baselineContent?: string
  ): Omit<ProgramCandidate, 'id' | 'generation' | 'islandId'> {
    this.totalEvaluations++;

    // 1. Sandbox efímero (Límite 200ms)
    const sandboxRes = TesseractShieldSecurity.runMicroSandbox(code, 200);

    // 2. Análisis Asintótico (Eje Φ)
    const asympAnalyzer = new AsymptoticAnalyzer(this.rootDir);
    let asympScore = 0.5;
    let complexity = 'O(N)';

    if (baselineContent) {
      const reg = asympAnalyzer.detectRegression(baselineContent, code, targetPath);
      complexity = reg.report.baselineComplexity;
      asympScore = 1.0 - reg.report.asymptoticScore;
    } else {
      const rep = asympAnalyzer.analyzeContent(code, targetPath);
      complexity = rep.baselineComplexity;
      asympScore = 1.0 - rep.asymptoticScore;
    }

    // 3. Proyección de Sombra si hay espacio hiperdimensional disponible
    let shearDistance = 0.0;
    let isSafe = sandboxRes.passed;

    if (this.space) {
      const shadow = new ShadowEngine(this.space, this.rootDir);
      const proj = shadow.project(targetPath, code);
      shearDistance = proj.shearDistance;
      isSafe = proj.isSafe && sandboxRes.passed;
    }

    // 4. Cálculo de Fitness Score (0 a 100)
    // Fitness = 40% Sandbox Correctness + 30% Asymptotic Efficiency + 30% Topological Symmetry
    let fitness = 0;
    if (sandboxRes.passed) fitness += 40;
    fitness += Math.round(Math.max(0, Math.min(1, asympScore)) * 30);
    const shearBonus = Math.max(0, 1.0 - Math.min(1.0, shearDistance / 0.75));
    fitness += Math.round(shearBonus * 30);

    return {
      code,
      score: fitness,
      asymptoticComplexity: complexity,
      shearDistance,
      isSafe,
      passedSandbox: sandboxRes.passed,
      executionTimeMs: sandboxRes.executionTimeMs,
      errorMsg: sandboxRes.error,
    };
  }

  /**
   * Registra un candidato evaluado en una isla específica o en la siguiente por turno
   */
  public registerCandidate(
    evalResult: Omit<ProgramCandidate, 'id' | 'generation' | 'islandId'>,
    targetIslandId?: number
  ): ProgramCandidate {
    const islandId =
      targetIslandId !== undefined && this.islands.has(targetIslandId)
        ? targetIslandId
        : this.candidateCounter % this.numIslands;

    const island = this.islands.get(islandId)!;
    island.generation++;

    const candidate: ProgramCandidate = {
      ...evalResult,
      id: 'cand-' + islandId + '-' + island.generation + '-' + Date.now(),
      generation: island.generation,
      islandId,
    };

    island.candidates.push(candidate);

    // Actualizar mejor candidato de la isla
    if (candidate.score > island.bestScore) {
      island.bestScore = candidate.score;
      island.bestCandidate = candidate;
      island.stagnationCounter = 0;
    } else {
      island.stagnationCounter++;
    }

    // Si la isla se estanca por más de 10 generaciones, se resetea la población inferior
    if (island.stagnationCounter >= 10) {
      this.resetStagnantIsland(islandId);
    }

    this.candidateCounter++;
    return candidate;
  }

  /**
   * Migración de élites entre islas para preservar diversidad genética
   */
  public migrateEliteSolutions(): number {
    let migrations = 0;
    const elites: ProgramCandidate[] = [];

    for (const island of this.islands.values()) {
      if (island.bestCandidate && island.bestCandidate.isSafe) {
        elites.push(island.bestCandidate);
      }
    }

    if (elites.length < 2) return 0;

    for (let i = 0; i < this.numIslands; i++) {
      const targetIsland = this.islands.get((i + 1) % this.numIslands)!;
      const eliteSource = elites[i % elites.length];
      if (eliteSource && !targetIsland.candidates.some((c) => c.id === eliteSource.id)) {
        targetIsland.candidates.push({
          ...eliteSource,
          islandId: targetIsland.id,
          id: 'migrant-' + targetIsland.id + '-' + eliteSource.id,
        });
        migrations++;
      }
    }

    return migrations;
  }

  private resetStagnantIsland(islandId: number): void {
    const island = this.islands.get(islandId);
    if (!island) return;
    if (island.bestCandidate) {
      island.candidates = [island.bestCandidate];
    } else {
      island.candidates = [];
    }
    island.stagnationCounter = 0;
  }

  /**
   * Obtiene la solución élite de todo el sistema de islas
   */
  public getEliteSolution(): ProgramCandidate | undefined {
    let globalBest: ProgramCandidate | undefined;
    for (const island of this.islands.values()) {
      if (island.bestCandidate) {
        if (!globalBest || island.bestCandidate.score > globalBest.score) {
          globalBest = island.bestCandidate;
        }
      }
    }
    return globalBest;
  }

  /**
   * Genera el reporte consolidado de FunSearch
   */
  public getReport(): FunSearchReport {
    const elite = this.getEliteSolution();
    let maxGen = 0;
    const summaries: FunSearchReport['islandsSummary'] = [];

    for (const island of this.islands.values()) {
      if (island.generation > maxGen) maxGen = island.generation;
      summaries.push({
        islandId: island.id,
        name: island.name,
        generation: island.generation,
        candidatesCount: island.candidates.length,
        bestScore: island.bestScore,
      });
    }

    return {
      totalEvaluated: this.totalEvaluations,
      islandsCount: this.numIslands,
      eliteCandidate: elite,
      generationMax: maxGen,
      globalBestScore: elite ? elite.score : 0,
      islandsSummary: summaries,
    };
  }
}
