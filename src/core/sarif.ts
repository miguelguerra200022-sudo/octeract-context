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
