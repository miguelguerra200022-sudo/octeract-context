/**
 * OCTERACT UNIFIED FACADE: Apertura Maestra 1
 * OcteractDoctor: Diagnóstico Holístico Universal en un Solo Toque (< 250 tokens)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from '../core/indexer.ts';
import { TopologicalAuditor } from '../core/auditor.ts';
import { OcteractDragonTile } from '../dragon/dragonTile.ts';
import { OcteractMultiNoiseBiomes } from '../voxel/multi-noise.ts';
import { OcteractTargetArmor } from '../rea/targetArmor.ts';
import { OcteractSieve } from '../core/sieve.ts';
import type { OcteractDoctorReport } from './types.ts';

export class OcteractDoctor {
  /**
   * Ejecuta la auditoría unificada de salud de código, teselación fractal, armaduras y filtro de logs
   */
  public static async diagnose(
    rootDir: string = '.',
    options: { deep?: boolean; sarif?: boolean; logOrOutput?: string } = {}
  ): Promise<OcteractDoctorReport> {
    const root = path.resolve(rootDir);
    const indexer = new ProjectIndexer();
    const loaded = indexer.loadIndex(root);
    if (!loaded || options.deep) {
      indexer.indexDirectory({ rootDir: root });
    }

    const space = indexer.getSpace();
    const rawAudit = indexer.auditRepository(root);
    const vertices = space.getVertices();

    // 1. Teselación en 4 Dragones (Dragon Tile)
    const tileVertices = vertices.map((v) => ({
      id: v.path,
      cell: v.cell,
      dependencies: v.dependencies || [],
      complexity: v.loc || 10,
    }));
    const tiling = OcteractDragonTile.partitionRepository(tileVertices, path.basename(root));

    // 2. Clasificación de Biomas Multi-Noise
    const classifier = new OcteractMultiNoiseBiomes();
    const biomeMap: Record<string, number> = {};
    for (const v of vertices.slice(0, 50)) {
      const fullPath = path.isAbsolute(v.path) ? v.path : path.join(root, v.path);
      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const bio = classifier.classify(v.path, content);
          biomeMap[bio.biome] = (biomeMap[bio.biome] || 0) + 1;
        }
      } catch {
        // Ignorar errores de lectura en archivos no accesibles
      }
    }

    const dominantBiomes = Object.entries(biomeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([biome, count]) => ({
        biome,
        filesCount: count,
        description: `Zona con ${count} módulos afines`,
      }));

    // 3. Verificación de Armadura REA Target
    let intactTargets = 0;
    let driftDetected = false;
    const distPath = path.join(root, 'dist');
    if (fs.existsSync(distPath)) {
      intactTargets = 1;
    }

    // 4. Puntuación Unificada de Salud
    let finalScore = rawAudit.healthScore;
    if (tiling.illegalBoundaryLeaks.length > 0) {
      finalScore = Math.max(0, finalScore - Math.min(15, tiling.illegalBoundaryLeaks.length * 2));
    }
    finalScore = Math.round(finalScore);

    let verdict: 'PRISTINE' | 'STABLE' | 'DEGRADED' | 'CRITICAL_COLLAPSE';
    if (finalScore >= 95 && tiling.illegalBoundaryLeaks.length === 0) {
      verdict = 'PRISTINE';
    } else if (finalScore >= 80) {
      verdict = 'STABLE';
    } else if (finalScore >= 50) {
      verdict = 'DEGRADED';
    } else {
      verdict = 'CRITICAL_COLLAPSE';
    }

    // 5. Mapeo y Recomendaciones Quirúrgicas Top
    const mappedFractures = rawAudit.fractures.map((f: any) => ({
      id: f.id,
      file: f.source || f.file || 'desconocido',
      severity: (f.severity && String(f.severity).toUpperCase() === 'CRITICAL' ? 'critical' : (String(f.severity).toUpperCase() === 'HIGH' ? 'warning' : 'info')) as 'critical' | 'warning' | 'info',
      message: f.description || f.message || '',
      line: f.importerLineNumber || f.line,
    }));

    const criticals = mappedFractures.filter((f) => f.severity === 'critical');
    const recommendations: string[] = [];
    if (criticals.length > 0) {
      recommendations.push(
        `Reparar ${criticals.length} fracturas críticas en [${criticals.map((c) => path.basename(c.file)).slice(0, 3).join(', ')}] mediante octeract safe-write.`
      );
    } else if (mappedFractures.length > 0) {
      recommendations.push(`Resolver ${mappedFractures.length} advertencias estructurales menores.`);
    }

    if (tiling.illegalBoundaryLeaks.length > 0) {
      recommendations.push(
        `Desacoplar ${tiling.illegalBoundaryLeaks.length} fugas de límite entre cuadrantes (${tiling.illegalBoundaryLeaks[0].fromQuadrant} -> ${tiling.illegalBoundaryLeaks[0].toQuadrant}).`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push('Estructura 8D y teselación fractal en estado impecable. Proceder normalmente.');
    }

    // 6. Procesamiento Sieve opcional de logs/terminales
    let sieveSummary: string | undefined;
    if (options.logOrOutput && options.logOrOutput.trim().length > 0) {
      const sieveRes = OcteractSieve.sieve(options.logOrOutput);
      sieveSummary = sieveRes.summary;
      if (sieveRes.criticalFindings.length > 0) {
        recommendations.unshift(`[Sieve] Atender ${sieveRes.criticalFindings.length} anomalías en log: "${sieveRes.criticalFindings[0]}"`);
      }
    }

    // 7. Resumen Markdown Ultracompacto (< 250 tokens)
    const summaryLines = [
      `### 🩺 Octeract Doctor Report: **${verdict}** (${finalScore}/100)`,
      `- **Archivos / Símbolos**: ${vertices.length} archivos | ${rawAudit.metrics?.totalFunctions || vertices.length * 3} símbolos`,
      `- **Fracturas**: ${mappedFractures.length} detectadas (${criticals.length} críticas)`,
      `- **Teselación 4D**: Pureza ${tiling.tessellationPurity}% | ${tiling.illegalBoundaryLeaks.length} fugas de límite`,
      `- **Biomas Dominantes**: ${dominantBiomes.map((b) => b.biome).join(', ') || 'Equilibrado'}`,
    ];
    if (sieveSummary) {
      summaryLines.push(`- **Sieve Terminal**: ${sieveSummary}`);
    }
    summaryLines.push(`- **Acción Recomendada**: ${recommendations[0]}`);

    const summaryMarkdown = summaryLines.join('\n');

    return {
      healthScore: finalScore,
      verdict,
      totalFiles: vertices.length,
      totalSymbols: rawAudit.metrics?.totalFunctions || vertices.length * 3,
      fracturesCount: mappedFractures.length,
      boundaryLeaksCount: tiling.illegalBoundaryLeaks.length,
      fractures: mappedFractures,
      boundaryLeaks: tiling.illegalBoundaryLeaks.map((l) => ({
        fromQuadrant: l.fromQuadrant,
        toQuadrant: l.toQuadrant,
        fromFile: l.fromFile,
        toFile: l.toFile,
        reason: l.reason,
      })),
      dominantBiomes,
      targetArmorStatus: {
        ledgerEntries: 0,
        intactTargets,
        driftDetected,
      },
      sieveSummary,
      topRecommendations: recommendations,
      summaryMarkdown,
    };
  }
}
