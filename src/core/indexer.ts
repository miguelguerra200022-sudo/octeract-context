/**
 * TESSERACT-CONTEXT: Indexador Topológico de Repositorios
 * Escanea proyectos, asigna coordenadas 4D en el Hexadec-Tree y mapea dependencias
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CubicCell, type HyperVertex, type Point4D, type Point8D, type AuditReport } from './types.ts';
import { HypercubeSpace } from './hypercube.ts';
import { TopologicalAuditor } from './auditor.ts';
import type { LanguageParser } from '../parsers/base.ts';
import { TypeScriptParser } from '../parsers/ts-parser.ts';
import { PythonParser } from '../parsers/py-parser.ts';
import { GenericParser } from '../parsers/generic-parser.ts';
import { BinarySerializer } from './binary.ts';
import { IncrementalCache } from './cache.ts';
import { AsymptoticAnalyzer } from './asymptotics.ts';
import { AsyncFlowAnalyzer } from './async-flow.ts';

export interface IndexerOptions {
  rootDir: string;
  maxFiles?: number;
  ignorePatterns?: string[];
}

export class ProjectIndexer {
  private space: HypercubeSpace;
  private parsers: LanguageParser[];
  private auditor: TopologicalAuditor;
  private lastAuditReport?: AuditReport;
  private currentRootDir?: string;
  private cache?: IncrementalCache;
  private defaultIgnore: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.tesseract',
    '.octeract',
    '.gemini',
    '.cache',
    'tmp',
    '.vscode',
    '.idea',
    'coverage',
    'fixtures',
    '.log',
  ];

  constructor(space?: HypercubeSpace) {
    this.space = space || new HypercubeSpace();
    this.parsers = [new TypeScriptParser(), new PythonParser(), new GenericParser()];
    this.auditor = new TopologicalAuditor();
  }

  public getSpace(): HypercubeSpace {
    return this.space;
  }

  /**
   * Ejecuta la auditoría topológica sobre el espacio actual sin gastar tokens
   */
  public auditRepository(rootDir?: string): AuditReport {
    const dir = rootDir || this.currentRootDir;
    this.lastAuditReport = this.auditor.audit(this.space, dir);
    return this.lastAuditReport;
  }

  /**
   * Retorna el último reporte de auditoría generado
   */
  public getAuditReport(): AuditReport | undefined {
    return this.lastAuditReport;
  }

  /**
   * Clasifica un archivo en una de las 8 celdas cúbicas 3D del teseracto
   */
  public classifyCell(relativePath: string, content: string): CubicCell {
    const lower = relativePath.toLowerCase();

    // 1. Tests y Verificación
    if (
      lower.includes('test') ||
      lower.includes('spec') ||
      lower.includes('__tests__') ||
      lower.endsWith('.test.ts') ||
      lower.endsWith('.spec.ts')
    ) {
      return CubicCell.Tests;
    }

    // 2. Seguridad y Permisos
    if (
      lower.includes('auth') ||
      lower.includes('security') ||
      lower.includes('crypto') ||
      lower.includes('jwt') ||
      lower.includes('perm') ||
      lower.includes('guard')
    ) {
      return CubicCell.Security;
    }

    // 3. Telemetría y Observabilidad
    if (
      lower.includes('log') ||
      lower.includes('metric') ||
      lower.includes('trace') ||
      lower.includes('telemetry') ||
      lower.includes('monitor')
    ) {
      return CubicCell.Telemetry;
    }

    // 4. Configuración e Infraestructura
    if (
      lower.endsWith('package.json') ||
      lower.endsWith('tsconfig.json') ||
      lower.includes('docker') ||
      lower.endsWith('.yml') ||
      lower.endsWith('.yaml') ||
      lower.includes('config') ||
      lower.endsWith('.env')
    ) {
      return CubicCell.Config;
    }

    // 5. Red y Periféricos
    if (
      lower.includes('api') ||
      lower.includes('http') ||
      lower.includes('route') ||
      lower.includes('controller') ||
      lower.includes('socket') ||
      lower.includes('client')
    ) {
      return CubicCell.Network;
    }

    // 6. Almacenamiento y Estado
    if (
      lower.includes('db') ||
      lower.includes('store') ||
      lower.includes('database') ||
      lower.includes('repo') ||
      lower.includes('cache') ||
      lower.includes('model') ||
      lower.endsWith('.sql')
    ) {
      return CubicCell.Storage;
    }

    // 7. Tipos y Contratos
    if (
      lower.includes('types') ||
      lower.includes('interface') ||
      lower.endsWith('.d.ts') ||
      lower.includes('schema') ||
      lower.includes('dto')
    ) {
      return CubicCell.Types;
    }

    // 8. Lógica Núcleo por defecto
    return CubicCell.CoreLogic;
  }

  /**
   * Calcula la coordenada 4D continua en [0, 1]^4 para un archivo
   */
  public computeCoordinate(cell: CubicCell, lines: number, symbolCount: number, modifiedTime: number): Point4D {
    // Eje X: Complejidad Sintáctica (acotada entre 0.1 y 0.95 según líneas)
    const x = Math.min(0.95, Math.max(0.05, lines / 600.0));

    // Eje Y: Dimensión Semántica según la Celda Cúbica
    const cellYMap: Record<CubicCell, number> = {
      [CubicCell.CoreLogic]: 0.15,
      [CubicCell.Types]: 0.25,
      [CubicCell.Storage]: 0.40,
      [CubicCell.Network]: 0.50,
      [CubicCell.Tests]: 0.65,
      [CubicCell.Config]: 0.75,
      [CubicCell.Security]: 0.85,
      [CubicCell.Telemetry]: 0.95,
    };
    const y = cellYMap[cell] || 0.5;

    // Eje Z: Densidad de Contratos y Símbolos
    const z = Math.min(0.95, Math.max(0.05, symbolCount / 20.0));

    // Eje W: Volatilidad y Frescura Temporal
    const ageDays = (Date.now() - modifiedTime) / (1000 * 60 * 60 * 24);
    const w = Math.min(0.95, Math.max(0.05, 1.0 - Math.min(30, ageDays) / 30.0));

    return [
      parseFloat(x.toFixed(3)),
      parseFloat(y.toFixed(3)),
      parseFloat(z.toFixed(3)),
      parseFloat(w.toFixed(3)),
    ];
  }

  /**
   * Calcula la coordenada 8D canónica [X, Y, Z, W, PHI, PSI, OMEGA, XI]
   */
  public computeCoordinate8D(
    coord4D: Point4D,
    content: string,
    relPath: string
  ): Point8D {
    const asymp = new AsymptoticAnalyzer().analyzeContent(content, relPath);
    const asyncFlow = new AsyncFlowAnalyzer().analyzeContent(content, relPath);
    const phi = asymp.asymptoticScore;
    const psi = 0.85; // Estabilidad causal base
    const omega = asyncFlow.asyncComplexityScore;
    const xi = relPath.startsWith('package.json') || relPath.startsWith('bin/') ? 0.90 : 0.20;

    return [
      coord4D[0],
      coord4D[1],
      coord4D[2],
      coord4D[3],
      parseFloat(phi.toFixed(3)),
      parseFloat(psi.toFixed(3)),
      parseFloat(omega.toFixed(3)),
      parseFloat(xi.toFixed(3)),
    ];
  }

  /**
   * Escanea e indexa el repositorio recursivamente
   */
  public indexDirectory(options: IndexerOptions): HypercubeSpace {
    const rootDir = path.resolve(options.rootDir);
    const ignoreList = [...this.defaultIgnore, ...(options.ignorePatterns || [])];
    const maxFiles = options.maxFiles || 50000;

    const fileList: string[] = [];
    this.walkDirectory(rootDir, rootDir, ignoreList, fileList, maxFiles);

    if (!this.cache) {
      this.cache = new IncrementalCache(rootDir);
    }

    const MAX_FULL_FILE_SIZE = 1500 * 1024; // 1.5MB
    const SKELETON_SAMPLE_SIZE = 128 * 1024; // 128KB para esqueletizar archivos gigantes sin desbordar RAM

    for (const relPath of fileList) {
      const fullPath = path.join(rootDir, relPath);
      let content = '';
      let isSkeleton = false;

      try {
        const stats = fs.statSync(fullPath);
        const vertexId = relPath.replace(/\\/g, '/');

        // Pre-check de Caché Incremental: Si el archivo no ha cambiado y ya está en el espacio, reutilizar en O(1)
        const existingVertex = this.space.getVertex(vertexId);
        if (existingVertex && !this.cache.isModified(fullPath) && existingVertex.lastModified === stats.mtimeMs) {
          continue;
        }

        // Esqueletización superficial (Skeleton Indexing) para archivos mayores a 1.5MB
        if (stats.size > MAX_FULL_FILE_SIZE) {
          isSkeleton = true;
          const fd = fs.openSync(fullPath, 'r');
          const buf = Buffer.alloc(SKELETON_SAMPLE_SIZE);
          const bytesRead = fs.readSync(fd, buf, 0, SKELETON_SAMPLE_SIZE, 0);
          fs.closeSync(fd);
          content = buf.toString('utf-8', 0, bytesRead);
        } else {
          content = fs.readFileSync(fullPath, 'utf-8');
        }

        // Seleccionar parser apropiado
        const parser = this.parsers.find((p) => p.supports(relPath)) || this.parsers[2];
        const parseResult = parser.parse(relPath, content);

        const cell = this.classifyCell(relPath, content);
        const coordinate = this.computeCoordinate(
          cell,
          parseResult.totalLines,
          parseResult.symbols.length,
          stats.mtimeMs
        );

        const hexCode = this.space.tree.coordinateToHex(coordinate);

        const coordinate8D = this.computeCoordinate8D(coordinate, content, relPath);

        const vertex: HyperVertex = {
          id: vertexId,
          hexCode,
          path: relPath,
          cell,
          coordinate,
          coordinate8D,
          lines: isSkeleton ? Math.max(parseResult.totalLines, Math.round(stats.size / 40)) : parseResult.totalLines,
          sizeBytes: stats.size,
          tokenEstimate: Math.round(content.length / 3.8),
          symbols: parseResult.symbols,
          dependencies: parseResult.dependencies,
          dependents: [],
          inDegree: 0,
          outDegree: parseResult.dependencies.length,
          lastModified: stats.mtimeMs,
        };

        this.space.addVertex(vertex);
        this.cache.record(fullPath);
      } catch (_e) {
        // Ignorar archivos que no se puedan leer como texto UTF-8
        continue;
      }
    }

    this.currentRootDir = options.rootDir;

    // Resolver grafo de dependientes inversos
    this.resolveDependents();

    // Auditoría topológica determinista automática
    this.auditRepository(options.rootDir);

    return this.space;
  }

  /**
   * Recorre directorios de forma iterativa y ultra-rápida (Zero-Recursion, fdir style)
   * Usa fs.readdirSync con withFileTypes: true para evitar llamadas adicionales a stat
   */
  private walkDirectory(
    startDir: string,
    rootDir: string,
    ignoreList: string[],
    result: string[],
    maxFiles: number
  ): void {
    const queue: string[] = [startDir];

    while (queue.length > 0 && result.length < maxFiles) {
      const currentDir = queue.shift()!;
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch (_e) {
        continue;
      }

      for (const entry of entries) {
        if (result.length >= maxFiles) break;

        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(rootDir, fullPath);

        if (ignoreList.some((pattern) => entry.name === pattern || relPath.includes(pattern) || entry.name.endsWith(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          queue.push(fullPath);
        } else if (entry.isFile()) {
          result.push(relPath);
        }
      }
    }
  }

  /**
   * Resuelve la ruta canónica y determinista de un import.
   * Elimina al 100% las colisiones entre archivos con nombres idénticos (ej. múltiples utils.ts).
   */
  public resolveCanonicalImport(
    importerId: string,
    importSpecifier: string,
    idMap: Map<string, HyperVertex>
  ): HyperVertex | null {
    const cleanSpecifier = importSpecifier.trim();
    if (!cleanSpecifier) return null;

    const candidateExtensions = [
      '',
      '.ts',
      '.tsx',
      '.d.ts',
      '.js',
      '.jsx',
      '.mjs',
      '.py',
      '.rs',
      '.go',
      '/index.ts',
      '/index.js',
      '/index.tsx',
    ];

    // 1. Caso de Importación Relativa (comienza con './' o '../')
    if (cleanSpecifier.startsWith('.')) {
      const importerDir = path.posix.dirname(importerId);
      const normalizedBase = path.posix.normalize(path.posix.join(importerDir, cleanSpecifier));
      const baseWithoutExt = normalizedBase.replace(/\.(js|mjs|jsx|ts|tsx)$/, '');
      const bases = baseWithoutExt !== normalizedBase ? [normalizedBase, baseWithoutExt] : [normalizedBase];

      for (const base of bases) {
        for (const ext of candidateExtensions) {
          const candidate = (base + ext).replace(/\\/g, '/');
          const found = idMap.get(candidate);
          if (found) return found;
        }
      }
      return null;
    }

    // 2. Caso de Importación Absoluta o con Alias de Proyecto (ej. 'vs/base/common/event' o '@/components/button')
    const strippedAlias = cleanSpecifier.replace(/^@\//, '');
    const candidatePrefixes = ['', 'src/', 'lib/', 'app/', 'packages/'];

    for (const prefix of candidatePrefixes) {
      const baseWithPrefix = path.posix.normalize(prefix + strippedAlias);
      const baseWithoutExt = baseWithPrefix.replace(/\.(js|mjs|jsx|ts|tsx)$/, '');
      const bases = baseWithoutExt !== baseWithPrefix ? [baseWithPrefix, baseWithoutExt] : [baseWithPrefix];

      for (const b of bases) {
        for (const ext of candidateExtensions) {
          const candidate = (b + ext).replace(/\\/g, '/');
          const found = idMap.get(candidate);
          if (found) return found;
        }
      }
    }

    // 3. Coincidencia exacta con ID de la colección
    return idMap.get(cleanSpecifier) || null;
  }

  /**
   * Conecta las dependencias canónicas e inversas en el grafo sin colisiones
   */
  private resolveDependents(): void {
    const vertices = this.space.getVertices();
    const idMap = new Map<string, HyperVertex>();

    for (const v of vertices) {
      idMap.set(v.id.replace(/\\/g, '/'), v);
    }

    for (const vertex of vertices) {
      const normalizedImporterId = vertex.id.replace(/\\/g, '/');
      for (const dep of vertex.dependencies) {
        const matched = this.resolveCanonicalImport(normalizedImporterId, dep, idMap);
        if (matched && matched.id !== vertex.id && !matched.dependents.includes(vertex.id)) {
          matched.dependents.push(vertex.id);
          matched.inDegree = (matched.inDegree || 0) + 1;
        }
      }
    }
  }

  /**
   * Guarda el índice en caché (.tesseract/index.bin y .tesseract/index.json)
   */
  public saveIndex(rootDir: string): void {
    const tesseractDir = path.join(rootDir, '.tesseract');
    if (!fs.existsSync(tesseractDir)) {
      fs.mkdirSync(tesseractDir, { recursive: true });
    }

    // 1. Guardar en formato binario CSR de alta densidad (< 100ms)
    try {
      const binPath = path.join(tesseractDir, 'index.bin');
      const binBuffer = BinarySerializer.serialize(this.space);
      fs.writeFileSync(binPath, binBuffer);
    } catch (_binErr) {
      // Si falla serialización binaria, continúa a JSON
    }

    // 2. Guardar también en formato JSON para compatibilidad retroactiva e inspección humana
    const indexPath = path.join(tesseractDir, 'index.json');
    const vertices = this.space.getVertices();

    const data = {
      version: '2.1.0',
      timestamp: Date.now(),
      totalFiles: vertices.length,
      vertices,
      auditReport: this.lastAuditReport,
    };

    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache?.save();
  }

  /**
   * Carga el índice desde caché (prioriza index.bin sobre index.json)
   */
  public loadIndex(rootDir: string): boolean {
    const tesseractDir = path.join(rootDir, '.tesseract');
    const binPath = path.join(tesseractDir, 'index.bin');
    const jsonPath = path.join(tesseractDir, 'index.json');

    // 1. Intento primario: Carga binaria ultrarrápida (< 80ms)
    if (fs.existsSync(binPath)) {
      try {
        const binBuffer = fs.readFileSync(binPath);
        const restoredSpace = BinarySerializer.deserialize(binBuffer);
        const vertices = restoredSpace.getVertices();
        for (const v of vertices) {
          this.space.addVertex(v);
        }
        this.currentRootDir = rootDir;
        this.syncModifiedFiles(rootDir);
        return true;
      } catch (_binReadErr) {
        // Fallback a JSON si el archivo binario estuviera dañado
      }
    }

    // 2. Fallback secundario: Carga desde index.json
    if (!fs.existsSync(jsonPath)) return false;

    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.vertices)) {
        for (const v of data.vertices) {
          this.space.addVertex(v);
        }
        this.currentRootDir = rootDir;
        this.syncModifiedFiles(rootDir);
        if (data.auditReport) {
          this.lastAuditReport = data.auditReport;
        }
        return true;
      }
    } catch (_e) {
      return false;
    }
    return false;
  }

  /**
   * Sincroniza incrementalmente en RAM cualquier cambio en disco:
   * 1. Detecta archivos modificados y actualiza su AST en RAM.
   * 2. Detecta archivos NUEVOS creados en disco y los clasifica en R^4.
   * 3. Detecta archivos BORRADOS y los purga del hipercubo.
   * 4. Recalcula el Efecto Dominó (resolveDependents) y ejecuta la auto-auditoría completa.
   */
  public syncModifiedFiles(rootDir: string): { modified: number; added: number; deleted: number } {
    const root = path.resolve(rootDir);
    let modified = 0;
    let added = 0;
    let deleted = 0;

    const ignoreList = [...this.defaultIgnore];
    const diskFiles: string[] = [];
    this.walkDirectory(root, root, ignoreList, diskFiles, 50000);

    const diskFileSet = new Set(diskFiles.map((f) => f.replace(/\\/g, '/')));
    const vertices = this.space.getVertices();
    const vertexMap = new Map<string, HyperVertex>();

    // 1. Detectar archivos eliminados de disco
    for (const v of vertices) {
      vertexMap.set(v.id.replace(/\\/g, '/'), v);
      if (!diskFileSet.has(v.id)) {
        this.space.removeVertex(v.id);
        deleted++;
      }
    }

    // 2. Detectar modificados y nuevos
    for (const relPath of diskFiles) {
      const id = relPath.replace(/\\/g, '/');
      const fullPath = path.join(root, relPath);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
        if (stat.size > 1500 * 1024) continue;
      } catch (_) {
        continue;
      }

      const existingVertex = vertexMap.get(id);

      if (!existingVertex) {
        // ARCHIVO NUEVO EN DISCO
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parser = this.parsers.find((p) => p.supports(relPath)) || this.parsers[2];
          const parseResult = parser.parse(relPath, content);
          const cell = this.classifyCell(relPath, content);
          const coordinate = this.computeCoordinate(
            cell,
            parseResult.totalLines,
            parseResult.symbols.length,
            stat.mtimeMs
          );
          const hexCode = this.space.tree.coordinateToHex(coordinate);
          const coordinate8D = this.computeCoordinate8D(coordinate, content, relPath);
          const vertex: HyperVertex = {
            id,
            hexCode,
            path: relPath,
            cell,
            coordinate,
            coordinate8D,
            lines: parseResult.totalLines,
            sizeBytes: stat.size,
            tokenEstimate: Math.round(content.length / 3.8),
            symbols: parseResult.symbols,
            dependencies: parseResult.dependencies,
            dependents: [],
            inDegree: 0,
            outDegree: parseResult.dependencies.length,
            lastModified: stat.mtimeMs,
          };
          this.space.addVertex(vertex);
          added++;
        } catch (_) {}
      } else if (stat.mtimeMs > (existingVertex.lastModified || 0) + 500) {
        // ARCHIVO MODIFICADO EN DISCO
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parser = this.parsers.find((p) => p.supports(relPath)) || this.parsers[2];
          const parseResult = parser.parse(relPath, content);
          existingVertex.symbols = parseResult.symbols;
          existingVertex.dependencies = parseResult.dependencies;
          existingVertex.lines = parseResult.totalLines;
          existingVertex.sizeBytes = stat.size;
          existingVertex.lastModified = stat.mtimeMs;
          existingVertex.tokenEstimate = Math.round(content.length / 3.8);
          modified++;
        } catch (_) {}
      }
    }

    if (modified > 0 || added > 0 || deleted > 0) {
      this.resolveDependents();
      this.auditRepository(root);
      this.saveIndex(root);
    }

    return { modified, added, deleted };
  }
}
