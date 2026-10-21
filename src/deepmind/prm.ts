/**
 * OCTERACT-DEEPMIND: Verificador Paso a Paso (Process Reward Model - PRM)
 * Inspirado en Google DeepMind / Alignment PRMs (Process Supervision):
 * Evalúa y premia cada micro-paso de edición atómico individualmente en lugar de
 * juzgar únicamente el resultado final, evitando que un solo error contamine
 * todo el archivo mediante veto y rechazo temprano (Fail-Fast Rejection).
 */

import { TesseractShieldSecurity } from '../core/security.ts';

export interface StepEvaluation {
  stepIndex: number;
  line: number;
  type: 'INSERT' | 'DELETE' | 'MODIFY';
  contentSnippet: string;
  rewardScore: number; // 0.0 a 1.0
  isAccepted: boolean;
  rejectionReason?: string;
  deltaShearRisk: number;
}

export interface StepVerificationReport {
  targetPath: string;
  totalSteps: number;
  acceptedStepsCount: number;
  rejectedStepsCount: number;
  cumulativeReward: number; // 0 a 100
  overallVerdict: 'ACCEPTED' | 'REJECTED_BY_PRM';
  steps: StepEvaluation[];
  summary: string;
}

export class OcteractStepVerifier {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Evalúa la transición de un código base a un código propuesto paso a paso
   */
  public verifySteps(
    originalCode: string,
    proposedCode: string,
    targetPath: string = 'snippet.ts'
  ): StepVerificationReport {
    const origLines = originalCode.split('\n');
    const propLines = proposedCode.split('\n');

    const steps: StepEvaluation[] = [];
    let accepted = 0;
    let rejected = 0;

    // Escanear truncamientos globales primero
    const trunc = TesseractShieldSecurity.scanTruncation(proposedCode);
    if (trunc.isTruncated) {
      return {
        targetPath,
        totalSteps: 1,
        acceptedStepsCount: 0,
        rejectedStepsCount: 1,
        cumulativeReward: 0,
        overallVerdict: 'REJECTED_BY_PRM',
        steps: [
          {
            stepIndex: 1,
            line: 1,
            type: 'MODIFY',
            contentSnippet: proposedCode.slice(0, 100),
            rewardScore: 0.0,
            isAccepted: false,
            rejectionReason: trunc.reason || 'Truncamiento de archivo detectado en PRM',
            deltaShearRisk: 1.0,
          },
        ],
        summary: 'Rechazo inmediato por PRM: truncamiento o marcadores de elisión detectados.',
      };
    }

    // Análisis diferencial línea a línea
    const maxLines = Math.max(origLines.length, propLines.length);
    let stepCounter = 0;

    for (let i = 0; i < maxLines; i++) {
      const orig = origLines[i];
      const prop = propLines[i];

      if (orig !== prop) {
        stepCounter++;
        let stepType: StepEvaluation['type'] = 'MODIFY';
        if (orig === undefined) stepType = 'INSERT';
        else if (prop === undefined) stepType = 'DELETE';

        const lineContent = prop !== undefined ? prop : orig;
        let reward = 1.0;
        let isStepOk = true;
        let reason: string | undefined;
        let deltaRisk = 0.0;

        // Veto A: Eliminación de firma de exportación crítica
        if (orig && /\bexport\s+(?:class|function|interface|type|const)\b/.test(orig) && (stepType === 'DELETE' || (prop !== undefined && !/\bexport\b/.test(prop)))) {
          reward = 0.1;
          isStepOk = false;
          reason = 'Eliminación destructiva de símbolo exportado en línea ' + (i + 1);
          deltaRisk = 0.85;
        }

        // Veto B: Fuga de secreto en línea insertada
        if (stepType !== 'DELETE') {
          const secrets = TesseractShieldSecurity.scanSecrets(lineContent);
          if (secrets.length > 0) {
            reward = 0.0;
            isStepOk = false;
            reason = 'Secreto detectado con alta entropía en línea ' + (i + 1);
            deltaRisk = 1.0;
          }
        }

        // Veto C: Bucle infinito en línea insertada
        if (stepType !== 'DELETE' && /while\s*\(\s*(?:true|1)\s*\)\s*\{(?![^}]*break)/.test(lineContent)) {
          reward = 0.0;
          isStepOk = false;
          reason = 'Bucle infinito sin guardia de escape en línea ' + (i + 1);
          deltaRisk = 0.95;
        }

        if (isStepOk) {
          accepted++;
        } else {
          rejected++;
        }

        steps.push({
          stepIndex: stepCounter,
          line: i + 1,
          type: stepType,
          contentSnippet: lineContent.trim().slice(0, 80),
          rewardScore: parseFloat(reward.toFixed(2)),
          isAccepted: isStepOk,
          rejectionReason: reason,
          deltaShearRisk: parseFloat(deltaRisk.toFixed(2)),
        });
      }
    }

    // Si no hubo cambios
    if (steps.length === 0) {
      return {
        targetPath,
        totalSteps: 0,
        acceptedStepsCount: 0,
        rejectedStepsCount: 0,
        cumulativeReward: 100,
        overallVerdict: 'ACCEPTED',
        steps: [],
        summary: 'Sin diferencias detectadas entre las versiones.',
      };
    }

    const avgReward = steps.reduce((acc, s) => acc + s.rewardScore, 0) / steps.length;
    const cumulativeReward = Math.round(avgReward * 100);
    const overallVerdict: StepVerificationReport['overallVerdict'] =
      rejected === 0 && cumulativeReward >= 70 ? 'ACCEPTED' : 'REJECTED_BY_PRM';

    return {
      targetPath,
      totalSteps: steps.length,
      acceptedStepsCount: accepted,
      rejectedStepsCount: rejected,
      cumulativeReward,
      overallVerdict,
      steps,
      summary:
        overallVerdict === 'ACCEPTED'
          ? 'Todos los ' + steps.length + ' pasos atómicos superaron la verificación PRM (Score: ' + cumulativeReward + '/100).'
          : 'Se rechazaron ' + rejected + ' de ' + steps.length + ' pasos atómicos por violar invariantes de seguridad o contratos.',
    };
  }
}
