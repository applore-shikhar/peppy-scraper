import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');
  client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || 'peppy';
  db = client.db(dbName);
  console.log(`[mongo] Connected to ${dbName}`);
  return db;
}

export function getMongoDB(): Db {
  if (!db) throw new Error('MongoDB not connected — call connectMongo() first');
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function isMongoAvailable(): boolean {
  return !!process.env.MONGODB_URI;
}

// ── Product vector store ──────────────────────────────────────────────────────

export interface ProductVectorDoc {
  _id: string;              // sha256 hash of normalized name
  name: string;
  broadCategory: string;
  subCategory: string;
  tags: string[];
  lowestPrice: number | null;
  highestPrice: number | null;
  retailerCount: number;
  embedding: number[];
  updatedAt: Date;
}

const COLLECTION = 'peppy_product_vectors';

export async function upsertProductVector(doc: ProductVectorDoc): Promise<void> {
  const col: Collection<ProductVectorDoc> = getMongoDB().collection(COLLECTION);
  await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
}

export async function upsertProductVectorBatch(docs: ProductVectorDoc[]): Promise<void> {
  if (docs.length === 0) return;
  const col: Collection<ProductVectorDoc> = getMongoDB().collection(COLLECTION);
  const ops = docs.map(doc => ({
    replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
  }));
  await col.bulkWrite(ops as any, { ordered: false });
  console.log(`[mongo] Upserted ${docs.length} product vectors`);
}

export async function ensureVectorIndex(): Promise<void> {
  const col = getMongoDB().collection(COLLECTION);
  // Regular index on filter fields — Atlas vector search index must be created via Atlas UI
  await col.createIndex({ broadCategory: 1 }, { background: true });
  await col.createIndex({ lowestPrice: 1 }, { background: true });
  await col.createIndex({ tags: 1 }, { background: true });
  console.log(`[mongo] Scalar indexes ensured on ${COLLECTION}`);
  console.log(`[mongo] IMPORTANT: Create Atlas Vector Search index on 'embedding' field (1536 dims, cosine) via Atlas UI`);
}
