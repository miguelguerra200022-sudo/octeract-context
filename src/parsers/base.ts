/**
 * TESSERACT-CONTEXT: Interfaz Base para Parsers Multi-Lenguaje
 */

import type { HyperSymbol } from '../core/types.ts';

export interface ParseResult {
  symbols: HyperSymbol[];
  dependencies: string[];
  docstringSummary?: string;
  totalLines: number;
}

export interface LanguageParser {
  supports(filePath: string): boolean;
  parse(filePath: string, content: string): ParseResult;
}
