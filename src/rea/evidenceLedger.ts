/**
 * Octeract-Context v4.5.0 REA Suite
 * OcteractEvidenceLedger - Canonical Evidence Ledger & Bounded Output Transport Guard
 *
 * Inspired by morluto/rea Evidence Ledger & 10 MiB stdio buffer protection:
 * Immutably stores large analysis outputs with SHA-256 evidence IDs, prevents MCP
 * stdio buffer crashes, and provides bounded paginated projections.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface EvidenceRecord<T = any> {
  evidence_id: string;
  timestamp: string;
  profile: {
    engine: string;
    version: string;
    target: string;
  };
  coverage: 'complete' | 'partial' | 'unknown';
  limitations: string[];
  totalBytes: number;
  views: Record<string, any[]>;
  raw_data: T;
}

export interface BoundedEnvelope<T = any> {
  evidence_id: string;
  retained: boolean;
  total_bytes: number;
  coverage: 'complete' | 'partial' | 'unknown';
  limitations: string[];
  summary: any;
  available_views: string[];
  continuation_token?: string;
  data?: T;
}

export interface PaginatedViewResult {
  evidence_id: string;
  view: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  items: any[];
}

export class OcteractEvidenceLedger {
  private static instance: OcteractEvidenceLedger | null = null;
  private readonly memoryStore: Map<string, EvidenceRecord> = new Map();
  private readonly maxMemoryEntries = 50;
  public static readonly DEFAULT_MAX_BUFFER_BYTES = 512 * 1024; // 512 KB safe buffer threshold
  public static readonly HARD_MCP_BUFFER_LIMIT = 9.5 * 1024 * 1024; // 9.5 MiB guard

  private constructor() {}

  public static getInstance(): OcteractEvidenceLedger {
    if (!OcteractEvidenceLedger.instance) {
      OcteractEvidenceLedger.instance = new OcteractEvidenceLedger();
    }
    return OcteractEvidenceLedger.instance;
  }

  /**
   * Generates a deterministic SHA-256 content hash.
   */
  public static computeHash(data: any): string {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Stores an analysis payload into the canonical ledger.
   */
  public recordEvidence<T>(params: {
    target: string;
    engine?: string;
    coverage?: 'complete' | 'partial' | 'unknown';
    limitations?: string[];
    views?: Record<string, any[]>;
    data: T;
  }): EvidenceRecord<T> {
    const rawData = params.data;
    const serialized = JSON.stringify(rawData);
    const totalBytes = Buffer.byteLength(serialized, 'utf8');
    const evidence_id = OcteractEvidenceLedger.computeHash({
      target: params.target,
      totalBytes,
      first1k: serialized.slice(0, 1024),
      time: Date.now(),
    });

    const record: EvidenceRecord<T> = {
      evidence_id,
      timestamp: new Date().toISOString(),
      profile: {
        engine: params.engine || 'octeract-context-8d',
        version: '4.5.0',
        target: params.target,
      },
      coverage: params.coverage || 'complete',
      limitations: params.limitations || [],
      totalBytes,
      views: params.views || {},
      raw_data: rawData,
    };

    // Store in LRU memory store
    if (this.memoryStore.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryStore.keys().next().value;
      if (oldestKey) this.memoryStore.delete(oldestKey);
    }
    this.memoryStore.set(evidence_id, record);

    return record;
  }

  /**
   * Guard that wraps output in a bounded transport. If output is too large,
   * retains it and returns a compact summary with pagination pointer.
   */
  public boundOutput<T>(
    params: {
      target: string;
      data: T;
      summary: any;
      views?: Record<string, any[]>;
      coverage?: 'complete' | 'partial' | 'unknown';
      limitations?: string[];
    },
    maxBytes: number = OcteractEvidenceLedger.DEFAULT_MAX_BUFFER_BYTES
  ): BoundedEnvelope<T> {
    const serialized = JSON.stringify(params.data);
    const totalBytes = Buffer.byteLength(serialized, 'utf8');

    // Always create canonical record
    const record = this.recordEvidence(params);

    if (totalBytes <= maxBytes) {
      // Safe size: return directly with evidence_id
      return {
        evidence_id: record.evidence_id,
        retained: false,
        total_bytes: totalBytes,
        coverage: record.coverage,
        limitations: record.limitations,
        summary: params.summary,
        available_views: Object.keys(record.views),
        data: params.data,
      };
    }

    // Exceeds buffer: retain payload and return bounded projection
    return {
      evidence_id: record.evidence_id,
      retained: true,
      total_bytes: totalBytes,
      coverage: record.coverage,
      limitations: [
        ...record.limitations,
        `Payload size (${Math.round(totalBytes / 1024)} KB) exceeded buffer threshold (${Math.round(maxBytes / 1024)} KB). Retained in ledger. Use 'octeract_inspect_evidence_view' to paginate through views.`,
      ],
      summary: params.summary,
      available_views: Object.keys(record.views),
      continuation_token: `ev_${record.evidence_id.slice(0, 16)}_p1`,
    };
  }

  /**
   * Inspects a specific view of retained evidence with pagination.
   */
  public inspectView(
    evidenceId: string,
    viewName: string = 'summary',
    page: number = 1,
    pageSize: number = 25
  ): PaginatedViewResult {
    const record = this.memoryStore.get(evidenceId);
    if (!record) {
      throw new Error(`Evidence ID '${evidenceId}' not found in active ledger session.`);
    }

    const targetList: any[] = record.views[viewName] || [];
    const totalItems = targetList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const normalizedPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (normalizedPage - 1) * pageSize;
    const items = targetList.slice(startIndex, startIndex + pageSize);

    return {
      evidence_id: evidenceId,
      view: viewName,
      page: normalizedPage,
      pageSize,
      totalItems,
      totalPages,
      hasMore: normalizedPage < totalPages,
      items,
    };
  }

  /**
   * Exports an evidence record to an external JSON bundle.
   */
  public exportBundle(evidenceId: string, outputPath: string): { success: boolean; bytesWritten: number; path: string } {
    const record = this.memoryStore.get(evidenceId);
    if (!record) {
      throw new Error(`Evidence ID '${evidenceId}' not found in active ledger session.`);
    }

    const serialized = JSON.stringify(record, null, 2);
    const resolvedPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, serialized, 'utf8');

    return {
      success: true,
      bytesWritten: Buffer.byteLength(serialized, 'utf8'),
      path: resolvedPath,
    };
  }

  public getRecord(evidenceId: string): EvidenceRecord | undefined {
    return this.memoryStore.get(evidenceId);
  }

  public clear(): void {
    this.memoryStore.clear();
  }
}
