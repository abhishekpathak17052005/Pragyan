/**
 * Intelligence Audit Index Initialization
 *
 * Creates three indexes on the IntelligenceDebugAudit MongoDB collection:
 *   - adminId_createdAt_idx  : compound query index  { adminId: 1, createdAt: -1 }
 *   - endpoint_idx           : single-field index    { endpoint: 1 }
 *   - createdAt_ttl_idx      : TTL index             { createdAt: 1 }, expireAfterSeconds = 30 days
 *
 * Design goals:
 *   1. Idempotent  – safe to call on every startup; existing indexes are never dropped.
 *   2. Non-blocking – if Atlas is temporarily unreachable the server still starts.
 *   3. Bounded retries – gives up after MAX_ATTEMPTS and logs a clear warning.
 *   4. Ping-first – verifies connectivity before touching the collection.
 *   5. No secret leakage – DATABASE_URL is never printed.
 */

import { prisma } from '@/lib/prisma';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLECTION = 'IntelligenceDebugAudit';

/** 30-day TTL expressed in seconds */
const INTELLIGENCE_AUDIT_TTL_SECONDS = 30 * 24 * 60 * 60; // 2 592 000

/** Maximum number of attempts for the entire index-initialization run */
const MAX_INDEX_CREATION_ATTEMPTS = 3;

/** Base delay (ms) between attempts; doubles on each retry */
const RETRY_BASE_DELAY_MS = 2_000;

/** Per-operation timeout for the ping and createIndexes commands (ms) */
const COMMAND_TIMEOUT_MS = 8_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexSpec {
  name: string;
  key: Record<string, number>;
  expireAfterSeconds?: number;
}

interface ListIndexesResult {
  cursor?: { firstBatch?: Array<{ name?: string }> };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Race a promise against a fixed timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`[Intelligence] ${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err)   => { clearTimeout(timer); reject(err); }
    );
  });
}

/** Short sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Verify the Prisma/MongoDB connection with a lightweight ping.
 * Throws if the ping fails or times out.
 */
async function pingDatabase(): Promise<void> {
  await withTimeout(
    prisma.$runCommandRaw({ ping: 1 } as any) as Promise<unknown>,
    COMMAND_TIMEOUT_MS,
    'MongoDB ping'
  );
}

/**
 * Retrieve the names of indexes that already exist on the collection.
 * Returns an empty Set if the command fails (treated as "no indexes known").
 */
async function getExistingIndexNames(): Promise<Set<string>> {
  try {
    const result = await withTimeout(
      prisma.$runCommandRaw({
        listIndexes: COLLECTION,
      } as any) as Promise<ListIndexesResult>,
      COMMAND_TIMEOUT_MS,
      'listIndexes'
    );

    const batch = result?.cursor?.firstBatch ?? [];
    return new Set(batch.map((idx) => idx.name ?? '').filter(Boolean));
  } catch {
    // If the collection doesn't exist yet, listIndexes will error — that's fine.
    return new Set<string>();
  }
}

/**
 * Create a single index on the collection.
 * Returns true if created, false if it already existed (skipped).
 * Throws on any other error so the caller can decide how to handle it.
 */
async function createSingleIndex(spec: IndexSpec, existingNames: Set<string>): Promise<boolean> {
  if (existingNames.has(spec.name)) {
    console.log(`[Intelligence] Index ${spec.name} already exists`);
    return false;
  }

  const indexDef: Record<string, unknown> = { key: spec.key, name: spec.name };
  if (spec.expireAfterSeconds !== undefined) {
    indexDef.expireAfterSeconds = spec.expireAfterSeconds;
  }

  await withTimeout(
    prisma.$runCommandRaw({
      createIndexes: COLLECTION,
      indexes: [indexDef],
    } as any) as Promise<unknown>,
    COMMAND_TIMEOUT_MS,
    `createIndex ${spec.name}`
  );

  console.log(`[Intelligence] Created index: ${spec.name}`);
  return true;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Ensure all required IntelligenceDebugAudit indexes exist.
 *
 * Called non-blockingly from app.ts:
 *   void ensureIntelligenceIndexes();
 *
 * The function retries up to MAX_INDEX_CREATION_ATTEMPTS times before giving up.
 * A failure here never prevents the server from starting.
 */
export async function ensureIntelligenceIndexes(): Promise<void> {
  const ttlSeconds =
    process.env.INTELLIGENCE_AUDIT_TTL_DAYS !== undefined
      ? Math.max(0, Math.floor(Number(process.env.INTELLIGENCE_AUDIT_TTL_DAYS) * 24 * 60 * 60))
      : INTELLIGENCE_AUDIT_TTL_SECONDS;

  const requiredIndexes: IndexSpec[] = [
    { name: 'adminId_createdAt_idx', key: { adminId: 1, createdAt: -1 } },
    { name: 'endpoint_idx',          key: { endpoint: 1 } },
    { name: 'createdAt_ttl_idx',     key: { createdAt: 1 }, expireAfterSeconds: ttlSeconds },
  ];

  for (let attempt = 1; attempt <= MAX_INDEX_CREATION_ATTEMPTS; attempt++) {
    try {
      // ── Step 1: verify connectivity ─────────────────────────────────────
      console.log('[Intelligence] Checking audit indexes...');
      await pingDatabase();
      console.log('[Intelligence] MongoDB connection verified');

      // ── Step 2: retrieve existing indexes once ───────────────────────────
      const existing = await getExistingIndexNames();

      // ── Step 3: create any missing indexes ──────────────────────────────
      for (const spec of requiredIndexes) {
        await createSingleIndex(spec, existing);
      }

      console.log('[Intelligence] Intelligence audit indexes verified');
      return; // success — exit the retry loop

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout =
        message.toLowerCase().includes('timed out') ||
        message.toLowerCase().includes('timeout') ||
        message.toLowerCase().includes('os error 60');

      if (attempt < MAX_INDEX_CREATION_ATTEMPTS) {
        const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);

        if (isTimeout) {
          console.warn(
            `[Intelligence] Index creation attempt ${attempt}/${MAX_INDEX_CREATION_ATTEMPTS} timed out; retrying in ${delayMs}ms...`
          );
        } else {
          console.warn(
            `[Intelligence] Index creation attempt ${attempt}/${MAX_INDEX_CREATION_ATTEMPTS} failed (${message}); retrying in ${delayMs}ms...`
          );
        }

        await sleep(delayMs);
      } else {
        // All attempts exhausted — log and continue startup.
        console.warn(
          `[Intelligence] Audit index initialization failed after ${MAX_INDEX_CREATION_ATTEMPTS} attempts.`
        );
        console.warn(
          '[Intelligence] Continuing startup because audit indexes are non-critical.'
        );

        // Distinguish a real DB connectivity failure from an index-only failure
        // so operators know whether to investigate the Atlas connection.
        if (isTimeout) {
          const url = process.env.DATABASE_URL ?? '';
          const scheme = url.startsWith('mongodb+srv://') ? 'mongodb+srv' : url.startsWith('mongodb://') ? 'mongodb' : 'unknown';
          const maskedHost = url.replace(/^mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb$1://***:***@');
          console.warn(
            `[Intelligence] Diagnostics: scheme=${scheme}, host=${maskedHost.split('@')[1]?.split('/')[0] ?? 'unknown'}, ` +
            `prisma=6.x, retries=${MAX_INDEX_CREATION_ATTEMPTS}, lastError=${message}`
          );
        } else {
          console.warn(`[Intelligence] Last error: ${message}`);
        }
      }
    }
  }
}
