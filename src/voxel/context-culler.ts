export interface CullingOptions {
  cullPrivateBodies?: boolean;
}

export interface CullResult {
  culledText: string;
  linesRemoved: number;
}

export interface MeshResult {
  meshedText: string;
  mergedClusters: number;
  savingsRatio: number;
}

export interface CullAndMeshResult {
  compressedCode: string;
  originalLines: number;
  culledLines: number;
  originalEstimatedTokens: number;
  compressedEstimatedTokens: number;
  tokenSavingsPercent: number;
}

export class OcteractGreedyContextCuller {
  public cullOccluded(sourceCode: string, options: CullingOptions = { cullPrivateBodies: true }): CullResult {
    const originalLineCount = sourceCode.split('\n').length;
    if (!options.cullPrivateBodies) {
      return { culledText: sourceCode, linesRemoved: 0 };
    }

    // Match private method signatures: private [async] methodName(...) [returnType] {
    const signatureRegex = /private\s+(?:async\s+)?[a-zA-Z0-9_$]+\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = signatureRegex.exec(sourceCode)) !== null) {
      // Append text prior to this match
      result += sourceCode.slice(lastIndex, match.index);
      
      const sig = match[0].slice(0, -1).trimEnd(); // Remove trailing '{'
      const openBraceIdx = match.index + match[0].length - 1;

      // Find matching closing brace
      let braceDepth = 1;
      let i = openBraceIdx + 1;
      let inString: string | null = null;

      while (i < sourceCode.length && braceDepth > 0) {
        const ch = sourceCode[i];
        if (inString) {
          if (ch === inString && sourceCode[i - 1] !== '\\') {
            inString = null;
          }
        } else {
          if (ch === '"' || ch === "'" || ch === '`') {
            inString = ch;
          } else if (ch === '{') {
            braceDepth++;
          } else if (ch === '}') {
            braceDepth--;
          }
        }
        i++;
      }

      if (braceDepth === 0) {
        result += `${sig} {\n    /* [Occluded private implementation] */\n  }`;
        lastIndex = i;
        signatureRegex.lastIndex = i;
      } else {
        // Fallback if unbalanced
        result += match[0];
        lastIndex = match.index + match[0].length;
      }
    }

    result += sourceCode.slice(lastIndex);
    const newLineCount = result.split('\n').length;

    return {
      culledText: result,
      linesRemoved: Math.max(0, originalLineCount - newLineCount)
    };
  }

  public greedyMeshBoilerplate(sourceCode: string): MeshResult {
    const lines = sourceCode.split('\n');
    const resultLines: string[] = [];
    let mergedClusters = 0;
    let initialCount = lines.length;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for start of consecutive import statements
      if (trimmed.startsWith('import ') && (trimmed.endsWith(';') || trimmed.includes('from '))) {
        let importRunCount = 0;
        const startIdx = i;

        while (i < lines.length) {
          const curTrimmed = lines[i].trim();
          if (curTrimmed.startsWith('import ') && (curTrimmed.endsWith(';') || curTrimmed.includes('from '))) {
            importRunCount++;
            i++;
          } else if (curTrimmed === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('import ')) {
            // empty line between imports
            i++;
          } else {
            break;
          }
        }

        if (importRunCount >= 3) {
          mergedClusters++;
          resultLines.push(`// [GreedyMesh: ${importRunCount} import statements merged]`);
        } else {
          // Put back lines
          for (let k = startIdx; k < i; k++) {
            resultLines.push(lines[k]);
          }
        }
      } else {
        resultLines.push(line);
        i++;
      }
    }

    const meshedText = resultLines.join('\n');
    const finalCount = resultLines.length;
    const savingsRatio = initialCount > 0 ? (initialCount - finalCount) / initialCount : 0;

    return {
      meshedText,
      mergedClusters,
      savingsRatio
    };
  }

  public cullAndMesh(sourceCode: string, options: CullingOptions = { cullPrivateBodies: true }): CullAndMeshResult {
    const origLines = sourceCode.split('\n').length;
    const origTokens = Math.ceil(sourceCode.length / 4);

    const culled = this.cullOccluded(sourceCode, options);
    const meshed = this.greedyMeshBoilerplate(culled.culledText);

    const compressedTokens = Math.max(1, Math.ceil(meshed.meshedText.length / 4));
    const tokenSavingsPercent = origTokens > 0
      ? Math.max(0, Math.round(((origTokens - compressedTokens) / origTokens) * 100))
      : 0;

    return {
      compressedCode: meshed.meshedText,
      originalLines: origLines,
      culledLines: meshed.meshedText.split('\n').length,
      originalEstimatedTokens: origTokens,
      compressedEstimatedTokens: compressedTokens,
      tokenSavingsPercent
    };
  }
}
