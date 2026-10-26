---
name: raup
description: Análisis del espacio morfológico conconológico de Raup 1966 (W, D, T) y asignación a las 6 cámaras de nautilo con gradientes de entropía.
---

# 🐚 Octeract Raup Morphology (/raup)

Cuando el usuario invoque `/raup`:
1. Identifica el archivo o módulo a analizar (o evalúa el espacio morfológico global).
2. Ejecuta la herramienta MCP `octeract_raup_morphology` con `targetFile`.
3. Reporta todos los parámetros conconológicos calculados sin omitir nada, con explicaciones directas y sin analogías:
   - W (Whorl Expansion Rate / Tasa de expansión en espiral)
   - D (Distance from Coiling Axis / Desconexión del núcleo central)
   - T (Translation Rate / Crecimiento axial y vertical)
   - Cámara de Nautilo asignada (Cámara 1 a 6) con su gradiente de entropía exacto y diagnóstico de estabilidad.
