export interface JigsawSocket {
  name: string;
  type: 'plug' | 'jack'; // plug = input requirement, jack = output provision
  contract: string; // e.g. "IAuthProvider", "DatabaseConfig"
  jointType: 'rigid' | 'flexible'; // rigid = strict exact match, flexible = case-insensitive/prefix match
  connectedTo?: string; // id of connected piece or socket
}

export interface JigsawPiece {
  id: string;
  template: string;
  sockets: JigsawSocket[];
}

export interface JigsawAssemblyResult {
  success: boolean;
  connectedPieces: string[];
  unmatchedSockets: JigsawSocket[];
  cyclicWarnings: string[];
  synthesizedOutput: string;
}

export class OcteractJigsawSynthesis {
  private pieces: Map<string, JigsawPiece>;

  constructor() {
    this.pieces = new Map<string, JigsawPiece>();
  }

  public registerPiece(piece: JigsawPiece): void {
    this.pieces.set(piece.id, piece);
  }

  public getPiece(id: string): JigsawPiece | undefined {
    return this.pieces.get(id);
  }

  private contractsMatch(plug: JigsawSocket, jack: JigsawSocket): boolean {
    if (plug.type !== 'plug' || jack.type !== 'jack') return false;
    if (plug.jointType === 'rigid' || jack.jointType === 'rigid') {
      return plug.contract === jack.contract;
    }
    return plug.contract.toLowerCase() === jack.contract.toLowerCase() ||
           plug.contract.includes(jack.contract) ||
           jack.contract.includes(plug.contract);
  }

  public assemble(rootPieceId: string, maxDepth: number = 32): JigsawAssemblyResult {
    const root = this.pieces.get(rootPieceId);
    if (!root) {
      return {
        success: false,
        connectedPieces: [],
        unmatchedSockets: [],
        cyclicWarnings: [`Root piece ${rootPieceId} not found in library`],
        synthesizedOutput: ''
      };
    }

    const connectedPieces: string[] = [root.id];
    const visited = new Set<string>([root.id]);
    const unmatchedSockets: JigsawSocket[] = [];
    const cyclicWarnings: string[] = [];

    // Queue of pending sockets to resolve: { pieceId, socket }
    const pendingPlugs: Array<{ pieceId: string; socket: JigsawSocket }> = [];

    for (const sock of root.sockets) {
      if (sock.type === 'plug') {
        pendingPlugs.push({ pieceId: root.id, socket: sock });
      }
    }

    let depth = 0;
    while (pendingPlugs.length > 0 && depth < maxDepth) {
      depth++;
      const item = pendingPlugs.shift();
      if (!item) break;

      const plug = item.socket;
      let resolved = false;

      // Search available pieces for a matching jack
      for (const candidate of this.pieces.values()) {
        const matchingJack = candidate.sockets.find(
          s => s.type === 'jack' && this.contractsMatch(plug, s)
        );

        if (matchingJack) {
          if (visited.has(candidate.id)) {
            cyclicWarnings.push(`Circular dependency detected connecting ${item.pieceId} to ${candidate.id}`);
            resolved = true;
            break;
          }

          visited.add(candidate.id);
          connectedPieces.push(candidate.id);
          resolved = true;

          // Enqueue candidate's plugs
          for (const s of candidate.sockets) {
            if (s.type === 'plug') {
              pendingPlugs.push({ pieceId: candidate.id, socket: s });
            }
          }
          break;
        }
      }

      if (!resolved) {
        unmatchedSockets.push(plug);
      }
    }

    // Synthesize code from ordered connected pieces
    const outputParts: string[] = [];
    for (const pieceId of connectedPieces) {
      const piece = this.pieces.get(pieceId);
      if (piece) {
        outputParts.push(`// --- JIGSAW PIECE: ${piece.id} ---\n${piece.template}`);
      }
    }

    return {
      success: unmatchedSockets.length === 0,
      connectedPieces,
      unmatchedSockets,
      cyclicWarnings,
      synthesizedOutput: outputParts.join('\n\n')
    };
  }
}
