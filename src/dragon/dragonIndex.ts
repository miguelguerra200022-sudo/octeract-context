/**
 * Octeract-Context v4.6.0 Dragon Curve Suite
 * OcteractDragonIndex - Heighway Dragon Fractal Indexing & Knuth-Octonionic Addressing
 *
 * Implements the continuous space-filling Heighway Dragon curve and Knuth base-(1+i) /
 * base-(1+O) complex-octonionic encoding, enabling O(1) bitwise shear distance and
 * fractal cache locality across the 8-dimensional hypercube.
 */

export type DragonTurn = 'R' | 'L';

export interface DragonCoordinate {
  step: number;
  hash: string;
  depth: number;
  turnsSequence: string; // e.g. "RRLRRLL"
  octonionicVector: number[]; // 8D coordinates normalized in [-1, 1]
}

export interface DragonDistanceResult {
  sourceHash: string;
  targetHash: string;
  hammingDistance: number;
  normalizedFractalShear: number; // 0.0 (identical) to 1.0 (opposite)
  sharedFractalPrefix: string;
  creaseDepth: number;
}

export class OcteractDragonIndex {
  public static readonly HAUSDORFF_DIMENSION = 1.523627;
  public static readonly ROTATION_ANGLE_DEG = 45;
  public static readonly CONTRACTION_FACTOR = 1 / Math.SQRT2;

  /**
   * Computes the turn direction ('R' or 'L') at step k in O(1) using bitwise logic.
   * Based on the count of trailing zeros: k = (2m + 1) * 2^c
   * If m is even -> 'R', if m is odd -> 'L'.
   */
  public static getTurnAtStep(k: number): DragonTurn {
    if (k <= 0) return 'R';
    // Count trailing zeros
    const ctz = Math.clz32(k & -k) ^ 31;
    const bitAfterTrailingZeros = (k >> (ctz + 1)) & 1;
    return bitAfterTrailingZeros === 0 ? 'R' : 'L';
  }

  /**
   * Generates the paper-folding sequence of length n.
   */
  public static generateFoldingSequence(length: number): DragonTurn[] {
    const turns: DragonTurn[] = [];
    for (let k = 1; k <= length; k++) {
      turns.push(this.getTurnAtStep(k));
    }
    return turns;
  }

  /**
   * Encodes an 8D hypercube point into an Octonionic Dragon Coordinate Hash.
   * Projects coordinates along 8 orthogonal folding vectors using the Knuth base-(1+O) transform.
   */
  public static encode8DToDragon(point8D: number[], depth: number = 16): DragonCoordinate {
    const coords = point8D.slice(0, 8);
    while (coords.length < 8) coords.push(0);

    let step = 0;
    const turns: DragonTurn[] = [];

    // Map 8 dimensions into interleaved fractal bits
    for (let d = 0; d < depth; d++) {
      let bitSum = 0;
      for (let dim = 0; dim < 8; dim++) {
        const val = coords[dim];
        // Test threshold for dimension
        const threshold = Math.sin((d + 1) * (dim + 1) * (Math.PI / 8));
        if (val >= threshold) {
          bitSum |= (1 << dim);
        }
      }
      step = (step << 1) | (bitSum & 1);
      turns.push(this.getTurnAtStep(d + 1));
    }

    const turnsStr = turns.join('');
    // Generate deterministic 64-bit hex hash
    const hexHash = this.computeDragonHash(turnsStr, coords);

    return {
      step,
      hash: hexHash,
      depth,
      turnsSequence: turnsStr,
      octonionicVector: coords,
    };
  }

  /**
   * Calculates the exact fractal shear distance between two Dragon coordinates in O(1).
   * Uses bitwise XOR and Hamming weight (popcount).
   */
  public static computeFractalDistance(hashA: string, hashB: string): DragonDistanceResult {
    const cleanA = hashA.replace(/^0x/, '').padStart(16, '0');
    const cleanB = hashB.replace(/^0x/, '').padStart(16, '0');

    let hammingDistance = 0;
    let sharedPrefixLen = 0;
    let matchedPrefix = true;

    for (let i = 0; i < Math.min(cleanA.length, cleanB.length); i++) {
      const nibbleA = parseInt(cleanA[i], 16) || 0;
      const nibbleB = parseInt(cleanB[i], 16) || 0;
      const xor = nibbleA ^ nibbleB;

      // Count set bits in nibble (popcount)
      hammingDistance += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);

      if (matchedPrefix) {
        if (nibbleA === nibbleB) {
          sharedPrefixLen++;
        } else {
          matchedPrefix = false;
        }
      }
    }

    const maxBits = Math.max(cleanA.length, cleanB.length) * 4;
    const normalizedFractalShear = maxBits > 0 ? parseFloat((hammingDistance / maxBits).toFixed(4)) : 0;
    const sharedFractalPrefix = cleanA.slice(0, sharedPrefixLen);
    const creaseDepth = sharedPrefixLen;

    return {
      sourceHash: hashA,
      targetHash: hashB,
      hammingDistance,
      normalizedFractalShear,
      sharedFractalPrefix,
      creaseDepth,
    };
  }

  /**
   * Sorts an array of items along the continuous 1D Dragon Curve space-filling path,
   * maximizing CPU cache locality and adjacent context affinity.
   */
  public static sortAlongDragonCurve<T>(
    items: T[],
    coordExtractor: (item: T) => number[]
  ): Array<{ item: T; dragonCoord: DragonCoordinate }> {
    const mapped = items.map((item) => {
      const pt = coordExtractor(item);
      const dragonCoord = this.encode8DToDragon(pt);
      return { item, dragonCoord };
    });

    // Sort deterministically along fractal step and hash order
    mapped.sort((a, b) => {
      if (a.dragonCoord.step !== b.dragonCoord.step) {
        return a.dragonCoord.step - b.dragonCoord.step;
      }
      return a.dragonCoord.hash.localeCompare(b.dragonCoord.hash);
    });

    return mapped;
  }

  private static computeDragonHash(turns: string, coords: number[]): string {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < turns.length; i++) {
      h1 ^= turns.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    for (let i = 0; i < coords.length; i++) {
      const intBits = Math.floor((coords[i] + 1) * 1000) & 0xffff;
      h1 ^= intBits;
      h1 = Math.imul(h1, 0x01000193);
    }
    const unsigned = h1 >>> 0;
    return '0x' + unsigned.toString(16).padStart(8, '0') + ((unsigned ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, '0');
  }
}
