import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set in environment');
    client = new OpenAI({ apiKey });
  }
  return client;
}

const MODEL = 'text-embedding-3-small';

export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({ model: MODEL, input: text });
  return response.data[0].embedding;
}

// OpenAI allows up to 2048 inputs per batch
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const BATCH_SIZE = 200;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await getClient().embeddings.create({ model: MODEL, input: batch });
    // Results are returned in order
    response.data.sort((a, b) => a.index - b.index);
    results.push(...response.data.map(d => d.embedding));
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Compute element-wise mean of vectors then L2-normalise
export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) throw new Error('No vectors to average');
  const dims = vectors[0].length;
  const mean = new Array<number>(dims).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dims; i++) mean[i] += v[i];
  }
  const norm = Math.sqrt(mean.reduce((s, x) => s + x * x, 0));
  return mean.map(x => x / (norm || 1));
}

export function isEmbeddingAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
