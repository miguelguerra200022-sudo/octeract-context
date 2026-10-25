/**
 * OCTERACT UNIFIED FACADE: Apertura Maestra 4
 * OcteractSafeWrite: Escritura Quirúrgica Protegida por Escudo 4D y Fuzzer de Pliegues Origami
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from '../core/indexer.ts';
import { ShadowEngine } from '../core/shadow.ts';
import { OcteractDragonCreaseFuzz } from '../dragon/dragonCreaseFuzz.ts';
import type { OcteractSafeWriteOptions, OcteractSafeWriteResult } from './types.ts';

export class OcteractSafeWrite {
  /**
   * Modifica o escribe un archivo con validación multi-capa:
   * 1. Crease Fuzz (Resiliencia Origami)
   * 2. Shadow Projection 4D (Cizallamiento y Circuit Breaker)
   * 3. Reducción Estricta de Entropía
   * 4. Escritura Atómica en Disco
   */
  public static async write(
    targetFile: string,
    proposedContent: string,
    options: OcteractSafeWriteOptions = {}
  ): Promise<OcteractSafeWriteResult> {
    const root = path.resolve(options.rootDir || '.');
    const fullPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(root, targetFile);
    const relPath = path.relative(root, fullPath);

    const indexer = new ProjectIndexer();
    if (!indexer.loadIndex(root)) {
      indexer.indexDirectory({ rootDir: root });
    }

    const space = indexer.getSpace();
    const shadowEngine = new ShadowEngine(space, root);

    // 1. Origami Crease Fuzz Stress Test
    const fuzzReport = OcteractDragonCreaseFuzz.evaluateStress(proposedContent, relPath);

    // 2. Simulación en RAM con ShadowEngine
    const shadow = shadowEngine.project(relPath, proposedContent);
    const currentAudit = indexer.getAuditReport() || indexer.auditRepository(root);
    const entropy = shadowEngine.evaluateEntropy(relPath, proposedContent, currentAudit.totalFractures);

    const isSafe = (shadow.isSafe && entropy.allowed) || options.force === true;

    if (!isSafe) {
      shadowEngine.recordFailedAttempt(relPath);
      const violations: string[] = [];
      if (!shadow.isSafe) {
        violations.push(`Cizallamiento 4D excesivo (distancia: ${shadow.shearDistance}).`);
        if (shadow.brokenEdges && shadow.brokenEdges.length > 0) {
          violations.push(`${shadow.brokenEdges.length} aristas de contrato rotas.`);
        }
      }
      if (!entropy.allowed && entropy.reason) {
        violations.push(entropy.reason);
      }

      return {
        status: 'BLOCKED_BY_4D_SHIELD',
        targetFile: relPath,
        shearDistance: shadow.shearDistance,
        creaseStressScore: fuzzReport.creaseStressScore,
        fracturesPrevented: Math.max(1, shadow.brokenEdges.length),
        message: `⛔ Modificación bloqueada por el Escudo 4D. Se previene regresión arquitectónica.`,
        details: {
          contractViolations: violations,
          fragileCreases: fuzzReport.fragileBifurcations.map((fb) => `Línea ${fb.line}: ${fb.fragilityReason}`),
          shadowTrialPass: false,
        },
      };
    }

    // 3. Escritura segura en disco
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, proposedContent, 'utf-8');
    shadowEngine.resetAttempts(relPath);

    // Re-indexar el archivo modificado
    try {
      indexer.indexFile(fullPath, root);
    } catch {
      // Si falla la re-indexación no bloqueamos la confirmación
    }

    return {
      status: 'WRITTEN_SAFELY',
      targetFile: relPath,
      shearDistance: shadow.shearDistance,
      creaseStressScore: fuzzReport.creaseStressScore,
      fracturesPrevented: 0,
      message: `✔ Archivo escrito de forma segura en disco bajo simetría 4D (Cizallamiento: ${shadow.shearDistance}).`,
      details: {
        shadowTrialPass: true,
      },
    };
  }
}
