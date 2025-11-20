import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// DEPLOYMENT NOTE: Using personal-schema.ts for migrations to avoid audits table conflicts
// Runtime code still uses schema.ts with all tables
export default defineConfig({
  out: "./migrations",
  schema: "./shared/personal-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
