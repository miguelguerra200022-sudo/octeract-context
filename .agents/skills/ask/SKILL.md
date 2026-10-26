---
name: ask
description: Consulta semántica hiperdimensional en lenguaje natural sobre la arquitectura, símbolos y trazado causal de archivos.
---

# 🧠 Octeract Ask (/ask)

Cuando el usuario invoque `/ask`:
1. Toma la pregunta del usuario en lenguaje natural sobre la arquitectura o funcionamiento del sistema.
2. Ejecuta la herramienta MCP `octeract_ask` con la propiedad `query`.
3. Si el usuario pide brevedad extrema, añade `mode: "terse"`.
4. Devuelve la respuesta explicando el razonamiento causal y proporcionando enlaces clickables exactos a los archivos y líneas relevantes (`file:///...#L123`).
