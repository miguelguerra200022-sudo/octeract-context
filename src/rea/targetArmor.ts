/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractTargetArmor - Prompt Injection Armor & Untrusted Target Provenance
 *
 * Inspired by morluto/rea untrusted_content provenance protocol:
 * Protects AI coding agents from indirect prompt-injection vectors, delimiter breakouts,
 * and malicious instructions embedded in comments, docstrings, or string literals.
 */

export interface ProvenanceMetadata {
  untrusted_content: boolean;
  source: string;
  risk_score: number;
  threat_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detected_threats: Array<{
    rule: string;
    line: number;
    matched: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  sanitized: boolean;
  timestamp: string;
}

export interface ProvenanceEnvelope<T> {
  data: T;
  _meta: {
    provenance: ProvenanceMetadata;
  };
}

export interface ArmorScanResult {
  isClean: boolean;
  riskScore: number;
  threatLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threats: Array<{
    rule: string;
    line: number;
    matched: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  originalLength: number;
  sanitizedCode: string;
}

export class OcteractTargetArmor {
  private static readonly INJECTION_RULES: Array<{
    name: string;
    regex: RegExp;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    replacement: string;
  }> = [
    {
      name: 'SYSTEM_INSTRUCTION_OVERRIDE',
      regex: /(?:\/\*|\/\/|#|<!--|"""|''')[\s\S]*?(?:system\s*instruction|system\s*prompt|system\s*directive|you\s*are\s*now\s*a|act\s*as\s*an\s*unrestricted)[\s\S]*?(?:\*\/|\n|-->|"""|'''|$)/gi,
      severity: 'CRITICAL',
      score: 45,
      replacement: '[DEFANGED: SYSTEM_INSTRUCTION_OVERRIDE]',
    },
    {
      name: 'INSTRUCTION_IGNORE_HIJACK',
      regex: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|prompts|directives)/gi,
      severity: 'CRITICAL',
      score: 50,
      replacement: '[DEFANGED: INSTRUCTION_IGNORE_HIJACK]',
    },
    {
      name: 'SPECIAL_LLM_DELIMITER_BREAKOUT',
      regex: /(?:<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|<s>|<\/s>|<bos>|<eos>|<system>|<\/system>)/gi,
      severity: 'HIGH',
      score: 35,
      replacement: '[DEFANGED: LLM_DELIMITER_TOKEN]',
    },
    {
      name: 'AGENT_SHELL_WEAPONIZATION_PAYLOAD',
      regex: /(?:(?:rm\s+-rf\s+(?:\/|~|\$HOME)|chmod\s+-R\s+777\s+\/|mkfs\.|dd\s+if=\/dev\/zero)|(?:curl|wget)\s+.*?\s*\|\s*(?:ba)?sh)/gi,
      severity: 'CRITICAL',
      score: 40,
      replacement: '[DEFANGED: DANGEROUS_SHELL_PAYLOAD]',
    },
    {
      name: 'PROMPT_LEAK_EXFILTRATION',
      regex: /(?:repeat|print|output|dump|reveal)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|hidden\s+rules|developer\s+message)/gi,
      severity: 'MEDIUM',
      score: 25,
      replacement: '[DEFANGED: PROMPT_LEAK_ATTEMPT]',
    },
    {
      name: 'MARKDOWN_BLOCK_HIJACK',
      regex: /(?:```(?:system|assistant|user|instructions)[\s\S]*?```)/gi,
      severity: 'MEDIUM',
      score: 20,
      replacement: '[DEFANGED: FAKE_AGENT_ROLE_BLOCK]',
    },
  ];

  /**
   * Scans raw target code or text for adversarial prompt injection patterns.
   */
  public static scan(code: string): ArmorScanResult {
    if (!code || typeof code !== 'string') {
      return {
        isClean: true,
        riskScore: 0,
        threatLevel: 'SAFE',
        threats: [],
        originalLength: 0,
        sanitizedCode: '',
      };
    }

    const threats: ArmorScanResult['threats'] = [];
    let accumulatedScore = 0;
    const lines = code.split('\n');

    for (const rule of this.INJECTION_RULES) {
      // Find line number and matches
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        rule.regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = rule.regex.exec(line)) !== null) {
          threats.push({
            rule: rule.name,
            line: lineIdx + 1,
            matched: match[0],
            severity: rule.severity,
          });
          accumulatedScore += rule.score;
        }
      }
    }

    const riskScore = Math.min(100, accumulatedScore);
    const threatLevel: ArmorScanResult['threatLevel'] =
      riskScore === 0 ? 'SAFE' :
      riskScore <= 20 ? 'LOW' :
      riskScore <= 50 ? 'MEDIUM' :
      riskScore <= 80 ? 'HIGH' : 'CRITICAL';

    return {
      isClean: threats.length === 0,
      riskScore,
      threatLevel,
      threats,
      originalLength: code.length,
      sanitizedCode: this.sanitize(code),
    };
  }

  /**
   * Neutralizes and defangs any detected injection payload in the code.
   */
  public static sanitize(code: string): string {
    if (!code || typeof code !== 'string') return '';
    let result = code;

    for (const rule of this.INJECTION_RULES) {
      rule.regex.lastIndex = 0;
      result = result.replace(rule.regex, rule.replacement);
    }

    return result;
  }

  /**
   * Envelops an arbitrary payload in a REA-style Provenance Envelope.
   * Ensures downstream AI agents treat target code as untrusted data.
   */
  public static wrapWithProvenance<T>(
    data: T,
    source: string = 'octeract_target_ast',
    sanitize: boolean = true
  ): ProvenanceEnvelope<T> {
    let processedData = data;
    let scanResult: ArmorScanResult;

    if (typeof data === 'string') {
      scanResult = this.scan(data);
      if (sanitize) {
        processedData = scanResult.sanitizedCode as unknown as T;
      }
    } else {
      const serialized = JSON.stringify(data);
      scanResult = this.scan(serialized);
      if (sanitize && !scanResult.isClean) {
        try {
          processedData = JSON.parse(scanResult.sanitizedCode);
        } catch {
          processedData = data;
        }
      }
    }

    const provenance: ProvenanceMetadata = {
      untrusted_content: true,
      source,
      risk_score: scanResult.riskScore,
      threat_level: scanResult.threatLevel,
      detected_threats: scanResult.threats,
      sanitized: sanitize && !scanResult.isClean,
      timestamp: new Date().toISOString(),
    };

    return {
      data: processedData,
      _meta: {
        provenance,
      },
    };
  }
}
