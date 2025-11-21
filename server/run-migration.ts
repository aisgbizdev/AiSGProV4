import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

console.log("🚀 Running migration...");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool, { schema });

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }

  await pool.end();
  process.exit(0);
}

main();
