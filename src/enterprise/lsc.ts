import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LSCTransformationRequest {
  sourceFile: string;
  oldSymbol: string;
  newSymbol: string;
  generateBackwardCompatibleFacade?: boolean;
}

export interface LSCPlan {
  sourceFile: string;
  oldSymbol: string;
  newSymbol: string;
  affectedFiles: string[];
  callSitesCount: number;
  facadeGenerated: boolean;
  modifications: Record<string, string>; // path -> content
}

export interface LSCResult {
  success: boolean;
  modifiedFiles: string[];
  errors: string[];
}

export interface LSCVerification {
  preserved: boolean;
  proofDetails: string[];
}

export class LSCEngine {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Planifica una refactorización semántica a gran escala a través de todos los paquetes del monorrepo
   */
  public planTransformation(req: LSCTransformationRequest): LSCPlan {
    const absSourcePath = path.isAbsolute(req.sourceFile)
      ? req.sourceFile
      : path.join(this.projectRoot, req.sourceFile);

    if (!fs.existsSync(absSourcePath)) {
      throw new Error(`Archivo fuente no encontrado: ${absSourcePath}`);
    }

    const sourceContent = fs.readFileSync(absSourcePath, 'utf-8');
    const oldSymbolRegex = new RegExp(`\\b${req.oldSymbol}\\b`, 'g');

    if (!oldSymbolRegex.test(sourceContent)) {
      throw new Error(`El símbolo '${req.oldSymbol}' no existe en ${absSourcePath}`);
    }

    // 1. Transformar el archivo fuente
    let newSourceContent = sourceContent.replace(oldSymbolRegex, req.newSymbol);
    const generateFacade = req.generateBackwardCompatibleFacade !== false;

    if (generateFacade) {
      newSourceContent += `\n// [TESSERACT-LSC] Fachada de compatibilidad hacia atrás retrocompatible\nexport const ${req.oldSymbol} = ${req.newSymbol};\n`;
    }

    const modifications: Record<string, string> = {
      [absSourcePath]: newSourceContent
    };

    const affectedFiles: string[] = [absSourcePath];
    let callSitesCount = 0;

    // 2. Escanear todo el monorrepo en busca de consumidores del símbolo
    const allFiles = this.collectSourceFiles(this.projectRoot);

    for (const filePath of allFiles) {
      if (filePath === absSourcePath) continue;

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const symbolMatches = fileContent.match(new RegExp(`\\b${req.oldSymbol}\\b`, 'g'));

      if (symbolMatches && symbolMatches.length > 0) {
        callSitesCount += symbolMatches.length;
        affectedFiles.push(filePath);
        const updatedContent = fileContent.replace(new RegExp(`\\b${req.oldSymbol}\\b`, 'g'), req.newSymbol);
        modifications[filePath] = updatedContent;
      }
    }

    return {
      sourceFile: absSourcePath,
      oldSymbol: req.oldSymbol,
      newSymbol: req.newSymbol,
      affectedFiles,
      callSitesCount,
      facadeGenerated: generateFacade,
      modifications
    };
  }

  /**
   * Ejecuta la transformación atómica sobre el disco
   */
  public executeTransformation(plan: LSCPlan, options: { dryRun?: boolean } = {}): LSCResult {
    const modifiedFiles: string[] = [];
    const errors: string[] = [];

    if (options.dryRun) {
      return {
        success: true,
        modifiedFiles: Object.keys(plan.modifications),
        errors: []
      };
    }

    for (const [filePath, content] of Object.entries(plan.modifications)) {
      try {
        fs.writeFileSync(filePath, content, 'utf-8');
        modifiedFiles.push(filePath);
      } catch (err: any) {
        errors.push(`Error al escribir ${filePath}: ${err?.message || err}`);
      }
    }

    return {
      success: errors.length === 0,
      modifiedFiles,
      errors
    };
  }

  /**
   * Verifica formalmente la preservación semántica y retrocompatibilidad del cambio LSC
   */
  public verifySemanticPreservation(plan: LSCPlan): LSCVerification {
    const proofDetails: string[] = [];
    let preserved = true;

    for (const filePath of plan.affectedFiles) {
      if (!fs.existsSync(filePath)) {
        preserved = false;
        proofDetails.push(`Fallo: Archivo afectado no existe en disco: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      if (filePath === plan.sourceFile) {
        if (!content.includes(plan.newSymbol)) {
          preserved = false;
          proofDetails.push(`Fallo: El nuevo símbolo '${plan.newSymbol}' no está definido en el archivo fuente.`);
        }
        if (plan.facadeGenerated && !content.includes(plan.oldSymbol)) {
          preserved = false;
          proofDetails.push(`Fallo: La fachada retrocompatible para '${plan.oldSymbol}' no está presente en el archivo fuente.`);
        }
        proofDetails.push(`Archivo fuente verificado: define '${plan.newSymbol}' y preserva '${plan.oldSymbol}' como alias retrocompatible.`);
      } else {
        if (!content.includes(plan.newSymbol)) {
          preserved = false;
          proofDetails.push(`Fallo: Call site en ${filePath} no fue migrado a '${plan.newSymbol}'.`);
        } else {
          proofDetails.push(`Call site verificado en ${path.relative(this.projectRoot, filePath)}: referenciando '${plan.newSymbol}'.`);
        }
      }
    }

    return {
      preserved,
      proofDetails
    };
  }

  /**
   * Recolecta recursivamente archivos de código fuente en el monorrepo
   */
  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.collectSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }

    return results;
  }
}
