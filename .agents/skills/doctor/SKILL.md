---
name: doctor
description: Auscultación médica holística del repositorio con Octeract MCP. Analiza salud (0-100), fracturas, imports muertos y fugas de límites en 0 tokens.
---

# 🩺 Octeract Doctor (/doctor)

Cuando el usuario invoque `/doctor`:
1. Ejecuta inmediatamente la herramienta MCP `octeract_doctor`.
2. Si el usuario proporcionó un log, traza de error o salida de pruebas, pásalo como parámetro `logOrOutput` para que el filtro Sieve lo comprima.
3. Presenta el diagnóstico completo siguiendo los 4 Pilares de Claridad Universal:
   - 🔍 **Radiografía Clara**: Salud (0-100), veredicto, total de archivos/símbolos y bioma dominante con analogías intuitivas.
   - 💥 **Peligro Oculto y Efecto Dominó**: Fracturas detectadas y consecuencias reales si no se atienden.
   - 📜 **Evidencia Nítida**: Enlace clickable exacto al archivo y línea (`file:///...#L123`) con el fragmento del fallo.
   - 🛡️ **Solución Quirúrgica**: Recomendaciones concretas de reparación con `octeract_safe_write`.
