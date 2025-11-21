import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

console.log("👑 Seeding superadmin...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    const username = "superadmin";
    const passwordPlain = "vito1007";
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const existing = await pool.query(
      "SELECT id, username FROM users WHERE username = $1 LIMIT 1",
      [username]
    );

    if (existing.rows.length > 0) {
      console.log("⚠️ Superadmin already exists!", existing.rows[0]);
      await pool.end();
      return;
    }

    await pool.query(
      `
      INSERT INTO users (username, password, name, role)
      VALUES ($1, $2, $3, $4)
      `,
      [username, passwordHash, "AiSG Admin Panel", "full_admin"]
    );

    console.log("✅ Superadmin created!");
    console.log("   Username:", username);
    console.log("   Password:", passwordPlain);

    await pool.end();
  } catch (err) {
    console.error("❌ Error:", err);
    await pool.end();
    process.exit(1);
  }
}

seed();
