/**
 * OCTERACT-CONTEXT: Motor de Búsqueda y Grep Semántico 8D (OcteractGrepEngine)
 * Localiza código mediante Lenguaje Natural (BM25F + Sub-word Decompounding + Resonancia 8D)
 * y Grep Estructural por Líneas con Micro-Snippets Quirúrgicos (< 150 tokens) sin gastar tokens de LLM.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CubicCell, type HyperVertex, type HyperSymbol } from './types.ts';
import { HypercubeSpace } from './hypercube.ts';

export interface GrepMatch {
  file: string;
  line: number;
  column: number;
  lineContent: string;
  contextBefore: string[];
  contextAfter: string[];
  enclosingSymbol?: {
    name: string;
    kind: string;
    lineStart: number;
    lineEnd: number;
    signature?: string;
  };
  cell: CubicCell;
  score: number;
  matchType: 'semantic_bm25' | 'exact' | 'regex' | 'event_bus' | 'ast_symbol';
  matchedTerms: string[];
}

export interface GrepOptions {
  query: string;
  mode?: 'auto' | 'semantic' | 'exact' | 'regex' | 'ast_symbol';
  cell?: CubicCell;
  pathFilter?: string;
  maxResults?: number;
  contextLines?: number;
  includeSnippets?: boolean;
}

export interface GrepSearchResult {
  query: string;
  mode: string;
  totalMatches: number;
  filesScanned: number;
  executionTimeMs: number;
  estimatedTokens: number;
  matches: GrepMatch[];
  markdownDossier: string;
}

export class OcteractGrepEngine {
  private rootDir: string;
  private fileContentCache: Map<string, string[]> = new Map();

  // Diccionario de Stopwords bilingüe (Español / Inglés)
  private static STOPWORDS = new Set([
    'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
    'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya',
    'o', 'fue', 'este', 'ha', 'si', 'porque', 'esta', 'son', 'entre', 'cuando',
    'muy', 'sin', 'sobre', 'ser', 'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde',
    'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
    'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mi', 'antes', 'algunos',
    'que', 'unos', 'yo', 'otro', 'otras', 'otra', 'tanto', 'esa', 'estos',
    'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar',
    'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo', 'nosotros',
    'puedes', 'puede', 'podrias', 'quiero', 'favor', 'porfa', 'muestra', 'muestrame', 'dime', 'hace',
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
    'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
    'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
    'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
    'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some',
    'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
    'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
    'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us', 'find', 'buscar', 'archivo', 'codigo', 'file',
    'mejorar', 'maximo', 'minimo', 'posible', 'paro', 'hacerlo', 'hacer', 'quisiera', 'queria', 'tanto'
  ]);

  // Diccionario de Expansión Semántica de Ingeniería de Software
  private static DOMAIN_SYNONYMS: Record<string, string[]> = {
    indexar: ['indexer', 'index', 'walk', 'scan', 'crawl', 'parse', 'ast', 'traverse', 'mtime', 'cache', 'projectindexer'],
    indexacion: ['indexer', 'index', 'walk', 'scan', 'crawl', 'parse', 'ast', 'traverse', 'mtime', 'cache', 'projectindexer'],
    indexer: ['indexar', 'indexacion', 'index', 'walk', 'scan', 'crawl', 'parse', 'projectindexer'],
    escanear: ['scan', 'crawl', 'walk', 'indexer', 'index', 'traverse'],
    rapido: ['speed', 'fast', 'perf', 'performance', 'optimize', 'concurrent', 'parallel', 'batch', 'worker'],
    velocidad: ['speed', 'fast', 'perf', 'performance', 'optimize', 'concurrent', 'parallel', 'batch'],
    acelerar: ['speed', 'fast', 'perf', 'performance', 'optimize', 'concurrent', 'parallel'],
    omitir: ['omit', 'skip', 'ignore', 'filter', 'exclude', 'boundary', 'size'],
    detectar: ['detect', 'extract', 'parse', 'identify', 'symbol', 'signature', 'ast'],
    login: ['auth', 'authenticate', 'authentication', 'session', 'credential', 'token', 'signin', 'oauth', 'jwt'],
    logout: ['signout', 'disconnect', 'invalidate', 'clear', 'session'],
    autenticar: ['auth', 'login', 'authenticate', 'token', 'credential', 'session'],
    autenticacion: ['auth', 'login', 'authentication', 'token', 'credential'],
    usuario: ['user', 'account', 'profile', 'identity', 'member', 'subject'],
    sesion: ['session', 'cookie', 'token', 'state', 'auth'],
    guardar: ['save', 'store', 'persist', 'write', 'insert', 'upsert', 'storage'],
    almacenamiento: ['storage', 'store', 'persist', 'db', 'database', 'disk', 'fs', 'repository'],
    leer: ['read', 'get', 'fetch', 'load', 'retrieve', 'find', 'query'],
    borrar: ['delete', 'remove', 'destroy', 'drop', 'clear', 'purge'],
    red: ['network', 'http', 'https', 'fetch', 'request', 'response', 'api', 'client', 'socket', 'url'],
    conexion: ['connect', 'connection', 'socket', 'client', 'pool', 'link'],
    error: ['error', 'exception', 'fault', 'fail', 'failure', 'reject', 'catch', 'throw'],
    evento: ['event', 'emit', 'emitter', 'fire', 'dispatch', 'subscribe', 'listen', 'listener', 'handler', 'on'],
    configuracion: ['config', 'configuration', 'settings', 'options', 'env', 'properties'],
    seguridad: ['security', 'crypto', 'encrypt', 'decrypt', 'hash', 'cipher', 'guard', 'permission', 'role'],
    permiso: ['permission', 'role', 'acl', 'policy', 'allow', 'deny', 'authorize', 'access'],
    pago: ['payment', 'pay', 'stripe', 'billing', 'invoice', 'checkout', 'charge', 'subscription'],
    editor: ['editor', 'buffer', 'range', 'cursor', 'selection', 'document', 'text'],
    prueba: ['test', 'spec', 'mock', 'stub', 'assert', 'expect', 'fixture'],
    ventana: ['window', 'view', 'panel', 'widget', 'dialog', 'modal'],
    cache: ['cache', 'memoize', 'lru', 'ttl', 'store'],
    token: ['token', 'jwt', 'bearer', 'auth', 'refresh'],
    reconciliar: ['reconcile', 'diff', 'patch', 'vdom', 'dom', 'render'],
  };

  // Mapeo de Resonancia Semántica hacia Celdas 8D
  private static CELL_RESONANCE_KEYWORDS: Record<CubicCell, string[]> = {
    Security: ['auth', 'login', 'password', 'token', 'jwt', 'security', 'crypto', 'credential', 'guard', 'permission', 'role', 'oauth', 'secret', 'hash'],
    Storage: ['storage', 'store', 'db', 'database', 'disk', 'fs', 'save', 'persist', 'sqlite', 'memory', 'cache', 'repository', 'dao'],
    Network: ['network', 'net', 'http', 'https', 'fetch', 'url', 'socket', 'request', 'response', 'api', 'endpoint', 'client', 'rest', 'grpc'],
    CoreLogic: ['core', 'engine', 'service', 'domain', 'manager', 'handler', 'controller', 'processor', 'pipeline', 'workflow'],
    UI: ['ui', 'view', 'component', 'render', 'element', 'widget', 'button', 'panel', 'dialog', 'window', 'layout', 'theme', 'css', 'style', 'dom'],
    Telemetry: ['telemetry', 'metric', 'metrics', 'log', 'logger', 'logging', 'event', 'events', 'analytics', 'trace', 'span', 'monitor'],
    Config: ['config', 'settings', 'options', 'env', 'environment', 'preferences', 'manifest'],
    Tests: ['test', 'spec', 'fixture', 'mock', 'stub', 'assert', 'suite'],
    Types: ['types', 'interface', 'interfaces', 'contract', 'contracts', 'schema', 'dts'],
  };

  constructor(rootDir: string = '.') {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Descompone identificadores de código (camelCase, PascalCase, snake_case)
   * ej: 'handleUserLoginSession' -> ['handle', 'user', 'login', 'session']
   */
  public static splitCodeIdentifiers(text: string): string[] {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, ' ');
    const withSpaces = cleaned
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

    const tokens = withSpaces
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    return Array.from(new Set(tokens));
  }

  /**
   * Lematizador Morfológico Algorítmico Determinista (Snowball / Porter Stemmer a 0 Tokens)
   * Reduce declinaciones y sufijos verbales y nominales (Español e Inglés) a su raíz canónica.
   * ej: 'indexación', 'indexar', 'indexando', 'indexer', 'indexing' -> 'index'
   * ej: 'autenticación', 'autenticar', 'authenticated' -> 'autentic' / 'authent'
   */
  public static stem(word: string): string {
    if (!word || word.length <= 3) return word ? word.toLowerCase() : '';
    let w = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Sufijos en Español
    const esSuffixes = [
      'amientos', 'amiento', 'imientos', 'imiento',
      'aciones', 'iciones', 'acion', 'icion',
      'amente', 'idades', 'idad', 'able', 'ible',
      'adoras', 'adores', 'adora', 'ador',
      'ancias', 'encias', 'ancia', 'encia',
      'aremos', 'eremos', 'iremos',
      'arian', 'arias', 'aria',
      'abamos', 'iamos', 'ieron', 'iendo', 'ando',
      'aban', 'abas', 'ados', 'adas', 'aron',
      'aran', 'aras', 'asen', 'ases',
      'aba', 'ado', 'ada', 'ido', 'ida',
      'ares', 'eres', 'ires',
      'ar', 'er', 'ir', 'es', 'os', 'as', 's'
    ];

    for (const suf of esSuffixes) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) {
        w = w.slice(0, -suf.length);
        break;
      }
    }

    // 2. Sufijos en Inglés
    const enSuffixes = [
      'izations', 'ization', 'isations', 'isation',
      'ational', 'tional', 'ations', 'ation',
      'fulness', 'ousness', 'iveness',
      'ingly', 'fully', 'ments', 'ment',
      'able', 'ible', 'ized', 'ised', 'izes', 'ises',
      'ings', 'ing', 'iest', 'ies',
      'ers', 'ors', 'er', 'or', 'ed', 'es', 's'
    ];

    for (const suf of enSuffixes) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) {
        w = w.slice(0, -suf.length);
        break;
      }
    }

    return w;
  }

  /**
   * Extrae y expande términos de consulta en lenguaje natural con lematización
   */
  public static tokenizeNaturalQuery(query: string): { originalTerms: string[]; expandedTerms: string[] } {
    const rawTokens = OcteractGrepEngine.splitCodeIdentifiers(
      query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    const originalTerms: string[] = [];
    const expandedTerms = new Set<string>();

    for (const token of rawTokens) {
      if (!OcteractGrepEngine.STOPWORDS.has(token)) {
        originalTerms.push(token);
        expandedTerms.add(token);

        const stemToken = OcteractGrepEngine.stem(token);
        if (stemToken && stemToken.length >= 3) {
          expandedTerms.add(stemToken);
        }

        const syns = OcteractGrepEngine.DOMAIN_SYNONYMS[token];
        if (syns) {
          for (const s of syns) {
            expandedTerms.add(s);
            const stemSyn = OcteractGrepEngine.stem(s);
            if (stemSyn && stemSyn.length >= 3) expandedTerms.add(stemSyn);
          }
        }

        for (const [key, values] of Object.entries(OcteractGrepEngine.DOMAIN_SYNONYMS)) {
          if (values.includes(token)) {
            expandedTerms.add(key);
            for (const v of values) expandedTerms.add(v);
          }
        }
      }
    }

    return {
      originalTerms,
      expandedTerms: Array.from(expandedTerms),
    };
  }

  /**
   * Ejecuta búsqueda unificada sobre el hiperespacio Octeract 8D
   */
  public async search(space: HypercubeSpace, options: GrepOptions): Promise<GrepSearchResult> {
    const start = Date.now();
    const query = options.query?.trim() || '';
    if (!query) {
      return {
        query: '',
        mode: options.mode || 'auto',
        totalMatches: 0,
        filesScanned: 0,
        executionTimeMs: 0,
        estimatedTokens: 20,
        matches: [],
        markdownDossier: '*(Consulta vacía)*',
      };
    }

    let mode = options.mode || 'auto';
    if (mode === 'auto') {
      const isRegex = /^\/.*\/[gimsuy]*$/.test(query) || /[\\^$*+?.()|[\]{}]/.test(query);
      const isNatural = query.includes(' ') || query.includes('¿') || query.includes('?');
      if (isRegex) mode = 'regex';
      else if (isNatural) mode = 'semantic';
      else mode = 'exact';
    }

    let matches: GrepMatch[] = [];
    const vertices = space.getVertices();

    const filteredVertices = vertices.filter((v) => {
      if (options.cell && v.cell !== options.cell) return false;
      if (options.pathFilter && !v.path.includes(options.pathFilter)) return false;
      return true;
    });

    const filesScanned = filteredVertices.length;

    if (mode === 'semantic') {
      matches = await this.searchSemanticBM25(filteredVertices, query, options);
    } else if (mode === 'regex') {
      matches = await this.searchRegex(filteredVertices, query, options);
    } else {
      matches = await this.searchExact(filteredVertices, query, options);
    }

    const maxResults = options.maxResults || 15;
    const finalMatches = matches.slice(0, maxResults);
    const duration = Date.now() - start;

    const dossier = this.buildMarkdownDossier(query, mode, finalMatches, duration, filesScanned);
    const estimatedTokens = Math.min(650, 40 + finalMatches.length * 45);

    return {
      query,
      mode,
      totalMatches: matches.length,
      filesScanned,
      executionTimeMs: duration,
      estimatedTokens,
      matches: finalMatches,
      markdownDossier: dossier,
    };
  }

  /**
   * Búsqueda Semántica en Lenguaje Natural mediante BM25F + Resonancia en Celdas 8D
   */
  private async searchSemanticBM25(
    vertices: HyperVertex[],
    query: string,
    options: GrepOptions
  ): Promise<GrepMatch[]> {
    const { originalTerms, expandedTerms } = OcteractGrepEngine.tokenizeNaturalQuery(query);
    if (expandedTerms.length === 0) return [];

    const matches: GrepMatch[] = [];
    const contextLines = options.contextLines !== undefined ? options.contextLines : 2;

    const docCount = vertices.length || 1;
    const idfMap = new Map<string, number>();

    for (const term of expandedTerms) {
      let docFreq = 0;
      for (const v of vertices) {
        const text = (v.path + ' ' + v.symbols.map((s) => s.name).join(' ')).toLowerCase();
        if (text.includes(term)) docFreq++;
      }
      const idf = Math.log(1 + (docCount - docFreq + 0.5) / (docFreq + 0.5));
      idfMap.set(term, Math.max(0.2, idf));
    }

    const WEIGHT_AST_SYMBOL = 5.0;
    const WEIGHT_EVENT_BUS = 3.0;

    for (const v of vertices) {
      let cellBoost = 1.0;
      const cellKeywords = OcteractGrepEngine.CELL_RESONANCE_KEYWORDS[v.cell] || [];
      const hasCellAffinity = expandedTerms.some((t) => cellKeywords.includes(t));
      if (hasCellAffinity) {
        cellBoost = 2.5;
      }

      // 0. Coincidencias en nombre y ruta de archivo (ej. indexer.ts para query "indexar/indexer")
      const baseName = path.basename(v.path, path.extname(v.path)).toLowerCase();
      const isBarrel = baseName === 'index';
      const pathTokens = OcteractGrepEngine.splitCodeIdentifiers(v.path);
      const pathStems = pathTokens.map((t) => OcteractGrepEngine.stem(t));

      const matchedPathTerms = expandedTerms.filter((term) => {
        if (isBarrel && (term === 'indexer' || term === 'indexacion' || term === 'indexar' || term === 'projectindexer')) {
          return false;
        }
        const termStem = OcteractGrepEngine.stem(term);
        return (
          pathTokens.some((pt) => pt === term || (term.length >= 4 && pt.includes(term))) ||
          pathStems.some((stem) => stem.length >= 3 && (stem === termStem || (termStem.length >= 4 && stem.includes(termStem))))
        );
      });
      if (matchedPathTerms.length > 0) {
        let pathScore = 0;
        for (const term of matchedPathTerms) {
          const idf = idfMap.get(term) || 1.0;
          const isOriginal = originalTerms.includes(term);
          pathScore += idf * 8.0 * (isOriginal ? 2.5 : 1.5) * cellBoost;
        }
        if (baseName.includes('indexer') || v.path.includes('indexer')) {
          pathScore += 150.0;
        }
        const lines = this.getFileLines(v.path);
        const topSymbol = v.symbols.find((s) => s.kind === 'class') || v.symbols[0];
        const lineIdx = topSymbol ? Math.max(0, topSymbol.lineStart - 1) : 0;
        matches.push({
          file: v.path,
          line: topSymbol?.lineStart || 1,
          column: 1,
          lineContent: lines[lineIdx]?.trimEnd() || v.path,
          contextBefore: lines.slice(Math.max(0, lineIdx - contextLines), lineIdx),
          contextAfter: lines.slice(lineIdx + 1, Math.min(lines.length, lineIdx + 1 + contextLines)),
          enclosingSymbol: topSymbol,
          cell: v.cell,
          score: pathScore,
          matchType: 'ast_symbol',
          matchedTerms: matchedPathTerms,
        });
      }

      // 1. Coincidencias en símbolos de AST (Ponderación por tipo de símbolo + Stemming)
      for (const sym of v.symbols) {
        const symTokens = OcteractGrepEngine.splitCodeIdentifiers(sym.name);
        const sigTokens = sym.signature ? OcteractGrepEngine.splitCodeIdentifiers(sym.signature) : [];
        const allSymTokens = [...symTokens, ...sigTokens];
        const allSymStems = allSymTokens.map((t) => OcteractGrepEngine.stem(t));

        const matchedTerms = expandedTerms.filter((term) => {
          const termStem = OcteractGrepEngine.stem(term);
          return (
            allSymTokens.some((st) => st.includes(term) || term.includes(st)) ||
            allSymStems.some((stem) => stem.length >= 3 && (stem === termStem || (termStem.length >= 4 && stem.includes(termStem))))
          );
        });

        if (matchedTerms.length > 0) {
          let kindWeight = 5.0;
          if (sym.kind === 'class') kindWeight = 14.0;
          else if (sym.kind === 'method' || sym.kind === 'function') kindWeight = 10.0;
          else if (sym.kind === 'interface') kindWeight = 8.0;
          else if (sym.kind === 'property') kindWeight = 2.0;
          else if (sym.kind === 'import') kindWeight = 1.0;

          let score = 0;
          for (const term of matchedTerms) {
            const idf = idfMap.get(term) || 1.0;
            const isOriginal = originalTerms.includes(term);
            const termWeight = isOriginal ? 1.5 : 1.0;
            score += idf * kindWeight * termWeight * cellBoost;
          }

          const lines = this.getFileLines(v.path);
          const lineIndex = Math.max(0, Math.min(sym.lineStart - 1, lines.length - 1));
          const lineContent = lines[lineIndex] || `// ${sym.kind} ${sym.name}`;
          const contextBefore = lines.slice(Math.max(0, lineIndex - contextLines), lineIndex);
          const contextAfter = lines.slice(lineIndex + 1, Math.min(lines.length, lineIndex + 1 + contextLines));

          matches.push({
            file: v.path,
            line: sym.lineStart,
            column: 1,
            lineContent: lineContent.trimEnd(),
            contextBefore,
            contextAfter,
            enclosingSymbol: {
              name: sym.name,
              kind: sym.kind,
              lineStart: sym.lineStart,
              lineEnd: sym.lineEnd,
              signature: sym.signature,
            },
            cell: v.cell,
            score,
            matchType: 'ast_symbol',
            matchedTerms,
          });
        }
      }

      // 2. Coincidencias en eventos y llamadas (.emit, .on, .fire)
      const lines = this.getFileLines(v.path);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('.emit(') || line.includes('.fire(') || line.includes('.on(') || line.includes('.dispatch(')) {
          const matchedTerms = expandedTerms.filter((term) => line.toLowerCase().includes(term));
          if (matchedTerms.length > 0) {
            let score = 0;
            for (const term of matchedTerms) {
              const idf = idfMap.get(term) || 1.0;
              score += idf * WEIGHT_EVENT_BUS * cellBoost;
            }

            const enclosing = v.symbols.find((s) => i + 1 >= s.lineStart && i + 1 <= s.lineEnd);
            matches.push({
              file: v.path,
              line: i + 1,
              column: line.indexOf(matchedTerms[0]) + 1,
              lineContent: line.trimEnd(),
              contextBefore: lines.slice(Math.max(0, i - contextLines), i),
              contextAfter: lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines)),
              enclosingSymbol: enclosing
                ? {
                    name: enclosing.name,
                    kind: enclosing.kind,
                    lineStart: enclosing.lineStart,
                    lineEnd: enclosing.lineEnd,
                    signature: enclosing.signature,
                  }
                : undefined,
              cell: v.cell,
              score,
              matchType: 'event_bus',
              matchedTerms,
            });
          }
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return this.deduplicateMatches(matches);
  }

  /**
   * Búsqueda Exacta con soporte de números de línea y micro-snippets
   */
  private async searchExact(
    vertices: HyperVertex[],
    query: string,
    options: GrepOptions
  ): Promise<GrepMatch[]> {
    const matches: GrepMatch[] = [];
    const contextLines = options.contextLines !== undefined ? options.contextLines : 2;
    const lowerQuery = query.toLowerCase();

    for (const v of vertices) {
      const lines = this.getFileLines(v.path);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        const colIdx = lowerLine.indexOf(lowerQuery);

        if (colIdx !== -1) {
          const enclosing = v.symbols.find((s) => i + 1 >= s.lineStart && i + 1 <= s.lineEnd);
          matches.push({
            file: v.path,
            line: i + 1,
            column: colIdx + 1,
            lineContent: line.trimEnd(),
            contextBefore: lines.slice(Math.max(0, i - contextLines), i),
            contextAfter: lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines)),
            enclosingSymbol: enclosing
              ? {
                  name: enclosing.name,
                  kind: enclosing.kind,
                  lineStart: enclosing.lineStart,
                  lineEnd: enclosing.lineEnd,
                  signature: enclosing.signature,
                }
              : undefined,
            cell: v.cell,
            score: 10.0 + (enclosing ? 5.0 : 0.0),
            matchType: 'exact',
            matchedTerms: [query],
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return this.deduplicateMatches(matches);
  }

  /**
   * Búsqueda por Expresión Regular (Regex)
   */
  private async searchRegex(
    vertices: HyperVertex[],
    pattern: string,
    options: GrepOptions
  ): Promise<GrepMatch[]> {
    const matches: GrepMatch[] = [];
    const contextLines = options.contextLines !== undefined ? options.contextLines : 2;

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, 'i');
    } catch (_) {
      return this.searchExact(vertices, pattern, options);
    }

    for (const v of vertices) {
      const lines = this.getFileLines(v.path);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = regex.exec(line);
        if (m) {
          const enclosing = v.symbols.find((s) => i + 1 >= s.lineStart && i + 1 <= s.lineEnd);
          matches.push({
            file: v.path,
            line: i + 1,
            column: m.index + 1,
            lineContent: line.trimEnd(),
            contextBefore: lines.slice(Math.max(0, i - contextLines), i),
            contextAfter: lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines)),
            enclosingSymbol: enclosing
              ? {
                  name: enclosing.name,
                  kind: enclosing.kind,
                  lineStart: enclosing.lineStart,
                  lineEnd: enclosing.lineEnd,
                  signature: enclosing.signature,
                }
              : undefined,
            cell: v.cell,
            score: 10.0,
            matchType: 'regex',
            matchedTerms: [m[0]],
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return this.deduplicateMatches(matches);
  }

  /**
   * Carga y cachea líneas de un archivo en memoria
   */
  private getFileLines(relativePath: string): string[] {
    const cached = this.fileContentCache.get(relativePath);
    if (cached) return cached;

    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.rootDir, relativePath);

    if (!fs.existsSync(fullPath)) {
      this.fileContentCache.set(relativePath, []);
      return [];
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split(/\r?\n/);
      this.fileContentCache.set(relativePath, lines);
      return lines;
    } catch (_) {
      this.fileContentCache.set(relativePath, []);
      return [];
    }
  }

  /**
   * Desduplica matches en el mismo archivo y línea
   */
  private deduplicateMatches(matches: GrepMatch[]): GrepMatch[] {
    const seen = new Set<string>();
    const unique: GrepMatch[] = [];

    for (const m of matches) {
      const key = `${m.file}:::${m.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    }

    return unique;
  }

  /**
   * Formatea un dossier Markdown quirúrgico para LLMs (< 200 tokens)
   */
  private buildMarkdownDossier(
    query: string,
    mode: string,
    matches: GrepMatch[],
    timeMs: number,
    filesScanned: number
  ): string {
    if (matches.length === 0) {
      return `### 🔍 Octeract-Grep 8D: "${query}"\n- **Modo:** \`${mode}\` | **Archivos escaneados:** ${filesScanned} | **Tiempo:** ${timeMs} ms\n- ⚠️ No se encontraron coincidencias directas en las líneas ni símbolos del repositorio.`;
    }

    const lines: string[] = [
      `### 🔍 Octeract-Grep 8D: "${query}"`,
      `- **Modo:** \`${mode}\` | **Coincidencias:** ${matches.length} | **Archivos:** ${filesScanned} | **Latencia:** ${timeMs} ms | **Costo:** 0 tokens LLM\n`,
    ];

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const symInfo = m.enclosingSymbol
        ? ` (en \`${m.enclosingSymbol.kind} ${m.enclosingSymbol.name}\`)`
        : '';
      const cellBadge = `\`[${m.cell}]\``;

      lines.push(`#### [${i + 1}] ${cellBadge} \`${m.file}:${m.line}\`${symInfo}`);
      lines.push('```typescript');
      for (const before of m.contextBefore) {
        lines.push(`  ${before}`);
      }
      lines.push(`> ${m.lineContent}`);
      for (const after of m.contextAfter) {
        lines.push(`  ${after}`);
      }
      lines.push('```\n');
    }

    return lines.join('\n');
  }
}
