/**
 * TESSERACT-CONTEXT: Motor Geométrico y de Proyección del Hipercubo 4D
 * Rotaciones ortogonales en 6 planos, proyección de sombras y cortes dimensionales (Slices)
 */

import { CubicCell, type Point4D, type RotationPlane, type HyperVertex, type HyperStats, type SliceRequest, type SliceResult } from './types.ts';
import { HexadecTree } from './hexadectree.ts';

export class HypercubeSpace {
  public tree: HexadecTree;
  private vertices: Map<string, HyperVertex> = new Map();

  constructor(tree?: HexadecTree) {
    this.tree = tree || new HexadecTree();
  }

  /**
   * Agrega un vértice al hipercubo
   */
  public addVertex(vertex: HyperVertex): void {
    this.vertices.set(vertex.id, vertex);
    this.tree.insert(vertex);
  }

  /**
   * Elimina un vértice del hipercubo
   */
  public removeVertex(id: string): void {
    this.vertices.delete(id);
  }

  /**
   * Obtiene todos los vértices
   */
  public getVertices(): HyperVertex[] {
    return Array.from(this.vertices.values());
  }

  /**
   * Clona el espacio hiperdimensional de forma ultra-ligera en RAM para transacciones efímeras
   */
  public clone(): HypercubeSpace {
    const newSpace = new HypercubeSpace();
    for (const v of this.vertices.values()) {
      newSpace.addVertex({
        ...v,
        symbols: v.symbols.map((s) => ({ ...s, dependencies: [...s.dependencies] })),
        dependencies: [...v.dependencies],
        dependents: [...v.dependents],
        coordinate: [...v.coordinate] as Point4D,
      });
    }
    return newSpace;
  }

  /**
   * Aplica una rotación 4D en uno de los 6 planos ortogonales usando álgebra matricial
   * @param point Coordenada original [x, y, z, w]
   * @param plane Plano de rotación ('XY' | 'XZ' | 'XW' | 'YZ' | 'YW' | 'ZW')
   * @param angle Ángulo en radianes
   */
  public static rotate4D(point: Point4D, plane: RotationPlane, angle: number): Point4D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let [x, y, z, w] = point;

    switch (plane) {
      case 'XY': {
        const nx = x * cos - y * sin;
        const ny = x * sin + y * cos;
        return [nx, ny, z, w];
      }
      case 'XZ': {
        const nx = x * cos - z * sin;
        const nz = x * sin + z * cos;
        return [nx, y, nz, w];
      }
      case 'XW': {
        const nx = x * cos - w * sin;
        const nw = x * sin + w * cos;
        return [nx, y, z, nw];
      }
      case 'YZ': {
        const ny = y * cos - z * sin;
        const nz = y * sin + z * cos;
        return [x, ny, nz, w];
      }
      case 'YW': {
        const ny = y * cos - w * sin;
        const nw = y * sin + w * cos;
        return [x, ny, z, nw];
      }
      case 'ZW': {
        const nz = z * cos - w * sin;
        const nw = z * sin + w * cos;
        return [x, y, nz, nw];
      }
      default:
        return [x, y, z, w];
    }
  }

  /**
   * Proyecta una coordenada 4D hacia el espacio 3D mediante perspectiva hiperdimensional
   * wDistance simula la distancia de la cámara en la 4ª dimensión
   */
  public static project4Dto3D(point: Point4D, cameraDistance: number = 2.0): [number, number, number] {
    const [x, y, z, w] = point;
    const factor = 1.0 / Math.max(0.01, cameraDistance - w);
    return [x * factor, y * factor, z * factor];
  }

  /**
   * Ejecuta un corte dimensional quirúrgico (Hyper-Slice) para alimentar a un agente de IA
   * Respeta estrictamente el presupuesto de tokens (tokenBudget)
   */
  public slice(request: SliceRequest): SliceResult {
    const tokenBudget = request.tokenBudget || 2500;
    let candidates = Array.from(this.vertices.values());

    // 1. Filtrar por celda cúbica si se especifica
    if (request.cell) {
      candidates = candidates.filter((v) => v.cell === request.cell);
    }

    // 2. Ordenar por cercanía si hay un símbolo o coordenada central
    if (request.focusSymbol || request.centerHex) {
      let targetPoint: Point4D = [0.5, 0.5, 0.5, 0.5];

      if (request.centerHex) {
        targetPoint = this.tree.hexToPoint(request.centerHex);
      } else if (request.focusSymbol) {
        const match = candidates.find(
          (v) => v.id.includes(request.focusSymbol!) || v.symbols.some((s) => s.name === request.focusSymbol)
        );
        if (match) targetPoint = match.coordinate;
      }

      candidates.sort((a, b) => {
        const distA = HexadecTree.distance4D(targetPoint, a.coordinate);
        const distB = HexadecTree.distance4D(targetPoint, b.coordinate);
        return distA - distB;
      });
    }

    // 3. Empaquetar candidatos respetando el presupuesto de tokens
    const selected: HyperVertex[] = [];
    let accumulatedTokens = 0;
    const activeCellsSet = new Set<CubicCell>();

    for (const vertex of candidates) {
      const estimatedCost = Math.min(vertex.tokenEstimate, 600); // Muestreo comprimido
      if (accumulatedTokens + estimatedCost > tokenBudget && selected.length > 0) {
        break;
      }

      selected.push(vertex);
      accumulatedTokens += estimatedCost;
      activeCellsSet.add(vertex.cell);
    }

    // 4. Formatear la proyección en texto estructurado y ultracompacto para el LLM
    let projectedCode = `=== [TESSERACT-CONTEXT: 4D HYPER-SLICE] ===\n`;
    projectedCode += `Presupuesto de tokens: ${accumulatedTokens}/${tokenBudget} | Vértices seleccionados: ${selected.length}\n`;
    projectedCode += `Celdas activas: ${Array.from(activeCellsSet).join(', ')}\n\n`;

    for (const vertex of selected) {
      projectedCode += `--- [Vértice: ${vertex.id} | Celda: ${vertex.cell} | Hex: ${vertex.hexCode}] ---\n`;
      projectedCode += `Líneas: ${vertex.lines} | Dependencias: [${vertex.dependencies.slice(0, 5).join(', ')}]\n`;
      if (vertex.symbols.length > 0) {
        projectedCode += `Símbolos clave:\n`;
        for (const sym of vertex.symbols.slice(0, 8)) {
          const sig = sym.signature ? `: ${sym.signature}` : '';
          projectedCode += `  * ${sym.kind} ${sym.name}${sig} (L${sym.lineStart}-L${sym.lineEnd})\n`;
        }
      }
      projectedCode += `\n`;
    }

    const totalRawTokens = candidates.reduce((acc, v) => acc + v.tokenEstimate, 0);
    const compressionRatio = totalRawTokens > 0 
      ? Math.round((1 - accumulatedTokens / totalRawTokens) * 100) 
      : 0;

    return {
      vertices: selected,
      totalTokens: accumulatedTokens,
      projectedCode,
      summary: `Corte de ${selected.length} vértices en celdas [${Array.from(activeCellsSet).join(', ')}], ahorro de ${compressionRatio}% de tokens.`,
      activeCells: Array.from(activeCellsSet),
      compressionRatio,
    };
  }

  /**
   * Calcula las métricas de salud global del hipercubo
   */
  public getHyperStats(): HyperStats {
    const vertices = Array.from(this.vertices.values());
    const cellDistribution: Record<CubicCell, number> = {
      [CubicCell.CoreLogic]: 0,
      [CubicCell.Types]: 0,
      [CubicCell.Storage]: 0,
      [CubicCell.Network]: 0,
      [CubicCell.Tests]: 0,
      [CubicCell.Config]: 0,
      [CubicCell.Security]: 0,
      [CubicCell.Telemetry]: 0,
    };

    let totalTokens = 0;
    let totalInDegree = 0;

    for (const v of vertices) {
      cellDistribution[v.cell] = (cellDistribution[v.cell] || 0) + 1;
      totalTokens += v.tokenEstimate;
      totalInDegree += (v.inDegree || 0);
    }

    // Curvatura dimensional: entropía de la distribución en las 8 celdas
    const nonZeroCells = Object.values(cellDistribution).filter((c) => c > 0).length;
    const dimensionalCurvature = nonZeroCells / 8.0;

    // Índice de acoplamiento espagueti
    const couplingIndex = vertices.length > 0 
      ? Math.min(1.0, totalInDegree / (vertices.length * 4.0)) 
      : 0;

    let healthStatus: 'OPTIMAL' | 'MODERATE_TENSION' | 'HIGH_SHEAR_RISK' = 'OPTIMAL';
    if (couplingIndex > 0.6) {
      healthStatus = 'HIGH_SHEAR_RISK';
    } else if (couplingIndex > 0.35) {
      healthStatus = 'MODERATE_TENSION';
    }

    return {
      totalVertices: vertices.length,
      totalEdges: Math.round(totalInDegree),
      totalTokens,
      hexadecDepth: this.tree.getTreeMetrics().maxDepth,
      cellDistribution,
      dimensionalCurvature,
      couplingIndex,
      healthStatus,
    };
  }
}
