/**
 * TESSERACT-CONTEXT: Exportador Universal OASIS SARIF 2.1.0
 * Compatible con GitHub Code Scanning, Visual Studio, GitLab y CI/CD.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AuditReport, TopologicalFracture } from './types.ts';

export interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  helpUri: string;
  defaultConfiguration: {
    level: 'error' | 'warning' | 'note';
  };
  properties?: {
    tags: string[];
    precision: string;
  };
}

export interface SarifResult {
  ruleId: string;
  ruleIndex: number;
  level: 'error' | 'warning' | 'note';
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: {
        uri: string;
        uriBaseId?: string;
      };
      region: {
        startLine: number;
        startColumn?: number;
        endLine?: number;
        endColumn?: number;
      };
    };
  }>;
  fixes?: Array<{
    description: { text: string };
    fileChanges: Array<{
      artifactLocation: { uri: string };
      replacements: Array<{
        deletedRegion: { startLine: number };
        insertedContent?: { text: string };
      }>;
    }>;
  }>;
}

export interface SarifLog {
  $schema: string;
  version: '2.1.0';
  runs: Array<{
    tool: {
      driver: {
        name: string;
        version: string;
        informationUri: string;
        rules: SarifRule[];
      };
    };
    results: SarifResult[];
  }>;
}

export class SarifExporter {
  private static readonly RULES: Record<string, { id: string; name: string; short: string; full: string; level: 'error' | 'warning' | 'note' }> = {
    BROKEN_IMPORT: {
      id: 'TESS-001',
      name: 'BrokenImportReference',
      short: 'Referencia de importación rota o módulo no encontrado',
      full: 'El archivo importa un módulo o ruta que no existe físicamente en el repositorio.',
      level: 'error',
    },
    CONTRACT_MISMATCH: {
      id: 'TESS-002',
      name: 'ContractSignatureMismatch',
      short: 'Desajuste de contrato de interfaz o método mutado',
      full: 'El símbolo importado no coincide con la firma, tipo o miembros exportados por el módulo destino.',
      level: 'error',
    },
    CIRCULAR_DEPENDENCY: {
      id: 'TESS-003',
      name: 'CircularDependencyCycle',
      short: 'Dependencia cíclica cerrada en variedad 4D',
      full: 'Ciclo cerrado entre módulos que puede provocar inicialización indeterminada y memoria bloqueada.',
      level: 'error',
    },
    FLOATING_PROMISE: {
      id: 'TESS-004',
      name: 'FloatingUnhandledPromise',
      short: 'Promesa asíncrona flotante no sincronizada',
      full: 'Invocación asíncrona ejecutada sin await, return ni .catch() que traga excepciones silenciosamente.',
      level: 'error',
    },
    TOPOLOGICAL_SINK: {
      id: 'TESS-005',
      name: 'TopologicalSinkDeadEnd',
      short: 'Sumidero topológico sin salida ni persistencia',
      full: 'Flujo de código que procesa información pero se extingue sin retorno, efectos colaterales ni eventos.',
      level: 'warning',
    },
    UNREACHABLE_ISLAND: {
      id: 'TESS-006',
      name: 'UnreachableSubgraphIsland',
      short: 'Subgrafo isla desconectado de puntos de entrada',
      full: 'Clúster de archivos inaccesibles desde los entrypoints principales del repositorio.',
      level: 'warning',
    },
    UNMATCHED_EVENT: {
      id: 'TESS-007',
      name: 'UnmatchedEventPubSub',
      short: 'Desconexión de evento Pub-Sub sin oyente ni emisor',
      full: 'Evento emitido sin receptores activos en el hipercubo o escucha de evento nunca disparado.',
      level: 'warning',
    },
    DEAD_EXPORT: {
      id: 'TESS-008',
      name: 'DeadExportUnconsumed',
      short: 'Exportación no consumida (Dead Export)',
      full: 'Símbolo exportado que ningún otro archivo del hipercubo importa ni consume.',
      level: 'note',
    },
    BOUNDARY_VIOLATION: {
      id: 'TESS-009',
      name: 'BoundaryOrthogonalityViolation',
      short: 'Violación de ortogonalidad entre celdas cúbicas',
      full: 'Acoplamiento directo prohibido entre celdas arquitectónicas no adyacentes (ej. UI -> Storage directo).',
      level: 'warning',
    },
    TRUNCATED_FILE: {
      id: 'TESS-010',
      name: 'AITruncationDetected',
      short: 'Archivo truncado por pereza de modelo de IA',
      full: 'Marcador sintáctico de truncamiento perezoso (// ... rest of code) que corrompe el código.',
      level: 'error',
    },
    SECRET_LEAK: {
      id: 'TESS-011',
      name: 'HighEntropySecretViolation',
      short: 'Credencial o secreto con alta entropía de Shannon expuesto',
      full: 'Cadena con entropía estadística superior a 4.5 que coincide con patrones de API keys o tokens.',
      level: 'error',
    },
    HALLUCINATED_PACKAGE: {
      id: 'TESS-012',
      name: 'HallucinatedDependencyPackage',
      short: 'Paquete dependiente no declarado en package.json',
      full: 'Importación de un paquete npm que no está registrado en dependencias ni instalado.',
      level: 'error',
    },
    COMPLEXITY_SPIKE: {
      id: 'TESS-013',
      name: 'FractalComplexitySpike',
      short: 'Pico de complejidad ciclomática fractal',
      full: 'Módulo con exceso de ramificaciones que excede el radio de curvatura topológico permitido.',
      level: 'note',
    },
    BIN_EXEC_FRACTURE: {
      id: 'TESS-014',
      name: 'BinExecutionTrap',
      short: 'Error en ejecutable binario CLI (permisos git, shebang o CRLF)',
      full: 'El script CLI carece de permisos 100755 en Git, no tiene shebang ejecutable o contiene saltos de línea Windows CRLF.',
      level: 'error',
    },
    PACKAGING_EXPORT_FRACTURE: {
      id: 'TESS-015',
      name: 'PackagingExportTrap',
      short: 'Error de contrato en exportación de paquetes (publint/attw)',
      full: 'Archivos declarados en main, types o exports no existen, se pierden por gitignore o tienen orden de condiciones incorrecto.',
      level: 'error',
    },
    CI_WORKFLOW_FRACTURE: {
      id: 'TESS-016',
      name: 'CIWorkflowTrap',
      short: 'Dependencia circular o paso huérfano en workflow de CI',
      full: 'El workflow de CI invoca npx sobre el propio paquete antes de publicarse o tiene pasos huérfanos de artefactos.',
      level: 'error',
    },
    DEPENDENCY_LEAK_FRACTURE: {
      id: 'TESS-017',
      name: 'DependencyPartitionLeak',
      short: 'Fuga de devDependencies a código de producción',
      full: 'El código de producción importa dependencias que solo están listadas en devDependencies o usan protocolo workspace:* sin resolver.',
      level: 'error',
    },
    CASE_SENSITIVITY_FRACTURE: {
      id: 'TESS-018',
      name: 'CaseSensitivityCollision',
      short: 'Colisión de mayúsculas/minúsculas en sistema de archivos',
      full: 'El import difiere en mayúsculas/minúsculas del archivo real en disco, lo que causará fallo catastrófico en Linux/Docker.',
      level: 'error',
    },
    RELEASE_SYNC_FRACTURE: {
      id: 'TESS-019',
      name: 'ReleaseVersionDesync',
      short: 'Desincronización de versión entre package.json y código',
      full: 'La versión semver declarada en package.json no coincide con las versiones estáticas o cadenas de versión en el código.',
      level: 'warning',
    },
    SEMANTIC_RACE_FRACTURE: {
      id: 'TESS-020',
      name: 'SemanticRaceCondition',
      short: 'Colisión semántica por concurrencia multi-agente en zonas de Voronoi solapadas',
      full: 'Múltiples agentes o hilos concurrentes están modificando contratos compartidos o interfaces interdependientes sin sincronización previa, generando colisiones semánticas que escapan a Git.',
      level: 'error',
    },
    MUTATION_RESILIENCE_FRACTURE: {
      id: 'TESS-021',
      name: 'BrittleMutationTest',
      short: 'Suite de pruebas frágil o tautológica vulnerable a mutantes contrafactuales',
      full: 'La suite de pruebas tiene una tasa de eliminación de mutantes inferior al 40%, lo que permite a agentes de IA aprobar pruebas mediante soluciones huecas o atajos que no garantizan la invariancia del dominio.',
      level: 'warning',
    },
    ATOMIC_TRANSFORMATION_FRACTURE: {
      id: 'TESS-022',
      name: 'IncompleteClosedSubgraph',
      short: 'Refactorización multiarchivo incompleta en subgrafo cerrado',
      full: 'Se intentó modificar un contrato o firma raíz sin actualizar atómicamente todos los archivos del subgrafo cerrado transitivo, dejando consumidores rezagados y fracturas de cizallamiento.',
      level: 'error',
    },
    ASYMPTOTIC_DEGRADATION_FRACTURE: {
      id: 'TESS-023',
      name: 'AsymptoticComplexityDegradation',
      short: 'Degeneración de complejidad asintótica Big-O (Eje PHI)',
      full: 'El código propuesto introduce bucles anidados o búsquedas lineales dentro de iteraciones, aumentando la complejidad computacional a O(N^2) o superior y arriesgando colapso de rendimiento.',
      level: 'error',
    },
    SPURIOUS_CORRELATION_FRACTURE: {
      id: 'TESS-024',
      name: 'SpuriousCorrelationPatch',
      short: 'Parche sintomático de IA que ataca correlación espuria sin resolver la causa raíz (Eje PSI)',
      full: 'La modificación enmascara el fallo con un guard superficial sin intervenir el nodo causal primario que viola el criterio de la puerta trasera de Judea Pearl.',
      level: 'warning',
    },
    UNHANDLED_ASYNC_FRACTURE: {
      id: 'TESS-025',
      name: 'UnhandledAsyncFork',
      short: 'Promesa flotante o bifurcación asíncrona no gestionada en el Event Loop (Eje OMEGA)',
      full: 'Se detectaron promesas flotantes sin await, forEach(async) o mutaciones concurrentes no atómicas en contexto asíncrono.',
      level: 'error',
    },
  };

  /**
   * Transforma un AuditReport en un objeto de registro OASIS SARIF 2.1.0
   */
  public static generateSarif(report: AuditReport, rootDir: string = '.'): SarifLog {
    const rulesMap = new Map<string, SarifRule>();
    const ruleKeys = Object.keys(this.RULES);

    // Pre-cargar reglas conocidas
    for (const key of ruleKeys) {
      const def = this.RULES[key];
      rulesMap.set(key, {
        id: def.id,
        name: def.name,
        shortDescription: { text: def.short },
        fullDescription: { text: def.full },
        helpUri: `https://github.com/miguelguerra200022-sudo/tesseract-context#${def.id.toLowerCase()}`,
        defaultConfiguration: { level: def.level },
        properties: {
          tags: ['architecture', '4d-topology', 'security', 'zero-tokens'],
          precision: 'very-high',
        },
      });
    }

    const rulesArray = Array.from(rulesMap.values());
    const ruleIndexMap = new Map<string, number>();
    rulesArray.forEach((r, idx) => ruleIndexMap.set(r.name, idx));

    const results: SarifResult[] = [];

    for (const fracture of report.fractures) {
      const ruleDef = this.RULES[fracture.type] || {
        id: 'TESS-999',
        name: fracture.type,
        short: fracture.description,
        full: fracture.description,
        level: fracture.severity === 'CRITICAL' || fracture.severity === 'HIGH' ? 'error' : 'warning',
      };

      const startLine = fracture.importerLineNumber && fracture.importerLineNumber > 0 ? fracture.importerLineNumber : 1;
      const relativeUri = fracture.source ? path.relative(rootDir, path.resolve(rootDir, fracture.source)).replace(/\\/g, '/') : 'index.ts';

      const resultItem: SarifResult = {
        ruleId: ruleDef.id,
        ruleIndex: ruleIndexMap.get(ruleDef.name) ?? 0,
        level: ruleDef.level,
        message: {
          text: `${fracture.description}${fracture.healingStrategy ? ` | Sugerencia de curación: ${fracture.healingStrategy}` : ''}`,
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: relativeUri,
              },
              region: {
                startLine,
                startColumn: 1,
              },
            },
          },
        ],
      };

      if (fracture.synthesizedPatch) {
        resultItem.fixes = [
          {
            description: { text: `Curación automática Tesseract: ${fracture.healingStrategy || 'Aplicar parche sintético'}` },
            fileChanges: [
              {
                artifactLocation: { uri: relativeUri },
                replacements: [
                  {
                    deletedRegion: { startLine },
                    insertedContent: { text: fracture.synthesizedPatch },
                  },
                ],
              },
            ],
          },
        ];
      }

      results.push(resultItem);
    }

    return {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Tesseract-Context',
              version: '1.1.0',
              informationUri: 'https://github.com/miguelguerra200022-sudo/tesseract-context',
              rules: rulesArray,
            },
          },
          results,
        },
      ],
    };
  }

  /**
   * Escribe el reporte SARIF en disco
   */
  public static writeSarifToFile(report: AuditReport, outputPath: string, rootDir: string = '.'): void {
    const sarif = this.generateSarif(report, rootDir);
    const resolvedPath = path.resolve(outputPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, JSON.stringify(sarif, null, 2), 'utf-8');
  }
}
