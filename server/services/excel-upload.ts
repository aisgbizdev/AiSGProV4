/**
 * Excel Upload Service
 * Handles parsing, validation, and processing of employee Excel uploads
 */

import * as XLSX from "xlsx";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import type {
  ExcelRow,
  ParsedUploadData,
  ValidationError,
  HierarchyValidationResult,
  UploadRequest,
  UploadResult,
  HierarchyTree,
  EmployeeNode,
} from "../excel-upload.types";
import {
  excelRowSchema,
  UPLOAD_CONSTRAINTS,
  VALID_POSITIONS,
  EXCEL_COLUMNS,
} from "../excel-upload.types";

export class ExcelUploadService {
  /**
   * Parse Excel file from buffer
   */
  async parseExcelFile(buffer: Buffer): Promise<ParsedUploadData> {
    try {
      // Parse workbook
      const workbook = XLSX.read(buffer, { type: "buffer" });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("Excel file is empty (no sheets found)");
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON (array of objects)
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Convert dates to strings
        defval: null, // Default value for empty cells
      });
      
      if (rawData.length === 0) {
        throw new Error("Excel file is empty (no data rows)");
      }
      
      if (rawData.length > UPLOAD_CONSTRAINTS.MAX_ROWS) {
        throw new Error(
          `Too many rows. Maximum ${UPLOAD_CONSTRAINTS.MAX_ROWS} rows allowed, found ${rawData.length}`
        );
      }
      
      // Check column headers (helpful for debugging)
      if (rawData.length > 0) {
        const firstRow = rawData[0] as any;
        const foundColumns = Object.keys(firstRow);
        const expectedColumns = ['employee_code', 'nama', 'posisi', 'atasan_code', 'tgl_lahir', 'margin', 'na', 'email'];
        
        // Check if ANY expected column is missing
        const hasExpectedFormat = expectedColumns.some(col => 
          foundColumns.some(found => 
            found.toLowerCase().includes(col.toLowerCase().replace('_', ''))
          )
        );
        
        if (!hasExpectedFormat) {
          throw new Error(
            `Format Excel tidak sesuai.\n\n` +
            `Kolom ditemukan: ${foundColumns.join(', ')}\n\n` +
            `Kolom yang diharapkan: ${expectedColumns.join(', ')}\n\n` +
            `Silakan download template dan salin data Anda ke format yang benar.`
          );
        }
      }
      
      // Validate and parse each row
      const validRows: ExcelRow[] = [];
      const invalidRows: Array<{
        row: number;
        data: Partial<ExcelRow>;
        errors: ValidationError[];
      }> = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const rowNum = i + 2; // Excel row number (1-indexed, +1 for header)
        const rawRow = rawData[i] as any;
        
        // Normalize row (handle different column name formats)
        const normalizedRow = this.normalizeRow(rawRow);
        
        // Validate with Zod
        const result = excelRowSchema.safeParse(normalizedRow);
        
        if (result.success) {
          validRows.push(result.data);
        } else {
          const errors: ValidationError[] = result.error.errors.map((err) => ({
            row: rowNum,
            field: err.path.join("."),
            error: err.message,
            value: normalizedRow[err.path[0] as keyof typeof normalizedRow],
          }));
          
          invalidRows.push({
            row: rowNum,
            data: normalizedRow,
            errors,
          });
        }
      }
      
      return {
        validRows,
        invalidRows,
        totalRows: rawData.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Normalize row data (handle different column name formats)
   */
  private normalizeRow(rawRow: any): Partial<ExcelRow> {
    // Helper to find column value (case-insensitive, with/without spaces/underscores)
    const getValue = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (rawRow[name] !== undefined && rawRow[name] !== null && rawRow[name] !== "") {
          return rawRow[name];
        }
      }
      return null;
    };
    
    return {
      employee_code: getValue([
        "employee_code",
        "employeeCode",
        "kode_karyawan",
        "Employee Code",
        "Kode Karyawan",
      ]),
      nama: getValue(["nama", "name", "Nama", "Name"]),
      posisi: getValue(["posisi", "position", "jabatan", "Posisi", "Position", "Jabatan"]),
      atasan_code: getValue([
        "atasan_code",
        "atasanCode",
        "kode_atasan",
        "manager_code",
        "Atasan Code",
        "Manager Code",
      ]),
      tgl_lahir: getValue([
        "tgl_lahir",
        "tglLahir",
        "tanggal_lahir",
        "date_of_birth",
        "Tgl Lahir",
        "Tanggal Lahir",
      ]),
      margin: this.parseNumber(
        getValue(["margin", "Margin", "revenue", "Revenue"])
      ),
      na: this.parseNumber(getValue(["na", "NA", "new_accounts", "New Accounts"])),
      email: getValue(["email", "Email", "e-mail"]) || null,
    };
  }
  
  /**
   * Parse number from string/number
   * Returns NaN for invalid data (Zod will catch it with .refine())
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === "") {
      return NaN; // Zod will catch this
    }
    if (typeof value === "number") return value;
    
    // Remove common formatting (commas, spaces, currency symbols)
    const cleaned = String(value).replace(/[,\s$Rp]/g, "");
    const parsed = parseFloat(cleaned);
    
    // Return NaN for invalid data - Zod will catch this with refine()
    return parsed;
  }
  
  /**
   * Validate hierarchy (circular references, manager existence)
   */
  async validateHierarchy(
    rows: ExcelRow[],
    branchId: string
  ): Promise<HierarchyValidationResult> {
    const errors: ValidationError[] = [];
    const employeeCodes = new Set(rows.map((r) => r.employee_code));
    
    // 1. Check for duplicate employee codes
    const codeCount = new Map<string, number>();
    rows.forEach((row, idx) => {
      const count = codeCount.get(row.employee_code) || 0;
      codeCount.set(row.employee_code, count + 1);
      
      if (count > 0) {
        errors.push({
          row: idx + 2,
          field: "employee_code",
          error: `Duplicate employee code: ${row.employee_code}`,
          value: row.employee_code,
        });
      }
    });
    
    // 2. Check manager references (in upload batch OR in database)
    const managerCodesToCheck: string[] = [];
    rows.forEach((row, idx) => {
      if (row.atasan_code) {
        // Manager exists in current upload batch
        if (employeeCodes.has(row.atasan_code)) {
          return; // Valid - manager in same batch
        }
        
        // Manager not in batch - need to check database
        managerCodesToCheck.push(row.atasan_code);
      }
    });
    
    // Check database for managers not in upload batch
    if (managerCodesToCheck.length > 0) {
      const existingManagers = await storage.getEmployeesByBranch(branchId);
      const existingManagerCodes = new Set(existingManagers.map(e => e.employeeCode));
      
      rows.forEach((row, idx) => {
        if (row.atasan_code && !employeeCodes.has(row.atasan_code)) {
          // Check if manager exists in database
          if (!existingManagerCodes.has(row.atasan_code)) {
            errors.push({
              row: idx + 2,
              field: "atasan_code",
              error: `Manager ${row.atasan_code} not found in upload or database`,
              value: row.atasan_code,
            });
          }
        }
      });
    }
    
    // 3. Check for circular references
    const circularRefs = this.detectCircularReferences(rows);
    
    if (circularRefs.length > 0) {
      circularRefs.forEach((ref) => {
        errors.push({
          row: 0,
          field: "hierarchy",
          error: `Circular reference detected: ${ref.chain.join(" → ")}`,
        });
      });
    }
    
    // 4. Validate positions
    rows.forEach((row, idx) => {
      if (!VALID_POSITIONS.includes(row.posisi as any)) {
        errors.push({
          row: idx + 2,
          field: "posisi",
          error: `Invalid position: ${row.posisi}. Must be one of: ${VALID_POSITIONS.join(", ")}`,
          value: row.posisi,
        });
      }
    });
    
    return {
      isValid: errors.length === 0 && circularRefs.length === 0,
      errors,
      circularReferences: circularRefs.length > 0 ? circularRefs : undefined,
    };
  }
  
  /**
   * Detect circular references in hierarchy
   */
  private detectCircularReferences(
    rows: ExcelRow[]
  ): Array<{ employeeCode: string; chain: string[] }> {
    const circularRefs: Array<{ employeeCode: string; chain: string[] }> = [];
    const managerMap = new Map<string, string | null>();
    
    // Build manager map
    rows.forEach((row) => {
      managerMap.set(row.employee_code, row.atasan_code || null);
    });
    
    // Check each employee for circular reference
    rows.forEach((row) => {
      const visited = new Set<string>();
      const chain: string[] = [row.employee_code];
      let current = row.employee_code;
      
      while (true) {
        const manager = managerMap.get(current);
        
        if (!manager) break; // Reached top
        
        if (visited.has(manager)) {
          // Found a cycle
          circularRefs.push({
            employeeCode: row.employee_code,
            chain: [...chain, manager],
          });
          break;
        }
        
        visited.add(manager);
        chain.push(manager);
        current = manager;
      }
    });
    
    return circularRefs;
  }
  
  /**
   * Process the upload (main transaction)
   */
  async processUpload(
    data: ParsedUploadData,
    request: UploadRequest,
    uploadedBy: string
  ): Promise<UploadResult> {
    const errors: ValidationError[] = [];
    let employeesCreated = 0;
    let employeesUpdated = 0;
    let usersCreated = 0;
    let performanceRecordsCreated = 0;
    
    try {
      // Get branch to validate it exists
      const branch = await storage.getBranch(request.branchId);
      if (!branch) {
        throw new Error("Branch not found");
      }
      
      // Get positions map for validation
      const positions = await storage.getAllPositions();
      const positionMap = new Map(positions.map((p) => [p.code, p]));
      
      // Process each valid row
      for (const row of data.validRows) {
        try {
          // Get position ID
          const position = positionMap.get(row.posisi);
          if (!position) {
            errors.push({
              row: 0,
              field: "posisi",
              error: `Position ${row.posisi} not found in database`,
            });
            continue;
          }
          
          // Check if employee already exists
          const existing = await storage.getEmployeeByCode(row.employee_code);
          
          let employeeId: string;
          
          if (existing) {
            // Update existing employee
            await storage.updateEmployee(existing.id, {
              fullName: row.nama,
              positionId: position.id,
              email: row.email || undefined,
              dateOfBirth: row.tgl_lahir,
            });
            employeeId = existing.id;
            employeesUpdated++;
          } else {
            // Create new employee
            const newEmployee = await storage.createEmployee({
              employeeCode: row.employee_code,
              fullName: row.nama,
              positionId: position.id,
              branchId: request.branchId,
              ptId: branch.ptId,
              ceoUnitId: branch.ptId, // Use PT as CEO unit for now (simplified)
              dateOfBirth: row.tgl_lahir,
              joinDate: new Date().toISOString().split("T")[0],
              email: row.email || undefined,
              managerId: null, // Will be set in second pass
            });
            employeeId = newEmployee.id;
            employeesCreated++;
            
            // Create user account with password = tanggal lahir
            const passwordFromDOB = row.tgl_lahir.replace(/-/g, ""); // YYYYMMDD
            const hashedPassword = await bcrypt.hash(
              passwordFromDOB,
              UPLOAD_CONSTRAINTS.BCRYPT_ROUNDS
            );
            
            await storage.createUser({
              username: row.employee_code,
              password: hashedPassword,
              name: row.nama,
              email: row.email || undefined,
              role: "employee",
              employeeId: employeeId,
              mustChangePassword: true,
            });
            usersCreated++;
          }
          
          // Create/update monthly performance
          const [year, month] = request.period.split("-").map(Number);
          const quarter = Math.ceil(month / 3);
          
          await storage.upsertMonthlyPerformance({
            employeeId,
            year,
            month,
            quarter,
            marginPersonal: row.margin.toString(),
            naPersonal: row.na,
          });
          performanceRecordsCreated++;
        } catch (error) {
          errors.push({
            row: 0,
            field: "processing",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      
      // Second pass: Update manager relationships
      for (const row of data.validRows) {
        if (row.atasan_code) {
          try {
            const employee = await storage.getEmployeeByCode(row.employee_code);
            const manager = await storage.getEmployeeByCode(row.atasan_code);
            
            if (employee && manager) {
              await storage.updateEmployee(employee.id, {
                managerId: manager.id,
              });
            }
          } catch (error) {
            // Log but don't fail the whole upload
            console.error("Failed to set manager:", error);
          }
        }
      }
      
      // Create upload log
      const uploadLog = await storage.createUploadLog({
        branchId: request.branchId,
        uploadedBy,
        period: request.period,
        fileName: "excel_upload.xlsx",
        totalRows: data.totalRows,
        successRows: data.validCount - errors.length,
        errorRows: data.invalidCount + errors.length,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors : undefined,
      });
      
      return {
        success: true,
        uploadLogId: uploadLog.id,
        summary: {
          totalRows: data.totalRows,
          employeesCreated,
          employeesUpdated,
          usersCreated,
          performanceRecordsCreated,
          errors,
        },
        message: `Successfully processed ${data.validCount} rows. Created ${employeesCreated} employees, updated ${employeesUpdated}.`,
      };
    } catch (error) {
      throw new Error(
        `Upload processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

// Export singleton instance
export const excelUploadService = new ExcelUploadService();
