import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OcteractJigsawSynthesis, type JigsawPiece } from '../src/voxel/jigsaw-synthesis.ts';

describe('OcteractJigsawSynthesis', () => {
  it('connects plug and jack sockets with matching contracts', () => {
    const jigsaw = new OcteractJigsawSynthesis();

    const rootPiece: JigsawPiece = {
      id: 'root-server',
      template: '// Server Root\nimport { {{db_conn}} } from "./db";\nexport function start() { return {{db_conn}}(); }',
      sockets: [
        { name: 'db_conn', type: 'plug', contract: 'IDatabaseConnection', jointType: 'rigid' }
      ]
    };

    const dbPiece: JigsawPiece = {
      id: 'postgres-db',
      template: '// Postgres Implementation\nexport function connectPg() { return "pg_connected"; }',
      sockets: [
        { name: 'db_conn', type: 'jack', contract: 'IDatabaseConnection', jointType: 'rigid' }
      ]
    };

    jigsaw.registerPiece(rootPiece);
    jigsaw.registerPiece(dbPiece);

    const result = jigsaw.assemble('root-server');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.connectedPieces.length, 2);
    assert.strictEqual(result.unmatchedSockets.length, 0);
    assert.ok(result.synthesizedOutput.includes('postgres-db'));
    assert.ok(result.synthesizedOutput.includes('root-server'));
  });

  it('detects unmatched open sockets and warns when contract cannot be satisfied', () => {
    const jigsaw = new OcteractJigsawSynthesis();

    const rootPiece: JigsawPiece = {
      id: 'service',
      template: 'class Service { constructor(private auth: {{auth_provider}}) {} }',
      sockets: [
        { name: 'auth_provider', type: 'plug', contract: 'IOAuth2Provider', jointType: 'rigid' }
      ]
    };

    jigsaw.registerPiece(rootPiece);
    const result = jigsaw.assemble('service');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.unmatchedSockets.length, 1);
    assert.strictEqual(result.unmatchedSockets[0].contract, 'IOAuth2Provider');
  });

  it('handles multi-tier socket assembly and avoids cyclic traps', () => {
    const jigsaw = new OcteractJigsawSynthesis();

    jigsaw.registerPiece({
      id: 'A',
      template: '// Tier A',
      sockets: [{ name: 'needB', type: 'plug', contract: 'InterfaceB', jointType: 'rigid' }]
    });

    jigsaw.registerPiece({
      id: 'B',
      template: '// Tier B',
      sockets: [
        { name: 'needB', type: 'jack', contract: 'InterfaceB', jointType: 'rigid' },
        { name: 'needC', type: 'plug', contract: 'InterfaceC', jointType: 'rigid' }
      ]
    });

    jigsaw.registerPiece({
      id: 'C',
      template: '// Tier C',
      sockets: [{ name: 'needC', type: 'jack', contract: 'InterfaceC', jointType: 'rigid' }]
    });

    const result = jigsaw.assemble('A');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.connectedPieces.length, 3);
    assert.deepStrictEqual(result.connectedPieces, ['A', 'B', 'C']);
  });
});
