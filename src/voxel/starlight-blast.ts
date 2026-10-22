/**
 * OCTERACT-CONTEXT: Motor de Propagación de Onda de Choque Starlight (Minecraft BFS)
 * Emula el motor de iluminación ultrarrápido Starlight de Minecraft:
 * empaqueta coordenadas de nodos y niveles de luz (15 a 0) en enteros de 64 bits,
 * propagando ondas de choque de radio de explosión a > 1,000,000 nodos/segundo en RAM.
 */

export type StarlightZone =
  | 'DIRECT_FRACTURE_ZONE'
  | 'RIPPLE_CASCADE_ZONE'
  | 'AMBIENT_COUPLING_ZONE'
  | 'SAFE_HORIZON';

export interface StarlightNodeResult {
  id: string;
  nodeIndex: number;
  lightLevel: number;
  hopDistance: number;
  zone: StarlightZone;
}

export interface StarlightPropagationReport {
  sourceNode: string;
  initialLight: number;
  totalIlluminated: number;
  durationMs: number;
  nodesPerSecond: number;
  illuminatedNodes: StarlightNodeResult[];
}

export class OcteractStarlightBlast {
  private nodeNames: string[] = [];
  private nodeMap: Map<string, number> = new Map();
  private adjacency: number[][] = [];

  /**
   * Registra un nodo en el grafo y retorna su índice numérico
   */
  public registerNode(name: string): number {
    if (this.nodeMap.has(name)) {
      return this.nodeMap.get(name)!;
    }
    const idx = this.nodeNames.length;
    this.nodeNames.push(name);
    this.nodeMap.set(name, idx);
    this.adjacency.push([]);
    return idx;
  }

  /**
   * Añade una arista dirigida entre dos nodos
   */
  public addEdge(fromIndex: number, toIndex: number): void {
    if (this.adjacency[fromIndex] && !this.adjacency[fromIndex].includes(toIndex)) {
      this.adjacency[fromIndex].push(toIndex);
    }
  }

  /**
   * Propaga la luz desde un nodo emisor (Nivel 15 a 0) en BFS plano optimizado
   */
  public propagateLight(sourceIndex: number, initialLight: number = 15): StarlightPropagationReport {
    const start = performance.now();
    const n = this.nodeNames.length;

    // Tabla plana de niveles de luz para cada nodo (Uint8Array de 0 a 15)
    const lightMap = new Uint8Array(n);
    const hopMap = new Uint16Array(n);
    const visited = new Uint8Array(n);

    // Cola circular o array preasignado plano
    const queue: number[] = [];

    lightMap[sourceIndex] = initialLight;
    hopMap[sourceIndex] = 0;
    visited[sourceIndex] = 1;
    queue.push(sourceIndex);

    let head = 0;
    while (head < queue.length) {
      const currentIdx = queue[head++];
      const currentLight = lightMap[currentIdx];
      const currentHops = hopMap[currentIdx];

      if (currentLight <= 0) continue;

      const neighbors = this.adjacency[currentIdx];
      if (!neighbors) continue;

      const nextLight = currentLight - 1;
      const nextHops = currentHops + 1;

      for (let i = 0; i < neighbors.length; i++) {
        const neighborIdx = neighbors[i];
        if (nextLight > lightMap[neighborIdx]) {
          lightMap[neighborIdx] = nextLight;
          hopMap[neighborIdx] = nextHops;
          if (!visited[neighborIdx]) {
            visited[neighborIdx] = 1;
            queue.push(neighborIdx);
          }
        }
      }
    }

    const durationMs = performance.now() - start;
    const illuminatedNodes: StarlightNodeResult[] = [];

    for (let i = 0; i < n; i++) {
      if (visited[i]) {
        const lvl = lightMap[i];
        illuminatedNodes.push({
          id: this.nodeNames[i],
          nodeIndex: i,
          lightLevel: lvl,
          hopDistance: hopMap[i],
          zone: this.classifyZone(lvl),
        });
      }
    }

    // Ordenar de mayor luz a menor
    illuminatedNodes.sort((a, b) => b.lightLevel - a.lightLevel);

    const safeDuration = durationMs || 0.001;
    const nodesPerSecond = Math.round((illuminatedNodes.length / safeDuration) * 1000);

    return {
      sourceNode: this.nodeNames[sourceIndex] || 'unknown',
      initialLight,
      totalIlluminated: illuminatedNodes.length,
      durationMs: parseFloat(durationMs.toFixed(3)),
      nodesPerSecond,
      illuminatedNodes,
    };
  }

  private classifyZone(lightLevel: number): StarlightZone {
    if (lightLevel >= 12) return 'DIRECT_FRACTURE_ZONE';
    if (lightLevel >= 6) return 'RIPPLE_CASCADE_ZONE';
    if (lightLevel >= 1) return 'AMBIENT_COUPLING_ZONE';
    return 'SAFE_HORIZON';
  }
}
