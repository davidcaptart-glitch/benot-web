/**
 * BENOT – PostgreSQL connection + Drizzle instance (lazy initialization)
 *
 * The connection is created on first use so that Next.js build-time
 * module evaluation (without DATABASE_URL) doesn't fail.
 * At runtime, DATABASE_URL must be set or the first DB call will throw.
 */
import { drizzle }   from "drizzle-orm/postgres-js";
import postgres       from "postgres";
import * as schema    from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

export function getDb(): DrizzleDb {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. " +
      "Add it to .env (e.g. postgresql://benot:password@localhost:5432/benot)"
    );
  }

  const client = postgres(url, {
    max:             10,
    idle_timeout:    30,
    connect_timeout: 10,
  });

  _db = drizzle(client, { schema });
  return _db;
}

/** Convenience proxy — use `db` as if it were the drizzle instance. */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

// Re-export schema for use in repositories without double-importing
export * from "./schema";
