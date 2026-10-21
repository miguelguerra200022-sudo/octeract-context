/**
 * TESSERACT-CONTEXT: Bus de Eventos en Tiempo Real (SSE / Dashboard)
 */

import { EventEmitter } from 'node:events';

export interface TesseractEvent {
  type: 'query' | 'safe_write' | 'blocked_write' | 'rotate' | 'stats_update';
  timestamp: number;
  data: any;
}

class TesseractEventBus extends EventEmitter {
  private history: TesseractEvent[] = [];
  private maxHistory: number = 100;

  public emitEvent(type: TesseractEvent['type'], data: any): void {
    const event: TesseractEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    this.emit('tesseract_event', event);
    this.emit('octeract_event', event);
  }

  public getRecentEvents(): TesseractEvent[] {
    return [...this.history];
  }
}

export const eventBus = new TesseractEventBus();
export const octeractEventBus = eventBus;
export type OcteractEvent = TesseractEvent;
export { TesseractEventBus as OcteractEventBus };

