import OpenAI from 'openai';

export interface EmbeddableItem {
  id: string;
  embedding: number[];
}

export interface TextItem {
  id: string;
  text: string;
}

export interface DedupGroup {
  canonical: string;
  duplicates: string[];
}

export interface SimilarResult {
  id: string;
  similarity: number;
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

/**
 * Cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical direction).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Generate an embedding for a single text using OpenAI.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small',
  dimensions: number = 1536,
): Promise<number[]> {
  const client = getClient();
  const response = await client.embeddings.create({ model, input: text, dimensions });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error('OpenAI returned no embedding');
  return embedding;
}

/**
 * Group items by cosine similarity threshold.
 * Items with similarity >= threshold are grouped together.
 * The first item in each group is the "canonical" representative.
 */
export function groupByThreshold(
  items: EmbeddableItem[],
  threshold: number = 0.85,
): DedupGroup[] {
  if (items.length === 0) return [];
  const assigned = new Set<string>();
  const groups: DedupGroup[] = [];

  for (const item of items) {
    if (assigned.has(item.id)) continue;
    const group: DedupGroup = { canonical: item.id, duplicates: [] };
    assigned.add(item.id);

    for (const other of items) {
      if (assigned.has(other.id)) continue;
      const sim = cosineSimilarity(item.embedding, other.embedding);
      if (sim >= threshold) {
        group.duplicates.push(other.id);
        assigned.add(other.id);
      }
    }
    groups.push(group);
  }
  return groups;
}

/**
 * Find items similar to a query embedding.
 * Returns items sorted by similarity (highest first).
 */
export function findSimilar(
  queryEmbedding: number[],
  items: EmbeddableItem[],
  threshold: number = 0.7,
  limit: number = 10,
): SimilarResult[] {
  return items
    .map((item) => ({ id: item.id, similarity: cosineSimilarity(queryEmbedding, item.embedding) }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * High-level deduplication: embed texts, then group by similarity.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function deduplicate(
  items: TextItem[],
  options: { threshold?: number; model?: string; dimensions?: number } = {},
): Promise<DedupGroup[]> {
  const { threshold = 0.85, model, dimensions } = options;
  const embeddableItems: EmbeddableItem[] = [];
  for (const item of items) {
    const embedding = await generateEmbedding(item.text, model, dimensions);
    embeddableItems.push({ id: item.id, embedding });
  }
  return groupByThreshold(embeddableItems, threshold);
}
