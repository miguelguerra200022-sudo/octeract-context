---
name: see
description: Vista de rayos X con compresión fractal (Origami AST, Skeleton, EVA o Sieve) para archivos, funciones o logs sin consumir miles de tokens.
---

# 👁️ Octeract See (/see)

Cuando el usuario invoque `/see`:
1. Identifica el objetivo de inspección indicado por el usuario (ruta de archivo, símbolo o snippet).
2. Ejecuta la herramienta MCP `octeract_see` pasando:
   - `targetFile`: Archivo a inspeccionar.
   - `mode`: Modo de compresión (`origami`, `skeleton`, `eva`, o `sieve`). Por defecto `origami`.
   - `focusSymbol`: Símbolo específico a enfocar (opcional).
3. Reporta el resultado completo explicando claramente qué hace el archivo y qué descubrió la herramienta en lenguaje directo (sin analogías), indicando líneas, tokens originales vs entregados, porcentaje de ahorro y la proyección del código limpio.
