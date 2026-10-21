/**
 * OCTERACT-DEEPMIND SUITE: Módulos de Frontera Neuro-Simbólica
 * Integra los paradigmas más avanzados de Google DeepMind:
 * 1. FunSearch: Búsqueda evolutiva en espacio de funciones con modelo de islas
 * 2. AlphaGeometry: Deductive Database con cláusulas de Horn y construcciones auxiliares
 * 3. AlphaDev: Optimizador de micro-patrones asintóticos en el AST
 * 4. Pairformer: Tensor relacional N x N con invarianza triangular (AlphaFold 3)
 * 5. Process Reward Models (PRMs): Verificación atómica paso a paso
 */

export {
  OcteractFunSearchEngine,
  type ProgramCandidate,
  type Island,
  type FunSearchSpecification,
  type FunSearchReport,
} from './funsearch.ts';

export {
  OcteractDeductiveEngine,
  type HornFact,
  type HornRule,
  type AuxiliaryConstruction,
  type DeductiveAuditReport,
} from './deductive.ts';

export {
  OcteractAlphaDevOptimizer,
  type AlphaDevTransformation,
  type AlphaDevOptimizationResult,
} from './alphadev.ts';

export {
  OcteractPairformer,
  type PairwiseRelation,
  type TriangularInvarianceViolation,
  type PairformerReport,
} from './pairformer.ts';

export {
  OcteractStepVerifier,
  type StepEvaluation,
  type StepVerificationReport,
} from './prm.ts';
