/**
 * TESSERACT-CONTEXT: Causal Inference & Do-Calculus Engine (Eje PSI)
 * Basado en los Modelos Causales Estructurales (SCM) y el Criterio de la Puerta Trasera
 * (Back-Door Criterion) de Judea Pearl.
 * Detecta parches sintomáticos falsos de la IA y correlaciones espurias en la reparación de código.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type CausalInferenceReport,
  type TopologicalFracture,
  type HyperVertex,
} from './types.ts';

export class CausalInferenceEngine {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Evalúa la causalidad estructural de una intervención de código (patch)
   * propuesta por un agente de IA.
   */
  public evaluateIntervention(
    targetPath: string,
    originalCode: string,
    proposedPatch: string,
    dependencyVertices: HyperVertex[] = []
  ): CausalInferenceReport {
    const confounders: string[] = [];
    let isSymptomaticPatch = false;
    let backDoorSatisfied = true;
    let causalStabilityScore = 0.85;

    const cleanLines = proposedPatch.split('\n').map((l) => l.replace(/^[\s\+\-]+/, ''));
    const normalizedPatch = cleanLines.join(' ').replace(/\s+/g, ' ');

    // 1. Detección de Parches Sintomáticos Clásicos de IA (Antipatrones de enmascaramiento)
    // Antipatrón A: Bloque try-catch vacío o swallow que retorna fallback silencioso
    const hasCatchSwallow =
      /catch\s*\([^)]*\)\s*\{\s*(\/\*.*\*\/|\/\/.*)?\s*\}/.test(normalizedPatch) ||
      /catch\s*\([^)]*\)\s*\{[^}]*return\s*(''|""|null|undefined|false|0|\{\}|\[\])?\s*;?\s*\}/.test(normalizedPatch);

    // Antipatrón B: Comprobación defensiva nula superficial sin propagación ni invariants
    const hasSuperficialNullCheck =
      /if\s*\(\s*(!\w+|\w+\s*===?\s*(null|undefined))\s*\)\s*(\{\s*)?return(\s+[^;]+)?;?(\s*\})?/.test(normalizedPatch);

    // Antipatrón C: Asignación de fallback arbitrario ("|| ''" o "?? {}") en el consumidor sin sanear la fuente
    const hasFallbackBypass = /\?\?\s*['"{}0]|\s*\|\|\s*['"{}0]/.test(proposedPatch);

    if (hasCatchSwallow || hasSuperficialNullCheck || hasFallbackBypass) {
      isSymptomaticPatch = true;
      backDoorSatisfied = false;
      causalStabilityScore = 0.35;
      confounders.push(
        hasCatchSwallow
          ? 'Swallow silencioso de excepción (enmascara la rotura causal)'
          : hasSuperficialNullCheck
          ? 'Comprobación de nulidad defensiva superficial en el punto de fallo'
          : 'Inyección de fallback arbitrario sin validación del invariante origen'
      );
    }

    // 2. Análisis del Grafo Causal: ¿La intervención toca la causa raíz o el nodo sumidero?
    // Si el archivo modificado tiene muchas dependencias entrantes (inDegree alto) y pocas salientes,
    // es un nodo sumidero. Modificar el sumidero en lugar del origen viola el criterio de la puerta trasera.
    const normTarget = path.normalize(targetPath).replace(/\\/g, '/');
    const targetVertex = dependencyVertices.find((v) => v.path.replace(/\\/g, '/') === normTarget);

    if (targetVertex) {
      if ((targetVertex.inDegree || 0) > 3 && isSymptomaticPatch) {
        causalStabilityScore -= 0.15;
        confounders.push(`El archivo objetivo es un sumidero con ${targetVertex.inDegree} dependientes. La causa raíz reside en el nodo productor upstream.`);
      }
    }

    causalStabilityScore = Math.max(0.1, Math.min(1.0, causalStabilityScore));

    const verdict: 'CAUSALLY_SOUND' | 'SPURIOUS_CORRELATION_DETECTED' =
      backDoorSatisfied && causalStabilityScore >= 0.70
        ? 'CAUSALLY_SOUND'
        : 'SPURIOUS_CORRELATION_DETECTED';

    const recommendation = isSymptomaticPatch
      ? 'La modificación propuesta ataca únicamente el síntoma superficial (correlación espuria). Identifique la variable de confusión upstream en el productor de datos y aplique la intervención do(X=x) sobre el invariante del contrato.'
      : 'La intervención respeta el criterio causal estructural de Pearl. No se detectan confounders espurios.';

    return {
      targetPath,
      proposedPatchSnippet: proposedPatch.slice(0, 300),
      causalStabilityScore: parseFloat(causalStabilityScore.toFixed(3)),
      confoundersDetected: confounders,
      isSymptomaticPatch,
      backDoorCriterionSatisfied: backDoorSatisfied,
      rootCauseNode: targetVertex?.id,
      verdict,
      recommendation,
    };
  }

  /**
   * Genera una fractura topológica si la intervención es espuria
   */
  public createFractureIfSpurious(report: CausalInferenceReport): TopologicalFracture | undefined {
    if (report.verdict === 'SPURIOUS_CORRELATION_DETECTED') {
      return {
        id: `CAUSAL-${path.basename(report.targetPath)}-${Date.now()}`,
        type: 'SPURIOUS_CORRELATION_FRACTURE',
        severity: 'HIGH',
        source: report.targetPath,
        description: `Correlación Espuria / Parche Sintomático Detectado: la intervención de la IA enmascara el fallo mediante un guard defensivo sin resolver la causa raíz causal (Estabilidad Causal: ${(report.causalStabilityScore * 100).toFixed(0)}%). Confounders: ${report.confoundersDetected.join('; ')}`,
        suggestedFix: report.recommendation,
        shearDistance: parseFloat((1 - report.causalStabilityScore).toFixed(3)),
      };
    }
    return undefined;
  }
}
