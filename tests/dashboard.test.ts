/**
 * TESSERACT-CONTEXT v2.0: Pruebas del Dashboard con Variedad Toroidal y Panal {4,3,3,4}
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { TesseractDashboard } from '../src/ui/dashboard.ts';

test('TesseractDashboard: Genera HTML con selector de variedad topológica (Torus y Honeycomb)', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const dashboard = new TesseractDashboard({ rootDir: root, port: 4444 });

  // Inspeccionar el renderizado HTML
  const html = (dashboard as any).renderHTML();

  assert.ok(html.includes('TESSERACT 4D'));
  assert.ok(html.includes('id="topology-select"'));
  assert.ok(html.includes('4-Toro (T⁴ Geodésica)'));
  assert.ok(html.includes('Panal {4,3,3,4} Monorrepo'));
  assert.ok(html.includes('changeTopology'));
});
