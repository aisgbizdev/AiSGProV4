import { Router } from 'express';
import multer from 'multer';
import { parseBASExcel, validateBASData, type BASEmployeeRow, getBranchInfo } from '../services/bas-parser';
import { db } from '../db';
import { employees, monthlyPerformance, positions, branches, pts } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Configure multer for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xls|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
    }
  },
});

// ============================================================================
// POST /api/enterprise/upload-bas
// Upload BAS Excel file and populate employees + monthly_performance
// ============================================================================

router.post('/upload-bas', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Parse BAS Excel
    console.log('Parsing BAS file:', req.file.originalname);
    const parseResult = parseBASExcel(req.file.buffer);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse BAS file',
        errors: parseResult.errors.slice(0, 10), // Return first 10 errors
        summary: parseResult.summary
      });
    }

    // Validate data
    const validation = validateBASData(parseResult.data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errors: validation.errors.slice(0, 10)
      });
    }

    console.log(`Processing ${parseResult.data.length} employees...`);

    // Ensure all PTs and Positions exist
    const [positionMap, ptMap] = await Promise.all([
      ensurePositionsExist(),
      ensurePTsExist()
    ]);

    // Discover and create new branches from BAS data
    const branchMap = await ensureBranchesExist(parseResult.data, ptMap);

    console.log('Reference data ready. Starting bulk upsert...');

    // Prepare bulk insert data
    const employeeRecords: any[] = [];
    const performanceRecords: any[] = [];
    const currentYear = new Date().getFullYear();

    // Track emails to handle duplicates
    const emailsSeen = new Set<string>();
    const duplicateEmails: Array<{ email: string; employeeCodes: string[] }> = [];
    const emailToCodes = new Map<string, string[]>();

    for (const emp of parseResult.data) {
      const positionId = positionMap.get(emp.positionCode);
      const ptId = ptMap.get(emp.ptCode);
      const branchId = branchMap.get(emp.branchCode);

      if (!positionId || !ptId) {
        continue; // Skip invalid records
      }

      // Handle duplicate emails by nullifying them
      let email = emp.email || null;
      if (email) {
        const emailLower = email.toLowerCase();
        if (emailsSeen.has(emailLower)) {
          // Track duplicate for reporting
          if (!emailToCodes.has(emailLower)) {
            emailToCodes.set(emailLower, []);
          }
          emailToCodes.get(emailLower)!.push(emp.employeeCode);
          email = null; // Duplicate email - set to null
        } else {
          emailsSeen.add(emailLower);
          emailToCodes.set(emailLower, [emp.employeeCode]);
        }
      }

      employeeRecords.push({
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email,
        phone: emp.phone || null,
        dateOfBirth: emp.dateOfBirth,
        joinDate: emp.joinDate,
        positionId,
        branchId: branchId || null,
        ptId,
        status: emp.status
      });

      // Prepare 12-month performance records
      for (let month = 1; month <= 12; month++) {
        const quarter = Math.ceil(month / 3);
        performanceRecords.push({
          employeeCode: emp.employeeCode, // Temp field for linking
          year: currentYear,
          month,
          quarter,
          marginPersonal: emp.margin[month - 1].toString(),
          naPersonal: emp.na[month - 1]
        });
      }
    }

    console.log(`Bulk upserting ${employeeRecords.length} employees...`);

    // Bulk upsert employees
    const results = {
      employeesInserted: 0,
      employeesUpdated: 0,
      performanceRecordsInserted: 0,
      errors: [] as Array<{ code: string; message: string }>
    };

    if (employeeRecords.length > 0) {
      const upsertedEmployees = await db
        .insert(employees)
        .values(employeeRecords)
        .onConflictDoUpdate({
          target: employees.employeeCode,
          set: {
            fullName: sql`EXCLUDED.full_name`,
            email: sql`EXCLUDED.email`,
            phone: sql`EXCLUDED.phone`,
            dateOfBirth: sql`EXCLUDED.date_of_birth`,
            positionId: sql`EXCLUDED.position_id`,
            branchId: sql`EXCLUDED.branch_id`,
            ptId: sql`EXCLUDED.pt_id`,
            status: sql`EXCLUDED.status`,
            updatedAt: sql`NOW()`
          }
        })
        .returning({ id: employees.id, employeeCode: employees.employeeCode });

      results.employeesInserted = upsertedEmployees.length;
      console.log(`Upserted ${upsertedEmployees.length} employees`);

      // Build employee code to ID map for performance records
      const employeeCodeToId = new Map(upsertedEmployees.map(e => [e.employeeCode, e.id]));

      // Bulk insert performance records
      const performanceValues = performanceRecords
        .map(perf => {
          const employeeId = employeeCodeToId.get(perf.employeeCode as string);
          return employeeId ? {
            employeeId,
            year: perf.year,
            month: perf.month,
            quarter: perf.quarter,
            marginPersonal: perf.marginPersonal,
            naPersonal: perf.naPersonal
          } : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      console.log(`Bulk upserting ${performanceValues.length} performance records...`);

      // Delete existing performance records ONLY for uploaded employees (scoped deletion)
      if (performanceValues.length > 0) {
        const employeeIdsToDelete = [...new Set(performanceValues.map(p => p.employeeId))];
        console.log(`  Cleaning ${employeeIdsToDelete.length} employees' ${currentYear} performance data...`);
        
        // CRITICAL: Delete only the employees in this upload, not all employees
        // Use Drizzle's deleteFrom with inArray helper
        await db
          .delete(monthlyPerformance)
          .where(
            sql`${monthlyPerformance.year} = ${currentYear} 
                AND ${monthlyPerformance.employeeId} IN (SELECT unnest(ARRAY[${sql.join(employeeIdsToDelete.map(id => sql`${id}`), sql`, `)}]::uuid[]))`
          );
        
        console.log(`  Cleaned ${employeeIdsToDelete.length} employees' ${currentYear} data`);
      }

      // Batch insert performance records (no conflicts after delete)
      if (performanceValues.length > 0) {
        const PERF_BATCH_SIZE = 1000;
        let insertedCount = 0;

        for (let i = 0; i < performanceValues.length; i += PERF_BATCH_SIZE) {
          const batch = performanceValues.slice(i, i + PERF_BATCH_SIZE);
          
          await db
            .insert(monthlyPerformance)
            .values(batch);

          insertedCount += batch.length;
          console.log(`  Inserted ${insertedCount}/${performanceValues.length} performance records`);
        }

        results.performanceRecordsInserted = insertedCount;
      }
    }

    // Link managers (code or name-based matching)
    console.log('Linking manager relationships...');
    await linkManagersBulk(parseResult.data);

    // Build duplicate email report
    emailToCodes.forEach((codes, email) => {
      if (codes.length > 1) {
        duplicateEmails.push({ email, employeeCodes: codes });
      }
    });

    return res.json({
      success: true,
      message: `Successfully processed ${parseResult.data.length} employees`,
      summary: {
        totalRows: parseResult.summary.totalRows,
        employeesInserted: results.employeesInserted,
        employeesUpdated: results.employeesUpdated,
        performanceRecordsInserted: results.performanceRecordsInserted,
        byPosition: parseResult.summary.byPosition,
        byBranch: parseResult.summary.byBranch,
        duplicateEmailsNullified: duplicateEmails.length,
        duplicateEmailDetails: duplicateEmails.slice(0, 10) // Show first 10
      },
      errors: results.errors.slice(0, 10)
    });

  } catch (error) {
    console.error('Upload BAS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure positions exist and return map
 */
async function ensurePositionsExist(): Promise<Map<string, string>> {
  // Seed default positions
  const defaultPositions = [
    { code: 'BC', name: 'Business Consultant', level: 1 },
    { code: 'SBC', name: 'Senior Business Consultant', level: 2 },
    { code: 'BSM', name: 'Business Sales Manager', level: 3 },
    { code: 'SBM', name: 'Senior Business Manager', level: 4 },
    { code: 'EM', name: 'Executive Manager', level: 5 },
    { code: 'SEM', name: 'Senior Executive Manager', level: 6 },
    { code: 'VBM', name: 'Vice Branch Manager', level: 7 },
    { code: 'BRM', name: 'Branch Manager', level: 8 },
    { code: 'BM', name: 'Business Manager', level: 9 },
    { code: 'CBO', name: 'Chief Business Officer', level: 10 },
    { code: 'OWNER', name: 'Owner', level: 11 }
  ];

  await db.insert(positions).values(defaultPositions).onConflictDoNothing();
  
  // Return map
  const allPositions = await db.select().from(positions);
  return new Map(allPositions.map(p => [p.code, p.id]));
}

/**
 * Ensure PTs exist and return map
 */
async function ensurePTsExist(): Promise<Map<string, string>> {
  const defaultPTs = [
    { code: 'RFB', name: 'PT RFB', status: 'active' as const },
    { code: 'EWF', name: 'PT EWF', status: 'active' as const },
    { code: 'KPF', name: 'PT KPF', status: 'active' as const },
    { code: 'SGB', name: 'PT SGB', status: 'active' as const },
    { code: 'BPF', name: 'PT BPF', status: 'active' as const }
  ];

  await db.insert(pts).values(defaultPTs).onConflictDoNothing();

  // Return map
  const allPTs = await db.select().from(pts);
  return new Map(allPTs.map(p => [p.code, p.id]));
}

/**
 * Discover and create branches from BAS data using official mapping, return map
 */
async function ensureBranchesExist(
  data: BASEmployeeRow[],
  ptMap: Map<string, string>
): Promise<Map<string, string>> {
  // Discover unique branches
  const branchCodes = new Set(data.map(emp => emp.branchCode).filter(Boolean));
  
  // Get first PT ID as default for branches without mapping
  const defaultPtId = Array.from(ptMap.values())[0];

  // Ensure default CEO unit exists
  const defaultCeoUnitId = await ensureDefaultCeoUnit(defaultPtId);

  // Create branches using official mapping
  const branchesToCreate = Array.from(branchCodes).map(code => {
    const branchInfo = getBranchInfo(code!);
    
    // Use branch mapping if available
    if (branchInfo) {
      const correctPtId = ptMap.get(branchInfo.pt) || defaultPtId;
      return {
        code: code!,
        name: branchInfo.name, // Use correct name from mapping (e.g., "AXA TOWER 2")
        ceoUnitId: defaultCeoUnitId,
        ptId: correctPtId, // Use correct PT from mapping (e.g., RFB for BM)
        status: 'active' as const
      };
    }
    
    // Fallback for unmapped branches
    return {
      code: code!,
      name: `Branch ${code}`,
      ceoUnitId: defaultCeoUnitId,
      ptId: defaultPtId,
      status: 'active' as const
    };
  });

  if (branchesToCreate.length > 0) {
    await db.insert(branches).values(branchesToCreate).onConflictDoNothing();
    console.log(`✅ Ensured ${branchesToCreate.length} branches exist (with official names)`);
  }

  // Return map
  const allBranches = await db.select().from(branches);
  return new Map(allBranches.map(b => [b.code, b.id]));
}

/**
 * Ensure default CEO unit exists for branch auto-creation
 */
async function ensureDefaultCeoUnit(ptId: string): Promise<string> {
  const { ceoUnits } = await import('@shared/schema');
  
  // Try to find existing default CEO unit
  const existing = await db.select().from(ceoUnits).limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create default CEO unit
  const [created] = await db.insert(ceoUnits)
    .values({
      ptId,
      code: 'DEFAULT',
      name: 'Default CEO Unit',
      status: 'active'
    })
    .returning({ id: ceoUnits.id });

  return created.id;
}

/**
 * Link managers in bulk using single SQL update
 */
async function linkManagersBulk(data: BASEmployeeRow[]) {
  // Filter employees that have manager info (code or name)
  const employeesWithManagers = data.filter(emp => emp.managerCode || emp.managerName);
  
  if (employeesWithManagers.length === 0) {
    console.log('No manager relationships to link');
    return;
  }

  let linkedCount = 0;
  const skippedAmbiguous: string[] = [];

  // Execute bulk update using code or name matching
  for (const emp of employeesWithManagers) {
    try {
      if (emp.managerCode) {
        // Try to link by manager code first (most reliable)
        const result = await db.execute(sql`
          UPDATE employees 
          SET manager_id = (
            SELECT id FROM employees 
            WHERE employee_code = ${emp.managerCode}
            LIMIT 1
          )
          WHERE employee_code = ${emp.employeeCode}
            AND EXISTS (
              SELECT 1 FROM employees 
              WHERE employee_code = ${emp.managerCode}
              HAVING COUNT(*) = 1
            )
        `);
        linkedCount++;
      } else if (emp.managerName) {
        // Fallback to name-based matching - only if exactly ONE match
        const matchCount = await db.execute(sql`
          SELECT COUNT(*) as count FROM employees 
          WHERE LOWER(full_name) = LOWER(${emp.managerName})
        `);
        
        const count = (matchCount.rows[0] as any)?.count || 0;
        
        if (count === 1) {
          // Safe to link - only one match
          await db.execute(sql`
            UPDATE employees 
            SET manager_id = (
              SELECT id FROM employees 
              WHERE LOWER(full_name) = LOWER(${emp.managerName})
              LIMIT 1
            )
            WHERE employee_code = ${emp.employeeCode}
          `);
          linkedCount++;
        } else if (count > 1) {
          // Skip ambiguous match
          skippedAmbiguous.push(emp.employeeCode);
        }
      }
    } catch (error) {
      console.error(`Error linking manager for ${emp.employeeCode}:`, error);
    }
  }

  if (skippedAmbiguous.length > 0) {
    console.log(`⚠️  Skipped ${skippedAmbiguous.length} ambiguous manager matches (duplicate names)`);
  }
  console.log(`✅ Linked ${linkedCount}/${employeesWithManagers.length} manager relationships`);
}

// ============================================================================
// GET /api/enterprise/branches
// List all branches with employee count
// ============================================================================

router.get('/branches', async (req, res) => {
  try {
    // Get all branches with employee counts
    const branchList = await db
      .select({
        id: branches.id,
        code: branches.code,
        name: branches.name,
        ptId: branches.ptId,
        ceoUnitId: branches.ceoUnitId,
      })
      .from(branches)
      .orderBy(branches.code);

    // Get employee count per branch
    const branchesWithCount = await Promise.all(
      branchList.map(async (branch) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(employees)
          .where(eq(employees.branchId, branch.id));

        return {
          ...branch,
          employeeCount: countResult?.count || 0,
        };
      })
    );

    // Sort by employee count descending
    branchesWithCount.sort((a, b) => b.employeeCount - a.employeeCount);

    return res.json({
      success: true,
      data: branchesWithCount,
    });
  } catch (error) {
    console.error('Get branches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch branches',
    });
  }
});

// ============================================================================
// GET /api/enterprise/employees
// List employees with search, filter, pagination
// ============================================================================

router.get('/employees', async (req, res) => {
  try {
    const {
      search = '',
      position = '',
      branch = '',
      status = 'active',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(employees.status, status as string));
    }

    // Query employees with joins (using SQL casting for type safety)
    let query = db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        dateOfBirth: employees.dateOfBirth,
        joinDate: employees.joinDate,
        status: employees.status,
        position: {
          id: positions.id,
          code: positions.code,
          name: positions.name,
          level: positions.level
        },
        branch: {
          id: branches.id,
          code: branches.code,
          name: branches.name
        },
        pt: {
          id: pts.id,
          code: pts.code,
          name: pts.name
        }
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .leftJoin(pts, sql`${employees.ptId}::uuid = ${pts.id}`);

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Execute query
    const allResults = await query;

    // Apply search filter (in-memory for now)
    let filtered = allResults;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = allResults.filter(emp => 
        emp.fullName.toLowerCase().includes(searchLower) ||
        emp.employeeCode.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply position filter
    if (position && position !== 'all') {
      filtered = filtered.filter(emp => emp.position?.code === position);
    }

    // Apply branch filter
    if (branch && branch !== 'all') {
      filtered = filtered.filter(emp => emp.branch?.code === branch);
    }

    // Pagination
    const total = filtered.length;
    const paginatedResults = filtered.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ============================================================================
// GET /api/enterprise/employees/:id
// Get employee detail with performance data
// ============================================================================

router.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get employee with relations (using SQL casting for type safety)
    const [employee] = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        dateOfBirth: employees.dateOfBirth,
        joinDate: employees.joinDate,
        status: employees.status,
        managerId: employees.managerId,
        position: {
          id: positions.id,
          code: positions.code,
          name: positions.name,
          level: positions.level
        },
        branch: {
          id: branches.id,
          code: branches.code,
          name: branches.name
        },
        pt: {
          id: pts.id,
          code: pts.code,
          name: pts.name
        }
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .leftJoin(pts, sql`${employees.ptId}::uuid = ${pts.id}`)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get manager info
    let manager = null;
    if (employee.managerId) {
      const [mgr] = await db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          fullName: employees.fullName,
          position: {
            code: positions.code,
            name: positions.name
          }
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.id, employee.managerId))
        .limit(1);

      manager = mgr || null;
    }

    // Get subordinates
    const subordinates = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        position: {
          code: positions.code,
          name: positions.name
        }
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.managerId, id));

    // Get 12-month performance
    const currentYear = new Date().getFullYear();
    const performance = await db
      .select()
      .from(monthlyPerformance)
      .where(
        and(
          eq(monthlyPerformance.employeeId, id),
          eq(monthlyPerformance.year, currentYear)
        )
      )
      .orderBy(monthlyPerformance.month);

    // Format performance data for charts
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const perf = performance.find((p) => p.month === month);

      return {
        month: month,
        marginPersonal: perf ? parseFloat(perf.marginPersonal) : 0,
        naPersonal: perf ? perf.naPersonal : 0,
        marginTeam: perf ? parseFloat(perf.marginTeam || '0') : 0,
        naTeam: perf ? (perf.naTeam || 0) : 0
      };
    });

    return res.json({
      success: true,
      data: {
        employee: employee,
        manager: manager,
        subordinates: subordinates,
        performance: monthlyData
      }
    });

  } catch (error) {
    console.error('Get employee detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee detail',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
