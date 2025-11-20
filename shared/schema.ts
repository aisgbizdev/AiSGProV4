import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, date, boolean, decimal, uniqueIndex, unique, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// ORGANIZATIONAL STRUCTURE TABLES
// ============================================================================

// PT Companies (5 companies: RFB, EWF, KPF, SGB, BPF)
export const pts = pgTable("pts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(), // RFB, EWF, KPF, SGB, BPF
  name: text("name").notNull(), // Full company name
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPtSchema = createInsertSchema(pts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Pt = typeof pts.$inferSelect;
export type InsertPt = z.infer<typeof insertPtSchema>;

// CEO Organizational Units (5 units)
export const ceoUnits = pgTable("ceo_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  ptId: uuid("pt_id").notNull().references(() => pts.id, { onDelete: 'restrict' }),
  code: varchar("code", { length: 20 }).notNull().unique(), // Unit code
  name: text("name").notNull().unique(), // ISRIYETTI, NL, GS, TJANDRA, EDWIN
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCeoUnitSchema = createInsertSchema(ceoUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CeoUnit = typeof ceoUnits.$inferSelect;
export type InsertCeoUnit = z.infer<typeof insertCeoUnitSchema>;

// Branches (42 branches across PTs)
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  ceoUnitId: uuid("ceo_unit_id").notNull().references(() => ceoUnits.id, { onDelete: 'restrict' }),
  ptId: uuid("pt_id").references(() => pts.id, { onDelete: 'restrict' }),
  code: varchar("code", { length: 20 }).notNull().unique(), // SSC, MEDAN, AXA, etc.
  name: text("name").notNull(), // Full branch name
  city: text("city"), // Legacy field from production
  region: text("region"), // Jakarta, Medan, Surabaya, etc.
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

// Position Hierarchy (11 levels)
export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(), // BC, SBC, BsM, etc.
  name: text("name").notNull(), // Business Consultant, etc.
  level: integer("level").notNull().unique(), // 1-11 (BC=1, Owner=11) - MUST BE UNIQUE
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

// ============================================================================
// EMPLOYEE MASTER DATA
// ============================================================================

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Personal Information
  employeeCode: varchar("employee_code", { length: 20 }).notNull().unique(), // EMP001, EMP002
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: date("date_of_birth").notNull(), // For zodiac calculation
  
  // Organizational Assignment
  ptId: uuid("pt_id").notNull().references(() => pts.id, { onDelete: 'restrict' }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: 'restrict' }),
  positionId: uuid("position_id").notNull().references(() => positions.id, { onDelete: 'restrict' }),
  ceoUnitId: uuid("ceo_unit_id").references(() => ceoUnits.id, { onDelete: 'restrict' }),
  
  // Hierarchy (Self-referencing for flexible hierarchy)
  managerId: uuid("manager_id").references((): any => employees.id, { onDelete: 'set null' }), // Atasan langsung
  
  // Employment Details
  joinDate: date("join_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, resign, freelance
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for hierarchical query performance
  managerIdx: index("employees_manager_idx").on(table.managerId),
  branchIdx: index("employees_branch_idx").on(table.branchId),
  positionIdx: index("employees_position_idx").on(table.positionId),
  ceoUnitIdx: index("employees_ceo_unit_idx").on(table.ceoUnitId),
}));

export const insertEmployeeSchema = createInsertSchema(employees, {
  branchId: z.string().trim().min(1).or(z.null()).optional(),
  ceoUnitId: z.string().trim().min(1).or(z.null()).optional(),
  managerId: z.string().trim().min(1).or(z.null()).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format harus YYYY-MM-DD"),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format harus YYYY-MM-DD"),
  email: z.string().email("Email tidak valid").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// ============================================================================
// PERFORMANCE DATA
// ============================================================================

export const monthlyPerformance = pgTable("monthly_performances", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  
  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  quarter: integer("quarter").notNull(), // 1-4 (auto-calculated)
  
  // Personal Performance
  marginPersonal: decimal("margin_personal", { precision: 12, scale: 2 }).notNull().default("0"), // Can be negative
  naPersonal: integer("na_personal").notNull().default(0), // Can be negative (withdrawals)
  lotSettled: integer("lot_settled").default(0),
  
  // Team Performance (optional - can be overridden or auto-calculated)
  marginTeam: decimal("margin_team", { precision: 12, scale: 2 }).default("0"),
  naTeam: integer("na_team").default(0),
  isTeamAutoCalculated: boolean("is_team_auto_calculated").notNull().default(true), // Flag for aggregation
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // CRITICAL: Prevent duplicate entries for same employee/year/month
  uniquePerformance: unique("monthly_performance_unique").on(table.employeeId, table.year, table.month),
}));

export const insertMonthlyPerformanceSchema = createInsertSchema(monthlyPerformance, {
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  quarter: z.number().int().min(1).max(4),
  marginPersonal: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Format decimal tidak valid"),
  naPersonal: z.number().int(),
  lotSettled: z.number().int().nonnegative().optional(),
  marginTeam: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Format decimal tidak valid").optional(),
  naTeam: z.number().int().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MonthlyPerformance = typeof monthlyPerformance.$inferSelect;
export type InsertMonthlyPerformance = z.infer<typeof insertMonthlyPerformanceSchema>;

// ============================================================================
// AUDIT SYSTEM (ENTERPRISE)
// ============================================================================

export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Employee Reference
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  
  // Audit Period
  year: integer("year").notNull(),
  quarter: integer("quarter").notNull(), // 1-4
  
  // Quarterly Performance Summary (Aggregated from monthly_performance)
  marginPersonalQ: decimal("margin_personal_q", { precision: 12, scale: 2 }).notNull(),
  naPersonalQ: integer("na_personal_q").notNull(),
  marginTeamQ: decimal("margin_team_q", { precision: 12, scale: 2 }).notNull(),
  naTeamQ: integer("na_team_q").notNull(),
  
  // Team Structure Snapshot (at audit time)
  teamStructure: jsonb("team_structure").notNull().$type<{
    totalSubordinates: number;
    auditedSubordinates: number;
    byPosition: Array<{
      positionCode: string;
      positionName: string;
      count: number;
      auditedCount: number;
    }>;
  }>(),
  
  // 18 Pilar Assessment
  pillarAnswers: jsonb("pillar_answers").notNull().$type<Array<{
    pillarId: number;
    pillarName: string;
    category: "A" | "B" | "C"; // 18 Pilar categories (A: Kinerja Individu, B: Perilaku & Karakter, C: Kerja Tim & Leadership)
    selfScore: number; // 1-5
    realityScore: number; // 1-5
    gap: number;
    insight: string;
  }>>(),
  
  // Calculated Scores
  totalSelfScore: integer("total_self_score").notNull(), // 0-90
  totalRealityScore: integer("total_reality_score").notNull(), // 0-90
  totalGap: integer("total_gap").notNull(),
  
  // Zona Analysis
  zonaKinerja: varchar("zona_kinerja", { length: 20 }).notNull(), // success, warning, critical
  zonaPerilaku: varchar("zona_perilaku", { length: 20 }).notNull(), // success, warning, critical
  zonaFinal: varchar("zona_final", { length: 20 }).notNull(), // success, warning, critical
  
  // Profile & ProDem
  profil: text("profil").notNull(), // Leader, Visionary, Performer, At-Risk
  prodemRekomendasi: jsonb("prodem_rekomendasi").notNull().$type<{
    currentPosition: string;
    recommendation: "Promosi" | "Dipertahankan" | "Pembinaan" | "Demosi";
    nextPosition?: string;
    reason: string;
    konsekuensi: string;
    nextStep: string;
    requirements: Array<{
      label: string;
      value: string;
      met: boolean;
    }>;
  }>(),
  
  // Audit Report (12 sections)
  auditReport: jsonb("audit_report").notNull().$type<{
    executiveSummary: string;
    insightLengkap: string;
    swotAnalysis: {
      strength: string[];
      weakness: string[];
      opportunity: string[];
      threat: string[];
    };
    coachingPoints: string[];
    actionPlan: Array<{
      periode: string; // 30/60/90 hari
      target: string;
      aktivitas: string;
      pic: string;
      output: string;
    }>;
    progressKuartal: {
      kuartalBerjalan: string;
      sisaHari: number;
      targetMargin: number;
      realisasiMargin: number;
      percentageMargin: number;
      targetNA: number;
      realisasiNA: number;
      percentageNA: number;
      catatan: string;
    };
    ews: Array<{
      faktor: string;
      indikator: string;
      risiko: string;
      saranCepat: string;
    }>;
    kesesuaianVisi: {
      status: "Align" | "Perlu Penyesuaian" | "Belum Sesuai";
      narasi: string;
    };
  }>(),
  
  // Magic Section
  magicSection: jsonb("magic_section").notNull().$type<{
    julukan: string;
    narasi: string;
    zodiak: string;
    generasi: "Gen Z" | "Millennial" | "Gen X" | "Boomer";
    zodiakBooster: string;
    coachingHighlight: string;
    callToAction: string;
    quote: string;
  }>(),
  
  // Aggregation Metadata
  aggregationWarnings: jsonb("aggregation_warnings").$type<Array<{
    type: string;
    message: string;
    affectedEmployeeIds: string[];
  }>>(),
  
  // Audit Metadata
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // draft, completed
  
  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedById: uuid("deleted_by_id").references(() => users.id),
  deletedReason: text("deleted_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAuditSchema = createInsertSchema(audits, {
  year: z.number().int().min(2020).max(2030),
  quarter: z.number().int().min(1).max(4),
  pillarAnswers: z.array(z.object({
    pillarId: z.number().int().min(1).max(18),
    selfScore: z.number().int().min(1).max(5),
  })).length(18),
}).omit({
  id: true,
  totalSelfScore: true,
  totalRealityScore: true,
  totalGap: true,
  zonaKinerja: true,
  zonaPerilaku: true,
  zonaFinal: true,
  profil: true,
  auditReport: true,
  prodemRekomendasi: true,
  magicSection: true,
  createdAt: true,
  updatedAt: true,
});

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

// ============================================================================
// PERSONAL SELF-ASSESSMENT (no hierarchy, for individual tracking)
// ============================================================================

export const personalAudits = pgTable("personal_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Period
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM format (e.g., "2025-01")
  
  // Personal Info (self-filled, tidak perlu data dari Master Karyawan)
  nama: text("nama").notNull(),
  posisi: text("posisi").notNull(),
  
  // Pillar Scores (JSONB array of 18 pillar scores)
  pillarScores: jsonb("pillar_scores").notNull().$type<Array<{
    pillarId: number;
    pillarName: string;
    category: string;
    score: number; // 1-5
    notes?: string;
  }>>(),
  
  // Calculated Scores
  realityScore: decimal("reality_score", { precision: 5, scale: 2 }),
  zone: varchar("zone", { length: 20 }), // "success", "warning", "critical"
  
  // AI Coaching (optional - saran dari AI)
  aiCoaching: text("ai_coaching"),
  
  // Keep tracking (untuk auto-delete warning)
  keepUntil: timestamp("keep_until"), // User bisa extend tanggal ini
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Index for quick user lookup
  userIdx: index("personal_audits_user_idx").on(table.userId),
  periodIdx: index("personal_audits_period_idx").on(table.period),
}));

export const insertPersonalAuditSchema = createInsertSchema(personalAudits, {
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format harus YYYY-MM (contoh: 2025-01)"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  posisi: z.string().min(2, "Posisi minimal 2 karakter"),
  pillarScores: z.array(z.object({
    pillarId: z.number().int().min(1).max(18),
    pillarName: z.string(),
    category: z.string(),
    score: z.number().int().min(1).max(5),
    notes: z.string().optional(),
  })).length(18, "Harus ada 18 pilar"),
}).omit({
  id: true,
  realityScore: true,
  zone: true,
  aiCoaching: true,
  createdAt: true,
  updatedAt: true,
});

export type PersonalAudit = typeof personalAudits.$inferSelect;
export type InsertPersonalAudit = z.infer<typeof insertPersonalAuditSchema>;

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Auth Credentials
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // bcrypt hash
  
  // Link to Employee (for position-based permissions)
  employeeId: uuid("employee_id").unique().references(() => employees.id, { onDelete: 'set null' }),
  
  // Display Info
  name: text("name").notNull(),
  email: text("email"),
  
  // Role (for special accounts like Super Admin, Owner, BrM)
  role: varchar("role", { length: 20 }).notNull().$type<"super_admin" | "owner" | "brm" | "employee">().default("employee"),
  
  // Password Management
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastPasswordChange: timestamp("last_password_change"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  employeeId: z.string().optional(),
  securityQuestion: z.string().min(5, "Pertanyaan keamanan minimal 5 karakter"),
  securityAnswer: z.string().min(2, "Jawaban minimal 2 karakter"),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  securityAnswer: z.string().min(2, "Jawaban minimal 2 karakter"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// ============================================================================
// CHAT MESSAGES (for AI Chat Assistant) - TEMPORARILY DISABLED FOR DEPLOYMENT
// ============================================================================

// NOTE: Commented out to avoid schema migration conflicts during deployment
// Production database has legacy chat_messages table with different constraints
// Will re-enable after production database is stable

// export const chatMessages = pgTable("chat_messages", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   auditId: uuid("audit_id"), // Nullable - no foreign key to avoid migration conflicts
//   role: text("role").notNull(), // user, assistant, system
//   content: text("content").notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });

// export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
//   id: true,
//   createdAt: true,
// });

// export type ChatMessage = typeof chatMessages.$inferSelect;
// export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// ============================================================================
// DRIZZLE RELATIONS (for query convenience)
// ============================================================================

export const ptsRelations = relations(pts, ({ many }) => ({
  branches: many(branches),
  employees: many(employees),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  pt: one(pts, {
    fields: [branches.ptId],
    references: [pts.id],
  }),
  employees: many(employees),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  employees: many(employees),
}));

export const ceoUnitsRelations = relations(ceoUnits, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  pt: one(pts, {
    fields: [employees.ptId],
    references: [pts.id],
  }),
  branch: one(branches, {
    fields: [employees.branchId],
    references: [branches.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  ceoUnit: one(ceoUnits, {
    fields: [employees.ceoUnitId],
    references: [ceoUnits.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),
  subordinates: many(employees),
  monthlyPerformances: many(monthlyPerformance),
  audits: many(audits),
  user: one(users),
}));

export const monthlyPerformanceRelations = relations(monthlyPerformance, ({ one }) => ({
  employee: one(employees, {
    fields: [monthlyPerformance.employeeId],
    references: [employees.id],
  }),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  employee: one(employees, {
    fields: [audits.employeeId],
    references: [employees.id],
  }),
  createdBy: one(users, {
    fields: [audits.createdById],
    references: [users.id],
  }),
  // chatMessages: many(chatMessages), // Temporarily disabled for deployment
}));

export const personalAuditsRelations = relations(personalAudits, ({ one }) => ({
  user: one(users, {
    fields: [personalAudits.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
  createdAudits: many(audits),
  personalAudits: many(personalAudits),
  securityQuestions: one(securityQuestions),
  uploadLogs: many(uploadLogs),
}));

// Temporarily disabled for deployment
// export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
//   audit: one(audits, {
//     fields: [chatMessages.auditId],
//     references: [audits.id],
//   }),
// }));

// ============================================================================
// SECURITY QUESTIONS (for password reset without email)
// ============================================================================

export const securityQuestions = pgTable("security_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question1: text("question_1").notNull(),
  answer1: text("answer_1").notNull(), // Hashed with bcrypt
  question2: text("question_2").notNull(),
  answer2: text("answer_2").notNull(), // Hashed with bcrypt
  question3: text("question_3").notNull(),
  answer3: text("answer_3").notNull(), // Hashed with bcrypt
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecurityQuestionsSchema = createInsertSchema(securityQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SecurityQuestions = typeof securityQuestions.$inferSelect;
export type InsertSecurityQuestions = z.infer<typeof insertSecurityQuestionsSchema>;

// ============================================================================
// UPLOAD LOGS (track Excel uploads)
// ============================================================================

export const uploadLogs = pgTable("upload_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM format
  fileName: varchar("file_name", { length: 255 }),
  totalRows: integer("total_rows").notNull().default(0),
  successRows: integer("success_rows").notNull().default(0),
  errorRows: integer("error_rows").notNull().default(0),
  errors: jsonb("errors").$type<Array<{
    row: number;
    field: string;
    error: string;
  }>>(),
  status: varchar("status", { length: 20 }).notNull().default("success"), // success, partial, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUploadLogSchema = createInsertSchema(uploadLogs).omit({
  id: true,
  createdAt: true,
});

export type UploadLog = typeof uploadLogs.$inferSelect;
export type InsertUploadLog = z.infer<typeof insertUploadLogSchema>;

// ============================================================================
// RELATIONS FOR NEW TABLES
// ============================================================================

export const securityQuestionsRelations = relations(securityQuestions, ({ one }) => ({
  user: one(users, {
    fields: [securityQuestions.userId],
    references: [users.id],
  }),
}));

export const uploadLogsRelations = relations(uploadLogs, ({ one }) => ({
  branch: one(branches, {
    fields: [uploadLogs.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [uploadLogs.uploadedBy],
    references: [users.id],
  }),
}));
