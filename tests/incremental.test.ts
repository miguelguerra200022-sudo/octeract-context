import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { IncrementalCache } from '../src/core/cache.ts';

test('IncrementalCache: Detecta archivos inalterados y evita re-parseo', () => {
  const tmpDir = path.join(process.cwd(), 'tests', 'temp_cache_test');
  fs.mkdirSync(tmpDir, { recursive: true });
  const testFile = path.join(tmpDir, 'sample.ts');
  fs.writeFileSync(testFile, 'export const x = 1;');

  const cache = new IncrementalCache(tmpDir);
  assert.ok(cache.isModified(testFile), 'Debe reportar modificado si no estaba en caché');
  
  cache.record(testFile);
  assert.equal(cache.isModified(testFile), false, 'Debe reportar no modificado tras grabarlo');

  // Modificar el archivo altera su mtime
  const futureTime = new Date(Date.now() + 2000);
  fs.utimesSync(testFile, futureTime, futureTime);
  assert.ok(cache.isModified(testFile), 'Debe detectar modificación por mtime alterado');

  cache.save();
  assert.ok(fs.existsSync(path.join(tmpDir, '.tesseract', 'cache.json')));

  // Restaurar caché desde disco
  const reloadedCache = new IncrementalCache(tmpDir);
  reloadedCache.load();
  reloadedCache.record(testFile);
  assert.equal(reloadedCache.isModified(testFile), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
