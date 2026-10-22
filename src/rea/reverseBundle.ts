/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractReverseBundle - Static JS/TS Bundle De-bundler & Reverse Engineer
 *
 * Inspired by morluto/rea analyze_javascript_application & inspect_artifact:
 * Statically parses and deconstructs compiled/minified bundles (Webpack, Rollup, esbuild,
 * and distribution scripts), reconstructs module boundaries, exports, and call edges,
 * and projects reversed modules into Octeract's 8D hypercube.
 */

import * as crypto from 'node:crypto';

export type OcteractCell =
  | 'CoreLogic'
  | 'Storage'
  | 'UI'
  | 'Security'
  | 'Config'
  | 'Telemetry'
  | 'Tests'
  | 'Network';

export interface ReversedModule {
  moduleId: string;
  name: string;
  cell: OcteractCell;
  codeLength: number;
  complexityScore: number;
  exportedSymbols: string[];
  importedModules: string[];
  strings: string[];
  suspiciousIndicators: string[];
  snippet: string;
}

export interface BundleReconstructionReport {
  bundleName: string;
  bundleSize: number;
  format: 'webpack' | 'rollup_or_esbuild' | 'cjs_bundle' | 'esm_bundle' | 'monolithic';
  totalModulesFound: number;
  modules: ReversedModule[];
  callGraph: Array<{ from: string; to: string }>;
  cellDistribution: Record<OcteractCell, number>;
  securityFlags: Array<{ moduleId: string; flag: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  reconstructionConfidence: number; // 0 - 100
}

export class OcteractReverseBundle {
  /**
   * Statically deconstructs a JS/TS bundle into constituent modules and hypercube vertices.
   */
  public static analyzeBundle(code: string, bundleName: string = 'bundle.js'): BundleReconstructionReport {
    const bundleSize = Buffer.byteLength(code, 'utf8');
    const format = this.detectFormat(code);
    const modules: ReversedModule[] = [];
    const callGraph: Array<{ from: string; to: string }> = [];

    // Extract modules based on detected bundler architecture
    if (format === 'webpack') {
      modules.push(...this.extractWebpackModules(code));
    } else if (format === 'rollup_or_esbuild') {
      modules.push(...this.extractRollupEsbuildModules(code));
    } else {
      modules.push(...this.extractGenericModules(code));
    }

    // Build internal call graph between modules
    for (const mod of modules) {
      for (const imported of mod.importedModules) {
        const target = modules.find((m) => m.moduleId === imported || m.name === imported);
        if (target) {
          callGraph.push({ from: mod.moduleId, to: target.moduleId });
        }
      }
    }

    // Cell distribution across 8 dimensions
    const cellDistribution: Record<OcteractCell, number> = {
      CoreLogic: 0,
      Storage: 0,
      UI: 0,
      Security: 0,
      Config: 0,
      Telemetry: 0,
      Tests: 0,
      Network: 0,
    };

    const securityFlags: BundleReconstructionReport['securityFlags'] = [];

    for (const mod of modules) {
      cellDistribution[mod.cell]++;
      for (const sus of mod.suspiciousIndicators) {
        securityFlags.push({
          moduleId: mod.moduleId,
          flag: sus,
          severity: sus.includes('eval') || sus.includes('Function constructor') ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    const confidence =
      format === 'webpack' ? 95 :
      format === 'rollup_or_esbuild' ? 90 :
      format === 'cjs_bundle' || format === 'esm_bundle' ? 85 : 70;

    return {
      bundleName,
      bundleSize,
      format,
      totalModulesFound: modules.length,
      modules,
      callGraph,
      cellDistribution,
      securityFlags,
      reconstructionConfidence: confidence,
    };
  }

  private static detectFormat(code: string): BundleReconstructionReport['format'] {
    if (
      code.includes('__webpack_require__') ||
      /webpackJsonp|webpackChunk/i.test(code) ||
      /\/\*\*\*\/\s*\(function\s*\(modules\)/.test(code) ||
      /\(function\s*\(\s*modules\s*\)/.test(code) ||
      /(?:["']?[a-zA-Z0-9_$./@-]+["']?)\s*:\s*\(?\s*function\s*\([^)]*module/i.test(code)
    ) {
      return 'webpack';
    }
    if (code.includes('__esm(') || code.includes('__commonJS(') || /\/\* @__PURE__ \*\//.test(code)) {
      return 'rollup_or_esbuild';
    }
    if (/module\.exports\s*=|exports\.[a-zA-Z0-9_$]+\s*=/.test(code) && /require\(/.test(code)) {
      return 'cjs_bundle';
    }
    if (/export\s+(?:default|class|function|const|let|var)\s+/.test(code) && /import\s+.*?from/.test(code)) {
      return 'esm_bundle';
    }
    return 'monolithic';
  }

  private static extractWebpackModules(code: string): ReversedModule[] {
    const modules: ReversedModule[] = [];
    const headerRegex = /(?:["']?([a-zA-Z0-9_$./@-]+)["']?)\s*:\s*(?:\/\*[\s\S]*?\*\/)?\s*\(?\s*(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>)\s*\{/g;
    let m: RegExpExecArray | null;
    let count = 0;

    while ((m = headerRegex.exec(code)) !== null && count < 100) {
      const id = m[1];
      let braceCount = 1;
      let idx = headerRegex.lastIndex;
      const startBody = idx;

      while (idx < code.length && braceCount > 0) {
        const ch = code[idx];
        if (ch === '{') braceCount++;
        else if (ch === '}') braceCount--;
        idx++;
      }

      if (braceCount === 0) {
        const body = code.slice(startBody, idx - 1);
        if (body.trim().length > 10) {
          modules.push(this.analyzeModuleBody(id, body));
          count++;
        }
        headerRegex.lastIndex = idx;
      }
    }

    if (modules.length === 0) {
      return this.extractGenericModules(code);
    }
    return modules;
  }

  private static extractRollupEsbuildModules(code: string): ReversedModule[] {
    const modules: ReversedModule[] = [];
    // Match esbuild / rollup modules: var init_foo = __esm({ "path/or/name.js"() { ... } }) or var foo_exports = {};
    const esbuildRegex = /(?:var\s+([a-zA-Z0-9_$]+)\s*=\s*__esm(?:Min)?\(\s*\{?\s*(?:["']([^"']+)["'])?\s*\(?\)?\s*\{?)([\s\S]*?)(?=\n\s*var\s+[a-zA-Z0-9_$]+\s*=\s*__esm|\n\s*var\s+[a-zA-Z0-9_$]+_exports|\n\s*var\s+init_|$)/g;

    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = esbuildRegex.exec(code)) !== null && count < 100) {
      const varName = match[1];
      const pathHint = match[2] || varName;
      const body = match[3];
      if (body && body.length > 20) {
        modules.push(this.analyzeModuleBody(pathHint, body));
        count++;
      }
    }

    if (modules.length === 0) {
      return this.extractGenericModules(code);
    }
    return modules;
  }

  private static extractGenericModules(code: string): ReversedModule[] {
    const modules: ReversedModule[] = [];
    // Chunk monolithic / commonjs / esm by top-level declarations or exported namespaces
    const blockRegex = /(?:(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*)(?:export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([a-zA-Z0-9_$]+)|(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>|class)|(?:function|class)\s+([a-zA-Z0-9_$]+))\b[\s\S]*?(?=\n\s*(?:export|function|class|var|let|const|\/\*!|\/\*\*)|$)/g;

    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = blockRegex.exec(code)) !== null && count < 60) {
      const name = match[1] || match[2] || match[3] || `module_${count}`;
      const body = match[0];
      if (body.trim().length > 30) {
        modules.push(this.analyzeModuleBody(name, body));
        count++;
      }
    }

    if (modules.length === 0) {
      // Fallback single root module
      modules.push(this.analyzeModuleBody('root_entry', code));
    }

    return modules;
  }

  private static analyzeModuleBody(id: string, body: string): ReversedModule {
    // 1. Exported symbols
    const exportedSymbols: string[] = [];
    const exportMatch = body.matchAll(/(?:exports\.([a-zA-Z0-9_$]+)|export\s+(?:default\s+)?(?:function|class|const|var|let)\s+([a-zA-Z0-9_$]+)|__toCommonJS\s*\(\s*\{([a-zA-Z0-9_$,\s]+)\}\)|__export\s*\([^,]+,\s*\{([^}]+)\}\))/g);
    for (const em of exportMatch) {
      const sym = em[1] || em[2] || em[3] || em[4];
      if (sym) {
        sym.split(',').forEach((s) => {
          const trimmed = s.trim().split(':')[0].trim();
          if (trimmed && !exportedSymbols.includes(trimmed)) exportedSymbols.push(trimmed);
        });
      }
    }

    // 2. Imported dependencies
    const importedModules: string[] = [];
    const requireMatches = body.matchAll(/(?:require\s*\(\s*["']([^"']+)["']\s*\)|__webpack_require__\s*\(\s*["']?([^"')]+)["']?\s*\)|import\s+(?:.*?\s+from\s+)?["']([^"']+)["'])/g);
    for (const rm of requireMatches) {
      const dep = rm[1] || rm[2] || rm[3];
      if (dep && !importedModules.includes(dep)) importedModules.push(dep);
    }

    // 3. Significant string literals (heuristics)
    const strings: string[] = [];
    const strMatches = body.matchAll(/["']([a-zA-Z0-9_./:-]{4,64})["']/g);
    for (const sm of strMatches) {
      if (sm[1] && !strings.includes(sm[1]) && strings.length < 20) {
        strings.push(sm[1]);
      }
    }

    // 4. Complexity score (branches, loops, logic)
    const branchCount = (body.match(/\b(if|else|switch|case|for|while|catch|&&|\|\||\?)\b/g) || []).length;
    const complexityScore = Math.max(1, branchCount);

    // 5. Suspicious patterns
    const suspiciousIndicators: string[] = [];
    if (/eval\s*\(/.test(body)) suspiciousIndicators.push('dynamic_eval_call');
    if (/new\s+Function\s*\(/.test(body)) suspiciousIndicators.push('Function constructor execution');
    if (/document\.createElement\s*\(\s*["']script["']\s*\)/.test(body)) suspiciousIndicators.push('dynamic_script_injection');
    if (/atob\s*\(|Buffer\.from\([^,]+,\s*["']hex["']\)/.test(body)) suspiciousIndicators.push('encoded_string_payload');

    // 6. Project into Octeract 8D Hypercube Cell
    const cell = this.classifyCell(id, body, strings);

    return {
      moduleId: id,
      name: id.replace(/^[./\\]+/, '').replace(/\.[a-zA-Z]+$/, ''),
      cell,
      codeLength: body.length,
      complexityScore,
      exportedSymbols,
      importedModules,
      strings,
      suspiciousIndicators,
      snippet: body.slice(0, 300).trim(),
    };
  }

  private static classifyCell(name: string, body: string, strings: string[]): OcteractCell {
    const haystack = (name + ' ' + body.slice(0, 500) + ' ' + strings.join(' ')).toLowerCase();

    if (/test|expect|assert|describe|it\(|fixture|mock/.test(haystack)) return 'Tests';
    if (/auth|token|jwt|cipher|crypto|decrypt|encrypt|secret|cert|password|hash|signature/.test(haystack)) return 'Security';
    if (/db|database|sqlite|redis|sql|storage|indexeddb|persist|cache|store|blob|repo/.test(haystack)) return 'Storage';
    if (/react|component|render|vnode|jsx|view|dom|css|html|widget|button|canvas/.test(haystack)) return 'UI';
    if (/http|socket|fetch|axios|request|url|api|rest|rpc|graphql|network|dns|port/.test(haystack)) return 'Network';
    if (/log|telemetry|metric|trace|monitor|event|stat|perf|benchmark|analytics/.test(haystack)) return 'Telemetry';
    if (/config|env|setting|option|flag|manifest|json|param/.test(haystack)) return 'Config';

    return 'CoreLogic';
  }
}
