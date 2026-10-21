/**
 * OCTERACT-CONTEXT: Slicing Semántico de Programas (Weiser's Program Slicer)
 * Extrae subprogramas ejecutables puros basados en criterios de corte causales
 * (Backward Slicing para depuración, Forward Slicing para análisis de impacto).
 */

export interface SlicingCriterion {
  targetVariable?: string;
  targetSymbol?: string;
  targetLine?: number;
  direction?: 'backward' | 'forward';
}

export interface ProgramSliceResult {
  slicedCode: string;
  linesRetained: number[];
  totalLinesOriginal: number;
  tokenReductionPercent: number;
  direction: 'backward' | 'forward';
  targetVariable?: string;
  targetSymbol?: string;
}

interface StatementInfo {
  lineIndex: number;
  rawText: string;
  trimmedText: string;
  defs: Set<string>;
  uses: Set<string>;
  isControl: boolean;
  isBlockHeader: boolean;
  isBlockCloser: boolean;
  indent: string;
}

export class OcteractProgramSlicer {
  /**
   * Calcula el slice de código TypeScript/JavaScript según el criterio dado
   */
  public computeSlice(code: string, criterion: SlicingCriterion): ProgramSliceResult {
    const direction = criterion.direction || 'backward';
    const lines = code.split('\n');

    // Si se especifica targetSymbol (ej. un método de clase o función), localizar el bloque
    let startLine = 0;
    let endLine = lines.length - 1;

    if (criterion.targetSymbol) {
      const symRegex = new RegExp(`\\b${criterion.targetSymbol}\\s*\\(`);
      const idx = lines.findIndex((l) => symRegex.test(l));
      if (idx !== -1) {
        startLine = idx;
        let braceCount = 0;
        let foundOpen = false;
        for (let i = idx; i < lines.length; i++) {
          const opens = (lines[i].match(/\{/g) || []).length;
          const closes = (lines[i].match(/\}/g) || []).length;
          braceCount += opens - closes;
          if (opens > 0) foundOpen = true;
          if (foundOpen && braceCount <= 0) {
            endLine = i;
            break;
          }
        }
      }
    }

    const statements: StatementInfo[] = [];

    for (let i = startLine; i <= endLine; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      const matchIndent = line.match(/^(\s*)/);
      const indent = matchIndent ? matchIndent[1] : '';

      const defs = new Set<string>();
      const uses = new Set<string>();

      // Detectar declaraciones let/const/var: let x = ... o const { a, b } = ...
      const declMatch = trimmed.match(/^(?:export\s+)?(?:let|const|var)\s+([a-zA-Z0-9_$,\s{}]+?)\s*[:=]/);
      if (declMatch) {
        const rawVars = declMatch[1].replace(/[{}]/g, '').split(',');
        for (const v of rawVars) {
          const varName = v.trim().split(/\s+/)[0];
          if (varName && /^[a-zA-Z0-9_$]+$/.test(varName)) {
            defs.add(varName);
          }
        }
      }

      // Detectar asignaciones: x = ...
      const assignMatch = trimmed.match(/^([a-zA-Z0-9_$]+)\s*(\+=|-=|\*=|\/=|%=|=)\s*(.*)/);
      if (assignMatch && !trimmed.startsWith('let ') && !trimmed.startsWith('const ') && !trimmed.startsWith('var ')) {
        defs.add(assignMatch[1]);
      }

      // Extraer identificadores usados en la línea
      const tokens = trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
      const keywords = new Set([
        'let', 'const', 'var', 'function', 'class', 'return', 'if', 'else',
        'for', 'while', 'import', 'export', 'public', 'private', 'protected',
        'number', 'string', 'boolean', 'any', 'void', 'true', 'false', 'null', 'undefined'
      ]);

      for (const tok of tokens) {
        if (!keywords.has(tok) && !defs.has(tok)) {
          uses.add(tok);
        }
      }

      const isBlockHeader = trimmed.endsWith('{') || trimmed.includes('class ') || trimmed.includes('function ') || trimmed.includes('):');
      const isBlockCloser = trimmed === '}' || trimmed === '};';
      const isControl = trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while') || trimmed.startsWith('return');

      statements.push({
        lineIndex: i,
        rawText: line,
        trimmedText: trimmed,
        defs,
        uses,
        isControl,
        isBlockHeader,
        isBlockCloser,
        indent,
      });
    }

    const retainedIndices = new Set<number>();
    const activeVariables = new Set<string>();

    if (criterion.targetVariable) {
      activeVariables.add(criterion.targetVariable);
    } else {
      // Si no se especifica variable objetivo, usar la variable retornada o última asignación
      for (let i = statements.length - 1; i >= 0; i--) {
        if (statements[i].trimmedText.startsWith('return ')) {
          for (const u of statements[i].uses) {
            activeVariables.add(u);
          }
          retainedIndices.add(statements[i].lineIndex);
          break;
        }
      }
    }

    if (direction === 'backward') {
      // Backward Slicing (Algoritmo de Mark Weiser):
      for (let i = statements.length - 1; i >= 0; i--) {
        const stmt = statements[i];

        // Siempre conservar declaraciones de clase / función / método iniciales
        if (stmt.isBlockHeader && !stmt.defs.size && (stmt.trimmedText.includes('class ') || stmt.trimmedText.includes('('))) {
          retainedIndices.add(stmt.lineIndex);
          continue;
        }

        let relevant = false;

        // Si la sentencia define alguna variable actualmente activa
        for (const defVar of stmt.defs) {
          if (activeVariables.has(defVar)) {
            relevant = true;
            break;
          }
        }

        // Si es un return que consume variables activas
        if (stmt.trimmedText.startsWith('return ')) {
          for (const useVar of stmt.uses) {
            if (activeVariables.has(useVar) || criterion.targetVariable === useVar) {
              relevant = true;
              break;
            }
          }
        }

        if (relevant) {
          retainedIndices.add(stmt.lineIndex);
          // Quitar variable definida y agregar todas las variables que usa (def-use expansion)
          for (const defVar of stmt.defs) {
            activeVariables.delete(defVar);
          }
          for (const useVar of stmt.uses) {
            activeVariables.add(useVar);
          }
        }
      }
    } else {
      // Forward Slicing (Impact Analysis):
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        if (stmt.isBlockHeader && !stmt.defs.size) {
          retainedIndices.add(stmt.lineIndex);
          continue;
        }

        let relevant = false;

        // Si la sentencia usa alguna variable activa
        for (const useVar of stmt.uses) {
          if (activeVariables.has(useVar)) {
            relevant = true;
            break;
          }
        }

        // O si es la definición inicial del target
        if (criterion.targetVariable && stmt.defs.has(criterion.targetVariable)) {
          relevant = true;
        }

        if (relevant) {
          retainedIndices.add(stmt.lineIndex);
          for (const defVar of stmt.defs) {
            activeVariables.add(defVar);
          }
        }
      }
    }

    // Preservar estructura de cierres de bloques si sus cabeceras fueron conservadas
    for (const stmt of statements) {
      if (stmt.isBlockCloser) {
        retainedIndices.add(stmt.lineIndex);
      }
    }

    // Reconstruir código con sangrado preservado
    const slicedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (retainedIndices.has(i)) {
        slicedLines.push(lines[i]);
      }
    }

    const slicedCode = slicedLines.join('\n');
    const originalLen = code.length || 1;
    const slicedLen = slicedCode.length;
    const tokenReductionPercent = Math.max(0, Math.round(((originalLen - slicedLen) / originalLen) * 100));

    return {
      slicedCode,
      linesRetained: Array.from(retainedIndices).sort((a, b) => a - b),
      totalLinesOriginal: lines.length,
      tokenReductionPercent,
      direction,
      targetVariable: criterion.targetVariable,
      targetSymbol: criterion.targetSymbol,
    };
  }
}
