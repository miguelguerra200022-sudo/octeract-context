---
name: octeract-impact
description: Heighway dragon shockwave and downstream ripple effect calculation. Evaluates risk level (0-100) and computes the exact safe refactoring sequence before code modifications.
---

# 💥 Octeract Impact (`/octeract impact` or `/octeract-impact`)

When invoked:
1. Identify the target file or symbol to be refactored.
2. Call MCP tool `octeract_impact`.
3. Report the full impact dossier without omissions:
   - Risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and numerical impact score (0-100).
   - Epicenter details and affected downstream modules (Tier 1 direct dependents and Tier 2 cascade).
   - Hausdorff fractal dampening and logarithmic Raup spiral whorls traversed.
   - Safe refactoring order: exact step-by-step sequence to apply edits without breaking contracts.
   - Direct technical explanation without analogies.
