/**
 * OCTERACT-CONTEXT: Parcheador Especulativo en el AST (OcteractSpeculativePatcher)
 * Realiza injertos sintácticos quirúrgicos (AST grafting) en memoria, sustituyendo
 * métodos y funciones exactas sin desalinear comentarios, sangrías ni código adyacente.
 */

export interface SpeculativePatchResult {
  success: boolean;
  patchedCode: string;
  originalCode: string;
  diff: string;
  linesReplaced?: [number, number];
  error?: string;
}

export class OcteractSpeculativePatcher {
  /**
   * Injerta un nuevo método dentro de una clase específica reemplazando únicamente el nodo destino
   */
  public graftMethod(
    sourceCode: string,
    className: string,
    methodName: string,
    newMethodCode: string
  ): SpeculativePatchResult {
    const lines = sourceCode.split('\n');

    // 1. Localizar la clase
    const classRegex = new RegExp(`\\bclass\\s+${className}\\b`);
    const classStartIdx = lines.findIndex((l) => classRegex.test(l));

    if (classStartIdx === -1) {
      return {
        success: false,
        patchedCode: sourceCode,
        originalCode: sourceCode,
        diff: '',
        error: `Class '${className}' not found in source code`,
      };
    }

    // 2. Encontrar el rango de la clase
    let classEndIdx = lines.length - 1;
    let braceDepth = 0;
    let classOpenFound = false;

    for (let i = classStartIdx; i < lines.length; i++) {
      const opens = (lines[i].match(/\{/g) || []).length;
      const closes = (lines[i].match(/\}/g) || []).length;
      braceDepth += opens - closes;
      if (opens > 0) classOpenFound = true;
      if (classOpenFound && braceDepth <= 0) {
        classEndIdx = i;
        break;
      }
    }

    // 3. Localizar el método dentro de los límites de la clase
    const methodRegex = new RegExp(`^\\s*(?:(?:public|private|protected|async|static)\\s+)*${methodName}\\s*\\(`);
    let methodStartIdx = -1;

    for (let i = classStartIdx; i <= classEndIdx; i++) {
      if (methodRegex.test(lines[i])) {
        methodStartIdx = i;
        break;
      }
    }

    if (methodStartIdx === -1) {
      return {
        success: false,
        patchedCode: sourceCode,
        originalCode: sourceCode,
        diff: '',
        error: `Method '${methodName}' not found in class '${className}'`,
      };
    }

    // 4. Encontrar el cierre del método
    let methodEndIdx = methodStartIdx;
    let mDepth = 0;
    let mOpenFound = false;

    for (let i = methodStartIdx; i <= classEndIdx; i++) {
      const opens = (lines[i].match(/\{/g) || []).length;
      const closes = (lines[i].match(/\}/g) || []).length;
      mDepth += opens - closes;
      if (opens > 0) mOpenFound = true;
      if (mOpenFound && mDepth <= 0) {
        methodEndIdx = i;
        break;
      }
    }

    // 5. Aplicar el injerto
    const beforeLines = lines.slice(0, methodStartIdx);
    const oldMethodLines = lines.slice(methodStartIdx, methodEndIdx + 1);
    const afterLines = lines.slice(methodEndIdx + 1);

    const patchedLines = [
      ...beforeLines,
      newMethodCode,
      ...afterLines,
    ];

    const patchedCode = patchedLines.join('\n');
    const diff = this.generateUnifiedDiff(oldMethodLines.join('\n'), newMethodCode);

    return {
      success: true,
      patchedCode,
      originalCode: sourceCode,
      diff,
      linesReplaced: [methodStartIdx + 1, methodEndIdx + 1],
    };
  }

  /**
   * Injerta una función exportada o independiente reemplazando su cuerpo completo
   */
  public graftFunction(
    sourceCode: string,
    functionName: string,
    newFunctionCode: string
  ): SpeculativePatchResult {
    const lines = sourceCode.split('\n');
    const fnRegex = new RegExp(`^(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\(`);

    const fnStartIdx = lines.findIndex((l) => fnRegex.test(l));
    if (fnStartIdx === -1) {
      return {
        success: false,
        patchedCode: sourceCode,
        originalCode: sourceCode,
        diff: '',
        error: `Function '${functionName}' not found in source code`,
      };
    }

    let fnEndIdx = fnStartIdx;
    let depth = 0;
    let openFound = false;

    for (let i = fnStartIdx; i < lines.length; i++) {
      const opens = (lines[i].match(/\{/g) || []).length;
      const closes = (lines[i].match(/\}/g) || []).length;
      depth += opens - closes;
      if (opens > 0) openFound = true;
      if (openFound && depth <= 0) {
        fnEndIdx = i;
        break;
      }
    }

    const beforeLines = lines.slice(0, fnStartIdx);
    const oldFnLines = lines.slice(fnStartIdx, fnEndIdx + 1);
    const afterLines = lines.slice(fnEndIdx + 1);

    const patchedLines = [
      ...beforeLines,
      newFunctionCode,
      ...afterLines,
    ];

    const patchedCode = patchedLines.join('\n');
    const diff = this.generateUnifiedDiff(oldFnLines.join('\n'), newFunctionCode);

    return {
      success: true,
      patchedCode,
      originalCode: sourceCode,
      diff,
      linesReplaced: [fnStartIdx + 1, fnEndIdx + 1],
    };
  }

  /**
   * Genera diff unificado legible con marcadores - y +
   */
  private generateUnifiedDiff(oldBlock: string, newBlock: string): string {
    const oldLines = oldBlock.split('\n');
    const newLines = newBlock.split('\n');

    const out: string[] = ['--- original', '+++ patched'];
    for (const l of oldLines) {
      out.push(`- ${l}`);
    }
    for (const l of newLines) {
      out.push(`+ ${l}`);
    }
    return out.join('\n');
  }
}
