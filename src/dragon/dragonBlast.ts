/**
 * Octeract-Context v4.6.0 Dragon Curve Suite
 * OcteractDragonBlast - Fractal Wavefront Shockwave Propagation with Hausdorff Damping
 *
 * Propagates ripple-effect blast radiuses along Heighway Dragon folding sequences.
 * Uses fractal boundary damping (dH/2 ≈ 0.7618) to prevent exponential explosion
 * and focus energy strictly on high-impact architectural cascades.
 */

import { OcteractDragonIndex } from './dragonIndex.ts';

export interface DragonWavefrontTier {
  creaseLevel: number;
  turnDirection: 'R' | 'L';
  nodes: string[];
  attenuatedEnergy: number;
}

export interface DragonBlastReport {
  epicenter: string;
  initialEnergy: number;
  finalResidualEnergy: number;
  fractalDampingFactor: number;
  totalNodesReached: number;
  nodesPrunedByFractalDamping: number;
  tokenSavingsPercent: number;
  tiers: DragonWavefrontTier[];
  nodeEnergyMap: Record<string, number>;
  primaryImpactChain: string[];
}

export class OcteractDragonBlast {
  public static readonly HAUSDORFF_DAMPING = OcteractDragonIndex.HAUSDORFF_DIMENSION / 2; // ≈ 0.7618135
  public static readonly MIN_ENERGY_THRESHOLD = 0.05; // Cutoff threshold

  /**
   * Propagates a mutation shockwave across a dependency graph using Dragon fractal folding.
   */
  public static propagateWavefront(
    epicenter: string,
    graph: Map<string, string[]>,
    initialEnergy: number = 1.0,
    maxCreases: number = 8
  ): DragonBlastReport {
    const nodeEnergyMap: Record<string, number> = {};
    const tiers: DragonWavefrontTier[] = [];
    const visited = new Set<string>();

    nodeEnergyMap[epicenter] = initialEnergy;
    visited.add(epicenter);

    let currentFrontier = [epicenter];
    let currentEnergy = initialEnergy;
    let prunedCount = 0;
    const primaryImpactChain: string[] = [epicenter];

    for (let crease = 1; crease <= maxCreases; crease++) {
      if (currentFrontier.length === 0 || currentEnergy < this.MIN_ENERGY_THRESHOLD) {
        break;
      }

      const turn = OcteractDragonIndex.getTurnAtStep(crease);
      // Damping with fractal Hausdorff contraction factor
      currentEnergy = currentEnergy * this.HAUSDORFF_DAMPING;

      const nextFrontier: string[] = [];

      for (const node of currentFrontier) {
        const neighbors = graph.get(node) || [];
        for (let i = 0; i < neighbors.length; i++) {
          const neighbor = neighbors[i];
          if (!visited.has(neighbor)) {
            // Alternating fractal branching filter: prioritize nodes matching the fold turn
            const isPriorityFold = (i % 2 === 0 && turn === 'R') || (i % 2 === 1 && turn === 'L');
            const effectiveEnergy = isPriorityFold ? currentEnergy : currentEnergy * 0.7;

            if (effectiveEnergy >= this.MIN_ENERGY_THRESHOLD) {
              visited.add(neighbor);
              nextFrontier.push(neighbor);
              nodeEnergyMap[neighbor] = parseFloat(effectiveEnergy.toFixed(4));
            } else {
              prunedCount++;
            }
          }
        }
      }

      if (nextFrontier.length > 0) {
        tiers.push({
          creaseLevel: crease,
          turnDirection: turn,
          nodes: nextFrontier,
          attenuatedEnergy: parseFloat(currentEnergy.toFixed(4)),
        });

        // Add strongest node to primary impact chain
        let maxEnergyNode = nextFrontier[0];
        let maxE = nodeEnergyMap[maxEnergyNode] || 0;
        for (const n of nextFrontier) {
          if ((nodeEnergyMap[n] || 0) > maxE) {
            maxE = nodeEnergyMap[n];
            maxEnergyNode = n;
          }
        }
        primaryImpactChain.push(maxEnergyNode);
      }

      currentFrontier = nextFrontier;
    }

    const totalNodesReached = Object.keys(nodeEnergyMap).length;
    const totalPotentialNodes = totalNodesReached + prunedCount;
    const tokenSavingsPercent = totalPotentialNodes > 0
      ? Math.round((prunedCount / totalPotentialNodes) * 100)
      : 0;

    return {
      epicenter,
      initialEnergy,
      finalResidualEnergy: parseFloat(currentEnergy.toFixed(4)),
      fractalDampingFactor: parseFloat(this.HAUSDORFF_DAMPING.toFixed(4)),
      totalNodesReached,
      nodesPrunedByFractalDamping: prunedCount,
      tokenSavingsPercent,
      tiers,
      nodeEnergyMap,
      primaryImpactChain,
    };
  }
}
