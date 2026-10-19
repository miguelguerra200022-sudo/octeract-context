/**
 * TESSERACT-CONTEXT: Comandos de la Interfaz de Línea de Comandos (CLI)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from '../core/indexer.ts';
import { ShadowEngine } from '../core/shadow.ts';
import { TopologicalAuditor } from '../core/auditor.ts';
import { FlowTracer } from '../core/flow.ts';
import { BlastRadiusCalculator } from '../core/blast.ts';
import { TransactionalHealer } from '../core/healing.ts';
import { MCPServer } from '../mcp/server.ts';
import { TesseractTUI } from './tui.ts';
import { CubicCell } from '../core/types.ts';
import { runUniversalInit } from './init.ts';
import { TesseractDashboard } from '../ui/dashboard.ts';
import { ShieldWatcher } from '../shield/watcher.ts';
import { SarifExporter } from '../core/sarif.ts';
import { DifferentialShearAnalyzer } from '../core/diff.ts';

export async function runInit(targetDir: string = '.'): Promise<void> {
  await runUniversalInit(targetDir);
}

export async function runIndex(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[36m⏳ Mapeando variedad topológica en 4D para:\x1b[0m ${root}`);

  const start = Date.now();
  const indexer = new ProjectIndexer();
  const space = indexer.indexDirectory({ rootDir: root });
  indexer.saveIndex(root);

  const duration = Date.now() - start;
  const stats = space.getHyperStats();

  console.log(`\n\x1b[1;32m✔ Indexación completada en ${duration} ms\x1b[0m`);
  console.log(`  ● Archivos / Vértices 4D: \x1b[1m${stats.totalVertices}\x1b[0m`);
  console.log(`  ● Aristas de interconexión: \x1b[1m${stats.totalEdges}\x1b[0m`);
  console.log(`  ● Tokens estimados: \x1b[1m${stats.totalTokens.toLocaleString()}\x1b[0m`);
  console.log(`  ● Profundidad Fractal: \x1b[1mNivel ${stats.hexadecDepth}\x1b[0m`);
  console.log(`  ● Salud Arquitectónica: \x1b[1;32m${stats.healthStatus}\x1b[0m`);
  console.log(`\n  \x1b[33mDistribución por Celdas Cúbicas:\x1b[0m`);

  for (const [cell, count] of Object.entries(stats.cellDistribution)) {
    if (count > 0) {
      console.log(`    - ${cell.padEnd(12)}: ${count} archivos`);
    }
  }
}

export async function runStats(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);

  if (!loaded) {
    console.log(`\x1b[33mNo se encontró índice en caché. Indexando ahora...\x1b[0m`);
    indexer.indexDirectory({ rootDir: root });
  }

  const stats = indexer.getSpace().getHyperStats();
  console.log(JSON.stringify(stats, null, 2));
}

export async function runSlice(targetDir: string = '.', options: any = {}): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const space = indexer.getSpace();
  const result = space.slice({
    cell: options.cell as CubicCell,
    focusSymbol: options.symbol,
    tokenBudget: options.budget ? parseInt(options.budget, 10) : 2000,
  });

  console.log(result.projectedCode);
  console.log(`\n\x1b[32m✔ ${result.summary}\x1b[0m`);
}

export async function runMCP(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  const server = new MCPServer({ rootDir: root });
  await server.init();
  server.startStdio();
}

export async function runTUI(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const stats = indexer.getSpace().getHyperStats();
  const tui = new TesseractTUI();
  tui.startAnimation(stats, 40);
}

export async function runShadow(targetDir: string = '.', targetFile: string, proposedContent: string): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const space = indexer.getSpace();
  const shadow = new ShadowEngine(space);
  const result = shadow.project(targetFile, proposedContent);
  console.log(JSON.stringify(result, null, 2));
}

export async function runUI(targetDir: string = '.', port: number = 4444): Promise<void> {
  const root = path.resolve(targetDir);
  const dashboard = new TesseractDashboard({ rootDir: root, port });
  await dashboard.start();
}

export async function runWatch(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  const watcher = new ShieldWatcher(root);
  void watcher.start();
}

export async function runSafeWrite(targetDir: string = '.', targetFile: string, proposedContent: string): Promise<void> {
  const root = path.resolve(targetDir);
  const server = new MCPServer({ rootDir: root });
  await server.init();
  const res = await server.callTool('tesseract_safe_write', { targetPath: targetFile, proposedContent });
  console.log(JSON.stringify(res, null, 2));
}

export async function runAudit(targetDir: string = '.', sarifOutput?: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[36m🔬 Ejecutando Auditoría Topológica Determinista sin IA (0 Tokens) en:\x1b[0m ${root}\n`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const report = indexer.auditRepository(root);
  const color = report.healthScore >= 90 ? '\x1b[1;32m' : (report.healthScore >= 70 ? '\x1b[1;33m' : '\x1b[1;31m');

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`💎 \x1b[1mINFORME DE SALUD TOPOLÓGICA 4D (CERO TOKENS)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`  ● Puntuación de Salud Global: ${color}${report.healthScore}/100\x1b[0m (Estado: ${report.status})`);
  console.log(`  ● Archivos Auditados:        \x1b[1m${report.totalFilesAudited}\x1b[0m`);
  console.log(`  ● Total de Fracturas:        \x1b[1m${report.totalFractures}\x1b[0m`);
  console.log(`    - Imports Rotos:           \x1b[31m${report.fracturesByType.BROKEN_IMPORT || 0}\x1b[0m`);
  console.log(`    - Desajuste de Contratos:  \x1b[33m${report.fracturesByType.CONTRACT_MISMATCH || 0}\x1b[0m`);
  console.log(`    - Dependencias Cíclicas:   \x1b[35m${report.fracturesByType.CIRCULAR_DEPENDENCY || 0}\x1b[0m`);
  console.log(`    - Ganglios Aislados/Muertos:\x1b[36m${report.fracturesByType.ORPHAN_NODE || 0}\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m\n`);

  if (report.fractures.length > 0) {
    console.log(`\x1b[1;33mDetalle Quirúrgico de Fracturas (Evidencia < 600 tokens):\x1b[0m\n`);
    for (const f of report.fractures.slice(0, 10)) {
      console.log(`  [\x1b[1;31m${f.type}\x1b[0m] ${f.source}${f.target ? ' ➔ ' + f.target : ''}`);
      console.log(`    • ${f.description}`);
      if (f.missingSymbol) {
        console.log(`    • Símbolo faltante: \x1b[31m${f.missingSymbol}\x1b[0m ${f.similarCandidate ? `(¿Quisiste decir: \x1b[32m${f.similarCandidate}\x1b[0m?)` : ''}`);
      }
      if (f.cyclePath) {
        console.log(`    • Ciclo: \x1b[35m${f.cyclePath.join(' -> ')}\x1b[0m`);
      }
      console.log(`    • \x1b[32mCuración recomendada:\x1b[0m ${f.healingStrategy}\n`);
    }
  } else {
    console.log(`\x1b[1;32m✔ Simetría perfecta. Ninguna fractura detectada en el repositorio.\x1b[0m\n`);
  }

  if (sarifOutput) {
    const sarifPath = path.resolve(root, sarifOutput);
    SarifExporter.writeSarifToFile(report, sarifPath, root);
    console.log(`\x1b[1;32m✔ Reporte OASIS SARIF 2.1.0 generado exitosamente en:\x1b[0m ${sarifPath}\n`);
  }
}

export async function runSarif(targetDir: string = '.', outputFile: string = 'tesseract-results.sarif'): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const report = indexer.auditRepository(root);
  const sarifPath = path.resolve(root, outputFile);
  SarifExporter.writeSarifToFile(report, sarifPath, root);
  console.log(`\x1b[1;32m✔ Reporte OASIS SARIF 2.1.0 generado exitosamente en:\x1b[0m ${sarifPath}`);
  console.log(`  Total alertas SARIF indexadas: ${report.fractures.length} (Salud: ${report.healthScore}/100)\n`);
}

export async function runFlow(targetDir: string = '.', query: string): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const report = indexer.getAuditReport();
  const trace = FlowTracer.trace(indexer.getSpace(), query, report ? report.fractures : []);
  console.log(`\n\x1b[1;35m${trace.asciiDiagram}\x1b[0m\n`);
  console.log(`\x1b[1;36mRespuesta Directa:\x1b[0m ${trace.directAnswerForAI}`);
  console.log(`\x1b[1;33mRadio de Impacto:\x1b[0m ${trace.blastRadiusExplanation}`);
  console.log(`\x1b[32mTokens Entregados:\x1b[0m ${trace.estimatedTokens} tokens (< 650 tokens)\n`);
}

export async function runHybridAudit(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const auditor = new TopologicalAuditor();
  const triage = auditor.getHybridAuditTriage(indexer.getSpace(), root);
  console.log(`\n\x1b[1;35m${triage.compactPromptForAI}\x1b[0m\n`);
  console.log(`\x1b[1;32m✔ Triage de Auditoría Híbrida completado en 0 tokens de LLM. Listo para análisis semántico.\x1b[0m\n`);
}

export async function runBlast(
  targetDir: string = '.',
  targetFile: string,
  targetSymbol?: string,
  maxHops: number = 30
): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const result = BlastRadiusCalculator.calculate(indexer.getSpace(), targetFile, targetSymbol, maxHops, root);
  console.log(`\n\x1b[1;35m${result.richDossierForAI}\x1b[0m\n`);
}

export async function runPatch(
  targetDir: string = '.',
  targetFile: string,
  symbolName?: string
): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const report = indexer.getAuditReport() || indexer.auditRepository(root);
  const norm = targetFile.replace(/\\/g, '/');
  let match = report.fractures.find((f) => f.source.includes(norm) || (f.target && f.target.includes(norm)));
  if (symbolName) {
    const symMatch = report.fractures.find(
      (f) => f.missingSymbol === symbolName || f.symbolName === symbolName
    );
    if (symMatch) match = symMatch;
  }

  if (match) {
    const patch = match.synthesizedPatch || TopologicalAuditor.synthesizePatch(match);
    console.log(`\n\x1b[1;32m=== PARCHE TOPOLÓGICO SINTETIZADO (Zero-Touch) ===\x1b[0m`);
    console.log(`\x1b[1mFractura:\x1b[0m [${match.type}] en ${match.source}`);
    console.log(`\x1b[1mEstrategia:\x1b[0m ${match.healingStrategy}\n`);
    console.log(`\x1b[36m${patch}\x1b[0m\n`);
  } else {
    console.log(`\n\x1b[33mNo se encontraron fracturas activas en '${targetFile}'. El archivo mantiene simetría.\x1b[0m\n`);
  }
}

export async function runTrial(
  targetDir: string = '.',
  targetFile: string,
  proposedContent: string
): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const result = TransactionalHealer.simulateTrial(
    indexer.getSpace(),
    targetFile,
    proposedContent,
    root
  );
  console.log(`\n\x1b[1;35m${result.richDossierForAI}\x1b[0m\n`);
}

export async function runAutoHeal(
  targetDir: string = '.',
  fractureId: string,
  autoCommit: boolean = false
): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) indexer.indexDirectory({ rootDir: root });

  const result = await TransactionalHealer.autoHealFracture(
    indexer.getSpace(),
    fractureId,
    root,
    autoCommit
  );
  console.log(`\n\x1b[1;32m=== REPORTE DE AUTOCURACIÓN TRANSACCIONAL ===\x1b[0m`);
  console.log(`\x1b[1mMensaje:\x1b[0m ${result.message}`);
  console.log(`\x1b[1mEscrito en disco:\x1b[0m ${result.committedToDisk ? 'SÍ' : 'NO (Solo simulación en RAM)'}`);
  console.log(`\n\x1b[36m${result.trial.richDossierForAI}\x1b[0m\n`);
}

export async function runDiff(targetDir: string = '.', baseRef: string = 'HEAD'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[35m📐 Analizando Cizallamiento Diferencial 4D frente a '${baseRef}' en:\x1b[0m ${root}\n`);
  const report = DifferentialShearAnalyzer.analyzeDiff(root, baseRef);

  console.log(`========================================================================`);
  console.log(`💎 \x1b[1mINFORME DIFERENCIAL DE CIZALLAMIENTO 4D (DELTA SHEAR)\x1b[0m`);
  console.log(`========================================================================`);
  console.log(`  ● Veredicto de Seguridad: ${report.isSafe ? '\x1b[1;32mSAFE_TO_COMMIT\x1b[0m' : '\x1b[1;31mBLOCKED_BY_DIFF_SHEAR\x1b[0m'}`);
  console.log(`  ● Distancia Delta Shear:  \x1b[1m${report.deltaShearDistance}\x1b[0m (Umbral: 0.75)`);
  console.log(`  ● Archivos Modificados:   \x1b[1m${report.changedFiles.length}\x1b[0m`);
  console.log(`  ● Módulos Impactados:     \x1b[1m${report.impactedDependents.length}\x1b[0m`);
  console.log(`  ● Fracturas Introducidas: \x1b[1m${report.introducedFractures.length}\x1b[0m`);
  console.log(`========================================================================\n`);

  if (report.changedFiles.length > 0) {
    console.log(`\x1b[33mArchivos alterados en el árbol de trabajo:\x1b[0m`);
    report.changedFiles.forEach((f) => console.log(`  - ${f}`));
    console.log('');
  }

  if (report.introducedFractures.length > 0) {
    console.log(`\x1b[31mFracturas activas generadas por estos cambios:\x1b[0m`);
    for (const f of report.introducedFractures) {
      console.log(`  [${f.type}] ${f.source}: ${f.description}`);
    }
    console.log('');
  }

  console.log(`\x1b[1mRecomendación:\x1b[0m ${report.recommendation}\n`);

  if (!report.isSafe) {
    process.exit(1);
  }
}

export async function runHook(action: string = 'install', targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  if (action === 'install') {
    const res = DifferentialShearAnalyzer.installPreCommitHook(root);
    if (res.success) {
      console.log(`\x1b[1;32m✔ ${res.message}\x1b[0m`);
      console.log(`  Ruta: ${res.hookPath}\n`);
    } else {
      console.error(`\x1b[1;31m✖ Error: ${res.message}\x1b[0m\n`);
      process.exit(1);
    }
  } else {
    console.log('Uso: tesseract hook install [directorio]');
  }
}




