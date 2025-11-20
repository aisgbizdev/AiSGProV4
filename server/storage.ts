import { eq, desc, isNull, and, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  type User, 
  type InsertUser,
  type Pt,
  type InsertPt,
  type CeoUnit,
  type InsertCeoUnit,
  type Branch,
  type InsertBranch,
  type Position,
  type InsertPosition,
  type Employee,
  type InsertEmployee,
  type MonthlyPerformance,
  type InsertMonthlyPerformance,
  type Audit,
  type InsertAudit,
  // type ChatMessage, // Temporarily disabled for deployment
  // type InsertChatMessage, // Temporarily disabled for deployment
  users,
  pts,
  ceoUnits,
  branches,
  positions,
  employees,
  monthlyPerformance,
  audits,
  // chatMessages, // Temporarily disabled for deployment
  uploadLogs
} from "@shared/schema";
import { type AuditDetailDto } from "@shared/types";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, newPasswordHash: string): Promise<void>;
  
  // PT Company operations
  getAllPTs(): Promise<Pt[]>;
  getPT(id: string): Promise<Pt | undefined>;
  createPT(data: InsertPt): Promise<Pt>;
  updatePT(id: string, data: Partial<InsertPt>): Promise<Pt | undefined>;
  deletePT(id: string): Promise<boolean>;
  
  // CEO Unit operations
  getAllCEOUnits(): Promise<CeoUnit[]>;
  getCEOUnit(id: string): Promise<CeoUnit | undefined>;
  createCEOUnit(data: InsertCeoUnit): Promise<CeoUnit>;
  updateCEOUnit(id: string, data: Partial<InsertCeoUnit>): Promise<CeoUnit | undefined>;
  deleteCEOUnit(id: string): Promise<boolean>;
  
  // Branch operations
  getAllBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  getBranchesByPT(ptId: string): Promise<Branch[]>;
  createBranch(data: InsertBranch): Promise<Branch>;
  updateBranch(id: string, data: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;
  
  // Position operations
  getAllPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  getPositionByLevel(level: number): Promise<Position | undefined>;
  createPosition(data: InsertPosition): Promise<Position>;
  updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;
  
  // Employee operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByCode(code: string): Promise<Employee | undefined>;
  getEmployeesByBranch(branchId: string): Promise<Employee[]>;
  getEmployeesByPosition(positionId: string): Promise<Employee[]>;
  getEmployeesByManager(managerId: string): Promise<Employee[]>;
  getEmployeesByCEOUnit(ceoUnitId: string): Promise<Employee[]>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // Employee hierarchy operations
  getSubordinates(employeeId: string): Promise<Employee[]>;
  getAllSubordinatesRecursive(employeeId: string): Promise<Employee[]>;
  getOrganizationTree(rootEmployeeId: string): Promise<any>;
  
  // RBAC helper operations
  getEmployeeWithMetadata(employeeId: string): Promise<any | undefined>;
  canManageEmployee(managerId: string, targetEmployeeId: string): Promise<boolean>;
  
  // Monthly Performance operations
  getAllPerformance(): Promise<MonthlyPerformance[]>;
  getPerformance(id: string): Promise<MonthlyPerformance | undefined>;
  getPerformanceByEmployee(employeeId: string): Promise<MonthlyPerformance[]>;
  getPerformanceByPeriod(employeeId: string, year: number, month: number): Promise<MonthlyPerformance | undefined>;
  getQuarterlyPerformance(employeeId: string, year: number, quarter: number): Promise<MonthlyPerformance[]>;
  createPerformance(data: InsertMonthlyPerformance): Promise<MonthlyPerformance>;
  updatePerformance(id: string, data: Partial<InsertMonthlyPerformance>): Promise<MonthlyPerformance | undefined>;
  deletePerformance(id: string): Promise<boolean>;
  
  // Audit operations
  createAudit(data: InsertAudit): Promise<Audit>;
  getAudit(id: string): Promise<Audit | undefined>;
  getAllAudits(includeDeleted?: boolean): Promise<Audit[]>;
  getAuditsByEmployee(employeeId: string): Promise<Audit[]>;
  getAuditByPeriod(employeeId: string, year: number, quarter: number): Promise<Audit | undefined>;
  getAuditsForEmployeesInPeriod(employeeIds: string[], year: number, quarter: number): Promise<Audit[]>;
  updateAuditAggregation(id: string, marginTeamQ: string, naTeamQ: number, teamStructure: Audit['teamStructure']): Promise<Audit | undefined>;
  updateAuditReport(id: string, data: {
    zonaKinerja: Audit['zonaKinerja'];
    zonaPerilaku: Audit['zonaPerilaku'];
    zonaFinal: Audit['zonaFinal'];
    profil: Audit['profil'];
    prodemRekomendasi: Audit['prodemRekomendasi'];
    auditReport: Audit['auditReport'];
  }): Promise<Audit | undefined>;
  softDeleteAudit(id: string, deletedById: string, reason: string): Promise<void>;
  hardDeleteAudit(id: string): Promise<void>;
  
  // Chat operations - Temporarily disabled for deployment
  // createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  // getChatHistory(auditId: string): Promise<ChatMessage[]>;
  // deleteChatHistory(auditId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // =========================================================================
  // USER OPERATIONS
  // =========================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.employeeId, employeeId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, newPasswordHash: string): Promise<void> {
    await db.update(users).set({ password: newPasswordHash }).where(eq(users.id, id));
  }

  // =========================================================================
  // PT COMPANY OPERATIONS
  // =========================================================================
  
  async getAllPTs(): Promise<Pt[]> {
    return await db.select().from(pts).orderBy(pts.name);
  }

  async getPT(id: string): Promise<Pt | undefined> {
    const result = await db.select().from(pts).where(eq(pts.id, id)).limit(1);
    return result[0];
  }

  async createPT(data: InsertPt): Promise<Pt> {
    const result = await db.insert(pts).values(data).returning();
    return result[0];
  }

  async updatePT(id: string, data: Partial<InsertPt>): Promise<Pt | undefined> {
    const result = await db.update(pts).set(data).where(eq(pts.id, id)).returning();
    return result[0];
  }

  async deletePT(id: string): Promise<boolean> {
    const result = await db.delete(pts).where(eq(pts.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // CEO UNIT OPERATIONS
  // =========================================================================
  
  async getAllCEOUnits(): Promise<CeoUnit[]> {
    return await db.select().from(ceoUnits).orderBy(ceoUnits.name);
  }

  async getCEOUnit(id: string): Promise<CeoUnit | undefined> {
    const result = await db.select().from(ceoUnits).where(eq(ceoUnits.id, id)).limit(1);
    return result[0];
  }

  async createCEOUnit(data: InsertCeoUnit): Promise<CeoUnit> {
    const result = await db.insert(ceoUnits).values(data).returning();
    return result[0];
  }

  async updateCEOUnit(id: string, data: Partial<InsertCeoUnit>): Promise<CeoUnit | undefined> {
    const result = await db.update(ceoUnits).set(data).where(eq(ceoUnits.id, id)).returning();
    return result[0];
  }

  async deleteCEOUnit(id: string): Promise<boolean> {
    const result = await db.delete(ceoUnits).where(eq(ceoUnits.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // BRANCH OPERATIONS
  // =========================================================================
  
  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    return result[0];
  }

  async getBranchesByPT(ptId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.ptId, ptId)).orderBy(branches.name);
  }

  async createBranch(data: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values(data).returning();
    return result[0];
  }

  async updateBranch(id: string, data: Partial<InsertBranch>): Promise<Branch | undefined> {
    const result = await db.update(branches).set(data).where(eq(branches.id, id)).returning();
    return result[0];
  }

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // POSITION OPERATIONS
  // =========================================================================
  
  async getAllPositions(): Promise<Position[]> {
    return await db.select().from(positions).orderBy(positions.level);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
    return result[0];
  }

  async getPositionByLevel(level: number): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.level, level)).limit(1);
    return result[0];
  }

  async createPosition(data: InsertPosition): Promise<Position> {
    const result = await db.insert(positions).values(data).returning();
    return result[0];
  }

  async updatePosition(id: string, data: Partial<InsertPosition>): Promise<Position | undefined> {
    const result = await db.update(positions).set(data).where(eq(positions.id, id)).returning();
    return result[0];
  }

  async deletePosition(id: string): Promise<boolean> {
    const result = await db.delete(positions).where(eq(positions.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // EMPLOYEE OPERATIONS
  // =========================================================================
  
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.fullName);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    return result[0];
  }

  async getEmployeeByCode(code: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.employeeCode, code)).limit(1);
    return result[0];
  }

  async getEmployeesByBranch(branchId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.branchId, branchId)).orderBy(employees.fullName);
  }

  async getEmployeesByPosition(positionId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.positionId, positionId)).orderBy(employees.fullName);
  }

  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.managerId, managerId)).orderBy(employees.fullName);
  }

  async getEmployeesByCEOUnit(ceoUnitId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.ceoUnitId, ceoUnitId)).orderBy(employees.fullName);
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(data).returning();
    return result[0];
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return result[0];
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // EMPLOYEE HIERARCHY OPERATIONS
  // =========================================================================
  
  async getSubordinates(employeeId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.managerId, employeeId)).orderBy(employees.fullName);
  }

  async getAllSubordinatesRecursive(employeeId: string): Promise<Employee[]> {
    // Use parameterized query to prevent SQL injection
    const query = sql`
      WITH RECURSIVE subordinates AS (
        SELECT * FROM employees
        WHERE manager_id = ${employeeId}
        
        UNION ALL
        
        SELECT e.* FROM employees e
        INNER JOIN subordinates s ON e.manager_id = s.id
      )
      SELECT * FROM subordinates
      ORDER BY full_name
    `;
    
    const result = await db.execute(query);
    
    // Map snake_case fields to camelCase to match Employee type
    return (result.rows as any[]).map((row: any) => ({
      id: row.id,
      employeeCode: row.employee_code,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      ptId: row.pt_id,
      branchId: row.branch_id,
      positionId: row.position_id,
      ceoUnitId: row.ceo_unit_id,
      managerId: row.manager_id,
      joinDate: row.join_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getOrganizationTree(rootEmployeeId: string): Promise<any> {
    // Fetch root employee and all subordinates in ONE query (no N+1 problem)
    const rootEmployee = await this.getEmployee(rootEmployeeId);
    if (!rootEmployee) return null;
    
    const allSubordinates = await this.getAllSubordinatesRecursive(rootEmployeeId);
    
    // Build tree from flat list using O(n) Map-based approach (no O(n²) nested filters)
    const buildTreeOptimized = (root: Employee, subordinates: Employee[]): any => {
      // Create index: managerId -> children[]
      const childrenMap = new Map<string, Employee[]>();
      
      for (const emp of subordinates) {
        if (!emp.managerId) continue;
        if (!childrenMap.has(emp.managerId)) {
          childrenMap.set(emp.managerId, []);
        }
        childrenMap.get(emp.managerId)!.push(emp);
      }
      
      // Recursive function to build tree nodes
      const buildNode = (employee: Employee): any => {
        const children = childrenMap.get(employee.id) || [];
        return {
          ...employee,
          children: children.map(buildNode)
        };
      };
      
      return buildNode(root);
    };
    
    return buildTreeOptimized(rootEmployee, allSubordinates);
  }

  // =========================================================================
  // RBAC HELPER OPERATIONS
  // =========================================================================
  
  async getEmployeeWithMetadata(employeeId: string): Promise<any | undefined> {
    // Fetch employee with position, PT, branch, and CEO unit metadata in ONE query
    const result = await db
      .select({
        employee: employees,
        position: positions,
        pt: pts,
        branch: branches,
        ceoUnit: ceoUnits,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(pts, eq(employees.ptId, pts.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .leftJoin(ceoUnits, eq(employees.ceoUnitId, ceoUnits.id))
      .where(eq(employees.id, employeeId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const { employee, position, pt, branch, ceoUnit } = result[0];
    return {
      ...employee,
      positionLevel: position?.level,
      positionCode: position?.code,
      positionName: position?.name,
      ptCode: pt?.code,
      ptName: pt?.name,
      branchCode: branch?.code,
      branchName: branch?.name,
      ceoUnitName: ceoUnit?.name,
    };
  }

  async canManageEmployee(managerId: string, targetEmployeeId: string): Promise<boolean> {
    // Check if targetEmployee is a subordinate of manager (direct or indirect)
    const subordinates = await this.getAllSubordinatesRecursive(managerId);
    return subordinates.some(sub => sub.id === targetEmployeeId);
  }

  // =========================================================================
  // MONTHLY PERFORMANCE OPERATIONS
  // =========================================================================
  
  async getAllPerformance(): Promise<MonthlyPerformance[]> {
    return await db.select().from(monthlyPerformance).orderBy(desc(monthlyPerformance.year), desc(monthlyPerformance.month));
  }

  async getPerformance(id: string): Promise<MonthlyPerformance | undefined> {
    const result = await db.select().from(monthlyPerformance).where(eq(monthlyPerformance.id, id)).limit(1);
    return result[0];
  }

  async getPerformanceByEmployee(employeeId: string): Promise<MonthlyPerformance[]> {
    return await db.select().from(monthlyPerformance)
      .where(eq(monthlyPerformance.employeeId, employeeId))
      .orderBy(desc(monthlyPerformance.year), desc(monthlyPerformance.month));
  }

  async getPerformanceByPeriod(employeeId: string, year: number, month: number): Promise<MonthlyPerformance | undefined> {
    const result = await db.select().from(monthlyPerformance)
      .where(and(
        eq(monthlyPerformance.employeeId, employeeId),
        eq(monthlyPerformance.year, year),
        eq(monthlyPerformance.month, month)
      ))
      .limit(1);
    return result[0];
  }

  async getQuarterlyPerformance(employeeId: string, year: number, quarter: number): Promise<MonthlyPerformance[]> {
    return await db.select().from(monthlyPerformance)
      .where(and(
        eq(monthlyPerformance.employeeId, employeeId),
        eq(monthlyPerformance.year, year),
        eq(monthlyPerformance.quarter, quarter)
      ))
      .orderBy(monthlyPerformance.month);
  }

  async createPerformance(data: InsertMonthlyPerformance): Promise<MonthlyPerformance> {
    const result = await db.insert(monthlyPerformance).values(data).returning();
    return result[0];
  }

  async updatePerformance(id: string, data: Partial<InsertMonthlyPerformance>): Promise<MonthlyPerformance | undefined> {
    const result = await db.update(monthlyPerformance).set(data).where(eq(monthlyPerformance.id, id)).returning();
    return result[0];
  }

  async deletePerformance(id: string): Promise<boolean> {
    const result = await db.delete(monthlyPerformance).where(eq(monthlyPerformance.id, id)).returning();
    return result.length > 0;
  }

  // =========================================================================
  // AUDIT OPERATIONS
  // =========================================================================
  
  async createAudit(data: InsertAudit): Promise<Audit> {
    const result = await db.insert(audits).values(data).returning();
    return result[0];
  }

  async getAudit(id: string): Promise<Audit | undefined> {
    const result = await db.select().from(audits).where(eq(audits.id, id)).limit(1);
    return result[0];
  }

  async getAllAudits(includeDeleted: boolean = false): Promise<Audit[]> {
    const whereClause = includeDeleted ? undefined : isNull(audits.deletedAt);
    const result = await db
      .select()
      .from(audits)
      .where(whereClause)
      .orderBy(desc(audits.createdAt));
    return result;
  }

  async getAuditsByEmployee(employeeId: string): Promise<Audit[]> {
    return await db.select().from(audits)
      .where(and(eq(audits.employeeId, employeeId), isNull(audits.deletedAt)))
      .orderBy(desc(audits.year), desc(audits.quarter));
  }

  async getAuditByPeriod(employeeId: string, year: number, quarter: number): Promise<Audit | undefined> {
    const result = await db.select().from(audits)
      .where(and(
        eq(audits.employeeId, employeeId),
        eq(audits.year, year),
        eq(audits.quarter, quarter),
        isNull(audits.deletedAt)
      ))
      .limit(1);
    return result[0];
  }

  async getAuditsForEmployeesInPeriod(employeeIds: string[], year: number, quarter: number): Promise<Audit[]> {
    if (employeeIds.length === 0) return [];
    
    return await db.select().from(audits)
      .where(and(
        inArray(audits.employeeId, employeeIds),
        eq(audits.year, year),
        eq(audits.quarter, quarter),
        isNull(audits.deletedAt)
      ));
  }

  async updateAuditAggregation(id: string, marginTeamQ: string, naTeamQ: number, teamStructure: Audit['teamStructure']): Promise<Audit | undefined> {
    const result = await db.update(audits)
      .set({ 
        marginTeamQ, 
        naTeamQ, 
        teamStructure 
      })
      .where(eq(audits.id, id))
      .returning();
    return result[0];
  }

  async getAuditWithEmployee(id: string): Promise<AuditDetailDto | undefined> {
    const result = await db
      .select()
      .from(audits)
      .leftJoin(employees, eq(audits.employeeId, employees.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .leftJoin(pts, eq(employees.ptId, pts.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(eq(audits.id, id))
      .limit(1);
    
    if (!result || result.length === 0) return undefined;
    
    const row = result[0];
    const audit = row.audits;
    const emp = row.employees;
    const pos = row.positions;
    const pt = row.pts;
    const branch = row.branches;
    
    if (!audit || !emp) return undefined;
    
    return {
      ...audit,
      employee: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        position: pos ? {
          id: pos.id,
          code: pos.code,
          name: pos.name,
          level: pos.level,
        } : null,
        pt: pt ? {
          id: pt.id,
          code: pt.code,
          name: pt.name,
        } : null,
        branch: branch ? {
          id: branch.id,
          code: branch.code,
          name: branch.name,
        } : null,
      }
    };
  }

  async updateAuditReport(id: string, data: {
    zonaKinerja: Audit['zonaKinerja'];
    zonaPerilaku: Audit['zonaPerilaku'];
    zonaFinal: Audit['zonaFinal'];
    profil: Audit['profil'];
    prodemRekomendasi: Audit['prodemRekomendasi'];
    auditReport: Audit['auditReport'];
  }): Promise<Audit | undefined> {
    const result = await db.update(audits)
      .set({
        zonaKinerja: data.zonaKinerja,
        zonaPerilaku: data.zonaPerilaku,
        zonaFinal: data.zonaFinal,
        profil: data.profil,
        prodemRekomendasi: data.prodemRekomendasi as any,
        auditReport: data.auditReport as any,
      })
      .where(eq(audits.id, id))
      .returning();
    return result[0];
  }

  async softDeleteAudit(id: string, deletedById: string, reason: string): Promise<void> {
    await db
      .update(audits)
      .set({
        deletedAt: new Date(),
        deletedById,
        deletedReason: reason,
      })
      .where(eq(audits.id, id));
  }

  async hardDeleteAudit(id: string): Promise<void> {
    // await db.delete(chatMessages).where(eq(chatMessages.auditId, id)); // Temporarily disabled
    await db.delete(audits).where(eq(audits.id, id));
  }

  // =========================================================================
  // CHAT OPERATIONS - Temporarily disabled for deployment
  // =========================================================================
  
  // async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
  //   const result = await db.insert(chatMessages).values(data).returning();
  //   return result[0];
  // }

  // async getChatHistory(auditId: string): Promise<ChatMessage[]> {
  //   const result = await db
  //     .select()
  //     .from(chatMessages)
  //     .where(eq(chatMessages.auditId, auditId))
  //     .orderBy(chatMessages.createdAt);
  //   return result;
  // }

  // async deleteChatHistory(auditId: string): Promise<void> {
  //   await db.delete(chatMessages).where(eq(chatMessages.auditId, auditId));
  // }

  // =========================================================================
  // EXCEL UPLOAD OPERATIONS
  // =========================================================================

  async createUploadLog(data: {
    branchId: string;
    uploadedBy: string;
    period: string;
    fileName: string;
    totalRows: number;
    successRows: number;
    errorRows: number;
    status: "success" | "partial" | "failed";
    errors?: any;
  }): Promise<{ id: string }> {
    const result = await db
      .insert(uploadLogs)
      .values({
        branchId: data.branchId,
        uploadedBy: data.uploadedBy,
        period: data.period,
        fileName: data.fileName,
        totalRows: data.totalRows,
        successRows: data.successRows,
        errorRows: data.errorRows,
        status: data.status,
        errors: data.errors,
      })
      .returning({ id: uploadLogs.id });
    return result[0];
  }

  async upsertMonthlyPerformance(data: {
    employeeId: string;
    year: number;
    month: number;
    quarter: number;
    marginPersonal: string;
    naPersonal: number;
  }): Promise<void> {
    // Try to find existing record
    const existing = await db
      .select()
      .from(monthlyPerformance)
      .where(
        and(
          eq(monthlyPerformance.employeeId, data.employeeId),
          eq(monthlyPerformance.year, data.year),
          eq(monthlyPerformance.month, data.month)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(monthlyPerformance)
        .set({
          marginPersonal: data.marginPersonal,
          naPersonal: data.naPersonal,
          quarter: data.quarter,
        })
        .where(
          and(
            eq(monthlyPerformance.employeeId, data.employeeId),
            eq(monthlyPerformance.year, data.year),
            eq(monthlyPerformance.month, data.month)
          )
        );
    } else {
      // Insert new
      await db.insert(monthlyPerformance).values({
        employeeId: data.employeeId,
        year: data.year,
        month: data.month,
        quarter: data.quarter,
        marginPersonal: data.marginPersonal,
        naPersonal: data.naPersonal,
      });
    }
  }
}

export const storage = new DbStorage();
