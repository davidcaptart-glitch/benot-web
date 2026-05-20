/**
 * BENOT – Drizzle migration runner
 *
 * Run with:  npx tsx db/migrate.ts
 * Or via:    npm run db:migrate
 *
 * Applies all pending migrations in db/migrations/ to the database
 * specified by DATABASE_URL.
 */
import { drizzle }  from "drizzle-orm/postgres-js";
import { migrate }  from "drizzle-orm/postgres-js/migrator";
import postgres      from "postgres";
import path          from "path";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌  DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  console.log("🗄  Running BENOT database migrations…");

  const client = postgres(url!, { max: 1 });
  const db     = drizzle(client);

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "db", "migrations"),
  });

  console.log("✅  Migrations applied.");
  await client.end();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
