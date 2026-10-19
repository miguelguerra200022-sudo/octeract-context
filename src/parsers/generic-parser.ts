/**
 * TESSERACT-CONTEXT: Parser Genérico Universal (Rust, Go, C++, Markdown, Config)
 */

import type { LanguageParser, ParseResult } from './base.ts';
import type { HyperSymbol } from '../core/types.ts';

export class GenericParser implements LanguageParser {
  supports(_filePath: string): boolean {
    return true; // Fallback para cualquier extensión
  }

  parse(filePath: string, content: string): ParseResult {
    const lines = content.split('\n');
    const symbols: HyperSymbol[] = [];
    const dependencies: string[] = [];

    const isRust = filePath.endsWith('.rs');
    const isGo = filePath.endsWith('.go');
    const isMarkdown = filePath.endsWith('.md');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      if (isRust) {
        const fnMatch = line.match(/^(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/);
        if (fnMatch) {
          symbols.push({
            name: fnMatch[1],
            kind: 'function',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: line.replace(/\{.*$/, '').trim(),
            dependencies: [],
          });
          continue;
        }

        const structMatch = line.match(/^(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z0-9_]+)/);
        if (structMatch) {
          symbols.push({
            name: structMatch[1],
            kind: 'type',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: line.replace(/\{.*$/, '').trim(),
            dependencies: [],
          });
          continue;
        }

        const useMatch = line.match(/^use\s+([A-Za-z0-9_:]+);/);
        if (useMatch && !dependencies.includes(useMatch[1])) {
          dependencies.push(useMatch[1]);
        }
      } else if (isGo) {
        const funcMatch = line.match(/^func\s+(?:\([^)]+\)\s+)?([A-Za-z0-9_]+)\s*\(/);
        if (funcMatch) {
          symbols.push({
            name: funcMatch[1],
            kind: 'function',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: line.replace(/\{.*$/, '').trim(),
            dependencies: [],
          });
          continue;
        }

        const typeMatch = line.match(/^type\s+([A-Za-z0-9_]+)\s+(?:struct|interface)/);
        if (typeMatch) {
          symbols.push({
            name: typeMatch[1],
            kind: 'type',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: line.replace(/\{.*$/, '').trim(),
            dependencies: [],
          });
          continue;
        }
      } else if (isMarkdown) {
        // Encabezados como símbolos estructurales
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          symbols.push({
            name: headingMatch[2].trim(),
            kind: 'interface',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: headingMatch[0],
            dependencies: [],
          });
        }
      }
    }

    return {
      symbols,
      dependencies,
      totalLines: lines.length,
    };
  }
}
