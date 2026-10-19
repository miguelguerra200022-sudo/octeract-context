/**
 * TESSERACT-CONTEXT: Rastreador Geodésico de Flujos 4D (FlowTracer)
 * Conecta consultas en lenguaje natural con rutas reales de ejecución en R^4
 * Entregando micro-cortes (< 500 tokens) con análisis de ondas de choque colaterales.
 */

import { CubicCell, type HyperVertex, type TopologicalFracture } from './types.ts';
import { HypercubeSpace } from './hypercube.ts';

export interface FlowStep {
  index: number;
  vertexId: string;
  path: string;
  cell: CubicCell;
  matchedKeywords: string[];
  keySymbols: Array<{ name: string; kind: string; signature?: string; lineStart: number }>;
  downstreamDependentsCount: number;
  hasFracture: boolean;
  fractureSummary?: string;
}

export interface FlowTraceReport {
  query: string;
  matchedKeywords: string[];
  sourceFile?: string;
  targetFile?: string;
  totalHops: number;
  flowSteps: FlowStep[];
  asciiDiagram: string;
  estimatedTokens: number;
  collateralRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blastRadiusExplanation: string;
  directAnswerForAI: string;
}

export class FlowTracer {
  // Stopwords comunes en español e inglés para aislar conceptos arquitectónicos
  private static STOPWORDS = new Set([
    'como', 'hace', 'para', 'este', 'esta', 'estos', 'estas', 'donde', 'cual', 'cuales',
    'que', 'los', 'las', 'del', 'con', 'sin', 'por', 'sobre', 'entre', 'hacia', 'hasta',
    'una', 'uno', 'unos', 'unas', 'otro', 'otra', 'otros', 'otras', 'pero', 'mas',
    'how', 'does', 'make', 'with', 'what', 'where', 'which', 'from', 'into', 'about',
    'this', 'that', 'then', 'when', 'will', 'have', 'been', 'code', 'file', 'archivo',
    'sistema', 'funcion', 'parte', 'part', 'todo', 'algo', 'cosa', 'cosas'
  ]);

  private static SYNONYMS: Record<string, string[]> = {
    autenticar: ['auth', 'authenticate', 'login', 'token', 'credential'],
    autenticacion: ['auth', 'authentication', 'login', 'session'],
    usuario: ['user', 'account', 'profile'],
    guardar: ['save', 'store', 'storage', 'persist'],
    almacenamiento: ['storage', 'store', 'db', 'disk'],
    sesion: ['session', 'token', 'state'],
    disco: ['disk', 'file', 'storage', 'fs'],
    red: ['network', 'net', 'http', 'fetch', 'api'],
    archivo: ['file', 'doc', 'fs'],
    error: ['error', 'exception', 'fault', 'failure'],
    editor: ['editor', 'buffer', 'range', 'text'],
    seguridad: ['security', 'auth', 'crypto', 'token'],
    pruebas: ['test', 'spec', 'mock'],
    configuracion: ['config', 'settings', 'options'],
  };

  /**
   * Extrae palabras clave significativas de una consulta en lenguaje natural
   */
  public static extractKeywords(query: string): string[] {
    const rawWords = query
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/[¿?¡!.,;:"'()[\]{}_+\-*/\\#]/g, ' ')
      .split(/\s+/);

    const keywords: string[] = [];
    for (const w of rawWords) {
      const clean = w.trim();
      if (clean.length >= 3 && !FlowTracer.STOPWORDS.has(clean)) {
        if (!keywords.includes(clean)) {
          keywords.push(clean);
          const syns = FlowTracer.SYNONYMS[clean] || [];
          for (const s of syns) {
            if (!keywords.includes(s)) keywords.push(s);
          }
        }
      }
    }
    return keywords;
  }

  /**
   * Rastrea la ruta geodésica de código en el hipercubo 4D
   */
  public static trace(
    space: HypercubeSpace,
    query: string,
    existingFractures: TopologicalFracture[] = []
  ): FlowTraceReport {
    const keywords = FlowTracer.extractKeywords(query);
    const vertices = space.getVertices();
    const idMap = new Map<string, HyperVertex>();
    for (const v of vertices) {
      idMap.set(v.id.replace(/\\/g, '/'), v);
    }

    // Mapa de fracturas por archivo
    const fractureMap = new Map<string, TopologicalFracture[]>();
    for (const f of existingFractures) {
      const list = fractureMap.get(f.source) || [];
      list.push(f);
      fractureMap.set(f.source, list);
    }

    // 1. Puntuación de relevancia de cada vértice para los keywords
    const scoredVertices: Array<{ vertex: HyperVertex; score: number; matched: string[] }> = [];

    for (const v of vertices) {
      let score = 0;
      const matched: string[] = [];
      const vText = (
        v.id + ' ' + 
        v.cell + ' ' + 
        v.symbols.map(s => s.name + ' ' + (s.signature || '')).join(' ')
      ).toLowerCase();

      for (const kw of keywords) {
        if (vText.includes(kw)) {
          score += 10;
          if (!matched.includes(kw)) matched.push(kw);
          if (v.id.toLowerCase().includes(kw)) score += 15;
          if (v.symbols.some(s => s.name.toLowerCase() === kw || s.name.toLowerCase().includes(kw))) score += 25;
        }
      }

      if (score > 0) {
        scoredVertices.push({ vertex: v, score, matched });
      }
    }

    // Ordenar por relevancia descendente
    scoredVertices.sort((a, b) => b.score - a.score);

    // 2. Si no hay coincidencias exactas
    if (scoredVertices.length === 0) {
      return {
        query,
        matchedKeywords: keywords,
        totalHops: 0,
        flowSteps: [],
        asciiDiagram: '(No se encontraron nodos directamente relacionados con la consulta)',
        estimatedTokens: 90,
        collateralRisk: 'LOW',
        blastRadiusExplanation: 'No hay impacto arquitectónico detectado.',
        directAnswerForAI: `La consulta no intersecta directamente con símbolos o archivos indexados. Palabras clave buscadas: [${keywords.join(', ')}].`,
      };
    }

    // 3. Encontrar la ruta más corta entre los 2 vértices más relevantes (Origen y Destino)
    const topCandidates = scoredVertices.slice(0, 4).map(s => s.vertex);
    let chosenPath: HyperVertex[] = [];

    if (topCandidates.length >= 2) {
      const source = topCandidates[0];
      const target = topCandidates[1];
      const bfsPath = FlowTracer.findShortestPath(source, target, idMap);
      if (bfsPath.length > 0) {
        chosenPath = bfsPath;
      } else {
        const reversePath = FlowTracer.findShortestPath(target, source, idMap);
        if (reversePath.length > 0) {
          chosenPath = reversePath;
        } else {
          chosenPath = topCandidates.slice(0, 3);
        }
      }
    } else {
      chosenPath = [topCandidates[0]];
    }

    // 4. Construir los pasos del flujo con métricas y alertas
    let maxDependents = 0;
    const flowSteps: FlowStep[] = [];

    for (let i = 0; i < chosenPath.length; i++) {
      const v = chosenPath[i];
      const depCount = v.dependents.length;
      if (depCount > maxDependents) maxDependents = depCount;

      const fracturesOnNode = fractureMap.get(v.id) || [];
      const matched = keywords.filter(kw => 
        (v.id + ' ' + v.symbols.map(s => s.name).join(' ')).toLowerCase().includes(kw)
      );

      flowSteps.push({
        index: i + 1,
        vertexId: v.id,
        path: v.path,
        cell: v.cell,
        matchedKeywords: matched,
        keySymbols: v.symbols.slice(0, 5).map(s => ({
          name: s.name,
          kind: s.kind,
          signature: s.signature,
          lineStart: s.lineStart,
        })),
        downstreamDependentsCount: depCount,
        hasFracture: fracturesOnNode.length > 0,
        fractureSummary: fracturesOnNode.length > 0 
          ? `${fracturesOnNode.length} fractura(s): ${fracturesOnNode[0].description}`
          : undefined,
      });
    }

    // 5. Nivel de riesgo colateral
    let collateralRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (maxDependents > 25) collateralRisk = 'CRITICAL';
    else if (maxDependents > 10) collateralRisk = 'HIGH';
    else if (maxDependents > 3) collateralRisk = 'MEDIUM';

    // 6. Generar diagrama ASCII compacto
    const asciiLines: string[] = ['=== FLUJO TOPOLÓGICO 4D (GEODÉSICA EN R^4) ==='];
    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      const symList = step.keySymbols.map(s => `${s.name}()`).slice(0, 3).join(', ');
      const warn = step.hasFracture ? ' ⚠️ [FRACTURA PREVIA]' : '';
      asciiLines.push(`[${step.index}] ${step.vertexId} (${step.cell})${warn}`);
      if (symList) asciiLines.push(`    └─ Símbolos: ${symList} | Llamadores: ${step.downstreamDependentsCount}`);
      if (i < flowSteps.length - 1) {
        asciiLines.push(`         │`);
        asciiLines.push(`         ▼ (depende / importa)`);
      }
    }

    const blastExplanation = collateralRisk === 'CRITICAL' || collateralRisk === 'HIGH'
      ? `PELIGRO: El nodo central tiene ${maxDependents} archivos dependientes aguas abajo. Cualquier mutación no simétrica causará fracturas masivas en cascada.`
      : `IMPACTO MODERADO: La cadena tiene un radio de daño controlado (${maxDependents} dependientes directos).`;

    const estimatedTokens = Math.min(650, 150 + flowSteps.length * 60);

    const directAnswer = `El flujo arquitectónico para "${query}" recorre ${flowSteps.length} nodos desde '${flowSteps[0].vertexId}' hasta '${flowSteps[flowSteps.length - 1].vertexId}'. Riesgo de regresión aguas abajo: ${collateralRisk} (${maxDependents} dependientes directos).`;

    return {
      query,
      matchedKeywords: keywords,
      sourceFile: flowSteps[0]?.vertexId,
      targetFile: flowSteps[flowSteps.length - 1]?.vertexId,
      totalHops: flowSteps.length,
      flowSteps,
      asciiDiagram: asciiLines.join('\n'),
      estimatedTokens,
      collateralRisk,
      blastRadiusExplanation: blastExplanation,
      directAnswerForAI: directAnswer,
    };
  }

  /**
   * Búsqueda en anchura (BFS) sobre el grafo de dependencias de AST
   */
  private static findShortestPath(
    start: HyperVertex,
    target: HyperVertex,
    idMap: Map<string, HyperVertex>,
    maxHops: number = 6
  ): HyperVertex[] {
    if (start.id === target.id) return [start];

    const queue: Array<{ vertex: HyperVertex; path: HyperVertex[] }> = [
      { vertex: start, path: [start] }
    ];
    const visited = new Set<string>([start.id]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length > maxHops) continue;

      // 1. Explorar dependencias salientes (imports)
      for (const depSpecifier of current.vertex.dependencies) {
        const cleanDep = depSpecifier.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/\.js$/, '').replace(/\.ts$/, '');
        for (const [id, v] of idMap.entries()) {
          if (!visited.has(id)) {
            const cleanId = id.replace(/\.js$/, '').replace(/\.ts$/, '');
            const matches = cleanId.endsWith(cleanDep) || 
                            cleanDep.endsWith(cleanId) ||
                            cleanId.includes(cleanDep) ||
                            cleanDep.includes(cleanId);
            if (matches) {
              visited.add(id);
              const newPath = [...current.path, v];
              if (id === target.id) {
                return newPath;
              }
              queue.push({ vertex: v, path: newPath });
            }
          }
        }
      }

      // 2. Explorar dependencias entrantes (llamadores que dependen de este nodo)
      for (const depId of current.vertex.dependents) {
        for (const [id, v] of idMap.entries()) {
          if (!visited.has(id)) {
            if (id === depId || id.endsWith(depId) || depId.endsWith(id)) {
              visited.add(id);
              const newPath = [...current.path, v];
              if (id === target.id) {
                return newPath;
              }
              queue.push({ vertex: v, path: newPath });
            }
          }
        }
      }
    }

    return [];
  }
}
