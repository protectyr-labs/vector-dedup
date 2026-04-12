import { describe, it, expect } from 'vitest';
import { cosineSimilarity, groupByThreshold, findSimilar } from '../src/index';

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
  });
  it('returns 0.0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });
  it('returns value between 0 and 1 for similar vectors', () => {
    const sim = cosineSimilarity([1, 2, 3], [1, 2, 4]);
    expect(sim).toBeGreaterThan(0.9);
    expect(sim).toBeLessThan(1.0);
  });
  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('length mismatch');
  });
  it('returns 0 for zero vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('groupByThreshold', () => {
  it('groups identical embeddings', () => {
    const items = [
      { id: '1', embedding: [1, 0, 0] },
      { id: '2', embedding: [1, 0, 0] },
      { id: '3', embedding: [0, 1, 0] },
    ];
    const groups = groupByThreshold(items, 0.99);
    expect(groups).toHaveLength(2);
    const g1 = groups.find(g => g.canonical === '1');
    expect(g1?.duplicates).toContain('2');
  });

  it('returns singletons when nothing is similar', () => {
    const items = [
      { id: '1', embedding: [1, 0, 0] },
      { id: '2', embedding: [0, 1, 0] },
      { id: '3', embedding: [0, 0, 1] },
    ];
    const groups = groupByThreshold(items, 0.9);
    expect(groups).toHaveLength(3);
    expect(groups.every(g => g.duplicates.length === 0)).toBe(true);
  });

  it('handles empty input', () => {
    expect(groupByThreshold([], 0.85)).toEqual([]);
  });

  it('respects custom threshold', () => {
    const items = [
      { id: '1', embedding: [1, 0.1, 0] },
      { id: '2', embedding: [1, 0.2, 0] },
    ];
    const strict = groupByThreshold(items, 0.999);
    const loose = groupByThreshold(items, 0.9);
    expect(strict).toHaveLength(2);
    expect(loose).toHaveLength(1);
  });
});

describe('findSimilar', () => {
  it('finds similar items sorted by similarity', () => {
    const items = [
      { id: 'a', embedding: [1, 0, 0] },
      { id: 'b', embedding: [0.9, 0.1, 0] },
      { id: 'c', embedding: [0, 1, 0] },
    ];
    const results = findSimilar([1, 0, 0], items, 0.5);
    expect(results[0].id).toBe('a');
    expect(results[0].similarity).toBeCloseTo(1.0);
    expect(results[1].id).toBe('b');
  });

  it('respects threshold', () => {
    const items = [
      { id: 'a', embedding: [1, 0, 0] },
      { id: 'b', embedding: [0, 1, 0] },
    ];
    const results = findSimilar([1, 0, 0], items, 0.9);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a');
  });

  it('respects limit', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      embedding: [1, i * 0.01, 0],
    }));
    const results = findSimilar([1, 0, 0], items, 0, 5);
    expect(results).toHaveLength(5);
  });
});
