/**
 * TESSERACT-CONTEXT: Diagnóstico Universal Profundo
 * Extrae diferencias de firmas y tipos AST y traza la cadena crítica de colapso (Critical Backbone)
 */

import { HypercubeSpace } from './hypercube.ts';
import { eventBus } from './events.ts';

export interface SignatureDiff {
  missingArgs: string[];
  extraArgs: string[];
  expectedParamCount: number;
  actualParamCount: number;
  expectedTypes: Record<string, string>;
  isAsyncExpected: boolean;
  explanation: string;
}

export class DeepContractDiagnostic {
  constructor() {
    eventBus.emitEvent('query', { type: 'deep_diagnostic_init', timestamp: Date.now() });
  }

  /**
   * Extrae la diferencia de firmas y tipos entre la declaración destino y la llamada del consumidor
   */
  public static diffSignatures(calleeCode: string, callerCode: string): SignatureDiff {
    // 1. Extraer parámetros esperados de la declaración
    // Coincide con: function name(param: Type, ...) o (param: Type, ...) => ...
    const declMatch = calleeCode.match(/(?:function\s+\w+|\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{=;]+))?/);
    const paramStr = declMatch ? declMatch[1] : '';
    const returnTypeStr = declMatch && declMatch[2] ? declMatch[2].trim() : '';

    const expectedParams: { name: string; type: string; isOptional: boolean }[] = [];
    const expectedTypes: Record<string, string> = {};

    if (paramStr.trim()) {
      const rawParams = paramStr.split(',');
      for (const p of rawParams) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const [namePart, typePart] = trimmed.split(':');
        const isOptional = namePart.includes('?');
        const cleanName = namePart.replace('?', '').trim();
        const cleanType = typePart ? typePart.trim() : 'any';
        expectedParams.push({ name: cleanName, type: cleanType, isOptional });
        expectedTypes[cleanName] = cleanType;
      }
    }

    const isAsyncExpected =
      calleeCode.includes('async ') ||
      returnTypeStr.startsWith('Promise') ||
      returnTypeStr.includes('Promise<');

    // 2. Extraer argumentos suministrados en el call site
    const callMatch = callerCode.match(/\w+\s*\(([^)]*)\)/);
    const callArgsStr = callMatch ? callMatch[1].trim() : '';
    const actualArgs = callArgsStr ? callArgsStr.split(',').map((a) => a.trim()) : [];

    const expectedParamCount = expectedParams.length;
    const actualParamCount = actualArgs.length;

    const missingArgs: string[] = [];
    for (let i = actualParamCount; i < expectedParams.length; i++) {
      if (!expectedParams[i].isOptional) {
        missingArgs.push(expectedParams[i].name);
      }
    }

    const extraArgs: string[] = [];
    if (actualParamCount > expectedParamCount) {
      for (let i = expectedParamCount; i < actualParamCount; i++) {
        extraArgs.push(`arg_${i + 1}`);
      }
    }

    let explanation = 'Firma coincidente.';
    if (missingArgs.length > 0) {
      explanation = `Faltan ${missingArgs.length} argumento(s) requerido(s): [${missingArgs.join(', ')}].`;
    } else if (extraArgs.length > 0) {
      explanation = `Se enviaron ${extraArgs.length} argumento(s) sobrantes.`;
    }

    if (isAsyncExpected && !callerCode.includes('await ') && !callerCode.includes('.then(')) {
      explanation += ' Se esperaba resolución de promesa asíncrona (Promise/await).';
    }

    return {
      missingArgs,
      extraArgs,
      expectedParamCount,
      actualParamCount,
      expectedTypes,
      isAsyncExpected,
      explanation,
    };
  }

  /**
   * Traza la cadena crítica de colapso más corta desde el epicentro del cambio hasta un Terminal Sink (outDegree = 0)
   */
  public static traceCriticalBackbone(epicenter: string, space: HypercubeSpace): string[] {
    const queue: string[] = [epicenter];
    const visited = new Set<string>([epicenter]);
    const parentMap = new Map<string, string>();

    let terminalSinkFound: string | null = null;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const vertex = space.getVertex(currentId);

      if (!vertex) continue;

      // Si no es el epicentro y tiene outDegree === 0, hemos alcanzado un sumidero terminal
      if (currentId !== epicenter && (vertex.outDegree === 0 || vertex.dependents.length === 0)) {
        terminalSinkFound = currentId;
        break;
      }

      for (const depId of vertex.dependents) {
        if (!visited.has(depId)) {
          visited.add(depId);
          parentMap.set(depId, currentId);
          queue.push(depId);
        }
      }
    }

    // Si encontramos un sumidero terminal, reconstruimos el camino inverso
    if (terminalSinkFound) {
      const path: string[] = [];
      let curr: string | undefined = terminalSinkFound;
      while (curr) {
        path.unshift(curr);
        curr = parentMap.get(curr);
      }
      return path;
    }

    // Si no hubo sumidero terminal puro, retornamos el camino explorado más largo
    return [epicenter];
  }
}
