/**
 * Enterprise Organizational Structure Routes
 * Handles PT Companies, CEO Units, Branches, Positions, Employees
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import {
  insertPtSchema,
  insertCeoUnitSchema,
  insertBranchSchema,
  insertPositionSchema,
  insertEmployeeSchema,
  insertMonthlyPerformanceSchema,
  insertAuditSchema,
} from "@shared/schema";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { uploadLogs } from "@shared/schema";
import { 
  requireAuth, 
  requireFullAdmin, 
  canViewPerformance, 
  canManagePerformance 
} from "./middleware";
import { 
  calculateTeamAggregation, 
  validateQuarterlyPerformance, 
  calculatePersonalQuarterly 
} from "./audit-aggregation-helper";
import { validatePillarAnswers } from "@shared/pillar-constants";
import {
  aggregateQuarterlyPerformance,
  calculatePillarRealityScore,
  calculateZonaKinerja,
  calculateZonaPerilaku,
  calculateZonaFinal,
  calculateProfile,
  calculateProDemRecommendation,
  generateProgressKuartal,
  generateEWS,
} from "./business-logic";
import {
  generateExecutiveSummary,
  generateInsightLengkap,
  generateSWOT,
  generateCoaching,
  generateActionPlan,
  generateVisi,
  generateMagicSection,
} from "./ai-narrative-generator";
import { generateAuditPDF } from "./pdf-generator";
import type { AuditPdfDto } from "@shared/types";
import multer from "multer";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";

export function registerEnterpriseRoutes(app: Express) {
  // =========================================================================
  // PT COMPANY ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/pts
   * Get all PT companies
   */
  app.get("/api/enterprise/pts", requireAuth, async (req: Request, res: Response) => {
    try {
      const pts = await storage.getAllPTs();
      res.json(pts);
    } catch (error: any) {
      console.error("Error fetching PTs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/pts/:id
   * Get single PT company
   */
  app.get("/api/enterprise/pts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const pt = await storage.getPT(req.params.id);
      if (!pt) {
        return res.status(404).json({ error: "PT tidak ditemukan" });
      }
      res.json(pt);
    } catch (error: any) {
      console.error("Error fetching PT:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/pts
   * Create new PT company (Super Admin only)
   */
  app.post("/api/enterprise/pts", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPtSchema.parse(req.body);
      const pt = await storage.createPT(data);
      res.status(201).json(pt);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating PT:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/pts/:id
   * Update PT company (Super Admin only)
   */
  app.patch("/api/enterprise/pts/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPtSchema.partial().parse(req.body);
      const pt = await storage.updatePT(req.params.id, data);
      if (!pt) {
        return res.status(404).json({ error: "PT tidak ditemukan" });
      }
      res.json(pt);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating PT:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/pts/:id
   * Delete PT company (Super Admin only)
   */
  app.delete("/api/enterprise/pts/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePT(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "PT tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting PT:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // CEO UNIT ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/ceo-units
   * Get all CEO units
   */
  app.get("/api/enterprise/ceo-units", requireAuth, async (req: Request, res: Response) => {
    try {
      const units = await storage.getAllCEOUnits();
      res.json(units);
    } catch (error: any) {
      console.error("Error fetching CEO units:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/ceo-units/:id
   * Get single CEO unit
   */
  app.get("/api/enterprise/ceo-units/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const unit = await storage.getCEOUnit(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: "CEO Unit tidak ditemukan" });
      }
      res.json(unit);
    } catch (error: any) {
      console.error("Error fetching CEO unit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/ceo-units
   * Create new CEO unit (Super Admin only)
   */
  app.post("/api/enterprise/ceo-units", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertCeoUnitSchema.parse(req.body);
      const unit = await storage.createCEOUnit(data);
      res.status(201).json(unit);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating CEO unit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/ceo-units/:id
   * Update CEO unit (Super Admin only)
   */
  app.patch("/api/enterprise/ceo-units/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertCeoUnitSchema.partial().parse(req.body);
      const unit = await storage.updateCEOUnit(req.params.id, data);
      if (!unit) {
        return res.status(404).json({ error: "CEO Unit tidak ditemukan" });
      }
      res.json(unit);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating CEO unit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/ceo-units/:id
   * Delete CEO unit (Super Admin only)
   */
  app.delete("/api/enterprise/ceo-units/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteCEOUnit(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "CEO Unit tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting CEO unit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // BRANCH ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/branches
   * Get all branches (optionally filtered by PT)
   */
  app.get("/api/enterprise/branches", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ptId } = req.query;
      
      const branches = ptId 
        ? await storage.getBranchesByPT(ptId as string)
        : await storage.getAllBranches();
      
      res.json(branches);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/branches/:id
   * Get single branch
   */
  app.get("/api/enterprise/branches/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ error: "Branch tidak ditemukan" });
      }
      res.json(branch);
    } catch (error: any) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/branches
   * Create new branch (Super Admin only)
   */
  app.post("/api/enterprise/branches", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertBranchSchema.parse(req.body);
      
      // CRITICAL: Validate ceoUnitId is provided
      if (!data.ceoUnitId) {
        return res.status(400).json({ 
          error: "CEO Unit harus dipilih! Branch harus punya CEO Unit.",
          details: "ceoUnitId is required" 
        });
      }
      
      // Verify CEO Unit exists
      const ceoUnit = await storage.getCEOUnit(data.ceoUnitId);
      if (!ceoUnit) {
        return res.status(400).json({ 
          error: "CEO Unit tidak ditemukan!",
          details: `CEO Unit ID ${data.ceoUnitId} does not exist` 
        });
      }
      
      const branch = await storage.createBranch(data);
      res.status(201).json(branch);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating branch:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/branches/:id
   * Update branch (Super Admin only)
   */
  app.patch("/api/enterprise/branches/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertBranchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(req.params.id, data);
      if (!branch) {
        return res.status(404).json({ error: "Branch tidak ditemukan" });
      }
      res.json(branch);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating branch:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/branches/:id
   * Delete branch (Super Admin only)
   */
  app.delete("/api/enterprise/branches/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteBranch(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Branch tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // POSITION ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/positions
   * Get all positions (ordered by level)
   */
  app.get("/api/enterprise/positions", requireAuth, async (req: Request, res: Response) => {
    try {
      const positions = await storage.getAllPositions();
      res.json(positions);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/positions/:id
   * Get single position
   */
  app.get("/api/enterprise/positions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ error: "Position tidak ditemukan" });
      }
      res.json(position);
    } catch (error: any) {
      console.error("Error fetching position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/positions
   * Create new position (Super Admin only)
   */
  app.post("/api/enterprise/positions", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(data);
      res.status(201).json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/positions/:id
   * Update position (Super Admin only)
   */
  app.patch("/api/enterprise/positions/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPositionSchema.partial().parse(req.body);
      const position = await storage.updatePosition(req.params.id, data);
      if (!position) {
        return res.status(404).json({ error: "Position tidak ditemukan" });
      }
      res.json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/positions/:id
   * Delete position (Super Admin only)
   */
  app.delete("/api/enterprise/positions/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePosition(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Position tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting position:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // EMPLOYEE ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/employees
   * Get all employees (with optional filters)
   * Query params: branchId, positionId, managerId, ceoUnitId
   */
  app.get("/api/enterprise/employees", requireAuth, async (req: Request, res: Response) => {
    try {
      const { branchId, positionId, managerId, ceoUnitId } = req.query;
      
      let employees;
      
      if (branchId) {
        employees = await storage.getEmployeesByBranch(branchId as string);
      } else if (positionId) {
        employees = await storage.getEmployeesByPosition(positionId as string);
      } else if (managerId) {
        employees = await storage.getEmployeesByManager(managerId as string);
      } else if (ceoUnitId) {
        employees = await storage.getEmployeesByCEOUnit(ceoUnitId as string);
      } else {
        employees = await storage.getAllEmployees();
      }
      
      res.json(employees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/employees/:id
   * Get single employee with full details
   */
  app.get("/api/enterprise/employees/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee tidak ditemukan" });
      }
      res.json(employee);
    } catch (error: any) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/employees/by-user/:userId
   * Get employee data for a specific user (for dashboard)
   * Security: Users can only access their own employee data unless admin
   */
  app.get("/api/enterprise/employees/by-user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const requestingUser = (req as any).user;
      const targetUserId = req.params.userId;
      
      // RBAC: Users can only access their own data unless super_admin or owner
      if (requestingUser.id !== targetUserId && 
          requestingUser.role !== "super_admin" && 
          requestingUser.role !== "owner") {
        return res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses untuk melihat data user lain" 
        });
      }
      
      const user = await storage.getUser(targetUserId);
      if (!user || !user.employeeId) {
        return res.status(404).json({ error: "User or employee not found" });
      }
      
      const employee = await storage.getEmployee(user.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error: any) {
      console.error("Error fetching employee by user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/employees/:id/subordinates
   * Get direct subordinates of an employee
   */
  app.get("/api/enterprise/employees/:id/subordinates", requireAuth, async (req: Request, res: Response) => {
    try {
      const subordinates = await storage.getSubordinates(req.params.id);
      res.json(subordinates);
    } catch (error: any) {
      console.error("Error fetching subordinates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/employees/:id/hierarchy
   * Get full subordinate tree (recursive)
   */
  app.get("/api/enterprise/employees/:id/hierarchy", requireAuth, async (req: Request, res: Response) => {
    try {
      const hierarchy = await storage.getOrganizationTree(req.params.id);
      res.json(hierarchy);
    } catch (error: any) {
      console.error("Error fetching hierarchy:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/employees
   * Create new employee (with hierarchy validation)
   * Validates:
   * - Employee code uniqueness
   * - Manager exists and is valid
   * - Branch/Position/CEO Unit exist
   * - No circular references
   */
  app.post("/api/enterprise/employees", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      // Normalize empty strings to null BEFORE parsing
      const normalizedBody = {
        ...req.body,
        managerId: req.body.managerId === "" ? null : req.body.managerId,
        branchId: req.body.branchId === "" ? null : req.body.branchId,
        ceoUnitId: req.body.ceoUnitId === "" ? null : req.body.ceoUnitId,
      };
      
      const data = insertEmployeeSchema.parse(normalizedBody);
      
      // Validate branch exists
      if (data.branchId) {
        const branch = await storage.getBranch(data.branchId);
        if (!branch) {
          return res.status(400).json({ error: "Branch tidak ditemukan" });
        }
      }
      
      // Validate position exists
      const position = await storage.getPosition(data.positionId);
      if (!position) {
        return res.status(400).json({ error: "Position tidak ditemukan" });
      }
      
      // Validate CEO unit exists
      if (data.ceoUnitId) {
        const ceoUnit = await storage.getCEOUnit(data.ceoUnitId);
        if (!ceoUnit) {
          return res.status(400).json({ error: "CEO Unit tidak ditemukan" });
        }
      }
      
      // Validate manager exists (if provided)
      if (data.managerId) {
        const manager = await storage.getEmployee(data.managerId);
        if (!manager) {
          return res.status(400).json({ error: "Manager tidak ditemukan" });
        }
        
        // Validate manager's position level is higher (lower number = higher position)
        const managerPosition = await storage.getPosition(manager.positionId);
        if (!managerPosition) {
          return res.status(400).json({ error: "Position manager tidak valid" });
        }
        
        if (managerPosition.level >= position.level) {
          return res.status(400).json({ 
            error: "Manager harus memiliki posisi lebih tinggi dari employee" 
          });
        }
      }
      
      // Check employee code uniqueness
      const existingByCode = await storage.getEmployeeByCode(data.employeeCode);
      if (existingByCode) {
        return res.status(400).json({ error: "Kode employee sudah digunakan" });
      }
      
      const employee = await storage.createEmployee(data);
      res.status(201).json(employee);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/employees/:id
   * Update employee (with hierarchy validation)
   */
  app.patch("/api/enterprise/employees/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      // Normalize empty strings to null BEFORE parsing
      const normalizedBody = {
        ...req.body,
        managerId: req.body.managerId === "" ? null : req.body.managerId,
        branchId: req.body.branchId === "" ? null : req.body.branchId,
        ceoUnitId: req.body.ceoUnitId === "" ? null : req.body.ceoUnitId,
      };
      
      const data = insertEmployeeSchema.partial().parse(normalizedBody);
      
      // Check employee exists
      const existing = await storage.getEmployee(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Employee tidak ditemukan" });
      }
      
      // Validate branch if being updated
      if (data.branchId) {
        const branch = await storage.getBranch(data.branchId);
        if (!branch) {
          return res.status(400).json({ error: "Branch tidak ditemukan" });
        }
      }
      
      // Validate position if being updated
      if (data.positionId) {
        const position = await storage.getPosition(data.positionId);
        if (!position) {
          return res.status(400).json({ error: "Position tidak ditemukan" });
        }
      }
      
      // Validate hierarchy whenever manager OR position changes
      // Use updated values or fallback to existing values
      const effectiveManagerId = data.managerId !== undefined ? data.managerId : existing.managerId;
      const effectivePositionId = data.positionId || existing.positionId;
      
      if (effectiveManagerId && (data.managerId !== undefined || data.positionId)) {
        const manager = await storage.getEmployee(effectiveManagerId);
        if (!manager) {
          return res.status(400).json({ error: "Manager tidak ditemukan" });
        }
        
        const employeePosition = await storage.getPosition(effectivePositionId);
        if (!employeePosition) {
          return res.status(400).json({ error: "Position employee tidak valid" });
        }
        
        const managerPosition = await storage.getPosition(manager.positionId);
        if (!managerPosition) {
          return res.status(400).json({ error: "Position manager tidak valid" });
        }
        
        if (managerPosition.level >= employeePosition.level) {
          return res.status(400).json({ 
            error: "Manager harus memiliki posisi lebih tinggi dari employee" 
          });
        }
      }
      
      // Validate CEO unit if being updated
      if (data.ceoUnitId) {
        const ceoUnit = await storage.getCEOUnit(data.ceoUnitId);
        if (!ceoUnit) {
          return res.status(400).json({ error: "CEO Unit tidak ditemukan" });
        }
      }
      
      // Validate manager if being updated
      if (data.managerId !== undefined) {
        if (data.managerId === req.params.id) {
          return res.status(400).json({ error: "Employee tidak bisa menjadi manager dirinya sendiri" });
        }
        
        if (data.managerId) {
          const manager = await storage.getEmployee(data.managerId);
          if (!manager) {
            return res.status(400).json({ error: "Manager tidak ditemukan" });
          }
          
          // Check for circular reference: manager should not be in employee's subordinate tree
          const allSubordinates = await storage.getAllSubordinatesRecursive(req.params.id);
          if (allSubordinates.some(sub => sub.id === data.managerId)) {
            return res.status(400).json({ 
              error: "Tidak bisa set manager ke subordinate (circular reference)" 
            });
          }
        }
      }
      
      // Check employee code uniqueness if being updated
      if (data.employeeCode && data.employeeCode !== existing.employeeCode) {
        const existingByCode = await storage.getEmployeeByCode(data.employeeCode);
        if (existingByCode) {
          return res.status(400).json({ error: "Kode employee sudah digunakan" });
        }
      }
      
      const employee = await storage.updateEmployee(req.params.id, data);
      if (!employee) {
        return res.status(404).json({ error: "Employee tidak ditemukan" });
      }
      res.json(employee);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/employees/:id
   * Delete employee (soft delete recommended)
   * Note: Should check if employee has subordinates or audits before deleting
   */
  app.delete("/api/enterprise/employees/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      // Check if employee has subordinates
      const subordinates = await storage.getSubordinates(req.params.id);
      if (subordinates.length > 0) {
        return res.status(400).json({ 
          error: "Tidak bisa hapus employee yang masih memiliki subordinates",
          subordinatesCount: subordinates.length
        });
      }
      
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Employee tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // MONTHLY PERFORMANCE ROUTES
  // =========================================================================

  /**
   * GET /api/enterprise/performance
   * Get all performance data (filtered by RBAC)
   * Query params: ?employeeId=xxx&year=2025&quarter=1
   */
  app.get("/api/enterprise/performance", requireAuth, canViewPerformance, async (req: Request, res: Response) => {
    try {
      const { employeeId, year, quarter } = req.query;
      
      // If specific employee requested
      if (employeeId) {
        if (year && quarter) {
          const data = await storage.getQuarterlyPerformance(employeeId as string, parseInt(year as string), parseInt(quarter as string));
          return res.json(data);
        }
        const data = await storage.getPerformanceByEmployee(employeeId as string);
        return res.json(data);
      }
      
      // Otherwise return all (admin/owner) or user's scope (employee)
      let allPerformance = await storage.getAllPerformance();
      
      // Filter to user's scope if not admin/owner
      if (req.user && req.user.role === "employee" && req.user.employeeId) {
        // Get all subordinates
        const subordinates = await storage.getAllSubordinatesRecursive(req.user.employeeId);
        const visibleEmployeeIds = [req.user.employeeId, ...subordinates.map(s => s.id)];
        allPerformance = allPerformance.filter(p => visibleEmployeeIds.includes(p.employeeId));
      }
      
      // Apply year/quarter filters if provided
      if (year) {
        allPerformance = allPerformance.filter(p => p.year === parseInt(year as string));
      }
      if (quarter) {
        allPerformance = allPerformance.filter(p => p.quarter === parseInt(quarter as string));
      }
      
      res.json(allPerformance);
    } catch (error: any) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/performance/:id
   * Get single performance record
   */
  app.get("/api/enterprise/performance/:id", requireAuth, canViewPerformance, async (req: Request, res: Response) => {
    try {
      const performance = await storage.getPerformance(req.params.id);
      if (!performance) {
        return res.status(404).json({ error: "Data performance tidak ditemukan" });
      }
      res.json(performance);
    } catch (error: any) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/performance/employee/:employeeId
   * Get all performance for specific employee
   */
  app.get("/api/enterprise/performance/employee/:employeeId", requireAuth, canViewPerformance, async (req: Request, res: Response) => {
    try {
      const data = await storage.getPerformanceByEmployee(req.params.employeeId);
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching employee performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/performance/quarterly/:employeeId/:year/:quarter
   * Get quarterly performance (3 months aggregated)
   * Returns: QuarterlyPerformanceDto
   */
  app.get("/api/enterprise/performance/quarterly/:employeeId/:year/:quarter", requireAuth, canViewPerformance, async (req: Request, res: Response) => {
    try {
      const { employeeId, year, quarter } = req.params;
      const data = await storage.getQuarterlyPerformance(employeeId, parseInt(year), parseInt(quarter));
      
      // Calculate aggregated totals
      const totalMarginPersonal = data.reduce((sum, m) => sum + parseFloat(m.marginPersonal || "0"), 0);
      const totalNAPersonal = data.reduce((sum, m) => sum + (m.naPersonal || 0), 0);
      const totalLotSettled = data.reduce((sum, m) => sum + (m.lotSettled || 0), 0);
      
      // Map to DTO shape (only required fields)
      const monthsDto = data.map(m => ({
        month: m.month,
        marginPersonal: m.marginPersonal,
        naPersonal: m.naPersonal,
        lotSettled: m.lotSettled,
      }));
      
      res.json({
        employeeId,
        year: parseInt(year),
        quarter: parseInt(quarter),
        months: monthsDto,
        aggregated: {
          totalMarginPersonal: totalMarginPersonal.toFixed(2),
          totalNAPersonal,
          totalLotSettled,
          monthsAvailable: data.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching quarterly performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/enterprise/performance
   * Create new monthly performance entry
   */
  app.post("/api/enterprise/performance", requireAuth, canManagePerformance, async (req: Request, res: Response) => {
    try {
      // Parse and validate data
      const data = insertMonthlyPerformanceSchema.parse(req.body);
      
      // Check for duplicate entry
      const existing = await storage.getPerformanceByPeriod(data.employeeId, data.year, data.month);
      if (existing) {
        return res.status(400).json({ 
          error: "Data performance untuk employee, tahun, dan bulan ini sudah ada",
          userMessage: "Data performance bulan ini sudah diinput sebelumnya"
        });
      }
      
      // Auto-calculate quarter from month
      const quarter = Math.ceil(data.month / 3);
      const performanceData = { ...data, quarter };
      
      const performance = await storage.createPerformance(performanceData);
      res.status(201).json(performance);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/performance/:id
   * Update performance entry (cannot change employeeId/year/month)
   */
  app.patch("/api/enterprise/performance/:id", requireAuth, canManagePerformance, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getPerformance(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Data performance tidak ditemukan" });
      }
      
      // Prevent changing identity fields
      const { employeeId, year, month, quarter, ...allowedUpdates } = req.body;
      
      if (employeeId || year || month || quarter) {
        return res.status(400).json({ 
          error: "Tidak bisa mengubah employeeId, year, month, atau quarter",
          userMessage: "Hanya nilai performance yang bisa diubah"
        });
      }
      
      // Validate allowed updates
      const updateSchema = insertMonthlyPerformanceSchema.partial().omit({
        employeeId: true,
        year: true,
        month: true,
        quarter: true
      });
      const validatedUpdates = updateSchema.parse(allowedUpdates);
      
      const updated = await storage.updatePerformance(req.params.id, validatedUpdates);
      if (!updated) {
        return res.status(404).json({ error: "Data performance tidak ditemukan" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error updating performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/enterprise/performance/:id
   * Delete performance entry (Admin only)
   */
  app.delete("/api/enterprise/performance/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePerformance(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Data performance tidak ditemukan" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // AUDIT ROUTES
  // =========================================================================

  /**
   * POST /api/enterprise/audits
   * Create new audit with quarterly performance aggregation
   */
  app.post("/api/enterprise/audits", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Validate request body
      const auditRequestSchema = z.object({
        employeeId: z.string(),
        year: z.number().int(),
        quarter: z.number().int().min(1).max(4),
        pillarAnswers: z.array(z.object({
          pillarId: z.number().int().min(1).max(18),
          pillarName: z.string(),
          category: z.string(),
          score: z.number().int().min(1).max(5),
          notes: z.string().nullable().optional(),
        })),
      });
      
      const data = auditRequestSchema.parse(req.body);
      
      // 1. Check RBAC - Can user manage this employee?
      const canManage = await storage.canManageEmployee(user.employeeId, data.employeeId);
      if (!canManage && user.role !== "super_admin" && user.role !== "owner") {
        return res.status(403).json({ error: "Anda tidak memiliki akses untuk mengaudit karyawan ini" });
      }
      
      // 2. Check duplicate audit
      const existingAudit = await storage.getAuditByPeriod(data.employeeId, data.year, data.quarter);
      if (existingAudit) {
        return res.status(400).json({ 
          error: `Audit untuk Q${data.quarter} ${data.year} sudah ada untuk karyawan ini` 
        });
      }
      
      // 3. Validate pillar answers (all 18 must be present)
      if (!validatePillarAnswers(data.pillarAnswers)) {
        return res.status(400).json({ 
          error: "Semua 18 pilar harus diisi dengan score 1-5" 
        });
      }
      
      // 4. Fetch quarterly performance data
      const performanceData = await storage.getQuarterlyPerformance(
        data.employeeId, 
        data.year, 
        data.quarter
      );
      
      // 5. Validate performance data exists (3 months minimum)
      const performanceValidation = validateQuarterlyPerformance(
        performanceData, 
        data.year, 
        data.quarter
      );
      
      if (!performanceValidation.valid) {
        return res.status(400).json({ error: performanceValidation.error });
      }
      
      // 6. Aggregate quarterly performance (sum 3 months)
      const quarterlyPerformance = aggregateQuarterlyPerformance(performanceData);
      
      // 6b. Fetch previous quarter performance as targets (MVP baseline)
      const prevQuarter = data.quarter === 1 ? 4 : data.quarter - 1;
      const prevYear = data.quarter === 1 ? data.year - 1 : data.year;
      
      const prevPerformanceData = await storage.getQuarterlyPerformance(
        data.employeeId,
        prevYear,
        prevQuarter
      );
      
      // Calculate targets from previous quarter (or use defaults if no history)
      let targetMarginPersonal = 100; // MVP default target
      let targetNAPersonal = 5; // MVP default target
      let targetMarginTeam = 100; // MVP default target
      let targetNATeam = 5; // MVP default target
      
      if (prevPerformanceData.length >= 3) {
        // Use previous quarter as baseline target
        const prevQuarterlyPerf = aggregateQuarterlyPerformance(prevPerformanceData);
        targetMarginPersonal = parseFloat(prevQuarterlyPerf.marginPersonalQ) || 100;
        targetNAPersonal = prevQuarterlyPerf.naPersonalQ || 5;
        targetMarginTeam = parseFloat(prevQuarterlyPerf.marginTeamQ) || 100;
        targetNATeam = prevQuarterlyPerf.naTeamQ || 5;
      }
      
      // 7. Calculate team aggregation from subordinates
      const aggregation = await calculateTeamAggregation(
        storage,
        data.employeeId,
        data.year,
        data.quarter
      );
      
      // 8. Calculate reality scores for all 18 pillars
      const pillarScoresWithReality = data.pillarAnswers.map(p => {
        const realityScore = calculatePillarRealityScore(
          p.pillarId,
          p.category as "A" | "B" | "C",
          p.score,
          {
            marginPersonalQ: quarterlyPerformance.marginPersonalQ,
            naPersonalQ: quarterlyPerformance.naPersonalQ,
            marginTeamQ: quarterlyPerformance.marginTeamQ || aggregation.marginTeamQ,
            naTeamQ: quarterlyPerformance.naTeamQ || aggregation.naTeamQ,
            // Pass targets from previous quarter (or MVP defaults)
            targetMarginPersonal,
            targetNAPersonal,
            targetMarginTeam,
            targetNATeam,
          }
        );
        
        const gap = realityScore - p.score;
        
        // Generate insight based on gap
        let insight = "";
        if (Math.abs(gap) > 1.5) {
          insight = gap > 0 
            ? `Performa actual melebihi ekspektasi sendiri (+${gap.toFixed(1)}). Excellent self-awareness growth.`
            : `Gap signifikan antara self-assessment dan reality (${gap.toFixed(1)}). Perlu kalibrasi ekspektasi.`;
        } else if (Math.abs(gap) > 0.5) {
          insight = gap > 0
            ? `Slight underestimation. Good progress.`
            : `Slight overestimation. Self-awareness calibration recommended.`;
        }
        
        return {
          pillarId: p.pillarId,
          pillarName: p.pillarName,
          category: p.category as "A" | "B" | "C",
          selfScore: p.score,
          realityScore,
          gap,
          insight,
        };
      });
      
      // 9. Calculate zones
      const zonaKinerja = calculateZonaKinerja(pillarScoresWithReality);
      const zonaPerilaku = calculateZonaPerilaku(pillarScoresWithReality);
      const zonaFinal = calculateZonaFinal(zonaKinerja, zonaPerilaku, pillarScoresWithReality);
      
      // 10. Calculate profile
      const profile = calculateProfile(pillarScoresWithReality);
      
      // 11. Get employee data for ProDem calculation
      const employee = await storage.getEmployee(data.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      // Calculate employee tenure in months
      const tenureMonths = employee.joinDate 
        ? Math.floor((Date.now() - new Date(employee.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 12;
      
      // Check if margin is over target (simple heuristic for MVP)
      const marginOverTarget = parseFloat(quarterlyPerformance.marginPersonalQ) > 0;
      
      // 12. Calculate ProDem recommendation
      const prodem = calculateProDemRecommendation(
        zonaFinal,
        profile,
        employee.positionName || "Current Position",
        pillarScoresWithReality,
        {
          marginOverTarget,
          employeeTenureMonths: tenureMonths,
          nextPositionName: "Next Level Position", // TODO: Get from position hierarchy
        }
      );
      
      // 13. Generate deterministic report sections
      const progressKuartal = generateProgressKuartal({
        marginPersonalQ: quarterlyPerformance.marginPersonalQ,
        naPersonalQ: quarterlyPerformance.naPersonalQ,
        marginTeamQ: quarterlyPerformance.marginTeamQ || aggregation.marginTeamQ,
        naTeamQ: quarterlyPerformance.naTeamQ || aggregation.naTeamQ,
      });
      
      const ews = generateEWS(pillarScoresWithReality);
      
      // 14. Generate AI narrative sections (with 3-source fallback)
      const [
        executiveSummary,
        insightLengkap,
        swot,
        coaching,
        actionPlan,
        visi,
        magicSection,
      ] = await Promise.all([
        generateExecutiveSummary({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateInsightLengkap({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateSWOT({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateCoaching({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateActionPlan({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateVisi({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
        generateMagicSection({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${data.quarter} ${data.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores: pillarScoresWithReality,
          progressKuartal,
          ews,
        }),
      ]);
      
      // 15. Calculate total scores (sum of all 18 pillar scores)
      const totalSelfScore = pillarScoresWithReality.reduce((sum, p) => sum + p.selfScore, 0);
      const totalRealityScore = pillarScoresWithReality.reduce((sum, p) => sum + p.realityScore, 0);
      const totalGap = pillarScoresWithReality.reduce((sum, p) => sum + Math.abs(p.gap), 0);
      
      // 16. Create audit record with all calculated data
      const audit = await storage.createAudit({
        employeeId: data.employeeId,
        year: data.year,
        quarter: data.quarter,
        marginPersonalQ: quarterlyPerformance.marginPersonalQ,
        naPersonalQ: quarterlyPerformance.naPersonalQ,
        marginTeamQ: aggregation.marginTeamQ,
        naTeamQ: aggregation.naTeamQ,
        teamStructure: aggregation.teamStructure,
        totalSelfScore,
        totalRealityScore,
        totalGap,
        pillarAnswers: pillarScoresWithReality,
        zonaKinerja,
        zonaPerilaku,
        zonaFinal,
        profil: profile,
        prodemRekomendasi: {
          currentPosition: employee.positionName || "Current Position",
          recommendation: prodem.recommendation,
          nextPosition: prodem.recommendation === "Promosi" ? "Next Level Position" : undefined,
          reason: prodem.reason,
          konsekuensi: prodem.konsekuensi,
          nextStep: prodem.nextStep,
          requirements: prodem.requirements,
        },
        auditReport: {
          progressKuartal,
          ews,
          executiveSummary,
          insightLengkap,
          swot,
          coaching,
          actionPlan,
          visi,
        },
        magicSection,
        createdById: user.id,
      });
      
      // 16. Hydrate audit with employee relations for DTO response
      const auditWithEmployee = await storage.getAuditWithEmployee(audit.id);
      
      if (!auditWithEmployee) {
        return res.status(500).json({ error: "Gagal mengambil data audit setelah dibuat" });
      }
      
      // 17. Return AuditCreateResultDto (audit with employee + warnings + pendingSubordinates)
      res.status(201).json({
        audit: auditWithEmployee,
        warnings: aggregation.warnings,
        pendingSubordinates: aggregation.pendingSubordinates,
      });
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/audits/:id
   * Get single audit by ID
   * Returns: AuditDetailDto (audit with hydrated employee relations)
   */
  app.get("/api/enterprise/audits/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const audit = await storage.getAuditWithEmployee(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }
      
      // TODO: Add RBAC check (can view if audit is for self or subordinate)
      
      res.json(audit);
    } catch (error: any) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/audits/:id/pdf
   * Download audit report as PDF
   * Returns: PDF file (application/pdf)
   */
  app.get("/api/enterprise/audits/:id/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const audit = await storage.getAuditWithEmployee(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }
      
      // TODO: Add RBAC check (can view if audit is for self or subordinate)
      
      // Build AuditPdfDto from audit + employee data
      const pdfDto: AuditPdfDto = {
        fullName: audit.employee.fullName,
        position: audit.employee.position?.name || "N/A",
        branch: audit.employee.branch?.name || "N/A",
        ptCompany: audit.employee.pt?.name || "N/A",
        birthDate: audit.employee.birthDate,
        year: audit.year,
        quarter: audit.quarter,
        totalRealityScore: audit.totalRealityScore,
        totalSelfScore: audit.totalSelfScore,
        totalGap: audit.totalGap,
        profil: audit.profil,
        zonaFinal: audit.zonaFinal,
        auditReport: audit.auditReport,
        prodemRekomendasi: audit.prodemRekomendasi,
        magicSection: audit.magicSection,
        pillarAnswers: audit.pillarAnswers,
      };
      
      // Generate PDF
      const doc = generateAuditPDF(pdfDto);
      const filename = `audit-${audit.employee.fullName.replace(/\s+/g, "-")}-Q${audit.quarter}-${audit.year}.pdf`;
      
      // Set headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      // Stream PDF to response
      doc.pipe(res);
      doc.end(); // Finalize PDF after piping to response
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/audits/employee/:employeeId
   * Get all audits for an employee
   */
  app.get("/api/enterprise/audits/employee/:employeeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const audits = await storage.getAuditsByEmployee(req.params.employeeId);
      
      // TODO: Add RBAC check (can view if employee is self or subordinate)
      
      res.json(audits);
    } catch (error: any) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/enterprise/audits/employee/:employeeId/:year/:quarter
   * Check if audit exists for specific period
   */
  app.get("/api/enterprise/audits/employee/:employeeId/:year/:quarter", requireAuth, async (req: Request, res: Response) => {
    try {
      const { employeeId, year, quarter } = req.params;
      const audit = await storage.getAuditByPeriod(
        employeeId,
        parseInt(year),
        parseInt(quarter)
      );
      
      if (!audit) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }
      
      res.json(audit);
    } catch (error: any) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/audits/:id/refresh-aggregation
   * Recalculate team aggregation after subordinates complete audits
   */
  app.patch("/api/enterprise/audits/:id/refresh-aggregation", requireAuth, async (req: Request, res: Response) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }
      
      // Recalculate team aggregation
      const aggregation = await calculateTeamAggregation(
        storage,
        audit.employeeId,
        audit.year,
        audit.quarter
      );
      
      // Update audit with new aggregation
      const updatedAudit = await storage.updateAuditAggregation(
        req.params.id,
        aggregation.marginTeamQ,
        aggregation.naTeamQ,
        aggregation.teamStructure
      );
      
      res.json({
        audit: updatedAudit,
        warnings: aggregation.warnings,
        pendingSubordinates: aggregation.pendingSubordinates,
      });
      
    } catch (error: any) {
      console.error("Error refreshing aggregation:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/enterprise/audits/:id/regenerate-report
   * Regenerate all report sections (deterministic + AI narratives)
   * Useful for: fixing failed AI generation, applying updated AI models, recalculating after business logic changes
   */
  app.patch("/api/enterprise/audits/:id/regenerate-report", requireAuth, async (req: Request, res: Response) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }
      
      // Get employee data for AI narratives
      const employee = await storage.getEmployee(audit.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      // Use existing pillar answers to recalculate zones
      const pillarScores = audit.pillarAnswers as Array<{
        pillarId: string;
        pillarName: string;
        category: "A" | "B" | "C";
        selfScore: number;
        realityScore: number;
        gap: number;
        insight: string;
      }>;
      
      // Recalculate zones from existing pillar scores
      const zonaKinerja = calculateZonaKinerja(pillarScores);
      const zonaPerilaku = calculateZonaPerilaku(pillarScores);
      const zonaFinal = calculateZonaFinal(zonaKinerja, zonaPerilaku, pillarScores);
      
      // Recalculate profile
      const profile = calculateProfile(pillarScores);
      
      // Recalculate ProDem
      const tenureMonths = employee.joinDate 
        ? Math.floor((Date.now() - new Date(employee.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 12;
      
      const marginOverTarget = parseFloat(audit.marginPersonalQ) > 0;
      
      const prodem = calculateProDemRecommendation(
        zonaFinal,
        profile,
        employee.positionName || "Current Position",
        pillarScores,
        {
          marginOverTarget,
          employeeTenureMonths: tenureMonths,
          nextPositionName: "Next Level Position",
        }
      );
      
      // Regenerate deterministic sections
      const progressKuartal = generateProgressKuartal({
        marginPersonalQ: audit.marginPersonalQ,
        naPersonalQ: audit.naPersonalQ,
        marginTeamQ: audit.marginTeamQ,
        naTeamQ: audit.naTeamQ,
      });
      
      const ews = generateEWS(pillarScores);
      
      // Regenerate AI narrative sections (with 3-source fallback)
      const [
        executiveSummary,
        insightLengkap,
        swot,
        coaching,
        actionPlan,
        visi,
        magicSection,
      ] = await Promise.all([
        generateExecutiveSummary({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateInsightLengkap({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateSWOT({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateCoaching({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateActionPlan({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateVisi({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
        generateMagicSection({
          employeeName: employee.nama,
          positionName: employee.positionName || "N/A",
          quarterLabel: `Q${audit.quarter} ${audit.year}`,
          zonaKinerja,
          zonaPerilaku,
          zonaFinal,
          profile,
          prodem,
          pillarScores,
          progressKuartal,
          ews,
        }),
      ]);
      
      // Update audit with regenerated report sections
      const updatedAudit = await storage.updateAuditReport(req.params.id, {
        zonaKinerja,
        zonaPerilaku,
        zonaFinal,
        profil: profile,
        prodemRekomendasi: {
          currentPosition: employee.positionName || "Current Position",
          recommendation: prodem.recommendation,
          nextPosition: prodem.recommendation === "Promosi" ? "Next Level Position" : undefined,
          reason: prodem.reason,
          konsekuensi: prodem.konsekuensi,
          nextStep: prodem.nextStep,
          requirements: prodem.requirements,
        },
        auditReport: {
          progressKuartal,
          ews,
          executiveSummary,
          insightLengkap,
          swot,
          coaching,
          actionPlan,
          visi,
          magicSection,
        },
      });
      
      res.json({
        audit: updatedAudit,
        message: "Report berhasil di-regenerate dengan AI terbaru",
      });
      
    } catch (error: any) {
      console.error("Error regenerating report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // EXCEL UPLOAD ROUTES
  // =========================================================================

  // Configure multer for Excel file upload (memory storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB (untuk BAS data ~3K employees + 12 months performance)
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const allowedExts = [".xlsx", ".xls"];
      const ext = file.originalname.toLowerCase().slice(-5);
      
      if (allowedMimes.includes(file.mimetype) || allowedExts.some(e => ext.endsWith(e))) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only .xlsx and .xls files are allowed"));
      }
    },
  });

  /**
   * Upload employee Excel file
   * POST /api/enterprise/upload-excel
   */
  app.post(
    "/api/enterprise/upload-excel",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        // Only BrM and Super Admin can upload
        if (req.user.role !== "brm" && req.user.role !== "super_admin") {
          return res.status(403).json({ 
            error: "Forbidden. Only Branch Managers and Super Admins can upload employee data" 
          });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { branchId, period, overwriteExisting } = req.body;

        if (!branchId || !period) {
          return res.status(400).json({ 
            error: "Missing required fields: branchId and period" 
          });
        }

        // Validate period format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(period)) {
          return res.status(400).json({ 
            error: "Invalid period format. Expected YYYY-MM" 
          });
        }

        // Import service
        const { excelUploadService } = await import("./services/excel-upload");

        // Parse Excel file
        const parsedData = await excelUploadService.parseExcelFile(req.file.buffer);

        if (parsedData.invalidCount > 0) {
          return res.status(400).json({
            error: "Excel file contains validation errors",
            invalidRows: parsedData.invalidRows,
            summary: {
              total: parsedData.totalRows,
              valid: parsedData.validCount,
              invalid: parsedData.invalidCount,
            },
          });
        }

        // Validate hierarchy
        const hierarchyValidation = await excelUploadService.validateHierarchy(
          parsedData.validRows,
          branchId
        );

        if (!hierarchyValidation.isValid) {
          return res.status(400).json({
            error: "Hierarchy validation failed",
            errors: hierarchyValidation.errors,
            circularReferences: hierarchyValidation.circularReferences,
          });
        }

        // Process upload
        const result = await excelUploadService.processUpload(
          parsedData,
          {
            branchId,
            period,
            overwriteExisting: overwriteExisting === "true" || overwriteExisting === true,
          },
          req.user.id
        );

        res.json({
          success: true,
          message: result.message,
          uploadLogId: result.uploadLogId,
          summary: result.summary,
        });
      } catch (error: any) {
        console.error("Excel upload error:", error);
        res.status(500).json({ 
          error: error.message || "Failed to process Excel upload" 
        });
      }
    }
  );

  /**
   * Get upload logs for a branch
   * GET /api/enterprise/upload-logs/:branchId
   */
  app.get("/api/enterprise/upload-logs/:branchId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { branchId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const logs = await db
        .select()
        .from(uploadLogs)
        .where(eq(uploadLogs.branchId, branchId))
        .orderBy(desc(uploadLogs.createdAt))
        .limit(limit);

      res.json({ logs });
    } catch (error: any) {
      console.error("Error fetching upload logs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * BAS Production Data Bulk Upload (Auto-detect all branches)
   * POST /api/enterprise/upload-bas-bulk
   */
  app.post(
    "/api/enterprise/upload-bas-bulk",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        console.log(`[BAS Bulk Upload] Request received`);
        console.log(`[BAS Bulk Upload] Session ID:`, req.sessionID);
        console.log(`[BAS Bulk Upload] Has user:`, !!req.user);
        console.log(`[BAS Bulk Upload] User:`, req.user);
        
        if (!req.user) {
          console.error(`[BAS Bulk Upload] Unauthorized - no user in session`);
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { period, overwriteExisting } = req.body;

        if (!period) {
          return res.status(400).json({ error: "Period is required" });
        }

        console.log(`[BAS Bulk Upload] Starting upload for period: ${period}`);
        console.log(`[BAS Bulk Upload] File size: ${req.file.size} bytes`);

        // Import parser dynamically
        const { parseBASProductionData } = await import('./parsers/bas-production-parser.js');
        
        // Parse BAS Excel file
        const parseResult = parseBASProductionData(req.file.buffer);
        
        console.log(`[BAS Bulk Upload] Parse complete:`, {
          employees: parseResult.summary.totalEmployees,
          branches: parseResult.summary.totalBranches,
          pts: parseResult.summary.totalPTs,
          errors: parseResult.summary.errors.length
        });

        // Import bulk upload service
        const { bulkUploadBASData } = await import('./services/bas-bulk-upload-service.js');
        
        // Process bulk upload
        const result = await bulkUploadBASData(
          parseResult,
          {
            period,
            overwriteExisting: overwriteExisting === "true" || overwriteExisting === true,
          },
          req.user.id
        );

        // Transform summary to match frontend UploadResult interface
        const frontendSummary = {
          totalRows: parseResult.summary.totalEmployees,
          employeesCreated: result.summary.employeesCreated,
          employeesUpdated: result.summary.employeesUpdated,
          usersCreated: 0, // Not tracked separately in BAS upload
          performanceRecordsCreated: result.summary.performanceRecordsCreated,
          errors: result.summary.errors.map((err, idx) => ({
            row: idx + 2, // Start from row 2 (row 1 is header)
            field: 'employee',
            error: `${err.employee}: ${err.message}`,
            value: err.employee
          })),
          // Additional BAS-specific stats
          branchesCreated: result.summary.branchesCreated,
          ptsCreated: result.summary.ptsCreated,
          ceoUnitsCreated: result.summary.ceoUnitsCreated,
          hierarchyLinked: result.summary.hierarchyLinked,
          emailConflicts: result.summary.emailConflicts,
        };

        res.json({
          success: true,
          uploadLogId: '', // BAS upload doesn't create upload logs yet
          message: result.message,
          summary: frontendSummary,
        });
        
      } catch (error: any) {
        console.error("[BAS Bulk Upload] Error:", error);
        res.status(500).json({ 
          error: error.message || "Failed to process BAS bulk upload" 
        });
      }
    }
  );
}
