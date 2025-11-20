/**
 * Seed script for AISG Enterprise
 * Sets up organizational structure, positions, and initial super admin
 * 
 * Run with: npx tsx server/seed-enterprise.ts
 */

import { db } from "./db";
import { 
  pts, ceoUnits, branches, positions, employees, users 
} from "@shared/schema";
import { createUser } from "./auth";
import { eq } from "drizzle-orm";

async function seedEnterprise() {
  try {
    console.log("🌱 Starting AISG Enterprise seed...\n");

    // ========================================================================
    // 1. SEED PT COMPANIES (5 companies)
    // ========================================================================
    console.log("📊 Seeding PT Companies...");
    
    const ptData = [
      { code: "RFB", name: "Resky Futures Brokerage" },
      { code: "EWF", name: "Eastern World Futures" },
      { code: "KPF", name: "Kresna Perkasa Futures" },
      { code: "SGB", name: "Sahabat Global Brokerage" },
      { code: "BPF", name: "Berkah Prima Futures" },
    ];

    const insertedPts: any[] = [];
    for (const pt of ptData) {
      const [inserted] = await db.insert(pts).values(pt).returning();
      insertedPts.push(inserted);
      console.log(`  ✅ ${pt.code} - ${pt.name}`);
    }

    // ========================================================================
    // 2. SEED CEO UNITS (5 units mapped to PTs)
    // ========================================================================
    console.log("\n👔 Seeding CEO Units...");
    
    // Map CEO units to their respective PTs (from branch-mapping.json)
    const ceoUnitData = [
      { ptId: insertedPts[0].id, code: "ISRIYETTI", name: "ISRIYETTI" }, // RFB
      { ptId: insertedPts[1].id, code: "NL", name: "NL" }, // EWF
      { ptId: insertedPts[2].id, code: "GS", name: "GS" }, // KPF
      { ptId: insertedPts[3].id, code: "TJANDRA", name: "TJANDRA" }, // SGB
      { ptId: insertedPts[4].id, code: "EDWIN", name: "EDWIN" }, // BPF
    ];

    const insertedCeoUnits: any[] = [];
    for (const unit of ceoUnitData) {
      const [inserted] = await db.insert(ceoUnits).values(unit).returning();
      insertedCeoUnits.push(inserted);
      console.log(`  ✅ CEO Unit: ${unit.code} - ${unit.name}`);
    }

    // ========================================================================
    // 3. SEED BRANCHES (Sample - 10 branches across PTs with CEO Units)
    // ========================================================================
    console.log("\n🏢 Seeding Branches...");
    
    const branchData = [
      // RFB branches (ISRIYETTI unit)
      { ceoUnitId: insertedCeoUnits[0].id, ptId: insertedPts[0].id, code: "SSC", name: "SSC Jakarta", region: "Jakarta" },
      { ceoUnitId: insertedCeoUnits[0].id, ptId: insertedPts[0].id, code: "MEDAN", name: "Medan Branch", region: "Medan" },
      { ceoUnitId: insertedCeoUnits[0].id, ptId: insertedPts[0].id, code: "AXA", name: "AXA Surabaya", region: "Surabaya" },
      
      // EWF branches (NL unit)
      { ceoUnitId: insertedCeoUnits[1].id, ptId: insertedPts[1].id, code: "SOLO", name: "Solo Branch", region: "Solo" },
      { ceoUnitId: insertedCeoUnits[1].id, ptId: insertedPts[1].id, code: "BANDUNG", name: "Bandung Branch", region: "Bandung" },
      
      // KPF branches (GS unit)
      { ceoUnitId: insertedCeoUnits[2].id, ptId: insertedPts[2].id, code: "BALI", name: "Bali Branch", region: "Bali" },
      { ceoUnitId: insertedCeoUnits[2].id, ptId: insertedPts[2].id, code: "MAKASSAR", name: "Makassar Branch", region: "Makassar" },
      
      // SGB branches (TJANDRA unit)
      { ceoUnitId: insertedCeoUnits[3].id, ptId: insertedPts[3].id, code: "SEMARANG", name: "Semarang Branch", region: "Semarang" },
      
      // BPF branches (EDWIN unit)
      { ceoUnitId: insertedCeoUnits[4].id, ptId: insertedPts[4].id, code: "PALEMBANG", name: "Palembang Branch", region: "Palembang" },
      { ceoUnitId: insertedCeoUnits[4].id, ptId: insertedPts[4].id, code: "JOGJA", name: "Yogyakarta Branch", region: "Yogyakarta" },
    ];

    const insertedBranches: any[] = [];
    for (const branch of branchData) {
      const [inserted] = await db.insert(branches).values(branch).returning();
      insertedBranches.push(inserted);
      console.log(`  ✅ ${branch.code} - ${branch.name} (${branch.region})`);
    }

    // ========================================================================
    // 4. SEED POSITIONS (11 levels)
    // ========================================================================
    console.log("\n📋 Seeding Position Hierarchy...");
    
    const positionData = [
      { code: "OWNER", name: "Owner", level: 1, description: "Company owner (highest rank)" },
      { code: "CEO", name: "Chief Executive Officer", level: 2, description: "Chief executive officer" },
      { code: "CBO", name: "Chief Branch Officer", level: 3, description: "Chief branch officer" },
      { code: "BrM", name: "Branch Manager", level: 4, description: "Branch manager" },
      { code: "VBM", name: "Vice Branch Manager", level: 5, description: "Vice branch manager" },
      { code: "SEM", name: "Senior Executive Manager", level: 6, description: "Senior executive manager" },
      { code: "EM", name: "Executive Manager", level: 7, description: "Executive manager" },
      { code: "SBM", name: "Senior Business Manager", level: 8, description: "Senior business manager" },
      { code: "BsM", name: "Business Manager", level: 9, description: "Business manager" },
      { code: "SBC", name: "Senior Business Consultant", level: 10, description: "Senior consultant" },
      { code: "BC", name: "Business Consultant", level: 11, description: "Entry level consultant (lowest rank)" },
    ];

    const insertedPositions: any[] = [];
    for (const position of positionData) {
      const [inserted] = await db.insert(positions).values(position).returning();
      insertedPositions.push(inserted);
      console.log(`  ✅ Level ${position.level}: ${position.code} - ${position.name}`);
    }

    // ========================================================================
    // 5. CREATE SUPER ADMIN USER
    // ========================================================================
    console.log("\n👤 Creating Super Admin...");
    
    // Check if superadmin exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);
    
    if (existing) {
      console.log("  ⚠️  Superadmin already exists!");
      console.log(`     Username: ${existing.username}`);
      console.log(`     Name: ${existing.name}`);
      console.log(`     Role: ${existing.role}`);
    } else {
      const superadmin = await createUser({
        username: "superadmin",
        password: "vito1007",
        name: "AiSG Super Admin",
        role: "super_admin",
      });
      
      console.log("  ✅ Superadmin created successfully!");
      console.log(`     Username: ${superadmin.username}`);
      console.log(`     Role: ${superadmin.role}`);
    }

    // ========================================================================
    // SUCCESS SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ AISG ENTERPRISE SEED COMPLETED!");
    console.log("=".repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   • PT Companies: ${insertedPts.length}`);
    console.log(`   • CEO Units: ${insertedCeoUnits.length}`);
    console.log(`   • Branches: ${insertedBranches.length}`);
    console.log(`   • Positions: ${insertedPositions.length}`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Username: superadmin`);
    console.log(`   Password: vito1007`);
    console.log(`\n🎉 You can now start building the enterprise system!`);
    console.log(`\nNext steps:`);
    console.log(`   1. Add employees via master data management`);
    console.log(`   2. Input monthly performance data`);
    console.log(`   3. Create enterprise audits with hierarchical aggregation`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding enterprise data:", error);
    process.exit(1);
  }
}

seedEnterprise();
