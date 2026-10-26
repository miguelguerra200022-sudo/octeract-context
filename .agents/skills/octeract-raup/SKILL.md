---
name: octeract-raup
description: Concho-morphological analysis using Raup 1966 parameters (W, D, T) and nautilus chamber entropy gradient mapping across the codebase.
---

# 🐚 Octeract Raup Morphology (`/octeract raup` or `/octeract-raup`)

When invoked:
1. Identify the target file or inspect global codebase morphology.
2. Call MCP tool `octeract_raup_morphology`.
3. Report all calculated conchological metrics without omissions:
   - W (Whorl expansion rate)
   - D (Distance from coiling axis)
   - T (Translation rate along axis)
   - Assigned Nautilus Chamber (1 to 6) and its exact entropy gradient.
   - Plain technical explanation of code stability without confusing metaphors.
