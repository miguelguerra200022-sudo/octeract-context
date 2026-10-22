import { deflateSync, inflateSync } from 'node:zlib';

export interface AnvilMetrics {
  storedChunks: number;
  totalSectors: number;
  totalBytes: number;
  fragmentationRatio: number;
  uncompressedBytes: number;
  compressedBytes: number;
}

export class OcteractAnvilContainer {
  private locations: Uint32Array; // 1024 entries: [24-bit offset, 8-bit count]
  private timestamps: Uint32Array; // 1024 entries: timestamp seconds
  private chunkData: Map<number, Uint8Array>; // index (0..1023) -> raw uncompressed/compressed data
  private compressedMap: Map<number, boolean>;

  constructor() {
    this.locations = new Uint32Array(1024);
    this.timestamps = new Uint32Array(1024);
    this.chunkData = new Map<number, Uint8Array>();
    this.compressedMap = new Map<number, boolean>();
  }

  private getIndex(x: number, z: number): number {
    const rx = ((x % 32) + 32) % 32;
    const rz = ((z % 32) + 32) % 32;
    return rx + rz * 32;
  }

  public chunkCount(): number {
    return this.chunkData.size;
  }

  public hasChunk(x: number, z: number): boolean {
    const idx = this.getIndex(x, z);
    return this.chunkData.has(idx);
  }

  public saveChunk(x: number, z: number, data: Uint8Array | string, compress: boolean = true): void {
    const idx = this.getIndex(x, z);
    const rawBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.chunkData.set(idx, rawBytes);
    this.compressedMap.set(idx, compress);
    this.timestamps[idx] = Math.floor(Date.now() / 1000);
  }

  public loadChunk(x: number, z: number): Uint8Array | null {
    const idx = this.getIndex(x, z);
    const data = this.chunkData.get(idx);
    if (!data) return null;
    return data;
  }

  public getChunkTimestamp(x: number, z: number): number {
    const idx = this.getIndex(x, z);
    return this.timestamps[idx] || 0;
  }

  public serialize(): Uint8Array {
    const SECTOR_SIZE = 4096;
    const headerSectors = 2; // Sector 0 = locations, Sector 1 = timestamps
    let currentSector = headerSectors;

    // First pass: calculate sectors needed for each chunk
    const serializedChunks: Array<{ idx: number; sectorOffset: number; sectorCount: number; payload: Uint8Array }> = [];
    let totalUncompressed = 0;
    let totalCompressed = 0;

    for (const [idx, rawData] of this.chunkData.entries()) {
      totalUncompressed += rawData.length;
      const shouldCompress = this.compressedMap.get(idx) ?? true;
      let payloadBytes: Buffer | Uint8Array = rawData;
      let compType = 0; // 0 = uncompressed

      if (shouldCompress) {
        try {
          payloadBytes = deflateSync(rawData);
          compType = 1; // 1 = deflate
        } catch {
          payloadBytes = rawData;
          compType = 0;
        }
      }
      totalCompressed += payloadBytes.length;

      // Format: 4 bytes length + 1 byte compType + payloadBytes
      const chunkTotalLen = 4 + 1 + payloadBytes.length;
      const sectorCount = Math.ceil(chunkTotalLen / SECTOR_SIZE);

      const chunkBuffer = new Uint8Array(sectorCount * SECTOR_SIZE);
      const view = new DataView(chunkBuffer.buffer);
      view.setUint32(0, payloadBytes.length + 1, false); // length (big-endian)
      chunkBuffer[4] = compType;
      chunkBuffer.set(payloadBytes, 5);

      serializedChunks.push({
        idx,
        sectorOffset: currentSector,
        sectorCount,
        payload: chunkBuffer
      });

      // Update locations entry: (sectorOffset << 8) | (sectorCount & 0xFF)
      const locVal = ((currentSector & 0xFFFFFF) << 8) | (sectorCount & 0xFF);
      this.locations[idx] = locVal;
      currentSector += sectorCount;
    }

    const totalFileSize = currentSector * SECTOR_SIZE;
    const finalBuffer = new Uint8Array(totalFileSize);
    const finalView = new DataView(finalBuffer.buffer);

    // Write Sector 0: Locations (4096 bytes, 1024 uint32 BE)
    for (let i = 0; i < 1024; i++) {
      finalView.setUint32(i * 4, this.locations[i] || 0, false);
    }

    // Write Sector 1: Timestamps (4096 bytes, 1024 uint32 BE)
    for (let i = 0; i < 1024; i++) {
      finalView.setUint32(4096 + i * 4, this.timestamps[i] || 0, false);
    }

    // Write chunk data sectors
    for (const chunk of serializedChunks) {
      finalBuffer.set(chunk.payload, chunk.sectorOffset * SECTOR_SIZE);
    }

    return finalBuffer;
  }

  public static deserialize(buffer: Uint8Array): OcteractAnvilContainer {
    const container = new OcteractAnvilContainer();
    const SECTOR_SIZE = 4096;
    if (buffer.length < 8192) {
      throw new Error(`Invalid anvil buffer size: ${buffer.length} < 8192 bytes header`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // Read locations
    for (let i = 0; i < 1024; i++) {
      container.locations[i] = view.getUint32(i * 4, false);
    }

    // Read timestamps
    for (let i = 0; i < 1024; i++) {
      container.timestamps[i] = view.getUint32(4096 + i * 4, false);
    }

    // Read chunks
    for (let i = 0; i < 1024; i++) {
      const loc = container.locations[i];
      if (!loc) continue;

      const sectorOffset = (loc >>> 8) & 0xFFFFFF;
      const sectorCount = loc & 0xFF;
      if (sectorOffset === 0 || sectorCount === 0) continue;

      const byteOffset = sectorOffset * SECTOR_SIZE;
      if (byteOffset + 5 > buffer.length) continue;

      const payloadLen = view.getUint32(byteOffset, false);
      const compType = buffer[byteOffset + 4];
      const dataStart = byteOffset + 5;
      const dataEnd = dataStart + payloadLen - 1;

      if (dataEnd > buffer.length) continue;
      const rawChunkBytes = buffer.subarray(dataStart, dataEnd);

      let decompressedBytes: Uint8Array;
      if (compType === 1) {
        decompressedBytes = new Uint8Array(inflateSync(rawChunkBytes));
      } else {
        decompressedBytes = new Uint8Array(rawChunkBytes);
      }

      container.chunkData.set(i, decompressedBytes);
      container.compressedMap.set(i, compType === 1);
    }

    return container;
  }

  public getMetrics(): AnvilMetrics {
    const SECTOR_SIZE = 4096;
    let stored = 0;
    let uncompressed = 0;
    for (const data of this.chunkData.values()) {
      stored++;
      uncompressed += data.length;
    }
    const serialized = this.serialize();
    const totalSectors = Math.ceil(serialized.length / SECTOR_SIZE);

    return {
      storedChunks: stored,
      totalSectors,
      totalBytes: serialized.length,
      fragmentationRatio: stored > 0 ? (totalSectors * SECTOR_SIZE - uncompressed) / (totalSectors * SECTOR_SIZE) : 0,
      uncompressedBytes: uncompressed,
      compressedBytes: serialized.length - 8192
    };
  }
}
