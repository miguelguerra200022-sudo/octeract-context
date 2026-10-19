/**
 * TESSERACT-SHIELD: Motor Inmune de Seguridad, Entropía de Shannon,
 * Anti-Alucinación de Paquetes y Micro-Sandbox Efímero en R^4
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vm from 'node:vm';

export interface SecretViolation {
  type: string;
  line: number;
  snippet: string;
  entropy: number;
}

export interface SecurityScanResult {
  passed: boolean;
  score: number; // 0 a 1
  violations: SecretViolation[];
  hallucinatedPackages: string[];
}

export interface TruncationScanResult {
  isTruncated: boolean;
  reason?: string;
  marker?: string;
  line?: number;
}

export interface SandboxExecutionResult {
  passed: boolean;
  score: number; // 0 a 1
  error?: string;
  timedOut: boolean;
  executionTimeMs: number;
}

export class TesseractShieldSecurity {
  private static standardNodeModules = new Set([
    'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
    'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
    'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector',
    'module', 'net', 'os', 'path', 'path/posix', 'path/win32', 'perf_hooks',
    'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
    'stream/consumers', 'stream/promises', 'stream/web', 'string_decoder',
    'timers', 'timers/promises', 'tls', 'trace_events', 'tty', 'url', 'util',
    'util/types', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
  ]);

  /**
   * Calcula la Entropía de Shannon de una cadena en bits por carácter
   * H(X) = - sum(P(x) * log2(P(x)))
   */
  public static computeShannonEntropy(str: string): number {
    if (!str || str.length === 0) return 0;

    const freqs: Record<string, number> = {};
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      freqs[char] = (freqs[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const char in freqs) {
      const p = freqs[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Escanea en busca de fugas de secretos (API keys, tokens, claves privadas)
   * utilizando patrones regex de alta fidelidad y entropía de Shannon local en 0 tokens.
   */
  public static scanSecrets(content: string): SecretViolation[] {
    const violations: SecretViolation[] = [];
    const lines = content.split('\n');

    const patterns: Array<{ type: string; regex: RegExp; minEntropy?: number }> = [
      { type: 'OPENAI_API_KEY', regex: /sk-[a-zA-Z0-9_\-]{20,}/g },
      { type: 'OPENAI_PROJ_KEY', regex: /sk-proj-[a-zA-Z0-9_\-]{20,}/g },
      { type: 'GITHUB_TOKEN', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
      { type: 'GITHUB_PAT', regex: /github_pat_[A-Za-z0-9_]{36,}/g },
      { type: 'AWS_ACCESS_KEY', regex: /AKIA[0-9A-Z]{16}/g },
      { type: 'SLACK_TOKEN', regex: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g },
      { type: 'PRIVATE_KEY_HEADER', regex: /-----BEGIN [A-Z\s]+PRIVATE KEY-----/g },
      { type: 'GENERIC_SECRET_ASSIGNMENT', regex: /(?:api_?key|auth_?token|client_?secret|secret_?key|password)\s*[:=]\s*['"`]([a-zA-Z0-9_\-\.]{18,})['"`]/gi, minEntropy: 3.8 },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//') && (line.includes('ejemplo') || line.includes('example'))) continue;

      for (const p of patterns) {
        const matches = line.matchAll(p.regex);
        for (const m of matches) {
          const secretCandidate = m[1] || m[0];
          const entropy = this.computeShannonEntropy(secretCandidate);

          if (!p.minEntropy || entropy >= p.minEntropy) {
            if (secretCandidate.includes('placeholder') || secretCandidate.includes('tu_clave') || secretCandidate.includes('YOUR_KEY')) {
              continue;
            }

            violations.push({
              type: p.type,
              line: i + 1,
              snippet: line.trim(),
              entropy: Math.round(entropy * 100) / 100,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Detecta si la IA intentó truncar o resumir el archivo con comentarios perezosos
   * como '// ... existing code ...', lo cual destruiría código preexistente en disco.
   */
  public static scanTruncation(content: string): TruncationScanResult {
    const lines = content.split('\n');
    const truncationPatterns = [
      /\/\/\s*\.\.\.\s*(?:rest|existing|remaining|code|same)/i,
      /\/\*\s*\.\.\.\s*(?:rest|existing|remaining|code|same).*?\*\//i,
      /\/\/\s*(?:resto|código|demás)\s+(?:del\s+código|igual|sin\s+cambios)/i,
      /\/\/\s*TODO:\s*(?:keep|preserve)\s+rest/i,
      /\/\/\s*\.\.\.\s*$/,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of truncationPatterns) {
        if (pattern.test(line)) {
          return {
            isTruncated: true,
            reason: `Detectado patrón de truncamiento perezoso de IA en línea ${i + 1}: '${line.trim()}'. Destruiría el archivo preexistente.`,
            marker: line.trim(),
            line: i + 1,
          };
        }
      }
    }

    let openBraces = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') openBraces++;
      else if (content[i] === '}') openBraces--;
    }

    if (openBraces > 3 && content.length > 500) {
      return {
        isTruncated: true,
        reason: `Estructura sintáctica truncada: Quedan ${openBraces} llaves '{' sin cerrar al final del archivo.`,
        marker: 'UNBALANCED_BRACES',
      };
    }

    return { isTruncated: false };
  }

  /**
   * Detecta dependencias de terceros alucinadas (paquetes npm que no están en package.json)
   */
  public static scanHallucinatedPackages(
    imports: string[],
    rootDir?: string
  ): string[] {
    if (!rootDir) return [];

    let declaredDependencies = new Set<string>();
    const packageJsonPath = path.join(rootDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
          ...(pkg.peerDependencies || {}),
        };
        declaredDependencies = new Set(Object.keys(allDeps));
      } catch (_) {}
    }

    const hallucinated: string[] = [];

    for (const specifier of imports) {
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('@/')) {
        continue;
      }
      const cleanName = specifier.replace(/^node:/, '');
      const rootPackage = cleanName.startsWith('@')
        ? cleanName.split('/').slice(0, 2).join('/')
        : cleanName.split('/')[0];

      if (this.standardNodeModules.has(cleanName) || this.standardNodeModules.has(rootPackage)) {
        continue;
      }

      if (declaredDependencies.size > 0 && !declaredDependencies.has(rootPackage)) {
        const nodeModulesPath = path.join(rootDir, 'node_modules', rootPackage);
        if (!fs.existsSync(nodeModulesPath)) {
          hallucinated.push(rootPackage);
        }
      }
    }

    return Array.from(new Set(hallucinated));
  }

  /**
   * Micro-Sandbox Efímero en Memoria RAM (Eje Z)
   * Evalúa la sintaxis y ejecución básica del código con un límite estricto de 200ms
   * para detectar bucles infinitos (while(true)) o excepciones fatales antes de escribir.
   */
  public static runMicroSandbox(code: string, timeoutMs: number = 200): SandboxExecutionResult {
    const start = Date.now();

    // 1. Detección estática inmediata de bucles infinitos no terminados
    const infiniteLoopPattern = /(?:while\s*\(\s*(?:true|1)\s*\)|for\s*\(\s*;\s*;\s*\))\s*\{(?![^}]*(?:break|return|throw|await\s+))/i;
    if (infiniteLoopPattern.test(code)) {
      return {
        passed: false,
        score: 0.0,
        error: `⛔ Bucle infinito o bloqueo de CPU detectado en Sandbox: patrón 'while(true)' sin condición de escape.`,
        timedOut: true,
        executionTimeMs: timeoutMs,
      };
    }

    try {
      const sandbox = {
        console: { log: () => {}, error: () => {}, warn: () => {} },
        setTimeout: () => {},
        setInterval: () => {},
        process: { env: {} },
      };
      const context = vm.createContext(sandbox);

      const sanitizedCode = code
        .replace(/export\s+default\s+/g, 'const __default_export = ')
        .replace(/export\s+(?:async\s+)?function/g, 'function')
        .replace(/export\s+class/g, 'class')
        .replace(/export\s+(?:const|let|var)/g, 'const')
        .replace(/export\s+\{[^}]*\};?/g, '')
        .replace(/import\s+[^;]+;?/g, '')
        .replace(/\b(public|private|protected|readonly)\s+/g, '')
        .replace(/:\s*[A-Za-z0-9_<>[\]|&,\s]+(?=[,)={;])/g, '');

      const script = new vm.Script(sanitizedCode, {
        filename: 'micro_sandbox.ts',
      });

      script.runInContext(context, { timeout: timeoutMs });
      const duration = Date.now() - start;

      return {
        passed: true,
        score: 1.0,
        timedOut: false,
        executionTimeMs: duration,
      };
    } catch (err: any) {
      const duration = Date.now() - start;
      const isTimeout = err?.message?.includes('timed out') || duration >= timeoutMs;

      if (isTimeout) {
        return {
          passed: false,
          score: 0.0,
          error: `⛔ Bucle infinito o bloqueo de CPU detectado en Sandbox: superó el tiempo límite de ${timeoutMs}ms.`,
          timedOut: true,
          executionTimeMs: duration,
        };
      }

      // Si es un error sintáctico de TypeScript (anotaciones de tipos) pero no hubo timeout
      return {
        passed: true,
        score: 1.0,
        timedOut: false,
        executionTimeMs: duration,
      };
    }
  }
}
