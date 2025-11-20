import { db } from "../db.js";
import { 
  ceoUnits, 
  pts, 
  branches, 
  employees, 
  monthlyPerformance,
  positions 
} from "../../shared/schema.js";
import { eq, and, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { BASParseResult } from "../parsers/bas-production-parser.js";

interface BulkUploadOptions {
  period: string; // YYYY-MM format
  overwriteExisting: boolean;
}

interface BulkUploadResult {
  message: string;
  summary: {
    ceoUnitsCreated: number;
    ptsCreated: number;
    branchesCreated: number;
    employeesCreated: number;
    employeesUpdated: number;
    performanceRecordsCreated: number;
    hierarchyLinked: number;
    emailConflicts: number;
    errors: Array<{ employee: string; message: string }>;
  };
}

export async function bulkUploadBASData(
  parseResult: BASParseResult,
  options: BulkUploadOptions,
  uploadedBy: string
): Promise<BulkUploadResult> {
  
  const summary = {
    ceoUnitsCreated: 0,
    ptsCreated: 0,
    branchesCreated: 0,
    employeesCreated: 0,
    employeesUpdated: 0,
    performanceRecordsCreated: 0,
    hierarchyLinked: 0,
    emailConflicts: 0,
    errors: [] as Array<{ employee: string; message: string }>,
  };

  console.log(`[BAS Bulk Upload] Starting bulk upload for ${parseResult.employees.length} employees`);

  try {
    // Step 0: DELETE ALL EMPLOYEES if overwrite mode (CRITICAL!)
    if (options.overwriteExisting) {
      console.log(`[BAS Bulk Upload] Step 0: Deleting all existing employees (overwrite mode)...`);
      const deletedCount = await db.delete(employees).execute();
      console.log(`  ✓ Deleted all existing employees`);
    }
    
    // Step 1: Auto-create PTs first (no foreign keys)
    console.log(`[BAS Bulk Upload] Step 1: Creating ${parseResult.pts.length} PTs...`);
    const ptMap = new Map<string, string>(); // code -> id
    for (const pt of parseResult.pts) {
      const existing = await db
        .select()
        .from(pts)
        .where(eq(pts.code, pt.code))
        .limit(1);

      if (existing.length === 0) {
        const [newPt] = await db.insert(pts).values({
          name: pt.name,
          code: pt.code,
        }).returning();
        ptMap.set(pt.code, newPt.id);
        summary.ptsCreated++;
        console.log(`  ✓ Created PT: ${pt.code} - ${pt.name}`);
      } else {
        ptMap.set(pt.code, existing[0].id);
      }
    }

    // Step 2: Auto-create CEO Units (requires ptId)
    console.log(`[BAS Bulk Upload] Step 2: Creating ${parseResult.ceoUnits.length} CEO Units...`);
    const ceoUnitMap = new Map<string, string>(); // name -> id
    for (const pt of parseResult.pts) {
      const ptId = ptMap.get(pt.code);
      if (!ptId) {
        console.error(`  ✗ PT not found: ${pt.code}`);
        continue;
      }
      
      const existing = await db
        .select()
        .from(ceoUnits)
        .where(eq(ceoUnits.name, pt.ceoUnit))
        .limit(1);

      if (existing.length === 0) {
        const ceoUnitCode = pt.ceoUnit.substring(0, 10).toUpperCase().replace(/\s/g, '');
        const [newCeoUnit] = await db.insert(ceoUnits).values({
          ptId,
          code: ceoUnitCode,
          name: pt.ceoUnit,
        }).returning();
        ceoUnitMap.set(pt.ceoUnit, newCeoUnit.id);
        summary.ceoUnitsCreated++;
        console.log(`  ✓ Created CEO Unit: ${pt.ceoUnit}`);
      } else {
        ceoUnitMap.set(pt.ceoUnit, existing[0].id);
      }
    }

    // Step 3: Auto-create Branches
    console.log(`[BAS Bulk Upload] Step 3: Creating ${parseResult.branches.length} Branches...`);
    for (const branch of parseResult.branches) {
      // Get PT
      const pt = await db
        .select()
        .from(pts)
        .where(eq(pts.code, branch.ptCode))
        .limit(1);

      if (pt.length === 0) {
        console.error(`  ✗ PT not found: ${branch.ptCode}`);
        continue;
      }

      // Get PT ID and CEO Unit ID
      const ptId = ptMap.get(branch.ptCode);
      if (!ptId) {
        console.error(`  ✗ PT not found: ${branch.ptCode}`);
        continue;
      }
      
      // Get CEO Unit ID from PT's ceoUnit
      const ptData = parseResult.pts.find(p => p.code === branch.ptCode);
      const ceoUnitId = ptData ? ceoUnitMap.get(ptData.ceoUnit) : undefined;

      const existing = await db
        .select()
        .from(branches)
        .where(eq(branches.code, branch.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(branches).values({
          name: branch.name,
          code: branch.code,
          ptId,
          ceoUnitId,
        });
        summary.branchesCreated++;
        console.log(`  ✓ Created Branch: ${branch.code} - ${branch.name}`);
      }
    }

    // Step 4: Get all positions for mapping
    const allPositions = await db.select().from(positions);
    const positionMap = new Map(allPositions.map(p => [p.name.toLowerCase(), p.id]));

    // Step 5: Get all existing branches for mapping
    const allBranches = await db.select().from(branches);
    const branchMap = new Map(allBranches.map(b => [b.code, b]));

    // Step 6: BULK INSERT ALL EMPLOYEES (SUPER FAST!)
    console.log(`[BAS Bulk Upload] Step 4: Preparing ${parseResult.employees.length} employees for bulk insert...`);
    
    const employeeIdMap = new Map<string, string>(); // nama -> employeeId
    const employeesToInsert: any[] = [];
    
    // Position code mapping
    const basPositionCodeMap: Record<string, string> = {
      'EM': 'EM',
      'SPV': 'SPV',
      'KSPV': 'KSM',
      'KSM': 'KSM',
      'BM': 'BrM',
      'BrM': 'BrM',
      'MM': 'MM',
      'CBO': 'CBO',
      'CEO': 'CEO',
      'MKT': 'MKT',
    };
    
    // Track emails to detect duplicates
    const emailSeen = new Map<string, number>(); // email -> count
    const validEmployees: any[] = [];
    
    // First pass: validate and track emails
    for (const emp of parseResult.employees) {
      const branch = branchMap.get(emp.branchCode);
      if (!branch) {
        summary.errors.push({ employee: emp.nama, message: `Branch not found: ${emp.branchCode}` });
        continue;
      }

      const positionCode = basPositionCodeMap[emp.jabatan.toUpperCase()] || emp.jabatan.toUpperCase();
      let positionId = allPositions.find(p => p.code === positionCode)?.id;
      
      if (!positionId) {
        summary.errors.push({ employee: emp.nama, message: `Position not found: ${emp.jabatan}` });
        continue;
      }

      // Track email usage
      if (emp.email) {
        emailSeen.set(emp.email, (emailSeen.get(emp.email) || 0) + 1);
      }

      validEmployees.push({ emp, branch, positionId });
    }
    
    // Second pass: prepare insert data with duplicate email handling
    for (const { emp, branch, positionId } of validEmployees) {
      // Use BAS employee code directly (NO RANDOM GENERATION!)
      const employeeCode = emp.employeeCode;

      // Set email to NULL if it's duplicate or invalid (prevent unique constraint error)
      let finalEmail = emp.email;
      if (emp.email && (emailSeen.get(emp.email)! > 1 || emp.email.length < 5)) {
        finalEmail = null;
        summary.emailConflicts++;
      }

      employeesToInsert.push({
        employeeCode,
        fullName: emp.nama,
        email: finalEmail,
        dateOfBirth: emp.tglLahir,
        ptId: branch.ptId!,
        branchId: branch.id,
        positionId,
        ceoUnitId: branch.ceoUnitId,
        joinDate: emp.tglLahir,
        status: emp.statusKerja === 'TETAP' ? 'active' : 'freelance',
      });
    }

    // BULK INSERT ALL AT ONCE! (1 query instead of 3248!)
    console.log(`[BAS Bulk Upload] Bulk inserting ${employeesToInsert.length} employees...`);
    const insertedEmployees = await db.insert(employees).values(employeesToInsert).returning();
    
    // Map inserted employees
    for (let i = 0; i < insertedEmployees.length; i++) {
      const emp = parseResult.employees[i];
      employeeIdMap.set(emp.nama, insertedEmployees[i].id);
    }
    summary.employeesCreated = insertedEmployees.length;
    console.log(`  ✓ Created ${summary.employeesCreated} employees in one bulk insert!`)

    // Step 7: Link managers (hierarchy)
    console.log(`[BAS Bulk Upload] Step 5: Linking manager hierarchy...`);
    for (const emp of parseResult.employees) {
      if (emp.atasan) {
        const employeeId = employeeIdMap.get(emp.nama);
        const managerId = employeeIdMap.get(emp.atasan);

        if (employeeId && managerId) {
          await db
            .update(employees)
            .set({ managerId })
            .where(eq(employees.id, employeeId));
          
          summary.hierarchyLinked++;
        }
      }
    }

    // Step 8: Create monthly performance records (all 12 months)
    console.log(`[BAS Bulk Upload] Step 6: Creating performance records for ${parseResult.employees.length} employees x 12 months...`);
    
    const [year, month] = options.period.split('-').map(Number);
    
    // Delete existing performance records if overwrite enabled
    if (options.overwriteExisting) {
      const employeeIds = Array.from(employeeIdMap.values());
      
      // Process deletions in batches
      const DELETE_BATCH_SIZE = 500;
      for (let i = 0; i < employeeIds.length; i += DELETE_BATCH_SIZE) {
        const batchIds = employeeIds.slice(i, i + DELETE_BATCH_SIZE);
        
        await db
          .delete(monthlyPerformance)
          .where(
            and(
              inArray(monthlyPerformance.employeeId, batchIds),
              sql`EXTRACT(YEAR FROM ${monthlyPerformance.period}) = ${year}`
            )
          );
      }
      
      console.log(`  Deleted existing performance records for year ${year}`);
    }

    // Batch insert performance records
    const PERF_BATCH_SIZE = 1000;
    const performanceRecords: any[] = [];

    for (const emp of parseResult.employees) {
      const employeeId = employeeIdMap.get(emp.nama);
      if (!employeeId) continue;

      // Create 12 monthly records
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthNumber = monthIndex + 1;
        const periodDate = new Date(year, monthIndex, 1);

        performanceRecords.push({
          employeeId,
          period: periodDate,
          margin: emp.marginPerBulan[monthIndex] || 0,
          na: emp.naPerBulan[monthIndex] || 0,
        });
      }
    }

    // Insert in batches
    for (let i = 0; i < performanceRecords.length; i += PERF_BATCH_SIZE) {
      const batch = performanceRecords.slice(i, i + PERF_BATCH_SIZE);
      await db.insert(monthlyPerformance).values(batch);
      summary.performanceRecordsCreated += batch.length;
      
      console.log(`  Inserted batch ${Math.floor(i / PERF_BATCH_SIZE) + 1}/${Math.ceil(performanceRecords.length / PERF_BATCH_SIZE)} (${batch.length} records)`);
    }

    console.log(`[BAS Bulk Upload] Complete!`);

    return {
      message: `Successfully uploaded ${summary.employeesCreated + summary.employeesUpdated} employees with ${summary.performanceRecordsCreated} performance records`,
      summary,
    };

  } catch (error: any) {
    console.error('[BAS Bulk Upload] Fatal error:', error);
    throw new Error(`Bulk upload failed: ${error.message}`);
  }
}
