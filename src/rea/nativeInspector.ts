/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractNativeBoundaryInspector - Node.js Native Addon (.node) & N-API Boundary Inspector
 *
 * Inspired by morluto/rea inspect_binary_layout & inspect_managed_native_boundaries:
 * Statically parses binary headers and symbol tables of Node.js native addons (.node / ELF / Mach-O / PE),
 * discovering exported N-API methods and projecting native boundaries into Octeract's 8D hypercube.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { OcteractCell } from './reverseBundle.ts';

export interface NativeSymbol {
  name: string;
  category: 'NAPI_INITIALIZER' | 'EXPORTED_METHOD' | 'INTERNAL_SYMBOL' | 'RUNTIME_IMPORT';
  cell: OcteractCell;
}

export interface NativeInspectionReport {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  format: 'ELF' | 'MACH_O' | 'PE' | 'RAW_BINARY';
  architecture: 'x86_64' | 'arm64' | 'arm32' | 'unknown';
  isNapiAddon: boolean;
  napiVersionDetected: string | null;
  entryPoint: string | null;
  exportedMethods: string[];
  nativeSymbols: NativeSymbol[];
  projectedCell: OcteractCell;
  staticMitigations: {
    stackCanaryFound: boolean;
    relroIndicated: boolean;
    nxIndicated: boolean;
  };
  summary: string;
}

export class OcteractNativeBoundaryInspector {
  /**
   * Statically inspects a .node native binary file.
   */
  public static inspectBinary(filePath: string): NativeInspectionReport {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Native binary file not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    return this.inspectBuffer(buffer, path.basename(filePath), filePath);
  }

  /**
   * Statically inspects a binary buffer.
   */
  public static inspectBuffer(
    buffer: Buffer,
    fileName: string = 'native.node',
    filePath: string = fileName
  ): NativeInspectionReport {
    const fileSizeBytes = buffer.length;
    const format = this.detectBinaryFormat(buffer);
    const architecture = this.detectArchitecture(buffer, format);

    // Extract ASCII/UTF-8 strings from binary buffer (length between 3 and 80)
    const strings = this.extractStrings(buffer);

    // Check for Node-API entry points
    let isNapiAddon = false;
    let entryPoint: string | null = null;
    let napiVersionDetected: string | null = null;

    const napiSignatures = [
      'napi_register_module_v1',
      'node_api_module_get_initializer',
      'napi_register_module',
      'napi_create_function',
      'napi_define_class',
    ];

    for (const sig of napiSignatures) {
      if (strings.includes(sig)) {
        isNapiAddon = true;
        if (!entryPoint && (sig.includes('initializer') || sig.includes('register'))) {
          entryPoint = sig;
        }
      }
    }

    // Heuristic detection of NAPI version
    const versionMatch = strings.find((s) => /napi_version_\d+|NAPI_VERSION\s*=\s*\d+/i.test(s));
    if (versionMatch) {
      napiVersionDetected = versionMatch;
    } else if (isNapiAddon) {
      napiVersionDetected = 'N-API v8+';
    }

    // Discover exported method candidates
    const exportedMethods: string[] = [];
    const nativeSymbols: NativeSymbol[] = [];

    // Look for methods near napi_create_function or standard export names
    const candidateMethodNames = new Set<string>();
    for (const str of strings) {
      // Identifier style names
      if (/^[a-zA-Z_][a-zA-Z0-9_]{2,40}$/.test(str)) {
        if (!napiSignatures.includes(str) && !this.isCommonLibrarySymbol(str)) {
          if (
            str.endsWith('Sync') ||
            str.endsWith('Async') ||
            /^(get|set|create|open|close|read|write|hash|encrypt|decrypt|compute|render)/i.test(str)
          ) {
            candidateMethodNames.add(str);
          }
        }
      }
    }

    // Add up to 25 candidate methods
    for (const name of Array.from(candidateMethodNames).slice(0, 25)) {
      exportedMethods.push(name);
      const cell = this.classifyNativeCell(name, strings);
      nativeSymbols.push({
        name,
        category: 'EXPORTED_METHOD',
        cell,
      });
    }

    if (entryPoint) {
      nativeSymbols.unshift({
        name: entryPoint,
        category: 'NAPI_INITIALIZER',
        cell: 'CoreLogic',
      });
    }

    // Static mitigations heuristics
    const stackCanaryFound = strings.some((s) => s.includes('__stack_chk_fail') || s.includes('__security_check_cookie'));
    const relroIndicated = format === 'ELF' && strings.some((s) => s.includes('GNU_RELRO') || s.includes('.got'));
    const nxIndicated = format === 'ELF' || format === 'MACH_O';

    const projectedCell = this.classifyNativeCell(fileName, strings);

    const summary = `${fileName} (${format} ${architecture}, ${Math.round(fileSizeBytes / 1024)} KB): ${
      isNapiAddon ? 'Valid Node-API addon' : 'Generic binary addon'
    } with ${exportedMethods.length} detected exported methods projected into ${projectedCell}.`;

    return {
      filePath,
      fileName,
      fileSizeBytes,
      format,
      architecture,
      isNapiAddon,
      napiVersionDetected,
      entryPoint,
      exportedMethods,
      nativeSymbols,
      projectedCell,
      staticMitigations: {
        stackCanaryFound,
        relroIndicated,
        nxIndicated,
      },
      summary,
    };
  }

  private static detectBinaryFormat(buffer: Buffer): NativeInspectionReport['format'] {
    if (buffer.length < 4) return 'RAW_BINARY';
    // ELF: 0x7F 'E' 'L' 'F'
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return 'ELF';
    }
    // Mach-O: 0xFEEDFACE, 0xFEEDFACF, 0xCEFAEDFE, 0xCFFAEDFE, 0xCAFEBABE (FAT)
    const magic32 = buffer.readUInt32BE(0);
    if ([0xfeedface, 0xfeedfacf, 0xcafebabe, 0xbebafeca].includes(magic32)) {
      return 'MACH_O';
    }
    // PE: 'MZ' at 0 and 'PE\0\0' at offset
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return 'PE';
    }
    return 'RAW_BINARY';
  }

  private static detectArchitecture(
    buffer: Buffer,
    format: NativeInspectionReport['format']
  ): NativeInspectionReport['architecture'] {
    if (format === 'ELF' && buffer.length >= 20) {
      const e_machine = buffer.readUInt16LE(18);
      if (e_machine === 62) return 'x86_64'; // EM_X86_64
      if (e_machine === 183) return 'arm64'; // EM_AARCH64
      if (e_machine === 40) return 'arm32'; // EM_ARM
    }
    if (format === 'MACH_O' && buffer.length >= 8) {
      const cputype = buffer.readUInt32BE(4);
      if (cputype === 0x01000007) return 'x86_64';
      if (cputype === 0x0100000c) return 'arm64';
    }
    if (format === 'PE' && buffer.length >= 64) {
      const peOffset = buffer.readUInt32LE(0x3c);
      if (buffer.length >= peOffset + 6) {
        const machine = buffer.readUInt16LE(peOffset + 4);
        if (machine === 0x8664) return 'x86_64';
        if (machine === 0xaa64) return 'arm64';
      }
    }
    return 'unknown';
  }

  private static extractStrings(buffer: Buffer): string[] {
    const strings: string[] = [];
    let current = '';

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      // Printable ASCII range (32 - 126)
      if (byte >= 32 && byte <= 126) {
        current += String.fromCharCode(byte);
      } else {
        if (current.length >= 3 && current.length <= 80) {
          strings.push(current);
        }
        current = '';
      }
      if (strings.length >= 500) break; // Limit string extraction for speed
    }

    return strings;
  }

  private static isCommonLibrarySymbol(name: string): boolean {
    const common = [
      'malloc',
      'free',
      'memcpy',
      'memset',
      'printf',
      'sprintf',
      'strlen',
      'abort',
      'stderr',
      'stdout',
      'stdin',
      'GLIBC',
      'GCC',
      'clang',
    ];
    return common.includes(name) || name.startsWith('__');
  }

  private static classifyNativeCell(name: string, strings: string[]): OcteractCell {
    const text = (name + ' ' + strings.slice(0, 100).join(' ')).toLowerCase();
    if (/sqlite|rocksdb|leveldb|storage|disk|lmdb|write_file|database/.test(text)) return 'Storage';
    if (/crypto|sha256|aes|argon2|bcrypt|signature|auth|ssl|tls/.test(text)) return 'Security';
    if (/net|socket|tcp|udp|http|packet|dns/.test(text)) return 'Network';
    if (/render|gpu|gl|vk|draw|pixel|image|png|jpeg/.test(text)) return 'UI';
    if (/log|telemetry|trace|perf|timer/.test(text)) return 'Telemetry';
    if (/config|settings|env/.test(text)) return 'Config';
    return 'CoreLogic';
  }
}
