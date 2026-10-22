# Octeract Voynich & EVA Suite (v4.3.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Este plan detalla la arquitectura, especificación de tipos, pruebas TDD e implementación de los **6 Pilares Matemáticos y Lingüísticos del Manuscrito Voynich y el Código EVA** aplicados a la ingeniería de software y motores de contexto agéntico, seguido de la integración en el CLI, servidor MCP, bump a `v4.3.0`, y dogfooding total sobre el propio código de Octeract.

---

## Estructura de Archivos Propuesta

```
src/
└── voynich/
    ├── index.ts               # Barrel export de todo el subsistema Voynich/EVA
    ├── eva-ast.ts             # Pilar 1: Transliterador Canónico EVA-AST (Compresión 90% tokens)
    ├── montemurro.ts          # Pilar 2: Clustering Semántico Montemurro-Zanette (Información Mutua a 0 tokens)
    ├── slot-machine.ts        # Pilar 3: Validador de Sintaxis Slot-Machine DFA de Zattera O(1)
    ├── currier.ts             # Pilar 4: Particionador de Dialectos Currier A/B (Frontend vs Backend)
    ├── entropy-guard.ts       # Pilar 5: Filtro de Entropía Condicional de Segundo Orden (h2)
    └── cardan-grille.ts       # Pilar 6: Fuzzer de Mutación Sintética por Rejilla de Cardano en RAM

tests/
├── voynich_eva_ast.test.ts
├── voynich_montemurro.test.ts
├── voynich_slot_machine.test.ts
├── voynich_currier.test.ts
├── voynich_entropy_guard.test.ts
├── voynich_cardan_grille.test.ts
└── voynich_integration.test.ts
```

---

## Tareas de Implementación

### Tarea 1: Transliterador Canónico EVA-AST (Pilar 1)
- [ ] Crear la prueba que falla en `tests/voynich_eva_ast.test.ts`:
  - Transliterar funciones y clases a ternas canónicas EVA `[Prefix-Slot][Core-Slot][Suffix-Slot]`.
  - Comprobar reducción de tokens > 80% frente al código original.
  - Comprobar decodificación reversible de vuelta a esqueletos AST válidos.
- [ ] Implementar `src/voynich/eva-ast.ts` (`OcteractEVAAST`):
  - Normalización de firmas TypeScript/JavaScript.
  - Mapeo de prefijos (`export async` $\to$ `qo`, etc.), núcleos y sufijos de contrato.
  - Medición de ratio de compresión.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement EVA-AST canonical transliteration engine`).

---

### Tarea 2: Clustering Semántico Montemurro & Zanette (Pilar 2)
- [ ] Crear la prueba que falla en `tests/voynich_montemurro.test.ts`:
  - Cálculo de entropía de distribución de palabras a través de módulos/folios $H(S|w)$.
  - Cálculo de Información Mutua $I(w, S) = H(S) - H(S|w)$.
  - Extracción de clústeres temáticos sin IA, sin embeddings y en $< 20\text{ ms}$.
- [ ] Implementar `src/voynich/montemurro.ts` (`OcteractMontemurroEngine`):
  - Indexación de identificadores por archivo.
  - Filtro automático de palabras vacías sintácticas por uniformidad de dispersión.
  - Grafo de afinidad semántica por pares de términos de alta información mutua.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement Montemurro-Zanette mutual information clustering`).

---

### Tarea 3: Validador de Sintaxis Slot-Machine DFA en $O(1)$ (Pilar 3)
- [ ] Crear la prueba que falla en `tests/voynich_slot_machine.test.ts`:
  - Validación de signaturas válidas en tiempo $O(1)$ (< 0.1 ms).
  - Rechazo inmediato de ranuras permutadas o modificadores ilegales.
  - Descomposición en ranuras: Visibilidad, Asincronía, Tipo de Entidad, Identificador, Aridad, Contrato.
- [ ] Implementar `src/voynich/slot-machine.ts` (`OcteractSlotMachineValidator`):
  - Autómata finito determinista basado en el modelo de 12 ranuras de Zattera adaptado a código.
  - Inspección instantánea sin AST parser completo.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement Zattera slot-machine grammar validator`).

---

### Tarea 4: Particionador de Dialectos Currier A vs B (Pilar 4)
- [ ] Crear la prueba que falla en `tests/voynich_currier.test.ts`:
  - Detección de Dialecto A (Declarativo/JSX/UI) vs Dialecto B (Imperativo/Async/Core) vs Dialecto C (Tipos/Contratos).
  - Matriz de transición de bigramas de palabras clave.
  - Asignación de tolerancias topológicas diferenciadas por dialecto.
- [ ] Implementar `src/voynich/currier.ts` (`OcteractCurrierClassifier`):
  - Extractor de frecuencias de n-gramas sintácticos.
  - Clasificador bayesiano/distancia euclidiana a centroides de dialecto.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement Currier dialect partitioner`).

---

### Tarea 5: Filtro de Entropía Condicional de Segundo Orden ($h_2$) (Pilar 5)
- [ ] Crear la prueba que falla en `tests/voynich_entropy_guard.test.ts`:
  - Cálculo de entropía condicional de Markov $h_2 = -\sum P(c_i, c_j) \log_2 P(c_j | c_i)$.
  - Detección de colapso de entropía en código repetitivo / truncamientos perezosos de IA.
  - Detección de hiper-entropía en alucinaciones o código aleatorio.
  - Validación de banda de código saludable ($1.8 \le h_2 \le 4.2$).
- [ ] Implementar `src/voynich/entropy-guard.ts` (`OcteractEntropyGuard`):
  - Matriz de probabilidades conjuntas y condicionales de bigramas.
  - Veredicto de salud entrópica integrado con el escudo de seguridad.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement Bennett-Lindemann second-order conditional entropy guard`).

---

### Tarea 6: Fuzzer de Mutación Sintética por Rejilla de Cardano en RAM (Pilar 6)
- [ ] Crear la prueba que falla en `tests/voynich_cardan_grille.test.ts`:
  - Generación de mutantes en memoria a $> 5,000$ mutantes/segundo a 0 tokens de LLM.
  - Proyección de plantilla perforada (Cardan Grille) sobre matrices de operadores y símbolos.
  - Prueba de fallos de aserción en suites de tests.
- [ ] Implementar `src/voynich/cardan-grille.ts` (`OcteractCardanGrilleFuzzer`):
  - Matriz de símbolos del proyecto y rejilla estocástica desplazable.
  - Inyección en micro-sandbox efímero para probar cobertura real de aserciones.
- [ ] Ejecutar prueba con Node strip-types y verificar 100% pass.
- [ ] Git commit atómico (`feat(voynich): implement Gordon Rugg Cardan Grille in-RAM fuzzer`).

---

### Tarea 7: Integración Total, CLI, Servidor MCP, Release v4.3.0 y Dogfooding Exhaustivo
- [ ] Crear `src/voynich/index.ts` re-exportando los 6 motores.
- [ ] Crear `tests/voynich_integration.test.ts` verificando la cooperación de los 6 motores.
- [ ] Integrar los comandos CLI en `src/cli/commands.ts` y `src/index.ts`:
  - `octeract eva-ast <archivo>`
  - `octeract montemurro [dir]`
  - `octeract slot-machine <archivo>`
  - `octeract currier [dir]`
  - `octeract entropy-h2 <archivo>`
  - `octeract cardan-fuzz <archivo> [mutaciones]`
- [ ] Integrar las 6 herramientas MCP en `src/mcp/server.ts`:
  - `octeract_eva_ast`
  - `octeract_montemurro_cluster`
  - `octeract_slot_machine_validate`
  - `octeract_currier_classify`
  - `octeract_entropy_h2`
  - `octeract_cardan_fuzz`
- [ ] Bump de versión a `4.3.0` en `package.json`, `src/index.ts`, `src/mcp/server.ts`.
- [ ] Actualizar `README.md` con la sección de Voynich/EVA Suite, badges y tablas de herramientas.
- [ ] Ejecutar suite completa de tests (`npm test`) y verificar 100% passing.
- [ ] Ejecutar auditoría (`octeract audit .` $\to$ 100/100 `PERFECT_SYMMETRY`).
- [ ] Ejecutar preflight (`octeract preflight .` $\to$ APROBADO).
- [ ] Git commit y push a `origin/main`.
- [ ] Ejecutar todas las herramientas MCP en su totalidad sobre el propio código de Octeract y registrar el reporte de dogfooding completo sin omitir nada.
