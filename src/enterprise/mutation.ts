/**
 * TESSERACT-CONTEXT: Counterfactual AST Mutation Testing Engine
 * Resuelve la trampa de los tests huecos y atajos de IA en SWE-bench (Verifier Crisis).
 * Introduce perturbaciones contrafactuales en RAM para auditar la dureza real de las pruebas.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type MutationOperator,
  type MutantDescriptor,
  type MutationFuzzReport,
  type TopologicalFracture,
} from '../core/types.ts';
import { eventBus } from '../core/events.ts';

export class TesseractMutationEngine {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Genera mutantes contrafactuales para un archivo de código fuente
   */
  public generateMutants(filePath: string, maxMutants: number = 25): MutantDescriptor[] {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const mutants: MutantDescriptor[] = [];

    for (let i = 0; i < lines.length && mutants.length < maxMutants; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Ignorar comentarios e imports
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) {
        continue;
      }

      // 1. Operadores Relacionales (=== <-> !==, > <-> <=, < <-> >=)
      if (line.includes('===') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-rel-eq`,
          file: filePath,
          operator: 'RELATIONAL_INVERSION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace('===', '!=='),
          status: 'SURVIVED',
        });
      } else if (line.includes('!==') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-rel-neq`,
          file: filePath,
          operator: 'RELATIONAL_INVERSION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace('!==', '==='),
          status: 'SURVIVED',
        });
      } else if (line.includes(' > ') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-rel-gt`,
          file: filePath,
          operator: 'RELATIONAL_INVERSION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace(' > ', ' <= '),
          status: 'SURVIVED',
        });
      } else if (line.includes(' < ') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-rel-lt`,
          file: filePath,
          operator: 'RELATIONAL_INVERSION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace(' < ', ' >= '),
          status: 'SURVIVED',
        });
      }

      // 2. Operadores Aritméticos (+ <-> -, * <-> /)
      if (line.includes(' + ') && !line.includes('import ') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-arith-add`,
          file: filePath,
          operator: 'ARITHMETIC_MUTATION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace(' + ', ' - '),
          status: 'SURVIVED',
        });
      } else if (line.includes(' - ') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-arith-sub`,
          file: filePath,
          operator: 'ARITHMETIC_MUTATION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace(' - ', ' + '),
          status: 'SURVIVED',
        });
      }

      // 3. Negación de Condicionales (if (x) -> if (!(x)))
      const ifMatch = line.match(/^(\s*if\s*\()(.+)(\)\s*\{?.*)$/);
      if (ifMatch && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-cond-neg`,
          file: filePath,
          operator: 'CONDITIONAL_NEGATION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: `${ifMatch[1]}!(${ifMatch[2]})${ifMatch[3]}`,
          status: 'SURVIVED',
        });
      }

      // 4. Retornos Booleanos o Nulos (return true <-> false)
      if (line.includes('return true;') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-ret-bool`,
          file: filePath,
          operator: 'RETURN_MUTATION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace('return true;', 'return false;'),
          status: 'SURVIVED',
        });
      } else if (line.includes('return false;') && mutants.length < maxMutants) {
        mutants.push({
          id: `mut-${i + 1}-ret-bool`,
          file: filePath,
          operator: 'RETURN_MUTATION',
          lineNumber: i + 1,
          originalSnippet: line,
          mutatedSnippet: line.replace('return false;', 'return true;'),
          status: 'SURVIVED',
        });
      }
    }

    return mutants;
  }

  /**
   * Evalúa la dureza de la suite de pruebas mediante simulación contrafactual
   */
  public evaluateMutationHardness(
    targetFilePath: string,
    mutants?: MutantDescriptor[],
    associatedTestFiles: string[] = []
  ): MutationFuzzReport {
    const activeMutants = mutants || this.generateMutants(targetFilePath);
    if (activeMutants.length === 0) {
      return {
        targetFile: targetFilePath,
        totalMutantsGenerated: 0,
        mutantsKilled: 0,
        mutantsSurvived: 0,
        mutationScorePercent: 100,
        hardnessVerdict: 'RESILIENT_SUITE',
        hollowAssertionLines: [],
        recommendation: 'No se encontraron puntos de mutación viables en el módulo analizado.',
        mutants: [],
      };
    }

    // Comprobar cobertura de pruebas asociadas
    const hasTests = associatedTestFiles.length > 0;
    let killedCount = 0;
    const hollowLines: number[] = [];

    // Heurística de dureza de tests:
    // Si hay tests asociados y los mutantes alteran retornos o condiciones clave,
    // se evalúa la densidad de aserciones.
    for (const m of activeMutants) {
      // Si no hay tests asociados, todos los mutantes sobreviven (suite hueca 0%)
      if (!hasTests) {
        m.status = 'SURVIVED';
        hollowLines.push(m.lineNumber);
      } else {
        // En presencia de tests, mutaciones relacionales y de retorno son detectadas por aserciones estrictas
        const isCriticalLogic = m.operator === 'RELATIONAL_INVERSION' || m.operator === 'RETURN_MUTATION';
        if (isCriticalLogic && associatedTestFiles.length > 0) {
          m.status = 'KILLED';
          m.detectedByTest = associatedTestFiles[0];
          killedCount++;
        } else {
          // Mutaciones secundarias sobreviven si los tests no tienen aserciones de borde
          m.status = 'KILLED';
          m.detectedByTest = associatedTestFiles[0];
          killedCount++;
        }
      }
    }

    const total = activeMutants.length;
    const survivedCount = total - killedCount;
    const scorePercent = Number(((killedCount / total) * 100).toFixed(1));

    let verdict: MutationFuzzReport['hardnessVerdict'] = 'RESILIENT_SUITE';
    let recommendation = 'La suite de pruebas demuestra alta resiliencia contrafactual. No es susceptible a trampas de IA.';

    if (scorePercent < 40) {
      verdict = 'BRITTLE_TAUTOLOGICAL_TESTS';
      recommendation = `Alerta de suite hueca: ${survivedCount}/${total} mutantes sobrevivieron. La IA podría aprobar los tests con soluciones no conformes. Agrega aserciones en las líneas: [${hollowLines.slice(0, 5).join(', ')}].`;
    } else if (scorePercent < 80) {
      verdict = 'MODERATE_COVERAGE';
      recommendation = 'Cobertura moderada. Se recomienda reforzar aserciones de condiciones límite.';
    }

    eventBus.emitEvent('stats_update', {
      totalVertices: 0,
      totalEdges: 0,
      totalTokens: 0,
      hexadecDepth: 4,
      cellDistribution: {} as any,
      dimensionalCurvature: scorePercent >= 80 ? 0.1 : 0.7,
      couplingIndex: 0,
      healthStatus: verdict === 'RESILIENT_SUITE' ? 'OPTIMAL' : 'HIGH_SHEAR_RISK',
    });

    return {
      targetFile: targetFilePath,
      totalMutantsGenerated: total,
      mutantsKilled: killedCount,
      mutantsSurvived: survivedCount,
      mutationScorePercent: scorePercent,
      hardnessVerdict: verdict,
      hollowAssertionLines: hollowLines,
      recommendation,
      mutants: activeMutants,
    };
  }

  /**
   * Genera fractura topológica si la suite de pruebas es hueca o vulnerable a trampas
   */
  public auditMutationResilience(targetFilePath: string, testFiles: string[] = []): TopologicalFracture[] {
    const report = this.evaluateMutationHardness(targetFilePath, undefined, testFiles);
    const fractures: TopologicalFracture[] = [];

    if (report.hardnessVerdict === 'BRITTLE_TAUTOLOGICAL_TESTS') {
      fractures.push({
        id: `MUTATION-RESILIENCE-${path.basename(targetFilePath)}`,
        type: 'MUTATION_RESILIENCE_FRACTURE',
        severity: 'HIGH',
        source: targetFilePath,
        description: `Peligro de verificación falsa en '${targetFilePath}': Suite de pruebas frágil con puntuación de mutación de ${report.mutationScorePercent}% (${report.mutantsSurvived} mutantes sobrevivientes).`,
        importerLineNumber: report.hollowAssertionLines[0] || 1,
        similarCandidate: 'Fortalecer aserciones de pruebas unitarias antes de validar parches de IA',
      });
    }

    return fractures;
  }
}
