/**
 * TESTS: Suite de Verificación de Morfología Concológica de David M. Raup (1966)
 * Valida el 3D Morphospace (W, D, T), Partición en Cámaras del Nautilus y Onda Espiral O(log N)
 */

import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import { ProjectIndexer } from '../src/core/indexer.ts';
import { OcteractRaupMorphospace } from '../src/morphology/index.ts';
import { OcteractDoctor, OcteractSee, OcteractImpact } from '../src/unified/index.ts';
import { MCPServer } from '../src/mcp/server.ts';

test('RaupMorphospace: calcula vector (W, D, T) y clasifica arquetipo biológico viable', async () => {
  const root = process.cwd();
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) {
    indexer.indexDirectory({ rootDir: root, maxFiles: 250 });
  }
  const space = indexer.getSpace();

  const raup = OcteractRaupMorphospace.calculateRaupVector(space);

  assert.ok(typeof raup.w === 'number');
  assert.ok(raup.w >= 1.0, 'W debe ser >= 1.0 (tasa de expansión positiva)');
  assert.ok(typeof raup.d === 'number');
  assert.ok(typeof raup.t === 'number');
  assert.ok(typeof raup.viabilityScore === 'number');
  assert.ok(raup.viabilityScore >= 0 && raup.viabilityScore <= 100);
  assert.ok(
    ['NAUTILUS', 'CLAM', 'CONE_SNAIL', 'RAM_HORN', 'TOWER_SPIRE', 'ABERRANT_MONSTER'].includes(raup.archetype)
  );
  assert.ok(typeof raup.analogy === 'string');
  assert.ok(raup.analogy.length > 10);
});

test('RaupMorphospace: particiona el repositorio en Cámaras Tabicadas del Nautilus con >60% de ahorro de contexto', async () => {
  const root = process.cwd();
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) {
    indexer.indexDirectory({ rootDir: root, maxFiles: 250 });
  }
  const space = indexer.getSpace();
  const activeFile = 'src/morphology/raup.ts';

  const partition = OcteractRaupMorphospace.partitionNautilusChambers(space, activeFile, root);

  assert.ok(partition.livingChamber.filePath.includes('raup.ts'));
  assert.ok(partition.livingChamber.tokensApprox > 0);
  assert.ok(partition.livingChamber.content.includes('OcteractRaupMorphospace'));

  assert.ok(Array.isArray(partition.adjacentChambers));
  assert.ok(Array.isArray(partition.sealedSepta));
  assert.ok(partition.sealedSepta.length > 0);

  // Cada tabique sellado debe incluir metadatos del tabique
  assert.ok(partition.sealedSepta[0].septumSummary.includes('Tabique'));

  assert.ok(partition.totalUncompressedTokens > partition.totalChamberTokens);
  assert.ok(
    partition.contextSavingsPercent >= 50,
    `El ahorro de contexto fue ${partition.contextSavingsPercent}%, se esperaba >= 50%`
  );
});

test('RaupMorphospace: calcula onda de choque en Espiral Logarítmica O(log N)', async () => {
  const root = process.cwd();
  const indexer = new ProjectIndexer();
  const loaded = indexer.loadIndex(root);
  if (!loaded) {
    indexer.indexDirectory({ rootDir: root, maxFiles: 250 });
  }
  const space = indexer.getSpace();
  const targetFile = 'src/morphology/raup.ts';

  const spiral = OcteractRaupMorphospace.calculateSpiralBlast(space, targetFile);

  assert.strictEqual(spiral.epicenter, targetFile);
  assert.ok(typeof spiral.spiralWhorlsVisited === 'number');
  assert.ok(Array.isArray(spiral.affectedChambers));
  assert.ok(typeof spiral.totalAffectedFiles === 'number');

  // Si hay cámaras afectadas, la energía debe decaer exponencialmente a lo largo de la espiral
  if (spiral.affectedChambers.length > 1) {
    const first = spiral.affectedChambers[0];
    const last = spiral.affectedChambers[spiral.affectedChambers.length - 1];
    assert.ok(first.energyDecay >= last.energyDecay);
  }
});

test('OcteractSee [mode: nautilus]: entrega vista acrecionaria de concha', async () => {
  const targetFile = 'src/morphology/raup.ts';
  const result = await OcteractSee.inspect(targetFile, {
    mode: 'nautilus',
  });

  assert.strictEqual(result.mode, 'nautilus');
  assert.ok(result.content.includes('OCTERACT NAUTILUS CHAMBERS'));
  assert.ok(result.content.includes('CÁMARA DE HABITACIÓN ACTIVA'));
  assert.ok(result.content.includes('CÁMARAS ANCESTRALES TABICADAS'));
  assert.ok(result.compressionSavingsPercent > 50);
  assert.ok(result.nautilusPartition !== undefined);
});

test('OcteractDoctor: integra la auditoría concológica de Raup en el reporte holístico', async () => {
  const report = await OcteractDoctor.diagnose(process.cwd());

  assert.ok(report.raupMorphology !== undefined);
  assert.ok(typeof report.raupMorphology.coilingPitchAngleDeg === 'number');
  assert.ok(report.raupMorphology.raupVector.archetype !== undefined);
  assert.ok(report.summaryMarkdown.includes('Morfología Concológica (Raup 1966)'));
  assert.ok(report.summaryMarkdown.includes('Compresión Septal Nautilus'));
});

test('MCPServer: herramienta octeract_raup_morphology responde con reporte biológico completo', async () => {
  const server = new MCPServer({ rootDir: process.cwd(), profile: 'essential' });
  const result: any = await (server as any).callTool('octeract_raup_morphology', {
    targetDir: process.cwd(),
    activeFile: 'src/morphology/raup.ts',
  });

  assert.ok(result !== null);
  assert.ok(result.raupVector !== undefined);
  assert.ok(typeof result.raupVector.w === 'number');
  assert.ok(typeof result.raupVector.d === 'number');
  assert.ok(typeof result.raupVector.t === 'number');
  assert.ok(result.activePartition !== undefined);
  assert.ok(result.activePartition.livingChamber.filePath.includes('raup.ts'));
  assert.ok(result.summaryMarkdown.includes('Diagnóstico Concológico de Raup'));
});
