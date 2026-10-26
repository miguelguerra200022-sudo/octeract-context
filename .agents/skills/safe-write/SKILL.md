---
name: safe-write
description: Modificación protegida y atómica de archivos con el escudo hiperdimensional 4D y prevención física de truncamientos o regresiones.
---

# 🛡️ Octeract Safe Write (/safe-write)

Cuando el usuario invoque `/safe-write`:
1. Recopila el archivo objetivo (`targetFile`) y el nuevo código propuesto (`proposedContent`).
2. Verifica que el código esté 100% COMPLETO (prohibido código perezoso o truncado).
3. Ejecuta la herramienta MCP `octeract_safe_write` pasando `targetFile` y `proposedContent`.
4. Si retorna `WRITTEN_SAFELY`, confirma el éxito atómico, reducción de entropía y estado del escudo.
5. Si retorna `BLOCKED_BY_4D_SHIELD`, explica detalladamente en lenguaje llano la violación de contrato o cizallamiento 4D detectado y cómo ajustarlo.
