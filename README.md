# @protectyr-labs/vector-dedup

Semantic deduplication using vector embeddings. Find and group similar text items using cosine similarity.

Extracted from a production knowledge extraction pipeline where we needed to deduplicate thousands of text items (support tickets, FAQ entries, documentation fragments) before feeding them into downstream systems. Instead of exact string matching, this library compares items by meaning -- so "Cannot log in" and "Login page broken" get grouped together.

## Install

```bash
npm install @protectyr-labs/vector-dedup
```

## Quick Start

### Group pre-computed embeddings

```typescript
import { groupByThreshold, findSimilar } from '@protectyr-labs/vector-dedup';

// Pre-computed embeddings (from OpenAI, Cohere, or any provider)
const tickets = [
  { id: 'ticket-1', embedding: [0.12, 0.85, 0.33, /* ... */] },  // "Cannot log in"
  { id: 'ticket-2', embedding: [0.11, 0.86, 0.32, /* ... */] },  // "Login page broken"
  { id: 'ticket-3', embedding: [0.92, 0.05, 0.41, /* ... */] },  // "Export to CSV"
];

const groups = groupByThreshold(tickets, 0.85);
// [
//   { canonical: 'ticket-1', duplicates: ['ticket-2'] },
//   { canonical: 'ticket-3', duplicates: [] }
// ]
```

### Find similar items

```typescript
import { findSimilar } from '@protectyr-labs/vector-dedup';

const queryEmbedding = [0.13, 0.84, 0.34, /* ... */];  // "I can't sign in"
const results = findSimilar(queryEmbedding, tickets, 0.7, 5);
// [
//   { id: 'ticket-1', similarity: 0.98 },
//   { id: 'ticket-2', similarity: 0.97 }
// ]
```

### High-level deduplication (with OpenAI)

If you have raw text and want the library to handle embedding generation:

```typescript
import { deduplicate } from '@protectyr-labs/vector-dedup';

// Requires OPENAI_API_KEY environment variable
const items = [
  { id: '1', text: 'Cannot log in to my account' },
  { id: '2', text: 'Login page is broken' },
  { id: '3', text: 'How do I export data to CSV?' },
];

const groups = await deduplicate(items, { threshold: 0.85 });
// [
//   { canonical: '1', duplicates: ['2'] },
//   { canonical: '3', duplicates: [] }
// ]
```

## API Reference

### `cosineSimilarity(a: number[], b: number[]): number`

Compute cosine similarity between two vectors. Returns a value between -1 and 1 (1 = identical direction). Throws if vectors have different lengths.

### `groupByThreshold(items: EmbeddableItem[], threshold?: number): DedupGroup[]`

Group items by cosine similarity. Items with similarity >= threshold are grouped together. The first item encountered in each group becomes the canonical representative. Default threshold: 0.85.

### `findSimilar(queryEmbedding: number[], items: EmbeddableItem[], threshold?: number, limit?: number): SimilarResult[]`

Find items similar to a query embedding. Returns results sorted by similarity (highest first), filtered by threshold (default 0.7), limited to `limit` results (default 10).

### `generateEmbedding(text: string, model?: string, dimensions?: number): Promise<number[]>`

Generate an embedding for a single text using OpenAI. Requires `OPENAI_API_KEY` environment variable. Default model: `text-embedding-3-small`, default dimensions: 1536.

### `deduplicate(items: TextItem[], options?): Promise<DedupGroup[]>`

High-level function: generate embeddings for all items, then group by similarity. Requires `OPENAI_API_KEY`. Options: `threshold` (default 0.85), `model`, `dimensions`.

### Types

```typescript
interface EmbeddableItem { id: string; embedding: number[] }
interface TextItem { id: string; text: string }
interface DedupGroup { canonical: string; duplicates: string[] }
interface SimilarResult { id: string; similarity: number }
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions and trade-offs.

## License

MIT
