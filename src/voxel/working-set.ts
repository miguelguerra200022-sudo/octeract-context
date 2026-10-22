/**
 * OCTERACT-CONTEXT: Gestor del Horizonte de Trabajo en RAM (Minecraft ChunkTicketManager)
 * Regula dinámicamente qué módulos están activos en memoria según la posición del agente,
 * propagando niveles de atenuación de tickets (31 = Activo -> 33 = Borde -> 34+ = Inactivo)
 * para evitar el desbordamiento de RAM en repositorios masivos.
 */

export type WorkingState = 'ACTIVE' | 'CONTRACT_ONLY' | 'SKELETON_ONLY' | 'UNLOADED';

export interface FileLevelInfo {
  file: string;
  level: number;
  state: WorkingState;
}

export interface ChunkTicket {
  id: string;
  targetFile: string;
  baseLevel: number;
  radius: number;
}

export class OcteractWorkingSetHorizon {
  public static readonly LEVEL_ENTITY_TICKING = 31; // Activo total
  public static readonly LEVEL_BLOCK_TICKING = 32;  // Solo validación de contratos
  public static readonly LEVEL_BORDER = 33;         // Solo esqueletos EVA
  public static readonly LEVEL_INACTIVE = 34;       // Fuera de memoria

  private neighborGraph: Map<string, Set<string>> = new Map();
  private activeTickets: Map<string, ChunkTicket> = new Map();
  private fileLevels: Map<string, number> = new Map();

  /**
   * Registra las dependencias o vecinos topológicos de un archivo
   */
  public registerNeighbors(file: string, neighbors: string[]): void {
    if (!this.neighborGraph.has(file)) {
      this.neighborGraph.set(file, new Set());
    }
    const set = this.neighborGraph.get(file)!;
    for (const n of neighbors) {
      set.add(n);
      if (!this.neighborGraph.has(n)) {
        this.neighborGraph.set(n, new Set());
      }
      this.neighborGraph.get(n)!.add(file);
    }
  }

  /**
   * Añade un ticket de agente centrado en un archivo con un radio de propagación
   */
  public addTicket(id: string, targetFile: string, baseLevel: number = 31, radius: number = 2): void {
    this.activeTickets.set(id, { id, targetFile, baseLevel, radius });
    this.recalculateLevels();
  }

  /**
   * Elimina un ticket de agente
   */
  public removeTicket(id: string): void {
    this.activeTickets.delete(id);
    this.recalculateLevels();
  }

  /**
   * Retorna el nivel actual y el estado de un archivo
   */
  public getFileLevel(file: string): FileLevelInfo {
    const level = this.fileLevels.get(file) ?? OcteractWorkingSetHorizon.LEVEL_INACTIVE;
    return {
      file,
      level,
      state: this.mapLevelToState(level),
    };
  }

  /**
   * Desaloja de RAM todos los archivos inactivos (nivel >= 34)
   */
  public evictInactive(): string[] {
    const evicted: string[] = [];
    for (const [file, level] of this.fileLevels.entries()) {
      if (level >= OcteractWorkingSetHorizon.LEVEL_INACTIVE) {
        evicted.push(file);
        this.fileLevels.delete(file);
      }
    }
    return evicted;
  }

  /**
   * Recalcula los niveles de todos los archivos mediante propagación BFS
   */
  public recalculateLevels(): void {
    this.fileLevels.clear();

    if (this.activeTickets.size === 0) {
      return;
    }

    // Inicializar con infinitos
    const levels = new Map<string, number>();

    // Procesar cada ticket y propagar niveles hacia afuera
    for (const ticket of this.activeTickets.values()) {
      const queue: Array<{ file: string; currentLevel: number; remainingHops: number }> = [];
      const visited = new Set<string>();

      queue.push({
        file: ticket.targetFile,
        currentLevel: ticket.baseLevel,
        remainingHops: ticket.radius,
      });
      visited.add(ticket.targetFile);

      while (queue.length > 0) {
        const item = queue.shift()!;
        const existing = levels.get(item.file) ?? Infinity;
        if (item.currentLevel < existing) {
          levels.set(item.file, item.currentLevel);
        }

        if (item.remainingHops > 0 && item.currentLevel < OcteractWorkingSetHorizon.LEVEL_BORDER) {
          const neighbors = this.neighborGraph.get(item.file) || new Set();
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push({
                file: neighbor,
                currentLevel: item.currentLevel + 1,
                remainingHops: item.remainingHops - 1,
              });
            }
          }
        }
      }
    }

    // Asignar niveles finales
    for (const [file, lvl] of levels.entries()) {
      this.fileLevels.set(file, lvl);
    }
  }

  public getHorizonSummary(): {
    activeCount: number;
    contractOnlyCount: number;
    skeletonOnlyCount: number;
    evictedCount: number;
    totalTracked: number;
  } {
    let active = 0;
    let contractOnly = 0;
    let skeletonOnly = 0;
    let unloaded = 0;

    for (const level of this.fileLevels.values()) {
      const state = this.mapLevelToState(level);
      if (state === 'ACTIVE') active++;
      else if (state === 'CONTRACT_ONLY') contractOnly++;
      else if (state === 'SKELETON_ONLY') skeletonOnly++;
      else unloaded++;
    }

    return {
      activeCount: active,
      contractOnlyCount: contractOnly,
      skeletonOnlyCount: skeletonOnly,
      evictedCount: unloaded,
      totalTracked: this.fileLevels.size,
    };
  }

  private mapLevelToState(level: number): WorkingState {
    if (level <= OcteractWorkingSetHorizon.LEVEL_ENTITY_TICKING) return 'ACTIVE';
    if (level === OcteractWorkingSetHorizon.LEVEL_BLOCK_TICKING) return 'CONTRACT_ONLY';
    if (level === OcteractWorkingSetHorizon.LEVEL_BORDER) return 'SKELETON_ONLY';
    return 'UNLOADED';
  }
}
