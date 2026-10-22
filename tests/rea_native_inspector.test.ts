import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractNativeBoundaryInspector } from '../src/rea/nativeInspector.ts';

test('OcteractNativeBoundaryInspector: inspects synthetic ELF buffer with N-API symbols', () => {
  // Construct a synthetic ELF 64-bit header
  const buf = Buffer.alloc(512);
  // ELF magic: 0x7F 'E' 'L' 'F'
  buf[0] = 0x7f;
  buf[1] = 0x45;
  buf[2] = 0x4c;
  buf[3] = 0x46;
  // e_machine: EM_X86_64 = 62 (offset 18)
  buf.writeUInt16LE(62, 18);

  // Write N-API strings into buffer
  buf.write('node_api_module_get_initializer\0', 64, 'ascii');
  buf.write('napi_register_module_v1\0', 128, 'ascii');
  buf.write('openDatabaseSync\0', 180, 'ascii');
  buf.write('executeQueryAsync\0', 220, 'ascii');
  buf.write('__stack_chk_fail\0', 260, 'ascii');
  buf.write('GNU_RELRO\0', 300, 'ascii');

  const report = OcteractNativeBoundaryInspector.inspectBuffer(buf, 'sqlite_native.node');

  assert.equal(report.format, 'ELF');
  assert.equal(report.architecture, 'x86_64');
  assert.equal(report.isNapiAddon, true);
  assert.ok(report.entryPoint);
  assert.ok(report.exportedMethods.includes('openDatabaseSync'));
  assert.ok(report.exportedMethods.includes('executeQueryAsync'));
  assert.equal(report.staticMitigations.stackCanaryFound, true);
  assert.equal(report.staticMitigations.relroIndicated, true);
  assert.equal(report.projectedCell, 'Storage');
});

test('OcteractNativeBoundaryInspector: handles raw or non-ELF binary gracefully', () => {
  const dummy = Buffer.from('Just random text without ELF or PE header');
  const report = OcteractNativeBoundaryInspector.inspectBuffer(dummy, 'unknown.bin');

  assert.equal(report.format, 'RAW_BINARY');
  assert.equal(report.isNapiAddon, false);
});
