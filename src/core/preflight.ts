/**
 * TESSERACT-CONTEXT: Preflight & Packaging Auditor (The 5th Dimension: P-Axis)
 * Auditoría determinista sin IA para detectar antes de publicar:
 * 1. CLI & OS Traps (chmod +x en git, shebangs, CRLF \r)
 * 2. Packaging & Tarball Traps (files array, dist stripping, publint rules, exports order)
 * 3. CI/CD Static Workflow Traps (circular npx calls, orphan artifact steps)
 * 4. Dependency Partitioning Traps (devDependencies import leaks, workspace:* protocol)
 * 5. Case-Sensitivity Collisions (Linux vs Windows/macOS filesystem case)
 * 6. Release & Version Desynchronization (package.json vs entry files)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { execSync } from 'node:child_process';
import { type TopologicalFracture, type HyperVertex } from './types.ts';

export interface PreflightReport {
  timestamp: number;
  totalChecks: number;
  totalFractures: number;
  fractures: TopologicalFracture[];
  status: 'PASSED' | 'BLOCKED_BY_PREFLIGHT';
}

export class PreflightAuditor {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Ejecuta la batería completa de auditoría de pre-vuelo y empaquetado
   */
  public auditAll(vertices: HyperVertex[] = []): TopologicalFracture[] {
    const fractures: TopologicalFracture[] = [];
    this.auditBinaries(fractures);
    this.auditPackagingAndExports(fractures);
    this.auditCIWorkflows(fractures);
    this.auditDependencyPartitioning(vertices, fractures);
    this.auditCaseSensitivity(vertices, fractures);
    this.auditReleaseSync(fractures);
    return fractures;
  }

  /**
   * 1. Trampas de Binarios CLI y Permisos del Sistema Operativo
   */
  public auditBinaries(fractures: TopologicalFracture[]): void {
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    let pkg: any;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      return;
    }

    if (!pkg.bin) return;

    const binMap: Record<string, string> =
      typeof pkg.bin === 'string'
        ? { [pkg.name || 'cli']: pkg.bin }
        : typeof pkg.bin === 'object'
        ? pkg.bin
        : {};

    for (const [binName, binRelPath] of Object.entries(binMap)) {
      if (typeof binRelPath !== 'string') continue;
      const absBin = path.resolve(this.rootDir, binRelPath);

      // A. Existencia física
      if (!fs.existsSync(absBin)) {
        fractures.push({
          id: `BIN_GHOST_${binName}`,
          type: 'BIN_EXEC_FRACTURE',
          severity: 'CRITICAL',
          source: 'package.json',
          target: binRelPath,
          description: `El binario CLI "${binName}" apunta a "${binRelPath}" pero el archivo no existe físicamente en el disco.`,
          healingStrategy: `Crear el archivo en "${binRelPath}" o corregir la ruta en package.json.`,
          rippleImpact: 5,
          affectedDependents: [],
        });
        continue;
      }

      let content = '';
      try {
        content = fs.readFileSync(absBin, 'utf8');
      } catch {
        continue;
      }

      const lines = content.split('\n');
      const firstLine = lines[0] || '';

      // B. Comprobación de Shebang
      if (!firstLine.trim().startsWith('#!/')) {
        fractures.push({
          id: `BIN_NO_SHEBANG_${binName}`,
          type: 'BIN_EXEC_FRACTURE',
          severity: 'HIGH',
          source: binRelPath,
          importerLineNumber: 1,
          importerLine: firstLine.slice(0, 80),
          description: `El binario CLI "${binRelPath}" carece de shebang ejecutable (ej. "#!/usr/bin/env node") en la primera línea.`,
          healingStrategy: `Añadir "#!/usr/bin/env node" en la línea 1 de "${binRelPath}".`,
          rippleImpact: 3,
          affectedDependents: [],
        });
      }

      // C. Corrupción de terminación de línea CRLF (\r)
      if (firstLine.includes('\r') || content.includes('\r\n')) {
        fractures.push({
          id: `BIN_CRLF_${binName}`,
          type: 'BIN_EXEC_FRACTURE',
          severity: 'CRITICAL',
          source: binRelPath,
          importerLineNumber: 1,
          importerLine: firstLine.slice(0, 80),
          description: `El binario CLI "${binRelPath}" contiene terminaciones de línea Windows (CRLF \\r). En Linux/Docker el kernel buscará "node\\r" y fallará con "No such file or directory".`,
          healingStrategy: `Convertir los finales de línea de CRLF a LF (formato UNIX).`,
          rippleImpact: 5,
          affectedDependents: [],
        });
      }

      // D. Comprobación de permisos en el índice de Git
      try {
        const gitLs = execSync(`git ls-files -s "${binRelPath}"`, {
          cwd: this.rootDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();

        if (gitLs && !gitLs.startsWith('100755')) {
          fractures.push({
            id: `BIN_NOT_EXEC_${binName}`,
            type: 'BIN_EXEC_FRACTURE',
            severity: 'CRITICAL',
            source: binRelPath,
            description: `El archivo "${binRelPath}" tiene modo ${gitLs.split(' ')[0]} en Git en lugar de 100755 (ejecutable). En Linux/macOS y runners de CI fallará con "EACCES: Permission denied" o exit code 127.`,
            healingStrategy: `Ejecutar "git update-index --chmod=+x ${binRelPath}" y "chmod +x ${binRelPath}".`,
            rippleImpact: 5,
            affectedDependents: [],
          });
        }
      } catch {
        // Fuera de un repo Git, validar permisos en sistema de archivos local
        try {
          const stat = fs.statSync(absBin);
          if ((stat.mode & 0o111) === 0) {
            fractures.push({
              id: `BIN_NOT_EXEC_FS_${binName}`,
              type: 'BIN_EXEC_FRACTURE',
              severity: 'HIGH',
              source: binRelPath,
              description: `El archivo "${binRelPath}" no tiene permisos de ejecución en el sistema de archivos.`,
              healingStrategy: `Ejecutar "chmod +x ${binRelPath}".`,
              rippleImpact: 3,
              affectedDependents: [],
            });
          }
        } catch {
          // Ignorar error de stat
        }
      }
    }
  }

  /**
   * 2. Contratos de Empaquetado y Exportación (publint & arethetypeswrong)
   */
  public auditPackagingAndExports(fractures: TopologicalFracture[]): void {
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    let pkg: any;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      return;
    }

    const gitignorePath = path.join(this.rootDir, '.gitignore');
    const npmignorePath = path.join(this.rootDir, '.npmignore');
    const hasGitignore = fs.existsSync(gitignorePath);
    const hasNpmignore = fs.existsSync(npmignorePath);

    // A. La Trampa de Dist Desaparecido (Disappearing dist trap)
    if (!Array.isArray(pkg.files) && !hasNpmignore && hasGitignore) {
      try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const ignoresDist = /(^|\n)\s*(\/?dist\/?|\/?build\/?)\s*($|\n)/m.test(gitignoreContent);
        const targetsDist =
          (typeof pkg.main === 'string' && pkg.main.includes('dist')) ||
          (typeof pkg.types === 'string' && pkg.types.includes('dist'));

        if (ignoresDist && targetsDist) {
          fractures.push({
            id: 'PACKAGING_DISAPPEARING_DIST',
            type: 'PACKAGING_EXPORT_FRACTURE',
            severity: 'CRITICAL',
            source: 'package.json',
            description: `Peligro de paquete vacío en NPM: no hay lista "files" ni ".npmignore", y ".gitignore" ignora "dist". NPM aplicará .gitignore como fallback y omitirá los archivos compilados del paquete publicado.`,
            healingStrategy: `Declarar explícitamente el array "files": ["dist", ...] en package.json.`,
            rippleImpact: 5,
            affectedDependents: [],
          });
        }
      } catch {
        // Ignorar
      }
    }

    // B. Desastre de Sobrescritura de .npmignore (Leaking secrets)
    if (hasNpmignore && hasGitignore) {
      try {
        const npmignoreContent = fs.readFileSync(npmignorePath, 'utf8');
        const sensitiveFiles = ['.env', '.env.local', 'credentials.json', 'secrets.json'];
        for (const secFile of sensitiveFiles) {
          if (fs.existsSync(path.join(this.rootDir, secFile))) {
            const inNpmignore = npmignoreContent.includes(secFile);
            if (!inNpmignore) {
              fractures.push({
                id: `PACKAGING_LEAK_NPMIGNORE_${secFile}`,
                type: 'SECRET_LEAK',
                severity: 'CRITICAL',
                source: '.npmignore',
                target: secFile,
                description: `Peligro de fuga de secretos: el archivo sensible "${secFile}" existe en disco y está en .gitignore, pero NO en .npmignore. Al existir .npmignore, NPM ignora .gitignore y empaquetará "${secFile}" en el tarball público.`,
                healingStrategy: `Añadir "${secFile}" a .npmignore o usar lista blanca "files" en package.json.`,
                rippleImpact: 5,
                affectedDependents: [],
              });
            }
          }
        }
      } catch {
        // Ignorar
      }
    }

    // C. Verificación de archivos destino en main, types, module
    const targetFields = ['main', 'types', 'module'];
    for (const field of targetFields) {
      if (typeof pkg[field] === 'string') {
        const targetRel = pkg[field];
        const targetAbs = path.resolve(this.rootDir, targetRel);
        if (!fs.existsSync(targetAbs)) {
          fractures.push({
            id: `EXPORT_MISSING_${field.toUpperCase()}`,
            type: 'PACKAGING_EXPORT_FRACTURE',
            severity: 'CRITICAL',
            source: 'package.json',
            target: targetRel,
            description: `El campo "${field}" apunta a "${targetRel}" pero el archivo no existe en el repositorio.`,
            healingStrategy: `Compilar el código a esa ruta o corregir el campo "${field}" en package.json.`,
            rippleImpact: 4,
            affectedDependents: [],
          });
        }
      }
    }

    // D. Orden de condiciones en exports (publint: import debe preceder a require, default al final)
    if (pkg.exports && typeof pkg.exports === 'object') {
      const inspectConditions = (conds: any, subpath: string) => {
        if (!conds || typeof conds !== 'object') return;
        const keys = Object.keys(conds);
        const defaultIdx = keys.indexOf('default');
        const importIdx = keys.indexOf('import');
        const requireIdx = keys.indexOf('require');

        if (defaultIdx !== -1 && defaultIdx < keys.length - 1) {
          fractures.push({
            id: `EXPORTS_ORDER_DEFAULT_${subpath.replace(/[^a-zA-Z0-9]/g, '_')}`,
            type: 'PACKAGING_EXPORT_FRACTURE',
            severity: 'HIGH',
            source: 'package.json',
            description: `En exports["${subpath}"], la condición "default" está en la posición ${defaultIdx} de ${keys.length}. Debe ser la última condición o sombreará otras exportaciones.`,
            healingStrategy: `Mover la condición "default" al final del bloque de exportaciones.`,
            rippleImpact: 3,
            affectedDependents: [],
          });
        }

        if (requireIdx !== -1 && importIdx !== -1 && requireIdx < importIdx) {
          fractures.push({
            id: `EXPORTS_ORDER_REQUIRE_${subpath.replace(/[^a-zA-Z0-9]/g, '_')}`,
            type: 'PACKAGING_EXPORT_FRACTURE',
            severity: 'HIGH',
            source: 'package.json',
            description: `En exports["${subpath}"], la condición "require" precede a "import". Bundlers modernos cargarán la versión CommonJS en lugar de ESM.`,
            healingStrategy: `Colocar la condición "import" antes de "require" en package.json.`,
            rippleImpact: 3,
            affectedDependents: [],
          });
        }
      };

      if (typeof pkg.exports === 'object') {
        for (const [key, val] of Object.entries(pkg.exports)) {
          if (key.startsWith('.')) {
            inspectConditions(val, key);
          } else {
            inspectConditions(pkg.exports, '.');
            break;
          }
        }
      }
    }
  }

  /**
   * 3. Errores Fantasma en CI/CD (GitHub Actions / actionlint)
   */
  public auditCIWorkflows(fractures: TopologicalFracture[]): void {
    const workflowsDir = path.join(this.rootDir, '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) return;

    let pkgName = '';
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkgName = pkg.name || '';
      } catch {
        // Ignorar
      }
    }

    try {
      const files = fs.readdirSync(workflowsDir);
      for (const file of files) {
        if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
        const wfPath = path.join(workflowsDir, file);
        const content = fs.readFileSync(wfPath, 'utf8');
        const relPath = path.relative(this.rootDir, wfPath);

        // A. Dependencia circular con npx propio
        if (pkgName) {
          // Buscar patrones como "npx -y mi-paquete" o "npx mi-paquete"
          const npxRegex = new RegExp(`npx\\s+(-y\\s+)?([\\w@/-]*${pkgName}[\\w@/-]*)`, 'i');
          const match = npxRegex.exec(content);
          if (match) {
            fractures.push({
              id: `CI_CIRCULAR_NPX_${file.replace(/[^a-zA-Z0-9]/g, '_')}`,
              type: 'CI_WORKFLOW_FRACTURE',
              severity: 'CRITICAL',
              source: relPath,
              importerLine: match[0],
              description: `El workflow de CI ejecuta "${match[0]}", creando una dependencia circular fatal con el registro remoto de NPM en la propia CI del repositorio.`,
              healingStrategy: `Reemplazar la llamada a "npx" por la ejecución local directa (ej. "node bin/..." o "node src/...").`,
              rippleImpact: 5,
              affectedDependents: [],
            });
          }
        }

        // B. Pasos huérfanos que suben artefactos no garantizados
        if (content.includes('upload-sarif') && content.includes('sarif_file:')) {
          const sarifMatch = /sarif_file:\s*([^\s\n]+)/.exec(content);
          if (sarifMatch && sarifMatch[1]) {
            const sarifFileName = sarifMatch[1];
            if (!content.includes(sarifFileName) || content.split(sarifFileName).length < 3) {
              // Si solo se menciona en el upload y no en el comando generador
              fractures.push({
                id: `CI_ORPHAN_SARIF_${file.replace(/[^a-zA-Z0-9]/g, '_')}`,
                type: 'CI_WORKFLOW_FRACTURE',
                severity: 'HIGH',
                source: relPath,
                description: `El paso de subida de SARIF referencia "${sarifFileName}" pero el comando de auditoría anterior no parece generarlo de forma explícita.`,
                healingStrategy: `Asegurar que el paso anterior incluya "--sarif ${sarifFileName}".`,
                rippleImpact: 3,
                affectedDependents: [],
              });
            }
          }
        }

        // C. Acciones deprecadas conocidas
        const deprecatedActions = [
          { pattern: /actions\/checkout@v[12]\b/, name: 'actions/checkout@v1-v2', replacement: 'actions/checkout@v4' },
          { pattern: /actions\/setup-node@v[123]\b/, name: 'actions/setup-node@v1-v3', replacement: 'actions/setup-node@v4' },
          { pattern: /github\/codeql-action\/upload-sarif@v[12]\b/, name: 'codeql-action@v1-v2', replacement: 'github/codeql-action/upload-sarif@v3' },
        ];

        for (const dep of deprecatedActions) {
          if (dep.pattern.test(content)) {
            fractures.push({
              id: `CI_DEPRECATED_ACTION_${dep.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
              type: 'CI_WORKFLOW_FRACTURE',
              severity: 'MEDIUM',
              source: relPath,
              description: `El workflow utiliza una versión deprecada de la acción "${dep.name}".`,
              healingStrategy: `Actualizar a "${dep.replacement}".`,
              rippleImpact: 2,
              affectedDependents: [],
            });
          }
        }
      }
    } catch {
      // Ignorar errores de lectura
    }
  }

  /**
   * 4. Fuga y Particionado Incorrecto de Dependencias
   */
  public auditDependencyPartitioning(vertices: HyperVertex[], fractures: TopologicalFracture[]): void {
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    let pkg: any;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      return;
    }

    const dependencies = new Set<string>(Object.keys(pkg.dependencies || {}));
    const devDependencies = new Set<string>(Object.keys(pkg.devDependencies || {}));

    // A. Detectar fugas de devDependencies en código de producción
    for (const v of vertices) {
      const normPath = v.path.replace(/\\/g, '/');
      const isTestOrBenchmark =
        normPath.startsWith('tests/') ||
        normPath.startsWith('test/') ||
        normPath.startsWith('benchmark/') ||
        normPath.startsWith('benchmarks/') ||
        normPath.includes('.test.') ||
        normPath.includes('.spec.');

      if (isTestOrBenchmark) continue;

      for (const dep of v.dependencies) {
        if (dep.startsWith('.') || dep.startsWith('/') || dep.startsWith('node:')) continue;
        const builtinModules = ['fs', 'path', 'crypto', 'child_process', 'os', 'util', 'events', 'stream', 'http', 'https', 'url', 'worker_threads'];
        if (builtinModules.includes(dep)) continue;

        const pkgName = dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0];
        if (devDependencies.has(pkgName) && !dependencies.has(pkgName)) {
          fractures.push({
            id: `DEP_LEAK_${v.id.replace(/[^a-zA-Z0-9]/g, '_')}_${pkgName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            type: 'DEPENDENCY_LEAK_FRACTURE',
            severity: 'CRITICAL',
            source: v.path,
            description: `El archivo de producción importa "${pkgName}", pero este paquete solo está listado en devDependencies. Al instalar el paquete en producción fallará con MODULE_NOT_FOUND.`,
            healingStrategy: `Mover "${pkgName}" de devDependencies a dependencies en package.json.`,
            rippleImpact: 4,
            affectedDependents: [v.path],
          });
        }
      }
    }

    // B. Detectar protocolos no resueltos de monorepos (workspace:*)
    for (const [depName, ver] of Object.entries(pkg.dependencies || {})) {
      if (typeof ver === 'string' && ver.startsWith('workspace:')) {
        fractures.push({
          id: `DEP_UNRESOLVED_WORKSPACE_${depName.replace(/[^a-zA-Z0-9]/g, '_')}`,
          type: 'DEPENDENCY_LEAK_FRACTURE',
          severity: 'HIGH',
          source: 'package.json',
          description: `La dependencia "${depName}" tiene la versión no resuelta "${ver}". En NPM público, los consumidores no podrán instalarla.`,
          healingStrategy: `Sustituir "${ver}" por la versión semver real del paquete antes de publicar.`,
          rippleImpact: 4,
          affectedDependents: [],
        });
      }
    }
  }

  /**
   * 5. Colisiones de Mayúsculas/Minúsculas en Sistema de Archivos (Case-Sensitivity Hazard)
   */
  public auditCaseSensitivity(vertices: HyperVertex[], fractures: TopologicalFracture[]): void {
    const dirCache = new Map<string, string[]>();

    for (const v of vertices) {
      const sourceAbs = path.resolve(this.rootDir, v.path);
      const sourceDir = path.dirname(sourceAbs);

      for (const dep of v.dependencies) {
        if (!dep.startsWith('.')) continue;

        const resolvedTarget = path.resolve(sourceDir, dep);
        const targetDir = path.dirname(resolvedTarget);
        const expectedBase = path.basename(resolvedTarget);

        if (!fs.existsSync(targetDir)) continue;

        let entries = dirCache.get(targetDir);
        if (!entries) {
          try {
            entries = fs.readdirSync(targetDir);
            dirCache.set(targetDir, entries);
          } catch {
            continue;
          }
        }

        // Buscar coincidencia exacta y sin distinción de mayúsculas
        const exactMatch = entries.find((e) => e === expectedBase || e.replace(/\.[^.]+$/, '') === expectedBase.replace(/\.[^.]+$/, ''));
        const caseInsensitiveMatch = entries.find(
          (e) => e.toLowerCase() === expectedBase.toLowerCase() || e.replace(/\.[^.]+$/, '').toLowerCase() === expectedBase.replace(/\.[^.]+$/, '').toLowerCase()
        );

        if (caseInsensitiveMatch && !exactMatch) {
          fractures.push({
            id: `CASE_MISMATCH_${v.id.replace(/[^a-zA-Z0-9]/g, '_')}_${expectedBase}`,
            type: 'CASE_SENSITIVITY_FRACTURE',
            severity: 'CRITICAL',
            source: v.path,
            target: dep,
            description: `Colisión de mayúsculas/minúsculas: el import especifica "${dep}" pero en disco se llama "${caseInsensitiveMatch}". Funciona en Windows/macOS pero falla catastróficamente en Linux y Docker.`,
            healingStrategy: `Corregir la capitalización del import para que coincida exactamente con "${caseInsensitiveMatch}".`,
            rippleImpact: 4,
            affectedDependents: [v.path],
          });
        }
      }
    }
  }

  /**
   * 6. Desincronización de Versiones (Release Sync)
   */
  public auditReleaseSync(fractures: TopologicalFracture[]): void {
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    let pkg: any;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      return;
    }

    if (!pkg.version) return;
    const pkgVersion = pkg.version;

    // Comprobar src/index.ts si existe
    const indexTsPath = path.join(this.rootDir, 'src', 'index.ts');
    if (fs.existsSync(indexTsPath)) {
      try {
        const content = fs.readFileSync(indexTsPath, 'utf8');
        // Buscar cadenas como v3.0.1 o version 3.0.1
        const versionMatch = /v?(\d+\.\d+\.\d+)/.exec(content);
        if (versionMatch && versionMatch[1] && versionMatch[1] !== pkgVersion) {
          fractures.push({
            id: 'RELEASE_VERSION_DESYNC',
            type: 'RELEASE_SYNC_FRACTURE',
            severity: 'HIGH',
            source: 'src/index.ts',
            target: 'package.json',
            description: `Desincronización de versión de release: package.json define v${pkgVersion} pero src/index.ts referencia v${versionMatch[1]}.`,
            healingStrategy: `Actualizar la versión en src/index.ts a v${pkgVersion}.`,
            rippleImpact: 2,
            affectedDependents: [],
          });
        }
      } catch {
        // Ignorar
      }
    }
  }
}
