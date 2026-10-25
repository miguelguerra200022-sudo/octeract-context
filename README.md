# 💎 OCTERACT-CONTEXT

<p align="center">
  <img src="assets/banner.jpg" alt="Octeract-Context 8D Banner" width="100%" />
</p>

<p align="center">
  <img src="assets/logo.jpg" alt="Octeract Logo" width="140" height="140" style="border-radius: 50%;" />
</p>

<p align="center">
  <strong>The Autonomous Context Engine & Active Safety Shield for AI Coding Agents</strong><br />
  <em>Stops broken AI edits, eliminates blind greps, and slashes token costs by over 80%.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/octeract-context"><img src="https://img.shields.io/npm/v/octeract-context.svg?style=for-the-badge&color=CB3837&logo=npm" alt="npm version" /></a>
  <a href="https://github.com/miguelguerra200022-sudo/octeract-context/actions"><img src="https://img.shields.io/badge/tests-218%2F218%20passing%20(100%25)-brightgreen.svg?style=for-the-badge" alt="Tests" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg?style=for-the-badge" alt="Node" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Adaptive%20Profiles-purple.svg?style=for-the-badge" alt="MCP" /></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-BSL%201.1-orange.svg?style=for-the-badge" alt="License" /></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/architecture-8D%20Octeract%20Radar-blueviolet.svg?style=for-the-badge" alt="8D Octeract" /></a>
</p>

<p align="center">
  <strong>Instant 1-Command Setup:</strong><br />
  <code>npx octeract-context init</code>
</p>

<p align="center">
  <img src="assets/architecture.jpg" alt="Octeract 8D Architecture Overview" width="100%" />
</p>

---

## ⚡ What is Octeract-Context?

If you have ever used AI coding assistants (like Cursor, Claude Code, Windsurf, Copilot, or Antigravity), you know the most frustrating problem in modern software development: **the AI Hydra Bug Loop**. 

The AI tries to fix a bug or add a new feature, searches your repository with blind, expensive searches, edits a file with lazy shortcuts, and **inadvertently breaks 2 or 3 other parts of your application** without realizing it.

**Octeract-Context completely solves this.**

Think of Octeract as an **Active Safety Shield and High-Definition GPS for your Code**:
1. 🗺️ **Zero-Token Repository Radar:** Instead of burning hundreds of thousands of AI tokens reading files over and over, Octeract instantly maps your entire codebase in memory at **0 AI token cost**.
2. 🛡️ **Active 4D Safety Shield:** When an AI proposes a code change, Octeract tests it in an invisible memory sandbox *before* touching your disk. If the change breaks connections, contains lazy truncation, or introduces errors, **Octeract physically blocks the edit**, keeping your code 100% safe.
3. 👁️ **Origami Token Folding:** Compresses code by **80% to 95%** by keeping public signatures and interfaces visible while folding away private implementation bodies, saving massive money on AI API bills.
4. 💥 **Domino Effect Predictor:** Shows you the exact ripple effect of modifying any function before you touch a single line of code.

---

## 📊 Live Evidence: Before & After Octeract

Here is the exact, unedited proof from testing Octeract live on its own production repository (204 files, 606 symbols):

| Developer Challenge | ❌ Before Octeract (Traditional AI Agent) | ✔️ After Octeract (With Octeract-Context) |
| :--- | :--- | :--- |
| **Locating Broken Code** | AI runs blind `grep` commands, dumping 50,000 to 150,000 raw tokens into context, getting lost in irrelevant files. | **0 AI Tokens Consumed.** `octeract doctor` instantly pinpointed the exact file and line (`facetMatrix.ts:36`) in $< 0.8\text{s}$. |
| **Reading Large Files** | Volcating entire 2,000-line files, saturating the AI context window and causing hallucinations. | **81% to 96% Token Savings.** `octeract see` folded `dragonFold.ts` from ~2,141 tokens down to 413 tokens with full contract precision. |
| **Dangerous AI Edits** | AI inserts `// ... rest of code here`, accidentally erasing hundreds of lines of real code. | **Physically Blocked.** The 4D Shield caught the lazy comment and rejected the write (`BLOCKED_BY_4D_SHIELD`), protecting the file intact. |
| **Safe & Clean Edits** | Uncertain if a new change adheres to project architecture or introduces subtle circular imports. | **Cryptographically Verified.** Octeract tested the clean code across 4 safety axes, verified 0 damage, and wrote it safely (`WRITTEN_SAFELY`). |
| **Cascading Domino Effects**| Developer modifies a core file without knowing what other modules will break downstream. | **Full Ripple Map.** `octeract impact` mapped all 54 affected files and gave the exact safe bottom-up refactoring order. |
| **MCP Server Overhead** | Exposing 150 tools simultaneously burns ~20,860 tokens on every single turn just in schema definitions. | **90% Schema Token Reduction.** Adaptive `essential` profile delivers 14 master tools in only 2,018 tokens (~8 KB). |

---

## 🚫 All The Dangerous Errors Octeract Automatically Catches

Octeract acts as an automated compiler and architectural auditor that catches errors static linters completely miss:

- ✂️ **Lazy AI Truncation:** Intercepts patterns like `// ... rest of code here` or `/* existing code */` before an AI wipes out your files.
- 🕳️ **Topological Sinks (Dead Ends):** Catches modules that absorb calls or dependencies but never propagate results or update state, creating silent logic traps.
- 🏝️ **Zombie Islands:** Identifies unreachable files and orphan functions that clutter your repository and slow down builds.
- ⚡ **Contract Violations:** Alerts you instantly when an altered function signature or return type breaks callers across other directories.
- 🔁 **Infinite Loops & Memory Sandboxes:** Runs speculative edits in an isolated micro-sandbox to detect runaway loops before they freeze your application.
- 🔐 **Secret Leaks & Stolen Keys:** Scans Shannon entropy to stop developers or agents from accidentally committing passwords, private keys, or API tokens.
- 👻 **Hallucinated Packages:** Flags fictitious or non-existent `npm` imports fabricated by LLMs before they enter `package.json`.
- 🛡️ **Prompt Injection Traps:** Neutralizes indirect prompt injection attacks hidden inside comments, docstrings, or markdown files in third-party packages.
- 🕵️ **Supply Chain Tampering:** Analyzes built bundles (`webpack`, `rollup`, `esbuild`) and detects ghost code injected into bundles that does not exist in your source repository.

---

## 🌟 The 5 Master Apertures (Everything You Need in 5 Commands)

You do **not** need to memorize dozens of complicated commands. Octeract unifies 100% of its power into **5 intuitive Master Apertures**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               ✨ LAS 5 APERTURAS MAESTRAS DE OCTERACT                  │
├────────────────────────────────────────────────────────────────────────┤
│ 🩺 octeract doctor      ➔ Diagnóstico holístico universal (<250 tokens)│
│ 👁️ octeract see         ➔ Lente Origami AST: 80%-95% ahorro de tokens │
│ 💥 octeract impact      ➔ Onda Heighway y orden seguro de refactor     │
│ 🛡️ octeract safe-write  ➔ Escudo 4D: frena bugs, autoriza código limpio│
│ 🧠 octeract ask         ➔ Preguntas causales directas a archivo y línea│
└────────────────────────────────────────────────────────────────────────┘
```

### 1. `octeract doctor [dir]` 🩺
> **The Universal Codebase Health & Failure Scanner**  
Runs a complete diagnostic across your entire project in $< 1\text{ second}$ without using any AI tokens. Delivers your project health score (0 to 100), detects all broken contracts, identifies dead ends, and gives you exact surgical recommendations in less than 250 tokens. **Now includes OcteractSieve**: pass raw test outputs or compiler error logs via `logOrOutput` to isolate failing assertions and strip 90%+ terminal noise.

### 2. `octeract see <file> [symbol] [--mode=origami|sieve]` 👁️
> **The Origami Code & Log Reading Lens**  
Folds away private implementation details into zero-token markers while preserving 100% of public types, interfaces, and function headers. Slashes your LLM token consumption by **80% to 95%** while giving the AI everything it needs to understand the architecture. Supports `--mode=sieve` (and auto-detection) for compressing massive logs, CSV tables, and JSON dumps by 85-98%.

### 3. `octeract impact <file> [symbol]` 💥
> **The Domino Effect Predictor**  
Visualizes the ripple effect of changing any file or function. Calculates the risk level (Low, Medium, High, Catastrophic), lists all downstream callers, and generates the exact **safe refactoring order** so you never break dependencies.

### 4. `octeract safe-write <file> <code>` 🛡️
> **The Active 4D Safety Write Shield**  
The definitive defense against AI hallucinations and lazy code deletions. It tests proposed code across 4 safety axes (syntax, contracts, execution, and security). Any lazy truncation comments (`// ... rest of code`) are strictly blocked with `BLOCKED_BY_4D_SHIELD`, leaving your disk untouched. Clean code is verified and safely written with `WRITTEN_SAFELY`.

### 5. `octeract ask "<question>"` 🧠
> **The Causal Question & Zero-Slop Engine**  
Ask any natural language question about how your system works (e.g., `octeract ask "How does user authentication work?"`). Octeract traces the causal path through your codebase and gives you the direct answer with the exact files, line numbers, and symbols in $< 200\text{ tokens}$ following the high-density **Zero-Slop Telemetry Protocol** (`terse: true`).

---

## 🧭 Advanced Specialized Suites (Expandable Reference)

For advanced workflows, specialized engineering tasks, and deep forensics, Octeract provides 4 specialized tool suites:

<details>
<summary><strong>🐉 1. The Dragon Curve Suite (<code>octeract dragon</code>)</strong></summary>

Inspired by the Heighway Dragon fractal, this suite handles advanced spatial code organization and resilience:
- `octeract dragon coords <file>`: Calculates the fractal coordinates, rotation sequence, and 8D spatial vector of any file.
- `octeract dragon fold <file>`: Folds code with architectural origami into valley folds (contracts) and mountain folds (bodies).
- `octeract dragon blast <file>`: Simulates fractal wave propagation with Hausdorff damping to evaluate deep blast radii.
- `octeract dragon tile [dir]`: Partitions the entire repository into 4 balanced dragon quadrants (Alfa, Beta, Gamma, Delta) and verifies zero boundary leaks.
- `octeract dragon fuzz <file>`: Tests conditional fold points and branches with synthetic mutations to identify weak logic.
</details>

<details>
<summary><strong>🛡️ 2. The REA Reverse-Engineering Suite (<code>octeract rea</code>)</strong></summary>

Advanced binary analysis, bundle deconstruction, and prompt injection defense:
- `octeract rea armor <file|dir>`: Scans source files and directories for indirect prompt injections, system directive overrides, and malicious docstrings.
- `octeract rea bundle <bundle.js>`: Deconstructs minified Webpack, Rollup, or esbuild bundles, recovering original internal modules and symbols with 95% confidence.
- `octeract rea compare <sourceDir> <bundle.js>`: Performs supply chain forensic audits, comparing source code against production bundles to detect injected ghost backdoors.
- `octeract rea native <binary>`: Inspects native executable formats (ELF, Mach-O, PE, WASM) and symbols.
</details>

<details>
<summary><strong>⛏️ 3. The Minecraft-Voxel Spatial Suite (<code>octeract voxel</code>)</strong></summary>

Brings spatial computing and high-efficiency gaming data structures into software engineering:
- `octeract voxel biomes [dir]`: Classifies code modules into multi-noise climates (`MEADOW_PLAINS`, `DEEP_FROZEN_OCEAN`, `ANCIENT_CITY_SCULK`, `LUSH_CAVES`) based on complexity and churn.
- `octeract voxel palette <file>`: Compresses token streams using a BitArray symbol palette, achieving **6.37x lossless compression**.
- `octeract voxel starlight <file>`: Propagates BFS dependency light levels (from Level 15 down to 0) across thousands of nodes in 5 milliseconds.
- `octeract voxel horizon <file>`: Manages chunk working sets (Levels 31 to 44) to keep only active files in RAM and evict stale files.
- `octeract voxel anvil [dir]`: Packages codebase regions into high-speed `.oac` regional containers with 4 KB sector alignment.
- `octeract voxel jigsaw [dir]`: Assembles modular architectural components via strictly typed plug/jack sockets.
</details>

<details>
<summary><strong>📜 4. The Voynich Linguistic Suite (<code>octeract voynich</code>)</strong></summary>

Pioneering linguistic analysis inspired by the Voynich manuscript for token compression:
- `octeract voynich eva <file>`: Transliterates TypeScript declarations into canonical 3-slot EVA glyphs, cutting token weight by **96%** (from 2,750 down to 121 tokens).
- `octeract voynich montemurro [dir]`: Uses mutual information to identify high-signal domain keywords without embeddings or LLM calls.
- `octeract voynich slot <file>`: Validates code grammar slots in O(1) microsecond time (< 100 microseconds).
- `octeract voynich entropy <file>`: Measures second-order conditional entropy to detect lazy repetitive boilerplate or obfuscated code.
</details>

<details>
<summary><strong>⚙️ 5. Core & DeepMind Neuro-Symbolic Tools (<code>octeract core</code>)</strong></summary>

- `octeract core stats [dir]`: High-level metrics, edge counts, and cubic cell distribution.
- `octeract core slice <cell>`: Extracts surgical slices (e.g. `CoreLogic`, `Security`, `Storage`) with up to 100% token savings.
- `octeract core diff [baseBranch]`: Audits only git-modified files and downstream blast radius.
- `octeract core mcp`: Launches the Model Context Protocol JSON-RPC server over stdio.
- `octeract core ui`: Opens the interactive touch 3D visual dashboard on `localhost:4444`.
</details>

---

## 🔌 Universal MCP Integration (Cursor, Claude Code, Windsurf, VS Code)

Octeract is a first-class citizen of the **Model Context Protocol (MCP)**. It connects seamlessly to any modern AI coding environment:

```json
{
  "mcpServers": {
    "octeract": {
      "command": "npx",
      "args": ["-y", "octeract-context", "mcp"]
    }
  }
}
```

### 🎛️ Adaptive Schema Profiles (90% Schema Token Savings)
- **Profile `essential` (Default):** Exposes only the 14 most critical master tools and aliases. Shrinks MCP schema overhead from **83.4 KB down to 8.0 KB** (~2,018 tokens), saving over **18,800 tokens on every single turn** for your code and reasoning.
- **Profile `full` (On-Demand):** Unlocks all 150 specialized tools whenever deep reverse engineering, voxel chunking, or EVA transliteration is needed via `octeract_switch_profile`.
- **100% Backward Compatible:** Any specialized tool remains directly callable via `tools/call` at any time, even in `essential` mode.

---

## 🚀 Quick Start Guide

### 1. Run the Instant Zero-Touch Onboarding
```bash
npx octeract-context init
```
This single command maps your repository, verifies your setup, installs the active Git pre-commit shield, and configures `.mcp.json` for all your AI editors.

### 2. Check Your Repository Health
```bash
npx octeract-context doctor
```

### 3. Read Code with 85% Token Savings
```bash
npx octeract-context see src/index.ts
```

### 4. Check Impact Before Refactoring
```bash
npx octeract-context impact src/core/hypercube.ts
```

---

## 🏆 Proven Milestones

- **218 / 218 Unit Tests Passing (100%):** Validated across 13 comprehensive test suites covering all engines.
- **Microsoft VS Code Benchmark (19,734 Files):** Audited an entire enterprise codebase in **< 1.8 seconds at 0 tokens**, reducing context token consumption by **99.96%**.
- **Deterministic 4D Shield:** 100% interception of lazy AI truncations, broken contracts, and infinite loops in live memory trials.

---

## ⚖️ License

Octeract-Context is distributed under the **Business Source License 1.1 (BSL 1.1)**.
- **Free for Community & Open Source:** Free to use for individuals, open-source projects, community developers, and teams of all sizes building great software.
- **Commercial & Enterprise:** Enterprise licensing applies to proprietary commercial multi-repo deployments. See [LICENSE.md](LICENSE.md) for full terms.
