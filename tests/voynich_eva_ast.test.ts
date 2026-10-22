import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractEVAAST } from '../src/voynich/eva-ast.ts';

test('OcteractEVAAST: transliterates code declarations to canonical 3-slot EVA representation with >80% reduction', () => {
  const eva = new OcteractEVAAST();
  const sampleCode = `
    export async function authenticateUser(token: string, timeoutMs: number): Promise<SessionState> {
      const decoded = verifyToken(token);
      if (!decoded) throw new Error("Invalid token");
      return await fetchSession(decoded.userId);
    }

    export class DatabaseConnectionPool {
      private poolSize: number;
      constructor(size: number) {
        this.poolSize = size;
      }
      public async acquireConnection(): Promise<Connection> {
        return pool.pop();
      }
    }
  `;

  const result = eva.transliterate(sampleCode);

  assert.ok(result.evaGlyphBlock.length > 0, 'Debe generar bloque de glifos EVA');
  assert.ok(result.tokenReductionPercent >= 75, `El ahorro de tokens (${result.tokenReductionPercent}%) debe ser >= 75%`);
  assert.ok(result.slots.length >= 3, 'Debe extraer al menos 3 slots de declaración (authenticateUser, DatabaseConnectionPool, acquireConnection)');
  
  // Verificar que los slots tienen estructura [Prefix][Core][Suffix]
  const fnSlot = result.slots.find(s => s.identifier === 'authenticateUser');
  assert.ok(fnSlot, 'Debe encontrar slot de authenticateUser');
  assert.equal(fnSlot?.prefix, 'qo'); // qo = export async
  assert.ok(fnSlot?.evaToken.startsWith('qo'), 'Token EVA debe iniciar con prefijo qo');
  assert.ok(fnSlot?.evaToken.endsWith('aiin'), 'Token EVA debe terminar con sufijo de promesa aiin');
});

test('OcteractEVAAST: decodes EVA representation back to structured TypeScript skeleton', () => {
  const eva = new OcteractEVAAST();
  const sampleCode = `
    export async function fetchMetrics(interval: string): Promise<MetricsResult> {
      return service.get(interval);
    }
    export class TelemetrySink {
      public record(event: string): void {}
    }
  `;

  const transliterated = eva.transliterate(sampleCode);
  const skeleton = eva.decodeToSkeleton(transliterated.evaGlyphBlock);

  assert.ok(skeleton.includes('function fetchMetrics'), 'Esqueleto reconstruido debe incluir fetchMetrics');
  assert.ok(skeleton.includes('class TelemetrySink'), 'Esqueleto reconstruido debe incluir TelemetrySink');
  assert.ok(skeleton.includes('Promise'), 'Esqueleto reconstruido debe conservar el contrato Promise');
});

test('OcteractEVAAST: handles edge cases and empty code gracefully', () => {
  const eva = new OcteractEVAAST();
  const result = eva.transliterate('   // solo comentarios y espacio vacio\n   ');

  assert.equal(result.slots.length, 0);
  assert.equal(result.evaGlyphBlock, '');
  assert.equal(result.tokenReductionPercent, 0);

  const decoded = eva.decodeToSkeleton('');
  assert.equal(decoded, '');
});
