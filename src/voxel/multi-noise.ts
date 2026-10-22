/**
 * OCTERACT-CONTEXT: Generador de Biomas Arquitectónicos Multi-Noise (Minecraft 1.18+)
 * Proyecta archivos en un espacio climático de 6 dimensiones euclídeas ponderadas:
 * (Temperature, Humidity, Continentalness, Erosion, Depth, Weirdness) para clasificar
 * biomas de software y asignar tolerancias de cizallamiento y protocolos de seguridad.
 */

export type VoxelBiome =
  | 'DEEP_FROZEN_OCEAN'
  | 'JAGGED_PEAKS'
  | 'NETHER_BADLANDS'
  | 'ANCIENT_CITY_SCULK'
  | 'MEADOW_PLAINS'
  | 'LUSH_CAVES';

export interface ClimateVector {
  temperature: number;      // 0.0 (Frío/Estático) -> 1.0 (Caliente/Volátil/Entrópico)
  humidity: number;         // 0.0 (Aislado) -> 1.0 (Acoplado/Eventos/Listeners)
  continentalness: number;  // 0.0 (Periferia/Plugins) -> 1.0 (Núcleo Central Continental)
  erosion: number;          // 0.0 (Roca madre intocada) -> 1.0 (Alto Churn/Modificaciones frecuentes)
  depth: number;            // 0.0 (Superficie/DTOs) -> 1.0 (Profundidad AST/Herencia)
  weirdness: number;        // 0.0 (Código estándar) -> 1.0 (Metaprogramación/Regex/Eval)
}

export interface BiomeReport {
  filePath: string;
  biome: VoxelBiome;
  confidence: number;
  climateVector: ClimateVector;
  maxPermissibleShear: number;
  recommendedSafetyGear: string;
  biomeDescription: string;
}

interface BiomeControlPoint {
  biome: VoxelBiome;
  target: ClimateVector;
  weights: ClimateVector;
  maxShear: number;
  safetyGear: string;
  description: string;
}

export class OcteractMultiNoiseBiomes {
  // Puntos de control en el hiperespacio climático 6D
  private controlPoints: BiomeControlPoint[] = [
    {
      biome: 'DEEP_FROZEN_OCEAN',
      target: { temperature: 0.1, humidity: 0.3, continentalness: 0.9, erosion: 0.05, depth: 0.8, weirdness: 0.1 },
      weights: { temperature: 1.0, humidity: 0.8, continentalness: 1.5, erosion: 1.5, depth: 1.0, weirdness: 0.5 },
      maxShear: 0.05,
      safetyGear: 'Traje de buceo y escafandra (Ensayo obligatorio en RAM; núcleo fundacional congelado intocado).',
      description: 'Núcleo fundacional intocado por años. Riesgo de hipotermia si se desestabiliza su contrato.',
    },
    {
      biome: 'JAGGED_PEAKS',
      target: { temperature: 0.7, humidity: 0.5, continentalness: 0.95, erosion: 0.9, depth: 0.3, weirdness: 0.2 },
      weights: { temperature: 0.8, humidity: 0.8, continentalness: 2.0, erosion: 2.0, depth: 0.8, weirdness: 0.5 },
      maxShear: 0.10,
      safetyGear: 'Piolet y arnés de escalada (Verificar radio de explosión; pivote central de alta tensión).',
      description: 'Pivote central de alta rotación y dependencia masiva. Cualquier desliz provoca una avalancha en cascada.',
    },
    {
      biome: 'NETHER_BADLANDS',
      target: { temperature: 0.95, humidity: 0.1, continentalness: 0.5, erosion: 0.8, depth: 0.6, weirdness: 0.8 },
      weights: { temperature: 1.8, humidity: 1.0, continentalness: 0.8, erosion: 1.0, depth: 0.8, weirdness: 1.5 },
      maxShear: 0.08,
      safetyGear: 'Poción de resistencia al fuego (Validar Event Loop y carreras asíncronas con do-calculus).',
      description: 'Zona de alto riesgo por concurrencia volátil, promesas no lineales y código altamente caliente.',
    },
    {
      biome: 'ANCIENT_CITY_SCULK',
      target: { temperature: 0.2, humidity: 0.95, continentalness: 0.5, erosion: 0.3, depth: 0.4, weirdness: 0.3 },
      weights: { temperature: 0.8, humidity: 3.5, continentalness: 0.8, erosion: 0.8, depth: 0.8, weirdness: 0.8 },
      maxShear: 0.05,
      safetyGear: 'Moverse en sigilo (Sneak / Lana): Despachadores y listeners de eventos conectados al bus global.',
      description: 'Ecosistema de alta vibración acústica (Pub-Sub/EventBus). Si haces ruido, despiertas al Warden.',
    },
    {
      biome: 'MEADOW_PLAINS',
      target: { temperature: 0.4, humidity: 0.2, continentalness: 0.2, erosion: 0.1, depth: 0.1, weirdness: 0.05 },
      weights: { temperature: 0.8, humidity: 0.8, continentalness: 1.2, erosion: 0.8, depth: 1.5, weirdness: 1.0 },
      maxShear: 0.30,
      safetyGear: 'Herramientas estándar de cultivo (Refactorización segura; DTOs planos, interfaces limpias).',
      description: 'Llanuras fértiles de modelos y tipos planos. Mínimo acoplamiento, alta tolerancia al cambio.',
    },
    {
      biome: 'LUSH_CAVES',
      target: { temperature: 0.5, humidity: 0.7, continentalness: 0.5, erosion: 0.3, depth: 0.6, weirdness: 0.3 },
      weights: { temperature: 0.8, humidity: 1.2, continentalness: 1.0, erosion: 0.8, depth: 1.0, weirdness: 0.8 },
      maxShear: 0.15,
      safetyGear: 'Antorchas y tijeras de podar (Utilidades internas ricas y modulares).',
      description: 'Caverna vegetal de módulos utilitarios internos de apoyo con alta cohesión funcional.',
    },
  ];

  /**
   * Clasifica un archivo en un Bioma Voxel según su vector climático 6D
   */
  public classify(
    filePath: string,
    sourceCode: string,
    heuristics: { centrality?: number; churnScore?: number; astDepth?: number } = {}
  ): BiomeReport {
    const climate = this.extractClimateVector(sourceCode, heuristics);

    let nearestBiome = this.controlPoints[0];
    let minDistance = Infinity;

    for (const cp of this.controlPoints) {
      const dist = this.computeWeightedDistance(climate, cp.target, cp.weights);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBiome = cp;
      }
    }

    const confidence = parseFloat(Math.max(0.1, 1.0 - minDistance / 2.5).toFixed(2));

    return {
      filePath,
      biome: nearestBiome.biome,
      confidence,
      climateVector: climate,
      maxPermissibleShear: nearestBiome.maxShear,
      recommendedSafetyGear: nearestBiome.safetyGear,
      biomeDescription: nearestBiome.description,
    };
  }

  private extractClimateVector(
    code: string,
    h: { centrality?: number; churnScore?: number; astDepth?: number }
  ): ClimateVector {
    const len = code.length || 1;

    // 1. Temperature: Medido por ratio de palabras reservadas dinámicas y mutación
    const dynamicKeywords = (code.match(/\b(let|var|any|as\s+any|throw|catch|delete|mutable)\b/g) || []).length;
    const tempRaw = (dynamicKeywords * 40) / len;
    const temperature = Math.min(1.0, Math.max(0.05, tempRaw));

    // 2. Humidity: Eventos, suscripciones y listeners
    const eventCount = (code.match(/\b(on|emit|subscribe|listen|addEventListener|eventBus|Subject|Observable)\b/g) || []).length;
    const humidity = eventCount >= 2 ? Math.min(1.0, 0.4 + eventCount * 0.15) : Math.min(0.3, eventCount * 0.1);

    // 3. Continentalness: Centralidad arquitectónica
    const continentalness = typeof h.centrality === 'number' ? Math.min(1.0, Math.max(0.0, h.centrality)) : 0.4;

    // 4. Erosion: Churn de commits / frecuencia de cambio
    const erosion = typeof h.churnScore === 'number' ? Math.min(1.0, Math.max(0.0, h.churnScore)) : 0.3;

    // 5. Depth: Profundidad de anidamiento de llaves
    let maxNesting = 0;
    let curr = 0;
    for (const char of code) {
      if (char === '{') {
        curr++;
        if (curr > maxNesting) maxNesting = curr;
      } else if (char === '}') {
        curr = Math.max(0, curr - 1);
      }
    }
    const depthVal = typeof h.astDepth === 'number' ? h.astDepth / 6 : maxNesting / 6;
    const depth = Math.min(1.0, Math.max(0.05, depthVal));

    // 6. Weirdness: Regex, metaprogramación, eval, símbolos extraños
    const weirdCount = (code.match(/(\/[^/\n]+\/[gimuy]*|eval\(|Reflect\.|Proxy|Symbol\(|__proto__)/g) || []).length;
    const weirdness = Math.min(1.0, weirdCount * 0.25);

    return {
      temperature: parseFloat(temperature.toFixed(2)),
      humidity: parseFloat(humidity.toFixed(2)),
      continentalness: parseFloat(continentalness.toFixed(2)),
      erosion: parseFloat(erosion.toFixed(2)),
      depth: parseFloat(depth.toFixed(2)),
      weirdness: parseFloat(weirdness.toFixed(2)),
    };
  }

  private computeWeightedDistance(a: ClimateVector, b: ClimateVector, w: ClimateVector): number {
    return Math.sqrt(
      w.temperature * Math.pow(a.temperature - b.temperature, 2) +
      w.humidity * Math.pow(a.humidity - b.humidity, 2) +
      w.continentalness * Math.pow(a.continentalness - b.continentalness, 2) +
      w.erosion * Math.pow(a.erosion - b.erosion, 2) +
      w.depth * Math.pow(a.depth - b.depth, 2) +
      w.weirdness * Math.pow(a.weirdness - b.weirdness, 2)
    );
  }
}
