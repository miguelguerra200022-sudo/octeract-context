/**
 * TESSERACT-CONTEXT: Skeletonizador AST / Modo Esqueleto (SWE-bench Style)
 * Reduce el consumo de tokens en un 80%-90% en cortes hiperdimensionales
 * extrayendo firmas de clases, interfaces, tipos y funciones mientras
 * omite los cuerpos de implementación interna para agentes de IA.
 */

import { eventBus } from './events.ts';

export interface SkeletonResult {
  skeletonCode: string;
  originalLines: number;
  skeletonLines: number;
  originalTokensEstimated: number;
  skeletonTokensEstimated: number;
  reductionPercentage: number;
}

export class ASTSkeletonizer {
  /**
   * Transforma código fuente en su versión esqueletizada de alta compresión
   */
  public static skeletonize(content: string, filePath: string = 'file.ts'): SkeletonResult {
    const ext = filePath.split('.').pop()?.toLowerCase() || 'ts';
    const originalLines = content.split('\n').length;
    const originalTokens = Math.ceil(content.length / 3.8);

    let skeletonCode: string;

    if (ext === 'py') {
      skeletonCode = this.skeletonizePython(content);
    } else {
      skeletonCode = this.skeletonizeTypeScript(content);
    }

    const skeletonLines = skeletonCode.split('\n').length;
    const skeletonTokens = Math.ceil(skeletonCode.length / 3.8);
    const reduction = originalTokens > 0 ? Math.round(((originalTokens - skeletonTokens) / originalTokens) * 100) : 0;

    const result: SkeletonResult = {
      skeletonCode,
      originalLines,
      skeletonLines,
      originalTokensEstimated: originalTokens,
      skeletonTokensEstimated: skeletonTokens,
      reductionPercentage: Math.max(0, reduction),
    };

    try {
      eventBus.emitEvent('query', {
        operation: 'skeletonize',
        file: filePath,
        reduction: result.reductionPercentage,
      });
    } catch {
      // Ignorar en entornos sin bus activo
    }

    return result;
  }

  /**
   * Esqueletizador para TypeScript / JavaScript
   */
  private static skeletonizeTypeScript(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inBlockComment = false;
    let braceDepth = 0;
    let skippingBody = false;
    let skipUntilDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Manejo de comentarios de bloque JSDoc
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        result.push(line);
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Preservar imports, exports de tipos, interfaces completas
      if (
        trimmed.startsWith('import ') ||
        trimmed.startsWith('require(') ||
        trimmed.startsWith('export type ') ||
        trimmed.startsWith('type ') ||
        trimmed.startsWith('//')
      ) {
        if (!skippingBody) {
          result.push(line);
        }
        continue;
      }

      // Conteo de llaves
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;

      if (skippingBody) {
        braceDepth += openCount - closeCount;
        if (braceDepth <= skipUntilDepth) {
          skippingBody = false;
          // Si la línea actual cierra el bloque, podemos agregar el cierre si no se agregó
        }
        continue;
      }

      // Detectar declaración de clase o interfaz
      const isClassOrInterface = /^(?:export\s+)?(?:abstract\s+)?(?:class|interface)\s+/.test(trimmed);
      if (isClassOrInterface) {
        result.push(line);
        braceDepth += openCount - closeCount;
        continue;
      }

      // Detectar métodos de clase, constructores o funciones con cuerpo
      const isFunctionOrMethod =
        /^(?:(?:public|private|protected|static|async|get|set|readonly)\s+)*(?:function\s+|constructor\s*\(|[A-Za-z0-9_$]+\s*\([^)]*\)\s*[:\w<>[\]|\s]*\{)/.test(
          trimmed
        ) || /^(?:export\s+)?(?:async\s+)?function\s+/.test(trimmed);

      if (isFunctionOrMethod && openCount > 0) {
        // Extraer la firma hasta la primera llave '{'
        const sigPart = line.replace(/\{.*$/, '').trimEnd();
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';

        // Si es una función en una sola línea o interfaz abstracta sin cuerpo largo
        if (openCount === closeCount) {
          result.push(`${sigPart} { /* [tesseract: body omitted] */ }`);
          continue;
        }

        result.push(`${sigPart} { /* [tesseract: body omitted] */ }`);
        braceDepth += openCount - closeCount;
        skipUntilDepth = braceDepth - (openCount - closeCount);
        skippingBody = true;
        continue;
      }

      // Líneas comunes fuera de omisión (propiedades de clase, campos, constantes)
      result.push(line);
      braceDepth += openCount - closeCount;
    }

    return result.join('\n');
  }

  /**
   * Esqueletizador para Python
   */
  private static skeletonizePython(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let skippingFunc = false;
    let funcIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indentMatch = line.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1].length : 0;

      if (skippingFunc) {
        if (trimmed && currentIndent <= funcIndent && !trimmed.startsWith('#')) {
          skippingFunc = false;
        } else {
          continue;
        }
      }

      if (trimmed.startsWith('def ') || trimmed.startsWith('async def ')) {
        result.push(line);
        const nextIndent = ' '.repeat(currentIndent + 4);
        result.push(`${nextIndent}... # [tesseract: implementation omitted]`);
        skippingFunc = true;
        funcIndent = currentIndent;
        continue;
      }

      result.push(line);
    }

    return result.join('\n');
  }
}
