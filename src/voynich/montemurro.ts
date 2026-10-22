/**
 * OCTERACT-CONTEXT: Motor de Clustering Semántico de Montemurro & Zanette (2013)
 * Descubre redes temáticas y tópicos arquitectónicos sin modelos de embedding,
 * sin LLMs y a costo cero tokens basándose en la Información Mutua de dispersión.
 */

export interface MontemurroDocument {
  id: string;
  content: string;
}

export interface MontemurroKeyword {
  word: string;
  mutualInformation: number;
  sectionEntropy: number;
  totalCount: number;
  dominantSection: string;
}

export interface MontemurroCorpusAnalysis {
  keywords: MontemurroKeyword[];
  totalTokensAnalyzed: number;
  sectionCount: number;
  overallSectionEntropy: number;
  executionTimeMs: number;
}

export interface SemanticCluster {
  id: string;
  label: string;
  files: string[];
  topKeywords: string[];
}

export class OcteractMontemurroEngine {
  /**
   * Analiza el corpus completo calculando la Información Mutua I(w, S) de cada palabra
   */
  public analyzeCorpus(corpus: MontemurroDocument[]): MontemurroCorpusAnalysis {
    const start = performance.now();
    if (corpus.length === 0) {
      return {
        keywords: [],
        totalTokensAnalyzed: 0,
        sectionCount: 0,
        overallSectionEntropy: 0,
        executionTimeMs: 0,
      };
    }

    const sectionTokens: Map<string, string[]> = new Map();
    const wordFreqBySection: Map<string, Map<string, number>> = new Map();
    let totalTokens = 0;

    for (const doc of corpus) {
      const tokens = this.tokenize(doc.content);
      sectionTokens.set(doc.id, tokens);
      totalTokens += tokens.length;

      for (const tok of tokens) {
        if (!wordFreqBySection.has(tok)) {
          wordFreqBySection.set(tok, new Map());
        }
        const sMap = wordFreqBySection.get(tok)!;
        sMap.set(doc.id, (sMap.get(doc.id) || 0) + 1);
      }
    }

    // 1. Entropía global de secciones H(S)
    let overallSectionEntropy = 0;
    for (const doc of corpus) {
      const count = sectionTokens.get(doc.id)?.length || 0;
      if (count > 0 && totalTokens > 0) {
        const p = count / totalTokens;
        overallSectionEntropy -= p * Math.log2(p);
      }
    }

    // 2. Información Mutua I(w, S) = H(S) - H(S|w)
    const keywords: MontemurroKeyword[] = [];

    for (const [word, sectionMap] of wordFreqBySection.entries()) {
      let wordTotal = 0;
      let dominantSection = '';
      let maxSectionCount = 0;

      for (const [sec, count] of sectionMap.entries()) {
        wordTotal += count;
        if (count > maxSectionCount) {
          maxSectionCount = count;
          dominantSection = sec;
        }
      }

      if (wordTotal < 1) continue;

      let conditionalEntropy = 0;
      for (const [, count] of sectionMap.entries()) {
        const p = count / wordTotal;
        if (p > 0) {
          conditionalEntropy -= p * Math.log2(p);
        }
      }

      const mutualInformation = Math.max(0, overallSectionEntropy - conditionalEntropy);

      keywords.push({
        word,
        mutualInformation: parseFloat(mutualInformation.toFixed(4)),
        sectionEntropy: parseFloat(conditionalEntropy.toFixed(4)),
        totalCount: wordTotal,
        dominantSection,
      });
    }

    keywords.sort((a, b) => b.mutualInformation - a.mutualInformation);

    return {
      keywords,
      totalTokensAnalyzed: totalTokens,
      sectionCount: corpus.length,
      overallSectionEntropy: parseFloat(overallSectionEntropy.toFixed(4)),
      executionTimeMs: parseFloat((performance.now() - start).toFixed(2)),
    };
  }

  /**
   * Agrupa los documentos en K clústeres temáticos no supervisados
   */
  public extractSemanticClusters(corpus: MontemurroDocument[], k: number = 2): SemanticCluster[] {
    if (corpus.length === 0) return [];
    if (corpus.length <= k) {
      return corpus.map((doc, idx) => ({
        id: `topic-${idx + 1}`,
        label: doc.id,
        files: [doc.id],
        topKeywords: this.tokenize(doc.content).slice(0, 5),
      }));
    }

    const analysis = this.analyzeCorpus(corpus);
    const topKeywords = analysis.keywords.slice(0, 30).map(k => k.word);

    // Vectorizar cada documento en base a la frecuencia ponderada por I(w, S)
    const docVectors: Map<string, Map<string, number>> = new Map();
    const miMap = new Map(analysis.keywords.map(k => [k.word, k.mutualInformation]));

    for (const doc of corpus) {
      const tokens = this.tokenize(doc.content);
      const v = new Map<string, number>();
      for (const t of tokens) {
        if (topKeywords.includes(t)) {
          const mi = miMap.get(t) || 1.0;
          v.set(t, (v.get(t) || 0) + mi);
        }
      }
      docVectors.set(doc.id, v);
    }

    // Calcular matriz de similitud de coseno
    const similarity = (d1: string, d2: string): number => {
      const v1 = docVectors.get(d1)!;
      const v2 = docVectors.get(d2)!;
      let dot = 0;
      let mag1 = 0;
      let mag2 = 0;

      for (const [w, val] of v1.entries()) {
        mag1 += val * val;
        if (v2.has(w)) dot += val * v2.get(w)!;
      }
      for (const [, val] of v2.entries()) {
        mag2 += val * val;
      }

      if (mag1 === 0 || mag2 === 0) return 0;
      return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
    };

    // Agrupamiento Jerárquico Aglomerativo Determinista
    let activeClusters: Array<{ files: string[]; label: string }> = corpus.map(d => ({
      files: [d.id],
      label: d.id,
    }));

    while (activeClusters.length > k) {
      let bestSim = -1;
      let mergeA = 0;
      let mergeB = 1;

      for (let i = 0; i < activeClusters.length; i++) {
        for (let j = i + 1; j < activeClusters.length; j++) {
          // Promedio de similitud de enlace
          let simSum = 0;
          let count = 0;
          for (const f1 of activeClusters[i].files) {
            for (const f2 of activeClusters[j].files) {
              simSum += similarity(f1, f2);
              count++;
            }
          }
          const avgSim = count > 0 ? simSum / count : 0;
          if (avgSim > bestSim) {
            bestSim = avgSim;
            mergeA = i;
            mergeB = j;
          }
        }
      }

      // Fusionar los dos clústeres más afines
      const mergedFiles = [...activeClusters[mergeA].files, ...activeClusters[mergeB].files];
      activeClusters = activeClusters.filter((_, idx) => idx !== mergeA && idx !== mergeB);
      activeClusters.push({ files: mergedFiles, label: mergedFiles[0] });
    }

    return activeClusters.map((cluster, idx) => {
      // Extraer las keywords más representativas del clúster
      const clusterFreq: Map<string, number> = new Map();
      for (const f of cluster.files) {
        const doc = corpus.find(d => d.id === f);
        if (doc) {
          for (const w of this.tokenize(doc.content)) {
            clusterFreq.set(w, (clusterFreq.get(w) || 0) + (miMap.get(w) || 1));
          }
        }
      }
      const sortedKeys = Array.from(clusterFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);

      return {
        id: `topic-${idx + 1}`,
        label: sortedKeys[0] ? `Dominio ${sortedKeys[0].toUpperCase()}` : `Tópico ${idx + 1}`,
        files: cluster.files,
        topKeywords: sortedKeys,
      };
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
  }
}
