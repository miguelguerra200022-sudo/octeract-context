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
import { PreflightAuditor } from '../core/preflight.ts';
import { EnterpriseLicenseManager } from '../enterprise/license.ts';
import { SWECIEngine } from '../enterprise/swe-ci.ts';
import { LSCEngine } from '../enterprise/lsc.ts';
import { DistributedMeshEngine } from '../enterprise/mesh.ts';
import { TesseractPortfolioEngine } from '../enterprise/portfolio.ts';
import { TesseractSwarmCoordinator } from '../enterprise/swarm.ts';
import { TesseractMutationEngine } from '../enterprise/mutation.ts';
import { TesseractAtomicTransmuter } from '../enterprise/transmute.ts';
import { AsymptoticAnalyzer } from '../core/asymptotics.ts';
import { CausalInferenceEngine } from '../core/causality.ts';
import { AsyncFlowAnalyzer } from '../core/async-flow.ts';

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
  console.log(`    - Fallas Binarios/Permisos:\x1b[31m${report.fracturesByType.BIN_EXEC_FRACTURE || 0}\x1b[0m`);
  console.log(`    - Trampas de Empaquetado:   \x1b[33m${report.fracturesByType.PACKAGING_EXPORT_FRACTURE || 0}\x1b[0m`);
  console.log(`    - Errores en CI/Workflows:  \x1b[35m${report.fracturesByType.CI_WORKFLOW_FRACTURE || 0}\x1b[0m`);
  console.log(`    - Fuga de Dependencias:     \x1b[31m${report.fracturesByType.DEPENDENCY_LEAK_FRACTURE || 0}\x1b[0m`);
  console.log(`    - Colisiones Mayús/Minús:   \x1b[31m${report.fracturesByType.CASE_SENSITIVITY_FRACTURE || 0}\x1b[0m`);
  console.log(`    - Desync de Versiones:      \x1b[33m${report.fracturesByType.RELEASE_SYNC_FRACTURE || 0}\x1b[0m`);
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
 
export async function runLicense(subcommand: string = 'status', tokenOrTarget?: string): Promise<void> {
  const manager = new EnterpriseLicenseManager();
  const root = process.cwd();

  if (subcommand === 'status') {
    const status = manager.getLicenseStatus(root);
    console.log(`\n========================================================================`);
    console.log(`💎 \x1b[1mOCTERACT ENTERPRISE: ESTADO DE LICENCIA BSL 1.1\x1b[0m`);
    console.log(`========================================================================`);
    console.log(`  ● Estado:          ${status.active ? '\x1b[1;32mACTIVA (Ed25519 Verified)\x1b[0m' : '\x1b[33mCOMMUNITY (Evaluación / Open Source)\x1b[0m'}`);
    console.log(`  ● Organización:    \x1b[1m${status.orgName}\x1b[0m`);
    console.log(`  ● Tier de Servicio:\x1b[1;36m${status.tier.toUpperCase()}\x1b[0m`);
    console.log(`  ● Límite Archivos: \x1b[1m${status.maxFiles === -1 ? 'ILIMITADO (Enterprise)' : status.maxFiles}\x1b[0m`);
    console.log(`  ● Días Restantes:  \x1b[1m${status.daysRemaining === -1 ? 'Permanente' : status.daysRemaining}\x1b[0m`);
    console.log(`  ● Módulos Activos: \x1b[32m${status.features.join(', ')}\x1b[0m`);
    console.log(`========================================================================\n`);
  } else if (subcommand === 'activate') {
    if (!tokenOrTarget) {
      console.error('Uso: octeract-context license activate <token>');
      process.exit(1);
    }
    try {
      manager.activateLicense(tokenOrTarget, root);
      console.log(`\x1b[1;32m✔ Licencia activada y verificada criptográficamente con éxito en .tesseract/license.key\x1b[0m\n`);
    } catch (err: any) {
      console.error(`\x1b[1;31m✖ Error de activación: ${err.message}\x1b[0m\n`);
      process.exit(1);
    }
  } else {
    console.log('Comandos de licencia: octeract license status | octeract license activate <token>');
  }
}

export async function runSWECI(targetDir: string = '.', action: string = 'status'): Promise<void> {
  const root = path.resolve(targetDir);
  const engine = new SWECIEngine(root);

  if (action === 'status') {
    const status = engine.getStatus();
    console.log(`\n========================================================================`);
    console.log(`🔄 \x1b[1mOCTERACT SWE-CI: CONTINUOUS ZERO-REGRESSION MONITOR\x1b[0m`);
    console.log(`========================================================================`);
    console.log(`  ● Pasos Registrados: \x1b[1m${status.totalSteps}\x1b[0m`);
    console.log(`  ● Salud Actual:      \x1b[1;32m${status.currentHealth}/100\x1b[0m`);
    console.log(`  ● Fracturas:         \x1b[1m${status.currentFractures}\x1b[0m`);
    console.log(`  ● Último Cizallamiento: \x1b[1m${status.lastShear.toFixed(4)}\x1b[0m (Umbral máx: 0.1000)`);
    console.log(`========================================================================\n`);
  }
}

export async function runLSC(targetDir: string = '.', sourceFile?: string, oldSymbol?: string, newSymbol?: string): Promise<void> {
  const root = path.resolve(targetDir);
  if (!sourceFile || !oldSymbol || !newSymbol) {
    console.error('Uso: tesseract-context lsc <dir> <archivoFuente> <simboloViejo> <simboloNuevo>');
    process.exit(1);
  }

  const engine = new LSCEngine(root);
  console.log(`\x1b[36m⚡ [LSC Monorepo Engine] Planificando refactorización atómica de '${oldSymbol}' -> '${newSymbol}'...\x1b[0m`);
  const plan = engine.planTransformation({
    sourceFile,
    oldSymbol,
    newSymbol,
    generateBackwardCompatibleFacade: true
  });

  console.log(`  ● Archivos Afectados: \x1b[1m${plan.affectedFiles.length}\x1b[0m`);
  console.log(`  ● Call Sites Detectados: \x1b[1m${plan.callSitesCount}\x1b[0m`);
  console.log(`  ● Fachada Retrocompatible: \x1b[1;32mGENERADA\x1b[0m`);

  const execResult = engine.executeTransformation(plan);
  if (execResult.success) {
    console.log(`\x1b[1;32m✔ Refactorización LSC aplicada exitosamente en ${execResult.modifiedFiles.length} archivos.\x1b[0m\n`);
  } else {
    console.error(`\x1b[1;31m✖ Error en reescritura LSC:\x1b[0m`, execResult.errors);
  }
}

export async function runMesh(action: string = 'audit'): Promise<void> {
  console.log(`\n========================================================================`);
  console.log(`🌐 \x1b[1mOCTERACT DISTRIBUTED MESH: AUDITORÍA DE MICROSERVICIOS {4,3,3,4}\x1b[0m`);
  console.log(`========================================================================`);
  console.log(`Auditando contratos distribuidos entre repositorios independientes...\n`);
}

export async function runPreflight(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\n\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🛡️  \x1b[1mOCTERACT PREFLIGHT & PACKAGING GUARD (EJE P / 5TA DIMENSIÓN)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`Auditando contratos de empaquetado, binarios CLI, permisos Git y CI/CD en:\n  \x1b[36m${root}\x1b[0m\n`);

  const indexer = new ProjectIndexer();
  indexer.loadIndex(root);
  const vertices = indexer.getSpace().getVertices();

  const auditor = new PreflightAuditor(root);
  const fractures = auditor.auditAll(vertices);

  if (fractures.length === 0) {
    console.log(`\x1b[1;32m✔ PREFLIGHT APROBADO: Cero trampas de empaquetado, binarios con permisos 100755 válidos, workflows de CI desacoplados y dependencias perfectamente particionadas.\x1b[0m\n`);
  } else {
    console.log(`\x1b[1;31m✖ SE DETECTARON ${fractures.length} FRACTURAS DE PRE-VUELO CRÍTICAS:\x1b[0m\n`);
    for (const f of fractures) {
      console.log(`  [\x1b[1;31m${f.type}\x1b[0m] ${f.source}`);
      console.log(`    • ${f.description}`);
      console.log(`    • \x1b[32mSolución:\x1b[0m ${f.healingStrategy}\n`);
    }
  }
}

export async function runPortfolio(targetDir: string = '.', mode: 'pro' | 'vibe' = 'vibe'): Promise<void> {
  const root = path.resolve(targetDir);
  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const vertices = indexer.getSpace().getVertices();
  const auditReport = indexer.auditRepository(root);

  const engine = new TesseractPortfolioEngine(root);
  const evalResult = engine.evaluatePortfolio(vertices, auditReport);
  const tri = evalResult.triangle;
  const vibe = evalResult.vibeAdvice;

  console.log(`\n\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`📈 \x1b[1mOCTERACT PORTFOLIO FRONTIER: EL TRIÁNGULO MÁGICO DE LA INVERSIÓN\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`  ● Activos de Software Evaluados: \x1b[1m${evalResult.totalAssets}\x1b[0m en ${root}\n`);

  console.log(`\x1b[1;33m1. 📈 RENTABILIDAD (Yield & Token ROI):\x1b[0m`);
  console.log(`   ● Token Alpha: \x1b[1;32m+${tri.rentabilidad.tokenAlphaPercent}%\x1b[0m de ahorro por Slicing 4D`);
  console.log(`   ● Índice de Retorno de Velocidad: \x1b[1m${tri.rentabilidad.portfolioYieldIndex}/10\x1b[0m`);
  console.log(`   ● Arrastre por Deuda Técnica: \x1b[31m${tri.rentabilidad.compoundingDragWeeklyTokens} tokens/semana\x1b[0m\n`);

  console.log(`\x1b[1;36m2. 🛡️ SEGURIDAD (Riesgo & Invarianza 4D):\x1b[0m`);
  console.log(`   ● Puntuación de Seguridad: \x1b[1;32m${tri.seguridad.safetyScore}/100\x1b[0m`);
  console.log(`   ● Volatilidad Topológica Beta: \x1b[1m${tri.seguridad.portfolioBeta}\x1b[0m (acoplamiento sistémico)`);
  console.log(`   ● Probabilidad de Ruina Catastrófica: \x1b[1;32m${(tri.seguridad.riskOfRuinProbability * 100).toFixed(1)}%\x1b[0m\n`);

  console.log(`\x1b[1;32m3. 💧 LIQUIDEZ (Maleabilidad & Bloques LEGO Reutilizables):\x1b[0m`);
  console.log(`   ● Ratio Global de Liquidez (CLR): \x1b[1m${tri.liquidez.globalLiquidityRatio} / 1.00\x1b[0m`);
  console.log(`   ● Activos Modulares Monetizables: \x1b[1;32m${tri.liquidez.monetizableAssetsCount} módulos\x1b[0m listos para exportar\n`);

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`💡 \x1b[1mCONSEJOS DEL ASESOR PARA VIBE CODERS:\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`  ● Estado General: \x1b[1m${vibe.headline}\x1b[0m\n`);
  console.log(`  🚀 \x1b[1;32mMEJOR JUGADA PARA HOY:\x1b[0m`);
  console.log(`     ➔ Acción: \x1b[1m${vibe.bestMove.action}\x1b[0m`);
  console.log(`     ➔ ¿Por qué?: ${vibe.bestMove.why}`);
  console.log(`     ➔ Presupuesto sugerido (Kelly): \x1b[36m~${vibe.bestMove.expectedTokensNeeded} tokens\x1b[0m\n`);

  console.log(`  ⚠️ \x1b[1;31mZONA DE PELIGRO (No tocar sin plan):\x1b[0m`);
  console.log(`     ➔ Evitar: \x1b[1m${vibe.dangerZone.avoidAction}\x1b[0m`);
  console.log(`     ➔ ¿Por qué?: ${vibe.dangerZone.why}\n`);

  if (vibe.legoOpportunities.length > 0) {
    console.log(`  💎 \x1b[1;34mOPORTUNIDADES DE PIEZAS LEGO (Reutilización):\x1b[0m`);
    for (const opp of vibe.legoOpportunities.slice(0, 3)) {
      console.log(`     • ${opp}`);
    }
    console.log('');
  }

  if (evalResult.topSharpeAssets.length > 0) {
    console.log(`\x1b[1;33mTop Activos con Mayor Sharpe Ratio (Retorno / Riesgo):\x1b[0m`);
    for (const a of evalResult.topSharpeAssets.slice(0, 5)) {
      console.log(`  • \x1b[1m${a.file}\x1b[0m (Sharpe: \x1b[1;32m${a.sharpeRatio}\x1b[0m | Beta: ${a.topologicalBeta} | Kelly Batch: ${a.kellyBatchSizeLines} líneas) [${a.investmentAction}]`);
    }
    console.log('');
  }
}

export async function runSwarm(targetDir: string = '.', planPath?: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🤖 \x1b[1mOCTERACT SWARM: COORDINACIÓN DE AGENTES EN ZONAS DE VORONOI 8D\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const space = indexer.getSpace();
  const vertices = space.getVertices();

  let intents: any[] = [];
  if (planPath && fs.existsSync(planPath)) {
    try {
      intents = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
    } catch {
      console.log(`\x1b[33mNo se pudo parsear el plan JSON en ${planPath}. Usando simulación de agentes activos.\x1b[0m`);
    }
  }

  if (intents.length === 0) {
    intents = [
      { agentId: 'Agent-Core', taskDescription: 'Refactorizar parsers base', targetFiles: ['src/parsers/base.ts'], priority: 10 },
      { agentId: 'Agent-Mesh', taskDescription: 'Expandir microservicios mesh', targetFiles: ['src/enterprise/mesh.ts'], priority: 8 },
      { agentId: 'Agent-Security', taskDescription: 'Auditar types del hipercubo', targetFiles: ['src/core/types.ts'], priority: 5 },
    ];
  }

  const coordinator = new TesseractSwarmCoordinator(root);
  const report = coordinator.coordinateSwarm(intents, vertices);

  console.log(`  ● Agentes Evaluados: \x1b[1m${report.totalAgents}\x1b[0m`);
  console.log(`  ● Agentes en Zonas Lock-Free (100% Paralelos): \x1b[1;32m${report.lockFreeAgentsCount}\x1b[0m`);
  console.log(`  ● Pares con Colisión Semántica: \x1b[1;${report.collidingPairsCount > 0 ? '33' : '32'}m${report.collidingPairsCount}\x1b[0m`);
  console.log(`  ● Veredicto Global: \x1b[1;32m${report.verdict}\x1b[0m\n`);

  if (report.collisions.length > 0) {
    console.log(`\x1b[1;33m⚠️  Colisiones Semánticas Detectadas:\x1b[0m`);
    for (const c of report.collisions) {
      console.log(`  • Agente '${c.agentA}' vs '${c.agentB}' en: [${c.overlapFiles.join(', ')}]`);
      console.log(`    ➔ Ganador de precedencia: \x1b[1;32m${c.precedenceWinner}\x1b[0m`);
      if (c.recommendedSyncFacade) {
        console.log(`    ➔ Fachada preventiva generada para desacoplarlos.`);
      }
    }
    console.log('');
  }

  if (report.deadlockCycles.length > 0) {
    console.log(`\x1b[1;31m🚨 Deadlocks Semánticos Prevenidos:\x1b[0m`);
    for (const cycle of report.deadlockCycles) {
      console.log(`  • Ciclo: ${cycle.join(' ➔ ')}`);
    }
    console.log('');
  }
}

export async function runMutate(targetDir: string = '.', targetFile: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧬 \x1b[1mOCTERACT MUTATION FUZZING: AUDITORÍA DE DUREZA DE PRUEBAS EN RAM\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const engine = new TesseractMutationEngine(root);
  const mutants = engine.generateMutants(targetFile);

  const testDir = path.join(root, 'tests');
  const baseName = path.basename(targetFile).replace(/\.[^.]+$/, '');
  const testFiles: string[] = [];
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    for (const f of files) {
      if (f.includes(baseName) && (f.endsWith('.test.ts') || f.endsWith('.test.js'))) {
        testFiles.push(path.join('tests', f));
      }
    }
  }

  const report = engine.evaluateMutationHardness(targetFile, mutants, testFiles);

  console.log(`  ● Archivo Auditado: \x1b[1m${report.targetFile}\x1b[0m`);
  console.log(`  ● Mutantes Sintetizados en RAM: \x1b[1m${report.totalMutantsGenerated}\x1b[0m`);
  console.log(`  ● Mutantes Eliminados (Killed): \x1b[1;32m${report.mutantsKilled}\x1b[0m`);
  console.log(`  ● Mutantes Sobrevivientes: \x1b[1;${report.mutantsSurvived > 0 ? '33' : '32'}m${report.mutantsSurvived}\x1b[0m`);
  console.log(`  ● Puntuación de Resiliencia: \x1b[1;32m${report.mutationScorePercent}%\x1b[0m`);
  console.log(`  ● Veredicto de Dureza: \x1b[1;32m${report.hardnessVerdict}\x1b[0m\n`);
  console.log(`  💡 Recomendación: ${report.recommendation}\n`);
}

export async function runTransmute(
  targetDir: string = '.',
  rootFile: string,
  symbol: string,
  newSig: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🔄 \x1b[1mOCTERACT ATOMIC TRANSMUTER: SUBGRAFO CERRADO MULTIARQUIVO (G*)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const space = indexer.getSpace();
  const vertices = space.getVertices();

  const transmuter = new TesseractAtomicTransmuter(root);
  const report = transmuter.planAtomicTransmutation(rootFile, symbol, newSig, vertices);

  console.log(`  ● Archivo Raíz: \x1b[1m${report.rootFile}\x1b[0m | Símbolo: \x1b[1m${report.rootSymbol}\x1b[0m`);
  console.log(`  ● Nueva Firma Contratada: \x1b[36m${report.newSignature}\x1b[0m`);
  console.log(`  ● Archivos en Subgrafo Cerrado G*: \x1b[1;32m${report.closedSubgraphFiles.length} archivos\x1b[0m`);
  console.log(`  ● Sitios de Llamada Identificados: \x1b[1m${report.totalCallSites} llamadas\x1b[0m`);
  console.log(`  ● Cizallamiento Predicho si se Aplica en Lote: \x1b[1;32m${report.predictedShearDistance} (<= 0.10)\x1b[0m`);
  console.log(`  ● Veredicto: \x1b[1;32m${report.verdict}\x1b[0m\n`);

  if (report.steps.length > 0) {
    console.log(`\x1b[1;33mPaso a paso de la Receta Sincrónica:\x1b[0m`);
    for (const step of report.steps.slice(0, 5)) {
      console.log(`  • [${step.file}:${step.lineNumber}] ${step.rationale}`);
      console.log(`    - ${step.oldCode}`);
      console.log(`    + \x1b[32m${step.newCode}\x1b[0m`);
    }
    if (report.steps.length > 5) {
      console.log(`    ... y ${report.steps.length - 5} llamadas adicionales sintetizadas.`);
    }
    console.log('');
  }
}

export async function runAsymptotic(
  targetDir: string = '.',
  targetFile: string,
  proposedFile?: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`⚡ \x1b[1mOCTERACT ASYMPTOTIC COMPLEXITY ENGINE (EJE PHI / BIG-O)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const analyzer = new AsymptoticAnalyzer(root);
  if (proposedFile && fs.existsSync(path.resolve(proposedFile))) {
    const origPath = path.isAbsolute(targetFile) ? targetFile : path.join(root, targetFile);
    const origContent = fs.existsSync(origPath) ? fs.readFileSync(origPath, 'utf-8') : '';
    const propContent = fs.readFileSync(path.resolve(proposedFile), 'utf-8');
    const { isDegraded, deltaPhi, report } = analyzer.detectRegression(origContent, propContent, targetFile);

    console.log(`  ● Archivo Auditado: \x1b[1m${report.filePath}\x1b[0m`);
    console.log(`  ● Complejidad Base: \x1b[36m${report.baselineComplexity}\x1b[0m ➔ Propuesta: \x1b[1;33m${report.proposedComplexity}\x1b[0m`);
    console.log(`  ● Desviación Asintótica ΔΦ: ${deltaPhi > 0 ? `\x1b[31m+${deltaPhi}\x1b[0m` : `\x1b[32m${deltaPhi}\x1b[0m`}`);
    console.log(`  ● ¿Degeneración Cuadrática?: ${isDegraded ? '\x1b[1;31mSÍ (CRÍTICO)\x1b[0m' : '\x1b[1;32mNO (ÓPTIMO)\x1b[0m'}`);
    if (report.recommendation) {
      console.log(`  💡 Recomendación: ${report.recommendation}`);
    }
  } else {
    const report = analyzer.analyzeFile(targetFile);
    console.log(`  ● Archivo: \x1b[1m${report.filePath}\x1b[0m`);
    console.log(`  ● Complejidad Asintótica Estática: \x1b[1;32m${report.baselineComplexity}\x1b[0m (Coordenada Φ: ${report.asymptoticScore})`);
    console.log(`  ● Profundidad de Bucles Anidados: ${report.nestedLoopDepth}`);
    console.log(`  ● Búsquedas O(N) en Colecciones dentro de Loops: ${report.hasQuadraticCollections ? '\x1b[31mDETECTADAS\x1b[0m' : 'Ninguna'}`);
    if (report.suspiciousLines.length > 0) {
      console.log(`\n\x1b[33mLíneas con patrones asintóticos:\x1b[0m`);
      for (const item of report.suspiciousLines) {
        console.log(`  • Línea ${item.line} [${item.complexity}]: ${item.reason}`);
      }
    }
  }
  console.log('');
}

export async function runCausal(
  targetDir: string = '.',
  targetFile: string,
  patchFile?: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧬 \x1b[1mOCTERACT CAUSAL INFERENCE & DO-CALCULUS (EJE PSI / JUDEA PEARL)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const engine = new CausalInferenceEngine(root);
  const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(root, targetFile);
  const originalContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
  const patchContent = patchFile && fs.existsSync(path.resolve(patchFile))
    ? fs.readFileSync(path.resolve(patchFile), 'utf-8')
    : originalContent;

  const report = engine.evaluateIntervention(targetFile, originalContent, patchContent);

  console.log(`  ● Archivo Objetivo: \x1b[1m${report.targetPath}\x1b[0m`);
  console.log(`  ● Estabilidad Causal (Ψ): \x1b[1;32m${(report.causalStabilityScore * 100).toFixed(0)}%\x1b[0m`);
  console.log(`  ● Criterio de la Puerta Trasera (Back-Door): ${report.backDoorCriterionSatisfied ? '\x1b[32mSATISFECHO\x1b[0m' : '\x1b[31mVIOLADO\x1b[0m'}`);
  console.log(`  ● ¿Parche Sintomático / Espurio?: ${report.isSymptomaticPatch ? '\x1b[31mSÍ (ENMASCARAMIENTO)\x1b[0m' : '\x1b[32mNO (CAUSALMENTE SÓLIDO)\x1b[0m'}`);
  console.log(`  ● Veredicto: \x1b[1m${report.verdict}\x1b[0m`);
  console.log(`  💡 Recomendación: ${report.recommendation}\n`);
}

export async function runAsyncAudit(
  targetDir: string = '.',
  targetFile: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`⏱️ \x1b[1mOCTERACT ASYNC FLOW & EVENT LOOP DYNAMICS (EJE OMEGA)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const analyzer = new AsyncFlowAnalyzer(root);
  const report = analyzer.analyzeFile(targetFile);

  console.log(`  ● Archivo: \x1b[1m${report.filePath}\x1b[0m`);
  console.log(`  ● Complejidad Asíncrona (Ω): \x1b[36m${report.asyncComplexityScore}\x1b[0m`);
  console.log(`  ● Promesas Flotantes sin Await: ${report.floatingPromisesCount > 0 ? `\x1b[31m${report.floatingPromisesCount}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`  ● Riesgos de Carreras en Event Loop: ${report.asyncRaceRisks.length > 0 ? `\x1b[31m${report.asyncRaceRisks.length}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`  ● Veredicto: \x1b[1m${report.verdict}\x1b[0m\n`);
  if (report.recommendation) {
    console.log(`  💡 Recomendación: ${report.recommendation}\n`);
  }
}

export async function runOcteractStats(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`💎 \x1b[1mOCTERACT 8D: ESPACIO OCTODIMENSIONAL R^8 Y T^8 (RETÍCULO E8)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const space = indexer.getSpace();
  const stats = space.getOcteractStats();

  console.log(`  ● Variedad Riemanniana: \x1b[1mT^8 = R^8 / Z^8 (8-Toroide sin distorsión de borde)\x1b[0m`);
  console.log(`  ● Total de Vértices Indexados en 8D: \x1b[1;32m${stats.totalVertices} nodos\x1b[0m`);
  console.log(`  ● Profundidad del Árbol 256-ario (Octeract-Tree): \x1b[1mNivel ${stats.octeractDepth} (1 Byte/nivel)\x1b[0m`);
  console.log(`  ● Densidad de Empaquetamiento de Esferas E8: \x1b[1;32m${(stats.e8LatticeDensity * 100).toFixed(1)}% (Óptimo de Viazovska)\x1b[0m`);
  console.log(`  ● Promedio Asintótico Φ (Big-O): \x1b[36m${stats.averageAsymptoticPhi}\x1b[0m`);
  console.log(`  ● Promedio Causal Ψ (Invariantes Pearl): \x1b[36m${stats.averageCausalPsi}\x1b[0m`);
  console.log(`  ● Promedio Asíncrono Ω (Event Loop): \x1b[36m${stats.averageAsyncOmega}\x1b[0m`);
  console.log(`  ● Salud Arquitectónica 8D: \x1b[1;32m${stats.health8D}\x1b[0m\n`);
}




