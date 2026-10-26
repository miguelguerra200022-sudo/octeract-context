---
name: doctor
description: Auscultación médica holística del repositorio con Octeract MCP. Analiza salud (0-100), fracturas, imports muertos y fugas de límites en 0 tokens.
---

# 🩺 Octeract Doctor (/doctor)

Cuando el usuario invoque `/doctor`:
1. Ejecuta inmediatamente la herramienta MCP `octeract_doctor`.
2. Si el usuario proporcionó un log, traza de error o salida de pruebas, pásalo como parámetro `logOrOutput` para que el filtro Sieve lo comprima.
3. Presenta el diagnóstico completo desglosando absolutamente toda la información entregada por el motor sin omitir nada, siguiendo los 4 Pilares de Claridad Universal:
   - 🔍 **Radiografía Completa**: Salud (0-100), veredicto, total de archivos, total de símbolos, fracturas detectadas una por una, fugas de límites y biomas dominantes con explicación clara y directa (sin analogías).
   - 💥 **Peligros Ocultos y Efecto Dominó**: Consecuencias prácticas si no se atienden las fracturas y módulos dependientes afectados.
   - 📜 **Evidencia Nítida**: Enlace clickable exacto a cada archivo y línea (`file:///...#L123`) con el fragmento del fallo.
   - 🛡️ **Solución Quirúrgica**: Todas las recomendaciones concretas de reparación con `octeract_safe_write`.
