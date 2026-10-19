/**
 * TESSERACT-CONTEXT: Analizador Diferencial de Cizallamiento Topológico 4D (Git Diff & Pre-Commit Shield)
 * Evalúa exclusivamente los archivos modificados en el árbol de trabajo o branch frente a una base,
 * calculando la onda de impacto delta (Delta Shear) para prevenir que commits rotos lleguen a Git.
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from './indexer.ts';
import { BlastRadiusCalculator } from './blast.ts';
import type { AuditReport, TopologicalFracture } from './types.ts';

export interface DiffShearReport {
  isSafe: boolean;
  verdict: 'SAFE_TO_COMMIT' | 'BLOCKED_BY_DIFF_SHEAR' | 'CLEAN_NO_CHANGES';
  baseRef: string;
  changedFiles: string[];
  impactedDependents: string[];
  introducedFractures: TopologicalFracture[];
  deltaShearDistance: number;
  recommendation: string;
}

export class DifferentialShearAnalyzer {
  /**
   * Obtiene la lista de archivos modificados mediante Git
   */
  public static getChangedFiles(rootDir: string, baseRef: string = 'HEAD'): string[] {
    const root = path.resolve(rootDir);
    try {
      // 1. Archivos en staging y modificados sin stage
      const diffOutput = execSync(`git diff --name-only ${baseRef}`, { cwd: root, stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });
      // 2. Archivos en staging
      const cachedOutput = execSync('git diff --name-only --cached', { cwd: root, stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });
      // 3. Archivos no rastreados (untracked)
      const untrackedOutput = execSync('git ls-files --others --exclude-standard', { cwd: root, stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });

      const allFiles = new Set<string>();
      [diffOutput, cachedOutput, untrackedOutput].forEach((out) => {
        out.split('\n')
          .map((f) => f.trim())
          .filter(Boolean)
          .forEach((f) => allFiles.add(path.normalize(f).replace(/\\/g, '/')));
      });

      return Array.from(allFiles);
    } catch {
      // Si no es un repositorio git, retornar vacío
      return [];
    }
  }

  /**
   * Ejecuta el análisis diferencial de cizallamiento 4D
   */
  public static analyzeDiff(rootDir: string = '.', baseRef: string = 'HEAD'): DiffShearReport {
    const root = path.resolve(rootDir);
    const changedFiles = this.getChangedFiles(root, baseRef);

    if (changedFiles.length === 0) {
      return {
        isSafe: true,
        verdict: 'CLEAN_NO_CHANGES',
        baseRef,
        changedFiles: [],
        impactedDependents: [],
        introducedFractures: [],
        deltaShearDistance: 0,
        recommendation: 'No se detectaron archivos modificados en el árbol de trabajo.',
      };
    }

    // 1. Indexar el repositorio completo
    const indexer = new ProjectIndexer();
    if (!indexer.loadIndex(root)) {
      indexer.indexDirectory({ rootDir: root });
    }

    // 2. Ejecutar auditoría topológica completa
    const fullAudit = indexer.auditRepository(root);
    const space = (indexer as any).space;

    // 3. Calcular radio de explosión de los archivos modificados
    const changedSet = new Set(changedFiles);
    const impactedDependentsSet = new Set<string>();

    if (space) {
      for (const file of changedFiles) {
        try {
          const blast = BlastRadiusCalculator.calculate(space, file, undefined, 2, root);
          blast.terminalSinks.forEach((s) => impactedDependentsSet.add(s.file));
        } catch {
          // Si el archivo no existe en el hipercubo, continuar
        }
      }
    }

    // 4. Filtrar fracturas que involucren los archivos cambiados (como origen o destino)
    const introducedFractures = fullAudit.fractures.filter((f) => {
      const sourceNorm = f.source ? path.normalize(f.source).replace(/\\/g, '/') : '';
      const targetNorm = f.target ? path.normalize(f.target).replace(/\\/g, '/') : '';
      return changedSet.has(sourceNorm) || (targetNorm && changedSet.has(targetNorm));
    });

    // 5. Evaluar cizallamiento diferencial
    const criticalCount = introducedFractures.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
    const deltaShear = Math.min(1.0, criticalCount * 0.35 + introducedFractures.length * 0.1);
    const isSafe = criticalCount === 0 && deltaShear < 0.75;

    return {
      isSafe,
      verdict: isSafe ? 'SAFE_TO_COMMIT' : 'BLOCKED_BY_DIFF_SHEAR',
      baseRef,
      changedFiles,
      impactedDependents: Array.from(impactedDependentsSet),
      introducedFractures,
      deltaShearDistance: Number(deltaShear.toFixed(3)),
      recommendation: isSafe
        ? 'Cambios verificados en R^4: Cizallamiento nulo y cero contratos rotos en los archivos modificados.'
        : `BLOQUEADO: Se detectaron ${criticalCount} fracturas críticas en los archivos cambiados. Debe reparar antes de commitear.`,
    };
  }

  /**
   * Instala el hook pre-commit de Git en .git/hooks/pre-commit
   */
  public static installPreCommitHook(rootDir: string = '.'): { success: boolean; hookPath: string; message: string } {
    const root = path.resolve(rootDir);
    const gitDir = path.join(root, '.git');
    if (!fs.existsSync(gitDir)) {
      return { success: false, hookPath: '', message: 'El directorio actual no es un repositorio Git válido.' };
    }

    const hooksDir = path.join(gitDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const hookFile = path.join(hooksDir, 'pre-commit');
    const hookScript = `#!/usr/bin/env sh
# TESSERACT-CONTEXT 4D Autonomous Pre-Commit Shield
node --experimental-strip-types "$(dirname "$0")/../../src/index.ts" diff . HEAD
DIFF_EXIT=$?
if [ $DIFF_EXIT -ne 0 ]; then
  echo ""
  echo "🚨 [TESSERACT SHIELD] Commit abortado: Se detectaron fracturas topológicas o cizallamiento crítico 4D."
  echo "Ejecute 'npx tesseract audit' o corrija las fracturas antes de commitear."
  echo ""
  exit 1
fi
`;

    fs.writeFileSync(hookFile, hookScript, { encoding: 'utf-8', mode: 0o755 });

    return {
      success: true,
      hookPath: hookFile,
      message: 'Hook de pre-commit de Tesseract instalado exitosamente con permisos de ejecución.',
    };
  }
}
