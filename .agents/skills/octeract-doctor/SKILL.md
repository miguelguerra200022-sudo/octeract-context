---
name: octeract-doctor
description: Holistic codebase health diagnostic (0-100 score), Knip-style dead exports, architectural fractures, boundary leaks, and Sieve test/log noise filtering in 0 tokens.
---

# 🩺 Octeract Doctor (`/octeract doctor` or `/octeract-doctor`)

When invoked:
1. Run MCP tool `octeract_doctor`. If test output, error traces, or logs are provided, pass them via `logOrOutput`.
2. Present the complete diagnostic report without omitting any data:
   - Global health score (0-100) and verdict.
   - Total indexed files and symbols.
   - Every detected fracture (one by one with severity, file, and line number).
   - Boundary leaks and dominant architectural biomes.
   - Concrete surgical recommendations to fix issues via `octeract_safe_write`.
   - Direct, plain-language explanation without metaphorical analogies.
