import { z } from "zod";

/**
 * Excel Upload Types & Validation
 * Defines the structure and validation for Excel employee uploads
 */

// ============================================================================
// EXPECTED EXCEL COLUMNS
// ============================================================================

export const EXCEL_COLUMNS = {
  employeeCode: "employee_code",
  nama: "nama",
  posisi: "posisi",
  atasanCode: "atasan_code", // Optional - NULL for top employee
  tglLahir: "tgl_lahir", // Format: YYYY-MM-DD
  margin: "margin",
  na: "na",
  email: "email", // Optional
} as const;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Single row from Excel (before processing)
 */
export const excelRowSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required").max(20),
  nama: z.string().min(1, "Nama is required").max(200),
  posisi: z.string().min(1, "Posisi is required").max(50),
  atasan_code: z.string().nullable().optional(), // Can be null for top employee
  tgl_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format harus YYYY-MM-DD"),
  margin: z.number()
    .refine((val) => !isNaN(val), "Margin must be a valid number")
    .refine((val) => val >= 0, "Margin cannot be negative"),
  na: z.number()
    .refine((val) => !isNaN(val), "NA must be a valid number")
    .refine((val) => Number.isInteger(val), "NA must be an integer")
    .refine((val) => val >= 0, "NA must be non-negative"),
  email: z.string().email("Invalid email").nullable().optional(),
});

export type ExcelRow = z.infer<typeof excelRowSchema>;

/**
 * Upload request payload
 */
export const uploadRequestSchema = z.object({
  branchId: z.string().uuid("Invalid branch ID"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM format"), // e.g., "2025-01"
  overwriteExisting: z.boolean().default(false), // Overwrite existing data?
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationError {
  row: number; // Row number in Excel (1-indexed)
  field: string; // Which field has error
  error: string; // Error message
  value?: any; // The invalid value
}

export interface HierarchyValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  circularReferences?: Array<{
    employeeCode: string;
    chain: string[]; // Chain of employee codes forming a loop
  }>;
}

export interface ParsedUploadData {
  validRows: ExcelRow[];
  invalidRows: Array<{
    row: number;
    data: Partial<ExcelRow>;
    errors: ValidationError[];
  }>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ExcelUploadService {
  /**
   * Parse and validate Excel file
   */
  parseExcelFile(buffer: Buffer): Promise<ParsedUploadData>;
  
  /**
   * Validate hierarchy (check circular references, manager existence)
   */
  validateHierarchy(
    rows: ExcelRow[],
    branchId: string
  ): Promise<HierarchyValidationResult>;
  
  /**
   * Process upload (create employees, users, performance records)
   * All operations in a single transaction
   */
  processUpload(
    data: ParsedUploadData,
    request: UploadRequest,
    uploadedBy: string
  ): Promise<UploadResult>;
}

export interface UploadResult {
  success: boolean;
  uploadLogId: string;
  summary: {
    totalRows: number;
    employeesCreated: number;
    employeesUpdated: number;
    usersCreated: number;
    performanceRecordsCreated: number;
    errors: ValidationError[];
  };
  message: string;
}

// ============================================================================
// HIERARCHY TYPES
// ============================================================================

export interface EmployeeNode {
  employeeCode: string;
  managerId?: string | null;
  children: EmployeeNode[];
  data: ExcelRow;
}

export interface HierarchyTree {
  roots: EmployeeNode[]; // Top employees (no manager)
  employeeMap: Map<string, EmployeeNode>; // For quick lookup
  levels: number; // Depth of hierarchy
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
  ],
  ALLOWED_EXTENSIONS: [".xlsx", ".xls"],
  MAX_ROWS: 1000, // Maximum rows per upload
  BCRYPT_ROUNDS: 10, // For password hashing
} as const;

/**
 * Valid positions (from hierarchy)
 * Should match the positions table in database
 */
export const VALID_POSITIONS = [
  "BC", // Business Consultant (Level 1 - Bottom)
  "SBC", // Senior Business Consultant (Level 2)
  "BsM", // Business Manager (Level 3)
  "SBM", // Senior Business Manager (Level 4)
  "EM", // Equity Manager (Level 5)
  "SEM", // Senior Equity Manager (Level 6)
  "VBM", // Vice Branch Manager (Level 7)
  "SVBM", // Senior Vice Branch Manager (Level 8)
  "BrM", // Branch Manager (Level 9)
  "CBO", // Chief Branch Officer (Level 10)
  "CEO", // Chief Executive Officer (Level 11 - Top)
] as const;

export type Position = typeof VALID_POSITIONS[number];
