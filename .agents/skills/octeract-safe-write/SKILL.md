---
name: octeract-safe-write
description: Atomic, multi-layer protected file modification with the 4D Hypercube Shield. Validates AST symmetry, Shannon entropy, and physically blocks lazy truncated code.
---

# 🛡️ Octeract Safe Write (`/octeract safe-write` or `/octeract-safe-write`)

When invoked:
1. Gather the target file path and 100% complete proposed code (strictly zero truncated lines or lazy comments).
2. Call MCP tool `octeract_safe_write`.
3. Report the result:
   - If `WRITTEN_SAFELY`: Confirm atomic disk commit, 4D shear distance, and updated health score.
   - If `BLOCKED_BY_4D_SHIELD`: Detail the exact contract violation, broken edges, or shear distance that caused the physical RAM block.
   - Direct explanation of why the change was accepted or blocked without metaphors.
