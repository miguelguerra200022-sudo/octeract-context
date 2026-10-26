---
name: impact
description: Cálculo de onda de choque Heighway y efecto dominó en cascada antes de tocar código, evaluando riesgo y dependencias aguas abajo.
---

# 💥 Octeract Impact (/impact)

Cuando el usuario invoque `/impact`:
1. Identifica el archivo o módulo que se planea modificar o refactorizar.
2. Ejecuta la herramienta MCP `octeract_impact` con `targetFile`.
3. Reporta el cálculo de impacto:
   - Nivel de riesgo (LOW, MEDIUM, HIGH, CRITICAL) y puntaje de impacto (0-100).
   - Módulos alcanzados en la onda expansiva Heighway (Tier 1 directos y Tier 2 aguas abajo).
   - Amortiguación fractal Hausdorff y vueltas espirales Raup recorridas.
   - **Orden Seguro de Actualización**: Secuencia exacta para aplicar cambios sin romper contratos.
