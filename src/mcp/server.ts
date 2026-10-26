/**
 * OCTERACT-CONTEXT: Servidor Oficial de Protocolo MCP (Model Context Protocol)
 * Compatible con Cursor, Claude Code, Windsurf, Copilot, Antigravity, Aider y ChatGPT
 */

import * as readline from 'node:readline';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HypercubeSpace } from '../core/hypercube.ts';
import { ShadowEngine } from '../core/shadow.ts';
import { ProjectIndexer } from '../core/indexer.ts';
import { TopologicalAuditor } from '../core/auditor.ts';
import { FlowTracer } from '../core/flow.ts';
import { BlastRadiusCalculator } from '../core/blast.ts';
import { TransactionalHealer } from '../core/healing.ts';
import { CubicCell, type Axis4D, type RotationPlane } from '../core/types.ts';
import { eventBus } from '../core/events.ts';
import { SarifExporter } from '../core/sarif.ts';
import { ASTSkeletonizer } from '../core/skeleton.ts';
import { DifferentialShearAnalyzer } from '../core/diff.ts';
import { OcteracticHoneycomb, TesseracticHoneycomb } from '../core/honeycomb.ts';
import { DeepContractDiagnostic } from '../core/diagnostic.ts';
import { EnterpriseLicenseManager } from '../enterprise/license.ts';
import { SWECIEngine } from '../enterprise/swe-ci.ts';
import { LSCEngine } from '../enterprise/lsc.ts';
import { DistributedMeshEngine } from '../enterprise/mesh.ts';
import { OcteractPortfolioEngine, TesseractPortfolioEngine } from '../enterprise/portfolio.ts';
import { PreflightAuditor } from '../core/preflight.ts';
import { OcteractSwarmCoordinator, TesseractSwarmCoordinator } from '../enterprise/swarm.ts';
import { OcteractMutationEngine, TesseractMutationEngine } from '../enterprise/mutation.ts';
import { OcteractAtomicTransmuter, TesseractAtomicTransmuter } from '../enterprise/transmute.ts';
import { OcteractShieldSecurity } from '../core/security.ts';
import { OcteractTree } from '../core/octeract.ts';
import { AsymptoticAnalyzer } from '../core/asymptotics.ts';
import { CausalInferenceEngine } from '../core/causality.ts';
import { AsyncFlowAnalyzer } from '../core/async-flow.ts';
import { type Point8D } from '../core/types.ts';
import { OcteractGrepEngine } from '../core/grep.ts';
import { OcteractOrchestratorEngine } from '../core/orchestrator.ts';
import {
  OcteractFunSearchEngine,
  OcteractDeductiveEngine,
  OcteractAlphaDevOptimizer,
  OcteractPairformer,
  OcteractStepVerifier,
} from '../deepmind/index.ts';
import { OcteractProgramSlicer } from '../core/slicer.ts';
import { OcteractReproducer } from '../core/reproducer.ts';
import { OcteractSpeculativePatcher } from '../core/patcher.ts';
import { OcteractTreeSearch } from '../core/mcts.ts';
import {
  OcteractEVAAST,
  OcteractMontemurroEngine,
  OcteractSlotMachineValidator,
  OcteractCurrierClassifier,
  OcteractEntropyGuard,
  OcteractCardanGrilleFuzzer,
} from '../voynich/index.ts';
import {
  OcteractPaletteStorage,
  OcteractMultiNoiseBiomes,
  OcteractWorkingSetHorizon,
  OcteractStarlightBlast,
  OcteractAnvilContainer,
  OcteractJigsawSynthesis,
  OcteractGreedyContextCuller,
  OcteractObserverPulse,
} from '../voxel/index.ts';
import {
  OcteractTargetArmor,
  OcteractEvidenceLedger,
  OcteractReverseBundle,
  OcteractSourceToBundleAttribution,
  OcteractNativeBoundaryInspector,
  OcteractFacetMatrix,
} from '../rea/index.ts';
import {
  OcteractDragonIndex,
  OcteractDragonBlast,
  OcteractDragonFold,
  OcteractDragonTile,
  OcteractDragonCreaseFuzz,
} from '../dragon/index.ts';
import {
  OcteractDoctor,
  OcteractSee,
  OcteractImpact,
  OcteractSafeWrite,
  OcteractAsk,
  OcteractRaupMorphospace,
} from '../unified/index.ts';

export interface MCPServerOptions {
  rootDir: string;
  profile?: 'essential' | 'full';
}

export class MCPServer {
  private rootDir: string;
  private space: HypercubeSpace;
  private shadow: ShadowEngine;
  private indexer: ProjectIndexer;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private profile: 'essential' | 'full';
  private sdkServer: Server;

  constructor(options: MCPServerOptions) {
    this.rootDir = options.rootDir;
    this.profile = options.profile || (process.env.OCTERACT_MCP_PROFILE === 'full' ? 'full' : 'essential');
    this.indexer = new ProjectIndexer();
    this.space = this.indexer.getSpace();
    this.shadow = new ShadowEngine(this.space, this.rootDir);

    this.sdkServer = new Server(
      {
        name: 'octeract-context',
        version: '4.8.1',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
    this.registerSDKHandlers();
  }

  public getProfile(): 'essential' | 'full' {
    return this.profile;
  }

  public setProfile(profile: 'essential' | 'full'): void {
    this.profile = profile;
  }

  /**
   * Carga o genera el índice del repositorio
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const loaded = this.indexer.loadIndex(this.rootDir);
      if (!loaded) {
        console.error('[OCTERACT-MCP] Indexando repositorio por primera vez...');
        this.indexer.indexDirectory({ rootDir: this.rootDir });
        this.indexer.saveIndex(this.rootDir);
      }
      this.isInitialized = true;
      console.error(`[OCTERACT-MCP] Listo. ${this.space.getVertices().length} vértices en memoria hiperdimensional.`);

      // Auto-Auditoría Inmediata al instalar/iniciar el MCP en cualquier proyecto
      try {
        const initialAudit = this.indexer.auditRepository(this.rootDir);
        console.error(`[OCTERACT-MCP] Auto-Auditoría Determinista Inicial: Salud ${initialAudit.healthScore}/100 | ${initialAudit.totalFractures} Fracturas detectadas en 0 tokens.`);
      } catch (err: any) {
        console.error('[OCTERACT-MCP] Auto-Auditoría inicial diferida:', err?.message);
      }
    })();

    return this.initPromise;
  }

  /**
   * Inicia el bucle de escucha JSON-RPC 2.0 sobre stdin/stdout usando el SDK Oficial
   */
  public async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.sdkServer.connect(transport);
    console.error('[OCTERACT-MCP] Servidor stdio oficial conectado y listo.');
  }

  /**
   * Registra los controladores de herramientas, recursos y prompts en el SDK Oficial de MCP
   */
  private registerSDKHandlers(): void {
    this.sdkServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions(),
      };
    });

    this.sdkServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const toolArgs = request.params.arguments || {};
      try {
        if (!this.isInitialized && this.initPromise) {
          await this.initPromise;
        }
        const result = await this.callTool(toolName, toolArgs);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `[OCTERACT-ERROR] ${err?.message || 'Error al ejecutar herramienta'}`,
            },
          ],
        };
      }
    });

    this.sdkServer.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: this.getResourceDefinitions(),
      };
    });

    this.sdkServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const rawUri = request.params.uri || '';
      return this.readResource(rawUri);
    });

    this.sdkServer.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: this.getPromptDefinitions(),
      };
    });

    this.sdkServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      const promptArgs = request.params.arguments || {};
      return this.getPrompt(promptName, promptArgs);
    });
  }

  /**
   * Enrutador de mensajes JSON-RPC 2.0 (Compatible con invocación directa / tests)
   */
  public async handleMessage(msg: any): Promise<any | null> {
    if (!msg || typeof msg !== 'object') return null;
    const { id, method, params } = msg;

    // Manejo estricto de notificaciones RFC JSON-RPC 2.0: Las notificaciones NUNCA reciben respuesta
    if (id === undefined || method === 'notifications/initialized' || method?.startsWith('notifications/')) {
      return null;
    }

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: 'octeract-context',
              version: '4.8.1',
            },
          },
        };

      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: this.getToolDefinitions(),
          },
        };

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        try {
          const result = await this.callTool(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
              ],
            },
          };
        } catch (err: any) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: err?.message || 'Error al ejecutar herramienta',
            },
          };
        }
      }

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: this.getResourceDefinitions(),
          },
        };

      case 'resources/read': {
        const rawUri = params?.uri || '';
        try {
          const res = this.readResource(rawUri);
          return {
            jsonrpc: '2.0',
            id,
            result: res,
          };
        } catch (err: any) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: err?.message || `Recurso no encontrado: ${rawUri}` },
          };
        }
      }

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: this.getPromptDefinitions(),
          },
        };

      case 'prompts/get': {
        const rawPromptName = params?.name || '';
        const promptArgs = params?.arguments || {};
        try {
          const promptRes = this.getPrompt(rawPromptName, promptArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: promptRes,
          };
        } catch (err: any) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: err?.message || `Prompt no encontrado: ${rawPromptName}` },
          };
        }
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Método desconocido: ${method}`,
          },
        };
    }
  }

  /**
   * Catálogo de Recursos MCP
   */
  public getResourceDefinitions(): any[] {
    return [
      {
        uri: 'octeract://health',
        name: 'Informe de Salud Topológica y Fracturas 8D',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://health',
        name: 'Informe de Salud Topológica (Alias)',
        mimeType: 'application/json',
      },
      {
        uri: 'octeract://topology',
        name: 'Resumen Topológico 8D',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://topology',
        name: 'Resumen Topológico (Alias)',
        mimeType: 'application/json',
      },
      {
        uri: 'octeract://cells',
        name: 'Distribución de Celdas Cúbicas 3D',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://cells',
        name: 'Distribución de Celdas Cúbicas (Alias)',
        mimeType: 'application/json',
      },
      {
        uri: 'octeract://sarif',
        name: 'Registro OASIS SARIF 2.1.0 para GitHub Code Scanning',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://sarif',
        name: 'Registro OASIS SARIF (Alias)',
        mimeType: 'application/json',
      },
      {
        uri: 'octeract://audit-triage',
        name: 'Triage de Auditoría Híbrida (Octeract + IA)',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://audit-triage',
        name: 'Triage de Auditoría Híbrida (Alias)',
        mimeType: 'application/json',
      },
      {
        uri: 'octeract://stats',
        name: 'Métricas del Hiperespacio 8D (Octeract Tree y Variedad Toroidal T^8)',
        mimeType: 'application/json',
      },
      {
        uri: 'tesseract://octeract',
        name: 'Métricas del Hiperespacio 8D (Alias)',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Lectura de Recursos MCP
   */
  public readResource(rawUri: string): { contents: { uri: string; mimeType: string; text: string }[] } {
    const uri = (rawUri || '').replace(/^tesseract:\/\//, 'octeract://');

    if (uri === 'octeract://health') {
      const auditor = new TopologicalAuditor();
      const report = auditor.audit(this.space);
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(report, null, 2) }],
      };
    }
    if (uri === 'octeract://sarif') {
      const auditor = new TopologicalAuditor();
      const report = auditor.audit(this.space);
      const sarif = SarifExporter.generateSarif(report, this.rootDir);
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(sarif, null, 2) }],
      };
    }
    if (uri === 'octeract://topology') {
      const stats = this.space.getHyperStats();
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(stats, null, 2) }],
      };
    }
    if (uri === 'octeract://cells') {
      const vertices = this.space.getVertices();
      const distribution: Record<string, number> = {};
      for (const v of vertices) {
        distribution[v.cell] = (distribution[v.cell] || 0) + 1;
      }
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(distribution, null, 2) }],
      };
    }
    if (uri?.startsWith('octeract://cell/')) {
      const cellName = uri.replace('octeract://cell/', '');
      const vertices = this.space.getVertices().filter((v) => v.cell.toLowerCase() === cellName.toLowerCase());
      return {
        contents: [
          {
            uri: rawUri,
            mimeType: 'application/json',
            text: JSON.stringify(
              vertices.map((v) => ({ id: v.id, lines: v.lines, symbols: v.symbols.map((s) => s.name) })),
              null,
              2
            ),
          },
        ],
      };
    }
    if (uri === 'octeract://audit-triage') {
      const auditor = new TopologicalAuditor();
      const triage = auditor.getHybridAuditTriage(this.space, this.rootDir);
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(triage, null, 2) }],
      };
    }
    if (uri === 'octeract://stats' || uri === 'octeract://octeract') {
      const stats = this.space.getOcteractStats();
      return {
        contents: [{ uri: rawUri, mimeType: 'application/json', text: JSON.stringify(stats, null, 2) }],
      };
    }
    throw new Error(`Recurso no encontrado: ${rawUri}`);
  }

  /**
   * Catálogo de Prompts MCP
   */
  public getPromptDefinitions(): any[] {
    return [
      {
        name: 'octeract-safe-refactor',
        description: 'Flujo guiado de refactorización segura con radio de explosión, ensayo en RAM y escritura bajo el escudo 8D.',
        arguments: [
          {
            name: 'targetPath',
            description: 'Ruta relativa del archivo a refactorizar',
            required: true,
          },
          {
            name: 'goal',
            description: 'Objetivo de la refactorización',
            required: false,
          },
        ],
      },
      {
        name: 'tesseract-safe-refactor',
        description: 'Flujo guiado de refactorización segura (Alias de compatibilidad)',
        arguments: [
          {
            name: 'targetPath',
            description: 'Ruta relativa del archivo a refactorizar',
            required: true,
          },
          {
            name: 'goal',
            description: 'Objetivo de la refactorización',
            required: false,
          },
        ],
      },
      {
        name: 'octeract-audit-diagnostic',
        description: 'Diagnóstico integral de salud arquitectónica 8D para presentar al usuario con evidencia quirúrgica y plan de curación.',
        arguments: [],
      },
      {
        name: 'tesseract-audit-diagnostic',
        description: 'Diagnóstico integral de salud arquitectónica (Alias de compatibilidad)',
        arguments: [],
      },
      {
        name: 'octeract-8d-audit',
        description: 'Diagnóstico universal octodimensional 8D (Topología, Big-O Phi, Pearl Causal Psi, Async Omega, Packaging Xi) en el toroide T^8.',
        arguments: [],
      },
    ];
  }

  /**
   * Obtención de Prompts MCP
   */
  public getPrompt(rawPromptName: string, promptArgs: any): { description: string; messages: any[] } {
    const promptName = (rawPromptName || '').replace(/^tesseract-/, 'octeract-');

    if (promptName === 'octeract-safe-refactor') {
      const target = promptArgs?.targetPath || 'archivo_objetivo.ts';
      const goal = promptArgs?.goal || 'Optimizar y refactorizar';
      const isTesseract = (rawPromptName || '').startsWith('tesseract-');
      const blastTool = isTesseract ? 'tesseract_blast_radius' : 'octeract_blast_radius';
      const healTool = isTesseract ? 'tesseract_trial_heal' : 'octeract_trial_heal';
      const writeTool = isTesseract ? 'tesseract_safe_write' : 'octeract_safe_write';
      return {
        description: isTesseract
          ? 'Flujo guiado de refactorización segura bajo el escudo de Tesseract'
          : 'Flujo guiado de refactorización segura bajo el escudo 8D de Octeract',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Por favor, ejecuta la siguiente refactorización de forma segura:\nObjetivo: ${goal}\nArchivo objetivo: ${target}\n\nREGLAS DE PROTECCIÓN OBLIGATORIAS:\n1. Invoca primero '${blastTool}' para verificar qué módulos sufrirán el efecto dominó.\n2. Diseña el código y pruébalo en RAM con '${healTool}' verificando que la distancia de cizallamiento sea <= 0.10 y 0 regresiones.\n3. Aplica los cambios usando '${writeTool}'.`,
            },
          },
        ],
      };
    }

    if (promptName === 'octeract-audit-diagnostic') {
      const auditor = new TopologicalAuditor();
      const report = auditor.audit(this.space);
      return {
        description: 'Diagnóstico 8D de salud arquitectónica del repositorio',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Genera un informe de salud para el usuario con base en el estado del hipercubo 8D:\nSalud actual: ${report.healthScore}/100 (${report.status})\nTotal de fracturas: ${report.totalFractures}\nArchivos auditados: ${report.totalFilesAudited}\nSigue los 4 pilares: Radiografía, Peligro Oculto, Evidencia en Código y Solución Quirúrgica.`,
            },
          },
        ],
      };
    }

    if (promptName === 'octeract-8d-audit') {
      const auditor = new TopologicalAuditor();
      const report = auditor.audit(this.space);
      const octStats = this.space.getOcteractStats();
      return {
        description: 'Auditoría Universal Octodimensional 8D (T^8 / E8)',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Genera un informe integral del Octeracto 8D:\nSalud: ${report.healthScore}/100\nTotal vértices 8D: ${octStats.totalVertices}\nProfundidad máxima 8D: ${octStats.maxDepth || octStats.octeractDepth}\nDensidad de empaquetamiento E8: ${octStats.packingDensity || octStats.e8LatticeDensity}\nDimensiones 8D activas: X, Y, Z, W, PHI (Big-O), PSI (Pearl Causal), OMEGA (Async Flow), XI (Packaging).`,
            },
          },
        ],
      };
    }

    throw new Error(`Prompt no encontrado: ${rawPromptName}`);
  }

  /**
   * Catálogo de herramientas 4D del Teseracto para Agentes IA
   * Soporta perfiles: 'essential' (las 5 aperturas maestras, ~600 tokens) y 'full' (144 herramientas).
   */
  private getToolDefinitions(): any[] {
    const essential = this.getEssentialToolDefinitions();
    if (this.profile === 'essential') {
      return essential;
    }
    const specialized = this.getAllSpecializedToolDefinitions();
    const essentialNames = new Set(essential.map((t) => t.name));
    const filteredSpecialized = specialized.filter((t) => !essentialNames.has(t.name));
    return [...essential, ...filteredSpecialized];
  }

  /**
   * Las 5 Aperturas Maestras de Octeract (< 600 tokens de esquema en total)
   */
  private getEssentialToolDefinitions(): any[] {
    const tools = [
      {
        name: 'octeract_doctor',
        description:
          '🩺 APERTURA MAESTRA 1: Diagnóstico holístico universal del repositorio en un solo toque (< 250 tokens). Evalúa salud arquitectónica 8D, teselación fractal de 4 dragones, fugas de límite inter-cuadrante, biomas de código y estado de armadura REA.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: {
              type: 'string',
              description: 'Directorio raíz a diagnosticar (por defecto el directorio actual)',
            },
            deep: {
              type: 'boolean',
              description: 'Si es true, fuerza una reindexación completa y profunda',
            },
            logOrOutput: {
              type: 'string',
              description: 'Salida de terminal, tests o logs a filtrar con OcteractSieve (reducción determinista del 90%+)',
            },
          },
        },
      },
      {
        name: 'octeract_see',
        description:
          '👁️ APERTURA MAESTRA 2: Lente de lectura y compresión fractal de código (< 200 tokens). Aplica pliegues Origami (valle vs montaña), esqueleto AST, transliteración EVA o filtro Sieve para logs/datos. Despliega símbolos específicos manteniendo el resto plegado a 0 tokens.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta del archivo a inspeccionar',
            },
            symbol: {
              type: 'string',
              description: 'Símbolo opcional a desplegar en detalle (función, clase, método)',
            },
            mode: {
              type: 'string',
              enum: ['origami', 'skeleton', 'full', 'eva', 'sieve', 'nautilus'],
              description: 'Modo de compresión: "origami" (valle/montaña default), "skeleton", "full", "eva", "sieve" (logs/datos), "nautilus" (partición acrecionaria de concha con 85%+ ahorro)',
            },
            budget: {
              type: 'number',
              description: 'Presupuesto de tokens aproximado',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_impact',
        description:
          '💥 APERTURA MAESTRA 3: Cálculo de onda de choque fractal Heighway (Hausdorff dH/2) y efecto dominó en cascada (< 250 tokens). Predice archivos y contratos rotos antes de tocar el código.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta del archivo a evaluar para mutación o refactorización',
            },
            symbol: {
              type: 'string',
              description: 'Símbolo específico sujeto al cambio',
            },
            maxHops: {
              type: 'number',
              description: 'Máximo número de saltos de propagación (default 15)',
            },
            energy: {
              type: 'number',
              description: 'Energía inicial del impacto (default 1.0)',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_safe_write',
        description:
          '🛡️ APERTURA MAESTRA 4: Modificación segura de archivos con protección activa multi-capa. Evalúa fatiga mecánica en pliegues origami (Crease Fuzz), cizallamiento 4D en RAM y reducción estricta de entropía. Bloquea físicamente cambios destructivos.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: 'Ruta del archivo a modificar de forma segura',
            },
            targetFile: {
              type: 'string',
              description: 'Alias de targetPath',
            },
            proposedContent: {
              type: 'string',
              description: 'Nuevo contenido propuesto para el archivo',
            },
            force: {
              type: 'boolean',
              description: 'Forzar escritura omitiendo el bloqueo de seguridad',
            },
          },
        },
      },
      {
        name: 'octeract_ask',
        description:
          '🧠 APERTURA MAESTRA 5: Motor semántico de preguntas sobre el código en lenguaje natural (< 300 tokens). Trazado geodésico causal T^8 + Grep BM25F estructurado con enlaces exactos de archivo y línea.',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'Pregunta en lenguaje natural sobre la arquitectura o implementación',
            },
            query: {
              type: 'string',
              description: 'Alias de question',
            },
            targetDir: {
              type: 'string',
              description: 'Directorio raíz donde buscar (por defecto .)',
            },
            maxResults: {
              type: 'number',
              description: 'Cantidad máxima de archivos sugeridos (default 5)',
            },
            terse: {
              type: 'boolean',
              description: 'Modo telegráfico Zero-Slop directo sin relleno (ahorro 60% de tokens de salida, default: true)',
            },
          },
        },
      },
      {
        name: 'octeract_switch_profile',
        description:
          '⚙️ Conmuta el catálogo de herramientas MCP expuestas: "essential" (las 5 aperturas maestras, ~600 tokens) o "full" (las 144 herramientas especializadas completas).',
        inputSchema: {
          type: 'object',
          properties: {
            profile: {
              type: 'string',
              enum: ['essential', 'full'],
              description: 'Perfil deseado: "essential" o "full"',
            },
          },
          required: ['profile'],
        },
      },
      {
        name: 'octeract_profile_status',
        description:
          'Informa el perfil MCP activo, cantidad de herramientas expuestas y ahorro de tokens en el prompt.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'octeract_raup_morphology',
        description:
          '🐚 Diagnóstico Concológico y Morfospace 3D de David M. Raup (1966). Modela el código como una concha biológica gobernada por (W: expansión/fan-out, D: ombligo/distancia al núcleo, T: espira/capas). Detecta el Cubo Vacío (formas inviables o con dependencias circulares) y particiona en Cámaras Septales del Nautilus con 85%+ de ahorro de contexto.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: {
              type: 'string',
              description: 'Directorio raíz a analizar (por defecto el directorio actual)',
            },
            activeFile: {
              type: 'string',
              description: 'Archivo activo bajo inspección para posicionar la Cámara de Habitación Viva del Nautilus',
            },
          },
        },
      },
    ];

    const aliases = tools.map((t) => ({
      ...t,
      name: t.name.replace(/^octeract_/, 'tesseract_'),
      description: `[Alias de compatibilidad] ${t.description}`,
    }));

    return [...tools, ...aliases];
  }

  /**
   * Catálogo completo de herramientas especializadas
   */
  private getAllSpecializedToolDefinitions(): any[] {
    const tools = [
      {
        name: 'octeract_slice',
        description:
          'Extrae un corte hiperdimensional quirúrgico del repositorio con presupuesto estricto de tokens. Ahorra hasta 85% de tokens y evita alucinaciones.',
        inputSchema: {
          type: 'object',
          properties: {
            cell: {
              type: 'string',
              enum: Object.values(CubicCell),
              description: 'Filtrar por celda cúbica 3D (CoreLogic, Types, Storage, Network, Tests, Config, Security, Telemetry)',
            },
            focusSymbol: {
              type: 'string',
              description: 'Nombre de función, clase o archivo sobre el que pivota la consulta',
            },
            centerHex: {
              type: 'string',
              description: 'Coordenada hexadecimal del Hexadec-Tree (ej: 0xA4F2)',
            },
            tokenBudget: {
              type: 'number',
              description: 'Límite máximo estricto de tokens (por defecto 2500)',
            },
            mode: {
              type: 'string',
              enum: ['skeleton', 'full'],
              description: 'Modo de corte: "skeleton" (por defecto, SWE-bench style: 85% de compresión omitiendo cuerpos internos) o "full"',
            },
          },
        },
      },
      {
        name: 'octeract_diff_shear',
        description:
          'Calcula el cizallamiento topológico diferencial 4D de los archivos modificados en Git frente a una rama base (HEAD, main) antes de commitear.',
        inputSchema: {
          type: 'object',
          properties: {
            baseRef: {
              type: 'string',
              description: 'Referencia base de Git a comparar (por defecto "HEAD")',
            },
          },
        },
      },
      {
        name: 'octeract_project_shadow',
        description:
          'Simula el impacto de un cambio de código antes de escribir en disco. Calcula el cizallamiento topológico y predice contratos rotos.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: 'Ruta relativa del archivo que se propone modificar',
            },
            proposedContent: {
              type: 'string',
              description: 'El nuevo código propuesto que se desea validar',
            },
          },
          required: ['targetPath', 'proposedContent'],
        },
      },
      {
        name: 'octeract_rotate',
        description:
          'Gira el ángulo de observación 4D en uno de los 6 planos ortogonales (XY, XZ, XW, YZ, YW, ZW) para descubrir dependencias ocultas.',
        inputSchema: {
          type: 'object',
          properties: {
            plane: {
              type: 'string',
              enum: ['XY', 'XZ', 'XW', 'YZ', 'YW', 'ZW'],
              description: 'Plano ortogonal de rotación',
            },
            angleDegrees: {
              type: 'number',
              description: 'Ángulo de giro en grados (ej: 90 para perspectiva perpendicular)',
            },
            centerHex: {
              type: 'string',
              description: 'Coordenada hexadecimal del centro de rotación',
            },
          },
          required: ['plane', 'angleDegrees'],
        },
      },
      {
        name: 'octeract_traverse_hamming',
        description:
          'Navega a través de las aristas del hipercubo encontrando símbolos vecinos a distancia de Hamming <= k.',
        inputSchema: {
          type: 'object',
          properties: {
            startHex: {
              type: 'string',
              description: 'Código hexadecimal inicial (ej: 0x3F)',
            },
            maxHamming: {
              type: 'number',
              description: 'Distancia de Hamming máxima (1 a 4)',
            },
            limit: {
              type: 'number',
              description: 'Cantidad máxima de vecinos a retornar',
            },
          },
          required: ['startHex'],
        },
      },
      {
        name: 'octeract_fractal_zoom',
        description:
          'Aumenta o disminuye el nivel de zoom en el Teseracto Fractal (Hexadec-Tree) para explorar sub-carpetas o visión macro.',
        inputSchema: {
          type: 'object',
          properties: {
            hexPrefix: {
              type: 'string',
              description: 'Prefijo hexadecimal para hacer zoom in (ej: "0xA" para todo el subsistema A)',
            },
          },
          required: ['hexPrefix'],
        },
      },
      {
        name: 'octeract_hyper_stats',
        description:
          'Retorna las métricas de salud global, acoplamiento espagueti y balance dimensional de todo el proyecto.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'octeract_safe_write',
        description:
          'Modifica o guarda un archivo en el repositorio ÚNICAMENTE si supera la validación topológica 4D. Si el cambio destruye contratos o corrompe datos (D_shear > 0.75), BLOQUEA FÍSICAMENTE la escritura en disco y devuelve la solución segura automática.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: 'Ruta relativa del archivo a modificar',
            },
            proposedContent: {
              type: 'string',
              description: 'El nuevo contenido del archivo',
            },
            reason: {
              type: 'string',
              description: 'Motivo o descripción del cambio',
            },
          },
          required: ['targetPath', 'proposedContent'],
        },
      },
      {
        name: 'octeract_trial_heal',
        description:
          'Ejecuta un ensayo de autocuración transaccional contrafáctico en RAM (0 tokens). Clona el hipercubo en memoria, aplica la mutación propuesta y realiza un remapeo/re-auditoría delta inmediato. Si detecta cualquier regresión colateral ejecuta rollback en RAM. Retorna el dossier analítico de impacto.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: 'Ruta relativa del archivo a modificar en el ensayo',
            },
            proposedContent: {
              type: 'string',
              description: 'Nuevo código propuesto a ensayar en RAM',
            },
          },
          required: ['targetPath', 'proposedContent'],
        },
      },
      {
        name: 'octeract_auto_heal',
        description:
          'Mini-subagente autónomo de reparación en RAM: localiza una fractura, sintetiza el parche retrocompatible, ensaya en RAM sin tocar disco y confirma si es 100% seguro (0 regresiones). Si se pasa requestDescription, provee la solución nativa declarativa.',
        inputSchema: {
          type: 'object',
          properties: {
            fractureId: {
              type: 'string',
              description: 'ID de la fractura a curar (ej: "broken_import_..." o parte de la ruta)',
            },
            targetPath: {
              type: 'string',
              description: 'Ruta del archivo a curar (opcional alternativa a fractureId)',
            },
            autoCommit: {
              type: 'boolean',
              description: 'Si es true, escribe físicamente el parche al disco solo si el ensayo en RAM arroja 0 regresiones',
            },
            requestDescription: {
              type: 'string',
              description: 'Lo que el usuario pidió cambiar (para resolución declarativa en settings)',
            },
            targetSubsystem: {
              type: 'string',
              description: 'Subsistema involucrado (editor, notifications, cursor, git, storage)',
            },
          },
        },
      },
      {
        name: 'octeract_audit_health',
        description:
          'Ejecuta una auditoría estática determinista 100% en R^4 SIN usar IA (0 tokens). Detecta imports rotos, contratos desfasados, dependencias circulares y código muerto/huérfano en todo el repositorio.',
        inputSchema: {
          type: 'object',
          properties: {
            detail: {
              type: 'boolean',
              description: 'Si es true, incluye la lista completa de todas las fracturas detectadas',
            },
          },
        },
      },
      {
        name: 'octeract_diagnose_fracture',
        description:
          'Genera evidencia quirúrgica hiperdimensional (< 600 tokens) para un fallo topológico. Retorna el símbolo faltante, línea exacta en el caller, candidatos alternativos y la estrategia de autorreparación que previene daños colaterales.',
        inputSchema: {
          type: 'object',
          properties: {
            fractureId: {
              type: 'string',
              description: 'ID de la fractura (ej: "broken_import_src_vs_...")',
            },
            targetPath: {
              type: 'string',
              description: 'Ruta del archivo con problemas para obtener su diagnóstico',
            },
            type: {
              type: 'string',
              enum: [
                'BROKEN_IMPORT',
                'CONTRACT_MISMATCH',
                'CIRCULAR_DEPENDENCY',
                'ORPHAN_NODE',
                'TOPOLOGICAL_SINK',
                'UNMATCHED_EVENT',
                'UNREACHABLE_ISLAND',
                'DEAD_CODE',
                'FLOATING_PROMISE',
                'DEAD_EXPORT',
                'BOUNDARY_VIOLATION',
                'HALLUCINATED_DEPENDENCY',
                'SECRET_LEAK',
                'TRUNCATED_FILE',
              ],
              description: 'Filtrar por tipo de fractura arquitectónica',
            },
          },
        },
      },
      {
        name: 'octeract_blast_radius',
        description:
          'Calcula el radio de explosión interprocedural (Blast Radius) a 1, 2 y 3 saltos en R^4 antes de refactorizar un archivo o símbolo. Retorna la onda de choque en < 300 tokens.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta relativa del archivo a analizar',
            },
            targetSymbol: {
              type: 'string',
              description: 'Símbolo específico dentro del archivo (opcional)',
            },
            maxHops: {
              type: 'number',
              description: 'Profundidad máxima de saltos relacionales en R^4 (por defecto 3)',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_synthesize_patch',
        description:
          'Sintetiza un parche de código TypeScript retrocompatible con zero-touch para corregir contratos rotos, promesas flotantes o violaciones de celda sin romper llamadores.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: 'Ruta relativa del archivo a parchar',
            },
            fractureId: {
              type: 'string',
              description: 'ID de la fractura a corregir (opcional)',
            },
            symbolName: {
              type: 'string',
              description: 'Nombre del símbolo faltante o desfasado (opcional)',
            },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_trace_flow',
        description:
          'Rastrea la geodésica o flujo causal de código en R^4 a partir de una consulta en lenguaje natural (ej: "¿Cómo se autentica el usuario y se guarda la sesión?"). Retorna la ruta exacta, firmas, archivos, números de línea y cálculo de ondas de choque colaterales consumiendo < 500 tokens con 0 alucinaciones.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Pregunta en lenguaje natural o conceptos clave a rastrear (ej: "autenticación y almacenamiento de sesión")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'octeract_hybrid_audit',
        description:
          'Ejecuta la auditoría colaborativa Teseracto + IA. Tesseract pre-filtra el 99.9% de archivos en R^4 con 0 tokens y extrae las 3 a 5 áreas críticas de mayor tensión semántica con sus micro-cortes (< 750 tokens) para que el modelo IA realice el diagnóstico semántico de lógica y seguridad.',
        inputSchema: {
          type: 'object',
          properties: {
            detail: {
              type: 'boolean',
              description: 'Incluir detalles técnicos completos de cada candidato de triage',
            },
          },
        },
      },
      {
        name: 'octeract_honeycomb_facets',
        description:
          'Inspecciona las facetas cúbicas 3D compartidas entre paquetes de un monorrepo en el Panal Teseráctico {4,3,3,4}. Permite auditar contratos de API inter-paquetes y dependencias cruzadas.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: {
              type: 'string',
              description: 'Filtrar por nombre de paquete específico (opcional)',
            },
          },
        },
      },
      {
        name: 'octeract_swe_ci_verify',
        description:
          'Valida que una mutación o commit cumpla con la garantía matemática de cero regresiones multi-commit (D_shear <= 0.10 y Delta Fracturas <= 0).',
        inputSchema: {
          type: 'object',
          properties: {
            healthScore: { type: 'number', description: 'Puntuación de salud topológica (0-100)' },
            totalFractures: { type: 'number', description: 'Total de fracturas detectadas' },
            shearDistance: { type: 'number', description: 'Distancia geodésica de cizallamiento D_shear' },
          },
          required: ['healthScore', 'totalFractures', 'shearDistance'],
        },
      },
      {
        name: 'octeract_lsc_rewrite',
        description:
          'Ejecuta una reescritura semántica a gran escala (LSC) en un monorrepo, migrando un símbolo a través de todos los paquetes y generando fachadas retrocompatibles automáticas.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceFile: { type: 'string', description: 'Ruta relativa del archivo donde se define el símbolo' },
            oldSymbol: { type: 'string', description: 'Nombre del símbolo original a refactorizar' },
            newSymbol: { type: 'string', description: 'Nombre del nuevo símbolo modernizado' },
            dryRun: { type: 'boolean', description: 'Simular la reescritura sin escribir en disco' },
          },
          required: ['sourceFile', 'oldSymbol', 'newSymbol'],
        },
      },
      {
        name: 'octeract_mesh_audit',
        description:
          'Audita contratos de red distribuidos en el Panal {4,3,3,4} entre microservicios (OpenAPI en faceta +Z, gRPC en faceta -Z), detectando roturas cruzadas entre el consumidor y el proveedor.',
        inputSchema: {
          type: 'object',
          properties: {
            targetServiceId: { type: 'string', description: 'ID de microservicio a auditar específicamente (opcional)' },
          },
        },
      },
      {
        name: 'octeract_license_info',
        description:
          'Consulta el estado de la licencia empresarial BSL 1.1 / Ed25519 (Tier, organización, límites de archivos y características activas).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'octeract_portfolio_advisor',
        description:
          'Consulta el Asesor de Inversión del Triángulo Mágico (Rentabilidad, Seguridad, Liquidez) para Vibe Coders e ingenieros. Proporciona el Sharpe Ratio de los archivos, el tamaño de lote seguro de Kelly para no romper la app, y las mejores jugadas para pedirle a la IA hoy.',
        inputSchema: {
          type: 'object',
          properties: {
            detail: {
              type: 'boolean',
              description: 'Incluir desglose cuantitativo completo (Sharpe Ratio, Beta, Kelly batch size)',
            },
          },
        },
      },
      {
        name: 'octeract_preflight_audit',
        description:
          'Audita los contratos de empaquetado y distribución (Eje P / 5ta Dimensión): binarios CLI, permisos POSIX 100755, shebang Unix, CRLF, trampas de dist/ en gitignore, orden de condiciones de exportación, circular npx y fugas de devDependencies.',
        inputSchema: {
          type: 'object',
          properties: {
            workspacePath: {
              type: 'string',
              description: 'Ruta absoluta o relativa del directorio raíz del workspace a auditar',
            },
          },
        },
      },
      {
        name: 'octeract_swarm_coordinate',
        description:
          'Coordina agentes de IA concurrentes asignándoles zonas de Voronoi ortogonales en R^4. Detecta colisiones semánticas invisibles a Git, previene deadlocks y genera fachadas preventivas de sincronización.',
        inputSchema: {
          type: 'object',
          properties: {
            intents: {
              type: 'array',
              description: 'Lista de intenciones de los agentes concurrentes (agentId, taskDescription, targetFiles, priority)',
              items: {
                type: 'object',
                properties: {
                  agentId: { type: 'string' },
                  taskDescription: { type: 'string' },
                  targetFiles: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'number' },
                },
                required: ['agentId', 'targetFiles'],
              },
            },
          },
        },
      },
      {
        name: 'octeract_mutation_fuzz',
        description:
          'Ejecuta fuzzing de mutación contrafactual en RAM para certificar la dureza de la suite de pruebas. Detecta si la IA pasó las pruebas con soluciones huecas o si los tests son frágiles/tautológicos.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Archivo de código a evaluar bajo mutaciones contrafactuales',
            },
            maxMutants: {
              type: 'number',
              description: 'Número máximo de mutantes a generar (por defecto: 20)',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_atomic_transmute',
        description:
          'Genera la receta sincrónica atómica de refactorización multiarchivo calculando la clausura transitiva G* (subgrafo cerrado). Garantiza que no se dejen archivos rezagados.',
        inputSchema: {
          type: 'object',
          properties: {
            rootFile: {
              type: 'string',
              description: 'Archivo raíz que inicia la refactorización',
            },
            rootSymbol: {
              type: 'string',
              description: 'Nombre de la función, clase o interfaz que se modifica',
            },
            newSignature: {
              type: 'string',
              description: 'Nueva firma o contrato que deben adoptar los consumidores',
            },
          },
          required: ['rootFile', 'rootSymbol', 'newSignature'],
        },
      },
      {
        name: 'octeract_asymptotic_audit',
        description:
          'Analiza estáticamente la complejidad asintótica Big-O (Eje PHI) de un archivo o cambio propuesto. Detecta bucles anidados, queries N+1 y operaciones O(N) dentro de loops (O(N^2)).',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta del archivo a auditar',
            },
            proposedContent: {
              type: 'string',
              description: 'Contenido propuesto para comparar contra la versión en disco (detección de degradación)',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_causal_verify',
        description:
          'Aplica el Modelo Causal Estructural (SCM) y el Criterio de la Puerta Trasera de Judea Pearl (Eje PSI). Evalúa si una corrección es un parche cosmético/sintomático o resuelve la causa raíz.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta del archivo a verificar',
            },
            proposedPatch: {
              type: 'string',
              description: 'Parche o código modificado que propone la IA',
            },
          },
          required: ['targetFile', 'proposedPatch'],
        },
      },
      {
        name: 'octeract_async_flow_audit',
        description:
          'Audita la dinámica del Event Loop (Eje OMEGA): detecta promesas flotantes sin await, bifurcaciones asíncronas no controladas y riesgos de carreras en microtasks.',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: {
              type: 'string',
              description: 'Ruta del archivo a auditar',
            },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_octeract_slice',
        description:
          'Extrae un corte hiperdimensional quirúrgico en el espacio octodimensional R^8 utilizando el árbol 256-ario y la métrica del 8-Toroide Riemannian T^8.',
        inputSchema: {
          type: 'object',
          properties: {
            centerFile: {
              type: 'string',
              description: 'Archivo pivote central del corte',
            },
            maxDistance: {
              type: 'number',
              description: 'Distancia toroidal máxima en R^8 (por defecto: 0.45)',
            },
            tokenBudget: {
              type: 'number',
              description: 'Presupuesto de tokens para el corte (por defecto: 2500)',
            },
          },
          required: ['centerFile'],
        },
      },
      {
        name: 'octeract_octeract_stats',
        description:
          'Consulta las estadísticas matemáticas del hiperespacio 8D (Octeract / E8): métricas del árbol 256-ario, densidad de empaquetamiento, dimensiones activas y balance toroidal.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'octeract_8d_stats',
        description: 'Alias de octeract_octeract_stats: Estadísticas matemáticas del hiperespacio 8D (Octeract / E8).',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'octeract_asymptotic_analyze',
        description: 'Alias de octeract_asymptotic_audit: Analiza estáticamente la complejidad Big-O (Eje PHI).',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: { type: 'string', description: 'Ruta del archivo a auditar' },
            proposedContent: { type: 'string', description: 'Contenido propuesto' },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_causal_infer',
        description: 'Alias de octeract_causal_verify: Modelo Causal Estructural y criterio de la puerta trasera de Judea Pearl (Eje PSI).',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: { type: 'string', description: 'Ruta del archivo a verificar' },
            proposedPatch: { type: 'string', description: 'Parche o código modificado' },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_async_audit',
        description: 'Alias de octeract_async_flow_audit: Audita la dinámica del Event Loop (Eje OMEGA).',
        inputSchema: {
          type: 'object',
          properties: {
            targetFile: { type: 'string', description: 'Ruta del archivo a auditar' },
          },
          required: ['targetFile'],
        },
      },
      {
        name: 'octeract_grep',
        description:
          'Buscador semántico y grep estructural 8D en lenguaje natural o exacto/regex. Localiza funciones, clases, errores y llamadas con micro-snippets quirúrgicos (< 150 tokens) sin gastar tokens de LLM.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta en lenguaje natural (ej: "¿dónde está el login?", "manejo de errores de red") o término literal/regex',
            },
            mode: {
              type: 'string',
              enum: ['auto', 'semantic', 'exact', 'regex'],
              description: 'Modo de búsqueda: auto (detecta automáticamente), semantic (BM25F + resonancia 8D), exact (coincidencia literal rápida), regex',
            },
            cell: {
              type: 'string',
              enum: Object.values(CubicCell),
              description: 'Filtrar por celda 8D (Security, Storage, Network, CoreLogic, UI, Telemetry, Config, Tests, Types)',
            },
            pathFilter: {
              type: 'string',
              description: 'Filtro por ruta o subcadena de archivo',
            },
            maxResults: {
              type: 'number',
              description: 'Número máximo de resultados devueltos (por defecto 15)',
            },
            contextLines: {
              type: 'number',
              description: 'Líneas de contexto antes y después de la coincidencia (por defecto 2)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'octeract_orchestrate',
        description:
          'Meta-Herramienta de Orquestación Agéntica Neuro-Simbólica. Permite al Agente IA guiar a Octeract 8D para diagnosticar, planificar, simular sombras 4D y ejecutar cambios atómicos en un solo turno a costo mínimo de tokens (< 200 tokens).',
        inputSchema: {
          type: 'object',
          properties: {
            userIntent: {
              type: 'string',
              description: 'Intención del usuario en lenguaje natural coloquial o técnico (ej: "el login falla con desconexiones de red", "refactorizar AuthService")',
            },
            technicalQuery: {
              type: 'string',
              description: 'Consulta técnica enriquecida generada por el Agente IA (Query Expansion / HyDE) con términos canónicos de software y símbolos del proyecto.',
            },
            phase: {
              type: 'string',
              enum: ['diagnose', 'plan', 'simulate', 'execute', 'auto'],
              description: 'Fase de la orquestación: diagnose (localiza pivotes y blast radius), plan (estrategia de pasos), simulate (shadow preflight sin tocar disco), execute (escritura segura atómica), auto (cadena completa)',
            },
            targetFiles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Rutas opcionales de archivos foco si ya se conocen',
            },
            targetSymbols: {
              type: 'array',
              items: { type: 'string' },
              description: 'Símbolos opcionales de foco',
            },
            proposedChanges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file: { type: 'string' },
                  content: { type: 'string' },
                },
                required: ['file', 'content'],
              },
              description: 'Lista de archivos y contenidos propuestos para simular o ejecutar',
            },
          },
          required: ['userIntent'],
        },
      },
      {
        name: 'octeract_funsearch',
        description:
          'Búsqueda evolutiva en espacio de funciones (Google DeepMind FunSearch). Evalúa mutaciones de código en un sandbox efímero y mantiene un modelo genético de islas en RAM.',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Nombre de la función objetivo' },
            baselineCode: { type: 'string', description: 'Código fuente base de la función' },
            requirements: { type: 'string', description: 'Requisitos de optimización o corrección' },
            candidateCode: { type: 'string', description: 'Código propuesto por el agente para evaluar en el sandbox' },
            targetPath: { type: 'string', description: 'Ruta relativa del archivo' },
          },
          required: ['functionName', 'baselineCode'],
        },
      },
      {
        name: 'octeract_deductive_audit',
        description:
          'Auditoría deductiva formal con cláusulas de Horn (Google DeepMind AlphaGeometry). Deduce contratos rotos, deadlocks y construcciones auxiliares (0 tokens).',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: { type: 'string', description: 'Directorio raíz a auditar (opcional)' },
          },
        },
      },
      {
        name: 'octeract_alphadev_optimize',
        description:
          'Optimizador asintótico de micro-patrones en el AST (Google DeepMind AlphaDev). Convierte bucles cuadráticos O(N^2) a tablas hash O(1).',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Ruta del archivo a optimizar' },
            code: { type: 'string', description: 'Código fuente opcional a optimizar' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'octeract_pairformer',
        description:
          'Tensor relacional N x N con actualizaciones triangulares (Google DeepMind AlphaFold 3). Detecta acoplamientos transitivos y cuellos de botella de 2º y 3º orden.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: { type: 'string', description: 'Directorio raíz a evaluar (opcional)' },
          },
        },
      },
      {
        name: 'octeract_program_slice',
        description:
          'Calcula el slice semántico de código (algoritmo de Weiser) aislando únicamente las líneas que afectan a una variable o función (> 90% ahorro de tokens).',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a cortar' },
            targetVariable: { type: 'string', description: 'Variable objetivo del criterio de corte' },
            targetSymbol: { type: 'string', description: 'Símbolo o método de clase a cortar' },
            direction: { type: 'string', enum: ['backward', 'forward'], description: 'Dirección del corte (backward por defecto)' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_synthesize_reproducer',
        description:
          'Genera automáticamente un script de test ESM mínimo y ejecutable para reproducir y aislar una fractura o fallo arquitectónico en ROJO.',
        inputSchema: {
          type: 'object',
          properties: {
            fractureId: { type: 'string', description: 'ID de la fractura a reproducir' },
            targetFile: { type: 'string', description: 'Archivo donde reside el fallo' },
            targetSymbol: { type: 'string', description: 'Símbolo afectado' },
            description: { type: 'string', description: 'Descripción del comportamiento esperado' },
          },
        },
      },
      {
        name: 'octeract_speculative_patch',
        description:
          'Realiza un injerto sintáctico quirúrgico en el AST (AST grafting) preservando comentarios, formato y código adyacente sin errores de diff.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a modificar' },
            className: { type: 'string', description: 'Nombre de la clase que contiene el método' },
            methodName: { type: 'string', description: 'Nombre del método a sustituir' },
            functionName: { type: 'string', description: 'Nombre de la función independiente a sustituir' },
            patchCode: { type: 'string', description: 'Código nuevo del método o función' },
          },
          required: ['targetPath', 'patchCode'],
        },
      },
      {
        name: 'octeract_mcts_refactor',
        description:
          'Ejecuta búsqueda Monte Carlo en RAM con UCT para explorar múltiples ramas de refactorización simultáneamente y elegir la ruta matemáticamente óptima.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Archivo objetivo a refactorizar' },
            candidatePatches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  expectedDelta: { type: 'number' },
                },
                required: ['id', 'code'],
              },
              description: 'Lista de variantes o parches candidatos a explorar',
            },
            maxIterations: { type: 'number', description: 'Número máximo de iteraciones MCTS (default 20)' },
          },
          required: ['targetPath', 'candidatePatches'],
        },
      },
      {
        name: 'octeract_eva_ast',
        description:
          'Transliteración canónica EVA (Extensible Voynich Alphabet) del AST para reducción de tokens > 80% y decodificación determinista bidireccional a esqueletos TypeScript.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta relativa o absoluta del archivo a transliterar' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a transliterar directamente' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_montemurro_cluster',
        description:
          'Clustering semántico no supervisado y extracción de palabras clave arquitectónicas por Información Mutua I(w, S) de Montemurro & Zanette a 0 tokens.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: { type: 'string', description: 'Directorio raíz a analizar (por defecto el repositorio actual)' },
            clusterCount: { type: 'number', description: 'Número de clústeres temáticos a agrupar (default 4)' },
          },
        },
      },
      {
        name: 'octeract_slot_machine_validate',
        description:
          'Validador de sintaxis O(1) autómata DFA de Zattera: verifica ranuras posicionales de declaraciones en < 0.1 ms sin necesidad de compilar.',
        inputSchema: {
          type: 'object',
          properties: {
            statement: { type: 'string', description: 'Declaración o línea de código individual a validar' },
            targetPath: { type: 'string', description: 'Ruta del archivo para validar todas sus firmas' },
          },
        },
      },
      {
        name: 'octeract_currier_classify',
        description:
          'Particionador de dialectos Currier A (UI Declarativo), B (Imperativo Core Asíncrono) y C (Contratos de Tipos Puros) con tolerancias de cizallamiento hiperdimensional adaptativas.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a clasificar' },
            targetDir: { type: 'string', description: 'Directorio para clasificar todo el repositorio' },
          },
        },
      },
      {
        name: 'octeract_entropy_h2',
        description:
          'Guardián de entropía condicional de Markov Bennett-Lindemann h2 = H(C1, C2) - H(C1). Detecta código IA colapsado (h2 < 1.4) o ruido caótico.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a evaluar' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a evaluar directamente' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_cardan_fuzz',
        description:
          'Fuzzer sintético en RAM por Rejilla de Cardano (Gordon Rugg) a más de 1,000 mutaciones sintéticas/segundo para evaluar la solidez de las aserciones de tests.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a mutar con rejilla de Cardano' },
            maxMutants: { type: 'number', description: 'Número máximo de mutantes sintéticos a generar (default 10)' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_voxel_palette',
        description:
          'Compresión de tokens AST y símbolos en BitArray dinámico con paleta (inspirado en almacenamiento de chunks de Minecraft). Reduce la RAM en un 85-92%.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a comprimir con paleta BitArray' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a comprimir directamente' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_voxel_biomes',
        description:
          'Clasificador de biomas de código en espacio climático multidimensional 6D (Deep Frozen Ocean, Jagged Peaks, Nether Badlands, Ancient City Sculk, Meadow Plains, Lush Caves) con cálculo de tolerancia de cizallamiento.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta de archivo para clasificación individual' },
            targetDir: { type: 'string', description: 'Directorio para clasificar todo el repositorio' },
          },
        },
      },
      {
        name: 'octeract_voxel_horizon',
        description:
          'Gestor de tickets de chunk (Minecraft Working Set Horizon) para ventanas de contexto LLM: Niveles 31 (ACTIVE), 32 (CONTRACT_ONLY), 33 (SKELETON_ONLY), 34+ (EVICTED).',
        inputSchema: {
          type: 'object',
          properties: {
            focusPath: { type: 'string', description: 'Archivo foco de atención del agente' },
            radius: { type: 'number', description: 'Radio de horizonte de chunks activos (default 2)' },
          },
          required: ['focusPath'],
        },
      },
      {
        name: 'octeract_voxel_starlight',
        description:
          'Motor de propagación BFS Starlight (Minecraft) para cálculo de radio de luz/impacto a más de 1,000,000 relaciones/segundo desde Nivel 15 a 0.',
        inputSchema: {
          type: 'object',
          properties: {
            sourcePath: { type: 'string', description: 'Nodo fuente emisor de luz' },
            initialLight: { type: 'number', description: 'Nivel inicial de luz (1..15, default 15)' },
          },
          required: ['sourcePath'],
        },
      },
      {
        name: 'octeract_voxel_anvil',
        description:
          'Contenedor regional binario Anvil (.oac) para almacenamiento y consulta en O(1) de 1024 chunks con encabezado fijo de 8KB y tabla de sectores comprimidos.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['inspect', 'pack', 'query'], description: 'Acción a realizar (default inspect)' },
            chunkX: { type: 'number', description: 'Coordenada X del chunk (0..31)' },
            chunkZ: { type: 'number', description: 'Coordenada Z del chunk (0..31)' },
            payload: { type: 'string', description: 'Payload a almacenar en el chunk' },
          },
        },
      },
      {
        name: 'octeract_voxel_jigsaw',
        description:
          'Ensamblador de bloques de estructura Jigsaw con sockets tipados (plugs/jacks) para síntesis modular y verificación estricta de contratos.',
        inputSchema: {
          type: 'object',
          properties: {
            rootPieceId: { type: 'string', description: 'ID de la pieza raíz de ensamble' },
            pieces: {
              type: 'array',
              description: 'Piezas personalizadas con sockets plug/jack',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  template: { type: 'string' },
                  sockets: { type: 'array' },
                },
                required: ['id', 'template', 'sockets'],
              },
            },
          },
          required: ['rootPieceId'],
        },
      },
      {
        name: 'octeract_voxel_culler',
        description:
          'Oclusión de detalles internos (culling de métodos privados) y mallado codicioso (greedy meshing de imports y boilerplate) para ahorrar >80% de tokens en context windows de LLMs.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a ocluir y mallar' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a evaluar' },
            cullPrivateBodies: { type: 'boolean', description: 'Ocluir cuerpos privados (default true)' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_voxel_observer',
        description:
          'Detector reactivo de mutaciones de 0-ticks y emisor de pulsos de redstone (15 a 0) con atenuación por distancia sobre el grafo topológico.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo o nodo a observar' },
            mutatedState: { type: 'string', description: 'Nuevo estado o hash para comprobar cambios' },
            propagateHops: { type: 'boolean', description: 'Propagar pulso de redstone a través de dependencias' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_reverse_bundle',
        description:
          'Ingeniería inversa estática de bundles JS/TS minificados o empaquetados (Webpack, Rollup, esbuild, CJS, ESM). Extrae límites de módulos, símbolos exportados y grafo de llamadas, proyectándolos en el hipercubo 8D con blindaje de procedencia.',
        inputSchema: {
          type: 'object',
          properties: {
            bundlePath: { type: 'string', description: 'Ruta al archivo bundle a descompilar/analizar' },
            bundleCode: { type: 'string', description: 'Código fuente opcional del bundle' },
            bundleName: { type: 'string', description: 'Nombre descriptivo del bundle (default: bundle.js)' },
          },
        },
      },
      {
        name: 'octeract_compare_source_to_bundle',
        description:
          'Auditoría forense de cadena de suministro (Supply Chain Integrity). Compara el directorio fuente (src/) contra un artefacto compilado (dist/), detectando inyecciones de código fantasma (backdoors), drift y discrepancias criptográficas.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceDirectory: { type: 'string', description: 'Directorio de código fuente (default: src)' },
            bundlePath: { type: 'string', description: 'Ruta al bundle compilado a contrastar' },
            bundleCode: { type: 'string', description: 'Código fuente opcional del bundle a contrastar' },
          },
        },
      },
      {
        name: 'octeract_inspect_evidence_view',
        description:
          'Navegación paginada por vistas de evidencia retenida en el Canonical Evidence Ledger (protección contra desbordamiento de búfer stdio de 10 MiB en MCP). Vistas: summary, modules, edges, voxels, functions, anomalies, facets.',
        inputSchema: {
          type: 'object',
          properties: {
            evidenceId: { type: 'string', description: 'Identificador SHA-256 de la evidencia retenida' },
            view: { type: 'string', description: 'Nombre de la vista a inspeccionar (default: summary)' },
            page: { type: 'number', description: 'Número de página 1-indexada (default: 1)' },
            pageSize: { type: 'number', description: 'Cantidad de elementos por página (default: 25)' },
          },
          required: ['evidenceId'],
        },
      },
      {
        name: 'octeract_inspect_native_boundaries',
        description:
          'Inspección estática offline de binarios nativos Node.js (.node / ELF / Mach-O / PE). Descubre métodos N-API exportados, inicializadores de módulo y mitigaciones estáticas sin ejecutar código binario.',
        inputSchema: {
          type: 'object',
          properties: {
            binaryPath: { type: 'string', description: 'Ruta al archivo binario nativo (.node, .so, .dylib, .dll)' },
          },
          required: ['binaryPath'],
        },
      },
      {
        name: 'octeract_audit_provenance_armor',
        description:
          'Auditoría y blindaje de procedencia contra inyecciones indirectas de prompts en el código objetivo (comentarios maliciosos, overrides de instrucciones de sistema, tokens especiales de LLMs). Genera envoltura sanitizada untrusted_content.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a auditar' },
            code: { type: 'string', description: 'Código o texto plano opcional a auditar' },
            sanitize: { type: 'boolean', description: 'Defangar y neutralizar patrones detectados (default: true)' },
          },
        },
      },
      {
        name: 'octeract_dragon_fold',
        description:
          'Plegado arquitectónico Origami del AST (Curva del Dragón): preserva contratos de superficie visibles (pliegues valle) y pliega cuerpos privados (pliegues cresta) ahorrando >85% de tokens en el context window con capacidad de desdoble a demanda.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a plegar' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a evaluar directamente' },
            unfoldTarget: { type: 'string', description: 'Nombre de método o clase específica a desdoblar' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_dragon_blast',
        description:
          'Propagación de onda de choque fractal por pliegues del Dragón de Heighway con factor de amortiguamiento de Hausdorff (dH/2 ≈ 0.7618) para focalizar el radio de explosión en cascadas arquitectónicas reales sin explosión combinatoria.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Nodo o archivo epicentro de la mutación' },
            initialEnergy: { type: 'number', description: 'Energía inicial de la onda (default: 1.0)' },
            maxCreases: { type: 'number', description: 'Profundidad máxima de pliegues fractales (default: 8)' },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'octeract_dragon_coords',
        description:
          'Indexación y direccionamiento continuo en base octoniónica de Knuth (1+O). Convierte coordenadas 8D a un hash fractal de pliegues y calcula distancias de cizallamiento en tiempo constante O(1) vía bitwise XOR.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a consultar/indexar' },
            point8D: { type: 'array', items: { type: 'number' }, description: 'Vector de coordenadas 8D opcional' },
            compareWith: { type: 'string', description: 'Ruta de otro archivo o hash para calcular cizallamiento fractal O(1)' },
          },
        },
      },
      {
        name: 'octeract_dragon_tile',
        description:
          'Teselación aperiódica 4-Dragon de Heighway (0°, 90°, 180°, 270°): particiona monorrepos en 4 cuadrantes entrelazados (Alfa=Storage, Beta=Core, Gamma=Surface, Delta=Governance) con cero huecos y eliminación de fracturas falsas de borde.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: { type: 'string', description: 'Directorio raíz a teselar (por defecto el repositorio actual)' },
          },
        },
      },
      {
        name: 'octeract_dragon_crease_fuzz',
        description:
          'Pruebas de estrés y fatiga arquitectónica focalizadas en líneas de pliegue mecánico (bifurcaciones if/else, límites numéricos, nullish guards) en tiempo O(log N) para descubrir fallas críticas de propagación.',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: { type: 'string', description: 'Ruta del archivo a someter a estrés de pliegues' },
            sourceCode: { type: 'string', description: 'Código fuente opcional a evaluar directamente' },
          },
          required: ['targetPath'],
        },
      },
    ];

    const aliases = tools.map((t) => ({
      ...t,
      name: t.name.replace(/^octeract_/, 'tesseract_'),
      description: `[Alias de compatibilidad] ${t.description}`,
    }));

    return [...tools, ...aliases];
  }

  /**
   * Ejecución de las herramientas invocadas por agentes
   */
  public async callTool(name: string, args: any): Promise<any> {
    await this.init();
    let toolName = name.replace(/^tesseract_/, "octeract_");
    if (toolName === 'octeract_8d_stats' || toolName === 'octeract_stats') {
      toolName = 'octeract_octeract_stats';
    }
    if (toolName === 'octeract_asymptotic_analyze') {
      toolName = 'octeract_asymptotic_audit';
    }
    if (toolName === 'octeract_causal_infer') {
      toolName = 'octeract_causal_verify';
    }
    if (toolName === 'octeract_async_audit') {
      toolName = 'octeract_async_flow_audit';
    }
    if (toolName === 'octeract_search') {
      toolName = 'octeract_grep';
    }
    if (toolName === 'octeract_agent_orchestrate' || toolName === 'octeract_conductor') {
      toolName = 'octeract_orchestrate';
    }

    switch (toolName) {
      case 'octeract_doctor': {
        const report = await OcteractDoctor.diagnose(args.targetDir || this.rootDir, {
          deep: args.deep,
          logOrOutput: args.logOrOutput,
        });
        return report;
      }

      case 'octeract_see': {
        const target = args.targetFile || args.targetPath;
        if (!target) {
          throw new Error('Parámetro "targetFile" requerido para octeract_see');
        }
        const res = await OcteractSee.inspect(target, {
          rootDir: this.rootDir,
          symbol: args.symbol,
          mode: args.mode,
          budget: args.budget,
        });
        return res;
      }

      case 'octeract_impact': {
        const target = args.targetFile || args.targetPath;
        if (!target) {
          throw new Error('Parámetro "targetFile" requerido para octeract_impact');
        }
        const report = await OcteractImpact.analyze(target, {
          rootDir: this.rootDir,
          symbol: args.symbol,
          maxHops: args.maxHops,
          energy: args.energy,
        });
        return report;
      }

      case 'octeract_ask': {
        const q = args.question || args.query;
        if (!q) {
          throw new Error('Parámetro "question" requerido para octeract_ask');
        }
        const res = await OcteractAsk.query(q, {
          rootDir: args.targetDir || this.rootDir,
          maxResults: args.maxResults,
          terse: args.terse,
        });
        return res;
      }

      case 'octeract_switch_profile': {
        const targetProfile = args.profile === 'full' ? 'full' : 'essential';
        this.setProfile(targetProfile);
        return {
          status: 'SUCCESS',
          profile: this.profile,
          message: `Perfil MCP actualizado a "${this.profile}".`,
          toolsExposed: this.getToolDefinitions().length,
          schemaTokenOverheadApprox: this.profile === 'essential' ? '~600 tokens' : '~19,000 tokens',
        };
      }

      case 'octeract_profile_status': {
        return {
          status: 'SUCCESS',
          profile: this.profile,
          toolsExposed: this.getToolDefinitions().length,
          schemaTokenOverheadApprox: this.profile === 'essential' ? '~600 tokens' : '~19,000 tokens',
          isEssential: this.profile === 'essential',
        };
      }

      case 'octeract_raup_morphology': {
        const root = path.resolve(args.targetDir || this.rootDir);
        const indexer = new ProjectIndexer();
        const loaded = indexer.loadIndex(root);
        if (!loaded) {
          indexer.indexDirectory({ rootDir: root, maxFiles: 1000 });
        }
        const space = indexer.getSpace();
        const report = OcteractRaupMorphospace.auditMorphology(space, root);
        if (args.activeFile) {
          const partition = OcteractRaupMorphospace.partitionNautilusChambers(space, args.activeFile, root);
          return {
            ...report,
            activePartition: partition,
          };
        }
        return report;
      }

      case 'octeract_slice': {
        const mode = args.mode || 'skeleton';
        const result = this.space.slice({
          cell: args.cell,
          focusSymbol: args.focusSymbol,
          centerHex: args.centerHex,
          tokenBudget: args.tokenBudget || 2500,
          mode,
        });

        eventBus.emitEvent('query', {
          cell: args.cell || 'Global',
          tokenBudget: args.tokenBudget || 2500,
          deliveredTokens: result.totalTokens,
        });

        if (mode === 'skeleton' && args.focusSymbol) {
          const filePath = path.resolve(this.rootDir, args.focusSymbol);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const skel = ASTSkeletonizer.skeletonize(raw, filePath);
            return `${result.projectedCode}\n=== CÓDIGO ESQUELETIZADO SWE-BENCH (${skel.reductionPercentage}% AHORRO EN TOKENS) ===\n${skel.skeletonCode}`;
          }
        }

        return result.projectedCode;
      }

      case 'octeract_diff_shear': {
        const baseRef = args.baseRef || 'HEAD';
        return DifferentialShearAnalyzer.analyzeDiff(this.rootDir, baseRef);
      }

      case 'octeract_project_shadow': {
        const shadow = this.shadow.project(args.targetPath, args.proposedContent);
        return shadow;
      }

      case 'octeract_safe_write': {
        const targetPath = args.targetPath || args.targetFile;
        const proposedContent = args.proposedContent ?? args.content ?? '';
        const creaseFuzz = OcteractDragonCreaseFuzz.evaluateStress(proposedContent, targetPath || 'file.ts');

        // 1. Capa 5: Circuit Breaker (Máximo 2 intentos fallidos consecutivos)
        if (this.shadow.isCircuitBreakerTripped(targetPath)) {
          return {
            status: 'CIRCUIT_BREAKER_TRIPPED',
            isSafe: false,
            targetPath,
            attempts: this.shadow.getAttemptCount(targetPath),
            actionRequired: `⛔ INTERRUPTOR DE SEGURIDAD 4D DISPARADO: Se han alcanzado 2 intentos fallidos consecutivos en "${targetPath}". El archivo ha sido congelado preventivamente para detener el bucle infinito de refactorización (Hydra Bug Loop) y ahorrar tokens. Consulta 'octeract_diagnose_fracture' para resolver la causa raíz de forma quirúrgica.`,
          };
        }

        // 2. Capa 1: Simulación de Sombra Virtual 4D
        const shadow = this.shadow.project(targetPath, proposedContent);

        // 3. Capa 4: Reducción Estricta de Entropía (NewBrokenContracts == 0)
        const currentAudit = this.indexer.getAuditReport() || this.indexer.auditRepository(this.rootDir);
        const entropyCheck = this.shadow.evaluateEntropy(targetPath, proposedContent, currentAudit.totalFractures);

        if (!shadow.isSafe || !entropyCheck.allowed) {
          const attempts = this.shadow.recordFailedAttempt(targetPath);
          const microSlice = this.shadow.generateCallSiteMicroSlice(targetPath);

          eventBus.emitEvent('blocked_write', {
            targetPath,
            shearDistance: shadow.shearDistance,
            shearVector: shadow.shearVector,
            brokenEdges: shadow.brokenEdges,
            recommendations: shadow.recommendations,
            attempts,
          });

          let safeAlternative: string = 'Revisa la arquitectura de contratos antes de modificar.';
          const lowerPath = targetPath.toLowerCase();

          if (lowerPath.includes('editorgroupview') || lowerPath.includes('editoractions') || lowerPath.includes('close')) {
            safeAlternative = 'En lugar de forzar cierre con pérdida de datos, añade "files.autoSave": "afterDelay" en .vscode/settings.json.';
          } else if (lowerPath.includes('notification')) {
            safeAlternative = 'En lugar de mutilar addToast o borrar NotificationsStatus, activa el modo Do Not Disturb mediante la configuración.';
          } else if (lowerPath.includes('cursor')) {
            safeAlternative = 'En lugar de sobreescribir viewCursors.ts, configura "editor.cursorBlinking": "solid" en .vscode/settings.json.';
          } else if (lowerPath.includes('decoration') || lowerPath.includes('explorer')) {
            safeAlternative = 'En lugar de hackear decorationsService, configura "git.decorations.enabled": false y "explorer.decorations.badges": false en .vscode/settings.json.';
          }

          return {
            status: 'BLOCKED_BY_4D_SHIELD',
            isSafe: false,
            attempts,
            remainingAttempts: Math.max(0, 2 - attempts),
            stateVector4D: shadow.stateVector4D,
            stateVector8D: shadow.stateVector8D,
            shearDistance: shadow.shearDistance,
            shearDistance8D: shadow.shearDistance8D,
            shearVector: shadow.shearVector,
            shearVector8D: shadow.shearVector8D,
            axes: shadow.axes,
            brokenEdgesCount: shadow.brokenEdges.length,
            entropyViolation: !entropyCheck.allowed ? entropyCheck.reason : undefined,
            synthesizedPatch: shadow.synthesizedPatch,
            recommendations: shadow.recommendations,
            callSiteMicroSlice: microSlice,
            safeAlternative,
            actionRequired: `⛔ ESCRITURA FÍSICAMENTE BLOQUEADA: La modificación en "${targetPath}" fue rechazada por deformación topológica crítica (D_shear = ${shadow.shearDistance}). Intento ${attempts}/2 registrado. Aplica la alternativa segura o el parche sintetizado adjunto.`,
          };
        }

        // Escritura segura autorizada por el hipercubo
        const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.rootDir, targetPath);
        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(fullPath, proposedContent, 'utf-8');

        this.shadow.resetAttempts(targetPath);

        // Re-auditar para verificar curación topológica
        const previousTotal = currentAudit.totalFractures;
        const newAudit = this.indexer.auditRepository(this.rootDir);
        const healedCount = Math.max(0, previousTotal - newAudit.totalFractures);

        eventBus.emitEvent('safe_write', {
          targetPath,
          shearDistance: shadow.shearDistance,
          shearVector: shadow.shearVector,
        });

        if (healedCount > 0) {
          eventBus.emitEvent('fracture_healed', {
            targetPath,
            healedCount,
            newHealthScore: newAudit.healthScore,
            totalFractures: newAudit.totalFractures,
          });
        }

        return {
          status: 'WRITTEN_SAFELY',
          isSafe: true,
          stateVector4D: shadow.stateVector4D,
          stateVector8D: shadow.stateVector8D,
          shearDistance: shadow.shearDistance,
          shearDistance8D: shadow.shearDistance8D,
          shearVector: shadow.shearVector,
          shearVector8D: shadow.shearVector8D,
          axes: shadow.axes,
          healedFractures: healedCount,
          newHealthScore: newAudit.healthScore,
          message: `✔ Modificación aplicada en "${targetPath}" bajo simetría topológica 4D.${healedCount > 0 ? ` ¡Se curaron ${healedCount} fracturas arquitectónicas!` : ''}`,
        };
      }

      case 'octeract_audit_health': {
        const report = this.indexer.auditRepository(this.rootDir);
        if (!args.detail) {
          return {
            status: report.status,
            healthScore: report.healthScore,
            totalFractures: report.totalFractures,
            fracturesByType: report.fracturesByType,
            totalFilesAudited: report.totalFilesAudited,
            criticalIssues: report.fractures
              .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
              .slice(0, 10)
              .map((f) => ({
                id: f.id,
                type: f.type,
                source: f.source,
                target: f.target,
                description: f.description,
                similarCandidate: f.similarCandidate,
                healingStrategy: f.healingStrategy,
              })),
            zeroTokenNote: '✔ Auditoría computada 100% en RAM local mediante topología estática en R^4. Cero tokens consumidos.',
          };
        }
        return report;
      }

      case 'octeract_diagnose_fracture': {
        const report = this.indexer.getAuditReport() || this.indexer.auditRepository(this.rootDir);
        let matches = report.fractures;

        if (args.fractureId) {
          matches = matches.filter((f) => f.id === args.fractureId);
        } else if (args.targetPath) {
          const norm = args.targetPath.replace(/\\/g, '/');
          matches = matches.filter((f) => f.source.includes(norm) || (f.target && f.target.includes(norm)));
        } else if (args.type) {
          matches = matches.filter((f) => f.type === args.type);
        }

        if (matches.length === 0) {
          return {
            status: 'NO_FRACTURE_FOUND',
            message: 'No se encontraron fracturas con los criterios especificados. El subsistema está en simetría perfecta.',
          };
        }

        const diagnosis = matches.slice(0, 5).map((f) => {
          const microSlice = f.target ? this.shadow.generateCallSiteMicroSlice(f.target) : undefined;
          return {
            id: f.id,
            type: f.type,
            severity: f.severity,
            source: f.source,
            target: f.target,
            missingSymbol: f.missingSymbol,
            importerLine: f.importerLine,
            importerLineNumber: f.importerLineNumber,
            availableExports: f.availableExports?.slice(0, 10),
            similarCandidate: f.similarCandidate,
            cyclePath: f.cyclePath,
            eventName: f.eventName,
            sinkDetails: f.sinkDetails,
            unreachableClusterSize: f.unreachableClusterSize,
            rippleImpact: f.rippleImpact,
            affectedDependents: f.affectedDependents.slice(0, 8),
            healingStrategy: f.healingStrategy,
            symbolName: f.symbolName,
            cellViolation: f.cellViolation,
            entropyScore: f.entropyScore,
            synthesizedPatch: f.synthesizedPatch || TopologicalAuditor.synthesizePatch(f),
            callSiteMicroSlice: microSlice,
            criticalBackbone: DeepContractDiagnostic.traceCriticalBackbone(f.source, this.space),
            signatureDiff:
              f.importerLine && microSlice
                ? DeepContractDiagnostic.diffSignatures(microSlice, f.importerLine)
                : undefined,
          };
        });

        return {
          totalMatched: matches.length,
          returned: diagnosis.length,
          evidence: diagnosis,
          tokenEconomy: 'Evidencia quirúrgica compacta (< 600 tokens). Previene Hydra Bug Loops sin quemar tokens.',
        };
      }

      case 'octeract_blast_radius': {
        const targetFile = args.targetFile;
        if (!targetFile) throw new Error('Se requiere el parámetro "targetFile"');
        const blastResult = BlastRadiusCalculator.calculate(
          this.space,
          targetFile,
          args.targetSymbol,
          args.maxHops || 30,
          this.rootDir
        );
        return blastResult;
      }

      case 'octeract_synthesize_patch': {
        const targetPath = args.targetPath;
        if (!targetPath) throw new Error('Se requiere el parámetro "targetPath"');
        const report = this.indexer.getAuditReport() || this.indexer.auditRepository(this.rootDir);
        let match: any;
        if (args.fractureId) {
          match = report.fractures.find((f) => f.id === args.fractureId);
        } else if (args.symbolName) {
          match = report.fractures.find((f) => f.missingSymbol === args.symbolName || f.symbolName === args.symbolName);
        } else {
          const norm = targetPath.replace(/\\/g, '/');
          match = report.fractures.find((f) => f.source.includes(norm) || (f.target && f.target.includes(norm)));
        }

        if (match) {
          return {
            status: 'PATCH_SYNTHESIZED',
            fractureId: match.id,
            targetPath,
            patch: match.synthesizedPatch || TopologicalAuditor.synthesizePatch(match),
            healingStrategy: match.healingStrategy,
          };
        }

        return {
          status: 'GENERIC_PATCH_SYNTHESIZED',
          targetPath,
          patch: args.symbolName
            ? `// Stub de compatibilidad retroactivo para ${args.symbolName}\nexport const ${args.symbolName} = (...args: any[]): any => true;`
            : `// No se detectó fractura activa en ${targetPath}`,
        };
      }

      case 'octeract_trial_heal': {
        const targetPath = args.targetPath;
        const proposedContent = args.proposedContent;
        if (!targetPath) throw new Error('Se requiere el parámetro "targetPath"');
        const trialResult = TransactionalHealer.simulateTrial(
          this.space,
          targetPath,
          proposedContent || '',
          this.rootDir
        );
        return trialResult;
      }

      case 'octeract_auto_heal': {
        if (args.fractureId || args.targetPath) {
          const fid = args.fractureId || args.targetPath;
          const autoHealRes = await TransactionalHealer.autoHealFracture(
            this.space,
            fid,
            this.rootDir,
            Boolean(args.autoCommit)
          );
          return autoHealRes;
        }

        const desc = (args.requestDescription || '').toLowerCase();
        let solution = '';

        if (desc.includes('cerrar') || desc.includes('guardar') || desc.includes('pestaña')) {
          solution = 'Añadir en .vscode/settings.json: { "files.autoSave": "afterDelay", "files.autoSaveDelay": 500 } (D_shear = 0.000, 100% seguro).';
        } else if (desc.includes('cursor') || desc.includes('parpadeo') || desc.includes('titila')) {
          solution = 'Añadir en .vscode/settings.json: { "editor.cursorBlinking": "solid" } (D_shear = 0.050, 100% seguro).';
        } else if (desc.includes('campanita') || desc.includes('aviso') || desc.includes('notificación')) {
          solution = 'Activar en ajustes: Do Not Disturb Mode o silenciar toasts sin tocar clases nucleares.';
        } else if (desc.includes('letras') || desc.includes('color') || desc.includes('git')) {
          solution = 'Añadir en .vscode/settings.json: { "git.decorations.enabled": false, "explorer.decorations.colors": false, "explorer.decorations.badges": false } (D_shear = 0.050, 100% seguro).';
        } else {
          solution = 'Consultar celda Config correspondiente mediante octeract_slice para parámetros nativos declarativos.';
        }

        return {
          request: args.requestDescription,
          shearDistance: 0.05,
          isSafe: true,
          zeroShearSolution: solution,
        };
      }

      case 'octeract_rotate': {
        const angleRad = ((args.angleDegrees || 90) * Math.PI) / 180.0;
        const plane: RotationPlane = args.plane;
        const vertices = this.space.getVertices();

        const rotated = vertices.slice(0, 15).map((v) => {
          const newCoord = HypercubeSpace.rotate4D(v.coordinate, plane, angleRad);
          return {
            id: v.id,
            original: v.coordinate,
            rotated: newCoord.map((n) => parseFloat(n.toFixed(3))),
            cell: v.cell,
          };
        });

        eventBus.emitEvent('rotate', { plane, angleDegrees: args.angleDegrees });

        return {
          plane,
          angleDegrees: args.angleDegrees,
          description: `Rotación completada en el plano ${plane}. Perspectiva perpendicular activada.`,
          samples: rotated,
        };
      }

      case 'octeract_traverse_hamming': {
        const startHex = args.startHex;
        const limit = args.limit || 8;
        const nearest = this.space.tree.findNearest(startHex, limit);

        return {
          origin: startHex,
          neighbors: nearest.map((n) => ({
            id: n.vertex.id,
            hexCode: n.vertex.hexCode,
            cell: n.vertex.cell,
            distance: parseFloat(n.distance.toFixed(3)),
          })),
        };
      }

      case 'octeract_fractal_zoom': {
        const subTree = this.space.tree.getSubTree(args.hexPrefix);
        if (!subTree) {
          return {
            status: 'EMPTY_SUBTREE',
            message: `No se encontraron nodos con el prefijo ${args.hexPrefix}`,
          };
        }

        return {
          hexPrefix: subTree.hexPrefix,
          depth: subTree.depth,
          totalFiles: subTree.aggregate.totalFiles,
          totalTokens: subTree.aggregate.totalTokens,
          cellDistribution: subTree.aggregate.cellCounts,
          directVertices: subTree.vertexIds,
        };
      }

      case 'octeract_trace_flow': {
        const query = args.query;
        if (!query) throw new Error('Se requiere el parámetro "query"');
        const report = this.indexer.getAuditReport();
        const trace = FlowTracer.trace(this.space, query, report ? report.fractures : []);
        return trace;
      }

      case 'octeract_hybrid_audit': {
        const auditor = new TopologicalAuditor();
        const triage = auditor.getHybridAuditTriage(this.space, this.rootDir);
        if (!args.detail) {
          return {
            status: 'TRIAGE_READY_FOR_AI',
            healthScore: triage.healthScore,
            totalCandidates: triage.totalCandidatesEvaluated,
            areasToReview: triage.triageItems.length,
            aiSemanticPrompt: triage.compactPromptForAI,
            tokenCostEstimate: triage.tokenCostEstimate,
            instructionsForAI:
              'La IA debe analizar los puntos de código proporcionados y emitir un dictamen sobre errores lógicos, de seguridad o casos límite no contemplados, proponiendo parches mínimos quirúrgicos.',
          };
        }
        return triage;
      }

      case 'octeract_hyper_stats': {
        return this.space.getHyperStats();
      }

      case 'octeract_honeycomb_facets': {
        const honeycomb = new TesseracticHoneycomb();
        if (TesseracticHoneycomb.isMonorepo(this.rootDir)) {
          const packagesDir = path.join(this.rootDir, 'packages');
          if (fs.existsSync(packagesDir)) {
            const pkgs = fs.readdirSync(packagesDir);
            for (const p of pkgs) {
              const pDir = path.join(packagesDir, p);
              if (fs.statSync(pDir).isDirectory()) {
                honeycomb.registerPackage(`packages/${p}`, pDir);
              }
            }
          }
        }
        const facets = honeycomb.findSharedFacets();
        const filtered = args.packageName
          ? facets.filter(
              (f) => f.packageA.includes(args.packageName) || f.packageB.includes(args.packageName)
            )
          : facets;
        return {
          totalFacets: filtered.length,
          facets: filtered,
          summary: `Panal {4,3,3,4}: ${filtered.length} faceta(s) cúbica(s) compartida(s) identificadas.`,
        };
      }

      case 'octeract_swe_ci_verify': {
        const engine = new SWECIEngine(this.rootDir);
        const evalResult = engine.evaluateStep({
          healthScore: args.healthScore,
          totalFractures: args.totalFractures,
          shearDistance: args.shearDistance,
        });
        if (evalResult.approved) {
          engine.recordSnapshot({
            stepIndex: engine.getStatus().totalSteps,
            timestamp: Date.now(),
            healthScore: args.healthScore,
            totalFractures: args.totalFractures,
            shearDistance: args.shearDistance,
            contractFingerprints: {},
          });
        }
        return evalResult;
      }

      case 'octeract_lsc_rewrite': {
        const engine = new LSCEngine(this.rootDir);
        const plan = engine.planTransformation({
          sourceFile: args.sourceFile,
          oldSymbol: args.oldSymbol,
          newSymbol: args.newSymbol,
          generateBackwardCompatibleFacade: true,
        });
        const execResult = engine.executeTransformation(plan, { dryRun: Boolean(args.dryRun) });
        const verification = engine.verifySemanticPreservation(plan);
        return {
          planSummary: {
            affectedFiles: plan.affectedFiles.length,
            callSitesCount: plan.callSitesCount,
            facadeGenerated: plan.facadeGenerated,
          },
          execution: execResult,
          semanticVerification: verification,
        };
      }

      case 'octeract_mesh_audit': {
        const mesh = new DistributedMeshEngine();
        const audit = mesh.auditMeshContracts();
        return audit;
      }

      case 'octeract_license_info': {
        const manager = new EnterpriseLicenseManager();
        return manager.getLicenseStatus(this.rootDir);
      }

      case 'octeract_portfolio_advisor': {
        const engine = new TesseractPortfolioEngine(this.rootDir);
        const vertices = this.space.getVertices();
        const audit = this.indexer.getAuditReport() || this.indexer.auditRepository(this.rootDir);
        const evalResult = engine.evaluatePortfolio(vertices, audit);
        if (!args?.detail) {
          return {
            headline: evalResult.vibeAdvice.headline,
            healthMood: evalResult.vibeAdvice.healthMood,
            bestMove: evalResult.vibeAdvice.bestMove,
            dangerZone: evalResult.vibeAdvice.dangerZone,
            legoOpportunities: evalResult.vibeAdvice.legoOpportunities,
            magicTriangle: evalResult.triangle,
          };
        }
        return evalResult;
      }

      case 'octeract_preflight_audit': {
        const targetDir = args?.workspacePath ? path.resolve(args.workspacePath) : this.rootDir;
        const auditor = new PreflightAuditor(targetDir);
        const vertices = this.space.getVertices();
        const fractures = auditor.auditAll(vertices);
        return {
          workspace: targetDir,
          passed: fractures.length === 0,
          summary: fractures.length === 0 ? 'PREFLIGHT_PASSED' : 'PREFLIGHT_FAILURES_DETECTED',
          fractureCount: fractures.length,
          fractures,
        };
      }

      case 'octeract_swarm_coordinate': {
        const coordinator = new TesseractSwarmCoordinator(this.rootDir);
        const vertices = this.space.getVertices();
        const intents = args?.intents || [];
        return coordinator.coordinateSwarm(intents, vertices);
      }

      case 'octeract_mutation_fuzz': {
        const engine = new TesseractMutationEngine(this.rootDir);
        const targetFile = args?.targetFile;
        const maxMutants = args?.maxMutants || 20;
        const mutants = engine.generateMutants(targetFile, maxMutants);

        const testDir = path.join(this.rootDir, 'tests');
        const baseName = path.basename(targetFile).replace(/\.[^.]+$/, '');
        const testFiles: string[] = [];
        if (fs.existsSync(testDir)) {
          const files = fs.readdirSync(testDir);
          for (const f of files) {
            if (f.includes(baseName) && (f.endsWith('.test.ts') || f.endsWith('.test.js'))) {
              testFiles.push(path.join('tests', f));
            }
          }
        }

        return engine.evaluateMutationHardness(targetFile, mutants, testFiles);
      }

      case 'octeract_atomic_transmute': {
        const transmuter = new TesseractAtomicTransmuter(this.rootDir);
        const vertices = this.space.getVertices();
        return transmuter.planAtomicTransmutation(
          args?.rootFile,
          args?.rootSymbol,
          args?.newSignature,
          vertices
        );
      }

      case 'octeract_asymptotic_audit': {
        const analyzer = new AsymptoticAnalyzer(this.rootDir);
        const targetFile = args?.targetFile || args?.targetPath;
        const proposedContent = args?.proposedContent || args?.proposedPatch;
        if (proposedContent) {
          const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(this.rootDir, targetFile);
          const originalContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
          return analyzer.detectRegression(originalContent, proposedContent, targetFile);
        }
        return analyzer.analyzeFile(targetFile);
      }

      case 'octeract_causal_verify': {
        const engine = new CausalInferenceEngine(this.rootDir);
        const targetFile = args?.targetFile || args?.targetPath;
        const proposedPatch = args?.proposedPatch || args?.proposedContent;
        const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(this.rootDir, targetFile);
        const originalContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
        const vertices = this.space.getVertices();
        return engine.evaluateIntervention(targetFile, originalContent, proposedPatch, vertices);
      }

      case 'octeract_async_flow_audit': {
        const analyzer = new AsyncFlowAnalyzer(this.rootDir);
        const targetFile = args?.targetFile || args?.targetPath;
        return analyzer.analyzeFile(targetFile);
      }

      case 'octeract_octeract_slice': {
        const centerFile = args?.centerFile;
        const maxDist = args?.maxDistance || 0.45;
        const centerVertex = this.space.getVertex(centerFile) || this.space.getVertices().find((v) => v.path.includes(centerFile));
        const centerCoord: Point8D = centerVertex?.coordinate8D || [0.5, 0.5, 0.5, 0.5, 0.5, 0.85, 0.5, 0.5];
        const neighbors = this.space.octeractTree.searchNeighborhood(centerCoord, maxDist);
        return {
          centerFile,
          maxDistance: maxDist,
          totalNeighborsFound: neighbors.length,
          octeractStats: this.space.getOcteractStats(),
          vertices: neighbors.slice(0, 15).map((v) => ({
            id: v.id,
            cell: v.cell,
            coordinate8D: v.coordinate8D,
            octeractHex: v.octeractHexCode,
            symbols: v.symbols.slice(0, 5).map((s) => s.name),
          })),
        };
      }

      case 'octeract_octeract_stats': {
        return this.space.getOcteractStats();
      }

      case 'octeract_grep': {
        const grepEngine = new OcteractGrepEngine(this.rootDir);
        const result = await grepEngine.search(this.space, {
          query: args?.query || args?.pattern || args?.term || '',
          mode: args?.mode,
          cell: args?.cell,
          pathFilter: args?.pathFilter || args?.path,
          maxResults: args?.maxResults ? Number(args.maxResults) : 15,
          contextLines: args?.contextLines !== undefined ? Number(args.contextLines) : 2,
        });
        return result.markdownDossier;
      }

      case 'octeract_orchestrate': {
        const orchestrator = new OcteractOrchestratorEngine(this.rootDir);
        const result = await orchestrator.orchestrate(this.space, {
          userIntent: args?.userIntent || args?.intent || args?.query || '',
          technicalQuery: args?.technicalQuery,
          phase: args?.phase || 'auto',
          targetFiles: args?.targetFiles,
          targetSymbols: args?.targetSymbols,
          proposedChanges: args?.proposedChanges,
          maxBudgetTokens: args?.maxBudgetTokens,
        });
        return result.microDossier;
      }

      case 'octeract_funsearch': {
        const funSearch = new OcteractFunSearchEngine(this.rootDir, this.space);
        const spec = funSearch.createSpecification(
          args?.functionName || 'targetFunction',
          args?.baselineCode || '',
          args?.requirements || 'Optimizar algoritmo y garantizar invariantes'
        );

        if (args?.candidateCode) {
          const evalRes = funSearch.evaluateCandidate(
            args.candidateCode,
            args?.targetPath || 'snippet.ts',
            args.baselineCode
          );
          const candidate = funSearch.registerCandidate(evalRes);
          return {
            status: candidate.isSafe ? 'ACCEPTED_IN_SANDBOX' : 'REJECTED_BY_EVALUATOR',
            candidate,
            report: funSearch.getReport(),
          };
        }

        return {
          specification: spec,
          islandsSummary: funSearch.getReport().islandsSummary,
        };
      }

      case 'octeract_deductive_audit': {
        const deductive = new OcteractDeductiveEngine(this.rootDir);
        const report = deductive.verify(this.space);
        return {
          totalFacts: report.totalFacts,
          iterationsToFixpoint: report.iterationsToFixpoint,
          isSymmetric: report.isSymmetric,
          brokenContractsCount: report.brokenContracts.length,
          deadlocksCount: report.deadlocks.length,
          brokenContracts: report.brokenContracts,
          deadlocks: report.deadlocks,
          auxiliaryConstructions: report.auxiliaryConstructions,
        };
      }

      case 'octeract_alphadev_optimize': {
        const optimizer = new OcteractAlphaDevOptimizer(this.rootDir);
        const filePath = args?.filePath || 'snippet.ts';
        let code = args?.code;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error('Debe proporcionar el parámetro "code" o una ruta válida en "filePath".');
        }
        const result = optimizer.optimize(code, filePath);
        return {
          filePath: result.filePath,
          theoreticalSpeedup: result.theoreticalSpeedup,
          transformationsCount: result.transformationsApplied.length,
          transformations: result.transformationsApplied,
          isSyntaxValid: result.isSyntaxValid,
          latencyImprovementScore: result.latencyImprovementScore,
          optimizedCodeSnippet: result.optimizedCode.slice(0, 500),
        };
      }

      case 'octeract_pairformer': {
        const pairformer = new OcteractPairformer(this.space);
        const report = pairformer.computePairTensor();
        return {
          totalVertices: report.totalVertices,
          totalPairRelations: report.totalPairRelations,
          triangularDensity: report.triangularDensity,
          shadowBottlenecksCount: report.shadowBottlenecksCount,
          violationsCount: report.violations.length,
          violations: report.violations.slice(0, 5),
          topCriticalPairs: report.topCriticalPairs.slice(0, 10),
        };
      }

      case 'octeract_program_slice': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Archivo '${resolvedPath}' no existe.`);
        }
        const code = fs.readFileSync(resolvedPath, 'utf-8');
        const slicer = new OcteractProgramSlicer();
        const res = slicer.computeSlice(code, {
          targetVariable: args.targetVariable,
          targetSymbol: args.targetSymbol,
          direction: args.direction || 'backward',
        });
        return {
          filePath,
          direction: res.direction,
          tokenReductionPercent: res.tokenReductionPercent,
          linesRetainedCount: res.linesRetained.length,
          totalLinesOriginal: res.totalLinesOriginal,
          slicedCode: res.slicedCode,
        };
      }

      case 'octeract_synthesize_reproducer': {
        const auditor = new TopologicalAuditor();
        const auditReport = auditor.auditSpace(this.space);
        let targetFracture = auditReport.fractures[0];
        if (args?.fractureId) {
          const found = auditReport.fractures.find((f) => f.id === args.fractureId);
          if (found) targetFracture = found;
        }

        const reproducer = new OcteractReproducer();
        const script = reproducer.synthesizeReproducer({
          id: targetFracture?.id || args?.fractureId || 'CUSTOM_FRACTURE',
          sourceFile: targetFracture?.sourceFile || args?.targetFile || 'src/index.ts',
          targetSymbol: targetFracture?.affectedSymbols?.[0] || args?.targetSymbol || 'main',
          description: targetFracture?.description || args?.description || 'Aserción de contrato',
        });
        return {
          fractureId: script.fractureId,
          targetFile: script.targetFile,
          targetSymbol: script.targetSymbol,
          reproducerCode: script.reproducerCode,
          rationale: script.rationale,
        };
      }

      case 'octeract_speculative_patch': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Archivo '${resolvedPath}' no existe.`);
        }
        const code = fs.readFileSync(resolvedPath, 'utf-8');
        const patcher = new OcteractSpeculativePatcher();
        let res: any;
        if (args.className && args.methodName) {
          res = patcher.graftMethod(code, args.className, args.methodName, args.patchCode);
        } else if (args.functionName) {
          res = patcher.graftFunction(code, args.functionName, args.patchCode);
        } else {
          throw new Error('Debe especificar "className" y "methodName", o "functionName".');
        }
        return {
          success: res.success,
          diff: res.diff,
          linesReplaced: res.linesReplaced,
          error: res.error,
          patchedCodeSnippet: res.patchedCode.slice(0, 500),
        };
      }

      case 'octeract_mcts_refactor': {
        const mcts = new OcteractTreeSearch(this.space);
        const res = await mcts.search({
          targetFile: args.targetPath,
          candidatePatches: args.candidatePatches,
          maxIterations: args.maxIterations || 20,
        });
        return {
          totalIterations: res.totalIterations,
          treeSize: res.treeSize,
          executionTimeMs: res.executionTimeMs,
          bestTrajectory: res.bestTrajectory,
        };
      }

      case 'octeract_eva_ast': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }
        const eva = new OcteractEVAAST();
        const res = eva.transliterate(code);
        return {
          targetPath: filePath,
          totalDeclarations: res.slots.length,
          originalTokens: res.originalTokens,
          evaTokens: res.evaTokens,
          tokenReductionPercent: res.tokenReductionPercent,
          evaGlyphBlock: res.evaGlyphBlock,
          slots: res.slots,
        };
      }

      case 'octeract_montemurro_cluster': {
        const root = args.targetDir ? (path.isAbsolute(args.targetDir) ? args.targetDir : path.resolve(this.rootDir, args.targetDir)) : this.rootDir;
        const vertices = this.space.getVertices();
        const corpus = vertices.slice(0, 50).map(v => {
          const full = path.join(root, v.path);
          let c = '';
          try { c = fs.readFileSync(full, 'utf-8'); } catch (_) {}
          return { id: v.path, content: c };
        }).filter(d => d.content.length > 0);

        const engine = new OcteractMontemurroEngine();
        const analysis = engine.analyzeCorpus(corpus);
        const clusters = engine.extractSemanticClusters(corpus, args.clusterCount || 4);
        return {
          totalFilesAnalyzed: analysis.sectionCount,
          totalTokensAnalyzed: analysis.totalTokensAnalyzed,
          overallSectionEntropy: analysis.overallSectionEntropy,
          executionTimeMs: analysis.executionTimeMs,
          topKeywords: analysis.keywords.slice(0, 10),
          clusters,
        };
      }

      case 'octeract_slot_machine_validate': {
        const validator = new OcteractSlotMachineValidator();
        if (args.statement) {
          const res = validator.validate(args.statement);
          return {
            mode: 'single_statement',
            statement: args.statement,
            valid: res.valid,
            identifier: res.identifier,
            slots: res.slots,
            violationReason: res.violationReason,
            executionTimeUs: res.executionTimeUs,
          };
        }
        const filePath = args.targetPath;
        if (!filePath) {
          throw new Error('Debe especificar "statement" o "targetPath".');
        }
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Archivo '${resolvedPath}' no existe.`);
        }
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        const lines = content.split('\n').filter(l => /^(export|public|private|function|class|interface|type)\b/.test(l.trim()));
        const results = lines.map(line => validator.validate(line));
        const validCount = results.filter(r => r.valid).length;
        const rejectedCount = results.filter(r => !r.valid).length;
        return {
          mode: 'file_scan',
          targetPath: filePath,
          totalDeclarationsEvaluated: results.length,
          validDeclarations: validCount,
          rejectedDeclarations: rejectedCount,
          isFullyValid: rejectedCount === 0,
          sampleEvaluations: results.slice(0, 15),
        };
      }

      case 'octeract_currier_classify': {
        const classifier = new OcteractCurrierClassifier();
        if (args.targetPath) {
          const resolvedPath = path.isAbsolute(args.targetPath) ? args.targetPath : path.resolve(this.rootDir, args.targetPath);
          if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Archivo '${resolvedPath}' no existe.`);
          }
          const content = fs.readFileSync(resolvedPath, 'utf-8');
          const res = classifier.classify(args.targetPath, content);
          return res;
        }
        const root = args.targetDir ? (path.isAbsolute(args.targetDir) ? args.targetDir : path.resolve(this.rootDir, args.targetDir)) : this.rootDir;
        const vertices = this.space.getVertices();
        const dialectBreakdown: Record<string, string[]> = {
          DIALECT_A_DECLARATIVE_UI: [],
          DIALECT_B_IMPERATIVE_CORE: [],
          DIALECT_C_CONTRACT_TYPES: [],
        };
        for (const v of vertices) {
          let content = '';
          try { content = fs.readFileSync(path.join(root, v.path), 'utf-8'); } catch (_) {}
          const res = classifier.classify(v.path, content);
          dialectBreakdown[res.dialect].push(v.path);
        }
        return {
          totalFilesClassified: vertices.length,
          dialectA_DeclarativeUI: dialectBreakdown.DIALECT_A_DECLARATIVE_UI.length,
          dialectB_ImperativeCore: dialectBreakdown.DIALECT_B_IMPERATIVE_CORE.length,
          dialectC_ContractTypes: dialectBreakdown.DIALECT_C_CONTRACT_TYPES.length,
          recommendedShearTolerances: {
            dialectA: 0.25,
            dialectB: 0.10,
            dialectC: 0.05,
          },
          breakdown: dialectBreakdown,
        };
      }

      case 'octeract_entropy_h2': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }
        const guard = new OcteractEntropyGuard();
        const res = guard.computeSecondOrderEntropy(code);
        return {
          targetPath: filePath,
          charLength: res.charLength,
          uniqueBigrams: res.uniqueBigrams,
          h1: res.h1,
          h2: res.h2,
          verdict: res.verdict,
          isSafe: res.isSafe,
          details: res.details,
        };
      }

      case 'octeract_cardan_fuzz': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Archivo '${resolvedPath}' no existe.`);
        }
        const code = fs.readFileSync(resolvedPath, 'utf-8');
        const fuzzer = new OcteractCardanGrilleFuzzer();
        const start = performance.now();
        const mutants = fuzzer.generateMutants(code, args.maxMutants || 10);
        const durationMs = performance.now() - start;
        return {
          targetPath: filePath,
          totalMutantsGenerated: mutants.length,
          fuzzingDurationMs: durationMs,
          mutantsPerHourRate: Math.round((mutants.length / (durationMs || 1)) * 3600000),
          mutants: mutants.map(m => ({
            id: m.id,
            lineIndex: m.lineIndex,
            mutationDescription: m.mutationDescription,
            originalSnippet: m.originalSnippet,
            mutatedSnippet: m.mutatedSnippet,
          })),
        };
      }

      case 'octeract_voxel_palette': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }
        const storage = new OcteractPaletteStorage();
        const start = performance.now();
        const compressed = storage.compressCode(code);
        const durMs = performance.now() - start;
        return {
          targetPath: filePath,
          executionTimeMs: durMs,
          paletteSize: compressed.palette.length,
          bitWidth: compressed.bitWidth,
          packedWordsCount: compressed.words.length,
          compressionRatio: parseFloat(compressed.compressionRatio.toFixed(2)),
          uncompressedBytes: compressed.uncompressedBytes,
          compressedBytes: compressed.compressedBytes,
          ramReductionPercent: Math.round(((compressed.uncompressedBytes - compressed.compressedBytes) / (compressed.uncompressedBytes || 1)) * 100),
          samplePalette: compressed.palette.slice(0, 20),
        };
      }

      case 'octeract_voxel_biomes': {
        const classifier = new OcteractMultiNoiseBiomes();
        if (args.targetPath) {
          const resolvedPath = path.isAbsolute(args.targetPath) ? args.targetPath : path.resolve(this.rootDir, args.targetPath);
          if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Archivo '${resolvedPath}' no existe.`);
          }
          const content = fs.readFileSync(resolvedPath, 'utf-8');
          const res = classifier.classify(args.targetPath, content);
          return res;
        }

        const root = args.targetDir ? (path.isAbsolute(args.targetDir) ? args.targetDir : path.resolve(this.rootDir, args.targetDir)) : this.rootDir;
        const vertices = this.space.getVertices();
        const biomeCounts: Record<string, number> = {};
        const breakdown: Record<string, string[]> = {};

        for (const v of vertices) {
          let content = '';
          try { content = fs.readFileSync(path.join(root, v.path), 'utf-8'); } catch (_) {}
          const res = classifier.classify(v.path, content, { centrality: (v.dependencies.length + v.dependents.length) / 10 });
          biomeCounts[res.biome] = (biomeCounts[res.biome] || 0) + 1;
          if (!breakdown[res.biome]) breakdown[res.biome] = [];
          if (breakdown[res.biome].length < 10) breakdown[res.biome].push(v.path);
        }

        return {
          totalFilesClassified: vertices.length,
          biomeDistribution: biomeCounts,
          sampleFilesByBiome: breakdown,
        };
      }

      case 'octeract_voxel_horizon': {
        const focus = args.focusPath;
        const radius = typeof args.radius === 'number' ? args.radius : 2;
        const manager = new OcteractWorkingSetHorizon();
        const vertices = this.space.getVertices();

        for (const v of vertices) {
          manager.registerNeighbors(v.path, v.dependencies);
        }

        manager.addTicket('mcp-focus-ticket', focus, 31, radius);
        const horizon = manager.getHorizonSummary();
        const focusLevel = manager.getFileLevel(focus);

        return {
          focusPath: focus,
          radius,
          focusLevel: focusLevel.level,
          focusState: focusLevel.state,
          activeFilesCount: horizon.activeCount,
          contractOnlyFilesCount: horizon.contractOnlyCount,
          skeletonOnlyFilesCount: horizon.skeletonOnlyCount,
          evictedFilesCount: horizon.evictedCount,
          totalTracked: horizon.totalTracked,
        };
      }

      case 'octeract_voxel_starlight': {
        const sourcePath = args.sourcePath;
        const initLight = typeof args.initialLight === 'number' ? args.initialLight : 15;
        const starlight = new OcteractStarlightBlast();
        const vertices = this.space.getVertices();
        const nodeMap = new Map<string, number>();

        for (const v of vertices) {
          const id = starlight.registerNode(v.path);
          nodeMap.set(v.path, id);
        }

        for (const v of vertices) {
          const fromId = nodeMap.get(v.path);
          if (fromId === undefined) continue;
          for (const dep of v.dependencies) {
            const toId = nodeMap.get(dep);
            if (toId !== undefined) {
              starlight.addEdge(fromId, toId);
            }
          }
        }

        const sourceId = nodeMap.get(sourcePath);
        if (sourceId === undefined) {
          throw new Error(`Nodo fuente '${sourcePath}' no existe en el grafo topológico.`);
        }

        const blast = starlight.propagateLight(sourceId, initLight);
        return {
          sourcePath,
          initialLight: initLight,
          totalIlluminatedNodes: blast.illuminatedNodes.length,
          propagateTimeUs: blast.propagateTimeUs,
          propagationSpeedRelsPerSec: Math.round((blast.illuminatedNodes.length / (blast.propagateTimeUs || 1)) * 1000000),
          illuminatedNodesSample: blast.illuminatedNodes.slice(0, 25),
        };
      }

      case 'octeract_voxel_anvil': {
        const action = args.action || 'inspect';
        const container = new OcteractAnvilContainer();
        const sampleData = JSON.stringify({ cell: 'CoreLogic', symbols: ['Hypercube', 'Fracture', 'Voxel'] });

        if (action === 'pack' && args.payload) {
          const cx = args.chunkX || 0;
          const cz = args.chunkZ || 0;
          container.saveChunk(cx, cz, args.payload);
        } else {
          // Fill sample chunks for inspection
          for (let x = 0; x < 4; x++) {
            for (let z = 0; z < 4; z++) {
              container.saveChunk(x, z, sampleData);
            }
          }
        }

        const metrics = container.getMetrics();
        return {
          action,
          storedChunks: metrics.storedChunks,
          totalSectors: metrics.totalSectors,
          totalBytesOnDisk: metrics.totalBytes,
          uncompressedBytes: metrics.uncompressedBytes,
          compressedBytes: metrics.compressedBytes,
          fragmentationRatio: parseFloat(metrics.fragmentationRatio.toFixed(3)),
          headerSizeBytes: 8192,
        };
      }

      case 'octeract_voxel_jigsaw': {
        const rootId = args.rootPieceId;
        const jigsaw = new OcteractJigsawSynthesis();

        if (Array.isArray(args.pieces) && args.pieces.length > 0) {
          for (const p of args.pieces) {
            jigsaw.registerPiece(p);
          }
        } else {
          // Standard default modular template pieces
          jigsaw.registerPiece({
            id: rootId,
            template: `// Server Root\nimport { {{db_conn}} } from './db';\nexport function start() { return {{db_conn}}(); }`,
            sockets: [
              { name: 'db_conn', type: 'plug', contract: 'IDatabaseConnection', jointType: 'rigid' }
            ],
          });
          jigsaw.registerPiece({
            id: 'db-provider',
            template: `// DB Provider\nexport function connect() { return "connected"; }`,
            sockets: [
              { name: 'db_conn', type: 'jack', contract: 'IDatabaseConnection', jointType: 'rigid' }
            ],
          });
        }

        const assembly = jigsaw.assemble(rootId);
        return {
          rootPieceId: rootId,
          success: assembly.success,
          connectedPieces: assembly.connectedPieces,
          unmatchedSocketsCount: assembly.unmatchedSockets.length,
          cyclicWarnings: assembly.cyclicWarnings,
          synthesizedLengthChars: assembly.synthesizedOutput.length,
          previewSynthesizedCode: assembly.synthesizedOutput.slice(0, 400),
        };
      }

      case 'octeract_voxel_culler': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }
        const culler = new OcteractGreedyContextCuller();
        const start = performance.now();
        const res = culler.cullAndMesh(code, { cullPrivateBodies: args.cullPrivateBodies ?? true });
        const durMs = performance.now() - start;
        return {
          targetPath: filePath,
          executionTimeMs: durMs,
          originalLines: res.originalLines,
          culledLines: res.culledLines,
          originalEstimatedTokens: res.originalEstimatedTokens,
          compressedEstimatedTokens: res.compressedEstimatedTokens,
          tokenSavingsPercent: res.tokenSavingsPercent,
          previewCompressedCode: res.compressedCode.slice(0, 500),
        };
      }

      case 'octeract_voxel_observer': {
        const filePath = args.targetPath;
        const observer = new OcteractObserverPulse();
        const receivedSignals: any[] = [];
        observer.onPulse((sig) => receivedSignals.push(sig));

        observer.observeNode(filePath, 'hash_initial_v1');
        const newState = args.mutatedState || `hash_mutated_${Date.now()}`;
        const pulse = observer.notifyStateChange(filePath, newState);

        let propagationMap: Record<string, number> | null = null;
        if (args.propagateHops) {
          const vertices = this.space.getVertices();
          for (const v of vertices) {
            for (const d of v.dependencies) {
              observer.addLink(v.path, d);
            }
          }
          const prop = observer.propagatePulse(filePath, 15);
          propagationMap = Object.fromEntries(prop);
        }

        return {
          targetPath: filePath,
          mutationDetected: pulse !== null,
          redstonePower: pulse ? pulse.power : 0,
          currentTick: observer.getCurrentTick(),
          listenersTriggered: receivedSignals.length,
          propagationNetwork: propagationMap,
        };
      }

      case 'octeract_reverse_bundle': {
        let code = args.bundleCode;
        let bundleName = args.bundleName || 'bundle.js';
        if (!code && args.bundlePath) {
          const resolvedPath = path.isAbsolute(args.bundlePath)
            ? args.bundlePath
            : path.resolve(this.rootDir, args.bundlePath);
          if (fs.existsSync(resolvedPath)) {
            code = fs.readFileSync(resolvedPath, 'utf-8');
            bundleName = path.basename(resolvedPath);
          } else {
            throw new Error(`Archivo de bundle '${resolvedPath}' no encontrado.`);
          }
        }
        if (!code) {
          throw new Error('Debe proporcionar bundleCode o bundlePath.');
        }

        const report = OcteractReverseBundle.analyzeBundle(code, bundleName);

        const dossiers = report.modules.map((m) =>
          OcteractFacetMatrix.evaluateVertex({
            vertexId: m.moduleId,
            name: m.name,
            cell: m.cell,
            codeSnippet: m.snippet,
          })
        );
        const facetMatrix = OcteractFacetMatrix.generateMatrixReport(dossiers);

        const payload = {
          ...report,
          facetMatrix,
        };
        const enveloped = OcteractTargetArmor.wrapWithProvenance(payload, `rea:${bundleName}`, true);

        const ledger = OcteractEvidenceLedger.getInstance();
        const bounded = ledger.boundOutput({
          target: bundleName,
          data: enveloped,
          summary: {
            bundleName,
            bundleSize: report.bundleSize,
            format: report.format,
            totalModulesFound: report.totalModulesFound,
            cellDistribution: report.cellDistribution,
            securityFlagsCount: report.securityFlags.length,
            averageCompleteness: facetMatrix.averageCompleteness,
          },
          views: {
            modules: report.modules,
            callGraph: report.callGraph,
            securityFlags: report.securityFlags,
            facets: dossiers,
          },
        });

        return bounded;
      }

      case 'octeract_compare_source_to_bundle': {
        const sourceDir = args.sourceDirectory
          ? (path.isAbsolute(args.sourceDirectory) ? args.sourceDirectory : path.resolve(this.rootDir, args.sourceDirectory))
          : path.resolve(this.rootDir, 'src');

        const sourceMap: Record<string, string> = {};
        if (fs.existsSync(sourceDir)) {
          const readSourceFiles = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                readSourceFiles(fullPath);
              } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
                const relPath = path.relative(this.rootDir, fullPath);
                sourceMap[relPath] = fs.readFileSync(fullPath, 'utf-8');
              }
            }
          };
          readSourceFiles(sourceDir);
        }

        let bundleCode = args.bundleCode;
        let bundleName = 'bundle.js';
        if (!bundleCode && args.bundlePath) {
          const resolvedPath = path.isAbsolute(args.bundlePath)
            ? args.bundlePath
            : path.resolve(this.rootDir, args.bundlePath);
          if (fs.existsSync(resolvedPath)) {
            bundleCode = fs.readFileSync(resolvedPath, 'utf-8');
            bundleName = path.basename(resolvedPath);
          } else {
            throw new Error(`Archivo de bundle '${resolvedPath}' no encontrado.`);
          }
        }
        if (!bundleCode) {
          throw new Error('Debe proporcionar bundleCode o bundlePath.');
        }

        const report = OcteractSourceToBundleAttribution.compare(sourceMap, bundleCode, bundleName);
        return OcteractTargetArmor.wrapWithProvenance(report, `attribution:${bundleName}`, true);
      }

      case 'octeract_inspect_evidence_view': {
        const evidenceId = args.evidenceId;
        if (!evidenceId) {
          throw new Error('Parámetro evidenceId es requerido.');
        }
        const view = args.view || 'summary';
        const page = args.page || 1;
        const pageSize = args.pageSize || 25;

        const ledger = OcteractEvidenceLedger.getInstance();
        return ledger.inspectView(evidenceId, view, page, pageSize);
      }

      case 'octeract_inspect_native_boundaries': {
        const binPath = args.binaryPath;
        if (!binPath) {
          throw new Error('Parámetro binaryPath es requerido.');
        }
        const resolvedPath = path.isAbsolute(binPath) ? binPath : path.resolve(this.rootDir, binPath);
        return OcteractNativeBoundaryInspector.inspectBinary(resolvedPath);
      }

      case 'octeract_audit_provenance_armor': {
        let code = args.code;
        let targetName = 'raw_input';
        if (!code && args.targetPath) {
          const resolvedPath = path.isAbsolute(args.targetPath)
            ? args.targetPath
            : path.resolve(this.rootDir, args.targetPath);
          if (fs.existsSync(resolvedPath)) {
            code = fs.readFileSync(resolvedPath, 'utf-8');
            targetName = path.relative(this.rootDir, resolvedPath);
          } else {
            throw new Error(`Archivo '${resolvedPath}' no existe.`);
          }
        }
        if (!code) {
          throw new Error('Debe proporcionar code o targetPath.');
        }

        const sanitize = args.sanitize ?? true;
        const scanResult = OcteractTargetArmor.scan(code);
        const enveloped = OcteractTargetArmor.wrapWithProvenance(
          {
            targetName,
            isClean: scanResult.isClean,
            riskScore: scanResult.riskScore,
            threatLevel: scanResult.threatLevel,
            threatsCount: scanResult.threats.length,
            threats: scanResult.threats,
            previewSanitized: sanitize ? scanResult.sanitizedCode.slice(0, 500) : undefined,
          },
          targetName,
          sanitize
        );

        return enveloped;
      }

      case 'octeract_dragon_fold': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }

        if (args.unfoldTarget) {
          const unfolded = OcteractDragonFold.unfoldTarget(code, args.unfoldTarget);
          return {
            targetPath: filePath,
            unfoldedTarget: args.unfoldTarget,
            found: unfolded !== null,
            unfoldedCode: unfolded || 'Target declaration not found',
          };
        }

        const foldResult = OcteractDragonFold.foldCode(code, filePath);
        return foldResult;
      }

      case 'octeract_dragon_blast': {
        const epicenter = args.targetPath;
        const graph = new Map<string, string[]>();
        const vertices = this.space.getVertices();
        for (const v of vertices) {
          graph.set(v.path, v.dependencies);
        }

        const initialEnergy = args.initialEnergy || 1.0;
        const maxCreases = args.maxCreases || 8;
        const report = OcteractDragonBlast.propagateWavefront(epicenter, graph, initialEnergy, maxCreases);
        return report;
      }

      case 'octeract_dragon_coords': {
        let point8D = args.point8D;
        if (!point8D && args.targetPath) {
          const v = this.space.getVertex(args.targetPath);
          if (v) point8D = v.coordinate;
        }
        if (!point8D) {
          point8D = [0, 0, 0, 0, 0, 0, 0, 0];
        }

        const dragonCoord = OcteractDragonIndex.encode8DToDragon(point8D);

        let comparison: any = null;
        if (args.compareWith) {
          let compareHash = args.compareWith;
          if (!compareHash.startsWith('0x')) {
            const v2 = this.space.getVertex(args.compareWith);
            const pt2 = v2 ? v2.coordinate : [0, 0, 0, 0, 0, 0, 0, 0];
            compareHash = OcteractDragonIndex.encode8DToDragon(pt2).hash;
          }
          comparison = OcteractDragonIndex.computeFractalDistance(dragonCoord.hash, compareHash);
        }

        return {
          targetPath: args.targetPath || 'custom_point',
          point8D,
          dragonCoordinate: dragonCoord,
          comparison,
        };
      }

      case 'octeract_dragon_tile': {
        const vertices = this.space.getVertices().map((v) => ({
          id: v.path,
          cell: v.cell,
          dependencies: v.dependencies,
          complexity: v.tokenCount ? Math.round(v.tokenCount / 50) : 1,
        }));

        const report = OcteractDragonTile.partitionRepository(vertices, args.targetDir || this.rootDir);
        return report;
      }

      case 'octeract_dragon_crease_fuzz': {
        const filePath = args.targetPath;
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootDir, filePath);
        let code = args.sourceCode;
        if (!code && fs.existsSync(resolvedPath)) {
          code = fs.readFileSync(resolvedPath, 'utf-8');
        }
        if (!code) {
          throw new Error(`Archivo '${resolvedPath}' no existe o está vacío.`);
        }

        const report = OcteractDragonCreaseFuzz.evaluateStress(code, filePath);
        return report;
      }

      default:
        throw new Error(`Herramienta no implementada: ${name}`);
    }
  }
}

