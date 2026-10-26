/**
 * OCTERACT UNIFIED FACADE: Apertura Maestra 2
 * OcteractSee: Lente de Inspección Fractal Comprimida (< 200 tokens)
 * Fusión de Origami AST (Dragon Fold), Skeletonizer y Unfolding Selectivo
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { OcteractDragonFold } from '../dragon/dragonFold.ts';
import { ASTSkeletonizer } from '../core/skeleton.ts';
import { OcteractEVAAST } from '../voynich/eva-ast.ts';
import { OcteractSieve } from '../core/sieve.ts';
import { ProjectIndexer } from '../core/indexer.ts';
import { OcteractRaupMorphospace } from '../morphology/index.ts';
import type { OcteractSeeOptions, OcteractSeeResult } from './types.ts';

export class OcteractSee {
  /**
   * Inspecciona un archivo de código con compresión extrema origami, esqueleto o sieve
   */
  public static async inspect(
    targetFile: string,
    options: OcteractSeeOptions = {}
  ): Promise<OcteractSeeResult> {
    const root = path.resolve(options.rootDir || '.');
    const fullPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(root, targetFile);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Archivo no encontrado para inspección: ${targetFile}`);
    }

    const code = fs.readFileSync(fullPath, 'utf-8');
    const mode = options.mode || 'origami';
    const relPath = path.relative(root, fullPath);
    const lineCount = code.split('\n').length;
    const origTokens = Math.max(1, Math.round(code.length / 3.8));

    const ext = path.extname(relPath).toLowerCase();
    const isLogOrData = ['.log', '.csv', '.tsv'].includes(ext) || (ext === '.json' && lineCount > 40);

    if (mode === 'sieve' || (mode === 'origami' && isLogOrData)) {
      const sieveRes = OcteractSieve.sieve(code, relPath);
      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'sieve',
        lineCount: sieveRes.sievedContent.split('\n').length,
        originalTokensApprox: sieveRes.originalTokensApprox,
        compressedTokensApprox: sieveRes.compressedTokensApprox,
        compressionSavingsPercent: sieveRes.reductionPercentage,
        content: sieveRes.sievedContent,
        sieveSummary: sieveRes.summary,
      };
    }

    if (mode === 'full') {
      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'full',
        lineCount,
        originalTokensApprox: origTokens,
        compressedTokensApprox: origTokens,
        compressionSavingsPercent: 0,
        content: code,
      };
    }

    if (mode === 'eva') {
      const evaRes = OcteractEVAAST.transliterate(code);
      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'eva',
        lineCount: evaRes.slots.length,
        originalTokensApprox: evaRes.originalTokens,
        compressedTokensApprox: evaRes.evaTokens,
        compressionSavingsPercent: evaRes.tokenReductionPercent,
        content: evaRes.evaGlyphBlock,
      };
    }

    if (mode === 'skeleton') {
      const skelRes = ASTSkeletonizer.skeletonize(code, relPath);
      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'skeleton',
        lineCount: skelRes.skeletonLines,
        originalTokensApprox: skelRes.originalTokensEstimated,
        compressedTokensApprox: skelRes.skeletonTokensEstimated,
        compressionSavingsPercent: skelRes.reductionPercentage,
        content: skelRes.skeletonCode,
      };
    }

    if (mode === 'nautilus') {
      const indexer = new ProjectIndexer();
      const loaded = indexer.loadIndex(root);
      if (!loaded) {
        indexer.indexDirectory({ rootDir: root, maxFiles: 500 });
      }
      const space = indexer.getSpace();
      const partition = OcteractRaupMorphospace.partitionNautilusChambers(space, relPath, root);

      const chamberLines = [
        `// 🐚 [OCTERACT NAUTILUS CHAMBERS: Partición Acrecionaria de Concha (Raup 1966)]`,
        `// Cámara de Habitación Activa (100% fidelidad): ${partition.livingChamber.filePath} (~${partition.livingChamber.tokensApprox} tokens)`,
        `// Cámaras Septales Adyacentes (Hop 1): ${partition.adjacentChambers.length} módulos (~${partition.adjacentChambers.reduce((a, b) => a + b.tokensApprox, 0)} tokens)`,
        `// Cámaras Ancestrales Selladas (Hop 2+): ${partition.sealedSepta.length} módulos (~${partition.sealedSepta.length * 3} tokens)`,
        `// Ahorro Total de Contexto: ${partition.contextSavingsPercent}% (${partition.totalUncompressedTokens} -> ${partition.totalChamberTokens} tokens)\n`,
        `// === [CÁMARA DE HABITACIÓN ACTIVA: ${relPath}] ===`,
        partition.livingChamber.content,
        `\n// === [CÁMARAS SEPTALES ADYACENTES (HOP 1: ESQUELETOS AST)] ===`,
        ...partition.adjacentChambers.map((c) => `// --- Cámara #${c.chamberIndex}: ${c.filePath} ---\n${c.content}`),
        `\n// === [CÁMARAS ANCESTRALES TABICADAS Y SELLADAS (HOP 2+: 1 TOKEN/TABIQUE)] ===`,
        ...partition.sealedSepta.map((s) => s.septumSummary),
      ];

      const content = chamberLines.join('\n');
      const compressedTokens = partition.totalChamberTokens;

      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'nautilus',
        lineCount: content.split('\n').length,
        originalTokensApprox: partition.totalUncompressedTokens,
        compressedTokensApprox: compressedTokens,
        compressionSavingsPercent: partition.contextSavingsPercent,
        content,
        nautilusPartition: partition,
      };
    }

    // Default: 'origami' (Dragon Fold)
    const foldRes = OcteractDragonFold.foldCode(code, relPath);

    let finalContent = foldRes.foldedCode;
    let finalCompressedTokens = foldRes.foldedEstimatedTokens;

    // Si se solicitó un símbolo específico, desplegarlo selectivamente (Unfold)
    if (options.symbol) {
      const unfolded = OcteractDragonFold.unfoldTarget(code, options.symbol);
      if (unfolded) {
        finalContent = [
          `// 🐉 [OCTERACT SEE: Símbolo desplegado '${options.symbol}' con contexto plegado]`,
          unfolded,
          `\n// --- [SUPERFICIE PLEGADA RESTANTE DEL ARCHIVO] ---`,
          foldRes.foldedCode,
        ].join('\n');
        finalCompressedTokens = Math.round(finalContent.length / 3.8);
      }
    }

    const savings = Math.max(
      0,
      Math.round(((origTokens - finalCompressedTokens) / origTokens) * 100)
    );

    return {
      filePath: relPath,
      symbol: options.symbol,
      mode: 'origami',
      lineCount: finalContent.split('\n').length,
      originalTokensApprox: origTokens,
      compressedTokensApprox: finalCompressedTokens,
      compressionSavingsPercent: savings,
      content: finalContent,
      valleyFoldsCount: foldRes.valleyFoldsCount,
      mountainFoldsCount: foldRes.mountainFoldsCount,
    };
  }
}
