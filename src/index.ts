import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
/**
 * TESSERACT-CONTEXT: Punto de Entrada Principal
 */

import { runInit, runIndex, runStats, runSlice, runMCP, runTUI, runShadow, runUI, runWatch, runSafeWrite, runAudit, runFlow, runHybridAudit, runBlast, runPatch, runTrial, runAutoHeal, runSarif, runDiff, runHook, runLicense, runSWECI, runLSC, runMesh, runPreflight, runPortfolio, runSwarm, runMutate, runTransmute, runAsymptotic, runCausal, runAsyncAudit, runOcteractStats, runGrep, runOrchestrate, runFunSearch, runDeductive, runAlphaDev, runPairformer } from './cli/commands.ts';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || (process.stdin.isTTY ? 'help' : 'mcp');

  switch (command) {
    case 'blast': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const targetSymbol = args[3];
      const maxHops = args[4] ? parseInt(args[4], 10) : 3;
      if (!targetFile) {
        console.error('Uso: tesseract-context blast <dir> <archivo> [símbolo] [saltos]');
        process.exit(1);
      }
      await runBlast(targetDir, targetFile, targetSymbol, maxHops);
      break;
    }
    case 'patch': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const symbolName = args[3];
      if (!targetFile) {
        console.error('Uso: tesseract-context patch <dir> <archivo> [símbolo]');
        process.exit(1);
      }
      await runPatch(targetDir, targetFile, symbolName);
      break;
    }
    case 'trial': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const proposedContent = args[3] || '';
      if (!targetFile) {
        console.error('Uso: tesseract-context trial <dir> <archivo> <codigoPropuesto>');
        process.exit(1);
      }
      await runTrial(targetDir, targetFile, proposedContent);
      break;
    }
    case 'autoheal': {
      const targetDir = args[1] || '.';
      const fractureId = args[2];
      const autoCommit = args[3] === '--commit' || args[3] === '-y';
      if (!fractureId) {
        console.error('Uso: tesseract-context autoheal <dir> <fractureId> [--commit]');
        process.exit(1);
      }
      await runAutoHeal(targetDir, fractureId, autoCommit);
      break;
    }
    case 'audit': {
      let targetDir = '.';
      let sarifFile: string | undefined;
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--sarif') {
          sarifFile = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : 'tesseract-results.sarif';
          i++;
        } else if (!targetDir || targetDir === '.') {
          targetDir = args[i];
        }
      }
      await runAudit(targetDir, sarifFile);
      break;
    }
    case 'sarif': {
      const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      const outputFile = args[2] || 'tesseract-results.sarif';
      await runSarif(targetDir, outputFile);
      break;
    }
    case 'diff': {
      const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      const baseRef = args[2] || 'HEAD';
      await runDiff(targetDir, baseRef);
      break;
    }
    case 'hook': {
      const action = args[1] || 'install';
      const targetDir = args[2] || '.';
      await runHook(action, targetDir);
      break;
    }
    case 'flow': {
      const targetDir = args[1] || '.';
      const query = args.slice(2).join(' ') || 'flujo de arquitectura';
      await runFlow(targetDir, query);
      break;
    }
    case 'hybrid-audit': {
      const targetDir = args[1] || '.';
      await runHybridAudit(targetDir);
      break;
    }
    case 'init': {
      const targetDir = args[1] || '.';
      await runInit(targetDir);
      break;
    }
    case 'index': {
      const targetDir = args[1] || '.';
      await runIndex(targetDir);
      break;
    }
    case 'stats': {
      const targetDir = args[1] || '.';
      await runStats(targetDir);
      break;
    }
    case 'slice': {
      const targetDir = args[1] || '.';
      await runSlice(targetDir, {
        cell: args[2],
        symbol: args[3],
        budget: args[4],
      });
      break;
    }
    case 'shadow': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const proposedContent = args[3] || '';
      await runShadow(targetDir, targetFile, proposedContent);
      break;
    }
    case 'safe-write': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const proposedContent = args[3] || '';
      await runSafeWrite(targetDir, targetFile, proposedContent);
      break;
    }
    case 'ui': {
      const targetDir = args[1] || '.';
      const port = args[2] ? parseInt(args[2], 10) : 4444;
      await runUI(targetDir, port);
      break;
    }
    case 'watch': {
      const targetDir = args[1] || '.';
      await runWatch(targetDir);
      break;
    }
    case 'mcp': {
      const targetDir = args[1] || '.';
      await runMCP(targetDir);
      break;
    }
    case 'tui': {
      const targetDir = args[1] || '.';
      await runTUI(targetDir);
      break;
    }
    case 'license': {
      const subcommand = args[1] || 'status';
      const token = args[2];
      await runLicense(subcommand, token);
      break;
    }
    case 'swe-ci': {
      const targetDir = args[1] || '.';
      const action = args[2] || 'status';
      await runSWECI(targetDir, action);
      break;
    }
    case 'lsc': {
      const targetDir = args[1] || '.';
      const sourceFile = args[2];
      const oldSymbol = args[3];
      const newSymbol = args[4];
      await runLSC(targetDir, sourceFile, oldSymbol, newSymbol);
      break;
    }
    case 'mesh': {
      const action = args[1] || 'audit';
      await runMesh(action);
      break;
    }
    case 'preflight': {
      const targetDir = args[1] || '.';
      await runPreflight(targetDir);
      break;
    }
    case 'portfolio': {
      const targetDir = args[1] || '.';
      const mode = args[2] === '--pro' ? 'pro' : 'vibe';
      await runPortfolio(targetDir, mode);
      break;
    }
    case 'swarm': {
      const targetDir = args[1] || '.';
      const planPath = args[2];
      await runSwarm(targetDir, planPath);
      break;
    }
    case 'mutate': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: tesseract-context mutate <dir> <archivo>');
        process.exit(1);
      }
      await runMutate(targetDir, targetFile);
      break;
    }
    case 'transmute': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const symbol = args[3];
      const newSig = args[4] || `${symbol}V2`;
      if (!targetFile || !symbol) {
        console.error('Uso: tesseract-context transmute <dir> <archivo> <símbolo> [nuevaFirma]');
        process.exit(1);
      }
      await runTransmute(targetDir, targetFile, symbol, newSig);
      break;
    }
    case 'asymptotic':
    case 'phi': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const proposedFile = args[3];
      if (!targetFile) {
        console.error('Uso: tesseract-context asymptotic <dir> <archivo> [archivoPropuesto]');
        process.exit(1);
      }
      await runAsymptotic(targetDir, targetFile, proposedFile);
      break;
    }
    case 'causal':
    case 'psi': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const patchFile = args[3];
      if (!targetFile) {
        console.error('Uso: tesseract-context causal <dir> <archivo> [archivoParche]');
        process.exit(1);
      }
      await runCausal(targetDir, targetFile, patchFile);
      break;
    }
    case 'async-audit':
    case 'omega': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: tesseract-context async-audit <dir> <archivo>');
        process.exit(1);
      }
      await runAsyncAudit(targetDir, targetFile);
      break;
    }
    case 'grep':
    case 'search': {
      let targetDir = '.';
      let query = '';
      let mode = 'auto';
      let cell: string | undefined;
      let maxResults = 10;

      const remaining: string[] = [];
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--semantic') mode = 'semantic';
        else if (args[i] === '--exact') mode = 'exact';
        else if (args[i] === '--regex') mode = 'regex';
        else if (args[i] === '--cell' && args[i + 1]) {
          cell = args[++i];
        } else if ((args[i] === '--max' || args[i] === '-n') && args[i + 1]) {
          maxResults = parseInt(args[++i], 10);
        } else {
          remaining.push(args[i]);
        }
      }

      if (remaining.length > 1 && (fs.existsSync(remaining[0]) || remaining[0] === '.')) {
        targetDir = remaining[0];
        query = remaining.slice(1).join(' ');
      } else {
        query = remaining.join(' ');
      }

      if (!query) {
        console.error('Uso: octeract grep [dir] "<consulta_en_lenguaje_natural_o_regex>" [--semantic|--exact|--regex] [--cell <Cell>] [--max <N>]');
        process.exit(1);
      }

      await runGrep(targetDir, query, { mode, cell, maxResults });
      break;
    }
    case 'orchestrate':
    case 'conductor': {
      let targetDir = '.';
      let intent = '';
      let phase = 'auto';

      const remaining: string[] = [];
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--phase' && args[i + 1]) {
          phase = args[++i];
        } else {
          remaining.push(args[i]);
        }
      }

      if (remaining.length > 1 && (fs.existsSync(remaining[0]) || remaining[0] === '.')) {
        targetDir = remaining[0];
        intent = remaining.slice(1).join(' ');
      } else {
        intent = remaining.join(' ');
      }

      if (!intent) {
        console.error('Uso: octeract orchestrate [dir] "<intencion_usuario>" [--phase <diagnose|plan|simulate|execute|auto>]');
        process.exit(1);
      }

      await runOrchestrate(targetDir, intent, { phase });
      break;
    }
    case 'funsearch': {
      const targetDir = args[1] || '.';
      const fnName = args[2] || 'targetFunction';
      const baselineCode = args[3] || '';
      const candidateCode = args[4];
      await runFunSearch(targetDir, fnName, baselineCode, candidateCode);
      break;
    }
    case 'deductive': {
      const targetDir = args[1] || '.';
      await runDeductive(targetDir);
      break;
    }
    case 'alphadev': {
      const targetDir = args[1] || '.';
      const filePath = args[2];
      if (!filePath) {
        console.error('Uso: octeract alphadev [dir] <archivo>');
        process.exit(1);
      }
      await runAlphaDev(targetDir, filePath);
      break;
    }
    case 'pairformer': {
      const targetDir = args[1] || '.';
      await runPairformer(targetDir);
      break;
    }
    case 'octeract':
    case '8d': {
      const targetDir = args[1] || '.';
      await runOcteractStats(targetDir);
      break;
    }
    case '--version':
    case '-v': {
      console.log('Octeract-Context v4.1.0 (8D Universal Suite - E8 Riemannian Torus T^8 Context Engine)');
      break;
    }
    case 'help':
    case '--help':
    case '-h':
    default: {
      console.log(`
\x1b[1;36mOCTERACT-CONTEXT (8D)\x1b[0m: Motor de Contexto 8D (T^8 / E8) y Servidor MCP Universal
Uso: octeract-context <comando> [opciones] (o 'octeract' / 'tesseract')

Comandos disponibles:
  \x1b[32maudit\x1b[0m [directorio]    Auditoría estática determinista sin IA (0 tokens) de fracturas en R^8 / R^4
  \x1b[32mblast\x1b[0m [dir] <file> [sym] [hops] Radio de explosión interprocedural y efecto dominó (< 300 tokens)
  \x1b[32mpatch\x1b[0m [dir] <file> [sym]  Sintetiza un parche retrocompatible zero-touch para fracturas
  \x1b[32mtrial\x1b[0m [dir] <file> <code  Ensayo transaccional en RAM con remapeo delta y rollback automático
  \x1b[32mautoheal\x1b[0m [dir] <id> [--commit] Mini-subagente autónomo: sintetiza parche, ensaya en RAM y aplica
  \x1b[32mflow\x1b[0m [dir] <pregunta> Trazado causal geodésico en T^8 a partir de lenguaje natural (< 500 tokens)
  \x1b[32mhybrid-audit\x1b[0m [dir]    Triage colaborativo Octeracto + IA para auditoría semántica de código
  \x1b[32mmcp\x1b[0m [directorio]      Inicia el servidor MCP JSON-RPC para agentes IA (Cursor/Claude/Windsurf)
  \x1b[32mui\x1b[0m [directorio] [puerto] Inicia el Dashboard 8D interactivo táctil para Celulares y PCs (localhost:4444)
  \x1b[32mwatch\x1b[0m [directorio]    Inicia el Guardián Autónomo en disco (Shield Watcher)
  \x1b[32minit\x1b[0m [directorio]     Inicializa la protección autónoma (AGENTS.md, .cursorrules, .mcp.json)
  \x1b[32msafe-write\x1b[0m [dir] <file> <code  Modifica un archivo solo si supera la validación topológica 8D
  \x1b[32mindex\x1b[0m [directorio]    Escanea y construye el árbol fractal 8D en memoria
  \x1b[32mgrep\x1b[0m [dir] <query>    Grep semántico en lenguaje natural y estructural por líneas con snippets (< 150 tokens)
  \x1b[32mstats\x1b[0m [directorio]    Muestra métricas topológicas y salud arquitectónica
  \x1b[32mocteract\x1b[0m [dir]        Muestra métricas completas del Octeracto 8D (T^8, E8, Phi, Psi, Omega)
  \x1b[32masymptotic\x1b[0m [dir] <f>  Analiza complejidad Big-O estática (Dimensión Phi)
  \x1b[32mcausal\x1b[0m [dir] <f> <c>   Inferencia causal SCM Judea Pearl / Do-Calculus (Dimensión Psi)
  \x1b[32momega\x1b[0m [dir] <f>        Audita Event Loop y promesas flotantes (Dimensión Omega)
  \x1b[32mpreflight\x1b[0m [dir]    Auditoría 5D de empaquetado (Shebang, POSIX bits 100755, dist, exports)
  \x1b[32mportfolio\x1b[0m [dir]    Frontera eficiente de Markowitz (Sharpe Ratio, Kelly f*, Vibe Advisor)
  \x1b[32mslice\x1b[0m [dir] [celda]   Prueba un corte hiperdimensional quirúrgico con presupuesto de tokens
  \x1b[32mswarm\x1b[0m [dir] <agents.json> Coordinador de Voronoi: detecta colisiones semánticas y deadlocks
  \x1b[32mmutate\x1b[0m [dir] <file> [test] Fuzzing de mutación AST en RAM: detecta tests tramposos o tautológicos
  \x1b[32mtransmute\x1b[0m [dir] <f> <s> <sig> Transmutador atómico de cierre transitivo multi-archivo G*
  \x1b[32mtui\x1b[0m [directorio]      Inicia la visualización interactiva del hipercubo en terminal
  \x1b[32mhelp\x1b[0m                  Muestra esta ayuda
      `);
      break;
    }
  }
}


const isDirectRun = Boolean(process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith("tesseract-context.js") ||
  process.argv[1].endsWith("octeract-context.js")
));

if (isDirectRun) {
  main().catch((err) => {
    console.error('[OCTERACT FATAL ERROR]', err);
    process.exit(1);
  });
}

export { HypercubeSpace } from './core/hypercube.ts';
export { TopologicalAuditor } from './core/auditor.ts';
export { BlastRadiusCalculator } from './core/blast.ts';
export { TransactionalHealer } from './core/healing.ts';
export { ShadowEngine } from './core/shadow.ts';
export { MCPServer } from './mcp/server.ts';
export { FlowTracer } from './core/flow.ts';
export { eventBus, octeractEventBus } from './core/events.ts';
export { ProjectIndexer } from './core/indexer.ts';
export { SarifExporter } from './core/sarif.ts';
export { DifferentialShearAnalyzer } from './core/diff.ts';
export { ASTSkeletonizer } from './core/skeleton.ts';
export { TesseracticHoneycomb, OcteracticHoneycomb } from './core/honeycomb.ts';
export { type HardwareAccelerator, getHardwareAccelerator, CpuMultithreadBackend, WebGPUComputeBackend } from './core/accelerator.ts';
export { BinarySerializer } from './core/binary.ts';
export { IncrementalCache } from './core/cache.ts';
export { DeepContractDiagnostic } from './core/diagnostic.ts';
export { EnterpriseLicenseManager } from './enterprise/license.ts';
export { SWECIEngine } from './enterprise/swe-ci.ts';
export { LSCEngine } from './enterprise/lsc.ts';
export { DistributedMeshEngine } from './enterprise/mesh.ts';
export { TesseractPortfolioEngine, OcteractPortfolioEngine } from './enterprise/portfolio.ts';
export { TesseractSwarmCoordinator, OcteractSwarmCoordinator, TesseractSwarmCoordinator as HyperSwarmCoordinator } from './enterprise/swarm.ts';
export { TesseractMutationEngine, OcteractMutationEngine, TesseractMutationEngine as ASTMutationEngine } from './enterprise/mutation.ts';
export { TesseractAtomicTransmuter, OcteractAtomicTransmuter, TesseractAtomicTransmuter as AtomicTransmuter } from './enterprise/transmute.ts';
export { OcteractTree } from './core/octeract.ts';
export { AsymptoticAnalyzer } from './core/asymptotics.ts';
export { CausalInferenceEngine } from './core/causality.ts';
export { AsyncFlowAnalyzer } from './core/async-flow.ts';
export { TesseractDashboard, OcteractDashboard } from './ui/dashboard.ts';
export { TesseractTUI, OcteractTUI } from './cli/tui.ts';
export { OcteractOrchestratorEngine } from './core/orchestrator.ts';
export * from './deepmind/index.ts';



