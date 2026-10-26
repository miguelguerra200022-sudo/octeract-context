/**
 * OCTERACT UNIFIED FACADE: Apertura Maestra 3
 * OcteractImpact: Onda de Choque Fractal e Impacto en Cascada (< 250 tokens)
 * Combina BlastRadiusCalculator (Geodésica 4D) + OcteractDragonBlast (Hausdorff damping dH/2)
 */

import * as path from 'node:path';
import { ProjectIndexer } from '../core/indexer.ts';
import { BlastRadiusCalculator } from '../core/blast.ts';
import { OcteractDragonBlast } from '../dragon/dragonBlast.ts';
import { OcteractRaupMorphospace } from '../morphology/index.ts';
import type { OcteractImpactOptions, OcteractImpactReport } from './types.ts';

export class OcteractImpact {
  /**
   * Analiza el radio de impacto y la onda de choque en cascada de una mutación propuesta
   */
  public static async analyze(
    targetFile: string,
    options: OcteractImpactOptions = {}
  ): Promise<OcteractImpactReport> {
    const root = path.resolve(options.rootDir || '.');
    const indexer = new ProjectIndexer();
    const loaded = indexer.loadIndex(root);
    if (!loaded) {
      indexer.indexDirectory({ rootDir: root });
    }

    const space = indexer.getSpace();
    const maxHops = options.maxHops || 15;
    const blastRes = BlastRadiusCalculator.calculate(
      space,
      targetFile,
      options.symbol,
      maxHops,
      root
    );

    // Construir grafo inverso para Dragon Blast (dependientes hacia el epicentro)
    const vertices = space.getVertices();
    const depGraph = new Map<string, string[]>();
    for (const v of vertices) {
      const vPath = v.path.replace(/\\/g, '/');
      if (!depGraph.has(vPath)) depGraph.set(vPath, []);
      for (const dep of v.dependencies || []) {
        const dPath = dep.replace(/\\/g, '/');
        if (!depGraph.has(dPath)) depGraph.set(dPath, []);
        depGraph.get(dPath)!.push(vPath);
      }
    }

    const normTarget = targetFile.replace(/\\/g, '/');
    let matchedEpicenter = normTarget;
    for (const k of depGraph.keys()) {
      if (k.endsWith(normTarget) || normTarget.endsWith(k)) {
        matchedEpicenter = k;
        break;
      }
    }

    const dragonBlast = OcteractDragonBlast.propagateWavefront(
      matchedEpicenter,
      depGraph,
      options.energy || 1.0,
      8
    );

    // Tier 1: Dependientes directos
    const tier1DirectDependents: Array<{ file: string; symbol: string; reason: string }> = [];
    const hop1 = (blastRes.hops && blastRes.hops[1]) ? blastRes.hops[1] : [];
    for (const node of hop1.slice(0, 8)) {
      tier1DirectDependents.push({
        file: node.file,
        symbol: (node.symbolsAffected && node.symbolsAffected[0]) || node.taintedSymbol || 'archivo',
        reason: `Importa directamente o consume contrato (${node.cell})`,
      });
    }

    // Tier 2: Onda expansiva secundaria
    const tier2Downstream: Array<{ file: string; symbol: string; distance: number }> = [];
    if (blastRes.hops) {
      for (const [hopStr, nodes] of Object.entries(blastRes.hops)) {
        const distance = parseInt(hopStr, 10);
        if (distance > 1) {
          for (const node of nodes) {
            tier2Downstream.push({
              file: node.file,
              symbol: (node.symbolsAffected && node.symbolsAffected[0]) || node.taintedSymbol || 'archivo',
              distance,
            });
          }
        }
      }
    }

    // Cálculo del Impact Score y Risk Level
    const totalAffected = blastRes.totalAffectedFiles || 0;
    const maxHopsReached = blastRes.maxHopsReached || 0;
    let impactScore = Math.min(100, Math.round(totalAffected * 6 + maxHopsReached * 4));
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC' = 'LOW';

    if (totalAffected > 20 || maxHopsReached > 6) {
      riskLevel = 'CATASTROPHIC';
    } else if (totalAffected > 8 || maxHopsReached > 3) {
      riskLevel = 'HIGH';
    } else if (totalAffected > 2) {
      riskLevel = 'MEDIUM';
    }

    // Orden de refactorización seguro (de hojas a epicentro)
    const safeRefactorOrder = [
      ...tier2Downstream.map((t) => t.file).reverse(),
      ...tier1DirectDependents.map((t) => t.file),
      targetFile,
    ].filter((f, idx, arr) => arr.indexOf(f) === idx);

    // Cálculo de Onda de Choque en Espiral Logarítmica Raup O(log N)
    const spiralBlast = OcteractRaupMorphospace.calculateSpiralBlast(space, matchedEpicenter);

    // Resumen Markdown Ultracompacto (< 250 tokens)
    const summaryMarkdown = [
      `### 💥 Octeract Impact Report: **Riesgo ${riskLevel}** (${impactScore}/100)`,
      `- **Epicentro**: \`${targetFile}\`${options.symbol ? ` -> \`${options.symbol}\`` : ''}`,
      `- **Onda Expansiva**: ${totalAffected} archivos alcanzados (Profundidad: ${maxHopsReached} saltos)`,
      `- **Espiral Logarítmica Raup**: ${spiralBlast.spiralWhorlsVisited} vueltas espirales recorridas | ${spiralBlast.totalAffectedFiles} módulos en onda`,
      `- **Amortiguación Hausdorff Fractal**: ${dragonBlast.nodesPrunedByFractalDamping} nodos periféricos podados`,
      `- **Dependientes Directos (Tier 1)**: ${tier1DirectDependents.length > 0 ? tier1DirectDependents.map((d) => path.basename(d.file)).slice(0, 4).join(', ') : 'Ninguno (Aislado)'}`,
      `- **Orden Seguro de Actualización**: ${safeRefactorOrder.map((f) => path.basename(f)).slice(0, 4).join(' ➔ ')}`,
    ].join('\n');

    return {
      epicenter: {
        file: targetFile,
        symbol: options.symbol,
      },
      impactScore,
      riskLevel,
      totalAffectedNodes: totalAffected,
      tier1DirectDependents,
      tier2Downstream: tier2Downstream.slice(0, 10),
      spiralBlast: {
        spiralWhorlsVisited: spiralBlast.spiralWhorlsVisited,
        totalAffectedFiles: spiralBlast.totalAffectedFiles,
      },
      safeRefactorOrder,
      summaryMarkdown,
    };
  }
}
