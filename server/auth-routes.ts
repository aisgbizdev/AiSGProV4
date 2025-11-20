/**
 * Authentication Routes for AiSG
 * Handles login, logout, register, user management
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { loginSchema, registerSchema, resetPasswordSchema } from "@shared/schema";
import { 
  authenticateUser, 
  createUser, 
  registerUser,
  getAllUsers, 
  deleteUser, 
  updateUserPassword,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPassword
} from "./auth";
import { requireAuth, requireFullAdmin, requireOwnerOrAdmin } from "./middleware";

export function registerAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Login with username & password
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate input
      const { username, password } = loginSchema.parse(req.body);
      
      // Authenticate
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ 
          error: "Invalid credentials",
          userMessage: "Username atau password salah" 
        });
      }
      
      // Set session and save explicitly
      req.session.userId = user.id;
      
      // Explicitly save session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Debug logging
      console.log("Login successful:", {
        sessionId: req.sessionID,
        userId: user.id,
        username: user.username,
      });
      
      return res.json({ 
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          userMessage: error.errors[0].message,
          details: error.errors 
        });
      }
      
      console.error("Login error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Terjadi kesalahan saat login" 
      });
    }
  });
  
  /**
   * POST /api/auth/logout
   * Logout current user
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ 
          error: "Logout failed",
          userMessage: "Gagal logout" 
        });
      }
      
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
  
  /**
   * GET /api/auth/me
   * Get current logged-in user
   */
  app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
    return res.json({ user: req.user });
  });
  
  /**
   * POST /api/auth/register
   * Public self-registration (creates employee role)
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Register user (always creates employee role)
      const user = await registerUser(userData);
      
      // Auto-login after registration
      req.session.userId = user.id;
      
      // Explicitly save session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Return without password and security answer
      const { password: _, securityAnswer: __, ...userWithoutSensitive } = user;
      
      return res.status(201).json({ 
        success: true,
        user: userWithoutSensitive,
        message: "Akun berhasil dibuat" 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          userMessage: error.errors[0].message,
          details: error.errors 
        });
      }
      
      // Handle unique constraint violation (duplicate username)
      if (error.code === "23505") {
        return res.status(409).json({ 
          error: "Username already exists",
          userMessage: "Username sudah digunakan" 
        });
      }
      
      console.error("Register error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal membuat akun baru" 
      });
    }
  });
  
  /**
   * POST /api/auth/create-user
   * Create user with specific role (Full Admin only)
   */
  app.post("/api/auth/create-user", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const createUserSchema = z.object({
        username: z.string().min(3, "Username minimal 3 karakter"),
        password: z.string().min(6, "Password minimal 6 karakter"),
        name: z.string().min(1, "Nama harus diisi"),
        email: z.string().email("Email tidak valid").optional(),
        employeeId: z.string().optional(),
        role: z.enum(["super_admin", "owner", "employee"]),
      });
      
      const userData = createUserSchema.parse(req.body);
      
      // Create user
      const user = await createUser(userData);
      
      // Return without password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(201).json({ 
        success: true,
        user: userWithoutPassword,
        message: "User created successfully" 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          userMessage: error.errors[0].message,
          details: error.errors 
        });
      }
      
      // Handle unique constraint violation (duplicate username)
      if (error.code === "23505") {
        return res.status(409).json({ 
          error: "Username already exists",
          userMessage: "Username sudah digunakan" 
        });
      }
      
      console.error("Create user error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal membuat user baru" 
      });
    }
  });
  
  /**
   * GET /api/auth/security-question/:username
   * Get security question for password reset
   */
  app.get("/api/auth/security-question/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      const question = await getSecurityQuestion(username);
      
      if (!question) {
        return res.status(404).json({ 
          error: "User not found",
          userMessage: "Username tidak ditemukan atau tidak memiliki pertanyaan keamanan" 
        });
      }
      
      return res.json({ securityQuestion: question });
    } catch (error) {
      console.error("Get security question error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal mengambil pertanyaan keamanan" 
      });
    }
  });
  
  /**
   * POST /api/auth/reset-password
   * Reset password using security question
   */
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { username, securityAnswer, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Verify security answer
      const isValid = await verifySecurityAnswer(username, securityAnswer);
      
      if (!isValid) {
        return res.status(401).json({ 
          error: "Invalid security answer",
          userMessage: "Jawaban keamanan salah" 
        });
      }
      
      // Reset password
      await resetPassword(username, newPassword);
      
      return res.json({ 
        success: true,
        message: "Password berhasil direset" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          userMessage: error.errors[0].message 
        });
      }
      
      console.error("Reset password error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal mereset password" 
      });
    }
  });
  
  /**
   * GET /api/users
   * Get all users (Admin and Full Admin only)
   */
  app.get("/api/users", requireAuth, requireOwnerOrAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal mengambil data users" 
      });
    }
  });
  
  /**
   * DELETE /api/users/:id
   * Delete user (Full Admin only)
   */
  app.delete("/api/users/:id", requireAuth, requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting yourself
      if (userId === req.user?.id) {
        return res.status(400).json({ 
          error: "Cannot delete yourself",
          userMessage: "Tidak bisa menghapus akun sendiri" 
        });
      }
      
      await deleteUser(userId);
      
      return res.json({ 
        success: true,
        message: "User deleted successfully" 
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal menghapus user" 
      });
    }
  });
  
  /**
   * PUT /api/users/:id/password
   * Update user password (Full Admin or self)
   */
  app.put("/api/users/:id/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { password } = z.object({ 
        password: z.string().min(6, "Password minimal 6 karakter") 
      }).parse(req.body);
      
      // Check permission: super admin can change anyone's password, others can only change their own
      if (req.user?.role !== "super_admin" && userId !== req.user?.id) {
        return res.status(403).json({ 
          error: "Forbidden",
          userMessage: "Anda hanya bisa mengubah password sendiri" 
        });
      }
      
      await updateUserPassword(userId, password);
      
      return res.json({ 
        success: true,
        message: "Password updated successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          userMessage: error.errors[0].message 
        });
      }
      
      console.error("Update password error:", error);
      return res.status(500).json({ 
        error: "Internal server error",
        userMessage: "Gagal mengubah password" 
      });
    }
  });
}
