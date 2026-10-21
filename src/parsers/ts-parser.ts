/**
 * TESSERACT-CONTEXT: Parser Especializado para TypeScript y JavaScript
 * Extrae clases, interfaces, tipos, funciones, enums, re-exports y miembros públicos
 */

import type { LanguageParser, ParseResult } from './base.ts';
import type { HyperSymbol } from '../core/types.ts';

export class TypeScriptParser implements LanguageParser {
  supports(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return (
      ext.endsWith('.ts') ||
      ext.endsWith('.tsx') ||
      ext.endsWith('.js') ||
      ext.endsWith('.jsx') ||
      ext.endsWith('.mjs') ||
      ext.endsWith('.cjs')
    );
  }

  parse(filePath: string, content: string): ParseResult {
    const lines = content.split('\n');
    const symbols: HyperSymbol[] = [];
    const dependencies: string[] = [];

    // 1. Extraer importaciones (Dependencias de grafo) de forma lineal y segura
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('*')) continue;

      const depMatch = line.match(/^(?:import|export)\s+(?:.+?\s+from\s+|type\s+.+?\s+from\s+)?['"]([^'"]+)['"]/);
      if (depMatch && depMatch[1]) {
        const dep = depMatch[1];
        if (!dependencies.includes(dep)) dependencies.push(dep);
        continue;
      }

      const reqMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
      if (reqMatch && reqMatch[1]) {
        const dep = reqMatch[1];
        if (!dependencies.includes(dep)) dependencies.push(dep);
      }
    }

    // 2. Extraer símbolos línea por línea con tracking de profundidad de llaves
    let currentBraceDepth = 0;
    let classStartDepth = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      if (!line || line.startsWith('//') || line.startsWith('*')) continue;

      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      const inClassOrInterface = classStartDepth !== -1;

      // Importaciones y Re-exportaciones con nombre: import/export { a, b } from '...'
      const namedImportMatch = line.match(/^(?:import|export)\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
      if (namedImportMatch) {
        const parts = namedImportMatch[1].split(',');
        const targetDep = namedImportMatch[2];
        for (const part of parts) {
          const symName = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
          if (symName && !symbols.some((s) => s.name === symName && s.kind === 'import')) {
            symbols.push({
              name: symName,
              kind: 'import',
              lineStart: lineNum,
              lineEnd: lineNum,
              signature: line.slice(0, 80),
              dependencies: [targetDep],
            });
          }
        }
        currentBraceDepth += openCount - closeCount;
        continue;
      }

      // Clases
      const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: line.replace(/\{.*$/, '').trim(),
          dependencies: [],
          isExported: line.startsWith('export'),
        });
        classStartDepth = currentBraceDepth;
        currentBraceDepth += openCount - closeCount;
        continue;
      }

      // Interfaces
      const interfaceMatch = line.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
      if (interfaceMatch) {
        symbols.push({
          name: interfaceMatch[1],
          kind: 'interface',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: line.replace(/\{.*$/, '').trim(),
          dependencies: [],
          isExported: line.startsWith('export'),
        });
        classStartDepth = currentBraceDepth;
        currentBraceDepth += openCount - closeCount;
        continue;
      }

      // Enums (incluyendo const enum)
      const enumMatch = line.match(/^(?:export\s+)?(?:const\s+)?enum\s+([A-Za-z0-9_$]+)/);
      if (enumMatch) {
        symbols.push({
          name: enumMatch[1],
          kind: 'enum',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: line.replace(/\{.*$/, '').trim(),
          dependencies: [],
          isExported: line.startsWith('export'),
        });
        continue;
      }

      // Tipos (type alias)
      const typeMatch = line.match(/^(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*=/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: 'type',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: line.slice(0, 80),
          dependencies: [],
          isExported: line.startsWith('export'),
        });
        continue;
      }

      // Funciones (incluyendo sobrecargas export function foo(...): ...;)
      const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*[<(]/);
      if (funcMatch) {
        if (!symbols.some((s) => s.name === funcMatch[1])) {
          symbols.push({
            name: funcMatch[1],
            kind: 'function',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: line.slice(0, 80),
            dependencies: [],
            isExported: line.startsWith('export'),
          });
        }
        continue;
      }

      // Re-exports tipo export { a, b, c }
      const reexportMatch = line.match(/^export\s*\{([^}]+)\}/);
      if (reexportMatch) {
        const parts = reexportMatch[1].split(',');
        for (const part of parts) {
          const symName = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
          if (symName && !symbols.some((s) => s.name === symName)) {
            symbols.push({
              name: symName,
              kind: 'export',
              lineStart: lineNum,
              lineEnd: lineNum,
              signature: line.slice(0, 80),
              dependencies: [],
              isExported: true,
            });
          }
        }
        continue;
      }

      // Constantes, variables y funciones flecha exportadas
      const constMatch = line.match(/^export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*[:=]/);
      if (constMatch) {
        if (!symbols.some((s) => s.name === constMatch[1])) {
          const isArrow = line.includes('=>');
          symbols.push({
            name: constMatch[1],
            kind: isArrow ? 'function' : 'variable',
            lineStart: lineNum,
            lineEnd: lineNum,
            signature: isArrow ? `const ${constMatch[1]} = (...) =>` : line.slice(0, 80),
            dependencies: [],
            isExported: true,
          });
        }
        continue;
      }

      // Miembros públicos de clase o métodos de interfaz (ej. startRow, fetch, get, indexDirectory)
      if (inClassOrInterface) {
        // Propiedades públicas o readonly: public readonly startRow: number; o startRow: number;
        const propMatch = line.match(/^(?:public\s+|private\s+|protected\s+)?(?:readonly\s+)?([A-Za-z0-9_$]+)\s*[:=]/);
        if (propMatch && !['constructor', 'return', 'if', 'else', 'for', 'while', 'switch', 'catch'].includes(propMatch[1])) {
          if (!symbols.some((s) => s.name === propMatch[1])) {
            symbols.push({
              name: propMatch[1],
              kind: 'property',
              lineStart: lineNum,
              lineEnd: lineNum,
              signature: line.slice(0, 80),
              dependencies: [],
            });
          }
          currentBraceDepth += openCount - closeCount;
          if (classStartDepth !== -1 && currentBraceDepth <= classStartDepth) {
            classStartDepth = -1;
          }
          continue;
        }

        // Métodos: fetch(key: string): Promise<string>; o get(key: string, ...): ... o indexDirectory(...)
        const methodMatch =
          line.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*[:{]/) ||
          line.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?([A-Za-z0-9_$]+)\s*\(/);

        if (methodMatch && !['constructor', 'return', 'if', 'else', 'for', 'while', 'switch', 'catch', 'throw'].includes(methodMatch[1])) {
          if (!symbols.some((s) => s.name === methodMatch[1])) {
            symbols.push({
              name: methodMatch[1],
              kind: 'method',
              lineStart: lineNum,
              lineEnd: lineNum,
              signature: line.slice(0, 80),
              dependencies: [],
            });
          }
          currentBraceDepth += openCount - closeCount;
          if (classStartDepth !== -1 && currentBraceDepth <= classStartDepth) {
            classStartDepth = -1;
          }
          continue;
        }
      }

      currentBraceDepth += openCount - closeCount;
      if (classStartDepth !== -1 && currentBraceDepth <= classStartDepth) {
        classStartDepth = -1;
      }
    }

    return {
      symbols,
      dependencies,
      totalLines: lines.length,
    };
  }
}
