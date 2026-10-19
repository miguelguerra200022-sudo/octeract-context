/**
 * TESSERACT-CONTEXT: Hexadec-Tree (Teseracto Fractal)
 * Estructura de datos 16-aria en R^4 con direccionamiento hexadecimal O(1)
 */

import { CubicCell, type Point4D, type HyperVertex, type HexadecNode } from './types.ts';

export class HexadecTree {
  public root: HexadecNode;
  private vertexMap: Map<string, HyperVertex> = new Map();
  private maxDepth: number;

  constructor(maxDepth: number = 4) {
    this.maxDepth = maxDepth;
    this.root = this.createEmptyNode(0, 0, '0x');
  }

  /**
   * Crea un nodo vacío en el árbol 16-ario
   */
  private createEmptyNode(nibble: number, depth: number, hexPrefix: string): HexadecNode {
    const cellCounts: Record<CubicCell, number> = {
      [CubicCell.CoreLogic]: 0,
      [CubicCell.Types]: 0,
      [CubicCell.Storage]: 0,
      [CubicCell.Network]: 0,
      [CubicCell.Tests]: 0,
      [CubicCell.Config]: 0,
      [CubicCell.Security]: 0,
      [CubicCell.Telemetry]: 0,
    };

    return {
      nibble,
      depth,
      hexPrefix,
      children: new Array(16).fill(null),
      vertexIds: [],
      aggregate: {
        totalTokens: 0,
        totalFiles: 0,
        cellCounts,
      },
    };
  }

  /**
   * Convierte una coordenada continua en R^4 [0, 1]^4 en un código hexadecimal jerárquico.
   * Cada nivel de profundidad fractal corresponde exactamente a 1 nibble (4 bits: X, Y, Z, W).
   */
  public coordinateToHex(point: Point4D, targetDepth: number = this.maxDepth): string {
    let hex = '0x';
    const current = [
      Math.max(0, Math.min(0.999999, point[0])),
      Math.max(0, Math.min(0.999999, point[1])),
      Math.max(0, Math.min(0.999999, point[2])),
      Math.max(0, Math.min(0.999999, point[3])),
    ];

    for (let d = 0; d < targetDepth; d++) {
      const bitX = current[0] >= 0.5 ? 1 : 0;
      const bitY = current[1] >= 0.5 ? 1 : 0;
      const bitZ = current[2] >= 0.5 ? 1 : 0;
      const bitW = current[3] >= 0.5 ? 1 : 0;

      const nibble = (bitX << 3) | (bitY << 2) | (bitZ << 1) | bitW;
      hex += nibble.toString(16).toUpperCase();

      // Escalar al sub-hipercubo hijo para el siguiente nivel fractal
      current[0] = bitX ? (current[0] - 0.5) * 2 : current[0] * 2;
      current[1] = bitY ? (current[1] - 0.5) * 2 : current[1] * 2;
      current[2] = bitZ ? (current[2] - 0.5) * 2 : current[2] * 2;
      current[3] = bitW ? (current[3] - 0.5) * 2 : current[3] * 2;
    }

    return hex;
  }

  /**
   * Reconstruye el centro de la coordenada continua 4D a partir de un código hexadecimal.
   */
  public hexToPoint(hexCode: string): Point4D {
    const cleanHex = hexCode.startsWith('0x') || hexCode.startsWith('0X') 
      ? hexCode.slice(2).toUpperCase() 
      : hexCode.toUpperCase();

    let x = 0.5;
    let y = 0.5;
    let z = 0.5;
    let w = 0.5;
    let span = 0.5;

    for (let i = 0; i < cleanHex.length; i++) {
      const nibble = parseInt(cleanHex[i], 16);
      if (isNaN(nibble)) break;

      span /= 2;
      const bitX = (nibble >> 3) & 1;
      const bitY = (nibble >> 2) & 1;
      const bitZ = (nibble >> 1) & 1;
      const bitW = nibble & 1;

      x += bitX ? span : -span;
      y += bitY ? span : -span;
      z += bitZ ? span : -span;
      w += bitW ? span : -span;
    }

    return [x, y, z, w];
  }

  /**
   * Inserta un vértice (archivo/módulo) en el árbol fractal
   */
  public insert(vertex: HyperVertex): void {
    if (!vertex.hexCode) {
      vertex.hexCode = this.coordinateToHex(vertex.coordinate, this.maxDepth);
    }

    this.vertexMap.set(vertex.id, vertex);

    const cleanHex = vertex.hexCode.startsWith('0x') || vertex.hexCode.startsWith('0X')
      ? vertex.hexCode.slice(2)
      : vertex.hexCode;

    let currentNode = this.root;
    this.updateAggregate(currentNode, vertex);

    let currentPrefix = '0x';

    for (let depth = 0; depth < cleanHex.length; depth++) {
      const nibble = parseInt(cleanHex[depth], 16);
      if (isNaN(nibble)) break;

      currentPrefix += cleanHex[depth].toUpperCase();

      if (!currentNode.children[nibble]) {
        currentNode.children[nibble] = this.createEmptyNode(nibble, depth + 1, currentPrefix);
      }

      currentNode = currentNode.children[nibble]!;
      this.updateAggregate(currentNode, vertex);
    }

    currentNode.vertexIds.push(vertex.id);
  }

  /**
   * Actualiza las métricas agregadas de un nodo
   */
  private updateAggregate(node: HexadecNode, vertex: HyperVertex): void {
    node.aggregate.totalFiles += 1;
    node.aggregate.totalTokens += vertex.tokenEstimate;
    node.aggregate.cellCounts[vertex.cell] = (node.aggregate.cellCounts[vertex.cell] || 0) + 1;
  }

  /**
   * Calcula la distancia de Hamming a nivel de bits entre dos códigos hexadecimales.
   * Tiempo de ejecución O(1) con operaciones bitwise nativas.
   */
  public static hammingDistance(hexA: string, hexB: string): number {
    const a = hexA.startsWith('0x') ? hexA.slice(2) : hexA;
    const b = hexB.startsWith('0x') ? hexB.slice(2) : hexB;
    const len = Math.min(a.length, b.length);

    let distance = 0;
    for (let i = 0; i < len; i++) {
      const valA = parseInt(a[i], 16);
      const valB = parseInt(b[i], 16);
      const xor = valA ^ valB;
      // Cuenta cuántos bits son diferentes (popcount de 4 bits)
      distance += ((xor >> 3) & 1) + ((xor >> 2) & 1) + ((xor >> 1) & 1) + (xor & 1);
    }

    // Penalización por diferencia de profundidad fractal
    distance += Math.abs(a.length - b.length) * 2;
    return distance;
  }

  /**
   * Distancia euclidiana en el espacio continuo R^4
   */
  public static distance4D(p1: Point4D, p2: Point4D): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    const dw = p1[3] - p2[3];
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }

  /**
   * Obtiene un vértice por su ID
   */
  public getVertex(id: string): HyperVertex | undefined {
    return this.vertexMap.get(id);
  }

  /**
   * Retorna todos los vértices indexados
   */
  public getAllVertices(): HyperVertex[] {
    return Array.from(this.vertexMap.values());
  }

  /**
   * Encuentra el subárbol correspondiente a un prefijo hexadecimal (Zoom Fractal)
   */
  public getSubTree(hexPrefix: string): HexadecNode | null {
    const cleanHex = hexPrefix.startsWith('0x') || hexPrefix.startsWith('0X')
      ? hexPrefix.slice(2).toUpperCase()
      : hexPrefix.toUpperCase();

    let currentNode = this.root;
    for (let i = 0; i < cleanHex.length; i++) {
      const nibble = parseInt(cleanHex[i], 16);
      if (isNaN(nibble) || !currentNode.children[nibble]) {
        return null;
      }
      currentNode = currentNode.children[nibble]!;
    }

    return currentNode;
  }

  /**
   * Encuentra los N vértices más cercanos en el espacio 4D
   */
  public findNearest(target: Point4D | string, limit: number = 8): Array<{ vertex: HyperVertex; distance: number }> {
    const targetPoint = typeof target === 'string' ? this.hexToPoint(target) : target;
    const results: Array<{ vertex: HyperVertex; distance: number }> = [];

    for (const vertex of this.vertexMap.values()) {
      const dist = HexadecTree.distance4D(targetPoint, vertex.coordinate);
      results.push({ vertex, distance: dist });
    }

    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, limit);
  }

  /**
   * Retorna estadísticas del árbol fractal
   */
  public getTreeMetrics(): { totalVertices: number; maxDepth: number; totalNodes: number } {
    let nodeCount = 0;

    const traverse = (node: HexadecNode) => {
      nodeCount++;
      for (const child of node.children) {
        if (child) traverse(child);
      }
    };

    traverse(this.root);

    return {
      totalVertices: this.vertexMap.size,
      maxDepth: this.maxDepth,
      totalNodes: nodeCount,
    };
  }
}
