# Architecture Decisions

## Why 0.85 default threshold?

Empirically tested across support ticket datasets:

- **Below 0.80**: False positives increase sharply. "Password reset" starts matching "Account deletion" because both relate to account management.
- **0.80 - 0.85**: Good balance. Catches paraphrases ("Can't log in" / "Login broken") while keeping distinct topics separate.
- **Above 0.90**: Misses legitimate paraphrases. Only near-identical phrasings get grouped.

The 0.85 default works well for most deduplication tasks. Adjust down to 0.75 for aggressive dedup (e.g., FAQ consolidation) or up to 0.92 for conservative dedup (e.g., legal documents).

## Why cosine similarity over euclidean distance?

1. **Normalized comparison**: Cosine measures direction, not magnitude. Two vectors pointing the same way have similarity 1.0 regardless of their length. This matches how embedding models encode meaning.
2. **Intuitive range**: 0 to 1 for normalized embeddings (which most models produce). Easy to reason about thresholds.
3. **Industry standard**: OpenAI, Cohere, and most embedding providers recommend cosine similarity for their models.

Euclidean distance would work but requires normalization to set meaningful thresholds, and the resulting values are less intuitive.

## Why OpenAI for embeddings?

Cost and quality trade-off:

- **text-embedding-3-small**: $0.02 per 1M tokens. A batch of 1,000 support tickets (~50 words each) costs about $0.001.
- **Local models** (e.g., sentence-transformers): Free per-query, but require GPU or significant CPU time. Setup overhead for a library that should "just work."
- **Quality**: OpenAI's embedding models consistently rank near the top of MTEB benchmarks for semantic similarity tasks.

The library accepts pre-computed embeddings for all core functions. The OpenAI dependency is only used by `generateEmbedding()` and `deduplicate()`. If you bring your own embeddings, you never touch the OpenAI client.

## Why in-memory by default?

Most batch deduplication jobs process fewer than 1,000 items:

- **Under 1K items**: In-memory O(n^2) comparison completes in milliseconds. No infrastructure needed.
- **1K - 10K items**: Still feasible in-memory (1-10 seconds). Consider batching.
- **Over 10K items**: Use pgvector, Pinecone, or similar vector database for approximate nearest neighbor search.

This library targets the common case. For large-scale dedup, use `cosineSimilarity()` as a scoring function with a proper vector index handling the candidate retrieval.

## Known Limitations

1. **O(n^2) grouping**: `groupByThreshold` compares every pair. Fine for hundreds of items, slow for tens of thousands.
2. **No incremental updates**: Adding a new item requires re-running the full grouping. No persistent index.
3. **Greedy assignment**: Items are assigned to the first group they match. Different item ordering can produce different groupings.
4. **API key required for high-level functions**: `deduplicate()` and `generateEmbedding()` need `OPENAI_API_KEY`. Pure functions (`cosineSimilarity`, `groupByThreshold`, `findSimilar`) work without any API key.
5. **Sequential embedding generation**: `deduplicate()` generates embeddings one at a time. For large batches, pre-compute embeddings in parallel and use `groupByThreshold()` directly.
