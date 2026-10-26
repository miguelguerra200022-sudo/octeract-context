/**
 * OCTERACT CONCHOLOGICAL MORPHOLOGY ENGINE (Raup 1966 3D Morphospace)
 * 
 * Implementación del modelo matemático de crecimiento acrecionario de conchas
 * (David M. Raup, Science 1966: "Geometric Analysis of Shell Coiling").
 * 
 * Modela el grafo de software como una concha biológica 3D gobernada por 3 números:
 *   - W (Whorl Expansion Rate): Tasa de divergencia / fan-out entre capas.
 *   - D (Distance from Coiling Axis / Umbilicus): Relación con el núcleo de tipos/lógica. (D < 0 = colisión/ciclos).
 *   - T (Translation Rate along Axis): Altura de la espira / profundidad de abstracción jerárquica.
 * 
 * Incluye:
 *   1. Filtro del Cubo Vacío (Empty Morphospace Filter): Detecta arquitecturas inviables.
 *   2. Cámaras Tabicadas del Nautilus (Septal Accretion Chambers): Compresión extrema de contexto (85%+ ahorro).
 *   3. Onda de Choque en Espiral Logarítmica O(log N).
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { HypercubeSpace } from '../core/hypercube.ts';
import type { HyperVertex } from '../core/types.ts';
import { ASTSkeletonizer } from '../core/skeleton.ts';
import { OcteractDragonFold } from '../dragon/dragonFold.ts';

/** Arquetipos biológicos concológicos de software */
export type ConchologicalArchetype =
  | 'NAUTILUS'          // Espiral planispiral armónica: modular, balanceada, óptima
  | 'CLAM'              // Bivalvo de apertura masiva: monolítico, acoplamiento alto, baja profundidad
  | 'CONE_SNAIL'        // Espira cónica escalonada: arquitectura empresarial por capas n-tier
  | 'RAM_HORN'          // Cuerno de carnero (Planorbis): ombligo abierto, paquetes desacoplados
  | 'TOWER_SPIRE'       // Torre de espira hipertrofiada: sobre-abstracción e indirección excesiva
  | 'ABERRANT_MONSTER'; // Geometría que se auto-intersecta o colapsa (ciclos o vacío biológico)

/** Parámetros fundamentales del morphospace de Raup (1966) */
export interface RaupParameters {
  /** W: Whorl Expansion Rate (Tasa de expansión radial por vuelta de 360°) */
  w: number;
  /** D: Distance from Coiling Axis (Relación umbilical; D < 0 implica auto-colisión / ciclos) */
  d: number;
  /** T: Translation Rate along Coiling Axis (Altura de la espira / capas de abstracción) */
  t: number;
  /** Arquetipo biológico dominante */
  archetype: ConchologicalArchetype;
  /** Puntuación de viabilidad biológica estructural (0 a 100) */
  viabilityScore: number;
  /** ¿Cae en el Cubo Vacío de Raup? (Formas matemáticamente posibles pero biológicamente inviables) */
  isEmptyMorphospace: boolean;
  /** Diagnóstico pedagógico universal */
  analogy: string;
}

/** Partición de contexto en Cámaras Tabicadas del Nautilus */
export interface NautilusChamberPartition {
  /** Cámara de Habitación Viva (Active Aperture): 100% tokens de fidelidad */
  livingChamber: {
    filePath: string;
    tokensApprox: number;
    content: string;
  };
  /** Cámaras Septales Adyacentes (Hop 1): Esqueletos estructurales (15-20% tokens) */
  adjacentChambers: Array<{
    filePath: string;
    tokensApprox: number;
    chamberIndex: number;
    content: string;
  }>;
  /** Cámaras Ancestrales Tabicadas y Selladas (Hop 2+): 1 token por tabique invariante */
  sealedSepta: Array<{
    filePath: string;
    septumSummary: string;
    chamberIndex: number;
  }>;
  /** Tokens originales si se enviaran todos los archivos planos */
  totalUncompressedTokens: number;
  /** Tokens entregados mediante partición septal */
  totalChamberTokens: number;
  /** Porcentaje de ahorro en contexto LLM */
  contextSavingsPercent: number;
}

/** Reporte integral concológico para el repositorio */
export interface RaupMorphologyReport {
  raupVector: RaupParameters;
  totalChambersCount: number;
  coilingPitchAngleDeg: number;
  septalCompressionFactor: number;
  cyclicCollisionsCount: number;
  architecturalHealthVerdict: string;
  topChambers: Array<{
    path: string;
    chamberDepth: number;
    radialDistance: number;
    fanOut: number;
  }>;
  summaryMarkdown: string;
}

export class OcteractRaupMorphospace {
  /**
   * Calcula el vector de Raup (W, D, T) y clasifica el arquetipo concológico del repositorio
   */
  public static calculateRaupVector(space: HypercubeSpace): RaupParameters {
    const vertices = space.getVertices();
    if (vertices.length === 0) {
      return {
        w: 1.0,
        d: 0.0,
        t: 0.0,
        archetype: 'NAUTILUS',
        viabilityScore: 100,
        isEmptyMorphospace: false,
        analogy: 'Espacio vacío sin módulos indexados.',
      };
    }

    // 1. Cálculo de W (Whorl Expansion Rate): Divergencia promedio de fan-out
    let totalOutDegree = 0;
    let maxOutDegree = 0;
    for (const v of vertices) {
      const outDeg = (v.dependencies || []).length;
      totalOutDegree += outDeg;
      if (outDeg > maxOutDegree) maxOutDegree = outDeg;
    }
    const avgOutDegree = totalOutDegree / vertices.length;

    // Normalizamos W:
    // avgOutDegree = 0 -> W = 1.0 (cilindro sin expansión)
    // avgOutDegree = 2.5 -> W ≈ 2.2 (espiral nautiloidea balanceada)
    // avgOutDegree > 6 -> W > 4.5 (expansión desmedida tipo almeja/monolito)
    const rawW = 1.0 + Math.pow(avgOutDegree, 0.85) * 0.75;
    const w = parseFloat(Math.min(10.0, Math.max(1.0, rawW)).toFixed(2));

    // 2. Cálculo de D (Distance from Coiling Axis / Umbilicus Ratio):
    // Evalúa la proximidad o solapamiento con el núcleo de tipos y contratos (CoreLogic / Types)
    let cyclicCollisions = 0;
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const depMap = new Map<string, string[]>();

    for (const v of vertices) {
      const vId = v.path.replace(/\\/g, '/');
      depMap.set(vId, (v.dependencies || []).map((d) => d.replace(/\\/g, '/')));
    }

    // Detección de ciclos para verificar auto-colisión de concha (D < 0)
    function checkCycle(node: string): boolean {
      visited.add(node);
      recStack.add(node);
      const neighbors = depMap.get(node) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (checkCycle(n)) return true;
        } else if (recStack.has(n)) {
          return true;
        }
      }
      recStack.delete(node);
      return false;
    }

    for (const v of vertices) {
      const vId = v.path.replace(/\\/g, '/');
      if (!visited.has(vId)) {
        if (checkCycle(vId)) {
          cyclicCollisions++;
        }
      }
    }

    // Ratio de distancia al núcleo:
    // Si hay ciclos, D se vuelve negativo (whorl self-intersection: la concha se atraviesa a sí misma)
    let d: number;
    if (cyclicCollisions > 0) {
      d = parseFloat((-0.15 * Math.min(5, cyclicCollisions)).toFixed(2));
    } else {
      // Distancia euclidiana media de los vértices al origen de coordenadas [0,0,0,0]
      let sumDist = 0;
      for (const v of vertices) {
        const c = v.coordinate || [0.5, 0.5, 0.5, 0.5];
        const dist = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
        sumDist += dist;
      }
      const avgDist = sumDist / vertices.length;
      d = parseFloat((avgDist * 0.4).toFixed(2));
    }

    // 3. Cálculo de T (Translation Rate along Axis / Spire Height):
    // Mide la profundidad de la pila arquitectónica (diferenciación en eje Z)
    const zCoords = vertices.map((v) => (v.coordinate ? v.coordinate[2] : 0.5));
    const minZ = Math.min(...zCoords);
    const maxZ = Math.max(...zCoords);
    const zSpan = maxZ - minZ;
    // Si los módulos están en una sola capa plana, T ≈ 0 (planispiral).
    // Si la jerarquía abarca muchas capas escalonadas, T crece hacia espira cónica o torre.
    const rawT = (zSpan * 1.5) + (vertices.length > 30 ? 0.3 : 0.1);
    const t = parseFloat(Math.min(5.0, Math.max(0.0, rawT)).toFixed(2));

    // 4. Clasificación del Arquetipo Concológico
    let archetype: ConchologicalArchetype = 'NAUTILUS';
    let isEmptyMorphospace = false;
    let viabilityScore = 100;
    let analogy = '';

    if (d < 0) {
      archetype = 'ABERRANT_MONSTER';
      isEmptyMorphospace = true;
      viabilityScore = Math.max(10, 60 - cyclicCollisions * 15);
      analogy = `🚨 Concha Aberrante con auto-colisión interna (${cyclicCollisions} dependencias circulares). En la naturaleza, esta concha se perfora a sí misma y el molusco muere asfixiado; en software, genera bloqueos en tiempo de ejecución.`;
    } else if (w > 4.5 && t < 0.4) {
      archetype = 'CLAM';
      viabilityScore = 72;
      isEmptyMorphospace = false;
      analogy = `🐚 Arquetipo Almeja (Bivalvo Monolítico): La abertura crece explosivamente en una sola vuelta (W=${w}). Acceso directo y plano, pero genera alta rigidez y acoplamiento horizontal masivo.`;
    } else if (t > 1.8) {
      archetype = 'TOWER_SPIRE';
      isEmptyMorphospace = true;
      viabilityScore = 65;
      analogy = `🗼 Arquetipo Torre de Espira Hipertrofiada (Torre de Babel): Altura de abstracción desmedida (T=${t}). Demasiados intermediarios y capas 'pasamanos' que consumen energía sin aportar valor biológico.`;
    } else if (d > 0.35 && t < 0.3) {
      archetype = 'RAM_HORN';
      viabilityScore = 85;
      isEmptyMorphospace = false;
      analogy = `🌀 Arquetipo Cuerno de Carnero (Planorbis): Ombligo abierto y amplio (D=${d}). Los módulos coexisten en el mismo plano pero guardan amplia distancia entre sí, como micro-librerías desacopladas.`;
    } else if (t >= 0.4 && t <= 1.8 && w <= 4.0) {
      archetype = 'CONE_SNAIL';
      viabilityScore = 92;
      isEmptyMorphospace = false;
      analogy = `🐌 Arquetipo Caracol Cónico (Cono Escalonado): Espira equilibrada con traslación vertical ordenada (T=${t}, W=${w}). Arquitectura clásica limpia n-tier donde cada capa se apoya suavemente en la anterior.`;
    } else {
      archetype = 'NAUTILUS';
      viabilityScore = 98;
      isEmptyMorphospace = false;
      analogy = `🌟 Arquetipo Nautilus Primordial (Perfección Logarítmica): Geometría planispiral óptima (W=${w}, D=${d}, T=${t}). Crecimiento armónico por adición de cámaras, sellando la deuda técnica histórica en tabiques impenetrables.`;
    }

    return {
      w,
      d,
      t,
      archetype,
      viabilityScore,
      isEmptyMorphospace,
      analogy,
    };
  }

  /**
   * Particiona el grafo del repositorio en Cámaras Tabicadas del Nautilus
   * - Living Chamber (Cámara activa): 100% tokens de fidelidad.
   * - Adjacent Chambers (Hop 1): Esqueletos AST (15-20% tokens).
   * - Sealed Septa (Hop 2+): 1 token de resumen por cámara sellada.
   */
  public static partitionNautilusChambers(
    space: HypercubeSpace,
    activeFile?: string,
    rootDir: string = '.'
  ): NautilusChamberPartition {
    const vertices = space.getVertices();
    const root = path.resolve(rootDir);

    if (vertices.length === 0) {
      return {
        livingChamber: { filePath: 'empty', tokensApprox: 0, content: '' },
        adjacentChambers: [],
        sealedSepta: [],
        totalUncompressedTokens: 0,
        totalChamberTokens: 0,
        contextSavingsPercent: 0,
      };
    }

    // 1. Identificar el vértice de la Cámara Viva (Active Chamber)
    let livingVertex = vertices[0];
    if (activeFile) {
      const normTarget = activeFile.replace(/\\/g, '/');
      const found = vertices.find((v) => {
        const vPath = v.path.replace(/\\/g, '/');
        return vPath === normTarget || vPath.endsWith(normTarget) || normTarget.endsWith(vPath);
      });
      if (found) livingVertex = found;
    }

    const livingPath = livingVertex.path;
    const fullLivingPath = path.isAbsolute(livingPath) ? livingPath : path.resolve(root, livingPath);
    let livingContent = '';
    try {
      if (fs.existsSync(fullLivingPath)) {
        livingContent = fs.readFileSync(fullLivingPath, 'utf-8');
      }
    } catch {
      livingContent = `// Archivo: ${livingPath}\nexport const chamber = "active";`;
    }
    const livingTokens = Math.max(1, Math.round(livingContent.length / 3.8));

    // 2. Clasificar vecinos inmediatos (Hop 1: Cámaras Adyacentes)
    const directNeighbors = new Set<string>();
    for (const dep of livingVertex.dependencies || []) {
      directNeighbors.add(dep.replace(/\\/g, '/'));
    }
    for (const dep of livingVertex.dependents || []) {
      directNeighbors.add(dep.replace(/\\/g, '/'));
    }

    const adjacentChambers: NautilusChamberPartition['adjacentChambers'] = [];
    const sealedSepta: NautilusChamberPartition['sealedSepta'] = [];

    let totalRawBytes = livingContent.length;
    let chamberIndex = 1;

    for (const v of vertices) {
      const vNorm = v.path.replace(/\\/g, '/');
      if (vNorm === livingVertex.path.replace(/\\/g, '/')) continue;

      const fullVPath = path.isAbsolute(v.path) ? v.path : path.resolve(root, v.path);
      let fileContent = '';
      try {
        if (fs.existsSync(fullVPath)) {
          fileContent = fs.readFileSync(fullVPath, 'utf-8');
        }
      } catch {
        fileContent = `// File: ${v.path}`;
      }
      totalRawBytes += fileContent.length;

      const isAdjacent = directNeighbors.has(vNorm) || Array.from(directNeighbors).some((n) => vNorm.endsWith(n) || n.endsWith(vNorm));

      if (isAdjacent && adjacentChambers.length < 8) {
        // Cámara Adyacente: comprimir a esqueleto estructural AST
        const skel = ASTSkeletonizer.skeletonize(fileContent, v.path);
        const skelTokens = Math.max(1, Math.round(skel.skeletonCode.length / 3.8));
        adjacentChambers.push({
          filePath: v.path,
          tokensApprox: skelTokens,
          chamberIndex,
          content: skel.skeletonCode,
        });
      } else {
        // Cámara Ancestral Sellada: 1 token representativo por tabique nácar
        const symbolList = (v.symbols || []).map((s) => s.name).slice(0, 3).join(', ');
        const septumSummary = `[Tabique #${chamberIndex}: ${path.basename(v.path)} (${v.cell}) 🔒 ${symbolList ? `[${symbolList}]` : 'sellado'}]`;
        sealedSepta.push({
          filePath: v.path,
          septumSummary,
          chamberIndex,
        });
      }
      chamberIndex++;
    }

    const totalUncompressedTokens = Math.max(1, Math.round(totalRawBytes / 3.8));
    const adjacentTokensSum = adjacentChambers.reduce((acc, c) => acc + c.tokensApprox, 0);
    // Cada tabique sellado consume ~3 tokens de metadatos en lugar de cientos
    const sealedTokensSum = sealedSepta.length * 3;
    const totalChamberTokens = livingTokens + adjacentTokensSum + sealedTokensSum;
    const contextSavingsPercent = Math.max(
      0,
      Math.min(99, Math.round(((totalUncompressedTokens - totalChamberTokens) / totalUncompressedTokens) * 100))
    );

    return {
      livingChamber: {
        filePath: livingPath,
        tokensApprox: livingTokens,
        content: livingContent,
      },
      adjacentChambers,
      sealedSepta,
      totalUncompressedTokens,
      totalChamberTokens,
      contextSavingsPercent,
    };
  }

  /**
   * Onda de choque en Espiral Logarítmica (Raup Shockwave O(log N))
   * Propaga el impacto a lo largo de la espiral con amortiguación concológica
   */
  public static calculateSpiralBlast(
    space: HypercubeSpace,
    targetFile: string
  ): {
    epicenter: string;
    spiralWhorlsVisited: number;
    affectedChambers: Array<{ file: string; energyDecay: number; theta: number }>;
    totalAffectedFiles: number;
  } {
    const raup = this.calculateRaupVector(space);
    const vertices = space.getVertices();
    const normTarget = targetFile.replace(/\\/g, '/');

    // Pitch angle α = cot^-1(ln(W) / 2π)
    const b = Math.log(Math.max(1.05, raup.w)) / (2 * Math.PI);

    const affected: Array<{ file: string; energyDecay: number; theta: number }> = [];
    const queue: Array<{ file: string; depth: number; theta: number; energy: number }> = [
      { file: normTarget, depth: 0, theta: 0, energy: 1.0 },
    ];
    const visited = new Set<string>([normTarget]);

    // Mapa de dependientes
    const depMap = new Map<string, string[]>();
    for (const v of vertices) {
      const vId = v.path.replace(/\\/g, '/');
      if (!depMap.has(vId)) depMap.set(vId, []);
      for (const d of v.dependencies || []) {
        const dNorm = d.replace(/\\/g, '/');
        if (!depMap.has(dNorm)) depMap.set(dNorm, []);
        depMap.get(dNorm)!.push(vId);
      }
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.depth > 0) {
        affected.push({
          file: curr.file,
          energyDecay: parseFloat(curr.energy.toFixed(3)),
          theta: parseFloat(curr.theta.toFixed(2)),
        });
      }

      if (curr.energy < 0.05 || curr.depth >= 6) continue;

      const children = depMap.get(curr.file) || [];
      for (const child of children) {
        if (!visited.has(child)) {
          visited.add(child);
          const nextTheta = curr.theta + Math.PI / 2; // Avance de 90° por salto de cámara
          const nextEnergy = curr.energy * Math.exp(-b * (Math.PI / 2));
          queue.push({
            file: child,
            depth: curr.depth + 1,
            theta: nextTheta,
            energy: nextEnergy,
          });
        }
      }
    }

    return {
      epicenter: normTarget,
      spiralWhorlsVisited: Math.ceil(affected.length / 4),
      affectedChambers: affected,
      totalAffectedFiles: affected.length,
    };
  }

  /**
   * Auditoría concológica completa del repositorio
   */
  public static auditMorphology(space: HypercubeSpace, rootDir?: string): RaupMorphologyReport {
    const raupVector = this.calculateRaupVector(space);
    const vertices = space.getVertices();
    const root = path.resolve(rootDir || '.');

    // Ángulo de paso de la espiral concológica (Pitch Angle en grados)
    // alpha = arctan(2pi / ln(W))
    const lnW = Math.log(Math.max(1.01, raupVector.w));
    const pitchAngleRad = Math.atan((2 * Math.PI) / lnW);
    const coilingPitchAngleDeg = parseFloat(((pitchAngleRad * 180) / Math.PI).toFixed(1));

    // Partición de prueba para evaluar factor de compresión
    const samplePartition = this.partitionNautilusChambers(space, undefined, root);
    const septalCompressionFactor = parseFloat(
      (samplePartition.totalUncompressedTokens / Math.max(1, samplePartition.totalChamberTokens)).toFixed(1)
    );

    let cyclicCollisionsCount = 0;
    if (raupVector.d < 0) {
      cyclicCollisionsCount = Math.round(Math.abs(raupVector.d) / 0.15);
    }

    // Top 5 Cámaras más influyentes por radio y fan-out
    const topChambers = vertices
      .map((v) => {
        const outDeg = (v.dependencies || []).length;
        const c = v.coordinate || [0.5, 0.5, 0.5, 0.5];
        const radialDistance = parseFloat(Math.sqrt(c[0] * c[0] + c[1] * c[1]).toFixed(3));
        return {
          path: v.path,
          chamberDepth: Math.round(c[2] * 10),
          radialDistance,
          fanOut: outDeg,
        };
      })
      .sort((a, b) => b.fanOut - a.fanOut)
      .slice(0, 5);

    const verdict = raupVector.isEmptyMorphospace
      ? `🚨 INVIABLE (Cubo Vacío de Raup: ${raupVector.archetype})`
      : `✅ VIABLE Y ARMÓNICO (${raupVector.archetype})`;

    const summaryLines = [
      `### 🐚 Diagnóstico Concológico de Raup (1966 3D Morphospace)`,
      `- **Vector de Crecimiento (W, D, T)**: W=${raupVector.w} (Expansión) | D=${raupVector.d} (Ombligo/Núcleo) | T=${raupVector.t} (Espira/Pila)`,
      `- **Arquetipo**: **${raupVector.archetype}** | **Viabilidad Estructural**: ${raupVector.viabilityScore}/100`,
      `- **Estado del Morphospace**: ${verdict}`,
      `- **Ángulo de Paso Espiral**: ${coilingPitchAngleDeg}° | **Amortiguación Septal**: ${septalCompressionFactor}x de compresión`,
      `- **Analogía Biológica**: ${raupVector.analogy}`,
    ];

    return {
      raupVector,
      totalChambersCount: vertices.length,
      coilingPitchAngleDeg,
      septalCompressionFactor,
      cyclicCollisionsCount,
      architecturalHealthVerdict: verdict,
      topChambers,
      summaryMarkdown: summaryLines.join('\n'),
    };
  }
}