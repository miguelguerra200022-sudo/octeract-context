export interface RedstoneSignal {
  sourceNode: string;
  power: number; // 0 to 15
  tick: number;
  payload?: any;
}

export class OcteractObserverPulse {
  private observedStates: Map<string, string>;
  private listeners: Array<(sig: RedstoneSignal) => void>;
  private adjacency: Map<string, Set<string>>;
  private scheduledTasks: Map<number, Array<() => void>>;
  private currentTick: number;

  constructor() {
    this.observedStates = new Map<string, string>();
    this.listeners = [];
    this.adjacency = new Map<string, Set<string>>();
    this.scheduledTasks = new Map<number, Array<() => void>>();
    this.currentTick = 0;
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public observeNode(node: string, initialHash: string): void {
    this.observedStates.set(node, initialHash);
  }

  public onPulse(listener: (sig: RedstoneSignal) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  public notifyStateChange(node: string, newHash: string, payload?: any): RedstoneSignal | null {
    const prev = this.observedStates.get(node);
    if (prev === newHash) {
      return null; // No state change detected
    }

    this.observedStates.set(node, newHash);
    const signal: RedstoneSignal = {
      sourceNode: node,
      power: 15, // Full redstone observer pulse
      tick: this.currentTick,
      payload
    };

    for (const listener of this.listeners) {
      try {
        listener(signal);
      } catch (err) {
        // Suppress listener exceptions to maintain pulse integrity
      }
    }

    return signal;
  }

  public addLink(from: string, to: string): void {
    let set = this.adjacency.get(from);
    if (!set) {
      set = new Set<string>();
      this.adjacency.set(from, set);
    }
    set.add(to);
  }

  public propagatePulse(startNode: string, initialPower: number = 15): Map<string, number> {
    const powerMap = new Map<string, number>();
    const queue: Array<{ node: string; power: number }> = [{ node: startNode, power: initialPower }];
    powerMap.set(startNode, initialPower);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      if (current.power <= 1) continue; // Attenuated to 0 on next hop

      const nextPower = current.power - 1;
      const neighbors = this.adjacency.get(current.node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const existing = powerMap.get(neighbor) ?? 0;
          if (nextPower > existing) {
            powerMap.set(neighbor, nextPower);
            queue.push({ node: neighbor, power: nextPower });
          }
        }
      }
    }

    return powerMap;
  }

  public scheduleTick(delayTicks: number, task: () => void): void {
    const targetTick = this.currentTick + Math.max(1, delayTicks);
    let list = this.scheduledTasks.get(targetTick);
    if (!list) {
      list = [];
      this.scheduledTasks.set(targetTick, list);
    }
    list.push(task);
  }

  public advanceTicks(count: number = 1): void {
    for (let c = 0; c < count; c++) {
      this.currentTick++;
      const tasks = this.scheduledTasks.get(this.currentTick);
      if (tasks) {
        this.scheduledTasks.delete(this.currentTick);
        for (const task of tasks) {
          try {
            task();
          } catch (err) {
            // Guard task execution
          }
        }
      }
    }
  }
}
