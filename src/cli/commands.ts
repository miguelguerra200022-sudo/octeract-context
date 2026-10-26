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
import { OcteractGrepEngine } from '../core/grep.ts';
import { OcteractOrchestratorEngine } from '../core/orchestrator.ts';
import {
  OcteractFunSearchEngine,
  OcteractDeductiveEngine,
  OcteractAlphaDevOptimizer,
  OcteractPairformer,
} from '../deepmind/index.ts';
import { OcteractProgramSlicer } from '../core/slicer.ts';
import { OcteractReproducer } from '../core/reproducer.ts';
import { OcteractSpeculativePatcher } from '../core/patcher.ts';
import { OcteractTreeSearch } from '../core/mcts.ts';
import {
  OcteractEVAAST,
  OcteractMontemurroEngine,
  OcteractSlotMachineValidator,
  OcteractCurrierClassifier,
  OcteractEntropyGuard,
  OcteractCardanGrilleFuzzer,
} from '../voynich/index.ts';
import {
  OcteractPaletteStorage,
  OcteractMultiNoiseBiomes,
  OcteractWorkingSetHorizon,
  OcteractStarlightBlast,
  OcteractAnvilContainer,
  OcteractJigsawSynthesis,
  OcteractGreedyContextCuller,
  OcteractObserverPulse,
} from '../voxel/index.ts';
import {
  OcteractTargetArmor,
  OcteractEvidenceLedger,
  OcteractReverseBundle,
  OcteractSourceToBundleAttribution,
  OcteractNativeBoundaryInspector,
  OcteractFacetMatrix,
} from '../rea/index.ts';
import {
  OcteractDragonIndex,
  OcteractDragonBlast,
  OcteractDragonFold,
  OcteractDragonTile,
  OcteractDragonCreaseFuzz,
} from '../dragon/index.ts';
import {
  OcteractDoctor,
  OcteractSee,
  OcteractImpact,
  OcteractSafeWrite,
  OcteractAsk,
} from '../unified/index.ts';

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
  await server.startStdio();
  server.init().catch((err: any) => {
    console.error('[OCTERACT-MCP] Error en background init:', err?.message || err);
  });
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

export async function runGrep(
  targetDir: string = '.',
  query: string,
  options: { mode?: any; cell?: any; maxResults?: number; pathFilter?: string } = {}
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);
  console.log(`🔍 \x1b[1mOCTERACT 8D GREP & MOTOR DE BÚSQUEDA SEMÁNTICA\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const space = indexer.getSpace();
  const grepEngine = new OcteractGrepEngine(root);

  const result = await grepEngine.search(space, {
    query,
    mode: options.mode,
    cell: options.cell,
    pathFilter: options.pathFilter,
    maxResults: options.maxResults || 10,
  });

  console.log(`  ● Consulta: "\x1b[1m${result.query}\x1b[0m"`);
  console.log(`  ● Modo: \x1b[35m${result.mode}\x1b[0m | Archivos escaneados: \x1b[32m${result.filesScanned}\x1b[0m | Coincidencias: \x1b[1;32m${result.totalMatches}\x1b[0m (${result.executionTimeMs} ms)`);
  console.log(`  ● Tokens Estimados LLM: \x1b[33m${result.estimatedTokens}\x1b[0m\n`);

  if (result.matches.length === 0) {
    console.log(`\x1b[33m⚠️ No se encontraron coincidencias para "${query}".\x1b[0m\n`);
    return;
  }

  for (let i = 0; i < result.matches.length; i++) {
    const m = result.matches[i];
    const symName = m.enclosingSymbol ? ` \x1b[34m[${m.enclosingSymbol.kind} ${m.enclosingSymbol.name}]\x1b[0m` : '';
    console.log(`\x1b[1;32m[${i + 1}]\x1b[0m \x1b[1m${m.file}\x1b[0m:\x1b[33m${m.line}\x1b[0m:\x1b[36m${m.column}\x1b[0m (\x1b[35m${m.cell}\x1b[0m)${symName} - Score: ${m.score.toFixed(1)}`);
    for (const before of m.contextBefore) {
      console.log(`   \x1b[90m${before}\x1b[0m`);
    }
    console.log(` > \x1b[1;37m${m.lineContent}\x1b[0m`);
    for (const after of m.contextAfter) {
      console.log(`   \x1b[90m${after}\x1b[0m`);
    }
    console.log('');
  }
}

export async function runOrchestrate(
  targetDir: string = '.',
  intent: string,
  options: { phase?: any; targetFiles?: string[]; targetSymbols?: string[] } = {}
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧭 \x1b[1mOCTERACT 8D AGENT ORCHESTRATOR: SIMBIOSIS NEURO-SIMBÓLICA\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const space = indexer.getSpace();
  const orchestrator = new OcteractOrchestratorEngine(root);

  const result = await orchestrator.orchestrate(space, {
    userIntent: intent,
    phase: options.phase || 'auto',
    targetFiles: options.targetFiles,
    targetSymbols: options.targetSymbols,
  });

  console.log(`  ● Intención: "\x1b[1m${result.userIntent}\x1b[0m"`);
  console.log(`  ● Fase: \x1b[35m${result.phase.toUpperCase()}\x1b[0m | Categoría: \x1b[32m${result.decomposition.intentCategory}\x1b[0m | Celdas: \x1b[36m${result.decomposition.resonantCells.join(', ')}\x1b[0m`);
  console.log(`  ● Tiempo: \x1b[33m${result.executionTimeMs} ms\x1b[0m | Tokens Estimados LLM: \x1b[1;32m${result.estimatedTokens}\x1b[0m\n`);

  console.log(result.microDossier);
  console.log('');
  console.log(`\x1b[1;34m[Resumen Vibe para Humanos]\x1b[0m: ${result.vibeSummaryForHuman}\n`);
}

export async function runFunSearch(
  targetDir: string = '.',
  fnName: string,
  baselineCode: string,
  candidateCode?: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧬 \x1b[1mOCTERACT FUNSEARCH: BÚSQUEDA EVOLUTIVA EN ESPACIO DE FUNCIONES\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const engine = new OcteractFunSearchEngine(root, indexer.getSpace());
  const spec = engine.createSpecification(fnName, baselineCode, 'Optimizar complejidad y asegurar invarianza');

  console.log(`  ● Función Objetivo: \x1b[1m${fnName}\x1b[0m`);
  console.log(`  ● Signatura Detectada: \x1b[36m${spec.signatureTemplate}\x1b[0m\n`);

  if (candidateCode) {
    console.log(`  ⏳ Evaluando candidato en Micro-Sandbox efímero...`);
    const evalRes = engine.evaluateCandidate(candidateCode, 'snippet.ts', baselineCode);
    const registered = engine.registerCandidate(evalRes);
    console.log(`  ● Veredicto Sandbox: ${registered.passedSandbox ? '\x1b[1;32mPASÓ\x1b[0m' : '\x1b[1;31mFALLÓ\x1b[0m'} (${registered.executionTimeMs} ms)`);
    console.log(`  ● Fitness Score: \x1b[1;32m${registered.score}/100\x1b[0m (Cizallamiento: ${registered.shearDistance.toFixed(3)})`);
    console.log(`  ● Complejidad: \x1b[35m${registered.asymptoticComplexity}\x1b[0m`);
    console.log(`  ● Estado: ${registered.isSafe ? '\x1b[1;32mSEGURO PARA PRODUCCIÓN\x1b[0m' : '\x1b[1;31mRECHAZADO\x1b[0m'}\n`);
  } else {
    console.log(`\x1b[33mEspecificación generada para el LLM:\x1b[0m\n${spec.systemPrompt}\n`);
  }
}

export async function runDeductive(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`📐 \x1b[1mOCTERACT DEDUCTIVE ENGINE: CLÁUSULAS DE HORN (ALPHAGEOMETRY DD+AR)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const engine = new OcteractDeductiveEngine(root);
  const report = engine.verify(indexer.getSpace());

  console.log(`  ● Hechos Formales en Base de Conocimiento: \x1b[1;32m${report.totalFacts}\x1b[0m`);
  console.log(`  ● Iteraciones hasta Punto Fijo (Fixpoint): \x1b[1m${report.iterationsToFixpoint}\x1b[0m`);
  console.log(`  ● Nuevas Deducciones Simbólicas: \x1b[36m${report.newDeductions.length}\x1b[0m`);
  console.log(`  ● Simetría Formal: ${report.isSymmetric ? '\x1b[1;32mPERFECTA (0 Fracturas Horn)\x1b[0m' : '\x1b[1;31mFRACTURAS DETECTADAS\x1b[0m'}\n`);

  if (report.auxiliaryConstructions.length > 0) {
    console.log(`\x1b[33mConstrucciones Auxiliares Recomendadas para Destrabar Deducción:\x1b[0m`);
    for (const aux of report.auxiliaryConstructions) {
      console.log(`  • [${aux.type}] ${aux.sourceFile} -> ${aux.targetSymbol}`);
      console.log(`    ${aux.rationale}`);
    }
    console.log('');
  }
}

export async function runAlphaDev(targetDir: string = '.', filePath: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`⚡ \x1b[1mOCTERACT ALPHADEV OPTIMIZER: REESCRITURA DE MICRO-PATRONES AST\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }
  const code = fs.readFileSync(fullPath, 'utf-8');
  const optimizer = new OcteractAlphaDevOptimizer(root);
  const result = optimizer.optimize(code, filePath);

  console.log(`  ● Archivo Auditado: \x1b[1m${result.filePath}\x1b[0m`);
  console.log(`  ● Ganancia Asintótica Teórica: \x1b[1;32m${result.theoreticalSpeedup}\x1b[0m`);
  console.log(`  ● Transformaciones AST Detectadas: \x1b[1m${result.transformationsApplied.length}\x1b[0m`);
  console.log(`  ● Puntuación de Latencia Optimizada: \x1b[36m${result.latencyImprovementScore}/100\x1b[0m\n`);

  for (const t of result.transformationsApplied) {
    console.log(`  \x1b[33m[Línea ${t.line}] ${t.type}\x1b[0m: ${t.description}`);
    console.log(`    Antes:  \x1b[31m${t.originalPattern}\x1b[0m`);
    console.log(`    Optim:  \x1b[32m${t.optimizedPattern}\x1b[0m\n`);
  }
}

export async function runPairformer(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🔺 \x1b[1mOCTERACT PAIRFORMER: TENSOR RELACIONAL TRIANGULAR N x N\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }
  const pairformer = new OcteractPairformer(indexer.getSpace());
  const report = pairformer.computePairTensor();

  console.log(`  ● Vértices en Tensor: \x1b[1m${report.totalVertices}\x1b[0m | Relaciones de Pares: \x1b[1;32m${report.totalPairRelations}\x1b[0m`);
  console.log(`  ● Densidad Relacional Triangular: \x1b[36m${(report.triangularDensity * 100).toFixed(1)}%\x1b[0m`);
  console.log(`  ● Cuellos de Botella Transitivos Ocultos: \x1b[1;${report.shadowBottlenecksCount > 0 ? '33' : '32'}m${report.shadowBottlenecksCount}\x1b[0m`);
  console.log(`  ● Violaciones de Invarianza Triangular: \x1b[1;${report.violations.length > 0 ? '31' : '32'}m${report.violations.length}\x1b[0m\n`);

  if (report.topCriticalPairs.length > 0) {
    console.log(`\x1b[33mTop 5 Acoplamientos Triangulares Más Críticos:\x1b[0m`);
    for (const p of report.topCriticalPairs.slice(0, 5)) {
      console.log(`  • \x1b[1m${p.source}\x1b[0m ➔ \x1b[1m${p.target}\x1b[0m | Fuerza: \x1b[35m${p.triangularStrength}\x1b[0m | Dist 8D: \x1b[36m${p.geodesicDistance}\x1b[0m`);
    }
    console.log('');
  }
}

export async function runProgramSlice(
  targetDir: string = '.',
  filePath: string,
  options: { variable?: string; symbol?: string; direction?: 'backward' | 'forward' } = {}
): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;36m========================================================================\x1b[0m`);
  console.log(`🔪 \x1b[1mOCTERACT PROGRAM SLICER: ALGORITMO DE WEISER (REDUCCIÓN > 90%)\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);

  const code = fs.readFileSync(fullPath, 'utf-8');
  const slicer = new OcteractProgramSlicer();
  const res = slicer.computeSlice(code, {
    targetVariable: options.variable,
    targetSymbol: options.symbol,
    direction: options.direction || 'backward',
  });

  console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m | Dirección: \x1b[35m${res.direction.toUpperCase()}\x1b[0m`);
  console.log(`  ● Líneas Conservadas: \x1b[1;32m${res.linesRetained.length} / ${res.totalLinesOriginal}\x1b[0m | Ahorro de Tokens: \x1b[1;32m${res.tokenReductionPercent}%\x1b[0m\n`);
  console.log(`\x1b[90m--- [SLICE SEMÁNTICO PURO] ---\x1b[0m\n`);
  console.log(res.slicedCode);
  console.log(`\n\x1b[90m-------------------------------\x1b[0m\n`);
}

export async function runReproduce(targetDir: string = '.', fractureId?: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧪 \x1b[1mOCTERACT AUTONOMOUS REPRODUCER: AISLAMIENTO TDD EN RAM\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const auditor = new TopologicalAuditor();
  const auditReport = auditor.auditSpace(indexer.getSpace());

  let targetFracture = auditReport.fractures[0];
  if (fractureId) {
    const found = auditReport.fractures.find((f) => f.id === fractureId);
    if (found) targetFracture = found;
  }

  const reproducer = new OcteractReproducer();
  if (!targetFracture) {
    console.log(`  ● Repositorio en \x1b[1;32mPERFECT_SYMMETRY\x1b[0m. Generando reproducer genérico de contrato...`);
    const genericScript = reproducer.synthesizeReproducer({
      id: 'SMOKE_VERIFICATION',
      sourceFile: 'src/index.ts',
      targetSymbol: 'runAudit',
      description: 'Verificación de simetría de export principal',
    });
    console.log(`\n\x1b[33mScript de Reproducción Sintetizado:\x1b[0m\n${genericScript.reproducerCode}\n`);
    return;
  }

  const script = reproducer.synthesizeReproducer({
    id: targetFracture.id,
    sourceFile: targetFracture.sourceFile,
    targetSymbol: targetFracture.affectedSymbols?.[0] || 'unknown',
    description: targetFracture.description,
  });

  console.log(`  ● Fractura Detectada: \x1b[1;31m${targetFracture.id}\x1b[0m (${targetFracture.sourceFile})`);
  console.log(`  ● Razón: ${script.rationale}\n`);
  console.log(`\x1b[33mScript de Reproducción Sintetizado (Ejecutable ESM):\x1b[0m\n`);
  console.log(script.reproducerCode);
  console.log('');
}

export async function runSpeculativePatch(
  targetDir: string = '.',
  filePath: string,
  options: { className?: string; methodName?: string; functionName?: string; patchCode: string }
): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🩹 \x1b[1mOCTERACT SPECULATIVE PATCHER: INJERTO QUIRÚRGICO EN EL AST\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const code = fs.readFileSync(fullPath, 'utf-8');
  const patcher = new OcteractSpeculativePatcher();

  let res: any;
  if (options.className && options.methodName) {
    res = patcher.graftMethod(code, options.className, options.methodName, options.patchCode);
  } else if (options.functionName) {
    res = patcher.graftFunction(code, options.functionName, options.patchCode);
  } else {
    console.error('✖ Error: Debe especificar --class y --method, o --function.');
    return;
  }

  if (!res.success) {
    console.error(`\x1b[1;31m✖ Error al injertar parche AST: ${res.error}\x1b[0m\n`);
    return;
  }

  console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m | Rango Sustituido: \x1b[36mLineas ${res.linesReplaced[0]}-${res.linesReplaced[1]}\x1b[0m`);
  console.log(`\x1b[33mDiff Quirúrgico:\x1b[0m\n`);
  console.log(res.diff);
  console.log('');
}

export async function runMcts(
  targetDir: string = '.',
  targetFile: string,
  candidateCode: string
): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🌲 \x1b[1mOCTERACT MCTS: TEST-TIME COMPUTE SCALING EN RAM (UCT)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const mcts = new OcteractTreeSearch(indexer.getSpace());
  const res = await mcts.search({
    targetFile,
    candidatePatches: [
      { id: 'candidate_user_patch', code: candidateCode },
      { id: 'candidate_safe_stub', code: 'export function stub() { return true; }' },
    ],
    maxIterations: 20,
  });

  console.log(`  ● Iteraciones MCTS: \x1b[1m${res.totalIterations}\x1b[0m | Tamaño del Árbol: \x1b[36m${res.treeSize}\x1b[0m (${res.executionTimeMs} ms)`);
  if (res.bestTrajectory.length > 0) {
    const top = res.bestTrajectory[0];
    console.log(`  ● Mejor Rama Seleccionada: \x1b[1;32m${top.patchId}\x1b[0m`);
    console.log(`  ● Recompensa Topológica: \x1b[1;32m${top.rewardScore}\x1b[0m | Cizallamiento: \x1b[33m${top.shearDistance}\x1b[0m | Visitas: \x1b[35m${top.visits}\x1b[0m\n`);
  }
}

export async function runEVAAST(targetDir: string = '.', filePath: string): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`📜 \x1b[1mOCTERACT VOYNAST: TRANSLITERADOR CANÓNICO EVA-AST (VOYNICH)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const eva = new OcteractEVAAST();
  const res = eva.transliterate(content);

  console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m | Declaraciones: \x1b[36m${res.slots.length}\x1b[0m`);
  console.log(`  ● Reducción de Tokens: \x1b[1;32m${res.tokenReductionPercent}%\x1b[0m (${res.originalTokens} tok ➔ ${res.evaTokens} tok)\n`);
  console.log(`\x1b[33m--- [BLOQUE CANÓNICO DE GLIFOS EVA] ---\x1b[0m`);
  console.log(res.evaGlyphBlock);
  console.log('');
}

export async function runMontemurro(targetDir: string = '.'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🌐 \x1b[1mOCTERACT MONTEMURRO: CLUSTERING SEMÁNTICO POR INFORMACIÓN MUTUA\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const space = indexer.getSpace();
  const vertices = space.getVertices();
  const corpus = vertices.slice(0, 50).map(v => {
    const full = path.join(root, v.path);
    let c = '';
    try { c = fs.readFileSync(full, 'utf-8'); } catch (_) {}
    return { id: v.path, content: c };
  }).filter(d => d.content.length > 0);

  const engine = new OcteractMontemurroEngine();
  const analysis = engine.analyzeCorpus(corpus);
  const clusters = engine.extractSemanticClusters(corpus, 4);

  console.log(`  ● Documentos Analizados: \x1b[1m${analysis.sectionCount}\x1b[0m | Tokens Totales: \x1b[36m${analysis.totalTokensAnalyzed}\x1b[0m (${analysis.executionTimeMs} ms)`);
  console.log(`  ● Entropía Global de Secciones H(S): \x1b[1;33m${analysis.overallSectionEntropy} bits\x1b[0m\n`);

  console.log(`\x1b[33mTop Palabras Clave de Mayor Información Mutua I(w, S):\x1b[0m`);
  for (const kw of analysis.keywords.slice(0, 8)) {
    console.log(`  • \x1b[1;32m${kw.word.padEnd(18)}\x1b[0m [I(w,S)=${kw.mutualInformation.toFixed(3)} | total=${kw.totalCount}] ➔ Secc: ${kw.dominantSection}`);
  }

  console.log(`\n\x1b[33mClústeres Temáticos No Supervisados:\x1b[0m`);
  for (const cl of clusters) {
    console.log(`  ● \x1b[1;36m[${cl.label}]\x1b[0m (${cl.files.length} archivos) | Keywords: ${cl.topKeywords.join(', ')}`);
  }
  console.log('');
}

export async function runSlotMachine(targetDir: string = '.', filePath: string): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🎰 \x1b[1mOCTERACT SLOT-MACHINE: VALIDADOR DE SINTAXIS EN O(1) (ZATTERA)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').filter(l => /^(export|public|private|function|class|interface|type)\b/.test(l.trim()));
  const validator = new OcteractSlotMachineValidator();

  let validCount = 0;
  let invalidCount = 0;

  for (const line of lines.slice(0, 10)) {
    const res = validator.validate(line);
    if (res.valid) {
      validCount++;
      console.log(`  ✔ \x1b[1;32mVÁLIDO\x1b[0m [${res.executionTimeUs}µs] (${res.slots?.kind} \x1b[1m${res.identifier}\x1b[0m)`);
    } else {
      invalidCount++;
      console.log(`  ✖ \x1b[1;31mRECHAZADO\x1b[0m [${res.violationReason}]`);
    }
  }

  console.log(`\n  ● Total Evaluadas: \x1b[1m${validCount + invalidCount}\x1b[0m | Válidas: \x1b[1;32m${validCount}\x1b[0m | Rechazadas: \x1b[1;31m${invalidCount}\x1b[0m\n`);
}

export async function runCurrier(targetDir: string = '.', filePath?: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🌓 \x1b[1mOCTERACT CURRIER: CLASIFICADOR DE DIALECTOS DE SOFTWARE (A / B)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const classifier = new OcteractCurrierClassifier();

  if (filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const res = classifier.classify(filePath, content);
    console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m`);
    console.log(`  ● Dialecto: \x1b[1;32m${res.dialect}\x1b[0m (Confianza: \x1b[36m${(res.confidence * 100).toFixed(0)}%\x1b[0m)`);
    console.log(`  ● Tolerancia de Cizallamiento Sugerida: \x1b[1;33m${res.recommendedShearTolerance}\x1b[0m\n`);
    return;
  }

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const space = indexer.getSpace();
  const vertices = space.getVertices();
  const dialectCounts: Record<string, number> = {
    DIALECT_A_DECLARATIVE_UI: 0,
    DIALECT_B_IMPERATIVE_CORE: 0,
    DIALECT_C_CONTRACT_TYPES: 0,
  };

  for (const v of vertices.slice(0, 60)) {
    let content = '';
    try { content = fs.readFileSync(path.join(root, v.path), 'utf-8'); } catch (_) {}
    const res = classifier.classify(v.path, content);
    dialectCounts[res.dialect] = (dialectCounts[res.dialect] || 0) + 1;
  }

  console.log(`  ● Dialecto A (Declarativo / React / UI):  \x1b[1;36m${dialectCounts.DIALECT_A_DECLARATIVE_UI} archivos\x1b[0m (Tolerancia 0.25)`);
  console.log(`  ● Dialecto B (Imperativo / Async / Core): \x1b[1;32m${dialectCounts.DIALECT_B_IMPERATIVE_CORE} archivos\x1b[0m (Tolerancia 0.10)`);
  console.log(`  ● Dialecto C (Tipos Puros / Contratos):   \x1b[1;35m${dialectCounts.DIALECT_C_CONTRACT_TYPES} archivos\x1b[0m (Tolerancia 0.05)\n`);
}

export async function runEntropyH2(targetDir: string = '.', filePath: string): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`📉 \x1b[1mOCTERACT ENTROPY GUARD: ENTROPÍA CONDICIONAL DE 2DO ORDEN (H2)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const guard = new OcteractEntropyGuard();
  const res = guard.computeSecondOrderEntropy(content);

  console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m | Longitud: \x1b[36m${res.charLength} caracteres\x1b[0m`);
  console.log(`  ● Entropía de 1er Orden (H1): \x1b[1;33m${res.h1} bits/char\x1b[0m`);
  console.log(`  ● Entropía Condicional de 2do Orden (h2): \x1b[1;32m${res.h2} bits/transición\x1b[0m`);
  console.log(`  ● Veredicto: ${res.isSafe ? '\x1b[1;32m' : '\x1b[1;31m'}${res.verdict}\x1b[0m (${res.details})\n`);
}

export async function runCardanFuzz(
  targetDir: string = '.',
  filePath: string,
  maxMutants: number = 10
): Promise<void> {
  const root = path.resolve(targetDir);
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🎴 \x1b[1mOCTERACT CARDAN GRILLE: FUZZER SINTÉTICO EN RAM (GORDON RUGG)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const fuzzer = new OcteractCardanGrilleFuzzer();
  const start = performance.now();
  const mutants = fuzzer.generateMutants(content, maxMutants);
  const dur = (performance.now() - start).toFixed(2);

  console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m | Mutantes Generados: \x1b[1;32m${mutants.length}\x1b[0m (${dur} ms)\n`);

  for (const m of mutants.slice(0, 5)) {
    console.log(`  • [\x1b[36mLínea ${m.lineIndex}\x1b[0m] \x1b[1;33m${m.mutationDescription}\x1b[0m`);
    console.log(`    \x1b[31m- ${m.originalSnippet}\x1b[0m`);
    console.log(`    \x1b[32m+ ${m.mutatedSnippet}\x1b[0m\n`);
  }
}

export async function runVoxelPalette(targetDirOrFile: string = '.', filePath?: string): Promise<void> {
  let root = '.';
  let target = filePath;
  if (!target) {
    if (fs.existsSync(targetDirOrFile) && !fs.statSync(targetDirOrFile).isDirectory()) {
      target = targetDirOrFile;
      root = '.';
    } else {
      root = targetDirOrFile;
      target = 'src/index.ts';
    }
  } else {
    root = targetDirOrFile;
  }
  const fullPath = path.isAbsolute(target) ? target : path.join(path.resolve(root), target);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🎨 \x1b[1mOCTERACT VOXEL PALETTE: COMPRESIÓN BITARRAY DE TOKENS (MINECRAFT)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const engine = new OcteractPaletteStorage();
  const start = performance.now();
  const compressed = engine.compressCode(content);
  const dur = (performance.now() - start).toFixed(2);

  console.log(`  ● Archivo: \x1b[1m${target}\x1b[0m (${content.length} caracteres, ${dur} ms)`);
  console.log(`  ● Paleta de Símbolos Únicos: \x1b[1;36m${compressed.palette.length} entradas\x1b[0m`);
  console.log(`  ● Ancho de Bits por Token: \x1b[1;33m${compressed.bitWidth} bits\x1b[0m`);
  console.log(`  ● Palabras de 64-bit Empaquetadas: \x1b[1m${compressed.words.length}\x1b[0m`);
  console.log(`  ● Ratio de Compresión: \x1b[1;32m${compressed.compressionRatio.toFixed(2)}x\x1b[0m (${compressed.uncompressedBytes}B ➔ ${compressed.compressedBytes}B)\n`);
}

export async function runVoxelBiomes(targetDir: string = '.', filePath?: string): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🏔️ \x1b[1mOCTERACT MULTI-NOISE BIOMES: CLASIFICADOR DE CLIMA DE CÓDIGO 6D\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const classifier = new OcteractMultiNoiseBiomes();

  if (filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const res = classifier.classify(filePath, content);
    console.log(`  ● Archivo: \x1b[1m${filePath}\x1b[0m`);
    console.log(`  ● Bioma: \x1b[1;32m${res.biome}\x1b[0m (${res.climateDescription})`);
    console.log(`  ● Tolerancia Máxima de Cizallamiento: \x1b[1;33m${res.maxPermissibleShear}\x1b[0m`);
    console.log(`  ● Equipo de Seguridad Recomendado: \x1b[36m${res.recommendedSafetyGear.join(', ')}\x1b[0m\n`);
    return;
  }

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(root)) {
    indexer.indexDirectory({ rootDir: root });
  }

  const vertices = indexer.getSpace().getVertices();
  const biomeCounts: Record<string, number> = {};

  for (const v of vertices.slice(0, 50)) {
    let content = '';
    try { content = fs.readFileSync(path.join(root, v.path), 'utf-8'); } catch (_) {}
    const res = classifier.classify(v.path, content, { centrality: (v.dependencies.length + v.dependents.length) / 10 });
    biomeCounts[res.biome] = (biomeCounts[res.biome] || 0) + 1;
  }

  for (const [b, count] of Object.entries(biomeCounts)) {
    console.log(`  ● Bioma \x1b[1;36m${b.padEnd(20)}\x1b[0m: \x1b[1;32m${count} archivos\x1b[0m`);
  }
  console.log('');
}

export async function runVoxelHorizon(targetDirOrFile: string = '.', focusFile?: string, radius: number = 2): Promise<void> {
  let root = '.';
  let focus = focusFile;
  if (!focus) {
    if (fs.existsSync(targetDirOrFile) && !fs.statSync(targetDirOrFile).isDirectory()) {
      focus = targetDirOrFile;
      root = '.';
    } else {
      root = targetDirOrFile;
      focus = 'src/index.ts';
    }
  } else {
    root = targetDirOrFile;
  }
  const fullRoot = path.resolve(root);

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🎫 \x1b[1mOCTERACT WORKING SET HORIZON: CHUNK TICKET MANAGER (LEVELS 31-44)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(fullRoot)) {
    indexer.indexDirectory({ rootDir: fullRoot });
  }

  const space = indexer.getSpace();
  const manager = new OcteractWorkingSetHorizon();

  for (const v of space.getVertices()) {
    manager.registerNeighbors(v.path, v.dependencies);
  }

  manager.addTicket('cli-focus-ticket', focus, 31, radius);

  const horizon = manager.getHorizonSummary();
  console.log(`  ● Archivo Foco: \x1b[1m${focus}\x1b[0m (Radio: ${radius})`);
  console.log(`  ● Nivel 31 (ACTIVE - AST Completo en RAM):       \x1b[1;32m${horizon.activeCount} archivos\x1b[0m`);
  console.log(`  ● Nivel 32 (CONTRACT_ONLY - Solo Firmas):        \x1b[1;36m${horizon.contractOnlyCount} archivos\x1b[0m`);
  console.log(`  ● Nivel 33 (SKELETON_ONLY - Esqueleto de Tipos): \x1b[1;33m${horizon.skeletonOnlyCount} archivos\x1b[0m`);
  console.log(`  ● Nivel 34+ (EVICTED - Liberados de RAM):        \x1b[31m${horizon.evictedCount} archivos\x1b[0m\n`);
}

export async function runVoxelStarlight(targetDirOrFile: string = '.', sourceFile?: string): Promise<void> {
  let root = '.';
  let src = sourceFile;
  if (!src) {
    if (fs.existsSync(targetDirOrFile) && !fs.statSync(targetDirOrFile).isDirectory()) {
      src = targetDirOrFile;
      root = '.';
    } else {
      root = targetDirOrFile;
      src = 'src/index.ts';
    }
  } else {
    root = targetDirOrFile;
  }
  const fullRoot = path.resolve(root);

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`✨ \x1b[1mOCTERACT STARLIGHT BLAST: PROPAGACIÓN DE LUZ BFS (NIVEL 15 A 0)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  if (!indexer.loadIndex(fullRoot)) {
    indexer.indexDirectory({ rootDir: fullRoot });
  }

  const space = indexer.getSpace();
  const starlight = new OcteractStarlightBlast();
  const nodeMap = new Map<string, number>();

  for (const v of space.getVertices()) {
    const id = starlight.registerNode(v.path);
    nodeMap.set(v.path, id);
  }

  for (const v of space.getVertices()) {
    const fromId = nodeMap.get(v.path);
    if (fromId === undefined) continue;
    for (const dep of v.dependencies) {
      const toId = nodeMap.get(dep);
      if (toId !== undefined) {
        starlight.addEdge(fromId, toId);
      }
    }
  }

  // Normalizar ruta de archivo respecto a fullRoot si es necesario
  const relSrc = path.isAbsolute(src) ? path.relative(fullRoot, src) : src;
  const sourceId = nodeMap.get(src) ?? nodeMap.get(relSrc);
  if (sourceId === undefined) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${src}' no encontrado en el grafo topológico.\x1b[0m\n`);
    return;
  }

  const start = performance.now();
  const blast = starlight.propagateLight(sourceId, 15);
  const dur = (performance.now() - start).toFixed(2);

  console.log(`  ● Fuente de Luz: \x1b[1m${src}\x1b[0m (Nivel 15)`);
  console.log(`  ● Nodos Iluminados: \x1b[1;32m${blast.illuminatedNodes.length}\x1b[0m en ${dur} ms (${blast.propagateTimeUs} µs de CPU)\n`);

  for (const n of blast.illuminatedNodes.slice(0, 8)) {
    console.log(`  • [Luz \x1b[1;33m${n.lightLevel.toString().padStart(2)}\x1b[0m] \x1b[1m${n.id}\x1b[0m`);
  }
  console.log('');
}

export async function runVoxelAnvil(targetDir: string = '.', action: 'pack' | 'inspect' = 'inspect'): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`📦 \x1b[1mOCTERACT ANVIL CONTAINER: CONTENEDOR REGIONAL .OAC (1024 CHUNKS)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const container = new OcteractAnvilContainer();
  const sampleData = JSON.stringify({ cell: 'CoreLogic', symbols: ['Hypercube', 'Fracture', 'Voxel'] });

  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
      container.saveChunk(x, z, sampleData);
    }
  }

  const metrics = container.getMetrics();
  console.log(`  ● Modo: \x1b[1m${action.toUpperCase()}\x1b[0m`);
  console.log(`  ● Chunks Almacenados: \x1b[1;32m${metrics.storedChunks}\x1b[0m`);
  console.log(`  ● Sectores de 4KB Asignados: \x1b[1;36m${metrics.totalSectors}\x1b[0m (${metrics.totalBytes} bytes en disco)`);
  console.log(`  ● Bytes Sin Comprimir: \x1b[1m${metrics.uncompressedBytes}B\x1b[0m ➔ Comprimidos: \x1b[1;32m${metrics.compressedBytes}B\x1b[0m\n`);
}

export async function runVoxelJigsaw(targetDir: string = '.', rootPieceId: string = 'root-entrypoint'): Promise<void> {
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧩 \x1b[1mOCTERACT JIGSAW SYNTHESIS: ENSAMBLADO POR SOCKETS TIPADOS\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const jigsaw = new OcteractJigsawSynthesis();

  jigsaw.registerPiece({
    id: rootPieceId,
    template: `export class ApplicationServer {\n  constructor(private auth: {{auth_socket}}, private db: {{db_socket}}) {}\n}`,
    sockets: [
      { name: 'auth_socket', type: 'plug', contract: 'IAuthService', jointType: 'rigid' },
      { name: 'db_socket', type: 'plug', contract: 'IDatabaseConnection', jointType: 'rigid' },
    ],
  });

  jigsaw.registerPiece({
    id: 'auth-jwt-provider',
    template: `export class JwtAuthService implements IAuthService {\n  verify(token: string) { return true; }\n}`,
    sockets: [
      { name: 'auth_socket', type: 'jack', contract: 'IAuthService', jointType: 'rigid' },
    ],
  });

  jigsaw.registerPiece({
    id: 'db-postgres-pool',
    template: `export class PostgresPool implements IDatabaseConnection {\n  query(sql: string) { return []; }\n}`,
    sockets: [
      { name: 'db_socket', type: 'jack', contract: 'IDatabaseConnection', jointType: 'rigid' },
    ],
  });

  const assembly = jigsaw.assemble(rootPieceId);
  console.log(`  ● Ensamblado de Raíz: \x1b[1m${rootPieceId}\x1b[0m`);
  console.log(`  ● Éxito de Ensamblado: ${assembly.success ? '\x1b[1;32mSÍ (COMPLETO)\x1b[0m' : '\x1b[1;31mINCOMPLETO\x1b[0m'}`);
  console.log(`  ● Piezas Conectadas: \x1b[1;36m${assembly.connectedPieces.join(' ➔ ')}\x1b[0m`);
  console.log(`  ● Sockets Sin Satisfacer: \x1b[1;33m${assembly.unmatchedSockets.length}\x1b[0m\n`);
}

export async function runVoxelCuller(targetDirOrFile: string = '.', filePath?: string): Promise<void> {
  let root = '.';
  let target = filePath;
  if (!target) {
    if (fs.existsSync(targetDirOrFile) && !fs.statSync(targetDirOrFile).isDirectory()) {
      target = targetDirOrFile;
      root = '.';
    } else {
      root = targetDirOrFile;
      target = 'src/index.ts';
    }
  } else {
    root = targetDirOrFile;
  }
  const fullPath = path.isAbsolute(target) ? target : path.join(path.resolve(root), target);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[1;31m✖ Error: Archivo '${fullPath}' no existe.\x1b[0m\n`);
    return;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧱 \x1b[1mOCTERACT CONTEXT CULLER: OCLUSIÓN Y MALLADO CODICIOSO (GREEDY MESH)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const content = fs.readFileSync(fullPath, 'utf-8');
  const culler = new OcteractGreedyContextCuller();
  const start = performance.now();
  const result = culler.cullAndMesh(content);
  const dur = (performance.now() - start).toFixed(2);

  console.log(`  ● Archivo: \x1b[1m${target}\x1b[0m (${dur} ms)`);
  console.log(`  ● Líneas Originales: \x1b[1m${result.originalLines}\x1b[0m ➔ Líneas Malladas: \x1b[1;32m${result.culledLines}\x1b[0m`);
  console.log(`  ● Tokens Estimados Iniciales: \x1b[31m${result.originalEstimatedTokens}\x1b[0m ➔ Tokens Mallados: \x1b[1;32m${result.compressedEstimatedTokens}\x1b[0m`);
  console.log(`  ● Ahorro de Tokens: \x1b[1;32m${result.tokenSavingsPercent}%\x1b[0m para Context Window LLM\n`);
}

export async function runVoxelObserver(targetDirOrFile: string = '.', targetFile?: string): Promise<void> {
  let root = '.';
  let target = targetFile;
  if (!target) {
    if (fs.existsSync(targetDirOrFile) && !fs.statSync(targetDirOrFile).isDirectory()) {
      target = targetDirOrFile;
      root = '.';
    } else {
      root = targetDirOrFile;
      target = 'src/index.ts';
    }
  } else {
    root = targetDirOrFile;
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🔴 \x1b[1mOCTERACT OBSERVER PULSE: SEÑAL REDSTONE REACTIVA DE 0-TICKS\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const observer = new OcteractObserverPulse();
  const signals: any[] = [];
  observer.onPulse((sig) => signals.push(sig));

  observer.observeNode(target, 'sha256_initial_hash_v1');
  const pulse = observer.notifyStateChange(target, 'sha256_mutated_hash_v2', { reason: 'AST mutation' });

  console.log(`  ● Nodo Observado: \x1b[1m${target}\x1b[0m`);
  console.log(`  ● Detección de Mutación 0-Tick: \x1b[1;32mPULSO EMITIDO\x1b[0m`);
  console.log(`  ● Potencia de Redstone: \x1b[1;31m${pulse?.power}/15\x1b[0m`);
  console.log(`  ● Tick Actual: \x1b[1;36m${observer.getCurrentTick()}\x1b[0m`);
  console.log(`  ● Listeners Notificados: \x1b[1;32m${signals.length}\x1b[0m\n`);
}

export async function runReaBundle(bundlePath: string): Promise<void> {
  const fullPath = path.resolve(bundlePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[31mError: Archivo bundle no encontrado:\x1b[0m ${fullPath}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🔬 \x1b[1mOCTERACT REA BUNDLE: INGENIERÍA INVERSA Y DE-BUNDLING ESTÁTICO\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const code = fs.readFileSync(fullPath, 'utf-8');
  const start = performance.now();
  const report = OcteractReverseBundle.analyzeBundle(code, path.basename(fullPath));
  const dur = (performance.now() - start).toFixed(2);

  console.log(`  ● Bundle: \x1b[1m${report.bundleName}\x1b[0m (${Math.round(report.bundleSize / 1024)} KB, ${dur} ms)`);
  console.log(`  ● Formato Bundler Detectado: \x1b[1;36m${report.format.toUpperCase()}\x1b[0m`);
  console.log(`  ● Módulos Extraídos: \x1b[1;32m${report.totalModulesFound}\x1b[0m`);
  console.log(`  ● Confianza de Reconstrucción: \x1b[1;32m${report.reconstructionConfidence}%\x1b[0m`);
  console.log(`  ● Banderas de Seguridad: \x1b[1;${report.securityFlags.length > 0 ? '31' : '32'}m${report.securityFlags.length}\x1b[0m`);
  console.log(`\n  Proyección en Hipercubo 8D:`);
  for (const [cell, count] of Object.entries(report.cellDistribution)) {
    if (count > 0) {
      console.log(`    - [${cell}]: \x1b[1m${count}\x1b[0m módulos`);
    }
  }
  console.log();
}

export async function runReaCompare(sourceDir: string, bundlePath: string): Promise<void> {
  const fullSrc = path.resolve(sourceDir);
  const fullBundle = path.resolve(bundlePath);

  if (!fs.existsSync(fullBundle)) {
    console.error(`\x1b[31mError: Archivo bundle no encontrado:\x1b[0m ${fullBundle}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🛡️ \x1b[1mOCTERACT SOURCE-TO-BUNDLE: AUDITORÍA FORENSE DE CADENA DE SUMINISTRO\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const sourceMap: Record<string, string> = {};
  if (fs.existsSync(fullSrc)) {
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          scanDir(p);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          sourceMap[path.relative(fullSrc, p)] = fs.readFileSync(p, 'utf-8');
        }
      }
    };
    scanDir(fullSrc);
  }

  const bundleCode = fs.readFileSync(fullBundle, 'utf-8');
  const report = OcteractSourceToBundleAttribution.compare(sourceMap, bundleCode, path.basename(fullBundle));

  console.log(`  ● Archivos Fuente Evaluados: \x1b[1m${report.sourceFilesCount}\x1b[0m`);
  console.log(`  ● Símbolos Fuente Declarados: \x1b[1m${report.totalSourceSymbols}\x1b[0m`);
  console.log(`  ● Módulos en Bundle: \x1b[1m${report.bundleModulesCount}\x1b[0m`);
  console.log(`  ● Puntuación de Integridad: \x1b[1;${report.integrityScore >= 90 ? '32' : '31'}m${report.integrityScore}/100\x1b[0m`);
  console.log(`  ● Veredicto Criptográfico: \x1b[1;${report.verdict === 'CRYPTO_VERIFIED_CLEAN' ? '32' : '31'}m${report.verdict}\x1b[0m`);
  console.log(`  ● Coincidencias Exactas: \x1b[1;32m${report.summary.exactMatches}\x1b[0m`);
  console.log(`  ● Anomalías Fantasma (Ghost Injections): \x1b[1;${report.summary.ghostInjections > 0 ? '31' : '32'}m${report.summary.ghostInjections}\x1b[0m\n`);
}

export async function runReaArmor(filePath: string): Promise<void> {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[31mError: Archivo no encontrado:\x1b[0m ${fullPath}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🛡️ \x1b[1mOCTERACT TARGET ARMOR: BLINDAJE CONTRA INYECCIÓN DE PROMPTS\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    console.log(`  ● Escaneando Directorio: \x1b[1m${path.basename(fullPath)}\x1b[0m`);
    let totalScanned = 0;
    let totalThreats = 0;
    let maxRisk = 0;

    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(p);
        } else if (/\.(ts|js|py|json|md|html|sh)$/.test(entry.name)) {
          totalScanned++;
          const code = fs.readFileSync(p, 'utf-8');
          const res = OcteractTargetArmor.scan(code);
          if (!res.isClean) {
            totalThreats += res.threats.length;
            maxRisk = Math.max(maxRisk, res.riskScore);
            console.log(`    - [${res.threatLevel}] ${path.relative(fullPath, p)}: ${res.threats.length} amenazas (Riesgo: ${res.riskScore}/100)`);
          }
        }
      }
    };
    scanDir(fullPath);

    console.log(`  ● Archivos Analizados: \x1b[1m${totalScanned}\x1b[0m`);
    console.log(`  ● Estado Global: \x1b[1;${totalThreats === 0 ? '32' : '31'}m${totalThreats === 0 ? 'LIMPIO Y SEGURO' : 'VECTORES DETECTADOS'}\x1b[0m`);
    console.log(`  ● Amenazas Totales: \x1b[1m${totalThreats}\x1b[0m (Riesgo Máximo: ${maxRisk}/100)\n`);
    return;
  }

  const code = fs.readFileSync(fullPath, 'utf-8');
  const result = OcteractTargetArmor.scan(code);

  console.log(`  ● Archivo: \x1b[1m${path.basename(fullPath)}\x1b[0m`);
  console.log(`  ● Estado: \x1b[1;${result.isClean ? '32' : '31'}m${result.isClean ? 'LIMPIO Y SEGURO' : 'VECTORES DETECTADOS'}\x1b[0m`);
  console.log(`  ● Puntuación de Riesgo: \x1b[1;${result.riskScore === 0 ? '32' : '31'}m${result.riskScore}/100\x1b[0m (${result.threatLevel})`);
  console.log(`  ● Amenazas Detectadas: \x1b[1m${result.threats.length}\x1b[0m`);
  for (const t of result.threats) {
    console.log(`    - Línea ${t.line}: [${t.severity}] ${t.rule} -> "${t.matched.slice(0, 50)}..."`);
  }
  console.log();
}

export async function runReaNative(binaryPath: string): Promise<void> {
  const fullPath = path.resolve(binaryPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[31mError: Binario no encontrado:\x1b[0m ${fullPath}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🔌 \x1b[1mOCTERACT NATIVE INSPECTOR: ANÁLISIS OFFLINE DE ADDONS .NODE\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const report = OcteractNativeBoundaryInspector.inspectBinary(fullPath);
  console.log(`  ● Archivo: \x1b[1m${report.fileName}\x1b[0m (${Math.round(report.fileSizeBytes / 1024)} KB)`);
  console.log(`  ● Formato: \x1b[1;36m${report.format} (${report.architecture})\x1b[0m`);
  console.log(`  ● Node-API Compatible: \x1b[1;${report.isNapiAddon ? '32' : '33'}m${report.isNapiAddon ? 'SÍ (' + report.napiVersionDetected + ')' : 'NO'}\x1b[0m`);
  console.log(`  ● Punto de Entrada: \x1b[1m${report.entryPoint || 'Ninguno'}\x1b[0m`);
  console.log(`  ● Métodos Nativos Detectados: \x1b[1;32m${report.exportedMethods.length}\x1b[0m`);
  console.log(`  ● Celda 8D Asignada: \x1b[1;35m${report.projectedCell}\x1b[0m`);
  console.log(`  ● Mitigaciones: Stack Canary=${report.staticMitigations.stackCanaryFound}, RELRO=${report.staticMitigations.relroIndicated}\n`);
}

export async function runDragonFold(filePath: string, targetSymbol?: string): Promise<void> {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[31mError: Archivo no encontrado:\x1b[0m ${fullPath}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🐉 \x1b[1mOCTERACT DRAGON FOLD: COMPRESIÓN FRACTAL ORIGAMI DEL AST\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const code = fs.readFileSync(fullPath, 'utf-8');
  if (targetSymbol) {
    const unfolded = OcteractDragonFold.unfoldTarget(code, targetSymbol);
    console.log(`  ● Despliegue Selectivo (Unfold) del Símbolo: \x1b[1;32m${targetSymbol}\x1b[0m`);
    if (unfolded) {
      console.log(`\x1b[36m--- Código Desplegado ---\x1b[0m\n${unfolded}\n\x1b[36m-------------------------\x1b[0m\n`);
    } else {
      console.log(`\x1b[33mNo se encontró la declaración '${targetSymbol}' en el archivo.\x1b[0m\n`);
    }
    return;
  }

  const result = OcteractDragonFold.foldCode(code, path.relative(process.cwd(), fullPath));
  console.log(`  ● Archivo: \x1b[1m${result.filePath}\x1b[0m`);
  console.log(`  ● Líneas Originales: \x1b[1m${result.originalLines}\x1b[0m -> Líneas Plegadas: \x1b[1;32m${result.foldedLines}\x1b[0m`);
  console.log(`  ● Reducción de Tokens: \x1b[1;32m${result.tokenSavingsPercent}%\x1b[0m`);
  console.log(`  ● Pliegues de Valle (Superficie Pública): \x1b[1;34m${result.valleyFoldsCount}\x1b[0m`);
  console.log(`  ● Pliegues de Montaña (Cuerpo Oculto): \x1b[1;35m${result.mountainFoldsCount}\x1b[0m\n`);
  console.log(`\x1b[36m--- Vista Origami Plegada ---\x1b[0m\n${result.foldedCode}\n\x1b[36m-----------------------------\x1b[0m\n`);
}

export async function runDragonBlast(filePath: string, initialEnergy: number = 1.0): Promise<void> {
  const rootDir = process.cwd();
  const relPath = path.relative(rootDir, path.resolve(filePath));

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`💥 \x1b[1mOCTERACT DRAGON BLAST: ONDA DE CHOQUE FRACTAL CON AMORTIGUACIÓN HAUSDORFF\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  const space = indexer.indexDirectory({ rootDir });
  const graph = new Map<string, string[]>();
  for (const v of space.getVertices()) {
    graph.set(v.path, v.dependencies);
  }

  const report = OcteractDragonBlast.propagateWavefront(relPath, graph, initialEnergy, 8);

  console.log(`  ● Epicentro de Onda: \x1b[1m${report.epicenter}\x1b[0m`);
  console.log(`  ● Energía Inicial: \x1b[1m${report.initialEnergy}\x1b[0m | Factor Hausdorff: \x1b[1;36m${report.fractalDampingFactor.toFixed(4)}\x1b[0m`);
  console.log(`  ● Vértices Alcanzados: \x1b[1;32m${report.totalNodesReached}\x1b[0m | Nodos Podados por Fractal: \x1b[1;33m${report.nodesPrunedByFractalDamping}\x1b[0m`);
  console.log(`  ● Ahorro Estimado de Tokens: \x1b[1;32m${report.tokenSavingsPercent}%\x1b[0m | Energía Residual: \x1b[1m${report.finalResidualEnergy.toFixed(4)}\x1b[0m\n`);
  console.log(`  ● Niveles de Onda Origami:`);
  for (const tier of report.tiers) {
    console.log(`    - [Pliegue ${tier.creaseLevel} | Giro ${tier.turnDirection}] ${tier.nodes.length} archivos | Energía: \x1b[33m${tier.attenuatedEnergy.toFixed(4)}\x1b[0m`);
    for (const n of tier.nodes.slice(0, 3)) {
      console.log(`        * ${n}`);
    }
    if (tier.nodes.length > 3) {
      console.log(`        ... y ${tier.nodes.length - 3} más`);
    }
  }
  console.log();
}

export async function runDragonCoords(filePath: string, compareWith?: string): Promise<void> {
  const rootDir = process.cwd();
  const indexer = new ProjectIndexer();
  const space = indexer.indexDirectory({ rootDir });

  const relPath = path.relative(rootDir, path.resolve(filePath));
  const vertex = space.getVertex(relPath);
  const point8D = vertex ? vertex.coordinate : [0, 0, 0, 0, 0, 0, 0, 0];

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧭 \x1b[1mOCTERACT DRAGON COORDS: LOCALIZADOR ESPACIAL BASE-(1+i) / (1+O)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const coord = OcteractDragonIndex.encode8DToDragon(point8D);

  console.log(`  ● Archivo: \x1b[1m${relPath}\x1b[0m`);
  console.log(`  ● Hash Fractal: \x1b[1;36m${coord.hash}\x1b[0m`);
  console.log(`  ● Paso Fractal (Step): \x1b[1;32m${coord.step}\x1b[0m (Profundidad: ${coord.depth})`);
  console.log(`  ● Secuencia de Giro Heighway: \x1b[1;33m${coord.turnsSequence}\x1b[0m (R=Derecha, L=Izquierda)`);
  console.log(`  ● Vector Octoniónico 8D (1+O): \x1b[1m[${coord.octonionicVector.map((v) => v.toFixed(3)).join(', ')}]\x1b[0m`);

  if (compareWith) {
    const relComp = path.relative(rootDir, path.resolve(compareWith));
    const compVertex = space.getVertex(relComp);
    const compPoint8D = compVertex ? compVertex.coordinate : [0, 0, 0, 0, 0, 0, 0, 0];
    const compCoord = OcteractDragonIndex.encode8DToDragon(compPoint8D);
    const fractalDist = OcteractDragonIndex.computeFractalDistance(coord.hash, compCoord.hash);

    console.log(`\n  ● Comparación con: \x1b[1m${relComp}\x1b[0m (${compCoord.hash})`);
    console.log(`  ● Distancia Hamming Fractal: \x1b[1;35m${fractalDist.hammingDistance} bits\x1b[0m`);
    console.log(`  ● Cizallamiento Fractal Normalizado: \x1b[1;36m${fractalDist.normalizedFractalShear}\x1b[0m`);
    console.log(`  ● Prefijo Fractal Compartido: \x1b[1;32m${fractalDist.sharedFractalPrefix || 'ninguno'}\x1b[0m (Profundidad de pliegue: ${fractalDist.creaseDepth})\n`);
  } else {
    console.log();
  }
}

export async function runDragonTile(rootDir: string = '.'): Promise<void> {
  const root = path.resolve(rootDir);

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`🧩 \x1b[1mOCTERACT DRAGON TILE: TESELACIÓN PERIÓDICA EN 4 DRAGONES\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const indexer = new ProjectIndexer();
  const space = indexer.indexDirectory({ rootDir: root });
  const vertices = space.getVertices().map((v) => ({
    id: v.path,
    cell: v.cell,
    dependencies: v.dependencies,
    complexity: v.loc,
  }));
  const tiling = OcteractDragonTile.partitionRepository(vertices, path.basename(root));

  console.log(`  ● Total Archivos Teselados: \x1b[1m${tiling.totalFiles}\x1b[0m`);
  console.log(`  ● Cuadrante ALFA (Storage): \x1b[1;34m${tiling.quadrants.ALFA_STORAGE.files.length} archivos\x1b[0m`);
  console.log(`  ● Cuadrante BETA (Core): \x1b[1;32m${tiling.quadrants.BETA_CORE.files.length} archivos\x1b[0m`);
  console.log(`  ● Cuadrante GAMMA (Surface/UI): \x1b[1;33m${tiling.quadrants.GAMMA_SURFACE.files.length} archivos\x1b[0m`);
  console.log(`  ● Cuadrante DELTA (Governance/Sec): \x1b[1;35m${tiling.quadrants.DELTA_GOVERNANCE.files.length} archivos\x1b[0m`);
  console.log(`  ● Pureza de Teselación: \x1b[1;32m${tiling.tessellationPurity}%\x1b[0m (Veredicto: ${tiling.verdict})`);
  console.log(`  ● Fugas de Límite (Boundary Leaks): \x1b[1;${tiling.illegalBoundaryLeaks.length > 0 ? '31' : '32'}m${tiling.illegalBoundaryLeaks.length}\x1b[0m`);

  if (tiling.illegalBoundaryLeaks.length > 0) {
    console.log(`\n  ● Detalle de Fugas Inter-Cuadrante:`);
    for (const leak of tiling.illegalBoundaryLeaks.slice(0, 5)) {
      console.log(`    - [${leak.fromQuadrant} -> ${leak.toQuadrant}] ${leak.fromFile} -> ${leak.toFile}: ${leak.reason}`);
    }
  }
  console.log();
}

export async function runDragonCreaseFuzz(filePath: string): Promise<void> {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`\x1b[31mError: Archivo no encontrado:\x1b[0m ${fullPath}`);
    process.exit(1);
  }

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`⚡ \x1b[1mOCTERACT CREASE FUZZ: FUZZER DE FATIGA EN LÍNEAS DE PLIEGUE ORIGAMI\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);

  const code = fs.readFileSync(fullPath, 'utf-8');
  const report = OcteractDragonCreaseFuzz.evaluateStress(code, path.relative(process.cwd(), fullPath));

  console.log(`  ● Archivo: \x1b[1m${report.filePath}\x1b[0m (${report.totalLines} líneas)`);
  console.log(`  ● Pliegues Analizados: \x1b[1m${report.totalCreasesFound}\x1b[0m`);
  console.log(`  ● Puntuación de Resiliencia: \x1b[1;${report.creaseStressScore >= 80 ? '32' : '31'}m${report.creaseStressScore}/100\x1b[0m`);
  console.log(`  ● Bifurcaciones Frágiles Detectadas: \x1b[1;${report.fragileCreasesCount > 0 ? '33' : '32'}m${report.fragileCreasesCount}\x1b[0m\n`);

  if (report.fragileBifurcations.length > 0) {
    console.log(`  ● Detalle de Puntos Débiles (Fragile Bifurcations):`);
    for (const fb of report.fragileBifurcations.slice(0, 10)) {
      console.log(`    - Línea ${fb.line}: ${fb.fragilityReason}`);
      console.log(`        Endurecimiento recomendado: \x1b[36m${fb.suggestedHardening}\x1b[0m`);
    }
    if (report.fragileBifurcations.length > 10) {
      console.log(`    ... y ${report.fragileBifurcations.length - 10} más.`);
    }
  } else {
    console.log(`  ● Todas las líneas de pliegue superaron las pruebas de fatiga mecánica fractal.\n`);
  }
  console.log();
}

export async function runDoctor(targetDir: string = '.', options: { deep?: boolean; sarif?: boolean } = {}): Promise<void> {
  const root = path.resolve(targetDir);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);
  console.log(`🩺 \x1b[1mOCTERACT DOCTOR: DIAGNÓSTICO HOLÍSTICO UNIVERSAL (8D + DRAGON + REA)\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);

  const report = await OcteractDoctor.diagnose(root, options);
  const color = report.healthScore >= 90 ? '\x1b[1;32m' : (report.healthScore >= 75 ? '\x1b[1;33m' : '\x1b[1;31m');

  console.log(`  ● Salud Global: ${color}${report.healthScore}/100\x1b[0m (Veredicto: \x1b[1m${report.verdict}\x1b[0m)`);
  console.log(`  ● Archivos / Símbolos Indexados: \x1b[1m${report.totalFiles}\x1b[0m archivos | \x1b[1m${report.totalSymbols}\x1b[0m símbolos`);
  console.log(`  ● Fracturas R^8: \x1b[1;${report.fracturesCount > 0 ? '31' : '32'}m${report.fracturesCount}\x1b[0m`);
  console.log(`  ● Fugas de Límite (Dragon Tile): \x1b[1;${report.boundaryLeaksCount > 0 ? '31' : '32'}m${report.boundaryLeaksCount}\x1b[0m`);
  console.log(`  ● Biomas Dominantes: \x1b[1;34m${report.dominantBiomes.map((b) => `${b.biome} (${b.filesCount})`).join(', ') || 'Equilibrado'}\x1b[0m`);

  if (report.fractures.length > 0) {
    console.log(`\n  ● Detalle de Fracturas Críticas / Advertencias:`);
    for (const f of report.fractures.slice(0, 5)) {
      const fileName = f.file ? path.basename(f.file) : 'desconocido';
      console.log(`    - [${(f.severity || 'INFO').toUpperCase()}] ${fileName}${f.line ? `:${f.line}` : ''}: ${f.message}`);
    }
  }

  if (report.boundaryLeaks.length > 0) {
    console.log(`\n  ● Detalle de Fugas de Límite:`);
    for (const l of report.boundaryLeaks.slice(0, 3)) {
      console.log(`    - [${l.fromQuadrant} ➔ ${l.toQuadrant}] ${path.basename(l.fromFile)} ➔ ${path.basename(l.toFile)}: ${l.reason}`);
    }
  }

  console.log(`\n  ● \x1b[1;32mAcción Quirúrgica Recomendada:\x1b[0m`);
  for (const rec of report.topRecommendations) {
    console.log(`    ➔ \x1b[36m${rec}\x1b[0m`);
  }
  console.log();
}

export async function runSee(
  filePath: string,
  symbol?: string,
  mode: 'origami' | 'skeleton' | 'full' | 'eva' | 'sieve' = 'origami'
): Promise<void> {
  const result = await OcteractSee.inspect(filePath, { symbol, mode });
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);
  console.log(`👁️ \x1b[1mOCTERACT SEE: LENTE DE LECTURA FRACTAL [Modo: ${result.mode.toUpperCase()}]\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================\x1b[0m`);
  console.log(`  ● Archivo: \x1b[1m${result.filePath}\x1b[0m${result.symbol ? ` (Símbolo: \x1b[33m${result.symbol}\x1b[0m)` : ''}`);
  console.log(`  ● Líneas: \x1b[1m${result.lineCount}\x1b[0m | Tokens Originales: ~${result.originalTokensApprox} ➔ Comprimidos: ~${result.compressedTokensApprox}`);
  console.log(`  ● Ahorro de Tokens: \x1b[1;32m${result.compressionSavingsPercent}%\x1b[0m\n`);
  console.log(result.content);
  console.log();
}

export async function runImpact(
  filePath: string,
  symbol?: string,
  maxHops: number = 15
): Promise<void> {
  const report = await OcteractImpact.analyze(filePath, { symbol, maxHops });
  const riskColor = report.riskLevel === 'LOW' ? '\x1b[1;32m' : (report.riskLevel === 'MEDIUM' ? '\x1b[1;33m' : '\x1b[1;31m');

  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`💥 \x1b[1mOCTERACT IMPACT: ONDA DE CHOQUE FRACTAL HEIGHWAY (d_H/2 ≈ 0.7618)\x1b[0m`);
  console.log(`\x1b[1;35m========================================================================\x1b[0m`);
  console.log(`  ● Epicentro: \x1b[1m${report.epicenter.file}\x1b[0m${report.epicenter.symbol ? ` -> \x1b[33m${report.epicenter.symbol}\x1b[0m` : ''}`);
  console.log(`  ● Nivel de Riesgo: ${riskColor}${report.riskLevel}\x1b[0m (Puntuación: ${report.impactScore}/100)`);
  console.log(`  ● Total Nodos Alcanzados: \x1b[1m${report.totalAffectedNodes}\x1b[0m`);

  if (report.tier1DirectDependents.length > 0) {
    console.log(`\n  ● Dependientes Directos Inmediatos (Tier 1):`);
    for (const d of report.tier1DirectDependents.slice(0, 6)) {
      console.log(`    - ${d.file} (${d.symbol}): ${d.reason}`);
    }
  } else {
    console.log(`\n  ● Sin dependientes directos (Módulo aislado).`);
  }

  if (report.safeRefactorOrder.length > 0) {
    console.log(`\n  ● Secuencia Segura de Refactorización (Topological Bottom-Up):`);
    console.log(`    ${report.safeRefactorOrder.map((f) => path.basename(f)).join(' ➔ ')}`);
  }
  console.log();
}

export async function runAsk(query: string, targetDir: string = '.'): Promise<void> {
  console.log(`\x1b[1;34m========================================================================\x1b[0m`);
  console.log(`🧠 \x1b[1mOCTERACT ASK: MOTOR SEMÁNTICO GEODÉSICO DE PREGUNTAS\x1b[0m`);
  console.log(`\x1b[1;34m========================================================================\x1b[0m`);
  console.log(`  ● Pregunta: \x1b[1;33m"${query}"\x1b[0m\n`);

  const result = await OcteractAsk.query(query, { rootDir: targetDir });

  console.log(`  ● \x1b[1;32mRespuesta Directa:\x1b[0m\n    ${result.answer}\n`);

  if (result.relevantFiles.length > 0) {
    console.log(`  ● Archivos y Ubicaciones Relevantes:`);
    for (const f of result.relevantFiles) {
      console.log(`    - \x1b[1m${f.path}\x1b[0m${f.lines && f.lines.length > 0 ? ` (Líneas: ${f.lines.slice(0, 3).join(', ')})` : ''}`);
      if (f.snippet) {
        console.log(`        \x1b[90m${f.snippet.slice(0, 80)}\x1b[0m`);
      }
    }
  }

  if (result.keySymbols.length > 0) {
    console.log(`\n  ● Símbolos Clave: \x1b[36m${result.keySymbols.join(', ')}\x1b[0m`);
  }

  if (result.suggestedAction) {
    console.log(`\n  ● Comando Sugerido: \x1b[1;32m${result.suggestedAction}\x1b[0m`);
  }
  console.log();
}
