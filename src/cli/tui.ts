/**
 * TESSERACT-CONTEXT: Visualizador de Terminal (TUI) del Teseracto 4D
 * Renderiza la proyección de un hipercubo rotando en 4D en caracteres ASCII/ANSI
 */

import type { Point4D, HyperStats } from '../core/types.ts';
import { HypercubeSpace } from '../core/hypercube.ts';

export class TesseractTUI {
  // Los 16 vértices canónicos de un teseracto unitario en 4D
  private canonicalVertices: Point4D[] = [];
  // Las 32 aristas canónicas que conectan vértices a distancia de Hamming = 1
  private canonicalEdges: Array<[number, number]> = [];

  constructor() {
    this.generateCanonicalTesseract();
  }

  private generateCanonicalTesseract(): void {
    // 16 vértices combinando [-1, 1] en 4 dimensiones
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          for (let w of [-1, 1]) {
            this.canonicalVertices.push([x * 0.7, y * 0.7, z * 0.7, w * 0.7]);
          }
        }
      }
    }

    // 32 aristas conectando vértices que difieren exactamente en 1 coordenada (Hamming = 1)
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let d = 0; d < 4; d++) {
          if (this.canonicalVertices[i][d] !== this.canonicalVertices[j][d]) diff++;
        }
        if (diff === 1) {
          this.canonicalEdges.push([i, j]);
        }
      }
    }
  }

  /**
   * Renderiza un frame del teseracto 4D rotado a un buffer ASCII
   */
  public renderFrame(angleA: number, angleB: number, stats?: HyperStats): string {
    const width = 64;
    const height = 24;
    const buffer: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

    // 1. Aplicar doble rotación 4D ortogonal (XY y ZW simultáneamente)
    const projected2D: Array<[number, number]> = [];

    for (const v of this.canonicalVertices) {
      let r = HypercubeSpace.rotate4D(v, 'XY', angleA);
      r = HypercubeSpace.rotate4D(r, 'ZW', angleB);
      r = HypercubeSpace.rotate4D(r, 'XW', angleA * 0.5);

      // Proyección de 4D a 3D (perspectiva con cámara en W=2.5)
      const p3 = HypercubeSpace.project4Dto3D(r, 2.5);

      // Proyección de 3D a 2D (pantalla)
      const screenX = Math.round(width / 2 + p3[0] * 32);
      const screenY = Math.round(height / 2 + p3[1] * 14);

      projected2D.push([screenX, screenY]);
    }

    // 2. Trazar las 32 aristas con caracteres de línea
    for (const [i, j] of this.canonicalEdges) {
      const [x0, y0] = projected2D[i];
      const [x1, y1] = projected2D[j];
      this.drawLine(buffer, x0, y0, x1, y1, width, height);
    }

    // 3. Dibujar los 16 vértices
    for (let i = 0; i < projected2D.length; i++) {
      const [x, y] = projected2D[i];
      if (x >= 0 && x < width && y >= 0 && y < height) {
        buffer[y][x] = '\x1b[36m●\x1b[0m'; // Cyan vertex
      }
    }

    // 4. Componer la pantalla con estadísticas si existen
    let output = '\x1b[2J\x1b[H'; // Clear screen
    output += '\x1b[1;35m  === [TESSERACT-CONTEXT: PROYECCIÓN DEL HIPERCUBO 4D] ===\x1b[0m\n';

    for (let r = 0; r < height; r++) {
      let line = buffer[r].join('');
      // Agregar métricas a la derecha
      if (stats && r === 2) {
        line += `   \x1b[32m● Vértices 4D:\x1b[0m ${stats.totalVertices}`;
      } else if (stats && r === 4) {
        line += `   \x1b[32m● Aristas:\x1b[0m ${stats.totalEdges}`;
      } else if (stats && r === 6) {
        line += `   \x1b[32m● Tokens totales:\x1b[0m ${stats.totalTokens}`;
      } else if (stats && r === 8) {
        line += `   \x1b[32m● Profundidad Fractal:\x1b[0m Nivel ${stats.hexadecDepth}`;
      } else if (stats && r === 10) {
        line += `   \x1b[32m● Salud Arquitectónica:\x1b[0m \x1b[1;32m${stats.healthStatus}\x1b[0m`;
      } else if (stats && r === 12) {
        line += `   \x1b[33mCeldas Cúbicas:\x1b[0m`;
      } else if (stats && r === 14) {
        line += `   CoreLogic: ${stats.cellDistribution.CoreLogic} | Types: ${stats.cellDistribution.Types}`;
      } else if (stats && r === 16) {
        line += `   Storage: ${stats.cellDistribution.Storage} | Network: ${stats.cellDistribution.Network}`;
      } else if (stats && r === 18) {
        line += `   Tests: ${stats.cellDistribution.Tests} | Security: ${stats.cellDistribution.Security}`;
      }
      output += line + '\n';
    }

    return output;
  }

  /**
   * Algoritmo de línea Bresenham en el buffer de texto
   */
  private drawLine(
    buffer: string[][],
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
    height: number
  ): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        if (buffer[cy][cx] === ' ') {
          buffer[cy][cx] = '\x1b[90m·\x1b[0m'; // Trazo gris
        }
      }

      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  /**
   * Inicia la animación en terminal
   */
  public startAnimation(stats?: HyperStats, frames: number = 30): void {
    let frame = 0;
    const interval = setInterval(() => {
      const angle = (frame * Math.PI) / 16;
      const rendered = this.renderFrame(angle, angle * 0.7, stats);
      process.stdout.write(rendered);

      frame++;
      if (frame >= frames) {
        clearInterval(interval);
        console.log('\n\x1b[32m✔ Proyección completada.\x1b[0m\n');
      }
    }, 80);
  }
}
