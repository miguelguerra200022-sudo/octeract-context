import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs';
/**
 * TESSERACT-CONTEXT: Punto de Entrada Principal
 */

import { runInit, runIndex, runStats, runSlice, runMCP, runTUI, runShadow, runUI, runWatch, runSafeWrite, runAudit, runFlow, runHybridAudit, runBlast, runPatch, runTrial, runAutoHeal, runSarif, runDiff, runHook, runLicense, runSWECI, runLSC, runMesh, runPreflight, runPortfolio, runSwarm, runMutate, runTransmute, runAsymptotic, runCausal, runAsyncAudit, runOcteractStats, runGrep, runOrchestrate, runFunSearch, runDeductive, runAlphaDev, runPairformer, runProgramSlice, runReproduce, runSpeculativePatch, runMcts, runEVAAST, runMontemurro, runSlotMachine, runCurrier, runEntropyH2, runCardanFuzz, runVoxelPalette, runVoxelBiomes, runVoxelHorizon, runVoxelStarlight, runVoxelAnvil, runVoxelJigsaw, runVoxelCuller, runVoxelObserver, runReaBundle, runReaCompare, runReaArmor, runReaNative, runDragonFold, runDragonBlast, runDragonCoords, runDragonTile, runDragonCreaseFuzz, runDoctor, runSee, runImpact, runAsk } from './cli/commands.ts';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || (process.stdin.isTTY ? 'help' : 'mcp');

  switch (command) {
    case 'doctor': {
      const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      const deep = args.includes('--deep');
      const sarif = args.includes('--sarif');
      await runDoctor(targetDir, { deep, sarif });
      break;
    }
    case 'see': {
      const targetFile = args[1];
      if (!targetFile) {
        console.error('Uso: octeract see <archivo> [símbolo] [--mode=origami|skeleton|full|eva|sieve]');
        process.exit(1);
      }
      let symbol: string | undefined;
      let mode: 'origami' | 'skeleton' | 'full' | 'eva' | 'sieve' = 'origami';
      for (let i = 2; i < args.length; i++) {
        if (args[i].startsWith('--mode=')) {
          mode = args[i].split('=')[1] as any;
        } else if (!symbol) {
          symbol = args[i];
        }
      }
      await runSee(targetFile, symbol, mode);
      break;
    }
    case 'impact': {
      const targetFile = args[1];
      if (!targetFile) {
        console.error('Uso: octeract impact <archivo> [símbolo] [saltos]');
        process.exit(1);
      }
      const symbol = args[2] && !args[2].match(/^\d+$/) ? args[2] : undefined;
      const maxHopsArg = args[2] && args[2].match(/^\d+$/) ? args[2] : args[3];
      const maxHops = maxHopsArg ? parseInt(maxHopsArg, 10) : 15;
      await runImpact(targetFile, symbol, maxHops);
      break;
    }
    case 'ask': {
      const question = args.slice(1).join(' ');
      if (!question) {
        console.error('Uso: octeract ask <pregunta en lenguaje natural>');
        process.exit(1);
      }
      await runAsk(question);
      break;
    }
    case 'dragon': {
      const sub = args[1] || 'help';
      switch (sub) {
        case 'fold':
          if (!args[2]) { console.error('Uso: octeract dragon fold <archivo> [símbolo]'); process.exit(1); }
          await runDragonFold(args[2], args[3]);
          break;
        case 'blast':
          if (!args[2]) { console.error('Uso: octeract dragon blast <archivo> [energía]'); process.exit(1); }
          await runDragonBlast(args[2], args[3] ? parseFloat(args[3]) : 1.0);
          break;
        case 'coords':
          if (!args[2]) { console.error('Uso: octeract dragon coords <archivo> [archivo2]'); process.exit(1); }
          await runDragonCoords(args[2], args[3]);
          break;
        case 'tile':
          await runDragonTile(args[2] || '.');
          break;
        case 'fuzz':
          if (!args[2]) { console.error('Uso: octeract dragon fuzz <archivo>'); process.exit(1); }
          await runDragonCreaseFuzz(args[2]);
          break;
        default:
          console.log(`\x1b[1;36mOcteract Dragon Suite\x1b[0m: fold | blast | coords | tile | fuzz`);
          break;
      }
      break;
    }
    case 'rea': {
      const sub = args[1] || 'help';
      switch (sub) {
        case 'bundle':
          if (!args[2]) { console.error('Uso: octeract rea bundle <archivoBundle>'); process.exit(1); }
          await runReaBundle(args[2]);
          break;
        case 'compare':
          if (!args[2] || !args[3]) { console.error('Uso: octeract rea compare <sourceFile> <bundleFile>'); process.exit(1); }
          await runReaCompare(args[2], args[3]);
          break;
        case 'armor':
          if (!args[2]) { console.error('Uso: octeract rea armor <archivo>'); process.exit(1); }
          await runReaArmor(args[2]);
          break;
        case 'native':
          if (!args[2]) { console.error('Uso: octeract rea native <archivo>'); process.exit(1); }
          await runReaNative(args[2]);
          break;
        default:
          console.log(`\x1b[1;36mOcteract REA Suite\x1b[0m: bundle | compare | armor | native`);
          break;
      }
      break;
    }
    case 'voxel': {
      const sub = args[1] || 'help';
      switch (sub) {
        case 'palette':
          await runVoxelPalette(args[2] || '.');
          break;
        case 'biomes':
          await runVoxelBiomes(args[2] || '.', args[3]);
          break;
        case 'horizon':
          await runVoxelHorizon(args[2] || '.');
          break;
        case 'starlight':
          if (!args[2]) { console.error('Uso: octeract voxel starlight <archivo>'); process.exit(1); }
          await runVoxelStarlight(args[2]);
          break;
        case 'anvil':
          await runVoxelAnvil(args[2] || '.');
          break;
        case 'jigsaw':
          await runVoxelJigsaw(args[2] || '.');
          break;
        case 'culler':
          if (!args[2]) { console.error('Uso: octeract voxel culler <archivo>'); process.exit(1); }
          await runVoxelCuller(args[2]);
          break;
        case 'pulse':
          await runVoxelObserver(args[2] || '.');
          break;
        default:
          console.log(`\x1b[1;36mOcteract Voxel Suite\x1b[0m: palette | biomes | horizon | starlight | anvil | jigsaw | culler | pulse`);
          break;
      }
      break;
    }
    case 'voynich': {
      const sub = args[1] || 'help';
      switch (sub) {
        case 'eva':
          if (!args[2]) { console.error('Uso: octeract voynich eva <archivo>'); process.exit(1); }
          await runEVAAST(args[3] || '.', args[2]);
          break;
        case 'montemurro':
          await runMontemurro(args[2] || '.');
          break;
        case 'slot':
          if (!args[2]) { console.error('Uso: octeract voynich slot <archivo>'); process.exit(1); }
          await runSlotMachine(args[3] || '.', args[2]);
          break;
        case 'currier':
          await runCurrier(args[2] || '.', args[3]);
          break;
        case 'entropy':
          if (!args[2]) { console.error('Uso: octeract voynich entropy <archivo>'); process.exit(1); }
          await runEntropyH2(args[3] || '.', args[2]);
          break;
        case 'cardan':
          if (!args[2]) { console.error('Uso: octeract voynich cardan <archivo>'); process.exit(1); }
          await runCardanFuzz(args[3] || '.', args[2], args[4] ? parseInt(args[4], 10) : 5);
          break;
        default:
          console.log(`\x1b[1;36mOcteract Voynich Suite\x1b[0m: eva | montemurro | slot | currier | entropy | cardan`);
          break;
      }
      break;
    }
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
      let targetDir = '.';
      let targetFile = args[1];
      let proposedContent = args[2] || '';
      if (args[3] !== undefined) {
        targetDir = args[1];
        targetFile = args[2];
        proposedContent = args[3];
      }
      if (!targetFile) {
        console.error('Uso: octeract safe-write <archivo> <codigoPropuesto> (o <dir> <archivo> <codigo>)');
        process.exit(1);
      }
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
    case 'program-slice':
    case 'slice-program': {
      const targetDir = args[1] || '.';
      const filePath = args[2];
      const variable = args[3];
      const direction = args[4] === 'forward' ? 'forward' : 'backward';
      if (!filePath) {
        console.error('Uso: octeract program-slice <dir> <archivo> [variable] [backward|forward]');
        process.exit(1);
      }
      await runProgramSlice(targetDir, filePath, { variable, direction });
      break;
    }
    case 'reproduce': {
      const targetDir = args[1] || '.';
      const fractureId = args[2];
      await runReproduce(targetDir, fractureId);
      break;
    }
    case 'patch-ast':
    case 'patch-speculative': {
      const targetDir = args[1] || '.';
      const filePath = args[2];
      const className = args[3];
      const methodName = args[4];
      const patchCode = args[5] || '';
      if (!filePath || !patchCode) {
        console.error('Uso: octeract patch-ast <dir> <archivo> <clase> <metodo> <codigoParche>');
        process.exit(1);
      }
      await runSpeculativePatch(targetDir, filePath, { className, methodName, patchCode });
      break;
    }
    case 'mcts': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const candidateCode = args[3] || 'export function fix() { return true; }';
      if (!targetFile) {
        console.error('Uso: octeract mcts <dir> <archivoObjetivo> [codigoCandidato]');
        process.exit(1);
      }
      await runMcts(targetDir, targetFile, candidateCode);
      break;
    }
    case 'eva-ast': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: octeract eva-ast <dir> <archivo>');
        process.exit(1);
      }
      await runEVAAST(targetDir, targetFile);
      break;
    }
    case 'montemurro': {
      const targetDir = args[1] || '.';
      await runMontemurro(targetDir);
      break;
    }
    case 'slot-machine': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: octeract slot-machine <dir> <archivo>');
        process.exit(1);
      }
      await runSlotMachine(targetDir, targetFile);
      break;
    }
    case 'currier': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      await runCurrier(targetDir, targetFile);
      break;
    }
    case 'entropy-h2': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: octeract entropy-h2 <dir> <archivo>');
        process.exit(1);
      }
      await runEntropyH2(targetDir, targetFile);
      break;
    }
    case 'cardan-fuzz': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      const maxMutants = args[3] ? parseInt(args[3], 10) : 10;
      if (!targetFile) {
        console.error('Uso: octeract cardan-fuzz <dir> <archivo> [maxMutantes]');
        process.exit(1);
      }
      await runCardanFuzz(targetDir, targetFile, maxMutants);
      break;
    }
    case 'voxel-palette': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: octeract voxel-palette <dir> <archivo>');
        process.exit(1);
      }
      await runVoxelPalette(targetDir, targetFile);
      break;
    }
    case 'voxel-biomes': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      await runVoxelBiomes(targetDir, targetFile);
      break;
    }
    case 'voxel-horizon': {
      const targetDir = args[1] || '.';
      const focusFile = args[2];
      const radius = args[3] ? parseInt(args[3], 10) : 2;
      if (!focusFile) {
        console.error('Uso: octeract voxel-horizon <dir> <focusFile> [radio]');
        process.exit(1);
      }
      await runVoxelHorizon(targetDir, focusFile, radius);
      break;
    }
    case 'voxel-starlight': {
      const targetDir = args[1] || '.';
      const sourceFile = args[2];
      if (!sourceFile) {
        console.error('Uso: octeract voxel-starlight <dir> <sourceFile>');
        process.exit(1);
      }
      await runVoxelStarlight(targetDir, sourceFile);
      break;
    }
    case 'voxel-anvil': {
      const targetDir = args[1] || '.';
      const action = (args[2] as 'pack' | 'inspect') || 'inspect';
      await runVoxelAnvil(targetDir, action);
      break;
    }
    case 'voxel-jigsaw': {
      const targetDir = args[1] || '.';
      const rootPieceId = args[2] || 'root-entrypoint';
      await runVoxelJigsaw(targetDir, rootPieceId);
      break;
    }
    case 'voxel-culler': {
      const targetDir = args[1] || '.';
      const targetFile = args[2];
      if (!targetFile) {
        console.error('Uso: octeract voxel-culler <dir> <archivo>');
        process.exit(1);
      }
      await runVoxelCuller(targetDir, targetFile);
      break;
    }
    case 'voxel-observer': {
      const targetDir = args[1] || '.';
      const targetFile = args[2] || 'src/index.ts';
      await runVoxelObserver(targetDir, targetFile);
      break;
    }
    case 'octeract':
    case '8d': {
      const targetDir = args[1] || '.';
      await runOcteractStats(targetDir);
      break;
    }
    case 'rea-bundle': {
      const bundlePath = args[1];
      if (!bundlePath) {
        console.error('Uso: octeract rea-bundle <archivoBundle>');
        process.exit(1);
      }
      await runReaBundle(bundlePath);
      break;
    }
    case 'rea-compare': {
      const sourceDir = args[1] || 'src';
      const bundlePath = args[2] || 'dist/bundle.js';
      await runReaCompare(sourceDir, bundlePath);
      break;
    }
    case 'rea-armor': {
      const filePath = args[1];
      if (!filePath) {
        console.error('Uso: octeract rea-armor <archivo>');
        process.exit(1);
      }
      await runReaArmor(filePath);
      break;
    }
    case 'rea-native': {
      const binaryPath = args[1];
      if (!binaryPath) {
        console.error('Uso: octeract rea-native <archivo.node>');
        process.exit(1);
      }
      await runReaNative(binaryPath);
      break;
    }
    case 'dragon-fold': {
      const filePath = args[1];
      const targetSymbol = args[2];
      if (!filePath) {
        console.error('Uso: octeract dragon-fold <archivo> [símbolo]');
        process.exit(1);
      }
      await runDragonFold(filePath, targetSymbol);
      break;
    }
    case 'dragon-blast': {
      const filePath = args[1];
      const energy = args[2] ? parseFloat(args[2]) : 1.0;
      if (!filePath) {
        console.error('Uso: octeract dragon-blast <archivo> [energía]');
        process.exit(1);
      }
      await runDragonBlast(filePath, energy);
      break;
    }
    case 'dragon-coords': {
      const filePath = args[1];
      const compareWith = args[2];
      if (!filePath) {
        console.error('Uso: octeract dragon-coords <archivo> [archivoComparar]');
        process.exit(1);
      }
      await runDragonCoords(filePath, compareWith);
      break;
    }
    case 'dragon-tile': {
      const rootDir = args[1] || '.';
      await runDragonTile(rootDir);
      break;
    }
    case 'dragon-fuzz': {
      const filePath = args[1];
      if (!filePath) {
        console.error('Uso: octeract dragon-fuzz <archivo>');
        process.exit(1);
      }
      await runDragonCreaseFuzz(filePath);
      break;
    }
    case '--version':
    case '-v': {
      console.log('Octeract-Context v4.8.1 (8D Universal Suite - 5 Master Apertures Facade, Dragon Curve & REA Armor)');
      break;
    }
    case 'help':
    case '--help':
    case '-h':
    default: {
      console.log(`
\x1b[1;36mOCTERACT-CONTEXT (8D Universal Suite v4.8.1)\x1b[0m: Motor de Contexto 8D y Servidor MCP Universal
Uso: octeract <comando> [opciones] (o 'octeract-context' / 'tesseract')

\x1b[1;33m🌟 LAS 5 APERTURAS MAESTRAS (FACHADA PRINCIPAL RECOMENDADA):\x1b[0m
  \x1b[1;32mdoctor\x1b[0m [dir] [--deep]       🩺 Diagnóstico holístico universal: Salud 8D, Dragones, Biomas y Armadura (< 250 tokens)
  \x1b[1;32msee\x1b[0m <file> [sym] [--mode]  👁️ Lente Origami AST y Esqueleto: Plegado valle/montaña (< 200 tokens)
  \x1b[1;32mimpact\x1b[0m <file> [sym] [hops] 💥 Onda de choque fractal Heighway (Hausdorff dH/2) y efecto dominó (< 250 tokens)
  \x1b[1;32msafe-write\x1b[0m <file> <codigo>  🛡️ Escritura quirúrgica: Crease Fuzz + Escudo 4D + Reducción de entropía
  \x1b[1;32mask\x1b[0m <pregunta en texto>    🧠 Motor semántico geodésico: Trazado causal T^8 + Grep BM25F (< 300 tokens)

\x1b[1;34m🧭 ESPACIOS DE NOMBRES ESPECIALIZADOS (Comandos avanzados):\x1b[0m
  \x1b[36mdragon\x1b[0m <fold|blast|coords|tile|fuzz>   Suites de la Curva del Dragón (Origami, Hausdorff, Teselación)
  \x1b[36mrea\x1b[0m <bundle|compare|armor|native>       Ingeniería Inversa REA (Evidencias, Bundles, Armaduras)
  \x1b[36mvoxel\x1b[0m <palette|biomes|horizon|...>     Motores Voxel tipo Minecraft (Paletas, Starlight, Anvil)
  \x1b[36mvoynich\x1b[0m <eva|montemurro|slot|...>      Motores Lingüísticos Voynich (EVA AST, Entropía h2, Cardano)
  \x1b[36mcore\x1b[0m <mcp|ui|watch|init|stats|diff>    Servidores de integración y herramientas del núcleo

\x1b[1;35m⚙️ HERRAMIENTAS INDIVIDUALES HEREDADAS (100% Retrocompatibles):\x1b[0m
  \x1b[32maudit\x1b[0m, \x1b[32mblast\x1b[0m, \x1b[32mpatch\x1b[0m, \x1b[32mtrial\x1b[0m, \x1b[32mautoheal\x1b[0m, \x1b[32mflow\x1b[0m, \x1b[32mmcp\x1b[0m, \x1b[32mui\x1b[0m, \x1b[32mwatch\x1b[0m, \x1b[32minit\x1b[0m, \x1b[32mindex\x1b[0m, \x1b[32mgrep\x1b[0m, \x1b[32mslice\x1b[0m, \x1b[32mswarm\x1b[0m...
      `);
      break;
    }
  }
}


let isDirectRun = false;
try {
  if (process.argv[1]) {
    const scriptPath = fs.existsSync(process.argv[1]) ? fs.realpathSync(path.resolve(process.argv[1])) : path.resolve(process.argv[1]);
    const currentPath = fs.realpathSync(fileURLToPath(import.meta.url));
    isDirectRun = (
      scriptPath === currentPath ||
      process.argv[1].endsWith("tesseract-context.js") ||
      process.argv[1].endsWith("octeract-context.js") ||
      process.argv[1].endsWith("src/index.ts") ||
      process.argv[1].endsWith("src/index.js")
    );
  }
} catch {
  isDirectRun = Boolean(process.argv[1] && (
    process.argv[1].endsWith("index.ts") ||
    process.argv[1].endsWith("tesseract-context.js") ||
    process.argv[1].endsWith("octeract-context.js")
  ));
}

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
export { OcteractProgramSlicer } from './core/slicer.ts';
export { OcteractReproducer } from './core/reproducer.ts';
export { OcteractSpeculativePatcher } from './core/patcher.ts';
export { OcteractTreeSearch } from './core/mcts.ts';
export * from './voynich/index.ts';
export * from './voxel/index.ts';
export * from './rea/index.ts';
export * from './dragon/index.ts';
export * from './unified/index.ts';
