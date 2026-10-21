# Octeract v4.2 Supreme Frontier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 4 frontier pillars for Octeract v4.2: Program Slicing (Weiser's Algorithm), Autonomous Test Reproducer Synthesizer, Speculative AST Patcher, and Monte Carlo Tree Search (MCTS) Refactoring Engine in ephemeral RAM, with full CLI, MCP and Orchestrator integration.

**Architecture:** Octeract's System 2 mathematical core is augmented with AST data-flow program slicing, automated RED-to-GREEN reproduction harnesses, structural AST diff grafting, and UCT-guided MCTS tree search in ephemeral RAM sandboxes. Each component executes at 0 LLM tokens and connects directly to the Supreme Agent Orchestrator.

**Tech Stack:** TypeScript (ESM, Node.js >= 20 native with `--experimental-strip-types`), Node `node:test`, AST regex & token stream visitor, JSON-RPC 2.0 MCP.

**Spec:** Autonomous expansion encompassing the 4 pillars researched: Semantic Program Slicing, Autonomous Bug Reproducer, Speculative AST Patcher, and MCTS Test-Time Compute Engine.

## Global Constraints

- Zero external runtime npm dependencies; use pure native Node.js and TypeScript.
- Strict backward compatibility for all existing MCP tools, CLI commands, and `tesseract_*` aliases.
- 100% test pass rate across all suites with zero regression.
- 100/100 repository health score with 0 fractures in the 8D hypercube.
- Node.js native execution using `--experimental-strip-types`.

## Review Focus

1. AST Program Slicer handling nested control blocks (loops, ifs, closures) without infinite loops.
2. Reproducer generator synthesizing runnable ESM code with valid import paths.
3. Speculative patcher preserving comments, formatting, and non-target lines verbatim.
4. MCTS engine bounding search depth and iterations to prevent runaway execution in RAM (< 50 ms).
5. Version synchronization across `package.json`, `src/index.ts`, and `src/mcp/server.ts` to prevent `RELEASE_SYNC_FRACTURE`.

---

### Task 1: Semantic Program Slicer (`OcteractProgramSlicer`)

**Files:**
- Create: `src/core/slicer.ts`
- Test: `tests/slicer.test.ts`

**Interfaces:**
- Consumes: AST parsing from `src/parsers/ts-parser.ts`, `src/core/types.ts`
- Produces: `OcteractProgramSlicer` with `computeSlice(code: string, criterion: SlicingCriterion): ProgramSliceResult`

- [ ] **Step 1: Write the failing test**

```typescript
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractProgramSlicer } from '../src/core/slicer.ts';

describe('OcteractProgramSlicer', () => {
  test('computes backward slice isolating only statements that affect target variable', () => {
    const code = `
function calculateMetrics(a: number, b: number) {
  let unused1 = 100;
  let x = a + 1;
  let unused2 = unused1 * 2;
  let result = x * b;
  console.log("debug", unused2);
  return result;
}
    `.trim();

    const slicer = new OcteractProgramSlicer();
    const slice = slicer.computeSlice(code, { targetVariable: 'result', direction: 'backward' });

    assert.ok(slice.slicedCode.includes('let x = a + 1;'));
    assert.ok(slice.slicedCode.includes('let result = x * b;'));
    assert.ok(!slice.slicedCode.includes('unused1'));
    assert.ok(!slice.slicedCode.includes('unused2'));
    assert.ok(slice.tokenReductionPercent > 40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/slicer.test.ts`
Expected: FAIL with "Cannot find module '../src/core/slicer.ts'"

- [ ] **Step 3: Implement `OcteractProgramSlicer` in `src/core/slicer.ts`**

Build AST statement dependency graph tracking variable definitions and usages (def-use chains) and control dependencies to perform backward and forward slicing.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/slicer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/slicer.ts tests/slicer.test.ts
git commit -m "feat(slicer): implement semantic program slicer (Weiser's algorithm)"
```

---

### Task 2: Autonomous Bug Reproducer Synthesizer (`OcteractReproducer`)

**Files:**
- Create: `src/core/reproducer.ts`
- Test: `tests/reproducer.test.ts`

**Interfaces:**
- Consumes: `TopologicalFracture`, `HypercubeSpace` from `src/core/types.ts`
- Produces: `OcteractReproducer` with `synthesizeReproducer(fracture: any): ReproducerScript` and `evaluateReproducer(script: string, rootDir: string): Promise<ReproducerResult>`

- [ ] **Step 1: Write the failing test**

```typescript
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractReproducer } from '../src/core/reproducer.ts';

describe('OcteractReproducer', () => {
  test('synthesizes runnable ESM reproducer script for broken contract', () => {
    const reproducer = new OcteractReproducer();
    const script = reproducer.synthesizeReproducer({
      id: 'CONTRACT_MISMATCH_1',
      sourceFile: 'src/services/auth.ts',
      targetSymbol: 'login',
      expectedSignature: 'login(user: string, pass: string): boolean',
      actualSignature: 'login(user: string): boolean',
      description: 'Missing password parameter in login method',
    });

    assert.ok(script.reproducerCode.includes('import'));
    assert.ok(script.reproducerCode.includes('login'));
    assert.ok(script.reproducerCode.includes('assert'));
    assert.equal(script.expectedOutcome, 'FAIL_INITIALLY_THEN_PASS_AFTER_FIX');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/reproducer.test.ts`
Expected: FAIL with "Cannot find module '../src/core/reproducer.ts'"

- [ ] **Step 3: Implement `OcteractReproducer` in `src/core/reproducer.ts`**

Synthesizes standalone, zero-dependency ESM test scripts that assert contracts, detect discrepancies, and verify RED to GREEN transitions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/reproducer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/reproducer.ts tests/reproducer.test.ts
git commit -m "feat(reproducer): implement autonomous test reproducer synthesizer"
```

---

### Task 3: Speculative AST Patcher (`OcteractSpeculativePatcher`)

**Files:**
- Create: `src/core/patcher.ts`
- Test: `tests/patcher.test.ts`

**Interfaces:**
- Consumes: AST parsing and code analysis from `src/parsers/ts-parser.ts`
- Produces: `OcteractSpeculativePatcher` with `computeAstPatch(originalCode: string, proposedModification: string): SpeculativePatchResult`

- [ ] **Step 1: Write the failing test**

```typescript
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractSpeculativePatcher } from '../src/core/patcher.ts';

describe('OcteractSpeculativePatcher', () => {
  test('replaces targeted AST node cleanly without breaking whitespace or comments', () => {
    const original = `
// Important authentication logic
export class AuthService {
  // Check user credentials
  login(u: string, p: string): boolean {
    return false;
  }

  logout(): void {
    console.log("bye");
  }
}
    `.trim();

    const patcher = new OcteractSpeculativePatcher();
    const result = patcher.graftMethod(original, 'AuthService', 'login', `
  login(u: string, p: string): boolean {
    return u === 'admin' && p === 'secret';
  }
    `.trim());

    assert.ok(result.success);
    assert.ok(result.patchedCode.includes("u === 'admin'"));
    assert.ok(result.patchedCode.includes('// Important authentication logic'));
    assert.ok(result.patchedCode.includes('logout(): void'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/patcher.test.ts`
Expected: FAIL with "Cannot find module '../src/core/patcher.ts'"

- [ ] **Step 3: Implement `OcteractSpeculativePatcher` in `src/core/patcher.ts`**

Analyzes AST method and function boundaries, replaces exact AST node spans, preserves comments, and outputs unified diffs.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/patcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/patcher.ts tests/patcher.test.ts
git commit -m "feat(patcher): implement speculative AST patcher and method grafter"
```

---

### Task 4: Monte Carlo Tree Search (MCTS) Refactoring Engine (`OcteractTreeSearch`)

**Files:**
- Create: `src/core/mcts.ts`
- Test: `tests/mcts.test.ts`

**Interfaces:**
- Consumes: `HypercubeSpace`, `TransactionalHealer`, `ShadowEngine`, `OcteractStepVerifier`
- Produces: `OcteractTreeSearch` with `searchOptimalRefactor(space: HypercubeSpace, goal: RefactorGoal): MCTSResult`

- [ ] **Step 1: Write the failing test**

```typescript
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractTreeSearch } from '../src/core/mcts.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';

describe('OcteractTreeSearch', () => {
  test('explores candidate refactoring tree in RAM and finds highest reward path', async () => {
    const space = new HypercubeSpace();
    const mcts = new OcteractTreeSearch(space);

    const result = await mcts.search({
      targetFile: 'src/core/sample.ts',
      candidatePatches: [
        { id: 'patch_broken', code: 'export function broken() { syntax error }', expectedDelta: -10 },
        { id: 'patch_safe', code: 'export function safe() { return 42; }', expectedDelta: +5 },
      ],
      maxIterations: 10,
    });

    assert.ok(result.bestTrajectory.length > 0);
    assert.equal(result.bestTrajectory[0].patchId, 'patch_safe');
    assert.ok(result.bestTrajectory[0].rewardScore > 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/mcts.test.ts`
Expected: FAIL with "Cannot find module '../src/core/mcts.ts'"

- [ ] **Step 3: Implement `OcteractTreeSearch` in `src/core/mcts.ts`**

Implements MCTS with UCT selection ($UCT = \frac{Q(s, a)}{N(s, a)} + c \sqrt{\frac{\ln N(s)}{N(s, a)}}$), expansion of candidate patch branches in RAM, evaluation via shear & PRM score, and backpropagation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/mcts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/mcts.ts tests/mcts.test.ts
git commit -m "feat(mcts): implement Monte Carlo Tree Search refactoring engine"
```

---

### Task 5: System Integration, CLI, MCP Server & Release v4.2.0

**Files:**
- Modify: `src/core/orchestrator.ts`
- Modify: `src/cli/commands.ts`
- Modify: `src/index.ts`
- Modify: `src/mcp/server.ts`
- Modify: `package.json`
- Modify: `README.md`
- Test: `tests/integration_frontier.test.ts`

**Interfaces:**
- Exposes:
  - CLI: `octeract slice --program`, `octeract reproduce`, `octeract patch-ast`, `octeract mcts`
  - MCP: `octeract_program_slice`, `octeract_synthesize_reproducer`, `octeract_speculative_patch`, `octeract_mcts_refactor`
  - Version: `4.2.0` across all files

- [ ] **Step 1: Write integration tests for new tools**

Write `tests/integration_frontier.test.ts` asserting that CLI and MCP handlers invoke all 4 engines and return validated outputs.

- [ ] **Step 2: Run integration tests to verify they fail**

Run: `node --experimental-strip-types --test tests/integration_frontier.test.ts`
Expected: FAIL

- [ ] **Step 3: Connect engines to Orchestrator, CLI and MCP server**

Wire `OcteractProgramSlicer`, `OcteractReproducer`, `OcteractSpeculativePatcher`, and `OcteractTreeSearch` into `src/core/orchestrator.ts`, `src/cli/commands.ts`, `src/index.ts`, and `src/mcp/server.ts`.

- [ ] **Step 4: Synchronize version to v4.2.0 and update README.md**

Bump version in `package.json`, `src/index.ts`, `src/mcp/server.ts`, update README.md with tables and badges.

- [ ] **Step 5: Full verification**

Run `npm test`, `node --experimental-strip-types src/index.ts audit .`, and `node --experimental-strip-types src/index.ts preflight .`.
Assert 100/100 health score, 0 fractures, and all tests passing.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete v4.2.0 release with 4 frontier pillars"
```
