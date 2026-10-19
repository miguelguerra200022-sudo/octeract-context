/**
 * TESSERACT-CONTEXT: Panal Teseráctico {4,3,3,4} para Monorrepos y Microservicios
 * Embaldosado regular del espacio 4D mediante retículas cúbicas Z^4 y facetas 3D compartidas
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type LatticeVector,
  type FacetManifold,
  type Axis4D,
  type Point4D,
  type HyperVertex
} from './types.ts';
import { HypercubeSpace } from './hypercube.ts';
import { eventBus } from './events.ts';

export interface HoneycombPackage {
  name: string;
  dir: string;
  lattice: LatticeVector;
  space: HypercubeSpace;
}

export class TesseracticHoneycomb {
  private packages: Map<string, HoneycombPackage> = new Map();
  private nextAutoLatticeIndex = 0;

  constructor() {
    eventBus.emitEvent('query', { type: 'honeycomb_init', timestamp: Date.now() });
  }

  /**
   * Registra un paquete en la red teseráctica Z^4
   */
  public registerPackage(
    name: string,
    dir: string,
    lattice?: LatticeVector,
    space?: HypercubeSpace
  ): LatticeVector {
    let assignedLattice = lattice;
    if (!assignedLattice) {
      // Auto-asignación a lo largo de los 4 ejes principales
      const idx = this.nextAutoLatticeIndex++;
      assignedLattice = [
        idx % 4 === 0 ? Math.floor(idx / 4) : 0,
        idx % 4 === 1 ? Math.floor(idx / 4) : 0,
        idx % 4 === 2 ? Math.floor(idx / 4) : 0,
        idx % 4 === 3 ? Math.floor(idx / 4) : 0,
      ];
    }

    const pkgSpace = space || new HypercubeSpace();
    this.packages.set(name, {
      name,
      dir,
      lattice: assignedLattice,
      space: pkgSpace,
    });

    return assignedLattice;
  }

  /**
   * Obtiene todos los paquetes registrados en el panal
   */
  public getPackages(): HoneycombPackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * Obtiene un paquete por nombre
   */
  public getPackage(name: string): HoneycombPackage | undefined {
    return this.packages.get(name);
  }

  /**
   * Determina si dos teseractos son adyacentes en el panal {4,3,3,4}
   * (Son adyacentes si difieren exactamente en 1 unidad en un solo eje: Distancia Manhattan = 1)
   */
  public static areAdjacent(l1: LatticeVector, l2: LatticeVector): boolean {
    let diffCount = 0;
    for (let i = 0; i < 4; i++) {
      const delta = Math.abs(l1[i] - l2[i]);
      if (delta === 1) {
        diffCount++;
      } else if (delta !== 0) {
        return false;
      }
    }
    return diffCount === 1;
  }

  /**
   * Obtiene el eje de adyacencia (X, Y, Z, W) entre dos celdas del panal
   */
  public static getAdjacencyAxis(l1: LatticeVector, l2: LatticeVector): Axis4D | null {
    const axes: Axis4D[] = ['X', 'Y', 'Z', 'W'];
    let axis: Axis4D | null = null;
    let diffCount = 0;

    for (let i = 0; i < 4; i++) {
      const delta = Math.abs(l1[i] - l2[i]);
      if (delta === 1) {
        axis = axes[i];
        diffCount++;
      } else if (delta !== 0) {
        return null;
      }
    }

    return diffCount === 1 ? axis : null;
  }

  /**
   * Localiza las facetas cúbicas 3D compartidas entre paquetes adyacentes
   */
  public findSharedFacets(): FacetManifold[] {
    const facets: FacetManifold[] = [];
    const pkgs = Array.from(this.packages.values());

    for (let i = 0; i < pkgs.length; i++) {
      for (let j = i + 1; j < pkgs.length; j++) {
        const pkgA = pkgs[i];
        const pkgB = pkgs[j];

        if (TesseracticHoneycomb.areAdjacent(pkgA.lattice, pkgB.lattice)) {
          const axis = TesseracticHoneycomb.getAdjacencyAxis(pkgA.lattice, pkgB.lattice)!;
          const sharedSymbols = this.extractSharedSymbols(pkgA, pkgB);

          facets.push({
            facetId: `facet_${pkgA.name}_to_${pkgB.name}`,
            packageA: pkgA.name,
            packageB: pkgB.name,
            axis,
            boundaryCoordinate: 1.0,
            sharedSymbols,
          });
        }
      }
    }

    return facets;
  }

  /**
   * Extrae los símbolos compartidos a través de la frontera entre dos paquetes
   */
  private extractSharedSymbols(pkgA: HoneycombPackage, pkgB: HoneycombPackage): string[] {
    const shared = new Set<string>();

    const verticesA = pkgA.space.getVertices();
    const verticesB = pkgB.space.getVertices();

    // Símbolos exportados por A que son consumidos por B
    for (const vA of verticesA) {
      for (const sym of vA.symbols) {
        if (sym.isExported) {
          const isConsumedByB = verticesB.some((vB) =>
            vB.dependencies.some((dep) => dep.includes(pkgA.name) || dep.includes(vA.id))
          );
          if (isConsumedByB) {
            shared.add(sym.name);
          }
        }
      }
    }

    // Símbolos exportados por B que son consumidos por A
    for (const vB of verticesB) {
      for (const sym of vB.symbols) {
        if (sym.isExported) {
          const isConsumedByA = verticesA.some((vA) =>
            vA.dependencies.some((dep) => dep.includes(pkgB.name) || dep.includes(vB.id))
          );
          if (isConsumedByA) {
            shared.add(sym.name);
          }
        }
      }
    }

    return Array.from(shared);
  }

  /**
   * Transforma una coordenada local [0, 1]^4 a coordenada global continua en el panal
   */
  public static globalCoordinate(localCoord: Point4D, lattice: LatticeVector): Point4D {
    return [
      lattice[0] + localCoord[0],
      lattice[1] + localCoord[1],
      lattice[2] + localCoord[2],
      lattice[3] + localCoord[3],
    ];
  }

  /**
   * Detecta si un directorio raíz corresponde a un monorrepo
   */
  public static isMonorepo(rootDir: string): boolean {
    const indicators = [
      'pnpm-workspace.yaml',
      'lerna.json',
      'turbo.json',
      'rush.json',
    ];

    for (const file of indicators) {
      if (fs.existsSync(path.join(rootDir, file))) return true;
    }

    const pkgJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        if (pkg.workspaces) return true;
      } catch (_) {}
    }

    const packagesDir = path.join(rootDir, 'packages');
    if (fs.existsSync(packagesDir) && fs.statSync(packagesDir).isDirectory()) {
      return true;
    }

    return false;
  }
}
