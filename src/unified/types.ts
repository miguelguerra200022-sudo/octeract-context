/**
 * OCTERACT UNIFIED FACADE: Tipos y Estructuras de Datos
 * Las 4 Grandes Aperturas Maestras + Motor Semántico de Preguntas
 */
export const UNIFIED_FACADE_VERSION = '4.8.0';

export interface OcteractDoctorReport {
  healthScore: number; // 0 a 100
  verdict: 'PRISTINE' | 'STABLE' | 'DEGRADED' | 'CRITICAL_COLLAPSE';
  totalFiles: number;
  totalSymbols: number;
  fracturesCount: number;
  boundaryLeaksCount: number;
  fractures: Array<{
    id: string;
    file: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    line?: number;
  }>;
  boundaryLeaks: Array<{
    fromQuadrant: string;
    toQuadrant: string;
    fromFile: string;
    toFile: string;
    reason: string;
  }>;
  dominantBiomes: Array<{
    biome: string;
    filesCount: number;
    description: string;
  }>;
  targetArmorStatus: {
    ledgerEntries: number;
    intactTargets: number;
    driftDetected: boolean;
  };
  sieveSummary?: string;
  topRecommendations: string[];
  summaryMarkdown: string;
}

export interface OcteractSeeOptions {
  rootDir?: string;
  symbol?: string;
  mode?: 'origami' | 'skeleton' | 'full' | 'eva' | 'sieve';
  budget?: number; // Límite de tokens sugerido (default: 200)
}

export interface OcteractSeeResult {
  filePath: string;
  symbol?: string;
  mode: 'origami' | 'skeleton' | 'full' | 'eva' | 'sieve';
  lineCount: number;
  originalTokensApprox: number;
  compressedTokensApprox: number;
  compressionSavingsPercent: number;
  content: string;
  sieveSummary?: string;
  valleyFoldsCount?: number;
  mountainFoldsCount?: number;
}

export interface OcteractImpactOptions {
  rootDir?: string;
  symbol?: string;
  maxHops?: number;
  energy?: number;
}

export interface OcteractImpactReport {
  epicenter: {
    file: string;
    symbol?: string;
  };
  impactScore: number; // 0 a 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';
  totalAffectedNodes: number;
  tier1DirectDependents: Array<{
    file: string;
    symbol: string;
    reason: string;
  }>;
  tier2Downstream: Array<{
    file: string;
    symbol: string;
    distance: number;
  }>;
  safeRefactorOrder: string[];
  summaryMarkdown: string;
}

export interface OcteractSafeWriteOptions {
  rootDir?: string;
  force?: boolean;
}

export interface OcteractSafeWriteResult {
  status: 'WRITTEN_SAFELY' | 'BLOCKED_BY_4D_SHIELD';
  targetFile: string;
  shearDistance: number;
  creaseStressScore: number;
  fracturesPrevented: number;
  message: string;
  details?: {
    contractViolations?: string[];
    fragileCreases?: string[];
    shadowTrialPass?: boolean;
  };
}

export interface OcteractAskOptions {
  rootDir?: string;
  maxResults?: number;
  terse?: boolean; // Modo telegráfico Zero-Slop (default: true)
}

export interface OcteractAskResult {
  query: string;
  answer: string;
  relevantFiles: Array<{
    path: string;
    score: number;
    lines?: number[];
    snippet?: string;
  }>;
  keySymbols: string[];
  suggestedAction?: string;
}
