/**
 * TESSERACT-CONTEXT: Definiciones de Tipos Matemáticos y Topológicos 4D
 * Fundamentos para el Teseracto Fractal y Hexadec-Tree
 */

/** Coordenada continua en el espacio hiperdimensional R^4, acotada en [0, 1] */
export type Point4D = [x: number, y: number, z: number, w: number];

/** Los 4 ejes ortogonales fundamentales */
export type Axis4D = 'X' | 'Y' | 'Z' | 'W';

/** Los 6 planos ortogonales de rotación en 4D */
export type RotationPlane = 'XY' | 'XZ' | 'XW' | 'YZ' | 'YW' | 'ZW';

/** Las 8 celdas cúbicas (subespacios 3D) que componen el teseracto */
export const CubicCell = {
  CoreLogic: 'CoreLogic',
  Types: 'Types',
  Storage: 'Storage',
  Network: 'Network',
  Tests: 'Tests',
  Config: 'Config',
  Security: 'Security',
  Telemetry: 'Telemetry',
} as const;
export type CubicCell = (typeof CubicCell)[keyof typeof CubicCell];

/** Representación de un símbolo de software extraído del AST */
export interface HyperSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'import' | 'export' | 'test';
  lineStart: number;
  lineEnd: number;
  signature?: string;
  docstring?: string;
  dependencies: string[];
  isExported?: boolean;
}

/** Vértice del hipercubo: representa un archivo o módulo con coordenadas 4D */
export interface HyperVertex {
  id: string;                      // Identificador único (ruta relativa normalizada)
  hexCode: string;                 // Código jerárquico en el Hexadec-Tree (ej. "0xA4F2")
  path: string;                    // Ruta relativa del archivo
  cell: CubicCell;                 // Celda cúbica asignada
  coordinate: Point4D;             // Coordenada continua (x: sintaxis, y: semántica, z: contratos, w: volatilidad)
  lines: number;                   // Líneas de código
  sizeBytes: number;               // Tamaño en bytes
  tokenEstimate: number;           // Estimación aproximada de tokens
  symbols: HyperSymbol[];          // Símbolos sintácticos
  dependencies: string[];          // Archivos o módulos que importa
  dependents: string[];            // Archivos que dependen de este
  inDegree?: number;               // Grado de entrada en el grafo dirigido
  outDegree?: number;              // Grado de salida en el grafo dirigido
  lastModified: number;            // Marca de tiempo de última modificación
  latticeVector?: LatticeVector;   // Coordenada Z^4 en el panal {4,3,3,4}
  windingVector?: WindingVector;   // Número de vueltas homológico en T^4
}

/** Arista que conecta dos vértices a través de una relación topológica */
export interface HyperEdge {
  source: string;                  // ID del vértice origen
  target: string;                  // ID del vértice destino
  axis: Axis4D;                    // Eje principal de propagación
  weight: number;                  // Fuerza del enlace [0, 1]
  type: 'import' | 'semantic' | 'contract' | 'temporal';
  distance4D: number;              // Distancia euclidiana en R^4
  hammingDistance: number;         // Distancia de Hamming discreta [0, 4]
}

/** Nodo en el Árbol Hexadec-Tree (Teseracto Fractal) */
export interface HexadecNode {
  nibble: number;                  // Dígito hexadecimal del nodo (0 a 15)
  depth: number;                   // Nivel de profundidad fractal (0 = raíz)
  hexPrefix: string;               // Prefijo de dirección completo (ej. "0x3F")
  children: Array<HexadecNode | null>; // 16 ramas hijas ortogonales
  vertexIds: string[];             // Vértices asociados a esta celda
  aggregate: {
    totalTokens: number;
    totalFiles: number;
    cellCounts: Record<CubicCell, number>;
  };
}

/** Solicitud de corte hiperdimensional (Slice) */
export interface SliceRequest {
  cell?: CubicCell;                // Filtrar por celda cúbica específica
  focusSymbol?: string;            // Símbolo o archivo sobre el que pivota el corte
  centerHex?: string;              // Coordenada hexadecimal de referencia
  maxDistance?: number;            // Distancia máxima de vecindad
  axisFocus?: Axis4D;              // Eje prioritario de proyección
  tokenBudget?: number;            // Presupuesto estricto de tokens (default: 2000)
  mode?: 'full' | 'skeleton';      // Modo de entrega: 'full' o 'skeleton' (SWE-bench 85% de compresión)
}

/** Resultado de un corte hiperdimensional quirúrgico */
export interface SliceResult {
  vertices: HyperVertex[];
  totalTokens: number;
  projectedCode: string;
  summary: string;
  activeCells: CubicCell[];
  compressionRatio: number;        // Porcentaje de reducción frente al archivo completo
}

/** Proyección de impacto / Sombra para predicción de errores antes de escribir */
export interface ShadowProjection {
  targetPath: string;
  stateVector4D: Point4D;          // Vector de conformidad S = [x, y, z, w] in [0, 1]^4
  shearVector: Point4D;            // Desviación por eje (dx, dy, dz, dw) = [1-x, 1-y, 1-z, 1-w]
  shearDistance: number;           // Distancia euclidiana en R^4: sqrt(sum((1-v_i)^2))
  isSafe: boolean;                 // Verdadero si D_shear <= 0.75 y no hay violaciones críticas
  axes: {
    xSyntax: { passed: boolean; score: number; issues: string[]; isTruncated?: boolean };
    yContracts: { passed: boolean; score: number; issues: string[]; brokenEdges: HyperEdge[] };
    zRuntime: { passed: boolean; score: number; issues: string[]; executionTimeout?: boolean };
    wSecurity: { passed: boolean; score: number; issues: string[]; leakedSecrets?: string[]; hallucinatedPackages?: string[] };
  };
  brokenEdges: HyperEdge[];        // Aristas que se romperían
  affectedCells: CubicCell[];      // Celdas impactadas
  synthesizedPatch?: string;       // Parche retrocompatible sintetizado automáticamente
  recommendations: string[];       // Acciones para preservar la simetría 4D
}

/** Nodo en el árbol causal de la ola de propagación del efecto dominó */
export interface DominoWaveNode {
  file: string;
  taintedSymbol: string;
  hop: number;
  cell: CubicCell;
  causalParentFile?: string;
  causalParentSymbol?: string;
  importerLineNumber?: number;
  importerLineSnippet?: string;
  isTerminalSink?: boolean;
}

/** Punto terminal de colapso donde el usuario o el runtime sufre el impacto directo */
export interface TerminalSink {
  file: string;
  symbol: string;
  hop: number;
  cell: CubicCell;
  reason: string;
}

/** Nodo en el cálculo del radio de explosión (Blast Radius) */
export interface BlastRadiusNode {
  file: string;
  hop: number;
  cell: CubicCell;
  symbolsAffected: string[];
  causalParentFile?: string;
  causalParentSymbol?: string;
  importerLineNumber?: number;
  importerLineSnippet?: string;
  isTerminalSink?: boolean;
}

/** Resultado del análisis de Radio de Explosión Interprocedural */
export interface BlastRadiusResult {
  targetFile: string;
  targetSymbol?: string;
  maxHops: number;
  maxHopsReached: number;
  totalAffectedFiles: number;
  totalStructuralDependents: number;
  totalTrueFractures: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hops: Record<number, BlastRadiusNode[]>;
  affectedCellsDistribution: Record<CubicCell, number>;
  taintWaveTree: DominoWaveNode[];
  terminalSinks: TerminalSink[];
  criticalPath: string[];
  summaryPromptForAI: string;
  richDossierForAI: string;
  synthesizedPatch?: string;
}

/** Estadísticas de salud arquitectónica del hipercubo */
export interface HyperStats {
  totalVertices: number;
  totalEdges: number;
  totalTokens: number;
  hexadecDepth: number;
  cellDistribution: Record<CubicCell, number>;
  dimensionalCurvature: number;    // Índice de dispersión dimensional [0, 1]
  couplingIndex: number;           // Nivel de acoplamiento espagueti
  healthStatus: 'OPTIMAL' | 'MODERATE_TENSION' | 'HIGH_SHEAR_RISK';
}

/** Tipos de fracturas arquitectónicas detectables de forma determinista sin IA */
export type FractureType =
  | 'BROKEN_IMPORT'
  | 'CONTRACT_MISMATCH'
  | 'CIRCULAR_DEPENDENCY'
  | 'ORPHAN_NODE'
  | 'TOPOLOGICAL_SINK'
  | 'UNMATCHED_EVENT'
  | 'UNREACHABLE_ISLAND'
  | 'DEAD_CODE'
  | 'FLOATING_PROMISE'
  | 'DEAD_EXPORT'
  | 'BOUNDARY_VIOLATION'
  | 'HALLUCINATED_DEPENDENCY'
  | 'SECRET_LEAK'
  | 'TRUNCATED_FILE'
  | 'BIN_EXEC_FRACTURE'
  | 'PACKAGING_EXPORT_FRACTURE'
  | 'CI_WORKFLOW_FRACTURE'
  | 'DEPENDENCY_LEAK_FRACTURE'
  | 'CASE_SENSITIVITY_FRACTURE'
  | 'RELEASE_SYNC_FRACTURE'
  | 'SEMANTIC_RACE_FRACTURE'
  | 'MUTATION_RESILIENCE_FRACTURE'
  | 'ATOMIC_TRANSFORMATION_FRACTURE';

/** Representación de una fractura topológica en el hipercubo */
export interface TopologicalFracture {
  id: string;
  type: FractureType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;                    // Archivo donde se origina o detecta el fallo
  target?: string;                   // Archivo de destino en conflicto
  missingSymbol?: string;            // Símbolo importado no encontrado
  availableExports?: string[];       // Símbolos reales exportados por el destino
  similarCandidate?: string;         // Sugerencia de autocuración por similitud
  importerLine?: string;             // Línea exacta del código donde ocurre el error
  importerLineNumber?: number;       // Número de línea en el archivo origen
  cyclePath?: string[];              // En caso de ciclo: [A -> B -> C -> A]
  eventName?: string;                // Nombre del evento pub/sub huérfano o sin escucha
  unreachableClusterSize?: number;   // Cantidad de archivos en el subgrafo isla aislado
  sinkDetails?: string;              // Diagnóstico específico del callejón sin salida / sumidero
  synthesizedPatch?: string;         // Código TypeScript auto-sintetizado para resolver la fractura
  symbolName?: string;               // Nombre del símbolo (para DEAD_EXPORT o FLOATING_PROMISE)
  cellViolation?: { fromCell: CubicCell; toCell: CubicCell }; // Violación de frontera dimensional
  entropyScore?: number;             // Puntuación de entropía de Shannon (para SECRET_LEAK)
  description: string;               // Explicación técnica comprensible
  rippleImpact: number;              // Cantidad de dependientes afectados
  affectedDependents: string[];      // Lista de archivos impactados
  healingStrategy: string;           // Estrategia de reparación no destructiva recomendada
}

/** Informe de Auditoría Topológica de Código Existente */
export interface AuditReport {
  timestamp: number;
  totalFilesAudited: number;
  healthScore: number;               // 0 a 100 (100 = simetría perfecta)
  totalFractures: number;
  fracturesByType: Record<FractureType, number>;
  fractures: TopologicalFracture[];
  status: 'PERFECT_SYMMETRY' | 'MINOR_FRACTURES' | 'CRITICAL_SHEAR';
  architecturalLoops?: ArchitecturalLoop[];
  topologyMode?: TopologyMode;
}

/** Resultado de una prueba de autocuración transaccional en memoria RAM */
export interface HealTrialResult {
  targetFile: string;
  proposedPatch: string;
  trialStatus: 'APROBADO_SIN_REGRESIONES' | 'BLOQUEADO_POR_REGRESIONES' | 'ERROR_SINTAXIS_O_RUNTIME';
  isSafeToCommit: boolean;
  preHealthScore: number;
  postHealthScore: number;
  healthDelta: number;
  preTotalFractures: number;
  postTotalFractures: number;
  extinguishedCount: number;
  regressionCount: number;
  extinguishedFractures: Array<{ id: string; type: FractureType; source: string; description: string }>;
  newRegressions: Array<{ id: string; type: FractureType; source: string; description: string; collisionReason?: string }>;
  rollbackExecuted: boolean;
  trialExecutionTimeMs: number;
  summaryPromptForAI: string;
  richDossierForAI: string;
}

/** Resultado de una autocuración autónoma completa (Modo Mini-Subagente) */
export interface AutoHealResult {
  fractureId: string;
  targetFile: string;
  synthesizedPatch: string;
  trial: HealTrialResult;
  committedToDisk: boolean;
  message: string;
}

/** Modo topológico de la variedad hiperdimensional */
export type TopologyMode = 'bounded' | 'torus' | 'honeycomb';

/** Coordenada de celda en el Panal Teseráctico {4,3,3,4} (espacio Z^4) */
export type LatticeVector = [number, number, number, number];

/** Vector de vueltas homológico en el 4-Toro (pi_1(T^4) ~= Z^4) */
export type WindingVector = [number, number, number, number];

/** Faceta cúbica 3D compartida entre dos teseractos adyacentes en el panal {4,3,3,4} */
export interface FacetManifold {
  facetId: string;
  packageA: string;
  packageB: string;
  axis: Axis4D;
  boundaryCoordinate: number;
  sharedSymbols: string[];
}

/** Ciclo arquitectónico clasificado en el 4-Toro */
export interface ArchitecturalLoop {
  cycle: string[];
  windingVector: WindingVector;
  classification: 'CONTRACTIBLE_BUG' | 'VALID_ARCHITECTURAL_LOOP';
  description?: string;
}

/** Registro de intención de un agente concurrente en el enjambre */
export interface AgentSwarmIntent {
  agentId: string;
  taskDescription: string;
  targetFiles: string[];
  targetSymbols?: string[];
  branchName?: string;
  priority?: number;
}

/** Zona de Voronoi asignada a un agente en el hipercubo 4D */
export interface VoronoiZone {
  agentId: string;
  centerCoordinate: Point4D;
  hyperRadius: number;
  ownedFiles: string[];
  influenceBoundaryFiles: string[];
  status: 'ISOLATED_LOCK_FREE' | 'POTENTIAL_COLLISION' | 'SEMANTIC_DEADLOCK_RISK';
}

/** Reporte de colisión y coordinación de agentes en el enjambre */
export interface SwarmCoordinationReport {
  timestamp: number;
  totalAgents: number;
  lockFreeAgentsCount: number;
  collidingPairsCount: number;
  zones: VoronoiZone[];
  collisions: {
    agentA: string;
    agentB: string;
    overlapFiles: string[];
    sharedContracts: string[];
    precedenceWinner: string;
    recommendedSyncFacade?: string;
  }[];
  deadlockCycles: string[][];
  verdict: 'ALL_CLEAR_PARALLEL' | 'SYNCHRONIZATION_REQUIRED' | 'DEADLOCK_PREVENTED';
}

/** Operadores AST de mutación contrafactual en RAM */
export type MutationOperator =
  | 'RELATIONAL_INVERSION'     // > <-> <=, === <-> !==
  | 'ARITHMETIC_MUTATION'      // + <-> -, * <-> /
  | 'CONDITIONAL_NEGATION'     // if (x) <-> if (!x)
  | 'RETURN_MUTATION'          // return val <-> return null / false
  | 'STATEMENT_DELETION';      // omite llamadas void

/** Descriptor de un mutante individual evaluado */
export interface MutantDescriptor {
  id: string;
  file: string;
  operator: MutationOperator;
  lineNumber: number;
  originalSnippet: string;
  mutatedSnippet: string;
  status: 'KILLED' | 'SURVIVED' | 'TIMEOUT';
  detectedByTest?: string;
}

/** Reporte de dureza y resiliencia de la suite de pruebas contra mutantes */
export interface MutationFuzzReport {
  targetFile: string;
  totalMutantsGenerated: number;
  mutantsKilled: number;
  mutantsSurvived: number;
  mutationScorePercent: number;    // (killed / total) * 100
  hardnessVerdict: 'RESILIENT_SUITE' | 'MODERATE_COVERAGE' | 'BRITTLE_TAUTOLOGICAL_TESTS';
  hollowAssertionLines: number[];
  recommendation: string;
  mutants: MutantDescriptor[];
}

/** Receta de un paso individual en una transmutación atómica multiarchivo */
export interface TransmutationStep {
  file: string;
  lineNumber: number;
  oldCode: string;
  newCode: string;
  rationale: string;
}

/** Reporte de transmutación atómica de subgrafo cerrado */
export interface TransmutationReport {
  rootFile: string;
  rootSymbol: string;
  newSignature: string;
  closedSubgraphFiles: string[];
  totalCallSites: number;
  steps: TransmutationStep[];
  atomicPatchSnippet: string;
  predictedShearDistance: number;
  isComplete: boolean;
  verdict: 'ATOMIC_RECIPE_READY' | 'PARTIAL_COLLAPSE_DETECTED';
}

