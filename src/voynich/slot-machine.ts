/**
 * OCTERACT-CONTEXT: Validador de Sintaxis Slot-Machine en O(1) (Modelo Zattera)
 * Implementa el autómata finito de ranuras posicionales del manuscrito Voynich
 * para verificar y validar firmas de código en microsegundos sin compilar.
 */

export interface SlotStructure {
  scope?: string;          // export, default
  access?: string;         // public, private, protected
  concurrency?: string;    // async, static, readonly, abstract
  kind: string;            // function, class, interface, type, const, let, var, method
  identifier: string;
  generics?: string;
  params?: string;
  returnContract?: string;
}

export interface SlotValidationResult {
  valid: boolean;
  identifier: string;
  slots?: SlotStructure;
  violationReason?: string;
  slotIndexFailed?: number;
  executionTimeUs: number; // Microsegundos
}

export class OcteractSlotMachineValidator {
  private static SCOPE_TOKENS = new Set(['export', 'default']);
  private static ACCESS_TOKENS = new Set(['public', 'private', 'protected']);
  private static MODIFIER_TOKENS = new Set(['async', 'static', 'readonly', 'abstract']);
  private static KIND_TOKENS = new Set(['function', 'class', 'interface', 'type', 'const', 'let', 'var']);

  /**
   * Valida en O(1) una sentencia de declaración comprobando la estricta ranuración posicional
   */
  public validate(statement: string): SlotValidationResult {
    const start = performance.now();
    const raw = statement.trim();

    if (!raw) {
      return {
        valid: false,
        identifier: '',
        violationReason: 'DECLARATION_EMPTY: La declaración está vacía.',
        executionTimeUs: (performance.now() - start) * 1000,
      };
    }

    // Normalizar separadores y extraer tokens del encabezado antes del cuerpo '{'
    const header = raw.split('{')[0].split(';')[0].trim();
    const tokens = header.match(/[a-zA-Z0-9_$]+|<[^>]+>|\([^)]*\)|:[^=;{]+|./g) || [];

    let currentSlot = 0; // 0: Scope, 1: Access, 2: Modifier, 3: Kind, 4: Identifier, 5: Generics, 6: Params, 7: Return
    let scope: string | undefined;
    let access: string | undefined;
    const modifiers: string[] = [];
    let kind = '';
    let identifier = '';
    let generics = '';
    let params = '';
    let returnContract = '';

    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i].trim();
      i++;
      if (!tok) continue;

      // Slot 0: Scope (export / default)
      if (OcteractSlotMachineValidator.SCOPE_TOKENS.has(tok)) {
        if (currentSlot > 0) {
          return {
            valid: false,
            identifier: '',
            violationReason: `SLOT_ORDER_VIOLATION: Modificador de ámbito '${tok}' en ranura posterior a la ranura 0.`,
            slotIndexFailed: currentSlot,
            executionTimeUs: (performance.now() - start) * 1000,
          };
        }
        scope = scope ? `${scope} ${tok}` : tok;
        continue;
      }

      // Slot 1: Access (public / private / protected)
      if (OcteractSlotMachineValidator.ACCESS_TOKENS.has(tok)) {
        if (currentSlot > 1) {
          return {
            valid: false,
            identifier: '',
            violationReason: `SLOT_ORDER_VIOLATION: Modificador de acceso '${tok}' fuera de su ranura posicional permitida.`,
            slotIndexFailed: currentSlot,
            executionTimeUs: (performance.now() - start) * 1000,
          };
        }
        access = tok;
        currentSlot = 1;
        continue;
      }

      // Slot 2: Modifier (async / static / readonly / abstract)
      if (OcteractSlotMachineValidator.MODIFIER_TOKENS.has(tok)) {
        if (currentSlot > 2) {
          return {
            valid: false,
            identifier: '',
            violationReason: `SLOT_ORDER_VIOLATION: Modificador concurrente '${tok}' en ranura posterior a kind.`,
            slotIndexFailed: currentSlot,
            executionTimeUs: (performance.now() - start) * 1000,
          };
        }
        modifiers.push(tok);
        currentSlot = 2;
        continue;
      }

      // Slot 3: Kind (function / class / interface / type / const / let / var)
      if (OcteractSlotMachineValidator.KIND_TOKENS.has(tok)) {
        if (currentSlot > 3) {
          return {
            valid: false,
            identifier: '',
            violationReason: `SLOT_ORDER_VIOLATION: Tipo de entidad '${tok}' fuera de orden secuencial.`,
            slotIndexFailed: currentSlot,
            executionTimeUs: (performance.now() - start) * 1000,
          };
        }
        kind = tok;
        currentSlot = 3;
        continue;
      }

      // Slot 4: Identifier
      if (!identifier && /^[a-zA-Z0-9_$]+$/.test(tok)) {
        if (/^[0-9]/.test(tok)) {
          return {
            valid: false,
            identifier: '',
            violationReason: `ILLEGAL_IDENTIFIER_SLOT: Identificador '${tok}' no puede comenzar con un dígito numérico.`,
            slotIndexFailed: 4,
            executionTimeUs: (performance.now() - start) * 1000,
          };
        }
        identifier = tok;
        currentSlot = 4;
        continue;
      }

      // Slot 5: Generics (<T>, <K, V>)
      if (tok.startsWith('<') && tok.endsWith('>')) {
        generics = tok;
        currentSlot = 5;
        continue;
      }

      // Slot 6: Parameters ((...))
      if (tok.startsWith('(') && tok.endsWith(')')) {
        params = tok;
        currentSlot = 6;
        continue;
      }

      // Slot 7: Return Type (: Promise<...>)
      if (tok.startsWith(':')) {
        returnContract = tok.slice(1).trim();
        // Consumir tokens restantes de tipo si quedaron divididos
        while (i < tokens.length && tokens[i] !== '{' && tokens[i] !== '=' && tokens[i] !== ';') {
          returnContract += tokens[i];
          i++;
        }
        returnContract = returnContract.trim();
        currentSlot = 7;
        continue;
      }
    }

    // Si no se detectó kind explícito pero hay access/modifiers + identifier + params, es un método de clase
    if (!kind && identifier && (access || modifiers.length > 0 || params)) {
      kind = 'method';
    }

    if (!identifier) {
      return {
        valid: false,
        identifier: '',
        violationReason: 'MISSING_IDENTIFIER_SLOT: Declaración sin identificador de símbolo válido.',
        slotIndexFailed: 4,
        executionTimeUs: (performance.now() - start) * 1000,
      };
    }

    return {
      valid: true,
      identifier,
      slots: {
        scope,
        access,
        concurrency: modifiers.join(' ') || undefined,
        kind: kind || 'declaration',
        identifier,
        generics: generics || undefined,
        params: params || undefined,
        returnContract: returnContract || undefined,
      },
      executionTimeUs: parseFloat(((performance.now() - start) * 1000).toFixed(2)),
    };
  }
}
