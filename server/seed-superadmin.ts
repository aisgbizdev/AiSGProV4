import { Pool } from "pg";
import bcrypt from "bcrypt";

console.log("👑 Seeding superadmin...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    const username = "superadmin";
    const passwordPlain = "vito1007";
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    // Cek apakah sudah ada user superadmin
    const existing = await pool.query(
      "SELECT id, username FROM users WHERE username = $1 LIMIT 1",
      [username]
    );

    if (existing.rows.length > 0) {
      console.log("⚠️ Superadmin already exists!");
      console.log("   Username:", existing.rows[0].username);
      await pool.end();
      return;
    }

    // Insert superadmin
    await pool.query(
      `
      INSERT INTO users (username, password, name, role)
      VALUES ($1, $2, $3, $4)
    `,
      [username, passwordHash, "AiSG Admin Panel", "full_admin"]
    );

    console.log("✅ Superadmin created!");
    console.log("   Username: superadmin");
    console.log("   Password: vito1007");

    await pool.end();
  } catch (error) {
    console.error("❌ Error seeding superadmin:", error);
    await pool.end();
    process.exit(1);
  }
}

seed();
