import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { OcteractEvidenceLedger } from '../src/rea/evidenceLedger.ts';

test('OcteractEvidenceLedger: records immutable evidence with deterministic hash', () => {
  const ledger = OcteractEvidenceLedger.getInstance();
  ledger.clear();

  const record = ledger.recordEvidence({
    target: '/src/core',
    coverage: 'complete',
    data: { files: 10, lines: 500 },
    views: {
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    },
  });

  assert.ok(record.evidence_id);
  assert.equal(record.evidence_id.length, 64); // SHA-256
  assert.equal(record.coverage, 'complete');
  assert.equal(record.views.modules.length, 3);
});

test('OcteractEvidenceLedger: returns direct output when below buffer threshold', () => {
  const ledger = OcteractEvidenceLedger.getInstance();
  const smallData = { message: 'hello world', count: 1 };

  const envelope = ledger.boundOutput(
    {
      target: 'small_test',
      data: smallData,
      summary: { status: 'ok' },
    },
    1024 * 1024 // 1MB threshold
  );

  assert.equal(envelope.retained, false);
  assert.deepEqual(envelope.data, smallData);
  assert.ok(envelope.evidence_id);
});

test('OcteractEvidenceLedger: retains large payloads and protects stdio buffer', () => {
  const ledger = OcteractEvidenceLedger.getInstance();
  const largeArray = Array.from({ length: 500 }, (_, i) => ({ id: i, payload: 'x'.repeat(200) }));

  const envelope = ledger.boundOutput(
    {
      target: 'large_test',
      data: largeArray,
      summary: { totalItems: 500 },
      views: {
        items: largeArray,
      },
    },
    5000 // Small 5KB threshold to trigger retention
  );

  assert.equal(envelope.retained, true);
  assert.equal(envelope.data, undefined); // payload omitted to prevent buffer crash
  assert.ok(envelope.continuation_token);
  assert.ok(envelope.total_bytes > 5000);
});

test('OcteractEvidenceLedger: paginates through retained views cleanly', () => {
  const ledger = OcteractEvidenceLedger.getInstance();
  const items = Array.from({ length: 30 }, (_, i) => ({ itemIndex: i }));

  const record = ledger.recordEvidence({
    target: 'paginated_test',
    data: items,
    views: {
      items,
    },
  });

  // Page 1 (limit 10)
  const page1 = ledger.inspectView(record.evidence_id, 'items', 1, 10);
  assert.equal(page1.page, 1);
  assert.equal(page1.pageSize, 10);
  assert.equal(page1.totalItems, 30);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.hasMore, true);
  assert.equal(page1.items.length, 10);
  assert.equal(page1.items[0].itemIndex, 0);

  // Page 3 (final)
  const page3 = ledger.inspectView(record.evidence_id, 'items', 3, 10);
  assert.equal(page3.page, 3);
  assert.equal(page3.hasMore, false);
  assert.equal(page3.items[9].itemIndex, 29);
});

test('OcteractEvidenceLedger: exports evidence bundle atomically to disk', () => {
  const ledger = OcteractEvidenceLedger.getInstance();
  const record = ledger.recordEvidence({
    target: 'export_test',
    data: { key: 'secret_state' },
  });

  const exportPath = path.resolve('.tesseract/test_evidence_bundle.json');
  const result = ledger.exportBundle(record.evidence_id, exportPath);

  assert.equal(result.success, true);
  assert.ok(fs.existsSync(exportPath));
  const readBack = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  assert.equal(readBack.evidence_id, record.evidence_id);

  // Clean up
  fs.unlinkSync(exportPath);
});
