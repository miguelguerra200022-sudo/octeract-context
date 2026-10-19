/**
 * TESSERACT-CONTEXT: Guardián Autónomo del Sistema de Archivos (Shield Watcher)
 * Vigila escrituras externas de agentes IA y protege el disco contra deformaciones 4D
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProjectIndexer } from '../core/indexer.ts';
import { ShadowEngine } from '../core/shadow.ts';
import { eventBus } from '../core/events.ts';

export class ShieldWatcher {
  private rootDir: string;
  private indexer: ProjectIndexer;
  private shadow: ShadowEngine;
  private isWatching: boolean = false;
  private fileSnapshots: Map<string, string> = new Map();

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
    this.indexer = new ProjectIndexer();
    if (!this.indexer.loadIndex(this.rootDir)) {
      this.indexer.indexDirectory({ rootDir: this.rootDir });
    }
    this.shadow = new ShadowEngine(this.indexer.getSpace());
  }

  public start(): void {
    if (this.isWatching) return;
    this.isWatching = true;

    console.log(`\x1b[35m[TESSERACT-SHIELD]\x1b[0m Guardián del sistema de archivos activo en: ${this.rootDir}`);

    // Snapshot inicial de archivos clave para autorestauración
    const vertices = this.indexer.getSpace().getVertices();
    for (const v of vertices.slice(0, 500)) {
      const fullPath = path.join(this.rootDir, v.id);
      if (fs.existsSync(fullPath)) {
        try {
          this.fileSnapshots.set(v.id, fs.readFileSync(fullPath, 'utf-8'));
        } catch (_) {}
      }
    }

    // Monitoreo de cambios con debounce
    const changedFiles = new Set<string>();
    let debounceTimer: any = null;

    fs.watch(this.rootDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes('.git') || filename.includes('.tesseract') || filename.includes('node_modules')) {
        return;
      }
      if (!filename.endsWith('.ts') && !filename.endsWith('.js') && !filename.endsWith('.py')) {
        return;
      }

      changedFiles.add(filename);
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        this.processFileChanges(Array.from(changedFiles));
        changedFiles.clear();
      }, 300);
    });
  }

  private processFileChanges(files: string[]): void {
    for (const file of files) {
      const fullPath = path.join(this.rootDir, file);
      if (!fs.existsSync(fullPath)) continue;

      try {
        const newContent = fs.readFileSync(fullPath, 'utf-8');
        const proj = this.shadow.project(file, newContent);

        if (!proj.isSafe) {
          console.error(`\n\x1b[1;31m⛔ [ESCUDO 4D DISPARADO] Violación topológica en: ${file}\x1b[0m`);
          console.error(`  ● Cizallamiento: D_shear = ${proj.shearDistance} > 0.750`);
          console.error(`  ● Riesgos detectados: ${proj.recommendations.join(' | ')}`);

          // Emitir alerta a dashboard
          eventBus.emitEvent('blocked_write', {
            targetPath: file,
            shearDistance: proj.shearDistance,
            shearVector: proj.shearVector,
            recommendations: proj.recommendations,
          });

          // Registrar en log de auditoría
          const logDir = path.join(this.rootDir, '.tesseract');
          if (fs.existsSync(logDir)) {
            const logEntry = `[${new Date().toISOString()}] BLOQUEO 4D: ${file} | D_shear = ${proj.shearDistance} | ${proj.recommendations.join('; ')}\n`;
            fs.appendFileSync(path.join(logDir, 'SHIELD_ALERTS.log'), logEntry, 'utf-8');
          }

          // Si existe snapshot previo, autorestaurar para prevenir corrupción
          const previousContent = this.fileSnapshots.get(file);
          if (previousContent && previousContent !== newContent) {
            fs.writeFileSync(fullPath, previousContent, 'utf-8');
            console.log(`\x1b[1;32m✔ [AUTORRESTAURACIÓN] Archivo "${file}" restaurado al estado seguro.\x1b[0m\n`);
          }
        } else {
          // Cambio seguro: actualizar snapshot
          this.fileSnapshots.set(file, newContent);
        }
      } catch (_) {}
    }
  }
}
