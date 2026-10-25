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
import type { OcteractSeeOptions, OcteractSeeResult } from './types.ts';

export class OcteractSee {
  /**
   * Inspecciona un archivo de código con compresión extrema origami o esqueleto
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
      const evaRes = OcteractEVAAST.transliterate(code, relPath);
      return {
        filePath: relPath,
        symbol: options.symbol,
        mode: 'eva',
        lineCount: evaRes.totalGlyphs,
        originalTokensApprox: origTokens,
        compressedTokensApprox: Math.round(evaRes.evaCode.length / 3.8),
        compressionSavingsPercent: evaRes.tokenSavingsPercent,
        content: evaRes.evaCode,
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
