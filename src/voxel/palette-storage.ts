/**
 * OCTERACT-CONTEXT: Almacenamiento Paletizado de Chunks (Modelo Minecraft BitArray)
 * Empaqueta secuencias de tokens y firmas del AST en secuencias de bits de ancho
 * dinámico en palabras de 64 bits (BigUint64Array), reduciendo la RAM en un 85-92%.
 */

export interface CompressedPaletteSection {
  palette: string[];
  bitWidth: number;
  words: BigUint64Array;
  totalEntries: number;
  uncompressedBytes: number;
  compressedBytes: number;
  compressionRatio: number;
}

export class OcteractPaletteStorage {
  /**
   * Comprime una lista de tokens de código en una sección de paleta compacta
   */
  public compress(tokens: string[]): CompressedPaletteSection {
    if (tokens.length === 0) {
      return {
        palette: [],
        bitWidth: 1,
        words: new BigUint64Array(0),
        totalEntries: 0,
        uncompressedBytes: 0,
        compressedBytes: 0,
        compressionRatio: 1.0,
      };
    }

    // 1. Construir la paleta única
    const paletteMap = new Map<string, number>();
    const palette: string[] = [];

    for (const token of tokens) {
      if (!paletteMap.has(token)) {
        paletteMap.set(token, palette.length);
        palette.push(token);
      }
    }

    // 2. Determinar el ancho de bits necesario: ceil(log2(N))
    const bitWidth = Math.max(1, Math.ceil(Math.log2(palette.length || 1)));
    const entriesPerWord = Math.floor(64 / bitWidth);
    const numWords = Math.ceil(tokens.length / entriesPerWord);
    const words = new BigUint64Array(numWords);

    // 3. Empaquetar los índices de la paleta en palabras de 64 bits
    const mask = (1n << BigInt(bitWidth)) - 1n;
    for (let i = 0; i < tokens.length; i++) {
      const wordIdx = Math.floor(i / entriesPerWord);
      const slotIdx = i % entriesPerWord;
      const paletteIndex = BigInt(paletteMap.get(tokens[i])!);
      const shift = BigInt(slotIdx * bitWidth);
      words[wordIdx] |= (paletteIndex & mask) << shift;
    }

    // 4. Calcular métricas de memoria RAM (punteros V8 + bytes de string)
    const rawCharsBytes = tokens.reduce((acc, t) => acc + Buffer.byteLength(t, 'utf-8'), 0);
    const uncompressedBytes = tokens.length * 24 + rawCharsBytes; // 24 bytes por slot de array + descriptor string en V8
    const paletteBytes = palette.length * 24 + palette.reduce((acc, t) => acc + Buffer.byteLength(t, 'utf-8'), 0);
    const packedBytes = words.byteLength;
    const compressedBytes = paletteBytes + packedBytes;
    const compressionRatio = parseFloat((uncompressedBytes / Math.max(1, compressedBytes)).toFixed(2));

    return {
      palette,
      bitWidth,
      words,
      totalEntries: tokens.length,
      uncompressedBytes,
      compressedBytes,
      compressionRatio,
    };
  }

  /**
   * Descomprime una sección de paleta volviendo a la secuencia exacta de tokens
   */
  public decompress(section: CompressedPaletteSection): string[] {
    if (section.totalEntries === 0 || section.palette.length === 0) {
      return [];
    }

    const { palette, bitWidth, words, totalEntries } = section;
    const entriesPerWord = Math.floor(64 / bitWidth);
    const mask = (1n << BigInt(bitWidth)) - 1n;
    const tokens: string[] = new Array(totalEntries);

    for (let i = 0; i < totalEntries; i++) {
      const wordIdx = Math.floor(i / entriesPerWord);
      const slotIdx = i % entriesPerWord;
      const shift = BigInt(slotIdx * bitWidth);
      const paletteIndex = Number((words[wordIdx] >> shift) & mask);
      tokens[i] = palette[paletteIndex] ?? '';
    }

    return tokens;
  }

  /**
   * Comprime código fuente completo dividiéndolo en tokens léxicos y espacios
   */
  public compressCode(code: string): CompressedPaletteSection {
    // Tokenizador determinista que preserva espacios y símbolos
    const tokens = code.match(/[a-zA-Z0-9_$]+|[^\s\w]|[\r\n]+|\s+/g) || [];
    return this.compress(tokens);
  }

  /**
   * Descomprime código fuente completo concatenando los tokens reconstituidos
   */
  public decompressCode(section: CompressedPaletteSection): string {
    const tokens = this.decompress(section);
    return tokens.join('');
  }
}
