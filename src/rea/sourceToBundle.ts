/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractSourceToBundleAttribution - Supply Chain Integrity & Drift Detector
 *
 * Inspired by morluto/rea compare_source_to_bundle:
 * Maps compiled/bundled distribution artifacts against original source files,
 * detecting supply-chain backdoors, build-time code injections, and uncommitted drift.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { OcteractReverseBundle, type ReversedModule } from './reverseBundle.ts';

export interface SourceSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'type';
  sourceFile: string;
  line: number;
}

export interface AttributionMatch {
  sourceSymbol: string;
  sourceFile: string;
  matchedBundleModule: string;
  status: 'ATTRIBUTED_EXACT' | 'ATTRIBUTED_MANGLED' | 'MISSING_IN_BUNDLE';
  confidence: number;
}

export interface PhantomAnomaly {
  bundleModule: string;
  symbolOrSnippet: string;
  type: 'GHOST_CODE_INJECTION' | 'SUSPICIOUS_UNMAPPED_MODULE' | 'DYNAMIC_EVAL_IN_BUNDLE';
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rationale: string;
}

export interface SourceToBundleReport {
  sourceFilesCount: number;
  totalSourceSymbols: number;
  bundleModulesCount: number;
  attributedMatches: AttributionMatch[];
  phantomAnomalies: PhantomAnomaly[];
  integrityScore: number; // 0 - 100
  verdict: 'CRYPTO_VERIFIED_CLEAN' | 'ACCEPTABLE_BUILD_TRANSFORMS' | 'SUSPECTED_TAMPERING';
  summary: {
    exactMatches: number;
    mangledMatches: number;
    missingInBundle: number;
    ghostInjections: number;
  };
}

export class OcteractSourceToBundleAttribution {
  /**
   * Compares source code against a compiled bundle.
   */
  public static compare(
    sourceMap: Record<string, string>, // filePath -> sourceCode
    bundleCode: string,
    bundleName: string = 'bundle.js'
  ): SourceToBundleReport {
    // 1. Extract declared symbols from source files
    const sourceSymbols: SourceSymbol[] = [];
    for (const [filePath, code] of Object.entries(sourceMap)) {
      sourceSymbols.push(...this.extractSourceSymbols(filePath, code));
    }

    // 2. De-bundle compiled artifact
    const bundleAnalysis = OcteractReverseBundle.analyzeBundle(bundleCode, bundleName);
    const bundleModules = bundleAnalysis.modules;

    // 3. Perform attribution matching
    const attributedMatches: AttributionMatch[] = [];
    const sourceMatchedNames = new Set<string>();

    for (const srcSym of sourceSymbols) {
      let matchedMod: ReversedModule | null = null;
      let isExact = false;

      for (const mod of bundleModules) {
        // Check exported symbols
        if (mod.exportedSymbols.includes(srcSym.name)) {
          matchedMod = mod;
          isExact = true;
          break;
        }
        // Check strings or snippet
        if (mod.snippet.includes(srcSym.name) || mod.name.includes(srcSym.name)) {
          matchedMod = mod;
          break;
        }
      }

      if (matchedMod) {
        sourceMatchedNames.add(srcSym.name);
        attributedMatches.push({
          sourceSymbol: srcSym.name,
          sourceFile: srcSym.sourceFile,
          matchedBundleModule: matchedMod.moduleId,
          status: isExact ? 'ATTRIBUTED_EXACT' : 'ATTRIBUTED_MANGLED',
          confidence: isExact ? 100 : 75,
        });
      } else {
        attributedMatches.push({
          sourceSymbol: srcSym.name,
          sourceFile: srcSym.sourceFile,
          matchedBundleModule: 'NONE',
          status: 'MISSING_IN_BUNDLE',
          confidence: 0,
        });
      }
    }

    // 4. Detect Phantom Injections (Code in bundle with NO origin in source)
    const phantomAnomalies: PhantomAnomaly[] = [];

    for (const mod of bundleModules) {
      // Check for suspicious indicators (eval, script injection)
      for (const sus of mod.suspiciousIndicators) {
        phantomAnomalies.push({
          bundleModule: mod.moduleId,
          symbolOrSnippet: sus,
          type: 'DYNAMIC_EVAL_IN_BUNDLE',
          severity: 'CRITICAL',
          rationale: `Dangerous construct '${sus}' detected in bundle module '${mod.moduleId}' that is absent in source.`,
        });
      }

      // Check for exported symbols in bundle that do not correspond to ANY source symbol
      for (const expSym of mod.exportedSymbols) {
        // Skip common bundler internal identifiers
        if (['default', '__esModule', '__proto__', 'm', 'e', 't', 'n', 'r'].includes(expSym)) {
          continue;
        }

        const foundInSource = sourceSymbols.some(
          (s) => s.name === expSym || expSym.toLowerCase().includes(s.name.toLowerCase())
        );

        if (!foundInSource && expSym.length > 3) {
          phantomAnomalies.push({
            bundleModule: mod.moduleId,
            symbolOrSnippet: expSym,
            type: 'GHOST_CODE_INJECTION',
            severity: 'HIGH',
            rationale: `Exported symbol '${expSym}' exists in compiled bundle '${mod.moduleId}' but was NEVER declared in any source file. Possible supply chain injection.`,
          });
        }
      }
    }

    // 5. Compute Mathematical Integrity Score
    const exactCount = attributedMatches.filter((m) => m.status === 'ATTRIBUTED_EXACT').length;
    const mangledCount = attributedMatches.filter((m) => m.status === 'ATTRIBUTED_MANGLED').length;
    const missingCount = attributedMatches.filter((m) => m.status === 'MISSING_IN_BUNDLE').length;
    const ghostCount = phantomAnomalies.length;

    let integrityScore = 100;
    if (sourceSymbols.length > 0) {
      const matchRatio = (exactCount * 1.0 + mangledCount * 0.8) / sourceSymbols.length;
      integrityScore = Math.round(matchRatio * 100);
    }
    // Penalize ghost injections heavily
    integrityScore = Math.max(0, integrityScore - ghostCount * 20);

    const verdict: SourceToBundleReport['verdict'] =
      integrityScore >= 90 && ghostCount === 0 ? 'CRYPTO_VERIFIED_CLEAN' :
      integrityScore >= 60 && ghostCount === 0 ? 'ACCEPTABLE_BUILD_TRANSFORMS' :
      'SUSPECTED_TAMPERING';

    return {
      sourceFilesCount: Object.keys(sourceMap).length,
      totalSourceSymbols: sourceSymbols.length,
      bundleModulesCount: bundleModules.length,
      attributedMatches,
      phantomAnomalies,
      integrityScore,
      verdict,
      summary: {
        exactMatches: exactCount,
        mangledMatches: mangledCount,
        missingInBundle: missingCount,
        ghostInjections: ghostCount,
      },
    };
  }

  private static extractSourceSymbols(filePath: string, code: string): SourceSymbol[] {
    const symbols: SourceSymbol[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match export class Foo
      const classMatch = line.match(/export\s+(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        symbols.push({ name: classMatch[1], kind: 'class', sourceFile: filePath, line: i + 1 });
        continue;
      }
      // Match export function foo
      const fnMatch = line.match(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/);
      if (fnMatch) {
        symbols.push({ name: fnMatch[1], kind: 'function', sourceFile: filePath, line: i + 1 });
        continue;
      }
      // Match export interface Foo
      const ifaceMatch = line.match(/export\s+interface\s+([a-zA-Z0-9_$]+)/);
      if (ifaceMatch) {
        symbols.push({ name: ifaceMatch[1], kind: 'interface', sourceFile: filePath, line: i + 1 });
        continue;
      }
      // Match export const/let/var foo
      const varMatch = line.match(/export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/);
      if (varMatch) {
        symbols.push({ name: varMatch[1], kind: 'variable', sourceFile: filePath, line: i + 1 });
        continue;
      }
    }

    return symbols;
  }
}
