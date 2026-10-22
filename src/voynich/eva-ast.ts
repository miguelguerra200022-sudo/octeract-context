/**
 * OCTERACT-CONTEXT: Transliterador Canónico EVA-AST (Código EVA de Voynich)
 * Comprime firmas de AST y contratos arquitectónicos en ternas posicionales
 * canónicas [Prefijo][Núcleo][Sufijo] reduciendo el consumo de tokens en >80%.
 */

export interface EVASlot {
  prefix: string;          // Prefijo estilo Voynich: 'qo', 'ch', 'sh', 'ok', 'ot', 'da'
  core: string;            // Identificador o slug canónico
  suffix: string;          // Sufijo de contrato: 'aiin' (Promise), 'y' (void), 'ol' (class), 'in' (primitivo)
  identifier: string;
  kind: 'function' | 'class' | 'method' | 'interface';
  originalSignature: string;
  evaToken: string;
}

export interface EVATransliterateResult {
  evaGlyphBlock: string;
  slots: EVASlot[];
  originalTokens: number;
  evaTokens: number;
  tokenReductionPercent: number;
}

export class OcteractEVAAST {
  // Diccionario canónico de prefijos EVA Voynich para modificadores de código
  private static PREFIX_MAP: Record<string, string> = {
    'export async': 'qo',
    'export': 'ch',
    'async': 'sh',
    'public async': 'ok-sh',
    'public': 'ok',
    'private': 'ot',
    'protected': 'ar',
    'static': 'al',
    'default': 'da',
  };

  /**
   * Translitera código TypeScript/JavaScript a bloques canónicos EVA
   */
  public transliterate(sourceCode: string): EVATransliterateResult {
    const trimmed = sourceCode.trim();
    if (!trimmed) {
      return {
        evaGlyphBlock: '',
        slots: [],
        originalTokens: 0,
        evaTokens: 0,
        tokenReductionPercent: 0,
      };
    }

    const lines = trimmed.split('\n');
    const slots: EVASlot[] = [];

    // Expresiones regulares para capturar declaraciones de funciones, clases y métodos
    const fnRegex = /(?:(export\s+async|export|async|public\s+async|public|private)\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)(?:\s*:\s*([^;{]+))?/;
    const classRegex = /(?:(export|default)\s+)?class\s+([a-zA-Z0-9_$]+)/;
    const methodRegex = /(?:(public\s+async|public|private|protected|async)\s+)([a-zA-Z0-9_$]+)\s*\(([^)]*)\)(?:\s*:\s*([^;{]+))?/;
    const interfaceRegex = /(?:(export)\s+)?interface\s+([a-zA-Z0-9_$]+)/;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//') || line.startsWith('*')) continue;

      // 1. Clases
      const classMatch = line.match(classRegex);
      if (classMatch && !line.includes('function')) {
        const mod = (classMatch[1] || 'default').trim();
        const name = classMatch[2];
        const prefix = OcteractEVAAST.PREFIX_MAP[mod] || 'ch';
        const suffix = 'ol'; // 'ol' en Voynich: entidades cerradas / sustantivos / clases
        const evaToken = `${prefix}${name}${suffix}`;

        slots.push({
          prefix,
          core: name,
          suffix,
          identifier: name,
          kind: 'class',
          originalSignature: line,
          evaToken,
        });
        continue;
      }

      // 2. Interfaces
      const ifaceMatch = line.match(interfaceRegex);
      if (ifaceMatch) {
        const name = ifaceMatch[2];
        const prefix = 'ch';
        const suffix = 'edy';
        const evaToken = `${prefix}${name}${suffix}`;

        slots.push({
          prefix,
          core: name,
          suffix,
          identifier: name,
          kind: 'interface',
          originalSignature: line,
          evaToken,
        });
        continue;
      }

      // 3. Funciones
      const fnMatch = line.match(fnRegex);
      if (fnMatch) {
        const mod = (fnMatch[1] || 'default').trim();
        const name = fnMatch[2];
        const returnType = fnMatch[4] ? fnMatch[4].trim() : 'void';
        const prefix = OcteractEVAAST.PREFIX_MAP[mod] || 'da';
        const suffix = this.classifyReturnSuffix(returnType);
        const evaToken = `${prefix}${name}${suffix}`;

        slots.push({
          prefix,
          core: name,
          suffix,
          identifier: name,
          kind: 'function',
          originalSignature: line,
          evaToken,
        });
        continue;
      }

      // 4. Métodos dentro de clases
      const methodMatch = line.match(methodRegex);
      if (methodMatch && !line.startsWith('function')) {
        const mod = methodMatch[1].trim();
        const name = methodMatch[2];
        if (name === 'constructor' || name === 'if' || name === 'for' || name === 'while') continue;

        const returnType = methodMatch[4] ? methodMatch[4].trim() : 'void';
        const prefix = OcteractEVAAST.PREFIX_MAP[mod] || 'ok';
        const suffix = this.classifyReturnSuffix(returnType);
        const evaToken = `${prefix}${name}${suffix}`;

        slots.push({
          prefix,
          core: name,
          suffix,
          identifier: name,
          kind: 'method',
          originalSignature: line,
          evaToken,
        });
      }
    }

    // Construir bloque de glifos EVA
    if (slots.length === 0) {
      return {
        evaGlyphBlock: '',
        slots: [],
        originalTokens: Math.max(1, Math.round(sourceCode.length / 3.8)),
        evaTokens: 0,
        tokenReductionPercent: 0,
      };
    }

    const evaGlyphBlock = slots.map(s => `[EVA::${s.kind.toUpperCase()}] ${s.evaToken}`).join('\n');

    const originalTokens = Math.max(1, Math.round(sourceCode.length / 3.8));
    const evaTokens = Math.max(1, Math.round(evaGlyphBlock.length / 3.8));
    const tokenReductionPercent = Math.max(0, Math.round(((originalTokens - evaTokens) / originalTokens) * 100));

    return {
      evaGlyphBlock,
      slots,
      originalTokens,
      evaTokens,
      tokenReductionPercent,
    };
  }

  /**
   * Decodifica un bloque de glifos EVA de vuelta a un esqueleto sintáctico
   */
  public decodeToSkeleton(evaGlyphBlock: string): string {
    const trimmed = evaGlyphBlock.trim();
    if (!trimmed) return '';

    const lines = trimmed.split('\n');
    const declarations: string[] = [];

    for (const line of lines) {
      const match = line.match(/\[EVA::([A-Z]+)\]\s+([a-zA-Z0-9_\-]+)/);
      if (!match) continue;

      const kind = match[1];
      const token = match[2];

      if (kind === 'CLASS') {
        const name = token.replace(/^(qo|ch|ok|ot|da)/, '').replace(/ol$/, '');
        declarations.push(`export class ${name} {}`);
      } else if (kind === 'INTERFACE') {
        const name = token.replace(/^(qo|ch|ok|ot|da)/, '').replace(/edy$/, '');
        declarations.push(`export interface ${name} {}`);
      } else if (kind === 'FUNCTION') {
        const isAsync = token.startsWith('qo') || token.startsWith('sh');
        const isPromise = token.endsWith('aiin');
        const name = token.replace(/^(qo|ch|sh|ok|ot|da)/, '').replace(/(aiin|y|in|dy)$/, '');
        const retType = isPromise ? 'Promise<unknown>' : 'void';
        declarations.push(`export ${isAsync ? 'async ' : ''}function ${name}(): ${retType};`);
      } else if (kind === 'METHOD') {
        const isAsync = token.includes('sh') || token.endsWith('aiin');
        const isPromise = token.endsWith('aiin');
        const name = token.replace(/^(ok-sh|ok|ot|ar|al|qo|ch)/, '').replace(/(aiin|y|in|dy)$/, '');
        const retType = isPromise ? 'Promise<unknown>' : 'void';
        declarations.push(`  ${isAsync ? 'async ' : ''}${name}(): ${retType};`);
      }
    }

    return declarations.join('\n');
  }

  private classifyReturnSuffix(returnType: string): string {
    const norm = returnType.toLowerCase();
    if (norm.includes('promise')) return 'aiin'; // En Voynich, '-aiin' es el sufijo de estado diferido / futuro
    if (norm.includes('void')) return 'y';       // '-y' sufijo terminal cerrado
    if (norm.includes('string') || norm.includes('number') || norm.includes('boolean')) return 'in';
    return 'dy'; // Retorno compuesto / estructura
  }
}
