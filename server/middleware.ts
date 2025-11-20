/**
 * Authentication & Authorization Middleware for AiSG
 * Includes position-based RBAC for enterprise hierarchy
 */

import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { getUserById } from "./auth";
import { storage } from "./storage";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password">;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 * Expects user ID to be stored in session
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session?.userId;
  
  if (!userId) {
    res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
    return;
  }
  
  // Get user from database
  const user = await getUserById(userId);
  
  if (!user) {
    // User ID in session but user doesn't exist in DB
    req.session.destroy(() => {});
    res.status(401).json({ error: "Unauthorized", userMessage: "Session tidak valid, silakan login kembali" });
    return;
  }
  
  // Attach user to request
  req.user = user;
  next();
}

/**
 * Middleware to require specific role
 * Usage: requireRole("admin") or requireRole("full_admin")
 */
export function requireRole(...allowedRoles: Array<User["role"]>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: "Forbidden", 
        userMessage: `Akses ditolak. Diperlukan role: ${allowedRoles.join(" atau ")}` 
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware to check if user is Super Admin (full system access)
 */
export const requireFullAdmin = requireRole("super_admin");

/**
 * Middleware to check if user is Owner or Super Admin
 */
export const requireOwnerOrAdmin = requireRole("super_admin", "owner");

/**
 * Optional auth middleware - doesn't fail if not authenticated
 * Just attaches user to request if session exists
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session?.userId;
  
  if (userId) {
    const user = await getUserById(userId);
    if (user) {
      req.user = user;
    }
  }
  
  next();
}

// =========================================================================
// POSITION-BASED RBAC MIDDLEWARE
// =========================================================================

/**
 * Middleware to check if current user can view a specific employee
 * Super Admin and Owner: can view all
 * Employees: can only view employees in their hierarchy
 * 
 * Usage: app.get("/api/employees/:id", requireAuth, canViewEmployee, handler)
 * Employee ID should be in req.params.id or req.params.employeeId
 */
export async function canViewEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
    return;
  }
  
  // Super Admin and Owner can view all
  if (req.user.role === "super_admin" || req.user.role === "owner") {
    next();
    return;
  }
  
  // Get target employee ID from params
  const targetEmployeeId = req.params.id || req.params.employeeId;
  
  if (!targetEmployeeId) {
    res.status(400).json({ error: "Bad Request", userMessage: "Employee ID tidak ditemukan" });
    return;
  }
  
  // Check if user has employeeId linked
  if (!req.user.employeeId) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "User tidak memiliki employee record" 
    });
    return;
  }
  
  // Check if user can view this employee (using storage RBAC helper)
  const canView = await storage.canManageEmployee(req.user.employeeId, targetEmployeeId);
  
  if (!canView) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "Anda tidak memiliki akses untuk melihat employee ini" 
    });
    return;
  }
  
  next();
}

/**
 * Middleware to check if current user can manage (create/update/delete) an employee
 * Super Admin: can manage all
 * Owner: can manage all in their organization
 * Managers: can only manage their subordinates
 * 
 * Usage: app.patch("/api/employees/:id", requireAuth, canManageEmployee, handler)
 */
export async function canManageEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
    return;
  }
  
  // Super Admin can manage all
  if (req.user.role === "super_admin") {
    next();
    return;
  }
  
  // Owner can manage all (with CEO unit isolation enforced at storage layer)
  if (req.user.role === "owner") {
    next();
    return;
  }
  
  // Get target employee ID from params
  const targetEmployeeId = req.params.id || req.params.employeeId;
  
  if (!targetEmployeeId) {
    res.status(400).json({ error: "Bad Request", userMessage: "Employee ID tidak ditemukan" });
    return;
  }
  
  // Check if user has employeeId linked
  if (!req.user.employeeId) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "User tidak memiliki employee record untuk manage" 
    });
    return;
  }
  
  // Check if user can manage this employee
  const canManage = await storage.canManageEmployee(req.user.employeeId, targetEmployeeId);
  
  if (!canManage) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "Anda tidak memiliki akses untuk manage employee ini" 
    });
    return;
  }
  
  next();
}

/**
 * Middleware to check minimum position level required
 * Example: requireMinPosition(8) means only BrM (level 8) and above can access
 * 
 * Usage: app.post("/api/branches", requireAuth, requireMinPosition(10), handler)
 */
export function requireMinPosition(minLevel: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
      return;
    }
    
    // Super Admin and Owner bypass position checks
    if (req.user.role === "super_admin" || req.user.role === "owner") {
      next();
      return;
    }
    
    // Check if user has employeeId
    if (!req.user.employeeId) {
      res.status(403).json({ 
        error: "Forbidden", 
        userMessage: "User tidak memiliki employee record" 
      });
      return;
    }
    
    // Get employee with position metadata
    const employeeMeta = await storage.getEmployeeWithMetadata(req.user.employeeId);
    
    if (!employeeMeta || !employeeMeta.position) {
      res.status(403).json({ 
        error: "Forbidden", 
        userMessage: "Employee position tidak ditemukan" 
      });
      return;
    }
    
    // Check if position level is sufficient (lower number = higher position)
    if (employeeMeta.position.level > minLevel) {
      res.status(403).json({ 
        error: "Forbidden", 
        userMessage: `Akses ditolak. Diperlukan posisi level ${minLevel} atau lebih tinggi` 
      });
      return;
    }
    
    next();
  };
}

// =========================================================================
// PERFORMANCE DATA RBAC MIDDLEWARE
// =========================================================================

/**
 * Middleware to check if current user can view performance data
 * Extracts employeeId from:
 * - req.params.employeeId (for /performance/employee/:employeeId)
 * - req.query.employeeId (for /performance?employeeId=xxx)
 * - Performance record (for /performance/:id)
 * 
 * Usage: app.get("/api/enterprise/performance/employee/:employeeId", requireAuth, canViewPerformance, handler)
 */
export async function canViewPerformance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
    return;
  }
  
  // Super Admin and Owner can view all
  if (req.user.role === "super_admin" || req.user.role === "owner") {
    next();
    return;
  }
  
  // Get target employee ID from params, query, or performance record
  let targetEmployeeId = req.params.employeeId || req.query.employeeId as string;
  
  // If checking specific performance record by ID, fetch employee from record
  if (!targetEmployeeId && req.params.id) {
    const performance = await storage.getPerformance(req.params.id);
    if (!performance) {
      res.status(404).json({ error: "Not Found", userMessage: "Data performance tidak ditemukan" });
      return;
    }
    targetEmployeeId = performance.employeeId;
  }
  
  // If no employeeId specified, allow (will be filtered to user's scope in handler)
  if (!targetEmployeeId) {
    next();
    return;
  }
  
  // Check if user has employeeId linked
  if (!req.user.employeeId) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "User tidak memiliki employee record" 
    });
    return;
  }
  
  // Check if user can view this employee's performance
  const canView = await storage.canManageEmployee(req.user.employeeId, targetEmployeeId);
  
  if (!canView) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "Anda tidak memiliki akses untuk melihat data performance employee ini" 
    });
    return;
  }
  
  next();
}

/**
 * Middleware to check if current user can manage (create/update) performance data
 * Extracts employeeId from:
 * - req.body.employeeId (for POST/PATCH)
 * - req.params.employeeId (for param-based routes)
 * - Performance record (for PATCH /performance/:id)
 * 
 * Usage: app.post("/api/enterprise/performance", requireAuth, canManagePerformance, handler)
 */
export async function canManagePerformance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", userMessage: "Silakan login terlebih dahulu" });
    return;
  }
  
  // Super Admin can manage all
  if (req.user.role === "super_admin") {
    next();
    return;
  }
  
  // Owner can manage all (with CEO unit isolation enforced at storage layer)
  if (req.user.role === "owner") {
    next();
    return;
  }
  
  // Get target employee ID from body, params, or performance record
  let targetEmployeeId = req.body.employeeId || req.params.employeeId;
  
  // If updating existing performance, fetch employeeId from record
  if (!targetEmployeeId && req.params.id) {
    const performance = await storage.getPerformance(req.params.id);
    if (!performance) {
      res.status(404).json({ error: "Not Found", userMessage: "Data performance tidak ditemukan" });
      return;
    }
    targetEmployeeId = performance.employeeId;
  }
  
  if (!targetEmployeeId) {
    res.status(400).json({ error: "Bad Request", userMessage: "Employee ID tidak ditemukan" });
    return;
  }
  
  // Check if user has employeeId linked
  if (!req.user.employeeId) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "User tidak memiliki employee record" 
    });
    return;
  }
  
  // Check if user can manage this employee's performance
  const canManage = await storage.canManageEmployee(req.user.employeeId, targetEmployeeId);
  
  if (!canManage) {
    res.status(403).json({ 
      error: "Forbidden", 
      userMessage: "Anda tidak memiliki akses untuk input data performance employee ini" 
    });
    return;
  }
  
  next();
}
