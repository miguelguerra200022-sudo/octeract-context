/**
 * OCTERACT-DEEPMIND: Motor Deductivo Simbólico con Cláusulas de Horn (AlphaGeometry DD+AR)
 * Inspirado en Google DeepMind AlphaGeometry (Nature 2024):
 * Razonamiento deductivo determinista forward-chaining a 0 tokens en RAM.
 * Si la deducción se detiene por ambigüedad o falta de puentes, solicita
 * una "Construcción Auxiliar" (Auxiliary Construction) al LLM.
 */

import { HypercubeSpace } from '../core/hypercube.ts';
import { type HyperVertex } from '../core/types.ts';

export type PredicateType =
  | 'EXPORTS'
  | 'IMPORTS'
  | 'CALLS'
  | 'IMPLEMENTS'
  | 'DEPENDS'
  | 'BROKEN_CONTRACT'
  | 'DEADLOCK_CYCLE'
  | 'TOPOLOGICAL_SINK'
  | 'ZOMBIE_ISLAND';

export interface HornFact {
  predicate: PredicateType;
  args: string[];
  confidence: number;
}

export interface HornRule {
  id: string;
  name: string;
  description: string;
  evaluate: (facts: HornFact[], index: FactIndex) => HornFact[];
}

export interface AuxiliaryConstruction {
  type: 'ADAPTER_FACADE' | 'INTERFACE_STUB' | 'TYPE_OVERLOAD' | 'DEPENDENCY_INVERSION';
  sourceFile: string;
  targetSymbol: string;
  rationale: string;
  suggestedSignature: string;
}

export interface DeductiveAuditReport {
  totalFacts: number;
  iterationsToFixpoint: number;
  newDeductions: HornFact[];
  brokenContracts: HornFact[];
  deadlocks: HornFact[];
  auxiliaryConstructions: AuxiliaryConstruction[];
  isSymmetric: boolean;
}

class FactIndex {
  private byPredicate: Map<PredicateType, HornFact[]> = new Map();
  private keySet: Set<string> = new Set();

  public add(fact: HornFact): boolean {
    const key = fact.predicate + '::' + fact.args.join('::');
    if (this.keySet.has(key)) return false;
    this.keySet.add(key);

    const list = this.byPredicate.get(fact.predicate) || [];
    list.push(fact);
    this.byPredicate.set(fact.predicate, list);
    return true;
  }

  public get(pred: PredicateType): HornFact[] {
    return this.byPredicate.get(pred) || [];
  }

  public getAll(): HornFact[] {
    const all: HornFact[] = [];
    for (const list of this.byPredicate.values()) {
      all.push(...list);
    }
    return all;
  }

  public count(): number {
    return this.keySet.size;
  }
}

export class OcteractDeductiveEngine {
  private rootDir: string;
  private rules: HornRule[] = [];

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.initHornRules();
  }

  private initHornRules(): void {
    // Regla 1: Imports(A, B, S) ∧ ¬Exports(B, S) → BrokenContract(A, B, S)
    this.rules.push({
      id: 'RULE_BROKEN_CONTRACT',
      name: 'Detección de Contratos Rotos por Deducción Directa',
      description: 'Si un archivo A importa un símbolo S de B, pero B no lo exporta, existe rotura de contrato.',
      evaluate: (facts, index) => {
        const derived: HornFact[] = [];
        const imports = index.get('IMPORTS');
        const exports = index.get('EXPORTS');

        const exportMap = new Set<string>();
        for (const exp of exports) {
          exportMap.add(exp.args[0] + '::' + exp.args[1]); // targetFile::symbol
        }

        for (const imp of imports) {
          const targetFile = imp.args[1];
          const sym = imp.args[2];
          if (!exportMap.has(targetFile + '::' + sym)) {
            derived.push({
              predicate: 'BROKEN_CONTRACT',
              args: [imp.args[0], targetFile, sym],
              confidence: 1.0,
            });
          }
        }
        return derived;
      },
    });

    // Regla 2: Depends(A, B) ∧ Depends(B, A) → DeadlockCycle([A, B])
    this.rules.push({
      id: 'RULE_DEADLOCK_CYCLE',
      name: 'Ciclos de Dependencia Mutua',
      description: 'Si A depende de B y B depende de A, se deduce ciclo o deadlock topológico.',
      evaluate: (facts, index) => {
        const derived: HornFact[] = [];
        const depends = index.get('DEPENDS');
        const depPairs = new Set<string>();

        for (const d of depends) {
          depPairs.add(d.args[0] + '->' + d.args[1]);
        }

        for (const d of depends) {
          const a = d.args[0];
          const b = d.args[1];
          if (a !== b && depPairs.has(b + '->' + a) && a < b) {
            derived.push({
              predicate: 'DEADLOCK_CYCLE',
              args: [a, b],
              confidence: 1.0,
            });
          }
        }
        return derived;
      },
    });

    // Regla 3: IsSink(A) ∧ Calls(A, S) ∧ ¬Depends(A, *) → TopologicalSink(A)
    this.rules.push({
      id: 'RULE_TOPOLOGICAL_SINK',
      name: 'Sumideros Topológicos Aislados',
      description: 'Nodos que reciben llamadas pero no tienen salidas ni dependencias resolubles.',
      evaluate: (facts, index) => {
        const derived: HornFact[] = [];
        const depends = index.get('DEPENDS');
        const outDegree = new Map<string, number>();

        for (const d of depends) {
          outDegree.set(d.args[0], (outDegree.get(d.args[0]) || 0) + 1);
        }

        for (const exp of index.get('EXPORTS')) {
          const f = exp.args[0];
          if ((outDegree.get(f) || 0) === 0 && index.get('IMPORTS').some((i) => i.args[1] === f)) {
            derived.push({
              predicate: 'TOPOLOGICAL_SINK',
              args: [f],
              confidence: 0.9,
            });
          }
        }
        return derived;
      },
    });
  }

  /**
   * Extrae la base de conocimientos inicial del hipercubo
   */
  public extractKnowledgeBase(space: HypercubeSpace): FactIndex {
    const index = new FactIndex();
    const vertices = space.getVertices();

    for (const v of vertices) {
      // Símbolos exportados
      for (const sym of v.symbols) {
        index.add({
          predicate: 'EXPORTS',
          args: [v.id, sym.name, sym.kind],
          confidence: 1.0,
        });
      }

      // Dependencias salientes
      for (const depId of v.dependencies) {
        index.add({
          predicate: 'DEPENDS',
          args: [v.id, depId],
          confidence: 1.0,
        });

        // Intentar deducir imports implícitos
        const depVertex = vertices.find((o) => o.id === depId);
        if (depVertex) {
          for (const s of depVertex.symbols) {
            index.add({
              predicate: 'IMPORTS',
              args: [v.id, depId, s.name],
              confidence: 0.8,
            });
          }
        }
      }
    }

    return index;
  }

  /**
   * Ejecuta el motor de deducción forward-chaining hasta alcanzar punto fijo (Fixpoint)
   */
  public deduceForward(index: FactIndex, maxIterations: number = 10): DeductiveAuditReport {
    let iteration = 0;
    const initialFactsCount = index.count();
    const newDeductions: HornFact[] = [];

    while (iteration < maxIterations) {
      iteration++;
      let factsAddedThisRound = 0;
      const allCurrentFacts = index.getAll();

      for (const rule of this.rules) {
        const derived = rule.evaluate(allCurrentFacts, index);
        for (const f of derived) {
          if (index.add(f)) {
            factsAddedThisRound++;
            newDeductions.push(f);
          }
        }
      }

      if (factsAddedThisRound === 0) {
        break; // Punto fijo alcanzado
      }
    }

    const broken = index.get('BROKEN_CONTRACT');
    const deadlocks = index.get('DEADLOCK_CYCLE');

    // Generar Construcciones Auxiliares si hay roturas de contrato
    const auxiliaryConstructions: AuxiliaryConstruction[] = [];
    for (const b of broken) {
      auxiliaryConstructions.push({
        type: 'ADAPTER_FACADE',
        sourceFile: b.args[1],
        targetSymbol: b.args[2],
        rationale: 'El caller ' + b.args[0] + ' espera el símbolo ' + b.args[2] + ' pero ' + b.args[1] + ' no lo expone. Se requiere una fachada retrocompatible.',
        suggestedSignature: 'export function ' + b.args[2] + '(...args: any[]): any { /* Retrocompatible adapter */ }',
      });
    }

    return {
      totalFacts: index.count(),
      iterationsToFixpoint: iteration,
      newDeductions,
      brokenContracts: broken,
      deadlocks,
      auxiliaryConstructions,
      isSymmetric: broken.length === 0 && deadlocks.length === 0,
    };
  }

  /**
   * Ejecuta la verificación formal completa sobre el espacio hiperdimensional
   */
  public verify(space: HypercubeSpace): DeductiveAuditReport {
    const kb = this.extractKnowledgeBase(space);
    return this.deduceForward(kb);
  }
}
