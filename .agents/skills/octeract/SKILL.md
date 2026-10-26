---
name: octeract
description: Master orchestrator and gateway for all Octeract 8D sensory tools. Handles subcommands such as `/octeract see`, `/octeract doctor`, `/octeract impact`, `/octeract safe-write`, `/octeract ask`, and `/octeract raup` with full diagnostic coverage and zero omissions.
---

# 🐙 Octeract 8D Master Command Router

Whenever the user runs `/octeract` (or `/Octeract`), parse the subsequent arguments and dispatch accordingly:

## 1. Subcommands Dispatch
- **`/octeract see [file] [symbol] [--mode=...]`**:
  Execute `octeract_see` on the target file/symbol. Report token savings, line counts, and AST code projection.
- **`/octeract doctor [dir] [--deep] [--sarif]`**:
  Execute `octeract_doctor`. Report health score (0-100), verdict, all fractures, and dominant biomes without omitting any data.
- **`/octeract impact [file] [symbol] [hops]`**:
  Execute `octeract_impact`. Report shockwave radius, risk score, all affected downstream modules, and safe refactoring sequence.
- **`/octeract safe-write [file] [content]`**:
  Execute `octeract_safe_write`. Validate 4D hypercube contracts, Shannon entropy, and ensure zero lazy code truncations.
- **`/octeract ask [natural language question]`**:
  Execute `octeract_ask`. Provide causal analysis with exact clickable file/line links.
- **`/octeract raup [file]`**:
  Execute `octeract_raup_morphology`. Compute W, D, T parameters and assign nautilus chambers (1-6).
- **`/octeract status`**:
  Execute `octeract_profile_status` to report current profile (essential vs full) and hypercube stats.
- **`/octeract switch [essential|full]`**:
  Execute `octeract_switch_profile` to toggle exposed MCP tools.

## 2. Default Behavior (No Subcommand)
If invoked without subcommands (just `/octeract`), run `octeract_profile_status` and `octeract_doctor` to deliver a comprehensive health overview, and display the list of available `/octeract <subcommand>` options.

## 3. Mandatory Output Guidelines
- **Zero-Slop**: No conversational filler, greetings, or apologies.
- **Zero Real-World Metaphors**: Strictly avoid analogies (no cars, houses, pipes, or maps). Explain directly in plain, technical language that anyone can easily understand.
- **Total Coverage**: Present ALL data returned by Octeract without omitting any metric, line, fracture, or recommendation.
