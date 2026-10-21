/**
 * TESSERACT-CONTEXT: Dashboard 4D Neuronal Fractal Interactivo
 * Teseracto Volumétrico Holográfico (Caras Translúcidas + Bloom 4D) + Desplazamiento Libre (Pan)
 */

import * as http from 'node:http';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from '../core/indexer.ts';
import { eventBus } from '../core/events.ts';
import { CubicCell, type Point4D } from '../core/types.ts';

export interface DashboardOptions {
  rootDir: string;
  port?: number;
}

export class TesseractDashboard {
  private rootDir: string;
  private port: number;
  private indexer: ProjectIndexer;
  private sseClients: http.ServerResponse[] = [];

  constructor(options: DashboardOptions) {
    this.rootDir = path.resolve(options.rootDir);
    this.port = options.port || 4444;
    this.indexer = new ProjectIndexer();
  }

  public async start(): Promise<void> {
    if (!this.indexer.loadIndex(this.rootDir)) {
      this.indexer.indexDirectory({ rootDir: this.rootDir });
    }

    eventBus.on('tesseract_event', (event) => {
      this.broadcastSSE(event);
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // 1. SSE Stream
      if (url.pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n');
        this.sseClients.push(res);

        req.on('close', () => {
          this.sseClients = this.sseClients.filter((client) => client !== res);
        });
        return;
      }

      // 2. Estadísticas Globales
      if (url.pathname === '/api/stats') {
        const stats = this.indexer.getSpace().getHyperStats();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(stats));
        return;
      }

      // 3. Explorador de Nodos Neuronales por Carpeta (Jerarquía Fractal)
      if (url.pathname === '/api/nodes') {
        const reqPath = url.searchParams.get('path') || '';
        const levelData = this.getFolderLevelNodes(reqPath);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(levelData));
        return;
      }

      // 4. Rastro de Daño en Cadena (Efecto Dominó Sináptico de 1º, 2º y 3er Grado)
      if (url.pathname === '/api/trace-damage') {
        const target = url.searchParams.get('target') || '';
        const chain = this.traceDominoChain(target);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(chain));
        return;
      }

      // 5. Visor de Código Fuente
      if (url.pathname === '/api/file') {
        const relPath = url.searchParams.get('path');
        if (!relPath) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Ruta no especificada' }));
          return;
        }

        const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.rootDir, relPath);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(content);
            return;
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e?.message }));
            return;
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Archivo no encontrado' }));
          return;
        }
      }

      // 6. Auditoría Topológica Estática Determinista sin IA (0 Tokens)
      if (url.pathname === '/api/audit') {
        const audit = this.indexer.getAuditReport() || this.indexer.auditRepository(this.rootDir);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(audit));
        return;
      }

      // 7. Aplicación Web HTML5 / 3D Canvas
      if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderHTML());
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    });

    const tryListen = (portToTry: number) => {
      server.removeAllListeners('error');
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`\x1b[33m⚠️ Puerto ${portToTry} ocupado. Escaneando y probando automáticamente puerto ${portToTry + 1}...\x1b[0m`);
          this.port = portToTry + 1;
          tryListen(this.port);
        } else {
          console.error('[TESSERACT-DASHBOARD ERROR]', err);
        }
      });

      server.listen(portToTry, () => {
        console.log(`\n\x1b[1;35m========================================================================\x1b[0m`);
        console.log(`💎 \x1b[1;32mTESSERACT-CONTEXT: TESERACTO HOLOGRÁFICO 4D EN VIVO\x1b[0m`);
        console.log(`\x1b[1;35m========================================================================\x1b[0m`);
        console.log(`  ● URL Local (PC & Celular): \x1b[1;36mhttp://localhost:${this.port}\x1b[0m`);
        console.log(`  ● Repositorio Monitoreado:  \x1b[33m${this.rootDir}\x1b[0m`);
        console.log(`  ● Volumen Hiperdimensional: 24 Caras Translúcidas de Cristal + Bloom 4D`);
        console.log(`  ● Navegación Espacial:      Pan Libre (Mover con 2 dedos / Clic derecho)`);
        console.log(`  ● Zoom Focal al Cursor:     Acerca a cualquier punto sin expulsar nodos`);
        console.log(`\x1b[1;35m========================================================================\x1b[0m\n`);
      });
    };

    tryListen(this.port);
  }

  private getFolderLevelNodes(reqPath: string): any {
    const normReq = reqPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const vertices = this.indexer.getSpace().getVertices();

    const relevantVertices = normReq === ''
      ? vertices
      : vertices.filter((v) => v.id.startsWith(normReq + '/'));

    const foldersMap = new Map<string, { fileCount: number; tokenCount: number; cellCounts: Record<string, number> }>();
    const files: any[] = [];
    const reqPrefix = normReq === '' ? '' : normReq + '/';

    for (const v of relevantVertices) {
      const rest = v.id.substring(reqPrefix.length);
      const parts = rest.split('/');

      if (parts.length > 1) {
        const subfolderName = parts[0];
        const subfolderRelPath = reqPrefix + subfolderName;

        let entry = foldersMap.get(subfolderRelPath);
        if (!entry) {
          entry = { fileCount: 0, tokenCount: 0, cellCounts: {} };
          foldersMap.set(subfolderRelPath, entry);
        }
        entry.fileCount++;
        entry.tokenCount += v.tokens;
        entry.cellCounts[v.cell] = (entry.cellCounts[v.cell] || 0) + 1;
      } else {
        files.push({
          type: 'file',
          id: v.id,
          name: parts[0],
          path: v.id,
          hexCode: v.hexCode,
          cell: v.cell,
          coord: v.coordinate,
          lines: v.lines,
          tokens: v.tokens,
          dependentsCount: v.dependents.length,
          dependencies: v.dependencies,
        });
      }
    }

    const folders: any[] = [];
    let folderIdx = 0;
    for (const [folderPath, data] of foldersMap.entries()) {
      let mainCell = CubicCell.CoreLogic;
      let maxCount = 0;
      for (const [c, cnt] of Object.entries(data.cellCounts)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          mainCell = c as CubicCell;
        }
      }

      const angle = (folderIdx / Math.max(1, foldersMap.size)) * Math.PI * 2;
      const coord: Point4D = [
        parseFloat((0.5 + Math.cos(angle) * 0.38).toFixed(3)),
        parseFloat((0.5 + Math.sin(angle) * 0.38).toFixed(3)),
        parseFloat((0.4 + (folderIdx % 3) * 0.2).toFixed(3)),
        parseFloat((0.3 + ((folderIdx * 2) % 4) * 0.15).toFixed(3)),
      ];

      folders.push({
        type: 'folder',
        id: folderPath,
        name: folderPath.split('/').pop() || folderPath,
        path: folderPath,
        cell: mainCell,
        coord,
        fileCount: data.fileCount,
        tokenCount: data.tokenCount,
      });
      folderIdx++;
    }

    const audit = this.indexer.getAuditReport();
    const fractures = audit ? audit.fractures : [];
    const visibleIds = new Set<string>([...files.map((f) => f.id), ...folders.map((fo) => fo.path)]);
    const edges: any[] = [];

    for (const file of files) {
      for (const dep of file.dependencies) {
        const isFractured = fractures.some(
          (f) =>
            (f.source === file.id && (f.target === dep || dep.endsWith(f.target || '___'))) ||
            (f.source === file.id && f.type === 'BROKEN_IMPORT')
        );

        if (visibleIds.has(dep)) {
          edges.push({ source: file.id, target: dep, type: 'file_to_file', fractured: isFractured });
        } else {
          for (const fo of folders) {
            if (dep.startsWith(fo.path + '/')) {
              edges.push({ source: file.id, target: fo.id, type: 'file_to_folder', fractured: isFractured });
              break;
            }
          }
        }
      }
    }

    let parentPath: string | null = null;
    if (normReq !== '') {
      const parts = normReq.split('/');
      parts.pop();
      parentPath = parts.join('/');
    }

    return {
      currentPath: normReq,
      parentPath,
      folders,
      files,
      edges,
      audit: audit
        ? {
            healthScore: audit.healthScore,
            totalFractures: audit.totalFractures,
            status: audit.status,
            fracturesByType: audit.fracturesByType,
            fractures: audit.fractures.filter((f) =>
              normReq === '' ? true : f.source.startsWith(normReq + '/') || (f.target && f.target.startsWith(normReq + '/'))
            ),
          }
        : undefined,
    };
  }

  private traceDominoChain(targetPath: string): any {
    const vertices = this.indexer.getSpace().getVertices();
    const normalized = targetPath.replace(/\\/g, '/');
    const startNode = vertices.find((v) => v.id.endsWith(normalized) || normalized.endsWith(v.id));

    if (!startNode) {
      return { found: false, chain: [] };
    }

    const visited = new Set<string>([startNode.id]);
    const degrees: any[] = [];

    const degree1Nodes = vertices.filter((v) => startNode.dependents.includes(v.id));
    degrees.push({
      degree: 1,
      title: 'Impacto Inmediato (Contratos Directos Rotos)',
      nodes: degree1Nodes.map((n) => ({ id: n.id, name: n.id.split('/').pop(), cell: n.cell })),
    });
    degree1Nodes.forEach((n) => visited.add(n.id));

    const degree2Set = new Set<string>();
    for (const d1 of degree1Nodes) {
      for (const depId of d1.dependents) {
        if (!visited.has(depId)) {
          degree2Set.add(depId);
          visited.add(depId);
        }
      }
    }
    const degree2Nodes = vertices.filter((v) => degree2Set.has(v.id)).slice(0, 8);
    degrees.push({
      degree: 2,
      title: 'Efecto Dominó en Cadena (Subsistemas Afectados)',
      nodes: degree2Nodes.map((n) => ({ id: n.id, name: n.id.split('/').pop(), cell: n.cell })),
    });

    const degree3Set = new Set<string>();
    for (const d2 of degree2Nodes) {
      for (const depId of d2.dependents) {
        if (!visited.has(depId)) {
          degree3Set.add(depId);
          visited.add(depId);
        }
      }
    }
    const degree3Nodes = vertices.filter((v) => degree3Set.has(v.id)).slice(0, 6);
    degrees.push({
      degree: 3,
      title: 'Daño Oculto a Largo Plazo (Pérdida de Datos y Congelamiento)',
      nodes: degree3Nodes.map((n) => ({ id: n.id, name: n.id.split('/').pop(), cell: n.cell })),
    });

    return {
      found: true,
      origin: { id: startNode.id, name: startNode.id.split('/').pop(), cell: startNode.cell },
      degrees,
    };
  }

  private broadcastSSE(event: any): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(data);
      } catch (_) {}
    }
  }

  private renderHTML(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>TESSERACT-CONTEXT 4D | Hipercubo Volumétrico</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: radial-gradient(circle at center, #070a14 0%, #010206 100%);
      color: #e0e6ed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }

    /* Barra Superior: HUD y Migas de Pan */
    #hud-top {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 20;
      pointer-events: none;
    }
    .hud-card {
      background: rgba(10, 14, 26, 0.88);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 229, 255, 0.25);
      border-radius: 14px;
      padding: 8px 16px;
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
    }
    #breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #8b949e;
      overflow-x: auto;
      white-space: nowrap;
      max-width: 55vw;
    }
    .crumb-item {
      color: #00e5ff;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .crumb-item:hover { background: rgba(0, 229, 255, 0.15); }
    .crumb-separator { color: #484f58; }

    /* Canvas 4D */
    #canvas-container {
      width: 100vw;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
      cursor: grab;
    }
    #canvas-container.panning { cursor: grabbing; }
    canvas { width: 100%; height: 100%; display: block; }

    /* Banner de Alerta Sísmica con Rastro de Fuego */
    #domino-panel {
      position: absolute;
      top: 72px;
      left: 50%;
      transform: translateX(-50%) translateY(-150%);
      width: min(94vw, 720px);
      background: rgba(26, 5, 10, 0.95);
      backdrop-filter: blur(20px);
      border: 2px solid #ff1744;
      border-radius: 16px;
      padding: 16px 22px;
      color: #fff;
      z-index: 100;
      box-shadow: 0 0 50px rgba(255, 23, 68, 0.7);
      transition: transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      pointer-events: auto;
      max-height: 80vh;
      overflow-y: auto;
    }
    #domino-panel.active { transform: translateX(-50%) translateY(0); }
    .domino-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .domino-degree {
      background: rgba(255, 255, 255, 0.05);
      border-left: 3px solid #ff1744;
      padding: 8px 12px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 8px;
    }
    .domino-nodes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .domino-chip {
      background: rgba(255, 23, 68, 0.2);
      border: 1px solid rgba(255, 23, 68, 0.4);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-family: monospace;
      color: #ff8a80;
    }

    /* Banner de Salto Hiperespacial */
    #dive-banner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.7);
      background: rgba(8, 14, 28, 0.95);
      backdrop-filter: blur(24px);
      border: 2px solid #00e5ff;
      border-radius: 20px;
      padding: 18px 34px;
      color: #00e5ff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.8px;
      z-index: 200;
      box-shadow: 0 0 60px rgba(0, 229, 255, 0.8), inset 0 0 25px rgba(0, 229, 255, 0.3);
      pointer-events: none;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      white-space: nowrap;
    }
    #dive-banner.active {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.05);
    }

    /* Barra Inferior de Navegación */
    #controls-bar {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 14, 26, 0.92);
      backdrop-filter: blur(20px);
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid rgba(0, 229, 255, 0.25);
      z-index: 20;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      max-width: 95vw;
      overflow-x: auto;
    }
    .ctrl-btn {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: #fff;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .ctrl-btn:hover, .ctrl-btn:active { background: #6200ea; transform: scale(1.04); }
    .ctrl-btn.active { background: #00e5ff; color: #000; font-weight: 700; }
    .btn-mode { border: 1px solid rgba(0, 229, 255, 0.4); }
    .btn-back { background: rgba(0, 229, 255, 0.15); border: 1px solid #00e5ff; color: #00e5ff; }

    /* Inspector Lateral de Código */
    #inspector-panel {
      position: absolute;
      right: 0;
      top: 0;
      width: min(92vw, 540px);
      height: 100vh;
      background: rgba(6, 9, 18, 0.97);
      backdrop-filter: blur(24px);
      border-left: 1px solid rgba(0, 229, 255, 0.3);
      z-index: 50;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
      display: flex;
      flex-direction: column;
      box-shadow: -15px 0 50px rgba(0,0,0,0.8);
    }
    #inspector-panel.open { transform: translateX(0); }
    .inspector-header {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .inspector-body { padding: 16px; overflow-y: auto; flex: 1; font-size: 13px; }
    .code-viewer {
      background: #030408;
      border: 1px solid rgba(0, 229, 255, 0.15);
      border-radius: 8px;
      padding: 12px;
      font-family: Consolas, monospace;
      font-size: 11px;
      line-height: 1.5;
      overflow-x: auto;
      color: #79c0ff;
      max-height: 52vh;
      white-space: pre;
    }
    .stat-pill {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(255,255,255,0.06);
      border-radius: 6px;
      margin: 4px 4px 4px 0;
      font-size: 11px;
    }
    .btn-focus {
      background: #00e5ff;
      color: #000;
      font-weight: 700;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      margin: 10px 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>

  <!-- Barra Superior -->
  <div id="hud-top">
    <div class="hud-card" style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 16px; font-weight: 800; color: #00e5ff; letter-spacing: 0.5px;">TESSERACT 4D</span>
      <div id="breadcrumbs"></div>
    </div>

    <!-- Selector de Variedad Topológica -->
    <div class="hud-card" style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 11px; font-weight: 700; color: #8b949e;">VARIEDAD:</span>
      <select id="topology-select" onchange="window.changeTopology && window.changeTopology(this.value)" style="background: rgba(0,0,0,0.6); color: #00e5ff; border: 1px solid rgba(0,229,255,0.4); border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer; outline: none;">
        <option value="torus" selected>4-Toro (T⁴ Geodésica)</option>
        <option value="honeycomb">Panal {4,3,3,4} Monorrepo</option>
        <option value="bounded">Hipercubo Plano [0,1]⁴</option>
      </select>
    </div>

    <!-- Badge de Auditoría Topológica -->
    <div class="hud-card" id="hud-audit-badge" style="cursor: pointer; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255, 23, 68, 0.4);" onclick="openAuditModal()">
      <span id="audit-badge-icon" style="font-size: 14px;">🔬</span>
      <span id="audit-badge-text" style="font-size: 11px; font-weight: 800; color: #ff1744; letter-spacing: 0.3px;">
        AUDITORÍA: ESCANEANDO...
      </span>
    </div>

    <div class="hud-card" style="text-align: right;">
      <div style="font-size: 11px; color: #00e676; font-weight: 700; text-transform: uppercase;">
        ● Red Neuronal en RAM
      </div>
      <div style="font-size: 11px; color: #8b949e; margin-top: 2px;" id="hud-sub">
        Nivel: Raíz del Proyecto
      </div>
    </div>
  </div>

  <!-- Banner de Curación Topológica en Vivo -->
  <div id="healed-banner" style="
    position: absolute;
    top: 72px;
    left: 50%;
    transform: translateX(-50%) translateY(-180%);
    background: rgba(0, 229, 255, 0.95);
    color: #030a16;
    font-weight: 800;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 30px;
    box-shadow: 0 0 40px #00e5ff;
    z-index: 250;
    transition: all 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    pointer-events: none;
    white-space: nowrap;
    opacity: 0;
  "></div>

  <!-- Panel de Efecto Dominó -->
  <div id="domino-panel">
    <div class="domino-header">
      <div style="font-weight: 800; font-size: 15px; color: #ff1744; display: flex; align-items: center; gap: 8px;">
        <span>⚡ RASTRO DE DAÑO EN CADENA (EFECTO DOMINÓ)</span>
      </div>
      <button class="ctrl-btn" onclick="closeDomino()" style="padding: 2px 8px;">✕</button>
    </div>
    <div style="font-size: 12px; color: #e0e6ed; margin-bottom: 12px;" id="domino-origin"></div>
    <div id="domino-degrees-list"></div>
    <div style="margin-top: 12px; font-size: 12px; color: #ffd600;" id="domino-alt"></div>
  </div>

  <!-- Cajón / Modal de Auditoría Topológica 4D -->
  <div id="audit-panel" style="
    position: absolute;
    top: 68px;
    left: 50%;
    transform: translateX(-50%) translateY(-160%);
    width: min(94vw, 840px);
    background: rgba(14, 8, 22, 0.97);
    backdrop-filter: blur(25px);
    border: 2px solid #ff1744;
    border-radius: 18px;
    padding: 20px 24px;
    color: #fff;
    z-index: 120;
    box-shadow: 0 0 65px rgba(255, 23, 68, 0.5);
    transition: transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    pointer-events: auto;
    max-height: 84vh;
    overflow-y: auto;
  ">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">🔬</span>
        <div>
          <div style="font-weight: 800; font-size: 15px; color: #ff1744; letter-spacing: 0.5px;">
            AUDITORÍA TOPOLÓGICA 4D SIN IA (0 TOKENS)
          </div>
          <div style="font-size: 11px; color: #8b949e;" id="audit-health-sub">
            Escaneo en RAM de simetría de contratos, imports, ciclos y código muerto
          </div>
        </div>
      </div>
      <button class="ctrl-btn" onclick="closeAuditModal()" style="padding: 4px 10px;">✕</button>
    </div>

    <!-- Píldoras de Estadísticas de Salud -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px;">
      <div style="background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; text-align: center; border: 1px solid rgba(255,23,68,0.3);">
        <div style="font-size: 22px; font-weight: 900; color: #ff1744;" id="audit-score-val">--</div>
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase;">Salud Global</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 20px; font-weight: 800; color: #ff5252;" id="audit-broken-imports">0</div>
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase;">Imports Rotos</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 20px; font-weight: 800; color: #ffab40;" id="audit-mismatches">0</div>
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase;">Contratos Rotos</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 20px; font-weight: 800; color: #e040fb;" id="audit-cycles">0</div>
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase;">Ciclos A↔B</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); padding: 10px; border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 20px; font-weight: 800; color: #40c4ff;" id="audit-orphans">0</div>
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase;">Nodos Aislados</div>
      </div>
    </div>

    <!-- Lista de Fracturas con Tarjetas Quirúrgicas -->
    <div style="font-size: 12px; font-weight: 700; color: #8b949e; margin-bottom: 8px;">FRACTURAS DETECTADAS EN CÓDIGO EXISTENTE:</div>
    <div id="audit-fractures-list" style="display: flex; flex-direction: column; gap: 8px;">
      <div style="color: #8b949e; font-size: 12px; font-style: italic;">Cargando diagnóstico determinista...</div>
    </div>
  </div>

  <!-- Banner de Salto Hiperespacial -->
  <div id="dive-banner"></div>

  <!-- Canvas Principal -->
  <div id="canvas-container">
    <canvas id="tesseract-canvas"></canvas>
  </div>

  <!-- Barra de Controles Inferior -->
  <div id="controls-bar">
    <button class="ctrl-btn btn-back" id="btn-back" style="display: none;">⬆ Subir Nivel</button>
    <button class="ctrl-btn btn-mode active" id="btn-mode-rot">🔄 Girar</button>
    <button class="ctrl-btn btn-mode" id="btn-mode-pan">🖐️ Mover</button>
    <button class="ctrl-btn" id="btn-open-audit" onclick="openAuditModal()">🔬 Auditoría</button>
    <button class="ctrl-btn" id="btn-auto-rot">⚡ Auto</button>
    <button class="ctrl-btn" id="btn-xw">Plano XW</button>
    <button class="ctrl-btn" id="btn-zw">Plano ZW</button>
    <button class="ctrl-btn" id="btn-reset">🎯 Centrar</button>
  </div>

  <!-- Panel Lateral Inspector -->
  <div id="inspector-panel">
    <div class="inspector-header">
      <div>
        <div style="font-weight: 800; font-size: 14px; color: #00e5ff;" id="insp-name">Archivo.ts</div>
        <div style="font-size: 11px; color: #8b949e;" id="insp-hex">0x0000 • Celda</div>
      </div>
      <button class="ctrl-btn" onclick="closeInspector()" style="padding: 4px 10px;">✕</button>
    </div>
    <div class="inspector-body">
      <div id="insp-pills"></div>
      <div>
        <button class="btn-focus" id="btn-focus-node">🎯 Centrar Cámara en este Nodo</button>
      </div>
      <div style="margin: 10px 0 6px 0; font-weight: 700; font-size: 12px; color: #8b949e;">Contenido Fuente en RAM:</div>
      <pre class="code-viewer" id="insp-code">Cargando...</pre>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('tesseract-canvas');
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    // Estado de la Variedad Topológica (Torus, Honeycomb, Bounded)
    window.currentTopologyMode = 'torus';
    window.changeTopology = function(mode) {
      window.currentTopologyMode = mode;
      const banner = document.getElementById('healed-banner');
      if (banner) {
        banner.textContent = mode === 'torus' 
          ? '🍩 VARIEDAD 4-TORO (T⁴) ACTIVA: Geodésicas periódicas sin efecto de borde'
          : mode === 'honeycomb'
          ? '🐝 PANAL TESERÁCTICO {4,3,3,4} ACTIVO: Embaldosado Z⁴ para Monorrepos'
          : '📦 HIPERCUBO PLANO [0,1]⁴ ACTIVO';
        banner.style.opacity = '1';
        banner.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
          banner.style.opacity = '0';
          banner.style.transform = 'translateX(-50%) translateY(-180%)';
        }, 2800);
      }
    };

    // 16 Vértices del Teseracto
    const hyperVertices = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            hyperVertices.push([x, y, z, w]);
          }
        }
      }
    }

    // 32 Aristas del Teseracto
    const hyperEdges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (hyperVertices[i][k] !== hyperVertices[j][k]) diff++;
        }
        if (diff === 1) hyperEdges.push([i, j]);
      }
    }

    // 24 Caras Cuadradas del Teseracto (Geometría Volumétrica 4D)
    const hyperFaces = [];
    for (let u = 0; u < 4; u++) {
      for (let v = u + 1; v < 4; v++) {
        const fixedAxes = [0, 1, 2, 3].filter(a => a !== u && a !== v);
        const a1 = fixedAxes[0], a2 = fixedAxes[1];
        for (let val1 of [-1, 1]) {
          for (let val2 of [-1, 1]) {
            const c0 = [0, 0, 0, 0], c1 = [0, 0, 0, 0], c2 = [0, 0, 0, 0], c3 = [0, 0, 0, 0];
            c0[a1] = val1; c0[a2] = val2; c0[u] = -1; c0[v] = -1;
            c1[a1] = val1; c1[a2] = val2; c1[u] =  1; c1[v] = -1;
            c2[a1] = val1; c2[a2] = val2; c2[u] =  1; c2[v] =  1;
            c3[a1] = val1; c3[a2] = val2; c3[u] = -1; c3[v] =  1;

            const getIdx = (c) => hyperVertices.findIndex(vert => vert[0]===c[0] && vert[1]===c[1] && vert[2]===c[2] && vert[3]===c[3]);
            hyperFaces.push([getIdx(c0), getIdx(c1), getIdx(c2), getIdx(c3)]);
          }
        }
      }
    }

    // Estado del Canvas y Cámara
    let currentPath = '';
    let parentPath = null;
    let folders = [];
    let files = [];
    let edges = [];

    // Cámara, Pan y Zoom Focal
    let panX = 0;
    let panY = 0;
    let targetPanX = 0;
    let targetPanY = 0;
    let zoom = Math.min(width, height) * 0.28;
    let targetZoom = zoom;

    let angleXY = 0;
    let angleZW = 0;
    let angleXW = 0;
    let autoRotate = true;
    let touchMode = 'rotate'; // 'rotate' o 'pan'

    // Alerta Sísmica y Rastro
    let alertFlash = 0;
    let activeAlertPath = null;
    let highlightedDominoPaths = new Set();
    let actionPotentials = [];
    let selectedNode = null;
    let recentlyHealedMap = new Map();
    let touchRipples = [];
    function createTouchRipple(x, y, color) {
      touchRipples.push({ x, y, r: 12, maxR: 75, alpha: 1.0, color: color || '#00e5ff' });
    }

    const cellColors = {
      CoreLogic: '#00e5ff',
      Storage: '#ffb300',
      UI: '#d500f9',
      Security: '#ffd600',
      Network: '#2979ff',
      Tests: '#00e676',
      Config: '#80d8ff',
      Telemetry: '#651fff',
    };

    function drawRoundRect(c, x, y, w, h, r) {
      if (c.roundRect) {
        c.beginPath();
        c.roundRect(x, y, w, h, r);
      } else {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
      }
    }

    let isDiving = false;

    function diveIntoFolder(fo) {
      if (isDiving) return;
      isDiving = true;

      const banner = document.getElementById('dive-banner');
      if (banner) {
        banner.textContent = '🌀 ENTRANDO A: ' + fo.name + '...';
        banner.classList.add('active');
      }

      // Sonido de inmersión 4D (aceleración de frecuencia sináptica)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (_) {}

      // Acelerar la cámara hacia el centro de la carpeta elegida
      if (fo._screen) {
        targetPanX += (width / 2 - fo._screen.x) * 1.6;
        targetPanY += (height / 2 - fo._screen.y) * 1.6;
      }
      targetZoom *= 2.5;

      setTimeout(() => {
        loadLevel(fo.path);
        setTimeout(() => {
          targetPanX = 0;
          targetPanY = 0;
          targetZoom = Math.min(width, height) * 0.28;
          if (banner) banner.classList.remove('active');
          isDiving = false;
        }, 150);
      }, 280);
    }

    function updateAuditBadge(healthScore, totalFractures) {
      const badge = document.getElementById('hud-audit-badge');
      const text = document.getElementById('audit-badge-text');
      const icon = document.getElementById('audit-badge-icon');
      if (!badge || !text) return;

      if (totalFractures === 0) {
        text.textContent = 'AUDITORÍA: 100% SALUDABLE';
        text.style.color = '#00e676';
        if (icon) icon.textContent = '💎';
        badge.style.borderColor = 'rgba(0, 230, 118, 0.4)';
      } else if (totalFractures < 5) {
        text.textContent = 'AUDITORÍA: ' + totalFractures + ' FRACTURAS (' + healthScore + '% SALUD)';
        text.style.color = '#ffab40';
        if (icon) icon.textContent = '⚠️';
        badge.style.borderColor = 'rgba(255, 171, 64, 0.5)';
      } else {
        text.textContent = 'AUDITORÍA: ' + totalFractures + ' FRACTURAS (' + healthScore + '% SALUD)';
        text.style.color = '#ff1744';
        if (icon) icon.textContent = '🚨';
        badge.style.borderColor = 'rgba(255, 23, 68, 0.6)';
      }
    }

    function openAuditModal() {
      fetch('/api/audit')
        .then(res => res.json())
        .then(report => {
          const scoreEl = document.getElementById('audit-score-val');
          if (scoreEl) {
            scoreEl.textContent = report.healthScore + '%';
            if (report.healthScore >= 90) scoreEl.style.color = '#00e676';
            else if (report.healthScore >= 70) scoreEl.style.color = '#ffab40';
            else scoreEl.style.color = '#ff1744';
          }

          const biEl = document.getElementById('audit-broken-imports');
          if (biEl) biEl.textContent = report.fracturesByType.BROKEN_IMPORT || 0;
          const mmEl = document.getElementById('audit-mismatches');
          if (mmEl) mmEl.textContent = report.fracturesByType.CONTRACT_MISMATCH || 0;
          const cyEl = document.getElementById('audit-cycles');
          if (cyEl) cyEl.textContent = report.fracturesByType.CIRCULAR_DEPENDENCY || 0;
          const opEl = document.getElementById('audit-orphans');
          if (opEl) opEl.textContent = report.fracturesByType.ORPHAN_NODE || 0;

          const list = document.getElementById('audit-fractures-list');
          if (list) {
            list.innerHTML = '';
            if (report.fractures.length === 0) {
              list.innerHTML = '<div style="color: #00e676; padding: 12px; background: rgba(0, 230, 118, 0.08); border-radius: 8px;">✔ Simetría arquitectónica perfecta en R^4. No se detectaron imports rotos, contratos mutilados ni dependencias circulares.</div>';
            } else {
              for (const f of report.fractures.slice(0, 30)) {
                const card = document.createElement('div');
                card.style.background = 'rgba(255, 255, 255, 0.03)';
                card.style.borderLeft = f.severity === 'CRITICAL' ? '4px solid #ff1744' : (f.severity === 'HIGH' ? '4px solid #ff5252' : '4px solid #ffab40');
                card.style.borderRadius = '0 8px 8px 0';
                card.style.padding = '10px 14px';
                card.style.marginBottom = '6px';

                let details = '';
                if (f.missingSymbol) {
                  details += '<div style="font-family: monospace; font-size: 11px; color: #ff8a80; margin-top: 3px;">Símbolo faltante: <code>' + f.missingSymbol + '</code>' + (f.importerLineNumber ? ' (Línea ' + f.importerLineNumber + ')' : '') + '</div>';
                }
                if (f.importerLine) {
                  details += '<div style="font-family: monospace; font-size: 10px; color: #79c0ff; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; margin-top: 4px; overflow-x: auto;">' + f.importerLine.trim() + '</div>';
                }
                if (f.similarCandidate) {
                  details += '<div style="font-size: 11px; color: #00e676; margin-top: 4px;">💡 Sugerencia de autocuración: ¿Quisiste decir <strong>' + f.similarCandidate + '</strong>?</div>';
                }
                if (f.cyclePath) {
                  details += '<div style="font-family: monospace; font-size: 11px; color: #e040fb; margin-top: 4px;">Ciclo: ' + f.cyclePath.join(' ➔ ') + '</div>';
                }
                details += '<div style="font-size: 11px; color: #ffd600; margin-top: 5px;">👉 <em>' + f.healingStrategy + '</em></div>';

                card.innerHTML = 
                  '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '<span style="font-weight: 800; font-size: 12px; color: #fff;">[' + f.type + '] ' + f.source + '</span>' +
                    '<span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(255,23,68,0.2); color: #ff8a80; font-weight: 700;">' + f.severity + '</span>' +
                  '</div>' +
                  '<div style="font-size: 11px; color: #c9d1d9; margin-top: 2px;">' + f.description + '</div>' +
                  details;

                list.appendChild(card);
              }
            }
          }

          const panel = document.getElementById('audit-panel');
          if (panel) panel.style.transform = 'translateX(-50%) translateY(0)';
        });
    }

    function closeAuditModal() {
      const panel = document.getElementById('audit-panel');
      if (panel) panel.style.transform = 'translateX(-50%) translateY(-160%)';
    }

    function loadLevel(pathStr) {
      fetch('/api/nodes?path=' + encodeURIComponent(pathStr))
        .then(res => res.json())
        .then(data => {
          currentPath = data.currentPath;
          parentPath = data.parentPath;
          folders = data.folders;
          files = data.files;
          edges = data.edges;

          updateBreadcrumbs();
          document.getElementById('btn-back').style.display = parentPath !== null ? 'flex' : 'none';
          document.getElementById('hud-sub').textContent = currentPath === '' ? 'Nivel: Raíz del Proyecto' : '📁 ' + currentPath;

          if (data.audit) {
            updateAuditBadge(data.audit.healthScore, data.audit.totalFractures);
          }

          actionPotentials = [];
          for (let i = 0; i < Math.min(25, edges.length); i++) {
            actionPotentials.push({
              edgeIdx: Math.floor(Math.random() * edges.length),
              progress: Math.random(),
              speed: 0.005 + Math.random() * 0.01,
            });
          }
        });
    }
    loadLevel('');

    function updateBreadcrumbs() {
      const bc = document.getElementById('breadcrumbs');
      bc.innerHTML = '';

      const rootSpan = document.createElement('span');
      rootSpan.className = 'crumb-item';
      rootSpan.textContent = 'Raíz';
      rootSpan.onclick = () => loadLevel('');
      bc.appendChild(rootSpan);

      if (currentPath !== '') {
        const parts = currentPath.split('/');
        let accum = '';
        for (let i = 0; i < parts.length; i++) {
          const sep = document.createElement('span');
          sep.className = 'crumb-separator';
          sep.textContent = ' / ';
          bc.appendChild(sep);

          accum += (accum === '' ? '' : '/') + parts[i];
          const partSpan = document.createElement('span');
          partSpan.className = 'crumb-item';
          partSpan.textContent = parts[i];
          const target = accum;
          partSpan.onclick = () => loadLevel(target);
          bc.appendChild(partSpan);
        }
      }
    }

    function rotate4D(pt, aXY, aZW, aXW) {
      let [x, y, z, w] = pt;

      let cos = Math.cos(aXY), sin = Math.sin(aXY);
      let nx = x * cos - y * sin;
      let ny = x * sin + y * cos;
      x = nx; y = ny;

      cos = Math.cos(aZW); sin = Math.sin(aZW);
      let nz = z * cos - w * sin;
      let nw = z * sin + w * cos;
      z = nz; w = nw;

      cos = Math.cos(aXW); sin = Math.sin(aXW);
      nx = x * cos - w * sin;
      nw = x * sin + w * cos;
      x = nx; w = nw;

      return [x, y, z, w];
    }

    // Proyección de 4D a 3D a 2D con Pan Focal
    function project(pt4D) {
      const [x, y, z, w] = pt4D;
      const distance4D = 2.5;
      const wFactor = 1 / (distance4D - w);

      const x3 = x * wFactor;
      const y3 = y * wFactor;
      const z3 = z * wFactor;

      const distance3D = 3.0;
      const zFactor = 1 / (distance3D - z3);

      return {
        x: width / 2 + panX + x3 * zFactor * zoom,
        y: height / 2 + panY + y3 * zFactor * zoom,
        scale: zFactor * wFactor,
        depth: z3 + w,
        wVal: w,
      };
    }

    // Bucle Principal de Renderizado 4D
    function render() {
      // Suavizado cinemático de Pan y Zoom
      panX += (targetPanX - panX) * 0.1;
      panY += (targetPanY - panY) * 0.1;
      zoom += (targetZoom - zoom) * 0.1;

      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);

      if (autoRotate) {
        angleXY += 0.007;
        angleZW += 0.005;
      }

      if (alertFlash > 0) {
        ctx.fillStyle = 'rgba(255, 23, 68, ' + (alertFlash * 0.22) + ')';
        ctx.fillRect(0, 0, width, height);
        alertFlash -= 0.008;
      }

      // 1. Proyectar los 16 Vértices en 4D
      const projHyper = hyperVertices.map(v => {
        const rotated = rotate4D(v, angleXY, angleZW, angleXW);
        return project(rotated);
      });

      // 2. Renderizar las 24 Caras Translúcidas (Volumen Glassmorphism 4D Iridiscente)
      const sortedFaces = hyperFaces.map(f => {
        const p0 = projHyper[f[0]], p1 = projHyper[f[1]], p2 = projHyper[f[2]], p3 = projHyper[f[3]];
        const avgDepth = (p0.depth + p1.depth + p2.depth + p3.depth) / 4;
        const avgW = (p0.wVal + p1.wVal + p2.wVal + p3.wVal) / 4;
        return { f, p0, p1, p2, p3, avgDepth, avgW };
      });
      sortedFaces.sort((a, b) => a.avgDepth - b.avgDepth);

      for (const item of sortedFaces) {
        const { p0, p1, p2, p3, avgW } = item;
        const alpha = Math.max(0.04, Math.min(0.14, 0.07 + avgW * 0.04));
        
        // Gradiente iridiscente de cristal hiperdimensional
        const grad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
        if (avgW > 0) {
          grad.addColorStop(0, 'rgba(0, 229, 255, ' + (alpha * 1.6) + ')');
          grad.addColorStop(0.5, 'rgba(0, 176, 255, ' + alpha + ')');
          grad.addColorStop(1, 'rgba(41, 121, 255, ' + (alpha * 0.3) + ')');
        } else {
          grad.addColorStop(0, 'rgba(213, 0, 249, ' + (alpha * 1.6) + ')');
          grad.addColorStop(0.5, 'rgba(156, 39, 176, ' + alpha + ')');
          grad.addColorStop(1, 'rgba(101, 31, 255, ' + (alpha * 0.3) + ')');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();

        // Bisel de arista de cristal reflectante
        ctx.strokeStyle = avgW > 0 ? 'rgba(0, 229, 255, 0.38)' : 'rgba(213, 0, 249, 0.38)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 3. Renderizar las 32 Aristas con Triple Capa de Resplandor Neón (Bloom 4D Volumétrico)
      for (const [i, j] of hyperEdges) {
        const p1 = projHyper[i];
        const p2 = projHyper[j];
        const avgW = (p1.wVal + p2.wVal) / 2;

        // Capa 1: Halo Difuso de Neón (Atmospheric Bloom)
        ctx.lineWidth = Math.max(7, 16 * p1.scale);
        ctx.strokeStyle = avgW > 0 ? 'rgba(0, 229, 255, 0.16)' : 'rgba(213, 0, 249, 0.16)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Capa 2: Rayo Láser Central (Cuerpo Volumétrico)
        ctx.lineWidth = Math.max(2.8, 5.0 * p1.scale);
        ctx.strokeStyle = avgW > 0 ? 'rgba(0, 229, 255, 0.75)' : 'rgba(213, 0, 249, 0.75)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Capa 3: Núcleo de Plasma Blanco
        ctx.lineWidth = Math.max(1.2, 2.0 * p1.scale);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 4. Renderizar las 16 Esquinas Cuánticas (Singularidades con Anillos de Difracción)
      for (const p of projHyper) {
        const r = Math.max(4, 8 * p.scale);
        const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 3);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, p.wVal > 0 ? '#00e5ff' : '#d500f9');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Anillo cuántico
        ctx.strokeStyle = p.wVal > 0 ? 'rgba(0, 229, 255, 0.6)' : 'rgba(213, 0, 249, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Mapear Posición de Carpetas y Archivos en la Celda Actual
      const nodePosMap = new Map();

      for (const fo of folders) {
        const rawPt = [
          (fo.coord[0] - 0.5) * 1.9,
          (fo.coord[1] - 0.5) * 1.9,
          (fo.coord[2] - 0.5) * 1.9,
          (fo.coord[3] - 0.5) * 1.9,
        ];
        const rotated = rotate4D(rawPt, angleXY, angleZW, angleXW);
        const p = project(rotated);
        fo._screen = p;
        nodePosMap.set(fo.id, p);
      }

      for (const fi of files) {
        const rawPt = [
          (fi.coord[0] - 0.5) * 1.6,
          (fi.coord[1] - 0.5) * 1.6,
          (fi.coord[2] - 0.5) * 1.6,
          (fi.coord[3] - 0.5) * 1.6,
        ];
        const rotated = rotate4D(rawPt, angleXY, angleZW, angleXW);
        const p = project(rotated);
        fi._screen = p;
        nodePosMap.set(fi.id, p);
      }

      // 6. Dibujar Axones, Fracturas Quebradas y Curaciones en Vivo
      const nowTs = Date.now();
      for (const [healedPath, expireTs] of recentlyHealedMap.entries()) {
        if (nowTs > expireTs) recentlyHealedMap.delete(healedPath);
      }

      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const p1 = nodePosMap.get(e.source);
        const p2 = nodePosMap.get(e.target);
        if (!p1 || !p2) continue;

        const isHazard = highlightedDominoPaths.has(e.source) || highlightedDominoPaths.has(e.target);
        const isFractured = e.fractured === true;
        const isRecentlyHealed = recentlyHealedMap.has(e.source) || recentlyHealedMap.has(e.target);

        const midX = (p1.x + p2.x) / 2 + (p1.y - p2.y) * 0.08;
        const midY = (p1.y + p2.y) / 2 + (p2.x - p1.x) * 0.08;

        if (isRecentlyHealed) {
          // Rayo Láser Cian Eléctrico de Curación Topológica en Vivo
          ctx.lineWidth = 4.2;
          ctx.strokeStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (isFractured) {
          // Conexión Quebrada: Rayo Láser Rojo Hendido con Grietas y Chispas Eléctricas (#ff1744)
          ctx.lineWidth = 3.2;
          ctx.strokeStyle = '#ff1744';
          ctx.shadowColor = '#ff1744';
          ctx.shadowBlur = 14;

          // Trazo dentado / fracturado
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          const segments = 4;
          for (let s = 1; s < segments; s++) {
            const frac = s / segments;
            const jitterX = ((s % 2 === 0 ? 1 : -1) * 5) + (Math.sin(nowTs * 0.01 + s) * 2);
            const jitterY = ((s % 2 === 0 ? -1 : 1) * 5) + (Math.cos(nowTs * 0.01 + s) * 2);
            const sx = (1 - frac) * p1.x + frac * p2.x + jitterX;
            const sy = (1 - frac) * p1.y + frac * p2.y + jitterY;
            ctx.lineTo(sx, sy);
          }
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Chispas eléctricas en la grieta
          if (Math.random() > 0.45) {
            const sparkT = Math.random();
            const spX = (1 - sparkT) * p1.x + sparkT * p2.x + (Math.random() - 0.5) * 14;
            const spY = (1 - sparkT) * p1.y + sparkT * p2.y + (Math.random() - 0.5) * 14;
            ctx.fillStyle = Math.random() > 0.5 ? '#ff1744' : '#ffab40';
            ctx.beginPath();
            ctx.arc(spX, spY, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (isHazard) {
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#ff1744';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          ctx.stroke();
        } else {
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          ctx.stroke();
        }
      }

      // 7. Impulsos Eléctricos Sinápticos
      for (const ap of actionPotentials) {
        if (ap.edgeIdx >= edges.length) continue;
        const e = edges[ap.edgeIdx];
        const p1 = nodePosMap.get(e.source);
        const p2 = nodePosMap.get(e.target);
        if (!p1 || !p2) continue;

        ap.progress += ap.speed;
        if (ap.progress > 1) {
          ap.progress = 0;
          ap.edgeIdx = Math.floor(Math.random() * edges.length);
        }

        const t = ap.progress;
        const sparkX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * ((p1.x + p2.x) / 2) + t * t * p2.x;
        const sparkY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * ((p1.y + p2.y) / 2) + t * t * p2.y;

        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Marca de Cámara Hiperdimensional Actual
      const chamberTitle = currentPath === '' ? '🏛️ HIPERCUBO: RAÍZ DEL PROYECTO' : '📁 HIPERCUBO: ' + currentPath;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(chamberTitle, width / 2, 74);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#8b949e';
      ctx.fillText(folders.length + ' carpetas • ' + files.length + ' archivos en esta celda 4D', width / 2, 92);

      const baseZoom = Math.min(width, height) * 0.28;
      // Escalado dinámico sin tope artificial restrictivo para celulares
      const zoomRatio = Math.max(0.4, zoom / baseZoom);

      // 8. Neuronas de Carpeta (Ganglios Holográficos Grandes y Escalables)
      const dominoArr = Array.from(highlightedDominoPaths);
      for (const fo of folders) {
        const p = fo._screen;
        if (!p) continue;

        // Detección si esta carpeta contiene archivos con daño en cadena
        const isHazard = highlightedDominoPaths.has(fo.path) || dominoArr.some(path => path.startsWith(fo.path + '/'));
        const hazardsInside = dominoArr.filter(path => path === fo.path || path.startsWith(fo.path + '/')).length;
        const color = isHazard ? '#ff1744' : '#00e5ff';
        
        // Radio dinámico sin techo artificial (puede crecer hasta 260px al hacer zoom profundo)
        const baseR = isHazard ? 32 : 26;
        const radius = Math.max(20, Math.min(260, baseR * Math.pow(zoomRatio, 0.72) * (1 + p.scale * 0.5)));
        fo._radius = radius;
        fo._hitRadius = Math.max(65, radius + 35);

        // 1. Halo Pulsante Exterior
        const haloR = radius * (isHazard ? 2.6 : 2.2);
        const grad = ctx.createRadialGradient(p.x, p.y, radius * 0.2, p.x, p.y, haloR);
        grad.addColorStop(0, color);
        grad.addColorStop(0.4, isHazard ? 'rgba(255, 23, 68, 0.45)' : 'rgba(0, 229, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Esfera de Cristal Central
        const sphereGrad = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, 1, p.x, p.y, radius);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.35, isHazard ? '#ff5252' : '#00e5ff');
        sphereGrad.addColorStop(0.85, isHazard ? '#b71c1c' : '#007bb5');
        sphereGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Anillo exterior
        ctx.strokeStyle = isHazard ? '#ff8a80' : '#ffffff';
        ctx.lineWidth = Math.max(1.5, 2.5 * (zoomRatio * 0.5));
        ctx.stroke();

        // Icono dentro de la esfera
        const iconSize = Math.max(14, Math.floor(radius * 0.85));
        ctx.font = iconSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isHazard ? '⚠️' : '📁', p.x, p.y);
        ctx.textBaseline = 'alphabetic';

        // 3. Etiqueta Holográfica con Placa Oscura de Alto Contraste (Escalable con Zoom)
        const titleFontSize = Math.max(12, Math.min(42, Math.floor(13 * Math.pow(zoomRatio, 0.55))));
        const subFontSize = Math.max(10, Math.min(26, Math.floor(10 * Math.pow(zoomRatio, 0.55))));
        
        const folderLabel = fo.name;
        const countText = isHazard ? (hazardsInside + ' daños en cadena') : (fo.fileCount + ' archivos');

        ctx.font = 'bold ' + titleFontSize + 'px sans-serif';
        const labelWidth = Math.max(ctx.measureText(folderLabel).width, 70);
        const pillW = labelWidth + 24;
        const pillH = titleFontSize + subFontSize + 14;
        const pillX = p.x - pillW / 2;
        const pillY = p.y + radius + 10;

        // Guardar bounding box para detección de toque en celulares
        fo._pillRect = { x: pillX, y: pillY, w: pillW, h: pillH };

        // Placa oscura tipo tarjeta
        ctx.fillStyle = 'rgba(8, 12, 24, 0.9)';
        ctx.strokeStyle = isHazard ? '#ff1744' : 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 1.2;
        drawRoundRect(ctx, pillX, pillY, pillW, pillH, 8);
        ctx.fill();
        ctx.stroke();

        // Texto Título
        ctx.textAlign = 'center';
        ctx.fillStyle = isHazard ? '#ff5252' : '#ffffff';
        ctx.fillText(folderLabel, p.x, pillY + titleFontSize + 3);

        // Texto Subtítulo
        ctx.font = subFontSize + 'px monospace';
        ctx.fillStyle = isHazard ? '#ff8a80' : '#00e5ff';
        ctx.fillText(countText, p.x, pillY + titleFontSize + subFontSize + 7);
      }

      // 9. Neuronas de Archivo (Sinapsis Individuales con Placa y Mayor Escala)
      for (const fi of files) {
        const p = fi._screen;
        if (!p) continue;

        const isHazard = highlightedDominoPaths.has(fi.path) || (activeAlertPath && activeAlertPath.includes(fi.name));
        const color = isHazard ? '#ff1744' : (cellColors[fi.cell] || '#ffffff');
        
        // Radio base escalable sin tope artificial (puede crecer hasta 180px al hacer zoom profundo)
        const baseR = isHazard ? 18 : 13;
        const radius = Math.max(10, Math.min(180, baseR * Math.pow(zoomRatio, 0.72) * (1 + p.scale * 0.5)));
        fi._radius = radius;
        fi._hitRadius = Math.max(55, radius + 25);

        // Halo
        const haloR = radius * (isHazard ? 2.5 : 2.0);
        const grad = ctx.createRadialGradient(p.x, p.y, radius * 0.2, p.x, p.y, haloR);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, isHazard ? 'rgba(255, 23, 68, 0.4)' : 'rgba(0, 229, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        const sphereGrad = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, 1, p.x, p.y, radius);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.4, color);
        sphereGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de la sinapsis
        ctx.strokeStyle = isHazard ? '#ff8a80' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Etiqueta del Archivo con Placa (Escalable con Zoom)
        const fileFontSize = Math.max(10, Math.min(28, Math.floor(11 * Math.pow(zoomRatio, 0.55))));
        ctx.font = fileFontSize + 'px monospace';
        const labelText = (isHazard ? '⚡ ' : '📄 ') + fi.name;
        const textWidth = ctx.measureText(labelText).width;
        const pillW = textWidth + 18;
        const pillH = fileFontSize + 10;
        const pillX = p.x - pillW / 2;
        const pillY = p.y + radius + 6;

        // Guardar bounding box para toque móvil
        fi._pillRect = { x: pillX, y: pillY, w: pillW, h: pillH };

        ctx.fillStyle = 'rgba(6, 10, 20, 0.88)';
        ctx.strokeStyle = isHazard ? 'rgba(255, 23, 68, 0.6)' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.0;
        drawRoundRect(ctx, pillX, pillY, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = isHazard ? '#ff8a80' : '#e0e6ed';
        ctx.fillText(labelText, p.x, pillY + fileFontSize + 2);
      }

      // 10. Ondas de Retroalimentación Táctil (Ripples en Pantallas Táctiles)
      for (let i = touchRipples.length - 1; i >= 0; i--) {
        const rip = touchRipples[i];
        ctx.save();
        ctx.strokeStyle = rip.color;
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        rip.r += 4.5;
        rip.alpha -= 0.055;
        if (rip.alpha <= 0) touchRipples.splice(i, 1);
      }

      // 11. Ondas de Choque Taint Wave (Live Blast Radius Pulse Animation)
      for (let i = taintPulses.length - 1; i >= 0; i--) {
        const pulse = taintPulses[i];
        pulse.progress += 0.04;
        if (pulse.progress >= 1.0) {
          taintPulses.splice(i, 1);
          continue;
        }

        const p1 = pulse.fromNode._screen;
        const p2 = pulse.toNode._screen;
        if (!p1 || !p2) continue;

        const curX = p1.x + (p2.x - p1.x) * pulse.progress;
        const curY = p1.y + (p2.y - p1.y) * pulse.progress;

        ctx.save();
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(curX, curY, 6 * (1 - pulse.progress * 0.4), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = pulse.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.8 * (1 - pulse.progress);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        ctx.restore();
      }

      requestAnimationFrame(render);
    }
    render();

    // Interacción Unificada de Nodos (Táctil en Celular y Clic en PC)
    function handleNodeTapOrClick(screenX, screenY) {
      const rect = canvas.getBoundingClientRect();
      const clickX = screenX - rect.left;
      const clickY = screenY - rect.top;

      // 1. Clic o toque en carpetas (Esfera o Tarjeta de Texto)
      for (const fo of folders) {
        if (!fo._screen) continue;
        const hitR = fo._hitRadius || 65;
        const dist = Math.hypot(fo._screen.x - clickX, fo._screen.y - clickY);
        let inPill = false;
        if (fo._pillRect) {
          const { x, y, w, h } = fo._pillRect;
          inPill = clickX >= x - 12 && clickX <= x + w + 12 && clickY >= y - 8 && clickY <= y + h + 8;
        }
        if (dist <= hitR || inPill) {
          createTouchRipple(clickX, clickY, '#00e5ff');
          diveIntoFolder(fo);
          return true;
        }
      }

      // 2. Clic o toque en archivos (Esfera o Tarjeta de Texto)
      for (const fi of files) {
        if (!fi._screen) continue;
        const hitR = fi._hitRadius || 55;
        const dist = Math.hypot(fi._screen.x - clickX, fi._screen.y - clickY);
        let inPill = false;
        if (fi._pillRect) {
          const { x, y, w, h } = fi._pillRect;
          inPill = clickX >= x - 10 && clickX <= x + w + 10 && clickY >= y - 8 && clickY <= y + h + 8;
        }
        if (dist <= hitR || inPill) {
          createTouchRipple(clickX, clickY, '#00e676');
          openInspector(fi);
          return true;
        }
      }
      return false;
    }

    // Clic con el Ratón (PC)
    canvas.addEventListener('click', (e) => {
      if (wasDragged) return;
      handleNodeTapOrClick(e.clientX, e.clientY);
    });

    // Control de Ratón (Giro con Clic Izquierdo, Paneo con Clic Derecho / Rueda)
    let isDragging = false;
    let dragButton = 0;
    let lastX = 0, lastY = 0;
    let wasDragged = false;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      wasDragged = false;
      dragButton = e.button;
      lastX = e.clientX;
      lastY = e.clientY;
      if (dragButton === 2 || touchMode === 'pan') {
        document.getElementById('canvas-container').classList.add('panning');
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      document.getElementById('canvas-container').classList.remove('panning');
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 3) wasDragged = true;

        // Paneo (Clic derecho, o clic medio, o modo Pan)
        if (dragButton === 2 || dragButton === 1 || touchMode === 'pan') {
          targetPanX += dx;
          targetPanY += dy;
        } else {
          // Giro orbital
          angleXY += dx * 0.007;
          angleZW += dy * 0.007;
          autoRotate = false;
          document.getElementById('btn-auto-rot').classList.remove('active');
        }

        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        // Retroalimentación de Cursor al Pasar el Mouse sobre Neuronas
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        let foundHover = false;

        for (const fo of folders) {
          const hitR = fo._hitRadius || 50;
          if (fo._screen && Math.hypot(fo._screen.x - mouseX, fo._screen.y - mouseY) <= hitR) {
            foundHover = true; break;
          }
        }
        if (!foundHover) {
          for (const fi of files) {
            const hitR = fi._hitRadius || 40;
            if (fi._screen && Math.hypot(fi._screen.x - mouseX, fi._screen.y - mouseY) <= hitR) {
              foundHover = true; break;
            }
          }
        }

        if (foundHover) {
          canvas.style.cursor = 'pointer';
        } else {
          canvas.style.cursor = touchMode === 'pan' ? 'grab' : 'default';
        }
      }
    });

    // Zoom Focal Inteligente (Hacia el cursor exacto sin desvío)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
      const newZoom = Math.max(50, Math.min(targetZoom * zoomFactor, 12000));

      // Zoom anclado a la posición del cursor de forma matemáticamente invariante
      const relX = (mouseX - width / 2 - targetPanX) / targetZoom;
      const relY = (mouseY - height / 2 - targetPanY) / targetZoom;
      targetPanX = mouseX - width / 2 - relX * newZoom;
      targetPanY = mouseY - height / 2 - relY * newZoom;
      targetZoom = newZoom;
    }, { passive: false });

    // Controles Touch en Celular (Toque nativo, Pellizco focal, Arrastre y Giro)
    let touchStartTime = 0;
    let initialTouchX = 0;
    let initialTouchY = 0;
    let touchStartX = 0, touchStartY = 0, touchDist = 0;
    let touchMidX = 0, touchMidY = 0;
    let touchMoved = false;

    canvas.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
      touchMoved = false;
      wasDragged = false;
      if (e.touches.length === 1) {
        initialTouchX = e.touches[0].clientX;
        initialTouchY = e.touches[0].clientY;
        touchStartX = initialTouchX;
        touchStartY = initialTouchY;
      } else if (e.touches.length === 2) {
        touchMoved = true;
        wasDragged = true;
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        touchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const totalDist = Math.hypot(e.touches[0].clientX - initialTouchX, e.touches[0].clientY - initialTouchY);
        // Umbral de 26px para evitar que el temblor natural del pulgar en celulares cancele el toque
        if (totalDist > 26) {
          touchMoved = true;
          wasDragged = true;
        }

        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (touchMode === 'pan') {
          targetPanX += dx;
          targetPanY += dy;
        } else {
          angleXY += dx * 0.008;
          angleZW += dy * 0.008;
          autoRotate = false;
          document.getElementById('btn-auto-rot').classList.remove('active');
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchMoved = true;
        wasDragged = true;
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        targetPanX += (midX - touchMidX);
        targetPanY += (midY - touchMidY);
        touchMidX = midX;
        touchMidY = midY;

        const scale = newDist / touchDist;
        const newZoom = Math.max(50, Math.min(targetZoom * scale, 25000));
        const relX = (midX - width / 2 - targetPanX) / targetZoom;
        const relY = (midY - height / 2 - targetPanY) / targetZoom;
        targetPanX = midX - width / 2 - relX * newZoom;
        targetPanY = midY - height / 2 - relY * newZoom;
        targetZoom = newZoom;
        touchDist = newDist;
      }
    }, { passive: false });

    // RECEPTOR NATIVO DE TOQUES MÓVILES (TAP CON EL DEDO EN CELULARES)
    canvas.addEventListener('touchend', (e) => {
      const duration = Date.now() - touchStartTime;
      const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : initialTouchX;
      const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : initialTouchY;
      const totalShift = Math.hypot(endX - initialTouchX, endY - initialTouchY);

      // Si el toque duró menos de 500ms y el desplazamiento total fue menor a 28px: ¡ES UN TAP DIRECTO!
      if (duration < 500 && totalShift < 28) {
        handleNodeTapOrClick(endX, endY);
      }
    });

    // Botones de Modo (Girar vs Mover)
    document.getElementById('btn-mode-rot').onclick = function() {
      touchMode = 'rotate';
      this.classList.add('active');
      document.getElementById('btn-mode-pan').classList.remove('active');
    };
    document.getElementById('btn-mode-pan').onclick = function() {
      touchMode = 'pan';
      this.classList.add('active');
      document.getElementById('btn-mode-rot').classList.remove('active');
    };

    document.getElementById('btn-back').onclick = () => {
      if (parentPath !== null) loadLevel(parentPath);
    };
    document.getElementById('btn-auto-rot').onclick = function() {
      autoRotate = !autoRotate;
      this.classList.toggle('active', autoRotate);
    };
    document.getElementById('btn-xw').onclick = () => { angleXW += 0.35; };
    document.getElementById('btn-zw').onclick = () => { angleZW += 0.35; };
    document.getElementById('btn-reset').onclick = () => {
      angleXY = 0; angleZW = 0; angleXW = 0;
      targetPanX = 0; targetPanY = 0;
      targetZoom = Math.min(width, height) * 0.28;
    };

    // Auto-Enfoque de Neurona Seleccionada
    document.getElementById('btn-focus-node').onclick = () => {
      if (!selectedNode || !selectedNode._screen) return;
      // Centrar el nodo en la pantalla
      const currentScreenX = selectedNode._screen.x;
      const currentScreenY = selectedNode._screen.y;
      targetPanX += (width / 2 - currentScreenX);
      targetPanY += (height / 2 - currentScreenY);
      targetZoom = Math.max(zoom, Math.min(width, height) * 0.55);
    };

    const taintPulses = [];
    function triggerTaintWave(sourceNode) {
      if (!sourceNode || !sourceNode._screen) return;
      createTouchRipple(sourceNode._screen.x, sourceNode._screen.y, '#ff9100');
      const connSet = new Set([...(sourceNode.dependents || []), ...(sourceNode.dependencies || [])]);
      for (const fi of files) {
        if (fi === sourceNode) continue;
        if (connSet.has(fi.id) || connSet.has(fi.name) || connSet.has(fi.path)) {
          taintPulses.push({
            fromNode: sourceNode,
            toNode: fi,
            progress: 0,
            color: sourceNode.dependents?.includes(fi.id) ? '#ff5252' : '#00e5ff',
          });
        }
      }
    }

    function openInspector(node) {
      selectedNode = node;
      triggerTaintWave(node);
      document.getElementById('insp-name').textContent = node.name;
      document.getElementById('insp-hex').textContent = (node.hexCode || '0x0000') + ' • Celda: ' + node.cell;
      document.getElementById('insp-pills').innerHTML = 
        '<span class="stat-pill" style="color: #00e5ff;">Líneas: ' + node.lines + '</span>' +
        '<span class="stat-pill" style="color: #ffd600;">Tokens: ' + node.tokens.toLocaleString() + '</span>' +
        '<span class="stat-pill" style="color: #00e676;">Dependientes: ' + node.dependentsCount + '</span>';

      document.getElementById('insp-code').textContent = 'Cargando código en RAM...';
      document.getElementById('inspector-panel').classList.add('open');

      fetch('/api/file?path=' + encodeURIComponent(node.path))
        .then(res => res.text())
        .then(code => {
          document.getElementById('insp-code').textContent = code;
        })
        .catch(() => {
          document.getElementById('insp-code').textContent = '// No se pudo cargar el archivo';
        });
    }

    function closeInspector() {
      document.getElementById('inspector-panel').classList.remove('open');
      selectedNode = null;
    }

    const evtSource = new EventSource('/api/events');
    evtSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'blocked_write') {
          triggerDominoStorm(event.data);
        } else if (event.type === 'fracture_healed') {
          triggerFractureHealed(event.data);
        }
      } catch (_) {}
    };

    function triggerFractureHealed(data) {
      const banner = document.getElementById('healed-banner');
      if (banner) {
        banner.innerHTML = '✨ <strong>FRACTURA CURADA:</strong> ' + data.targetPath + ' <span style="background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 12px; margin-left: 6px;">+' + data.healedCount + ' reparadas • Salud ' + data.newHealthScore + '%</span>';
        banner.style.transform = 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
        setTimeout(() => {
          banner.style.transform = 'translateX(-50%) translateY(-180%)';
          banner.style.opacity = '0';
        }, 3500);
      }

      recentlyHealedMap.set(data.targetPath, Date.now() + 3500);
      updateAuditBadge(data.newHealthScore, data.totalFractures);

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1040, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (_) {}

      setTimeout(() => {
        loadLevel(currentPath);
      }, 500);
    }

    function triggerDominoStorm(data) {
      alertFlash = 1.0;
      activeAlertPath = data.targetPath;

      fetch('/api/trace-damage?target=' + encodeURIComponent(data.targetPath))
        .then(res => res.json())
        .then(trace => {
          if (!trace.found) return;

          highlightedDominoPaths.clear();
          highlightedDominoPaths.add(trace.origin.id);

          document.getElementById('domino-origin').innerHTML = 
            '<strong>Archivo Origen:</strong> ' + trace.origin.id + ' <span style="color:#ff1744;">(D_shear = ' + data.shearDistance + ')</span>';

          const listDiv = document.getElementById('domino-degrees-list');
          listDiv.innerHTML = '';

          for (const deg of trace.degrees) {
            if (deg.nodes.length === 0) continue;

            const degBox = document.createElement('div');
            degBox.className = 'domino-degree';
            degBox.innerHTML = '<div style="font-weight:700; font-size:12px; color:#ff8a80;">Grado ' + deg.degree + ': ' + deg.title + '</div>';

            const chipsDiv = document.createElement('div');
            chipsDiv.className = 'domino-nodes';

            for (const n of deg.nodes) {
              highlightedDominoPaths.add(n.id);
              const chip = document.createElement('span');
              chip.className = 'domino-chip';
              chip.textContent = n.name;
              chipsDiv.appendChild(chip);
            }

            degBox.appendChild(chipsDiv);
            listDiv.appendChild(degBox);
          }

          document.getElementById('domino-alt').innerHTML = 
            '👉 <strong>Alternativa Segura Sugerida:</strong> ' + (data.recommendations ? data.recommendations.join('; ') : 'Configuración declarativa sin daño');

          document.getElementById('domino-panel').classList.add('active');

          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.8);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          } catch (_) {}
        });
    }

    function closeDomino() {
      document.getElementById('domino-panel').classList.remove('active');
      highlightedDominoPaths.clear();
      activeAlertPath = null;
    }
  </script>
</body>
</html>`;
  }
}

export const OcteractDashboard = TesseractDashboard;
export type OcteractDashboard = TesseractDashboard;

