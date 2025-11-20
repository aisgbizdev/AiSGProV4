/**
 * Generate Excel Template for Employee Upload
 * Run with: npx tsx scripts/generate-template.ts
 */

import * as XLSX from "xlsx";
import { writeFileSync } from "fs";
import { join } from "path";

const TEMPLATE_COLUMNS = [
  "employee_code",
  "nama",
  "posisi",
  "atasan_code",
  "tgl_lahir",
  "margin",
  "na",
  "email"
];

const SAMPLE_DATA = [
  {
    employee_code: "EMP001",
    nama: "John Doe",
    posisi: "BrM",
    atasan_code: "",
    tgl_lahir: "1990-01-15",
    margin: 150000000,
    na: 25,
    email: "john.doe@example.com"
  },
  {
    employee_code: "EMP002",
    nama: "Jane Smith",
    posisi: "VBM",
    atasan_code: "EMP001",
    tgl_lahir: "1992-05-20",
    margin: 100000000,
    na: 20,
    email: "jane.smith@example.com"
  },
  {
    employee_code: "EMP003",
    nama: "Bob Johnson",
    posisi: "EM",
    atasan_code: "EMP002",
    tgl_lahir: "1995-08-10",
    margin: 50000000,
    na: 15,
    email: "bob.johnson@example.com"
  }
];

const INSTRUCTIONS_DATA = [
  ["INSTRUKSI PENGISIAN TEMPLATE EXCEL KARYAWAN"],
  [""],
  ["1. Kolom Wajib:", "employee_code, nama, posisi, tgl_lahir, margin, na"],
  ["2. Kolom Opsional:", "atasan_code (untuk atasan langsung), email"],
  ["3. Format Tanggal:", "YYYY-MM-DD (contoh: 2025-01-15)"],
  ["4. Posisi Valid:", "BC, SBC, BsM, SBM, EM, SEM, VBM, SVBM, BrM, CBO, CEO"],
  ["5. Atasan Code:", "Kosongkan untuk karyawan top-level (tanpa atasan)"],
  ["6. Margin:", "Angka tanpa separator (contoh: 150000000)"],
  ["7. NA:", "Angka integer positif (contoh: 25)"],
  ["8. Email:", "Format email valid (contoh: nama@domain.com)"],
  [""],
  ["PERHATIAN:"],
  ["- Maximum 1000 baris per upload"],
  ["- File size maximum 5MB"],
  ["- Pastikan tidak ada circular reference di hierarki atasan"],
  ["- Password auto-generated = tanggal lahir (format: YYYYMMDD)"],
  [""],
  ["Hapus sheet ini sebelum upload, gunakan hanya sheet 'Data Karyawan'"]
];

function generateTemplate() {
  // Create workbook with explicit properties
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Template Upload Karyawan AISG",
    Subject: "Employee Data Upload",
    Author: "AISG System",
    CreatedDate: new Date()
  };

  // Sheet 1: Data Karyawan (with sample data)
  const wsData = XLSX.utils.json_to_sheet(SAMPLE_DATA, {
    header: TEMPLATE_COLUMNS
  });

  // Set column widths
  wsData["!cols"] = [
    { wch: 15 }, // employee_code
    { wch: 25 }, // nama
    { wch: 10 }, // posisi
    { wch: 15 }, // atasan_code
    { wch: 12 }, // tgl_lahir
    { wch: 15 }, // margin
    { wch: 8 },  // na
    { wch: 30 }  // email
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Data Karyawan");

  // Sheet 2: Instructions
  const wsInstructions = XLSX.utils.aoa_to_sheet(INSTRUCTIONS_DATA);
  wsInstructions["!cols"] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruksi");

  // Write to both locations with explicit options
  const publicPath = join(process.cwd(), "public", "templates", "employee-upload.xlsx");
  const clientPublicPath = join(process.cwd(), "client", "public", "templates", "employee-upload.xlsx");
  
  const writeOptions = {
    bookType: "xlsx" as const,
    type: "buffer" as const,
    compression: true
  };
  
  XLSX.writeFile(wb, publicPath, writeOptions);
  XLSX.writeFile(wb, clientPublicPath, writeOptions);
  
  console.log(`✅ Template Excel berhasil dibuat:`);
  console.log(`   - ${publicPath}`);
  console.log(`   - ${clientPublicPath}`);
}

// Run generation
generateTemplate();
