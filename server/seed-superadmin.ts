/**
 * Seed script to create first superadmin user
 * Run with: npx tsx server/seed-superadmin.ts
 */

import { createUser } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedSuperadmin() {
  try {
    console.log("🌱 Starting superadmin seed...");
    
    // Check if superadmin already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);
    
    if (existing) {
      console.log("⚠️  Superadmin already exists!");
      console.log("   Username:", existing.username);
      console.log("   Name:", existing.name);
      console.log("   Role:", existing.role);
      console.log("   Created:", existing.createdAt);
      process.exit(0);
    }
    
    // Create superadmin
    console.log("📝 Creating superadmin account...");
    const superadmin = await createUser({
      username: "superadmin",
      password: "vito1007",
      name: "AiSG Admin Panel",
      role: "full_admin",
    });
    
    console.log("✅ Superadmin created successfully!");
    console.log("   Username:", superadmin.username);
    console.log("   Name:", superadmin.name);
    console.log("   Role:", superadmin.role);
    console.log("   ID:", superadmin.id);
    console.log("\n🔐 Login credentials:");
    console.log("   Username: superadmin");
    console.log("   Password: vito1007");
    console.log("\n🎉 You can now login to AiSG!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding superadmin:", error);
    process.exit(1);
  }
}

seedSuperadmin();
