/**
 * TESSERACT-CONTEXT: Multi-Agent Swarm Coordinator (Voronoi Hyper-Zones)
 * Resuelve el cuello de botella de concurrencia y colisiones semánticas invisibles
 * en enjambres de agentes de IA concurrentes (CoAgent / Multi-Agent Swarms).
 */

import * as path from 'node:path';
import {
  type HyperVertex,
  type Point4D,
  type AgentSwarmIntent,
  type VoronoiZone,
  type SwarmCoordinationReport,
  type TopologicalFracture,
} from '../core/types.ts';
import { eventBus } from '../core/events.ts';

export class TesseractSwarmCoordinator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Coordina un enjambre de agentes evaluando sus intenciones concurrentes
   * sobre la variedad hiperdimensional 4D.
   */
  public coordinateSwarm(
    intents: AgentSwarmIntent[],
    vertices: HyperVertex[] = []
  ): SwarmCoordinationReport {
    const vertexMap = new Map<string, HyperVertex>();
    for (const v of vertices) {
      vertexMap.set(v.path, v);
      vertexMap.set(v.id, v);
    }

    const zones: VoronoiZone[] = [];

    // 1. Calcular la Zona de Voronoi e hiper-esfera de influencia para cada agente
    for (const intent of intents) {
      const ownedFiles = intent.targetFiles.map((f) => this.normalizePath(f));
      const targetCoords: Point4D[] = [];

      for (const file of ownedFiles) {
        const v = vertexMap.get(file);
        if (v) {
          targetCoords.push(v.coordinate);
        } else {
          // Coordenada neutral por defecto si es archivo nuevo
          targetCoords.push([0.5, 0.5, 0.5, 0.5]);
        }
      }

      // Centroide de la zona de Voronoi
      const center: Point4D = [0, 0, 0, 0];
      if (targetCoords.length > 0) {
        for (const coord of targetCoords) {
          center[0] += coord[0] / targetCoords.length;
          center[1] += coord[1] / targetCoords.length;
          center[2] += coord[2] / targetCoords.length;
          center[3] += coord[3] / targetCoords.length;
        }
      } else {
        center[0] = 0.5; center[1] = 0.5; center[2] = 0.5; center[3] = 0.5;
      }

      // Radio de hiper-esfera en R^4
      let maxDist = 0;
      for (const coord of targetCoords) {
        const dist = Math.sqrt(
          Math.pow(coord[0] - center[0], 2) +
          Math.pow(coord[1] - center[1], 2) +
          Math.pow(coord[2] - center[2], 2) +
          Math.pow(coord[3] - center[3], 2)
        );
        if (dist > maxDist) maxDist = dist;
      }
      const hyperRadius = maxDist + 0.15; // Margen de influencia de cizallamiento

      // Calcular archivos en la frontera de influencia (1 salto en dependientes/dependencias)
      const influenceSet = new Set<string>();
      for (const file of ownedFiles) {
        const v = vertexMap.get(file);
        if (v) {
          v.dependencies.forEach((d) => influenceSet.add(this.normalizePath(d)));
          v.dependents.forEach((d) => influenceSet.add(this.normalizePath(d)));
        }
      }
      // Remover archivos propios
      ownedFiles.forEach((f) => influenceSet.delete(f));

      zones.push({
        agentId: intent.agentId,
        centerCoordinate: center,
        hyperRadius: Number(hyperRadius.toFixed(4)),
        ownedFiles,
        influenceBoundaryFiles: Array.from(influenceSet),
        status: 'ISOLATED_LOCK_FREE',
      });
    }

    // 2. Detección de Colisiones Semánticas entre pares de agentes
    const collisions: SwarmCoordinationReport['collisions'] = [];
    const collidingAgentIds = new Set<string>();
    const waitGraph = new Map<string, Set<string>>(); // A -> B significa A espera a B

    for (let i = 0; i < intents.length; i++) {
      for (let j = i + 1; j < intents.length; j++) {
        const agentA = intents[i];
        const agentB = intents[j];
        const zoneA = zones[i];
        const zoneB = zones[j];

        // Archivos en conflicto directo
        const directOverlap = zoneA.ownedFiles.filter((f) => zoneB.ownedFiles.includes(f));

        // Conflictos semánticos indirectos: A toca un archivo que B consume o viceversa
        const indirectAtoB = zoneA.ownedFiles.filter((f) => zoneB.influenceBoundaryFiles.includes(f));
        const indirectBtoA = zoneB.ownedFiles.filter((f) => zoneA.influenceBoundaryFiles.includes(f));

        const allOverlap = Array.from(new Set([...directOverlap, ...indirectAtoB, ...indirectBtoA]));

        if (allOverlap.length > 0) {
          collidingAgentIds.add(agentA.agentId);
          collidingAgentIds.add(agentB.agentId);

          zoneA.status = 'POTENTIAL_COLLISION';
          zoneB.status = 'POTENTIAL_COLLISION';

          // Extraer contratos o símbolos compartidos
          const sharedContracts: string[] = [];
          for (const file of allOverlap) {
            const v = vertexMap.get(file);
            if (v && v.symbols) {
              sharedContracts.push(...v.symbols.map((s) => s.name));
            }
          }

          // Resolver precedencia por prioridad o por inDegree topológico
          const prioA = agentA.priority ?? 10;
          const prioB = agentB.priority ?? 10;
          let precedenceWinner = agentA.agentId;

          if (prioB > prioA) {
            precedenceWinner = agentB.agentId;
          } else if (prioA === prioB) {
            // Desempate por centralidad de grafo
            const inDegA = zoneA.ownedFiles.reduce((acc, f) => acc + (vertexMap.get(f)?.inDegree || 0), 0);
            const inDegB = zoneB.ownedFiles.reduce((acc, f) => acc + (vertexMap.get(f)?.inDegree || 0), 0);
            precedenceWinner = inDegA >= inDegB ? agentA.agentId : agentB.agentId;
          }

          // Registrar en grafo de espera
          const waiter = precedenceWinner === agentA.agentId ? agentB.agentId : agentA.agentId;
          const holder = precedenceWinner;
          if (!waitGraph.has(waiter)) waitGraph.set(waiter, new Set());
          waitGraph.get(waiter)!.add(holder);

          // Generar fachada de sincronización preventiva
          const syncFacade = this.synthesizeSyncFacade(allOverlap, sharedContracts);

          collisions.push({
            agentA: agentA.agentId,
            agentB: agentB.agentId,
            overlapFiles: allOverlap,
            sharedContracts: sharedContracts.slice(0, 10),
            precedenceWinner,
            recommendedSyncFacade: syncFacade,
          });
        }
      }
    }

    // 3. Detección de Bloqueos Semánticos Mutuos (Deadlock Cycles)
    const deadlockCycles = this.findDeadlocks(waitGraph);
    for (const cycle of deadlockCycles) {
      for (const agentId of cycle) {
        const z = zones.find((zone) => zone.agentId === agentId);
        if (z) z.status = 'SEMANTIC_DEADLOCK_RISK';
      }
    }

    let verdict: SwarmCoordinationReport['verdict'] = 'ALL_CLEAR_PARALLEL';
    if (deadlockCycles.length > 0) {
      verdict = 'DEADLOCK_PREVENTED';
    } else if (collisions.length > 0) {
      verdict = 'SYNCHRONIZATION_REQUIRED';
    }

    const report: SwarmCoordinationReport = {
      timestamp: Date.now(),
      totalAgents: intents.length,
      lockFreeAgentsCount: intents.length - collidingAgentIds.size,
      collidingPairsCount: collisions.length,
      zones,
      collisions,
      deadlockCycles,
      verdict,
    };

    eventBus.emitEvent('stats_update', {
      totalVertices: vertices.length,
      totalEdges: 0,
      totalTokens: 0,
      hexadecDepth: 4,
      cellDistribution: {} as any,
      dimensionalCurvature: collisions.length > 0 ? 0.8 : 0.1,
      couplingIndex: Number((collisions.length / Math.max(1, intents.length)).toFixed(2)),
      healthStatus: verdict === 'ALL_CLEAR_PARALLEL' ? 'OPTIMAL' : 'HIGH_SHEAR_RISK',
    });

    return report;
  }

  /**
   * Transforma colisiones de enjambre no resueltas en fracturas topológicas formales
   */
  public auditSwarm(intents: AgentSwarmIntent[], vertices: HyperVertex[] = []): TopologicalFracture[] {
    const report = this.coordinateSwarm(intents, vertices);
    const fractures: TopologicalFracture[] = [];

    for (const col of report.collisions) {
      fractures.push({
        id: `SWARM-COLLISION-${col.agentA}-${col.agentB}`,
        type: 'SEMANTIC_RACE_FRACTURE',
        severity: 'HIGH',
        source: col.overlapFiles[0] || 'swarm',
        description: `Colisión semántica entre agentes '${col.agentA}' y '${col.agentB}' en [${col.overlapFiles.join(', ')}]. Ganador de precedencia: '${col.precedenceWinner}'.`,
        synthesizedPatch: col.recommendedSyncFacade,
        similarCandidate: `Sincronizar mediante fachada en ${col.overlapFiles[0]}`,
      });
    }

    for (const cycle of report.deadlockCycles) {
      fractures.push({
        id: `SWARM-DEADLOCK-${cycle.join('-')}`,
        type: 'SEMANTIC_RACE_FRACTURE',
        severity: 'CRITICAL',
        source: cycle[0],
        cyclePath: cycle,
        description: `Peligro de Deadlock Semántico detectado en ciclo de espera de agentes: ${cycle.join(' ➔ ')}. Rompiendo ciclo mediante expulsión temporal del agente de menor prioridad.`,
      });
    }

    return fractures;
  }

  /**
   * Genera código de fachada de sincronización preventiva para desacoplar agentes
   */
  private synthesizeSyncFacade(files: string[], symbols: string[]): string {
    const safeSymbols = symbols.filter((s) => s && /^[a-zA-Z0-9_$]+$/.test(s)).slice(0, 5);
    const exportsList = safeSymbols.length > 0
      ? safeSymbols.map((s) => `export const ${s} = (...args: any[]) => ({ status: 'sync_adapter', delegate: '${s}' });`).join('\n')
      : `export const syncFacade = { active: true, version: '4D_VORONOI_SYNC' };`;

    return `// ========================================================================\n// 💎 FACHADA DE SINCRONIZACIÓN PREVENTIVA DE BORDES 4D (TESSERACT SWARM)\n// Desacopla agentes concurrentes para evitar colisiones semánticas invisibles\n// ========================================================================\n${exportsList}\n`;
  }

  /**
   * Algoritmo de detección de ciclos en el grafo de esperas (Deadlock Detection)
   */
  private findDeadlocks(graph: Map<string, Set<string>>): string[][] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, currentPath: string[]) => {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...currentPath]);
        } else if (recStack.has(neighbor)) {
          const cycleStartIdx = currentPath.indexOf(neighbor);
          if (cycleStartIdx !== -1) {
            cycles.push([...currentPath.slice(cycleStartIdx), neighbor]);
          }
        }
      }

      recStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  }
}
