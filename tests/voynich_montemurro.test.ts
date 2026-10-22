import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractMontemurroEngine } from '../src/voynich/montemurro.ts';

test('OcteractMontemurroEngine: computes mutual information and filters uniform noise', () => {
  const engine = new OcteractMontemurroEngine();

  // Módulos sintéticos simulando diferentes secciones temáticas
  const corpus = [
    {
      id: 'src/security/auth.ts',
      content: 'export function authenticate(token: string) { return verifyToken(token); }',
    },
    {
      id: 'src/security/cipher.ts',
      content: 'export function encrypt(payload: string) { return cipher(payload); }',
    },
    {
      id: 'src/storage/db.ts',
      content: 'export function queryDatabase(sql: string) { return connection.query(sql); }',
    },
    {
      id: 'src/storage/cache.ts',
      content: 'export function setCache(key: string, value: string) { return redis.set(key, value); }',
    },
  ];

  const analysis = engine.analyzeCorpus(corpus);

  assert.ok(analysis.totalTokensAnalyzed > 0, 'Debe analizar tokens');
  assert.ok(analysis.keywords.length > 0, 'Debe extraer keywords informativas');

  // 'token' y 'authenticate' deben tener alta información mutua (concentrados en security)
  const authKw = analysis.keywords.find(k => k.word === 'token' || k.word === 'authenticate');
  assert.ok(authKw, 'Debe detectar token o authenticate como keyword');
  assert.ok(authKw && authKw.mutualInformation > 0.5, 'Información mutua de keyword temática debe ser alta');

  // 'return' y 'string' deben tener menor información mutua relativa (dispersos en todos los módulos)
  const returnKw = analysis.keywords.find(k => k.word === 'return' || k.word === 'string');
  if (returnKw && authKw) {
    assert.ok(authKw.mutualInformation >= returnKw.mutualInformation, 'Keywords temáticas deben superar a palabras de control');
  }
});

test('OcteractMontemurroEngine: clusters modules into unsupervised semantic topics', () => {
  const engine = new OcteractMontemurroEngine();

  const corpus = [
    { id: 'auth.ts', content: 'jwt auth verify token user credential' },
    { id: 'session.ts', content: 'cookie session login user auth logout' },
    { id: 'sql.ts', content: 'postgres query table database column schema' },
    { id: 'migration.ts', content: 'database migration alter table postgres index' },
  ];

  const clusters = engine.extractSemanticClusters(corpus, 2);

  assert.equal(clusters.length, 2, 'Debe identificar exactamente 2 tópicos/clústeres (Seguridad y Base de Datos)');
  const clusterA = clusters.find(c => c.files.includes('auth.ts'));
  const clusterB = clusters.find(c => c.files.includes('sql.ts'));

  assert.ok(clusterA, 'Clúster A debe existir');
  assert.ok(clusterB, 'Clúster B debe existir');
  assert.ok(clusterA?.files.includes('session.ts'), 'auth.ts y session.ts deben agruparse juntos');
  assert.ok(clusterB?.files.includes('migration.ts'), 'sql.ts y migration.ts deben agruparse juntos');
});
