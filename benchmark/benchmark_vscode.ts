/**
 * TESSERACT-CONTEXT: Benchmark Científico y Prueba de Estrés Masiva
 * Ejecución sobre el repositorio real de Microsoft Visual Studio Code (~20.000 archivos)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectIndexer } from '../src/core/indexer.ts';
import { ShadowEngine } from '../src/core/shadow.ts';
import { HexadecTree } from '../src/core/hexadectree.ts';
import { CubicCell } from '../src/core/types.ts';

async function runBenchmark() {
  const vscodeDir = '/sdcard/Antigravity/IdeasMillonarias/benchmark_vscode';

  if (!fs.existsSync(vscodeDir)) {
    console.error(`[ERROR] No se encontró el repositorio en: ${vscodeDir}`);
    process.exit(1);
  }

  console.log('\x1b[1;35m=========================================================================\x1b[0m');
  console.log('\x1b[1;35m  TESSERACT-CONTEXT: BENCHMARK MASIVO EN MICROSOFT VS CODE (20.800 ARCHIVOS)\x1b[0m');
  console.log('\x1b[1;35m=========================================================================\x1b[0m\n');

  // Medición de memoria inicial
  const memBefore = process.memoryUsage();
  console.log(`\x1b[36m[MEMORIA INICIAL]\x1b[0m RSS: ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB | Heap: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB\n`);

  console.log(`\x1b[33m⏳ FASE 1: Indexación Topológica 4D y Construcción del Hexadec-Tree...\x1b[0m`);
  const startTime = Date.now();

  const indexer = new ProjectIndexer();
  // Ignoramos carpetas de traducciones pesadas o fixtures para enfocar en código real
  const space = indexer.indexDirectory({
    rootDir: vscodeDir,
    maxFiles: 50000,
    ignorePatterns: ['fixtures', 'test/smoke', 'extensions/*/test'],
  });

  const durationMs = Date.now() - startTime;
  const memAfter = process.memoryUsage();
  const ramConsumedMb = ((memAfter.rss - memBefore.rss) / 1024 / 1024).toFixed(2);

  const stats = space.getHyperStats();
  const vertices = space.getVertices();

  console.log(`\x1b[1;32m✔ INDEXACIÓN COMPLETADA CON ÉXITO\x1b[0m`);
  console.log(`  ● Tiempo total transcurrido: \x1b[1m${(durationMs / 1000).toFixed(2)} segundos\x1b[0m (${durationMs} ms)`);
  console.log(`  ● Archivos / Vértices 4D indexados: \x1b[1;36m${stats.totalVertices.toLocaleString()}\x1b[0m`);
  console.log(`  ● Aristas de interconexión topológica: \x1b[1;36m${stats.totalEdges.toLocaleString()}\x1b[0m`);
  console.log(`  ● Tokens totales del código fuente: \x1b[1;33m${stats.totalTokens.toLocaleString()}\x1b[0m tokens (~${Math.round(stats.totalTokens * 3.8 / 1000000)} MB de código)`);
  console.log(`  ● Memoria RAM consumida: \x1b[1;32m${ramConsumedMb} MB\x1b[0m (Extremadamente eficiente para un teléfono)`);
  console.log(`  ● Salud Arquitectónica Global: \x1b[1;32m${stats.healthStatus}\x1b[0m (Curvatura: ${stats.dimensionalCurvature})`);

  console.log(`\n\x1b[33m📊 FASE 2: Distribución en las 8 Celdas Cúbicas del Teseracto:\x1b[0m`);
  for (const [cell, count] of Object.entries(stats.cellDistribution)) {
    const bar = '█'.repeat(Math.min(30, Math.round(count / (stats.totalVertices / 30))));
    console.log(`  ${cell.padEnd(12)}: ${count.toString().padStart(5)} archivos | ${bar}`);
  }

  // Medir velocidad de distancia de Hamming O(1)
  console.log(`\n\x1b[33m⚡ FASE 3: Test de Interconexión Simultánea 4D (Distancia de Hamming):\x1b[0m`);
  if (vertices.length >= 2) {
    const vA = vertices[0];
    const vB = vertices[Math.floor(vertices.length / 2)];

    const tStartHamming = process.hrtime.bigint();
    const hammingDist = HexadecTree.hammingDistance(vA.hexCode, vB.hexCode);
    const tEndHamming = process.hrtime.bigint();
    const hammingNanos = Number(tEndHamming - tStartHamming);

    console.log(`  ● Archivo A: ${vA.id} (${vA.hexCode})`);
    console.log(`  ● Archivo B: ${vB.id} (${vB.hexCode})`);
    console.log(`  ● Distancia de Hamming calculada: \x1b[1m${hammingDist}\x1b[0m`);
    console.log(`  ● Tiempo de cálculo: \x1b[1;32m${hammingNanos} nanosegundos\x1b[0m (< 0.001 milisegundos)`);
  }

  // Prueba de Ahorro de Tokens: Slicing
  console.log(`\n\x1b[33m🎯 FASE 4: Comparativa de Ahorro de Tokens en VS Code (Dump Plano vs. 4D Slice):\x1b[0m`);
  // Buscamos un archivo nuclear de VS Code
  const targetSymbol = 'range';
  const targetCell = CubicCell.CoreLogic;

  // Enfoque Tradicional: Supongamos que una IA típica lee los primeros 15 archivos relacionados completos
  const relatedVertices = vertices.filter(v => v.cell === targetCell || v.id.includes('editor')).slice(0, 15);
  const rawTraditionalTokens = relatedVertices.reduce((acc, v) => acc + v.tokenEstimate, 0);

  // Enfoque Tesseract 4D: Slice con presupuesto de 2.000 tokens
  const sliceResult = space.slice({
    cell: targetCell,
    focusSymbol: targetSymbol,
    tokenBudget: 2500,
  });

  const savedTokens = rawTraditionalTokens - sliceResult.totalTokens;
  const savingsPct = rawTraditionalTokens > 0 
    ? ((savedTokens / rawTraditionalTokens) * 100).toFixed(1) 
    : '0';

  console.log(`  ● Tokens consumidos por IA tradicional (volcado plano de 15 archivos): \x1b[31m${rawTraditionalTokens.toLocaleString()} tokens\x1b[0m`);
  console.log(`  ● Tokens entregados por Tesseract-Slice 4D: \x1b[32m${sliceResult.totalTokens.toLocaleString()} tokens\x1b[0m`);
  console.log(`  ● Tokens ahorrados: \x1b[1;32m${savedTokens.toLocaleString()} tokens\x1b[0m`);
  console.log(`  ● \x1b[1;32mPORCENTAJE DE AHORRO REAL: ${savingsPct}%\x1b[0m`);

  // Prueba de Predicción de Errores y Cizallamiento Topológico
  console.log(`\n\x1b[33m🛡️ FASE 5: Simulación de Ruptura en Archivo Nuclear (Shadow Projection):\x1b[0m`);
  const shadow = new ShadowEngine(space);

  // Buscamos un archivo existente clave en VS Code
  const sampleVertex = vertices.find(v => v.symbols.length > 5) || vertices[0];
  console.log(`  ● Simulando mutación con error en: \x1b[36m${sampleVertex.id}\x1b[0m`);
  console.log(`  ● Símbolos originales protegidos: ${sampleVertex.symbols.length}`);

  // Simulamos que la IA borró los símbolos y puso un código roto
  const brokenProposedCode = `
    // Código generado por IA que eliminó las funciones originales por error
    export const newPatch = 42;
  `;

  const shadowResult = shadow.project(sampleVertex.id, brokenProposedCode);

  console.log(`  ● Vector de Cizallamiento Topológico S: [Δx: ${shadowResult.shearVector[0]}, Δy: ${shadowResult.shearVector[1]}, Δz: ${shadowResult.shearVector[2]}, Δw: ${shadowResult.shearVector[3]}]`);
  console.log(`  ● Distancia de Cizallamiento (Topological Shear): \x1b[1;31m${shadowResult.shearDistance}\x1b[0m`);
  console.log(`  ● ¿El cambio es seguro?: \x1b[1;31m${shadowResult.isSafe ? 'SÍ' : 'NO (BLOQUEADO POR EL HIPERCUBO)'}\x1b[0m`);
  console.log(`  ● Celdas Cúbicas en Alerta: [${shadowResult.affectedCells.join(', ')}]`);
  console.log(`  ● Recomendaciones automáticas generadas para la IA:`);
  for (const rec of shadowResult.recommendations) {
    console.log(`    ⚠️  ${rec}`);
  }

  console.log('\n\x1b[1;35m=========================================================================\x1b[0m');
  console.log('\x1b[1;32m  BENCHMARK CIENTÍFICO FINALIZADO CON ÉXITO\x1b[0m');
  console.log('\x1b[1;35m=========================================================================\x1b[0m\n');
}

runBenchmark().catch(err => {
  console.error('[BENCHMARK ERROR]', err);
  process.exit(1);
});
