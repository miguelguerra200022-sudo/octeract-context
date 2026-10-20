/**
 * TESSERACT-CONTEXT: Gestor de Caché Incremental
 * Detecta alteraciones de archivos en sub-milisegundos mediante mtime y metadatos de Git
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { eventBus } from './events.ts';

export interface FileCacheEntry {
  mtimeMs: number;
  size: number;
}

export class IncrementalCache {
  private rootDir: string;
  private cachePath: string;
  private entries: Map<string, FileCacheEntry> = new Map();

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.cachePath = path.join(this.rootDir, '.tesseract', 'cache.json');
    eventBus.emitEvent('query', { type: 'incremental_cache_init', timestamp: Date.now() });
    this.load();
  }

  /**
   * Determina si un archivo ha sido modificado respecto al caché
   */
  public isModified(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return true;

    try {
      const stat = fs.statSync(filePath);
      const relPath = path.relative(this.rootDir, filePath).replace(/\\/g, '/');
      const cached = this.entries.get(relPath);

      if (!cached) return true;

      // Si el tamaño o la marca de tiempo difieren, fue modificado
      return Math.abs(cached.mtimeMs - stat.mtimeMs) > 1 || cached.size !== stat.size;
    } catch {
      return true;
    }
  }

  /**
   * Registra el estado actual de un archivo en el caché
   */
  public record(filePath: string): void {
    if (!fs.existsSync(filePath)) return;

    try {
      const stat = fs.statSync(filePath);
      const relPath = path.relative(this.rootDir, filePath).replace(/\\/g, '/');
      this.entries.set(relPath, {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
      });
    } catch {}
  }

  /**
   * Elimina un archivo del caché
   */
  public remove(filePath: string): void {
    const relPath = path.relative(this.rootDir, filePath).replace(/\\/g, '/');
    this.entries.delete(relPath);
  }

  /**
   * Guarda el estado del caché en disco (.tesseract/cache.json)
   */
  public save(): void {
    const tesseractDir = path.dirname(this.cachePath);
    if (!fs.existsSync(tesseractDir)) {
      fs.mkdirSync(tesseractDir, { recursive: true });
    }

    const payload: Record<string, FileCacheEntry> = {};
    for (const [key, val] of this.entries.entries()) {
      payload[key] = val;
    }

    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {}
  }

  /**
   * Carga el caché desde disco si existe
   */
  public load(): boolean {
    if (!fs.existsSync(this.cachePath)) return false;

    try {
      const raw = fs.readFileSync(this.cachePath, 'utf-8');
      const data = JSON.parse(raw);
      this.entries.clear();
      for (const [key, val] of Object.entries(data)) {
        this.entries.set(key, val as FileCacheEntry);
      }
      return true;
    } catch {
      return false;
    }
  }
}
