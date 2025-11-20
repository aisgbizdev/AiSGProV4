/**
 * Authentication Service for AiSG
 * Handles login, logout, password hashing, and session management
 */

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User} from "@shared/schema";

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user with hashed password
 */
export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  employeeId?: string;
  role?: "super_admin" | "owner" | "employee";
  securityQuestion?: string;
  securityAnswer?: string;
}): Promise<User> {
  const hashedPassword = await hashPassword(data.password);
  
  // Hash security answer if provided (for password reset)
  const hashedSecurityAnswer = data.securityAnswer 
    ? await hashPassword(data.securityAnswer.toLowerCase().trim())
    : undefined;
  
  const [user] = await db.insert(users).values({
    username: data.username,
    password: hashedPassword,
    name: data.name,
    email: data.email,
    employeeId: data.employeeId,
    role: data.role || "employee",
    securityQuestion: data.securityQuestion,
    securityAnswer: hashedSecurityAnswer,
  }).returning();
  
  return user;
}

/**
 * Register a new user (public registration)
 * Always creates employee role
 */
export async function registerUser(data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  employeeId?: string;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<User> {
  return createUser({
    ...data,
    role: "employee",
  });
}

/**
 * Get security question for a username
 */
export async function getSecurityQuestion(username: string): Promise<string | null> {
  const [user] = await db
    .select({ securityQuestion: users.securityQuestion })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  return user?.securityQuestion || null;
}

/**
 * Verify security answer for password reset
 */
export async function verifySecurityAnswer(
  username: string,
  answer: string
): Promise<boolean> {
  const [user] = await db
    .select({ securityAnswer: users.securityAnswer })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (!user || !user.securityAnswer) {
    return false;
  }
  
  // Compare with hashed answer (case-insensitive)
  return verifyPassword(answer.toLowerCase().trim(), user.securityAnswer);
}

/**
 * Reset password using security question
 */
export async function resetPassword(
  username: string,
  newPassword: string
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  
  await db
    .update(users)
    .set({ 
      password: hashedPassword,
      updatedAt: new Date()
    })
    .where(eq(users.username, username));
}

/**
 * Authenticate user with username and password
 * Returns user object (without password) if successful, null if failed
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<Omit<User, "password"> | null> {
  // Find user by username
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (!user) {
    return null; // User not found
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null; // Invalid password
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get user by ID (without password)
 */
export async function getUserById(userId: string): Promise<Omit<User, "password"> | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    return null;
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  
  await db
    .update(users)
    .set({ 
      password: hashedPassword,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

/**
 * Delete user by ID
 */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Get all users (without passwords) - for admin dashboard
 */
export async function getAllUsers(): Promise<Array<Omit<User, "password">>> {
  const allUsers = await db.select().from(users);
  
  return allUsers.map(({ password: _, ...user }) => user);
}

/**
 * Check if user has permission based on role
 * Enterprise RBAC: super_admin > owner > employee
 * 
 * Note: For position-based permissions, use canManageEmployee in storage layer
 */
export function hasPermission(
  userRole: User["role"],
  requiredRole: User["role"]
): boolean {
  const roleHierarchy: Record<User["role"], number> = {
    super_admin: 3,
    owner: 2,
    employee: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can access audit
 * Super admin and owner can access all
 * Employees can only access their own or subordinates' audits
 */
export function canAccessAudit(
  userRole: User["role"],
  userId: string,
  auditOwnerId: string | null
): boolean {
  // Super admin can access everything
  if (userRole === "super_admin") {
    return true;
  }
  
  // Owner can access everything in their organization
  if (userRole === "owner") {
    return true;
  }
  
  // Employees can only access their own audits
  // (hierarchical access checked at storage/middleware layer)
  return userId === auditOwnerId;
}

/**
 * Ensure superadmin user exists
 * This runs on server startup to guarantee superadmin exists in both dev and production databases
 */
export async function ensureSuperadminExists(): Promise<void> {
  try {
    // Check if superadmin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);
    
    if (existingAdmin) {
      console.log("✅ Superadmin user already exists");
      return;
    }
    
    // Create superadmin if not exists
    console.log("🔧 Creating superadmin user...");
    await createUser({
      username: "superadmin",
      password: "vito1007",
      name: "AiSG Super Admin",
      email: "admin@aisg.com",
      role: "super_admin",
      securityQuestion: "Nama aplikasi ini?",
      securityAnswer: "AiSG",
    });
    
    console.log("✅ Superadmin user created successfully!");
    console.log("   Username: superadmin");
    console.log("   Password: vito1007");
  } catch (error) {
    console.error("❌ Failed to ensure superadmin exists:", error);
    // Don't throw - let the app continue even if this fails
  }
}
