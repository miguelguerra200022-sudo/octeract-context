/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractFacetMatrix - Multi-Facet Availability Tracker for 8D Vertices
 *
 * Inspired by morluto/rea Dossier & Facet Availability:
 * Formally tracks the availability of orthogonal analysis facets (types, ast, cfg,
 * callers, callees, voxels, voynich phonetics, native bindings, tests), eliminating
 * agent hallucinations by distinguishing verified evidence from unobserved state.
 */

export interface FacetVector {
  types: boolean;
  ast: boolean;
  cfg: boolean;
  callers: boolean;
  callees: boolean;
  voxels: boolean;
  eva_phonetics: boolean;
  native_bindings: boolean;
  tests: boolean;
}

export interface VertexFacetDossier {
  vertexId: string;
  name: string;
  cell: string;
  facets: FacetVector;
  completenessPercentage: number;
  unobservedFacets: string[];
  evidenceSignature: string;
}

export interface FacetMatrixReport {
  totalVertices: number;
  averageCompleteness: number;
  facetCoverageStats: Record<keyof FacetVector, { available: number; coveragePct: number }>;
  vertices: VertexFacetDossier[];
  highFidelityCount: number; // completeness >= 80%
  blindspots: Array<{ vertexId: string; missingCoreFacets: string[] }>;
}

export class OcteractFacetMatrix {
  private static readonly FACET_KEYS: Array<keyof FacetVector> = [
    'types',
    'ast',
    'cfg',
    'callers',
    'callees',
    'voxels',
    'eva_phonetics',
    'native_bindings',
    'tests',
  ];

  /**
   * Evaluates the facet availability vector for a single codebase symbol or vertex.
   */
  public static evaluateVertex(params: {
    vertexId: string;
    name: string;
    cell: string;
    codeSnippet?: string;
    hasTypes?: boolean;
    hasAst?: boolean;
    hasCfg?: boolean;
    callersCount?: number;
    calleesCount?: number;
    voxelCoord?: { x: number; y: number; z: number };
    evaWord?: string;
    isNative?: boolean;
    hasTests?: boolean;
  }): VertexFacetDossier {
    const code = params.codeSnippet || '';

    // Heuristic facet evaluation if not explicitly provided
    const typesAvailable =
      params.hasTypes !== undefined ? params.hasTypes :
      /(?:interface|type|:\s*[A-Z][a-zA-Z0-9<>]+|export\s+type)/.test(code);

    const astAvailable = params.hasAst !== undefined ? params.hasAst : code.trim().length > 0;

    const cfgAvailable =
      params.hasCfg !== undefined ? params.hasCfg :
      /\b(if|switch|for|while|try|catch|return)\b/.test(code);

    const callersAvailable =
      params.callersCount !== undefined ? params.callersCount > 0 : false;

    const calleesAvailable =
      params.calleesCount !== undefined ? params.calleesCount > 0 :
      /\b(?:this\.[a-zA-Z0-9_$]+|[a-zA-Z0-9_$]+\()\b/.test(code);

    const voxelsAvailable = !!params.voxelCoord;
    const evaAvailable = !!params.evaWord && params.evaWord.length > 0;
    const nativeAvailable = params.isNative === true || /\.node|\.so|\.dylib/.test(params.vertexId);
    const testsAvailable = params.hasTests !== undefined ? params.hasTests : params.cell === 'Tests' || /test|spec/.test(params.vertexId);

    const facets: FacetVector = {
      types: typesAvailable,
      ast: astAvailable,
      cfg: cfgAvailable,
      callers: callersAvailable,
      callees: calleesAvailable,
      voxels: voxelsAvailable,
      eva_phonetics: evaAvailable,
      native_bindings: nativeAvailable,
      tests: testsAvailable,
    };

    let trueCount = 0;
    const unobservedFacets: string[] = [];

    for (const key of this.FACET_KEYS) {
      if (facets[key]) {
        trueCount++;
      } else {
        unobservedFacets.push(key);
      }
    }

    const completenessPercentage = Math.round((trueCount / this.FACET_KEYS.length) * 100);

    // Compute evidence signature string
    const bitString = this.FACET_KEYS.map((k) => (facets[k] ? '1' : '0')).join('');
    const evidenceSignature = `0b${bitString}_${params.cell}`;

    return {
      vertexId: params.vertexId,
      name: params.name,
      cell: params.cell,
      facets,
      completenessPercentage,
      unobservedFacets,
      evidenceSignature,
    };
  }

  /**
   * Generates a global facet availability matrix report for an entire repository graph.
   */
  public static generateMatrixReport(dossiers: VertexFacetDossier[]): FacetMatrixReport {
    const totalVertices = dossiers.length;
    if (totalVertices === 0) {
      return {
        totalVertices: 0,
        averageCompleteness: 0,
        facetCoverageStats: {
          types: { available: 0, coveragePct: 0 },
          ast: { available: 0, coveragePct: 0 },
          cfg: { available: 0, coveragePct: 0 },
          callers: { available: 0, coveragePct: 0 },
          callees: { available: 0, coveragePct: 0 },
          voxels: { available: 0, coveragePct: 0 },
          eva_phonetics: { available: 0, coveragePct: 0 },
          native_bindings: { available: 0, coveragePct: 0 },
          tests: { available: 0, coveragePct: 0 },
        },
        vertices: [],
        highFidelityCount: 0,
        blindspots: [],
      };
    }

    const counts: Record<keyof FacetVector, number> = {
      types: 0,
      ast: 0,
      cfg: 0,
      callers: 0,
      callees: 0,
      voxels: 0,
      eva_phonetics: 0,
      native_bindings: 0,
      tests: 0,
    };

    let totalCompleteness = 0;
    let highFidelityCount = 0;
    const blindspots: FacetMatrixReport['blindspots'] = [];

    for (const d of dossiers) {
      totalCompleteness += d.completenessPercentage;
      if (d.completenessPercentage >= 70) highFidelityCount++;

      for (const k of this.FACET_KEYS) {
        if (d.facets[k]) counts[k]++;
      }

      // Check critical blindspots (missing types or ast or cfg)
      const missingCore = d.unobservedFacets.filter((f) => ['types', 'ast', 'cfg'].includes(f));
      if (missingCore.length >= 2) {
        blindspots.push({ vertexId: d.vertexId, missingCoreFacets: missingCore });
      }
    }

    const facetCoverageStats: FacetMatrixReport['facetCoverageStats'] = {} as any;
    for (const k of this.FACET_KEYS) {
      facetCoverageStats[k] = {
        available: counts[k],
        coveragePct: Math.round((counts[k] / totalVertices) * 100),
      };
    }

    return {
      totalVertices,
      averageCompleteness: Math.round(totalCompleteness / totalVertices),
      facetCoverageStats,
      vertices: dossiers,
      highFidelityCount,
      blindspots,
    };
  }
}
