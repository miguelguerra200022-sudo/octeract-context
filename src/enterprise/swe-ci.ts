import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SWECISnapshot {
  stepIndex: number;
  commitHash?: string;
  timestamp: number;
  healthScore: number;
  totalFractures: number;
  shearDistance: number;
  contractFingerprints: Record<string, string>;
}

export interface SWECIEvaluation {
  approved: boolean;
  rollbackRequired: boolean;
  reason: string;
  deltaFractures: number;
  deltaShear: number;
}

export interface SWECIStatus {
  totalSteps: number;
  currentHealth: number;
  currentFractures: number;
  lastShear: number;
  history: SWECISnapshot[];
}

export class SWECIEngine {
  private projectRoot: string;
  private dbPath: string;

  public static readonly MAX_ALLOWED_SHEAR = 0.10;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    const tesseractDir = path.join(this.projectRoot, '.tesseract');
    this.dbPath = path.join(tesseractDir, 'swe-ci.json');
  }

  /**
   * Carga el historial completo de snapshots de SWE-CI
   */
  public getHistory(): SWECISnapshot[] {
    if (!fs.existsSync(this.dbPath)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Registra y persiste un snapshot en .tesseract/swe-ci.json
   */
  public recordSnapshot(snapshot: SWECISnapshot): void {
    const history = this.getHistory();
    const updated = [...history, snapshot];

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.dbPath, JSON.stringify(updated, null, 2), 'utf-8');
  }

  /**
   * Evalúa si una mutación cumple la garantía matemática de no-degradación
   * Invariante: D_shear <= 0.10 Y Delta Fracturas <= 0
   */
  public evaluateStep(stepMetrics: {
    healthScore: number;
    totalFractures: number;
    shearDistance: number;
    contractFingerprints?: Record<string, string>;
  }): SWECIEvaluation {
    const history = this.getHistory();

    // Si es el primer paso sin historial previo, se aprueba como punto de referencia
    if (history.length === 0) {
      return {
        approved: true,
        rollbackRequired: false,
        reason: 'Aprobado como snapshot inicial de referencia (Línea Base SWE-CI).',
        deltaFractures: 0,
        deltaShear: 0
      };
    }

    const last = history[history.length - 1];
    const deltaFractures = stepMetrics.totalFractures - last.totalFractures;
    const deltaShear = stepMetrics.shearDistance - last.shearDistance;

    // Regla 1: Cizallamiento geodésico no debe superar el umbral crítico de 0.10
    if (stepMetrics.shearDistance > SWECIEngine.MAX_ALLOWED_SHEAR) {
      return {
        approved: false,
        rollbackRequired: true,
        reason: `Cizallamiento geodésico excesivo (${stepMetrics.shearDistance.toFixed(4)} > ${SWECIEngine.MAX_ALLOWED_SHEAR.toFixed(4)}). Desalineación estructural detectada.`,
        deltaFractures,
        deltaShear
      };
    }

    // Regla 2: Invariante de fracturas (nunca pueden aumentar respecto al snapshot anterior)
    if (deltaFractures > 0) {
      return {
        approved: false,
        rollbackRequired: true,
        reason: `Regresión topológica detectada: Las fracturas aumentaron de ${last.totalFractures} a ${stepMetrics.totalFractures} (Delta: +${deltaFractures}). Se requiere rollback inmediato.`,
        deltaFractures,
        deltaShear
      };
    }

    return {
      approved: true,
      rollbackRequired: false,
      reason: `Aprobado: La mutación mantiene o mejora la simetría (Salud: ${stepMetrics.healthScore}, Fracturas: ${stepMetrics.totalFractures}, Delta Fracturas: ${deltaFractures}).`,
      deltaFractures,
      deltaShear
    };
  }

  /**
   * Revierte un archivo a su estado original para anular una regresión
   */
  public rollbackStep(filePath: string, originalContent?: string): boolean {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);

    if (originalContent !== undefined) {
      try {
        fs.writeFileSync(absolutePath, originalContent, 'utf-8');
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Obtiene el estado consolidado actual de la serie temporal SWE-CI
   */
  public getStatus(): SWECIStatus {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        totalSteps: 0,
        currentHealth: 100,
        currentFractures: 0,
        lastShear: 0,
        history: []
      };
    }

    const last = history[history.length - 1];
    return {
      totalSteps: history.length,
      currentHealth: last.healthScore,
      currentFractures: last.totalFractures,
      lastShear: last.shearDistance,
      history
    };
  }
}
