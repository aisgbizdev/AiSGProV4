import type { Audit, Employee, MonthlyPerformance } from "@shared/schema";
import type { IStorage } from "./storage";

/**
 * MVP decimal parsing - Handles most common cases
 * 
 * Assumptions for MVP:
 * - Frontend inputs standard format: "1234567.89" (dot decimal, no thousands separators)
 * - Database stores DECIMAL type natively
 * - CSV imports will be standardized in Phase 3
 * 
 * Supported formats:
 * - Plain numbers: "1234567" or "1234567.89"
 * - US format with commas: "1,234,567.89"
 * - European format with full separators: "1.234.567,89"
 * 
 * TODO Phase 3: Implement locale-aware parsing with explicit DecimalLocale parameter
 * as recommended by architect (see Task 12 review notes)
 */
function parseDecimalSafe(value: string): number {
  if (!value || value === "") return 0;
  
  const trimmed = value.trim();
  
  // Check if both separators present (unambiguous)
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  
  let normalized: string;
  
  if (hasComma && hasDot) {
    // Both separators → Last one is decimal
    const lastComma = trimmed.lastIndexOf(",");
    const lastDot = trimmed.lastIndexOf(".");
    
    if (lastComma > lastDot) {
      // European: dot thousands, comma decimal
      normalized = trimmed.replace(/\./g, "").replace(",", ".");
    } else {
      // US: comma thousands, dot decimal
      normalized = trimmed.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Only comma → Remove (assume US thousands for MVP)
    // TODO Phase 3: Check locale to determine if decimal or thousands
    normalized = trimmed.replace(/,/g, "");
  } else {
    // No comma or only dots → Keep as-is (standard format)
    normalized = trimmed;
  }
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export interface AggregationResult {
  marginTeamQ: string;
  naTeamQ: number;
  teamStructure: {
    totalSubordinates: number;
    auditedSubordinates: number;
    coveragePct: number;
    byPosition: Array<{
      positionCode: string;
      positionName: string;
      count: number;
      auditedCount: number;
    }>;
  };
  warnings: string[];
  pendingSubordinates: Array<{
    id: string;
    employeeCode: string;
    fullName: string;
    positionName: string;
  }>;
}

/**
 * Calculate team aggregation from subordinates' audits
 * 
 * Sum BOTH marginPersonalQ + marginTeamQ from each subordinate
 * to capture full nested tree (not just direct reports' personal performance)
 */
export async function calculateTeamAggregation(
  storage: IStorage,
  managerId: string,
  year: number,
  quarter: number
): Promise<AggregationResult> {
  // 1. Get all direct subordinates
  const subordinates = await storage.getSubordinates(managerId);
  
  if (subordinates.length === 0) {
    return {
      marginTeamQ: "0.00",
      naTeamQ: 0,
      teamStructure: {
        totalSubordinates: 0,
        auditedSubordinates: 0,
        coveragePct: 100,
        byPosition: [],
      },
      warnings: [],
      pendingSubordinates: [],
    };
  }
  
  // 2. Get positions for subordinates
  const uniquePositionIds = new Set(subordinates.map(s => s.positionId));
  const positionIds = Array.from(uniquePositionIds);
  const positions = await Promise.all(
    positionIds.map(id => storage.getPosition(id))
  );
  const positionMap = new Map(
    positions.filter(p => p !== undefined).map(p => [p!.id, p!])
  );
  
  // 3. Get audits for all subordinates in same period
  const subordinateIds = subordinates.map(s => s.id);
  const subordinateAudits = await storage.getAuditsForEmployeesInPeriod(subordinateIds, year, quarter);
  
  // 4. Create map for quick lookup
  const auditMap = new Map<string, Audit>();
  subordinateAudits.forEach(audit => auditMap.set(audit.employeeId, audit));
  
  // 5. Calculate aggregation (marginPersonalQ + marginTeamQ from each subordinate)
  let totalMarginTeam = 0;
  let totalNATeam = 0;
  
  for (const audit of subordinateAudits) {
    // Sum both personal and team values to capture full nested tree
    // Normalize decimal strings (remove locale formatting before parsing)
    totalMarginTeam += parseDecimalSafe(audit.marginPersonalQ || "0");
    totalMarginTeam += parseDecimalSafe(audit.marginTeamQ || "0");
    
    totalNATeam += (audit.naPersonalQ || 0);
    totalNATeam += (audit.naTeamQ || 0);
  }
  
  // 6. Build teamStructure snapshot grouped by position
  const positionGroups = new Map<string, {
    positionCode: string;
    positionName: string;
    count: number;
    auditedCount: number;
  }>();
  
  for (const subordinate of subordinates) {
    const key = subordinate.positionId;
    const position = positionMap.get(subordinate.positionId);
    
    if (!positionGroups.has(key)) {
      positionGroups.set(key, {
        positionCode: position?.code || "UNKNOWN",
        positionName: position?.name || "Unknown Position",
        count: 0,
        auditedCount: 0,
      });
    }
    
    const group = positionGroups.get(key)!;
    group.count++;
    
    if (auditMap.has(subordinate.id)) {
      group.auditedCount++;
    }
  }
  
  // 7. Identify pending subordinates (haven't audited yet)
  const pendingSubordinates = subordinates
    .filter(s => !auditMap.has(s.id))
    .map(s => {
      const position = positionMap.get(s.positionId);
      return {
        id: s.id,
        employeeCode: s.employeeCode,
        fullName: s.fullName,
        positionName: position?.name || "Unknown Position",
      };
    });
  
  // 8. Build warnings (text-only, no emoji per design guidelines)
  const warnings: string[] = [];
  const auditedCount = subordinateAudits.length;
  const totalCount = subordinates.length;
  const coveragePct = Math.round((auditedCount / totalCount) * 100);
  
  if (auditedCount === 0) {
    warnings.push("PERINGATAN: Belum ada subordinate yang diaudit untuk periode ini");
  } else if (auditedCount < totalCount) {
    warnings.push(`PERINGATAN: ${totalCount - auditedCount} dari ${totalCount} subordinate belum diaudit (${coveragePct}% coverage)`);
  }
  
  return {
    marginTeamQ: totalMarginTeam.toFixed(2),
    naTeamQ: totalNATeam,
    teamStructure: {
      totalSubordinates: totalCount,
      auditedSubordinates: auditedCount,
      coveragePct,
      byPosition: Array.from(positionGroups.values()).sort((a, b) => 
        a.positionCode.localeCompare(b.positionCode)
      ),
    },
    warnings,
    pendingSubordinates,
  };
}

/**
 * Validate quarterly performance data exists (3 months minimum)
 */
export function validateQuarterlyPerformance(
  performanceData: MonthlyPerformance[],
  year: number,
  quarter: number
): { valid: boolean; error?: string } {
  if (performanceData.length < 3) {
    return {
      valid: false,
      error: `Data performance tidak lengkap untuk Q${quarter} ${year}. Diperlukan 3 bulan, tersedia: ${performanceData.length} bulan`,
    };
  }
  
  const expectedMonths = getQuarterMonths(quarter);
  const actualMonths = performanceData.map(p => p.month).sort();
  
  const missingMonths = expectedMonths.filter(m => !actualMonths.includes(m));
  if (missingMonths.length > 0) {
    return {
      valid: false,
      error: `Bulan yang hilang di Q${quarter}: ${missingMonths.join(", ")}`,
    };
  }
  
  return { valid: true };
}

/**
 * Get month numbers for a quarter
 */
function getQuarterMonths(quarter: number): number[] {
  switch (quarter) {
    case 1: return [1, 2, 3];
    case 2: return [4, 5, 6];
    case 3: return [7, 8, 9];
    case 4: return [10, 11, 12];
    default: return [];
  }
}

/**
 * Calculate personal quarterly totals from monthly performance
 */
export function calculatePersonalQuarterly(performanceData: MonthlyPerformance[]): {
  marginPersonalQ: string;
  naPersonalQ: number;
} {
  const totalMargin = performanceData.reduce(
    (sum, p) => sum + parseDecimalSafe(p.marginPersonal || "0"), 
    0
  );
  const totalNA = performanceData.reduce(
    (sum, p) => sum + (p.naPersonal || 0), 
    0
  );
  
  return {
    marginPersonalQ: totalMargin.toFixed(2),
    naPersonalQ: totalNA,
  };
}
