/**
 * Reset database - Drop all old tables and push new schema
 * Run with: npx tsx server/reset-database.ts
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

async function resetDatabase() {
  try {
    console.log("🗑️  Dropping all existing tables...\n");

    // Drop old tables (if they exist)
    const tablesToDrop = [
      "chat_messages",
      "audits",
      "branches",
      "users",
      "monthly_performance",
      "employees",
      "positions",
      "ceo_units",
      "pts",
      // Old tables from individual system
      "session",
    ];

    for (const table of tablesToDrop) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
        console.log(`  ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Table ${table} doesn't exist or already dropped`);
      }
    }

    console.log("\n✅ Database reset complete!");
    console.log("\nNext step:");
    console.log("  Run: npm run db:push --force");
    console.log("  Then: npx tsx server/seed-enterprise.ts");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
