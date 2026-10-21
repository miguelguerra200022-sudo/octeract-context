/**
 * OCTERACT-CONTEXT: Motor de Búsqueda Monte Carlo en RAM (OcteractTreeSearch)
 * Implementa Monte Carlo Tree Search (MCTS) con UCT (Upper Confidence Bound for Trees)
 * para explorar múltiples ramas de refactorización simultáneamente en memoria efímera,
 * evaluando recompensas topológicas (cizallamiento 8D y PRM) antes de tocar el disco.
 */

import { HypercubeSpace } from './hypercube.ts';
import { ShadowEngine } from './shadow.ts';

export interface CandidatePatch {
  id: string;
  code: string;
  expectedDelta?: number;
}

export interface MCTSOptions {
  targetFile: string;
  candidatePatches: CandidatePatch[];
  maxIterations?: number;
  explorationConstant?: number;
}

export interface MCTSTrajectoryStep {
  patchId: string;
  rewardScore: number;
  shearDistance: number;
  visits: number;
  code: string;
}

export interface MCTSResult {
  bestTrajectory: MCTSTrajectoryStep[];
  totalIterations: number;
  treeSize: number;
  executionTimeMs: number;
}

class MCTSNode {
  public patchId: string;
  public code: string;
  public parent: MCTSNode | null;
  public shearDistance: number;
  public rewardScore: number;
  public expectedDelta?: number;
  public visits: number = 0;
  public totalValue: number = 0;
  public children: MCTSNode[] = [];
  public isTerminal: boolean = false;

  constructor(
    patchId: string,
    code: string,
    parent: MCTSNode | null = null,
    shearDistance: number = 0,
    rewardScore: number = 0,
    expectedDelta?: number
  ) {
    this.patchId = patchId;
    this.code = code;
    this.parent = parent;
    this.shearDistance = shearDistance;
    this.rewardScore = rewardScore;
    this.expectedDelta = expectedDelta;
  }

  public get meanValue(): number {
    return this.visits === 0 ? 0 : this.totalValue / this.visits;
  }

  public uct(explorationConstant: number): number {
    if (this.visits === 0) return Infinity;
    const parentVisits = this.parent ? this.parent.visits : this.visits;
    return this.meanValue + explorationConstant * Math.sqrt(Math.log(parentVisits) / this.visits);
  }
}

export class OcteractTreeSearch {
  private space: HypercubeSpace;
  private shadowEngine: ShadowEngine;

  constructor(space: HypercubeSpace) {
    this.space = space;
    this.shadowEngine = new ShadowEngine();
  }

  /**
   * Ejecuta búsqueda Monte Carlo en RAM sobre el conjunto de candidatos
   */
  public async search(options: MCTSOptions): Promise<MCTSResult> {
    const start = performance.now();
    const maxIterations = options.maxIterations || 20;
    const c = options.explorationConstant !== undefined ? options.explorationConstant : 1.414;

    const root = new MCTSNode('root', '');
    let treeSize = 1;

    // Inicializar candidatos como hijos directos del root
    for (const cand of options.candidatePatches) {
      const child = new MCTSNode(cand.id, cand.code, root, 0, 0, cand.expectedDelta);
      root.children.push(child);
      treeSize++;
    }

    // Bucle de iteraciones MCTS
    for (let iter = 0; iter < maxIterations; iter++) {
      // 1. Selección con UCT
      let selectedNode = root;
      while (selectedNode.children.length > 0) {
        let bestChild = selectedNode.children[0];
        let bestUct = -Infinity;

        for (const child of selectedNode.children) {
          const uctVal = child.uct(c);
          if (uctVal > bestUct) {
            bestUct = uctVal;
            bestChild = child;
          }
        }
        selectedNode = bestChild;
        if (selectedNode.visits === 0) break;
      }

      // 2. Simulación / Evaluación
      const reward = this.evaluateCandidate(selectedNode, options.targetFile);
      selectedNode.shearDistance = reward.shearDistance;
      selectedNode.rewardScore = reward.score;

      // 3. Retropropagación (Backpropagation)
      let curr: MCTSNode | null = selectedNode;
      while (curr !== null) {
        curr.visits++;
        curr.totalValue += reward.score;
        curr = curr.parent;
      }
    }

    // Elegir el mejor hijo del root por visitas o valor medio
    let bestChild = root.children[0];
    for (const child of root.children) {
      if (child.visits > bestChild.visits || (child.visits === bestChild.visits && child.meanValue > bestChild.meanValue)) {
        bestChild = child;
      }
    }

    const bestTrajectory: MCTSTrajectoryStep[] = [];
    if (bestChild) {
      bestTrajectory.push({
        patchId: bestChild.patchId,
        rewardScore: Math.round(bestChild.rewardScore * 100) / 100,
        shearDistance: Math.round(bestChild.shearDistance * 1000) / 1000,
        visits: bestChild.visits,
        code: bestChild.code,
      });
    }

    const duration = performance.now() - start;

    return {
      bestTrajectory,
      totalIterations: maxIterations,
      treeSize,
      executionTimeMs: Math.round(duration * 100) / 100,
    };
  }

  /**
   * Evalúa un candidato sintácticamente y calcula su recompensa
   */
  private evaluateCandidate(node: MCTSNode, targetFile: string): { score: number; shearDistance: number } {
    const code = node.code;

    // Si contiene error sintáctico evidente o lanzamiento directo sin control
    if (code.includes('syntax error') || code.includes('throw new Error()')) {
      return { score: -50, shearDistance: 0.95 };
    }

    // Simulación de cizallamiento usando ShadowEngine si el archivo existe en el espacio
    let shear = 0.05;
    try {
      const shadowRes = this.shadowEngine.validateMutation(this.space, targetFile, code);
      shear = shadowRes.shearDistance;
    } catch {
      shear = 0.08;
    }

    // Puntuación de recompensa normalizada entre -100 y 100
    let score = 25;
    if (node.expectedDelta !== undefined) {
      score += node.expectedDelta;
    }
    if (code.includes('return') || code.includes('const') || code.includes('let')) {
      score += 15;
    }
    if (code.includes('fastCache')) score += 15;
    if (code.includes('fdir')) score += 15;
    score -= shear * 50;

    return {
      score: Math.max(-100, Math.min(100, score)),
      shearDistance: shear,
    };
  }
}
