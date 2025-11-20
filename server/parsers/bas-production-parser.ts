import XLSX from 'xlsx';
import type { WorkBook, WorkSheet } from 'xlsx';

/**
 * BAS Production Data Parser
 * 
 * Excel Structure (Data_BAS.xls):
 * - Column A: kode_cabang (2-letter branch code: AB, BA, CA, etc)
 * - Column B: marketing_status_kerja
 * - Column C: marketing_nama
 * - Column E: marketing_tgl_lahir (YYYY-MM-DD, used for password)
 * - Column F: marketing_email
 * - Column G: marketing_jabatan (position)
 * - Column H: marketing_gplus (superior/atasan name)
 * - Columns H-S: margin_01 to margin_12 (Jan-Dec)
 * - Columns T-AF: na_01 to na_12 (Jan-Dec)
 */

// PT Mapping based on branch code prefix
const PT_MAPPING: Record<string, { code: string; name: string; ceoUnit: string }> = {
  'A': { code: 'SGB', name: 'Solid Gold Berjangka', ceoUnit: 'TJANDRA' },
  'B': { code: 'RFB', name: 'Rifan Financindo Berjangka', ceoUnit: 'NL' },
  'C': { code: 'KPF', name: 'Kontak Perkasa Futures', ceoUnit: 'GS' },
  'D': { code: 'EWF', name: 'Equity World Futures', ceoUnit: 'EDWIN' },
  'E': { code: 'BPF', name: 'Best Profit Futures', ceoUnit: 'ISRIYETTI' },
};

// Column indexes (0-based)
const COLUMNS = {
  KODE_CABANG: 0,        // A
  STATUS_KERJA: 1,       // B
  NAMA: 2,               // C
  // Column D (index 3) might be empty or other data - skipped
  TGL_LAHIR: 4,          // E
  EMAIL: 5,              // F
  JABATAN: 6,            // G
  GPLUS: 7,              // H (atasan/superior name)
  MARGIN_START: 8,       // I (margin_01) - FIXED! Was 7, should be 8
  MARGIN_END: 19,        // T (margin_12) - FIXED! 8+11=19
  NA_START: 20,          // U (na_01) - FIXED! Was 19, should be 20
  NA_END: 31,            // AG (na_12) - FIXED! 20+11=31
};

export interface BASEmployee {
  kodeCabang: string;
  branchCode: string;
  branchName: string;
  ptCode: string;
  ptName: string;
  ceoUnitName: string;
  statusKerja: string;
  nama: string;
  employeeCode: string; // Extracted from nama like [AB16925]
  tglLahir: string; // YYYY-MM-DD format
  email: string | null;
  jabatan: string;
  atasan: string | null;
  marginPerBulan: number[]; // 12 months
  naPerBulan: number[];     // 12 months
}

export interface BASParseResult {
  employees: BASEmployee[];
  pts: Array<{ code: string; name: string; ceoUnit: string }>;
  ceoUnits: string[];
  branches: Array<{ code: string; name: string; ptCode: string }>;
  summary: {
    totalEmployees: number;
    totalPTs: number;
    totalCEOUnits: number;
    totalBranches: number;
    errors: Array<{ row: number; message: string }>;
  };
}

function getPTFromBranchCode(branchCode: string): { code: string; name: string; ceoUnit: string } | null {
  const prefix = branchCode.charAt(0).toUpperCase();
  return PT_MAPPING[prefix] || null;
}

function formatDate(excelDate: any): string | null {
  try {
    if (!excelDate) return null;
    
    // If already string in YYYY-MM-DD format
    if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
      return excelDate;
    }
    
    // If Excel serial number
    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Try parsing as date
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function parseNumeric(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export function parseBASProductionData(buffer: Buffer): BASParseResult {
  const workbook: WorkBook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet: WorkSheet = workbook.Sheets[sheetName];
  
  // Convert to array of arrays
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const employees: BASEmployee[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const ptsSet = new Set<string>();
  const ceoUnitsSet = new Set<string>();
  const branchesSet = new Set<string>();
  
  // Skip header row (row 0), start from row 1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[COLUMNS.KODE_CABANG]) {
      continue;
    }
    
    try {
      const kodeCabang = String(row[COLUMNS.KODE_CABANG] || '').trim().toUpperCase();
      
      if (!kodeCabang || kodeCabang.length !== 2) {
        errors.push({ row: i + 1, message: 'Kode cabang tidak valid (harus 2 huruf)' });
        continue;
      }
      
      const ptInfo = getPTFromBranchCode(kodeCabang);
      if (!ptInfo) {
        errors.push({ row: i + 1, message: `PT tidak ditemukan untuk kode cabang: ${kodeCabang}` });
        continue;
      }
      
      const nama = String(row[COLUMNS.NAMA] || '').trim();
      if (!nama) {
        errors.push({ row: i + 1, message: 'Nama marketing tidak boleh kosong' });
        continue;
      }
      
      const tglLahir = formatDate(row[COLUMNS.TGL_LAHIR]);
      const email = row[COLUMNS.EMAIL] ? String(row[COLUMNS.EMAIL]).trim() : null;
      
      // Extract job title from hierarchy string
      // Example: "SOLEMAN [EM] → DIKKI [BrM]" -> extract current employee's title from first person in chain
      const jabatanRaw = String(row[COLUMNS.JABATAN] || '').trim();
      let jabatan = 'Marketing'; // Default
      
      // Try to extract position code from brackets [XX]
      const positionMatch = jabatanRaw.match(/\[([^\]]+)\]/);
      if (positionMatch) {
        // Found position code like [EM], [BrM], [SPV], etc
        jabatan = positionMatch[1].trim();
      } else if (jabatanRaw && !jabatanRaw.includes('→')) {
        // If no brackets and no hierarchy arrow, assume it's a simple job title
        jabatan = jabatanRaw;
      }
      
      // Extract manager name from hierarchy string (last person before →)
      const atasan = row[COLUMNS.GPLUS] ? String(row[COLUMNS.GPLUS]).trim() : null;
      const statusKerja = String(row[COLUMNS.STATUS_KERJA] || 'Aktif').trim();
      
      // Parse 12 months margin (columns H-S)
      const marginPerBulan: number[] = [];
      for (let col = COLUMNS.MARGIN_START; col <= COLUMNS.MARGIN_END; col++) {
        marginPerBulan.push(parseNumeric(row[col]));
      }
      
      // Parse 12 months NA (columns T-AF)
      const naPerBulan: number[] = [];
      for (let col = COLUMNS.NA_START; col <= COLUMNS.NA_END; col++) {
        naPerBulan.push(parseNumeric(row[col]));
      }
      
      // Extract employee code from nama like "AGITHA MULYADI [AB16925]"
      const empCodeMatch = nama.match(/\[([A-Z0-9]+)\]/);
      const employeeCode = empCodeMatch ? empCodeMatch[1] : `EMP${i.toString().padStart(6, '0')}`;
      
      // Create branch name from code (e.g., AB -> "Cabang AB")
      const branchName = `${ptInfo.name} - Cabang ${kodeCabang}`;
      
      employees.push({
        kodeCabang,
        branchCode: kodeCabang,
        branchName,
        ptCode: ptInfo.code,
        ptName: ptInfo.name,
        ceoUnitName: ptInfo.ceoUnit,
        statusKerja,
        nama,
        employeeCode, // ADD THIS!
        tglLahir: tglLahir || '1990-01-01', // Default if no birth date
        email,
        jabatan,
        atasan,
        marginPerBulan,
        naPerBulan,
      });
      
      ptsSet.add(ptInfo.code);
      ceoUnitsSet.add(ptInfo.ceoUnit);
      branchesSet.add(kodeCabang);
      
    } catch (error) {
      errors.push({ 
        row: i + 1, 
        message: error instanceof Error ? error.message : 'Error parsing row' 
      });
    }
  }
  
  // Build unique PTs array
  const pts = Array.from(ptsSet).map(code => {
    const ptInfo = Object.values(PT_MAPPING).find(p => p.code === code)!;
    return {
      code: ptInfo.code,
      name: ptInfo.name,
      ceoUnit: ptInfo.ceoUnit,
    };
  });
  
  // Build unique CEO Units array
  const ceoUnits = Array.from(ceoUnitsSet);
  
  // Build unique branches array
  const branches = Array.from(branchesSet).map(branchCode => {
    const employee = employees.find(e => e.branchCode === branchCode)!;
    return {
      code: branchCode,
      name: employee.branchName,
      ptCode: employee.ptCode,
    };
  });
  
  return {
    employees,
    pts,
    ceoUnits,
    branches,
    summary: {
      totalEmployees: employees.length,
      totalPTs: pts.length,
      totalCEOUnits: ceoUnits.length,
      totalBranches: branches.length,
      errors,
    },
  };
}
