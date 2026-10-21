/**
 * OCTERACT-DEEPMIND: Tensor Relacional Triangular (Pairformer de Código)
 * Inspirado en Google DeepMind AlphaFold 3 (Nature 2024):
 * Modela todas las interacciones por pares (N x N) entre módulos y símbolos
 * mediante actualizaciones multiplicativas triangulares para imponer la desigualdad
 * triangular arquitectónica y detectar efectos dominó transitivos de 2º y 3º orden.
 */

import { HypercubeSpace } from '../core/hypercube.ts';
import { type HyperVertex } from '../core/types.ts';

export interface PairwiseRelation {
  source: string;
  target: string;
  directCoupling: number; // 0.0 a 1.0
  geodesicDistance: number; // Distancia en T^8
  triangularStrength: number; // Fuerza multiplicativa transitiva sum_k (W_ik * W_kj)
  intermediateHops: string[];
  isShadowBottleneck: boolean;
}

export interface TriangularInvarianceViolation {
  source: string;
  intermediate: string;
  target: string;
  directEdgeWeight: number;
  transitiveRiskScore: number;
  description: string;
  healingAdvice: string;
}

export interface PairformerReport {
  totalVertices: number;
  totalPairRelations: number;
  triangularDensity: number;
  shadowBottlenecksCount: number;
  violations: TriangularInvarianceViolation[];
  topCriticalPairs: PairwiseRelation[];
}

export class OcteractPairformer {
  private space: HypercubeSpace;

  constructor(space: HypercubeSpace) {
    this.space = space;
  }

  /**
   * Construye el tensor de pares N x N y ejecuta las actualizaciones triangulares
   */
  public computePairTensor(): PairformerReport {
    const vertices = this.space.getVertices();
    const n = vertices.length;
    const vertexMap = new Map<string, HyperVertex>();
    vertices.forEach((v) => vertexMap.set(v.id, v));

    // Matriz de adyacencia directa W_ij
    const adj = new Map<string, Map<string, number>>();
    for (const v of vertices) {
      const row = new Map<string, number>();
      for (const dep of v.dependencies) {
        row.set(dep, 1.0);
      }
      adj.set(v.id, row);
    }

    const pairRelations: PairwiseRelation[] = [];
    const violations: TriangularInvarianceViolation[] = [];

    // Actualización multiplicativa triangular estilo Pairformer:
    // T(i, j) = Direct(i, j) + sum_k [ W(i, k) * W(k, j) ]
    for (let i = 0; i < n; i++) {
      const vA = vertices[i];
      const rowA = adj.get(vA.id)!;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const vB = vertices[j];

        const direct = rowA.get(vB.id) || 0.0;
        let triangularSum = 0.0;
        const intermediates: string[] = [];

        // Buscar nodos puente k
        for (let k = 0; k < n; k++) {
          if (k === i || k === j) continue;
          const vK = vertices[k];
          const wIK = rowA.get(vK.id) || 0.0;
          const wKJ = adj.get(vK.id)?.get(vB.id) || 0.0;

          if (wIK > 0 && wKJ > 0) {
            triangularSum += wIK * wKJ;
            if (intermediates.length < 3) intermediates.push(vK.id);
          }
        }

        if (direct > 0 || triangularSum > 0) {
          const isBottleneck = triangularSum >= 2.0 && direct === 0.0; // Alto acoplamiento transitivo sin dependencia directa
          const dist = this.space.calculateGeodesicDistance(vA.coordinates, vB.coordinates);

          pairRelations.push({
            source: vA.id,
            target: vB.id,
            directCoupling: direct,
            geodesicDistance: parseFloat(dist.toFixed(3)),
            triangularStrength: parseFloat(triangularSum.toFixed(2)),
            intermediateHops: intermediates,
            isShadowBottleneck: isBottleneck,
          });

          // Detectar violación de invarianza triangular:
          // Si A depende fuertemente de K y K de B, pero la distancia 8D es extrema
          if (triangularSum >= 1.0 && dist > 1.25) {
            violations.push({
              source: vA.id,
              intermediate: intermediates[0] || 'módulo_intermedio',
              target: vB.id,
              directEdgeWeight: direct,
              transitiveRiskScore: parseFloat((triangularSum * dist).toFixed(2)),
              description: 'Tensión topológica triangular: ' + vA.id + ' y ' + vB.id + ' están geométricamente lejanos en 8D pero fuertemente acoplados vía ' + intermediates.join(', '),
              healingAdvice: 'Considere introducir una fachada intermedia o desacoplar contratos para relajar la tensión triangular.',
            });
          }
        }
      }
    }

    // Ordenar pares más críticos
    pairRelations.sort((a, b) => b.triangularStrength - a.triangularStrength);

    return {
      totalVertices: n,
      totalPairRelations: pairRelations.length,
      triangularDensity: parseFloat((pairRelations.length / Math.max(1, n * n)).toFixed(3)),
      shadowBottlenecksCount: pairRelations.filter((p) => p.isShadowBottleneck).length,
      violations,
      topCriticalPairs: pairRelations.slice(0, 10),
    };
  }
}
