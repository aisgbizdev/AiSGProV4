import * as XLSX from 'xlsx';
import { z } from 'zod';
import branchMappingData from '@shared/branch-mapping.json';

// ============================================================================
// BAS PARSER - Parse production BAS Excel format
// ============================================================================

// Load branch mapping reference
const BRANCH_MAPPING = branchMappingData.branches as Record<string, {
  code: string;
  name: string;
  fullName: string;
  pt: string;
}>;

// Helper function to get branch info from mapping
export function getBranchInfo(branchCode: string) {
  const code = branchCode.toUpperCase().trim();
  return BRANCH_MAPPING[code] || null;
}

/**
 * BAS Excel Format (Production):
 * - Employee name contains code: "JOHN DOE [EMP001]"
 * - Date format: "8/1/96" → "1996-08-01"
 * - 12-month columns: margin_01, margin_02, ..., margin_12
 * - 12-month columns: na_01, na_02, ..., na_12
 * - Upline chain: BC → SBC → BSM → SBM → EM → SEM → VBM → BM
 */

export interface BASEmployeeRow {
  // Personal Info
  fullName: string;
  employeeCode: string;
  dateOfBirth: string; // YYYY-MM-DD
  joinDate: string; // YYYY-MM-DD
  email?: string;
  phone?: string;

  // Organization
  ptCode: string; // RFB, EWF, etc
  branchCode: string; // SSC, MEDAN, etc
  positionCode: string; // BC, SBC, BSM, etc
  
  // Hierarchy (Upline chain)
  managerCode?: string; // Direct manager's employee code (if available)
  managerName?: string; // Direct manager's name (for name-based matching)
  
  // Monthly Performance (12 months)
  margin: number[]; // 12 values (can be negative)
  na: number[]; // 12 values (can be negative)
  
  // Status
  status: 'active' | 'resign' | 'freelance';
}

export interface BASParseResult {
  success: boolean;
  data: BASEmployeeRow[];
  errors: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    byPosition: Record<string, number>;
    byBranch: Record<string, number>;
  };
}

/**
 * Parse employee name to extract code
 * Format: "JOHN DOE [EMP001]" → { name: "JOHN DOE", code: "EMP001" }
 */
function parseEmployeeName(nameWithCode: string): { name: string; code: string } {
  const match = nameWithCode.match(/^(.+?)\s*\[([^\]]+)\]$/);
  
  if (!match) {
    throw new Error(`Invalid name format: "${nameWithCode}". Expected format: "NAME [CODE]"`);
  }
  
  return {
    name: match[1].trim(),
    code: match[2].trim()
  };
}

/**
 * Parse upline chain to extract direct manager info
 * Format: "NAME [POS] --> NAME [POS] --> BrM [POS]" 
 * Returns the FIRST person's code (if available) and name
 */
function parseUplineChain(uplineChain: string | null | undefined): { code?: string; name?: string } {
  if (!uplineChain) return {};

  // Split by "-->"
  const parts = uplineChain.split('-->').map(p => p.trim());
  
  if (parts.length === 0) return {};

  // Extract code and name from first upline (direct manager)
  // Format: "SOLEMAN DAUD SOLEMAN [EM]" or "SOLEMAN [AB16925]"
  const firstUpline = parts[0];
  
  let managerCode: string | undefined;
  let managerName: string | undefined;
  
  // Try to extract code (employee code format like AB16925)
  const codeMatch = firstUpline.match(/\[([A-Z0-9]+)\]/);
  
  if (codeMatch) {
    const code = codeMatch[1];
    // Check if it's an employee code (not just position like EM, BrM)
    // Employee codes are typically alphanumeric with numbers (e.g., AB16925)
    if (/[0-9]/.test(code)) {
      managerCode = code;
    }
  }

  // Extract manager name (everything before the bracket)
  const nameMatch = firstUpline.match(/^(.+?)\s*\[/);
  if (nameMatch) {
    managerName = nameMatch[1].trim();
  }

  return { code: managerCode, name: managerName };
}

/**
 * Parse date from various formats to YYYY-MM-DD
 * Handles: "8/1/96", "1996-08-01", Excel date serial, etc
 */
function parseDate(value: any): string {
  if (!value) {
    throw new Error('Date is required');
  }

  // If already in YYYY-MM-DD format
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // If Excel date serial number (Excel epoch: Jan 1, 1900)
  if (typeof value === 'number') {
    // Excel serial date conversion
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const excelDate = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    
    const year = excelDate.getFullYear();
    const month = String(excelDate.getMonth() + 1).padStart(2, '0');
    const day = String(excelDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // If M/D/YY or MM/DD/YYYY format
  if (typeof value === 'string') {
    const parts = value.split('/');
    if (parts.length === 3) {
      let [month, day, year] = parts;
      
      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        const numYear = parseInt(year, 10);
        year = numYear < 50 ? `20${year}` : `19${year}`;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  throw new Error(`Invalid date format: "${value}". Expected M/D/YY or YYYY-MM-DD`);
}

/**
 * Parse numeric value (handle negative, empty, etc)
 */
function parseNumeric(value: any, allowNegative: boolean = true): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  
  if (isNaN(num)) {
    return 0;
  }

  if (!allowNegative && num < 0) {
    return 0;
  }

  return num;
}

/**
 * Main BAS Parser
 */
export function parseBASExcel(buffer: Buffer): BASParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

  const result: BASParseResult = {
    success: true,
    data: [],
    errors: [],
    summary: {
      totalRows: rawData.length,
      validRows: 0,
      errorRows: 0,
      byPosition: {},
      byBranch: {}
    }
  };

  // Expected column headers (flexible matching for production BAS format)
  const EXPECTED_COLUMNS = {
    name: ['marketing_nama', 'name', 'nama', 'employee_name'],
    dob: ['marketing_tgl_lahir', 'dob', 'date_of_birth', 'tanggal_lahir'],
    joinDate: ['marketing_tgl_masuk', 'join_date', 'tanggal_masuk', 'tgl_masuk'],
    email: ['marketing_email', 'email', 'email_address'],
    phone: ['marketing_hp', 'marketing_phone', 'phone', 'telepon', 'hp'],
    ptCode: ['pt_code', 'pt', 'company'],
    branchCode: ['kode_cabang', 'branch_code', 'branch', 'cabang'],
    positionCode: ['marketing_jabatan', 'position_code', 'position', 'jabatan'],
    uplineChain: ['marketing_upline', 'upline_chain', 'upline', 'atasan'],
    status: ['marketing_status_kerja', 'status', 'employment_status'],
  };

  // Validate headers
  const headers = Object.keys(rawData[0] || {}).map(h => h.toLowerCase());
  
  // Check for margin/NA columns (margin_01 to margin_12, na_01 to na_12)
  const hasMarginColumns = Array.from({ length: 12 }, (_, i) => 
    headers.includes(`margin_${String(i + 1).padStart(2, '0')}`)
  ).every(Boolean);

  const hasNAColumns = Array.from({ length: 12 }, (_, i) => 
    headers.includes(`na_${String(i + 1).padStart(2, '0')}`)
  ).every(Boolean);

  if (!hasMarginColumns || !hasNAColumns) {
    result.success = false;
    result.errors.push({
      row: 0,
      field: 'headers',
      value: headers,
      message: 'Missing required columns. Expected margin_01 to margin_12 and na_01 to na_12'
    });
    return result;
  }

  // Parse each row
  rawData.forEach((row, index) => {
    const rowNum = index + 2; // Excel row (header = 1, data starts at 2)

    try {
      // Parse employee name & code
      const nameField = findField(row, EXPECTED_COLUMNS.name);
      if (!nameField) {
        throw new Error('Name field not found');
      }

      const { name, code } = parseEmployeeName(nameField);

      // Parse dates
      const dobField = findField(row, EXPECTED_COLUMNS.dob);
      const joinDateField = findField(row, EXPECTED_COLUMNS.joinDate);

      const dateOfBirth = parseDate(dobField);
      
      // Join date is optional - use DOB or default date if not provided
      let joinDate: string;
      if (joinDateField) {
        joinDate = parseDate(joinDateField);
      } else {
        // Default to date of birth (will be updated later if needed)
        joinDate = dateOfBirth;
      }

      // Organization
      const branchCodeRaw = findField(row, EXPECTED_COLUMNS.branchCode)?.toString().toUpperCase() || '';
      const branchInfo = getBranchInfo(branchCodeRaw);
      
      // Use branch mapping to get correct PT and branch name
      const branchCode = branchCodeRaw;
      const ptCode = branchInfo?.pt || findField(row, EXPECTED_COLUMNS.ptCode)?.toString().toUpperCase() || 'RFB';
      
      const positionCodeRaw = findField(row, EXPECTED_COLUMNS.positionCode)?.toString() || 'BC';
      
      // Normalize position code (BsM → BSM, BrM → BRM, etc)
      const positionCode = positionCodeRaw.toUpperCase();

      // Hierarchy (parse upline chain)
      const uplineChain = findField(row, EXPECTED_COLUMNS.uplineChain)?.toString();
      const managerInfo = parseUplineChain(uplineChain);
      const managerCode = managerInfo.code;
      const managerName = managerInfo.name;

      // Contact
      const email = findField(row, EXPECTED_COLUMNS.email)?.toString() || undefined;
      const phone = findField(row, EXPECTED_COLUMNS.phone)?.toString() || undefined;

      // Status (map Indonesian to English)
      const statusField = findField(row, EXPECTED_COLUMNS.status)?.toString().toLowerCase() || 'aktif';
      let status: 'active' | 'resign' | 'freelance' = 'active';
      
      if (statusField.includes('aktif') || statusField === 'active') {
        status = 'active';
      } else if (statusField.includes('resign') || statusField.includes('keluar')) {
        status = 'resign';
      } else if (statusField.includes('freelance') || statusField.includes('kontrak')) {
        status = 'freelance';
      }

      // Parse 12-month performance
      const margin: number[] = [];
      const na: number[] = [];

      for (let i = 1; i <= 12; i++) {
        const monthKey = `margin_${String(i).padStart(2, '0')}`;
        const naKey = `na_${String(i).padStart(2, '0')}`;

        margin.push(parseNumeric(row[monthKey], true)); // Allow negative
        na.push(parseNumeric(row[naKey], true)); // Allow negative
      }

      // Create employee row
      const employeeRow: BASEmployeeRow = {
        fullName: name,
        employeeCode: code,
        dateOfBirth,
        joinDate,
        email,
        phone,
        ptCode,
        branchCode,
        positionCode,
        managerCode,
        managerName,
        margin,
        na,
        status
      };

      result.data.push(employeeRow);
      result.summary.validRows++;

      // Count by position
      result.summary.byPosition[positionCode] = (result.summary.byPosition[positionCode] || 0) + 1;

      // Count by branch
      result.summary.byBranch[branchCode] = (result.summary.byBranch[branchCode] || 0) + 1;

    } catch (error) {
      result.errors.push({
        row: rowNum,
        field: 'unknown',
        value: row,
        message: error instanceof Error ? error.message : String(error)
      });
      result.summary.errorRows++;
    }
  });

  result.success = result.errors.length === 0;

  return result;
}

/**
 * Helper: Find field value from row using multiple possible column names
 */
function findField(row: any, possibleNames: string[]): any {
  const lowerRow = Object.keys(row).reduce((acc, key) => {
    acc[key.toLowerCase()] = row[key];
    return acc;
  }, {} as any);

  for (const name of possibleNames) {
    if (lowerRow[name] !== undefined && lowerRow[name] !== null) {
      return lowerRow[name];
    }
  }

  return null;
}

/**
 * Validate parsed BAS data before database insertion
 */
export function validateBASData(data: BASEmployeeRow[]): {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
} {
  const errors: Array<{ code: string; message: string }> = [];

  // Check for duplicate employee codes
  const codeMap = new Map<string, number>();
  data.forEach((emp, idx) => {
    if (codeMap.has(emp.employeeCode)) {
      errors.push({
        code: emp.employeeCode,
        message: `Duplicate employee code at rows ${codeMap.get(emp.employeeCode)! + 2} and ${idx + 2}`
      });
    }
    codeMap.set(emp.employeeCode, idx);
  });

  // Check circular references in hierarchy
  const buildHierarchyMap = () => {
    const map = new Map<string, string>();
    data.forEach(emp => {
      if (emp.managerCode) {
        map.set(emp.employeeCode, emp.managerCode);
      }
    });
    return map;
  };

  const hierarchyMap = buildHierarchyMap();
  
  data.forEach(emp => {
    if (emp.managerCode) {
      const visited = new Set<string>();
      let current: string | undefined = emp.employeeCode;

      while (current) {
        if (visited.has(current)) {
          errors.push({
            code: emp.employeeCode,
            message: `Circular hierarchy reference detected for employee ${emp.employeeCode}`
          });
          break;
        }

        visited.add(current);
        current = hierarchyMap.get(current);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
