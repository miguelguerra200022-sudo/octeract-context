import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractFacetMatrix } from '../src/rea/facetMatrix.ts';

test('OcteractFacetMatrix: evaluates single vertex facet vector accurately', () => {
  const code = `
    export interface UserProfile {
      id: string;
      role: string;
    }
    export class UserService {
      public getUser(id: string): UserProfile {
        if (!id) return null;
        return this.fetchFromDb(id);
      }
    }
  `;

  const dossier = OcteractFacetMatrix.evaluateVertex({
    vertexId: 'src/services/user.ts',
    name: 'UserService',
    cell: 'CoreLogic',
    codeSnippet: code,
    callersCount: 3,
    voxelCoord: { x: 10, y: 64, z: 20 },
    evaWord: 'qokedy',
  });

  assert.equal(dossier.facets.types, true);
  assert.equal(dossier.facets.ast, true);
  assert.equal(dossier.facets.cfg, true);
  assert.equal(dossier.facets.callers, true);
  assert.equal(dossier.facets.callees, true);
  assert.equal(dossier.facets.voxels, true);
  assert.equal(dossier.facets.eva_phonetics, true);
  assert.equal(dossier.facets.native_bindings, false); // TypeScript file, not native
  assert.ok(dossier.completenessPercentage >= 75);
  assert.ok(dossier.evidenceSignature.startsWith('0b'));
});

test('OcteractFacetMatrix: generates global matrix report and identifies blindspots', () => {
  const dossiers = [
    OcteractFacetMatrix.evaluateVertex({
      vertexId: 'file1.ts',
      name: 'FullModel',
      cell: 'CoreLogic',
      codeSnippet: 'interface I { x: number } class C { m() { if (1) return; } }',
      callersCount: 2,
    }),
    OcteractFacetMatrix.evaluateVertex({
      vertexId: 'stub.js',
      name: 'EmptyStub',
      cell: 'Config',
      codeSnippet: '', // Empty, no types, no ast, no cfg
    }),
  ];

  const report = OcteractFacetMatrix.generateMatrixReport(dossiers);

  assert.equal(report.totalVertices, 2);
  assert.ok(report.averageCompleteness > 0);
  assert.ok(report.blindspots.some((b) => b.vertexId === 'stub.js'));
});
