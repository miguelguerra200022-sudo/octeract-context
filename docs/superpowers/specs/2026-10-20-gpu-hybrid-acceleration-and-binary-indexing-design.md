# Especificación de Diseño: Acelerador Híbrido Dinámico (GPU/CPU), Almacenamiento Binario CSR y Diagnóstico Universal Profundo

**Fecha:** 2026-10-20  
**Proyecto:** Tesseract-Context 4D (v2.1.0)  
**Estado:** Aprobado para Planificación e Implementación  

---

## 1. Resumen Ejecutivo y Objetivos

Esta especificación detalla la actualización de rendimiento y precisión diagnóstica más significativa de Tesseract-Context:

1. **Capa de Abstracción de Hardware (HAL) Dinámica:** Soporte para Compute Shaders en VRAM (WebGPU / WGSL) para acelerar operaciones de grafos masivos, con fallback automático y transparente a CPU multihilo (`worker_threads` + `Float32Array` SIMD) para garantizar 100% de compatibilidad en todos los dispositivos del mundo sin dependencias nativas forzadas.
2. **Serialización Binaria Contigua CSR (`index.bin`):** Reemplazo del cuello de botella de `index.json` (298.8 MB en VS Code) por un formato binario empaquetado plano tipo Compressed Sparse Row (CSR), reduciendo el tamaño a ~14 MB y el tiempo de carga de 15 segundos a menos de 100 milisegundos.
3. **Indexación Paralela e Incremental:** Pool de trabajadores multihilo para ingesta de archivos saturando los núcleos de la CPU, combinado con un caché diferencial basado en Git/mtime para re-indexaciones en menos de 15 milisegundos.
4. **Diagnóstico Universal Profundo (4 Pilares al Extremo):** Detección de diferencias exactas en firmas de tipos (parámetros y tipos de retorno) y aislamiento del camino crítico de colapso (*Critical Backbone*) hacia los *terminal sinks*.

---

## 2. Arquitectura del Sistema

```
                               ┌───────────────────────────┐
                               │   TESSERACT CORE ENGINE   │
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   HardwareAccelerator   │   │    BinarySerializer     │   │ DeepContractDiagnostic  │
  │ (Capa de Hardware HAL)  │   │  (Almacenamiento CSR)   │   │  (Diff de Firmas 4D)    │
  └────────────┬────────────┘   └────────────┬────────────┘   └────────────┬────────────┘
               │                             │                             │
        ┌──────┴──────┐               ┌──────┴──────┐               ┌──────┴──────┐
        ▼             ▼               ▼             ▼               ▼             ▼
   [WebGPU VRAM] [CPU Multi-core] [index.bin]  [Git Cache]    [Type Diff]   [Backbone Path]
```

### 2.1 Capa de Abstracción de Hardware (`src/core/accelerator.ts`)
- **Interfaz `HardwareAccelerator`:**
  - `computePageRank(adjOffsets: Uint32Array, adjIndices: Uint32Array, numNodes: number, iterations?: number, damping?: number): Promise<Float32Array>`
  - `computeToroidalGeodesics(coordsFlat: Float32Array, targetCoord: Point4D, numNodes: number): Promise<Float32Array>`
  - `computeDifferentialShear(matrixA: Float32Array, matrixB: Float32Array, size: number): Promise<number>`
  - `getBackendType(): 'webgpu' | 'cpu_multithread'`
- **`WebGPUComputeBackend`:**
  - Detecta la presencia de `globalThis.navigator?.gpu`.
  - Compila y despacha shaders WGSL de multiplicación matriz-vector dispersa (SpMV) y distancias toroidales.
- **`CpuMultithreadBackend`:**
  - Fallback universal con arrays tipados contiguos (`Float32Array`, `Uint32Array`).
  - Cero dependencias nativas externas, compatible con Android/Termux, Linux, macOS y Windows.

### 2.2 Serializador Binario Contiguo CSR (`src/core/binary.ts`)
- **Estructura del archivo `index.bin`:**
  - **Magic Header:** 4 bytes `TESS` + 2 bytes versión `0x0201`.
  - **Metadata Header:** Total de vértices (uint32), total de aristas (uint32), timestamp (uint64).
  - **Table of Vertices:** Array contiguo de coordenadas 4D `[X, Y, Z, W]` en `Float32` (16 bytes por vértice) + identificadores indexados.
  - **CSR Graph Representation:** 
    - `offsets`: `Uint32Array` de tamaño `N + 1`.
    - `indices`: `Uint32Array` de tamaño `E` (aristas destino).
  - **Cadena de compatibilidad:** Si `index.bin` existe, se lee con `fs.readFileSync` mapeado a búfer plano en $< 80\text{ ms}$. Si solo existe `index.json`, se migra automáticamente a `.bin`.

### 2.3 Indexación Paralela e Incremental (`src/core/cache.ts` y `src/core/parallel-indexer.ts`)
- **`ParallelIndexer`:**
  - Divide la lista de archivos descubiertos en $N$ fragmentos según `os.cpus().length`.
  - Utiliza `worker_threads` integrados en Node.js sin bibliotecas adicionales.
- **`IncrementalCache`:**
  - Almacena un mapa liviano `{ relativePath: { mtime, size, sha } }`.
  - En auditorías y escrituras subsecuentes, solo los archivos modificados son re-parseados.

### 2.4 Diagnóstico Universal Profundo (`src/core/diagnostic.ts`)
- **Pilar 1 (Radiografía de Firma):**
  - Compara la firma del llamador con la declaración exportada (parámetros faltantes, discrepancias de tipo `string` vs `number`, o promesas `async` no esperadas).
- **Pilar 2 (Camino Crítico de Colapso - Critical Backbone):**
  - Algoritmo de camino más corto en el grafo acíclico dirigido desde el epicentro del cambio hasta el *terminal sink* más cercano con mayor centralidad.
- **Pilar 3 (Evidencia Verbatim):**
  - Mapeo de fragmento exacto de 5 líneas con números de línea y código fuente real extraído de disco.
- **Pilar 4 (Solución Quirúrgica Probada en RAM):**
  - Generación de stubs adaptadores validados con `TransactionalHealer` en memoria.

---

## 3. Plan de Pruebas y Validación (TDD)

1. **`tests/accelerator.test.ts`:**
   - Verifica la conmutación dinámica del acelerador: inicialización en WebGPU si está disponible o fallback limpio a CPU.
   - Comprueba que el cálculo de PageRank y geodésicas en CPU y GPU produce resultados idénticos dentro de un margen $\epsilon < 10^{-5}$.
2. **`tests/binary.test.ts`:**
   - Valida la serialización y deserialización binaria CSR (`index.bin`), verificando que los 19,734 vértices y 144,537 aristas se reconstruyen con 100% de integridad geométrica.
3. **`tests/incremental.test.ts`:**
   - Valida que modificar un solo archivo solo re-calcula las aristas locales en $< 20\text{ ms}$.
4. **`tests/diagnostic.test.ts`:**
   - Valida la extracción de diferencias de firma profunda en contratos rotos y el trazado de la cadena crítica de colapso.

---

## 4. Garantía de Cero Dependencias y Regresión Nula

- Ninguna dependencia npm nueva en tiempo de ejecución.
- 100% de la suite de pruebas preexistente (56/56 pruebas) debe seguir pasando al 100%.
- Auto-auditoría topológica debe mantenerse en **100/100 (`PERFECT_SYMMETRY`)**.
