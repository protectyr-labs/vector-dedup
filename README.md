# vector-dedup

> Find and group similar text using embeddings.

[![CI](https://github.com/protectyr-labs/vector-dedup/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/vector-dedup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

Cosine similarity + threshold-based grouping. Feed items with embeddings, get deduplicated groups. Also does semantic search.

## Quick Start

```bash
npm install @protectyr-labs/vector-dedup
```

```typescript
import { groupByThreshold, findSimilar } from '@protectyr-labs/vector-dedup';

const items = [
  { id: 'ticket-1', embedding: [0.12, 0.85, 0.33] },  // "Cannot log in"
  { id: 'ticket-2', embedding: [0.11, 0.86, 0.32] },  // "Login page broken"
  { id: 'ticket-3', embedding: [0.92, 0.05, 0.41] },  // "Export to CSV"
];

const groups = groupByThreshold(items, 0.85);
// [
//   { canonical: 'ticket-1', duplicates: ['ticket-2'] },
//   { canonical: 'ticket-3', duplicates: [] }
// ]

const similar = findSimilar([0.13, 0.84, 0.34], items, 0.7, 5);
// [{ id: 'ticket-1', similarity: 0.98 }, { id: 'ticket-2', similarity: 0.97 }]
```

### With OpenAI embeddings

```typescript
import { deduplicate } from '@protectyr-labs/vector-dedup';

// Requires OPENAI_API_KEY
const groups = await deduplicate([
  { id: '1', text: 'Cannot log in to my account' },
  { id: '2', text: 'Login page is broken' },
  { id: '3', text: 'How do I export data to CSV?' },
], { threshold: 0.85 });

// [{ canonical: '1', duplicates: ['2'] }, { canonical: '3', duplicates: [] }]
```

## Why This?

- **Pure cosine similarity function** -- no dependencies, works with any embedding provider
- **Threshold-based grouping** -- 0.85 default, empirically tested on production data
- **Semantic search** -- `findSimilar()` with configurable threshold + limit
- **OpenAI embeddings built in** -- or bring your own vectors

## API

| Function | Description |
|----------|-------------|
| `cosineSimilarity(a, b)` | Cosine similarity between two vectors (-1 to 1) |
| `groupByThreshold(items, threshold?)` | Group items by similarity (default 0.85) |
| `findSimilar(query, items, threshold?, limit?)` | Semantic search (default threshold 0.7, limit 10) |
| `generateEmbedding(text, model?, dims?)` | OpenAI embedding generation |
| `deduplicate(items, options?)` | High-level: embed + group in one call |

## Limitations

- **O(n^2) grouping** -- fine for <1K items; use pgvector for 10K+
- **OpenAI required for text input** -- pure functions work without, but `deduplicate()` needs an API key
- **Single-model embeddings** -- don't mix embeddings from different models in the same call

## See Also

- [file-preprocess](https://github.com/protectyr-labs/file-preprocess) -- extract text from files before embedding
- [token-budget](https://github.com/protectyr-labs/token-budget) -- budget deduplicated chunks into your prompt

## License

MIT
