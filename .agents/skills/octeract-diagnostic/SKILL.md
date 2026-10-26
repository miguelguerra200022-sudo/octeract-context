---
name: octeract-diagnostic
description: >-
  Protocolo Maestro de Diagnóstico Integral y Claridad Universal para Octeract MCP.
  Enseña a la IA a utilizar las herramientas de Octeract como extensiones sensoriales nativas
  y a traducir diagnósticos arquitectónicos complejos a explicaciones nítidas, directas y detalladas
  que cualquier persona (con o sin experiencia técnica) entienda a la perfección, sin usar analogías confusas
  y sin omitir absolutamente ningún dato técnico ni métrica de salud, impacto o seguridad.
---

# 🩺 PROTOCOLO MAESTRO DE DIAGNÓSTICO INTEGRAL Y CLARIDAD UNIVERSAL (OCTERACT MCP)

Este protocolo es de cumplimiento obligatorio para todo agente de IA (Antigravity, Cursor, Windsurf, Claude Code, Cline, Roo, Copilot) que interactúe con repositorios gobernados por **Octeract-Context**.

---

## 1. MENTALIDAD: OCTERACT ES TU EXTENSIÓN SENSORIAL NATIVA
No trates a Octeract como un programa externo o un script secundario. **Octeract es tu extensión nativa de percepción**:
- Es tu **visión de rayos X** (`octeract_see`) para ver el interior del código sin quemar miles de tokens.
- Es tu **estetoscopio médico** (`octeract_doctor`) para auscultar la salud del proyecto en RAM en milisegundos.
- Es tu **simulador de terremotos** (`octeract_impact`) para saber qué piezas se caerán antes de mover un solo ladrillo.
- Es tu **chaleco antibalas físico** (`octeract_safe_write`) que te impide romper código por accidente o truncar líneas.
- Es tu **GPS semántico causal** (`octeract_ask`) para encontrar la aguja en el pajar con enlaces exactos de archivo y línea.

---

## 2. REGLA DE ORO: CLARIDAD UNIVERSAL (CERO PAJA, CERO OMISIONES, CERO ANALOGÍAS)
El objetivo es que **cualquier persona**, ya sea un programador senior o alguien sin ningún conocimiento técnico, entienda con total nitidez el estado del software:

1. **Cero Paja (Zero-Slop):** Prohibido el relleno conversacional ("¡Hola!", "Espero que estés bien", "Como modelo de IA...", "Claro, con mucho gusto..."). Ve directo a la verdad y a la evidencia.
2. **Explicación Directa y Sencilla (CERO Analogías):** Queda estrictamente prohibido usar analogías metafóricas de la vida real (como coches, casas, tuberías, mapas o carreteras), ya que generan confusión y desvían la atención de los hechos técnicos reales. Explica de forma clara, detallada y en lenguaje natural qué hace el código analizado, qué realizó la herramienta, qué significa cada concepto y métrica, y por qué es importante, sin sacrificar la profundidad para un desarrollador senior.
3. **Mandato de Cobertura Total (Cero Omisiones):** NUNCA resumas con un vago "Todo está bien" o "Se ejecutó OK". Debes presentar y desglosar absolutamente toda la información que entregue Octeract (métricas, salud 0-100, líneas, tokens antes vs después, porcentaje de ahorro, fracturas completas una a una, severidades, biomas y recomendaciones).

---

## 3. LA ESTRUCTURA OBLIGATORIA DE LOS 4 PILARES UNIVERSALES
Sin importar si ejecutas **1 sola herramienta**, **un grupo de herramientas** o **las 42 herramientas MCP**, debes reportar cada hallazgo siguiendo los 4 Pilares:

### 🔍 Pilar 1: Radiografía Completa (¿Qué hace este código, qué se analizó y qué significa?)
- **Explicación directa para humanos:** Qué hace esta parte del código, qué realizó la herramienta y qué se descubrió, en lenguaje llano, detallado y sin analogías confusas.
- **Datos técnicos exactos sin filtrar:** Métricas numéricas completas (Salud 0-100, veredicto, tokens antes vs después, porcentaje de compresión, fracturas, fugas de límites, bioma o cuadrante 8D).

### 💥 Pilar 2: El Peligro Oculto y Efecto Dominó (¿Por qué importa en la práctica y qué pasa si no se atiende?)
- **Consecuencias reales:** Qué falla cuando un usuario real use la aplicación (ej. "La app se congelará al pagar", "Se fugarán claves secretas").
- **Red conectada:** Lista exacta de los módulos, servicios o archivos aguas abajo que sufrirán el impacto en cadena.

### 📜 Pilar 3: Evidencia Nítida en Código (¿Dónde está exactamente?)
- **Ubicación exacta:** Enlace clickable con formato `[archivo:Línea](file:///ruta/al/archivo#L10-L20)`.
- **Fragmento literal relevante:** Mostrar las líneas de código exactas que originan el problema o demuestran la compresión.

### 🛡️ Pilar 4: Solución Quirúrgica y Protección Activa (¿Cómo se resuelve de forma segura?)
- **Acción concreta:** Qué cambio específico se debe hacer.
- **Validación del Escudo 4D:** Demostrar que el cambio pasó por `octeract_safe_write` y no contiene código truncado perezoso (`// ... rest of code`), garantizando integridad atómica.
