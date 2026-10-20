# GPU Hybrid Acceleration & Binary Indexing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Dynamic Hardware Abstraction Layer (HAL) for GPU Compute Shaders / CPU multithreaded fallback, the high-performance CSR binary index format (`index.bin`), incremental git caching, and deep 4-pillar type signature diagnostics for Tesseract v2.1.0.

**Architecture:** A unified `HardwareAccelerator` detects WebGPU (`globalThis.navigator?.gpu`) and dispatches WGSL compute shaders in VRAM, falling back transparently to CPU `Float32Array` CSR vectorization. Graph persistence is upgraded from 298MB JSON to ~14MB compact binary (`index.bin`) loaded in < 80ms, paired with git-aware incremental caching and deep AST type-signature diffing.

**Tech Stack:** Node.js (>=20.0.0), TypeScript (native experimental strip-types), WebGPU (WGSL compute pipelines), TypedArrays (`Float32Array`, `Uint32Array`), Node.js `worker_threads`, Node.js `node:fs` and `node:path`. Zero runtime npm dependencies.

**Spec:** `docs/superpowers/specs/2026-10-20-gpu-hybrid-acceleration-and-binary-indexing-design.md`

## Global Constraints

- Zero external runtime npm dependencies: all hardware detection, binary packing, and worker pools use Node.js built-ins.
- Zero-token local deterministic execution: all graph, type-diff, and diagnostic operations consume 0 LLM tokens.
- 100% backward compatibility: existing `index.json` files must load seamlessly if `index.bin` is absent.
- 100% test pass rate across the entire test suite.
- Topologic self-audit health must maintain 100/100 (`PERFECT_SYMMETRY`).

## Review Focus

1. Headless environment without WebGPU: `WebGPUComputeBackend` must catch missing adapter gracefully and return `CpuMultithreadBackend` without throwing unhandled exceptions.
2. Truncated or corrupted `index.bin`: Must detect invalid magic bytes (`TESS`) or incomplete length and trigger automatic clean re-indexing.
3. Empty or single-node codebases: Parallel chunking and binary CSR serialization must handle 0 and 1 vertices without dividing by zero.
4. Git detached HEAD or uninitialized repo: `IncrementalCache` must fall back to file `mtime` and `size` if `git` is unavailable.
5. Large multi-hop call graphs: Critical Backbone traversal must avoid infinite cycles on cyclic graphs using a visited set.

---

### Task 1: Hardware Abstraction Layer (HAL) Core & Fallback Engine

**Files:**
- Create: `src/core/accelerator.ts`
- Test: `tests/accelerator.test.ts`

**Interfaces:**
- Produces: `HardwareAccelerator`, `WebGPUComputeBackend`, `CpuMultithreadBackend`, `getHardwareAccelerator(): HardwareAccelerator`

- [ ] **Step 1: Write the failing test**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { getHardwareAccelerator, CpuMultithreadBackend } from '../src/core/accelerator.ts';

test('HardwareAccelerator: Detects backend and computes PageRank on CPU', async () => {
  const hal = getHardwareAccelerator();
  assert.ok(['webgpu', 'cpu_multithread'].includes(hal.getBackendType()));

  // Grafo lineal 3 nodos: 0 -> 1 -> 2
  const offsets = new Uint32Array([0, 1, 2, 2]);
  const indices = new Uint32Array([1, 2]);
  const ranks = await hal.computePageRank(offsets, indices, 3, 20, 0.85);

  assert.equal(ranks.length, 3);
  assert.ok(ranks[2] > ranks[0], 'El nodo 2 debe tener mayor PageRank que el nodo 0');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/accelerator.test.ts`  
Expected: FAIL with module not found `../src/core/accelerator.ts`.

- [ ] **Step 3: Implement `HardwareAccelerator` in `src/core/accelerator.ts`**

Implement `HardwareAccelerator` interface, `WebGPUComputeBackend`, `CpuMultithreadBackend` using CSR matrix multiplication and power iteration, and export `getHardwareAccelerator()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/accelerator.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/accelerator.ts tests/accelerator.test.ts
git commit -m "feat(hal): implement HardwareAccelerator with WebGPU and CPU fallback"
```

---

### Task 2: Compressed Sparse Row (CSR) Binary Index Serializer

**Files:**
- Create: `src/core/binary.ts`
- Modify: `src/core/indexer.ts`
- Test: `tests/binary.test.ts`

**Interfaces:**
- Consumes: `HypercubeSpace`, `HyperVertex` from `src/core/hypercube.ts` and `src/core/types.ts`
- Produces: `BinarySerializer.serialize(space: HypercubeSpace): Buffer`, `BinarySerializer.deserialize(buffer: Buffer): HypercubeSpace`

- [ ] **Step 1: Write the failing test**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { BinarySerializer } from '../src/core/binary.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell } from '../src/core/types.ts';

test('BinarySerializer: Serializa y deserializa hipercubo con cabecera TESS y CSR', () => {
  const space = new HypercubeSpace();
  space.addVertex({
    id: 'src/a.ts',
    path: '/repo/src/a.ts',
    cell: CubicCell.CoreLogic,
    coordinates: [0.1, 0.2, 0.3, 0.4],
    lines: 100,
    symbols: [{ name: 'fnA', kind: 'function', line: 10, isExported: true }],
    dependencies: ['src/b.ts'],
    inDegree: 0,
    outDegree: 1,
    pageRank: 0.5,
  });

  const buffer = BinarySerializer.serialize(space);
  assert.ok(buffer.length > 0);
  assert.equal(buffer.toString('utf8', 0, 4), 'TESS');

  const restored = BinarySerializer.deserialize(buffer);
  const vertices = restored.getVertices();
  assert.equal(vertices.length, 1);
  assert.equal(vertices[0].id, 'src/a.ts');
  assert.deepEqual(vertices[0].coordinates, [0.1, 0.2, 0.3, 0.4]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/binary.test.ts`  
Expected: FAIL with module not found `../src/core/binary.ts`.

- [ ] **Step 3: Implement `BinarySerializer` in `src/core/binary.ts` and update `ProjectIndexer`**

Implement `serialize` and `deserialize` with magic header `TESS\x02\x01`, 4D float coordinates, compact symbols, and CSR offset/index tables. Update `ProjectIndexer.saveIndex` to write `index.bin` alongside `index.json`, and `loadIndex` to preferentially load `index.bin`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/binary.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/binary.ts src/core/indexer.ts tests/binary.test.ts
git commit -m "feat(binary): implement CSR binary serialization for sub-100ms index loading"
```

---

### Task 3: Parallel Multi-Threaded Ingestion & Incremental Git Cache

**Files:**
- Create: `src/core/cache.ts`
- Modify: `src/core/indexer.ts`
- Test: `tests/incremental.test.ts`

**Interfaces:**
- Produces: `IncrementalCache.isModified(filePath, stat): boolean`, `IncrementalCache.save(cachePath): void`

- [ ] **Step 1: Write the failing test**

```typescript
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
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/incremental.test.ts`  
Expected: FAIL with module not found `../src/core/cache.ts`.

- [ ] **Step 3: Implement `IncrementalCache` in `src/core/cache.ts` and integrate into `ProjectIndexer`**

Implement `IncrementalCache` with `mtimeMs`, `size`, and file content hashing, saving to `.tesseract/cache.json`. Update `ProjectIndexer.indexDirectory` to skip untouched files and reuse existing `HyperVertex` coordinates.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/incremental.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/cache.ts src/core/indexer.ts tests/incremental.test.ts
git commit -m "feat(cache): implement incremental mtime caching for sub-25ms index updates"
```

---

### Task 4: Deep 4-Pillar Universal Diagnostic (Type Diff & Critical Backbone)

**Files:**
- Create: `src/core/diagnostic.ts`
- Modify: `src/core/auditor.ts`
- Modify: `src/cli/commands.ts`
- Test: `tests/diagnostic.test.ts`

**Interfaces:**
- Consumes: `HypercubeSpace`, `AuditReport`
- Produces: `DeepContractDiagnostic.diffSignatures(calleeCode: string, callerCode: string): SignatureDiff`, `DeepContractDiagnostic.traceCriticalBackbone(epicenter: string, space: HypercubeSpace): string[]`

- [ ] **Step 1: Write the failing test**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepContractDiagnostic } from '../src/core/diagnostic.ts';

test('DeepContractDiagnostic: Extrae discrepancias de tipos en contratos rotos', () => {
  const callee = 'export function login(user: string, token: string): Promise<boolean> { return Promise.resolve(true); }';
  const caller = 'login("alice");';

  const diff = DeepContractDiagnostic.diffSignatures(callee, caller);
  assert.ok(diff.missingArgs.includes('token'), 'Debe detectar argumento token faltante');
  assert.equal(diff.expectedParamCount, 2);
  assert.equal(diff.actualParamCount, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/diagnostic.test.ts`  
Expected: FAIL with module not found `../src/core/diagnostic.ts`.

- [ ] **Step 3: Implement `DeepContractDiagnostic` in `src/core/diagnostic.ts` and integrate in `TopologicalAuditor`**

Implement AST signature parser for TypeScript/JavaScript/Python extracting parameter names, count, types, and return types. Implement `traceCriticalBackbone` using BFS to find the shortest causal chain to a terminal sink (`outDegree = 0`). Wire into `TopologicalAuditor.audit` and `tesseract_diagnose_fracture`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/diagnostic.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/diagnostic.ts src/core/auditor.ts tests/diagnostic.test.ts
git commit -m "feat(diagnostic): implement deep type signature diffing and critical backbone tracing"
```

---

### Task 5: End-to-End Regression Suite, Dogfooding Audit & Integration

**Files:**
- Modify: `package.json` (bump to `2.1.0`)
- Modify: `README.md`
- Modify: `src/index.ts` (export new modules)

- [ ] **Step 1: Run full unit test suite**

Run: `node --test --experimental-strip-types tests/*.test.ts`  
Expected: All tests pass (60+ tests passing, 0 failures).

- [ ] **Step 2: Run Tesseract self-audit (Dogfooding)**

Run: `node --experimental-strip-types src/index.ts audit .`  
Expected: 100/100 (`PERFECT_SYMMETRY`), 0 fracturas.

- [ ] **Step 3: Run Differential 4D Shear Analysis**

Run: `node --experimental-strip-types src/index.ts diff . HEAD`  
Expected: `SAFE_TO_COMMIT`, $D_{\text{shear}} \le 0.75$.

- [ ] **Step 4: Bump version to 2.1.0 in `package.json` and update `README.md`**

Update badges, CLI reference table, and v2.1.0 acceleration section.

- [ ] **Step 5: Commit & Git Push**

```bash
git add .
git commit -m "feat(v2.1.0): GPU Hybrid Accelerator, CSR Binary Index, and Deep 4-Pillar Diagnostics"
git push origin main
```
