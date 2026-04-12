import { cosineSimilarity, groupByThreshold, findSimilar } from '../src/index';

console.log('=== Vector Dedup Demo ===\n');

// Simulated embeddings (in production, these come from OpenAI)
// These vectors represent: similar items cluster together
const items = [
  { id: 'ticket-1', embedding: [0.9, 0.1, 0.05, 0.02] },    // "Can't log in"
  { id: 'ticket-2', embedding: [0.75, 0.25, 0.08, 0.05] },   // "Login broken"
  { id: 'ticket-3', embedding: [0.85, 0.15, 0.12, 0.01] },   // "Auth not working"
  { id: 'ticket-4', embedding: [0.05, 0.8, 0.3, 0.02] },     // "Export to CSV"
  { id: 'ticket-5', embedding: [0.08, 0.7, 0.35, 0.1] },     // "Download data"
  { id: 'ticket-6', embedding: [0.02, 0.05, 0.1, 0.95] },    // "Change password"
];

// Show pairwise similarities
console.log('Pairwise similarities:');
console.log(`  ticket-1 vs ticket-2: ${cosineSimilarity(items[0].embedding, items[1].embedding).toFixed(3)}`);
console.log(`  ticket-1 vs ticket-4: ${cosineSimilarity(items[0].embedding, items[3].embedding).toFixed(3)}`);
console.log(`  ticket-4 vs ticket-5: ${cosineSimilarity(items[3].embedding, items[4].embedding).toFixed(3)}`);

// Group duplicates
console.log('\nDedup groups (threshold=0.95):');
const groups = groupByThreshold(items, 0.95);
for (const g of groups) {
  const dupes = g.duplicates.length > 0 ? ` + duplicates: ${g.duplicates.join(', ')}` : ' (unique)';
  console.log(`  ${g.canonical}${dupes}`);
}

// Semantic search
console.log('\nSearch for "authentication issues":');
const query = [0.82, 0.18, 0.1, 0.03]; // simulated query embedding
const results = findSimilar(query, items, 0.7, 3);
for (const r of results) {
  console.log(`  ${r.id}: similarity=${r.similarity.toFixed(3)}`);
}
