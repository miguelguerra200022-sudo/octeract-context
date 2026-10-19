/**
 * TESSERACT-CONTEXT: Parser Especializado para Python
 */

import type { LanguageParser, ParseResult } from './base.ts';
import type { HyperSymbol } from '../core/types.ts';

export class PythonParser implements LanguageParser {
  supports(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.py');
  }

  parse(filePath: string, content: string): ParseResult {
    const lines = content.split('\n');
    const symbols: HyperSymbol[] = [];
    const dependencies: string[] = [];

    // 1. Extraer importaciones en Python
    const importRegex = /^(?:from\s+([A-Za-z0-9_.]+)\s+import|import\s+([A-Za-z0-9_.]+))/gm;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1] || match[2];
      if (dep && !dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    }

    // 2. Extraer clases y métodos/funciones
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // Clases
      const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)(?:\(([^)]*)\))?:/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: trimmed.slice(0, -1),
          dependencies: classMatch[2] ? classMatch[2].split(',').map((s) => s.trim()) : [],
        });
        continue;
      }

      // Funciones y métodos
      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*[^:]+)?:/);
      if (defMatch) {
        const isTest = defMatch[1].startsWith('test_');
        symbols.push({
          name: defMatch[1],
          kind: isTest ? 'test' : 'function',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: trimmed.slice(0, -1),
          dependencies: [],
        });
        continue;
      }
    }

    return {
      symbols,
      dependencies,
      totalLines: lines.length,
    };
  }
}
