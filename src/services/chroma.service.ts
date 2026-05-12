import { CloudClient, Collection } from 'chromadb';

const COLLECTION_NAME = 'peppy_products';

let collection: Collection | null = null;

export async function connectChroma(): Promise<Collection> {
  if (collection) return collection;

  const client = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY!,
    tenant: process.env.CHROMA_TENANT!,
    database: process.env.CHROMA_DATABASE!,
  });

  // We provide embeddings directly — suppress DefaultEmbeddingFunction warning
  const noopEF = { generate: async (_: string[]) => [] as number[][] };

  // cosine similarity — matches the embedding model's metric
  collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: noopEF,
  });

  console.log(`[chroma] Connected — collection "${COLLECTION_NAME}"`);
  return collection;
}

export function isChromaAvailable(): boolean {
  return !!(
    process.env.CHROMA_API_KEY &&
    process.env.CHROMA_TENANT &&
    process.env.CHROMA_DATABASE
  );
}

export interface ChromaProductDoc {
  id: string;            // sha256 hash of normalized name
  name: string;
  embedding: number[];
  broadCategory: string;
  subCategory: string;
  tags: string[];
  lowestPrice: number | null;
  highestPrice: number | null;
  retailerCount: number;
}

// ChromaDB metadata values must be string | number | boolean (no arrays/null)
function toMetadata(doc: ChromaProductDoc): Record<string, string | number | boolean> {
  return {
    broadCategory: doc.broadCategory,
    subCategory:   doc.subCategory,
    tags:          doc.tags.join(','),          // comma-sep for $contains filter
    lowestPrice:   doc.lowestPrice  ?? -1,      // -1 = unknown price
    highestPrice:  doc.highestPrice ?? -1,
    retailerCount: doc.retailerCount,
  };
}

export async function upsertProductsBatch(docs: ChromaProductDoc[]): Promise<void> {
  if (docs.length === 0) return;
  const col = await connectChroma();

  // ChromaDB cloud limit: 5461 per batch — well above our typical run size
  await col.upsert({
    ids:        docs.map(d => d.id),
    embeddings: docs.map(d => d.embedding),
    documents:  docs.map(d => d.name),
    metadatas:  docs.map(d => toMetadata(d)),
  });

  console.log(`[chroma] Upserted ${docs.length} product vectors`);
}

// ── Query helper (used by search layer / backend) ─────────────────────────────

export interface ChromaQueryOptions {
  queryEmbedding: number[];
  nResults?: number;
  maxPrice?: number;
  minPrice?: number;
  broadCategory?: string;
  subCategory?: string;
}

export async function queryProducts(opts: ChromaQueryOptions) {
  const col = await connectChroma();

  const where: Record<string, any> = {};

  if (opts.broadCategory) where['broadCategory'] = { '$eq': opts.broadCategory };
  if (opts.subCategory)   where['subCategory']   = { '$eq': opts.subCategory };

  if (opts.maxPrice !== undefined && opts.minPrice !== undefined) {
    where['lowestPrice'] = { '$gte': opts.minPrice, '$lte': opts.maxPrice };
  } else if (opts.maxPrice !== undefined) {
    where['lowestPrice'] = { '$lte': opts.maxPrice };
  } else if (opts.minPrice !== undefined) {
    where['lowestPrice'] = { '$gte': opts.minPrice };
  }

  return col.query({
    queryEmbeddings: [opts.queryEmbedding],
    nResults: opts.nResults ?? 20,
    ...(Object.keys(where).length > 0 ? { where } : {}),
  });
}
