# AISG ENTERPRISE MVP - SIMPLIFIED ARCHITECTURE

**Version:** 2.0 (MVP Simplified)  
**Date:** November 13, 2025  
**Status:** Design Phase - Ready for Implementation  
**Scope:** Manual Excel Upload Only (No BAS API Integration)  
**Budget:** $30-40 | 5-7 days  

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Scope](#2-business-context--scope)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Authentication & Security Strategy](#4-authentication--security-strategy)
5. [Database Schema](#5-database-schema)
6. [Excel Upload Specification](#6-excel-upload-specification)
7. [Hierarchy Management](#7-hierarchy-management)
8. [Monthly Audit Workflow](#8-monthly-audit-workflow)
9. [Dashboard & Reporting](#9-dashboard--reporting)
10. [API Endpoints](#10-api-endpoints)
11. [UI/UX Design](#11-uiux-design)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Business Problem

**Original System (aisg23):** Individual/team audit system yang bagus, tapi ada gap:
- Manual employee onboarding (slow, error-prone)
- No bulk data import (hard to scale 800+ employees per branch)
- Complex multi-branch setup

**Enterprise Challenge:** 
- 42 branches total, each with 50-800+ employees
- High turnover (100+ new employees monthly per branch)
- Need scalable onboarding strategy
- Monthly performance tracking (margin + NA updates)

### 1.2 Solution Overview

**AISG Enterprise MVP** = Simplified, Excel-based bulk onboarding + monthly audit system

**Core Features:**
1. ✅ Manual Excel Upload (800+ employees, bulk import)
2. ✅ Auto-hierarchy builder (from atasan_code column)
3. ✅ Password = tanggal lahir (YYYYMMDD format, no email needed)
4. ✅ Security questions (password reset without email/OTP)
5. ✅ Monthly audit cycle (margin update + 18 Pilar assessment)
6. ✅ Bottom-up aggregation (real-time, cascade up hierarchy)
7. ✅ Multi-branch architecture (start 1 branch, scale to 42)
8. ✅ Dashboard + PDF export

**Out of Scope (MVP):**
- ❌ BAS API Integration (future enhancement)
- ❌ PT/Legal Entity Reporting (future enhancement)
- ❌ Notification System (future enhancement)
- ❌ CBO/CEO/Owner roles (use Super Admin for now)

### 1.3 Key Benefits

✅ **Scalability:** 800+ employees per branch, multi-branch ready  
✅ **Simplicity:** Excel upload = familiar workflow for admins  
✅ **Cost-effective:** No email/OTP costs (password = tanggal lahir)  
✅ **Fast onboarding:** Bulk import 800 employees in ~1 minute  
✅ **Reliable:** Manual process, no dependency on external APIs  

---

## 2. BUSINESS CONTEXT & SCOPE

### 2.1 Organization Structure

**Multi-Branch Architecture:**
```
Organization
├─ Branch 1: AXA 2 - Jakarta (800 employees)
├─ Branch 2: BPF 1 - Surabaya (650 employees)
├─ Branch 3: RFB 5 - Bandung (450 employees)
└─ ... (up to 42 branches)
```

**Hierarchy Within Each Branch (11 levels):**
```
BrM (Branch Manager) ← Admin role, outside hierarchy
└─ VBM (Vice Branch Manager) ← Top employee
   └─ SVBM (Senior Vice Branch Manager)
      └─ SEM (Senior Equity Manager)
         └─ EM (Equity Manager)
            └─ SBM (Senior Business Manager)
               └─ BsM (Business Manager)
                  └─ SBC (Senior Business Consultant)
                     └─ BC (Business Consultant) ← Bottom employee
```

**Key Rules:**
- BrM = Admin role (NOT employee, NO margin/NA, NOT in hierarchy)
- Each branch has own hierarchy tree
- Top employee per branch = VBM (or highest position available)
- Bottom employee = BC (or lowest position)
- Hierarchy built from Excel column: `atasan_code`

### 2.2 Workforce Characteristics

**Scale:**
- 42 branches total
- 50-800+ employees per branch
- ~10,000 employees total (across all branches)

**Challenges:**
- High turnover (100+ new employees monthly per branch)
- Email availability: Not guaranteed (many staff no email)
- Tech literacy: Mixed (managers OK, new staff perlu guidance)
- Commission-based: Performance tracking critical

**Solution:**
- Bulk Excel upload (fast onboarding)
- Password = tanggal lahir (no email needed)
- Security questions (password reset without email)

### 2.3 Simplified Scope (MVP)

**Focus:**
- Single Excel upload method (manual, no API)
- 3 roles only (Super Admin, BrM, Staff)
- Monthly audit cycle (margin update + 18 Pilar)
- Dashboard analytics (zone distribution, completion rate)
- PDF export (individual + branch reports)

**Future Enhancements (Post-MVP):**
- BAS API integration (auto-sync employee data)
- PT/Legal Entity reporting (cross-branch aggregation)
- CBO/CEO/Owner roles (strategic-level access)
- Notification system (email alerts, reminders)
- Advanced analytics (trends, forecasting)

---

## 3. USER ROLES & ACCESS CONTROL

### 3.1 Role Definitions

#### **ROLE 1: SUPER ADMIN**

**Purpose:** System administrator (IT team, owner)

**Access Level:** Full system access

**Capabilities:**
- ✅ CRUD branches (create, update, delete branches)
- ✅ CRUD users (create BrM accounts, reset passwords)
- ✅ View all data (all branches, all employees)
- ✅ Export all reports (cross-branch analytics)
- ✅ System configuration (settings, backups)

**Limitations:**
- ❌ Cannot isi 18 Pilar (not employee)
- ❌ Cannot have margin/NA (not employee)

**Use Cases:**
- Setup new branch (create branch + BrM account)
- Troubleshoot issues (reset passwords, fix hierarchy)
- Generate owner reports (cross-branch performance)

---

#### **ROLE 2: BrM (Branch Manager)**

**Purpose:** Branch administrator (1 per branch)

**Access Level:** Full access to assigned branch only

**Capabilities:**
- ✅ Upload Excel (800+ employees, monthly updates)
- ✅ View all staff in branch (800 employees)
- ✅ View aggregated dashboard (branch performance)
- ✅ Export branch PDF report
- ✅ Monitor audit completion (720/800 staff done = 90%)

**Limitations:**
- ❌ Cannot access other branches
- ❌ Cannot isi 18 Pilar (admin role, not employee)
- ❌ NO margin/NA (admin role, not in hierarchy)
- ❌ Cannot CRUD employees manually (only via Excel upload)

**Use Cases:**
- Monthly: Upload Excel (updated margin + NA data)
- Weekly: Monitor audit completion rate
- End of month: Export branch report PDF

**Account Creation:**
- Super Admin creates BrM account manually
- Username: `brm_<branch_code>` (e.g., `brm_axa2`)
- Initial password: `temp123` (BrM ganti saat first login)

---

#### **ROLE 3: STAFF**

**Purpose:** Branch employees (BC → VBM, all positions in hierarchy)

**Access Level:** Self + direct subordinates

**Capabilities:**
- ✅ View personal data (nama, posisi, margin, NA)
- ✅ Isi 18 Pilar (monthly self-assessment)
- ✅ View Reality Score (auto-calculated from margin/NA)
- ✅ View subordinates (if manager)
- ✅ View aggregated metrics (personal + subordinates)
- ✅ Export personal PDF report

**Limitations:**
- ❌ Cannot view peers (same level)
- ❌ Cannot view other branches
- ❌ Cannot edit margin/NA (read-only, from Excel)
- ❌ Cannot edit hierarchy (read-only, from Excel)

**Use Cases:**
- Monthly: Login → Check updated margin/NA → Isi 18 Pilar
- Weekly: Review Reality Score & Zone status
- End of month: Export personal report

**Account Creation:**
- Auto-created from Excel upload (BrM upload Excel)
- Username: Employee code (e.g., `EMP001`)
- Initial password: Tanggal lahir YYYYMMDD (e.g., `19900315`)
- First login: Paksa ganti password + setup security questions

---

### 3.2 Access Control Matrix

| Feature | Super Admin | BrM | Staff |
|---------|-------------|-----|-------|
| CRUD Branches | ✅ | ❌ | ❌ |
| CRUD Users | ✅ | ❌ | ❌ |
| Upload Excel | ✅ (all branches) | ✅ (own branch) | ❌ |
| View All Employees | ✅ | ✅ (own branch) | ❌ |
| View Self Data | N/A | N/A | ✅ |
| View Subordinates | ✅ | ✅ | ✅ (direct only) |
| Isi 18 Pilar | ❌ | ❌ | ✅ |
| Export PDF | ✅ (all) | ✅ (branch) | ✅ (personal) |
| Reset Password | ✅ (any user) | ❌ | ✅ (self only, via security Q) |

---

### 3.3 Role Hierarchy & Isolation

**Isolation Rules:**

1. **Branch Isolation:**
   - BrM can ONLY access own branch
   - Staff can ONLY access own branch
   - Super Admin can access ALL branches

2. **Hierarchy Isolation:**
   - Staff can view subordinates (cascade down)
   - Staff CANNOT view manager (cascade up)
   - Staff CANNOT view peers (same level)

3. **Data Isolation:**
   - Margin/NA: Staff see own + subordinates aggregate
   - 18 Pilar: Staff see own only (not subordinates' answers)
   - Reality Score: Staff see own + subordinates aggregate

**Example (Branch AXA 2):**
```
BrM (admin) → Can view ALL 800 employees
VBM (top employee) → Can view VBM + all subordinates (799 employees)
SBC (middle manager) → Can view SBC + subordinates (50 employees)
BC (bottom) → Can view BC only (self, no subordinates)
```

---

## 4. AUTHENTICATION & SECURITY STRATEGY

### 4.1 Password Strategy

**Design Decision:** Password = Tanggal Lahir (YYYYMMDD)

**Rationale:**
- ✅ No email needed (many staff no email)
- ✅ No OTP cost (avoid SMS/email costs)
- ✅ Easy to remember (staff know their own birth date)
- ✅ Unique per person (low collision risk)
- ⚠️ Security risk (mitigated by forced password change)

**Format:**
```
Tanggal lahir: 15 Maret 1990
Password: 19900315 (YYYYMMDD)
```

**Implementation:**
1. BrM upload Excel (include column: `tgl_lahir`)
2. System auto-create user accounts:
   - Username = `employee_code`
   - Password = `tanggal_lahir` (hashed with bcrypt)
3. First login:
   - Staff login with employee code + tanggal lahir
   - System FORCE password change
   - Staff setup security questions (3 questions)
4. Subsequent logins:
   - Staff login with employee code + NEW password

---

### 4.2 Security Questions (Password Reset)

**Purpose:** Password reset WITHOUT email/OTP

**Questions (3 required):**
1. Nama ibu kandung?
2. Kota tempat lahir?
3. Nama sekolah SD?

**Setup Flow:**
```
First login → Ganti password → Setup security questions (3)
```

**Reset Flow:**
```
1. Staff click "Lupa Password"
2. Enter employee code (EMP001)
3. System show 2 of 3 questions (random)
4. Staff answer both correctly
5. System allow set new password
6. Done! ✅
```

**Security:**
- Answers hashed with bcrypt (case-insensitive)
- 3 failed attempts → Lock account (BrM/Super Admin unlock)
- Answers cannot be blank

---

### 4.3 Session Management

**Technology:** express-session + MemoryStore

**Session Config:**
```javascript
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}
```

**Session Data:**
```javascript
req.session = {
  userId: "USER_001",
  employeeId: "EMP001", // NULL for Super Admin/BrM
  role: "staff", // "super_admin", "brm", "staff"
  branchId: "AXA2", // NULL for Super Admin
  username: "EMP001"
}
```

**Session Expiry:**
- 8 hours of inactivity → Auto logout
- Manual logout → Clear session

---

### 4.4 Authorization Middleware

**Backend Protection:**

```javascript
// Middleware: requireAuth
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware: requireRole
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.session.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Middleware: requireBranch
function requireBranch(req, res, next) {
  if (req.session.role === "super_admin") return next();
  
  const requestedBranch = req.params.branchId || req.body.branchId;
  if (requestedBranch !== req.session.branchId) {
    return res.status(403).json({ error: "Access denied to other branches" });
  }
  next();
}

// Usage:
app.get("/api/employees", requireAuth, requireRole("super_admin", "brm"), (req, res) => {
  // Only Super Admin or BrM can access
});

app.post("/api/upload", requireAuth, requireRole("brm"), requireBranch, (req, res) => {
  // Only BrM of same branch can upload
});
```

---

### 4.5 Security Best Practices

**Password Policy:**
- ✅ Minimum 8 characters
- ✅ First login: Force password change
- ✅ bcrypt hashing (cost factor: 10)
- ✅ No password reuse (check last password)

**Input Validation:**
- ✅ Zod schemas for all API requests
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)
- ✅ XSS prevention (React auto-escapes by default)

**CSRF Protection:**
- ✅ SameSite cookies (Lax mode)
- ✅ CORS configuration (allow specific origins only)

**Rate Limiting:**
- ✅ Login attempts: 5 per 15 minutes (per IP)
- ✅ Password reset: 3 per hour (per account)
- ✅ API calls: 100 per minute (per user)

---

## 5. DATABASE SCHEMA

### 5.1 Schema Overview

**Tables (8 total):**
1. `users` - Login credentials
2. `employees` - Employee master data
3. `branches` - Branch list
4. `monthly_performance` - Margin + NA per month
5. `audits` - Quarterly audit (18 Pilar + scores)
6. `chatMessages` - AI chat history
7. `security_questions` - Password reset questions
8. `upload_logs` - Excel upload audit trail

---

### 5.2 Table: users

**Purpose:** User accounts (login credentials)

**Schema:**
```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "super_admin", "brm", "staff"
  employeeId: varchar("employee_id").references(() => employees.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  lastPasswordChange: timestamp("last_password_change"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Relationships:**
- 1 user → 1 employee (for staff, NULL for admin/BrM)
- 1 user → 1 branch (for BrM/staff, NULL for super_admin)

**Indexes:**
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_employee ON users(employee_id);
CREATE INDEX idx_users_branch ON users(branch_id);
```

---

### 5.3 Table: employees

**Purpose:** Employee master data (from Excel upload)

**Schema:**
```typescript
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  position: varchar("position", { length: 50 }).notNull(),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  managerId: varchar("manager_id").references(() => employees.id, { onDelete: "set null" }),
  tanggalLahir: date("tanggal_lahir").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Relationships:**
- Self-referencing: `managerId` → `employees.id` (hierarchy)
- Many employees → 1 branch
- 1 employee → 1 user (optional)

**Indexes:**
```sql
CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_position ON employees(position);
```

**Hierarchy Example:**
```
EMP800 (VBM) → managerId: NULL (top)
EMP400 (SEM) → managerId: EMP800
EMP200 (BsM) → managerId: EMP400
EMP001 (BC) → managerId: EMP200
```

---

### 5.4 Table: branches

**Purpose:** Branch list (42 branches)

**Schema:**
```typescript
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey(), // e.g., "AXA2"
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Example Data:**
```sql
INSERT INTO branches (id, name, code) VALUES
  ('AXA2', 'AXA 2 - Jakarta', 'AXA2'),
  ('BPF1', 'BPF 1 - Surabaya', 'BPF1'),
  ('RFB5', 'RFB 5 - Bandung', 'RFB5');
```

---

### 5.5 Table: monthly_performance

**Purpose:** Monthly margin + NA data (from Excel upload)

**Schema:**
```typescript
export const monthlyPerformance = pgTable("monthly_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM (e.g., "2025-01")
  margin: decimal("margin", { precision: 15, scale: 2 }).notNull(),
  na: integer("na").notNull(),
  realityScore: decimal("reality_score", { precision: 15, scale: 2 }),
  zone: varchar("zone", { length: 20 }), // "success", "warning", "critical"
  uploadSource: varchar("upload_source", { length: 50 }).default("excel"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEmployeePeriod: unique().on(table.employeeId, table.period),
}));
```

**Indexes:**
```sql
CREATE INDEX idx_performance_employee ON monthly_performance(employee_id);
CREATE INDEX idx_performance_period ON monthly_performance(period);
```

**Reality Score Calculation:**
```javascript
realityScore = margin / na
zone = realityScore >= 4000000 ? "success" :
       realityScore >= 2000000 ? "warning" : "critical"
```

---

### 5.6 Table: audits

**Purpose:** Quarterly audit data (18 Pilar + aggregated metrics)

**Schema:**
```typescript
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  
  // Personal data (from monthly_performance)
  personalMargin: decimal("personal_margin", { precision: 15, scale: 2 }),
  personalNA: integer("personal_na"),
  personalRealityScore: decimal("personal_reality_score", { precision: 15, scale: 2 }),
  
  // Aggregated data (from subordinates)
  aggregatedMargin: decimal("aggregated_margin", { precision: 15, scale: 2 }),
  aggregatedNA: integer("aggregated_na"),
  aggregatedRealityScore: decimal("aggregated_reality_score", { precision: 15, scale: 2 }),
  
  // 18 Pilar (self-assessment, 1-5 scale)
  pilar1: integer("pilar_1"),
  pilar2: integer("pilar_2"),
  // ... pilar3-pilar18
  pilar18: integer("pilar_18"),
  
  // Calculated scores
  totalPilarScore: integer("total_pilar_score"),
  avgPilarScore: decimal("avg_pilar_score", { precision: 4, scale: 2 }),
  zone: varchar("zone", { length: 20 }),
  
  // SWOT, ProDem, Action Plan (JSONB)
  swot: json("swot").$type<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }>(),
  prodem: json("prodem").$type<{
    profile: string;
    demographic: string;
  }>(),
  actionPlan: json("action_plan").$type<{
    days30: string[];
    days60: string[];
    days90: string[];
  }>(),
  
  // Magic Section
  julukan: varchar("julukan", { length: 100 }),
  zodiak: varchar("zodiak", { length: 50 }),
  generasi: varchar("generasi", { length: 50 }),
  
  // Metadata
  isComplete: boolean("is_complete").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEmployeePeriod: unique().on(table.employeeId, table.period),
}));
```

---

### 5.7 Table: security_questions

**Purpose:** Password reset security questions

**Schema:**
```typescript
export const securityQuestions = pgTable("security_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question1: varchar("question_1", { length: 255 }).notNull(),
  answer1: varchar("answer_1", { length: 255 }).notNull(), // hashed
  question2: varchar("question_2", { length: 255 }).notNull(),
  answer2: varchar("answer_2", { length: 255 }).notNull(), // hashed
  question3: varchar("question_3", { length: 255 }).notNull(),
  answer3: varchar("answer_3", { length: 255 }).notNull(), // hashed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Standard Questions:**
```javascript
const SECURITY_QUESTIONS = [
  "Nama ibu kandung?",
  "Kota tempat lahir?",
  "Nama sekolah SD?"
];
```

---

### 5.8 Table: upload_logs

**Purpose:** Audit trail for Excel uploads

**Schema:**
```typescript
export const uploadLogs = pgTable("upload_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  fileName: varchar("file_name", { length: 255 }),
  totalRows: integer("total_rows"),
  successRows: integer("success_rows"),
  errorRows: integer("error_rows"),
  errors: json("errors").$type<Array<{
    row: number;
    error: string;
  }>>(),
  status: varchar("status", { length: 20 }).notNull(), // "success", "partial", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Example Log:**
```json
{
  "id": "LOG_001",
  "branchId": "AXA2",
  "uploadedBy": "USER_BRM_001",
  "period": "2025-01",
  "fileName": "AXA2_Jan2025.xlsx",
  "totalRows": 800,
  "successRows": 798,
  "errorRows": 2,
  "errors": [
    { "row": 45, "error": "Invalid atasan_code: EMP999 not found" },
    { "row": 123, "error": "Invalid tanggal_lahir format" }
  ],
  "status": "partial"
}
```

---

## 6. EXCEL UPLOAD SPECIFICATION

### 6.1 Excel Template Format

**File:** `Template_Upload_Employee.xlsx`

**Sheet Name:** `Data`

**Columns (8 required):**

| Column Name | Type | Required | Example | Validation |
|-------------|------|----------|---------|------------|
| employee_code | varchar(50) | ✅ | EMP001 | Unique, alphanumeric |
| nama | varchar(100) | ✅ | Andi Wijaya | Non-empty |
| posisi | varchar(50) | ✅ | BC | Valid position |
| atasan_code | varchar(50) | ❌ | EMP050 | Must exist (or NULL for top) |
| tgl_lahir | date | ✅ | 1990-03-15 | Format: YYYY-MM-DD |
| margin | decimal | ✅ | 10000000 | Numeric, >= 0 |
| na | integer | ✅ | 5 | Integer, >= 0 |
| email | varchar(100) | ❌ | andi@gmail.com | Valid email or empty |

**Valid Positions:**
```
BC, SBC, BsM, SBM, EM, SEM, VBM, SVBM
```

**Example Data:**
```excel
employee_code | nama          | posisi | atasan_code | tgl_lahir  | margin    | na | email
EMP001        | Andi Wijaya   | BC     | EMP050      | 1990-03-15 | 10000000  | 5  | andi@g.com
EMP002        | Budi Santoso  | BC     | EMP050      | 1985-07-22 | 15000000  | 3  | budi@g.com
EMP050        | Charlie Tan   | SBC    | EMP100      | 1980-12-05 | 50000000  | 10 | charlie@g.com
EMP100        | Dewi Lestari  | BsM    | EMP200      | 1978-05-18 | 120000000 | 25 | dewi@g.com
EMP200        | Eko Pratama   | SEM    | EMP300      | 1975-09-30 | 300000000 | 60 | eko@g.com
EMP300        | Farah Indah   | VBM    |             | 1970-01-10 | 800000000 | 150| farah@g.com
```

---

### 6.2 Upload Flow (Frontend)

**Step 1: Download Template**
```jsx
<Button onClick={downloadTemplate} data-testid="button-download-template">
  📥 Download Template Excel
</Button>

function downloadTemplate() {
  // Generate Excel template with headers
  const headers = ["employee_code", "nama", "posisi", "atasan_code", 
                   "tgl_lahir", "margin", "na", "email"];
  // ... generate XLSX file
  download("Template_Upload_Employee.xlsx");
}
```

**Step 2: Upload File**
```jsx
<Input 
  type="file" 
  accept=".xlsx,.xls" 
  onChange={handleFileUpload}
  data-testid="input-upload-excel"
/>

function handleFileUpload(e) {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("period", "2025-01"); // Current month
  
  // POST /api/upload
  apiRequest("/api/upload", {
    method: "POST",
    body: formData
  });
}
```

**Step 3: Preview & Validate**
```
Backend parse Excel → Return preview:

{
  totalRows: 800,
  validRows: 798,
  errors: [
    { row: 45, field: "atasan_code", error: "EMP999 not found" },
    { row: 123, field: "tgl_lahir", error: "Invalid date format" }
  ],
  preview: [
    { employee_code: "EMP001", nama: "Andi", ... },
    // ... first 10 rows
  ]
}
```

**Step 4: Confirm & Process**
```jsx
{errors.length > 0 && (
  <Alert variant="destructive">
    ⚠️ {errors.length} rows have errors. Fix and re-upload?
  </Alert>
)}

<Button onClick={confirmUpload} disabled={errors.length > 0}>
  ✅ Confirm Upload ({validRows} employees)
</Button>
```

---

### 6.3 Upload Processing (Backend)

**API Endpoint:** `POST /api/upload`

**Request:**
```javascript
Content-Type: multipart/form-data

Body:
- file: Excel file (max 10MB)
- period: YYYY-MM (e.g., "2025-01")
```

**Processing Steps:**

```javascript
async function processExcelUpload(file, period, branchId, uploadedBy) {
  // Step 1: Parse Excel
  const workbook = XLSX.read(file.buffer);
  const sheet = workbook.Sheets["Data"];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  // Step 2: Validate all rows
  const validationErrors = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Required fields
    if (!row.employee_code) {
      validationErrors.push({ row: i + 2, field: "employee_code", error: "Required" });
    }
    if (!row.nama) {
      validationErrors.push({ row: i + 2, field: "nama", error: "Required" });
    }
    
    // Valid position
    const validPositions = ["BC", "SBC", "BsM", "SBM", "EM", "SEM", "VBM", "SVBM"];
    if (!validPositions.includes(row.posisi)) {
      validationErrors.push({ row: i + 2, field: "posisi", error: "Invalid position" });
    }
    
    // Valid date
    if (!isValidDate(row.tgl_lahir)) {
      validationErrors.push({ row: i + 2, field: "tgl_lahir", error: "Invalid date format (YYYY-MM-DD)" });
    }
    
    // Numeric margin/NA
    if (isNaN(row.margin) || row.margin < 0) {
      validationErrors.push({ row: i + 2, field: "margin", error: "Must be numeric >= 0" });
    }
    if (isNaN(row.na) || row.na < 0) {
      validationErrors.push({ row: i + 2, field: "na", error: "Must be integer >= 0" });
    }
  }
  
  // Step 3: Build hierarchy tree (validate atasan_code)
  const employeeMap = new Map(rows.map(r => [r.employee_code, r]));
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    if (row.atasan_code && !employeeMap.has(row.atasan_code)) {
      validationErrors.push({ 
        row: i + 2, 
        field: "atasan_code", 
        error: `Manager ${row.atasan_code} not found in Excel` 
      });
    }
  }
  
  // Step 4: Detect circular references
  for (const row of rows) {
    if (hasCircularReference(row.employee_code, employeeMap)) {
      validationErrors.push({ 
        row: rows.indexOf(row) + 2, 
        error: "Circular reference detected in hierarchy" 
      });
    }
  }
  
  // Return validation errors (preview mode)
  if (validationErrors.length > 0) {
    return {
      status: "validation_failed",
      totalRows: rows.length,
      validRows: rows.length - validationErrors.length,
      errors: validationErrors,
      preview: rows.slice(0, 10)
    };
  }
  
  // Step 5: Database transaction (insert/update)
  await db.transaction(async (tx) => {
    // Upsert employees
    for (const row of rows) {
      await tx.insert(employees).values({
        employeeCode: row.employee_code,
        name: row.nama,
        position: row.posisi,
        branchId: branchId,
        managerId: row.atasan_code ? 
          (await tx.select().from(employees).where(eq(employees.employeeCode, row.atasan_code)).limit(1))[0]?.id : 
          null,
        tanggalLahir: new Date(row.tgl_lahir),
        email: row.email || null,
      }).onConflictDoUpdate({
        target: employees.employeeCode,
        set: {
          name: row.nama,
          position: row.posisi,
          managerId: /* ... */,
          tanggalLahir: new Date(row.tgl_lahir),
          email: row.email || null,
          updatedAt: new Date(),
        }
      });
      
      // Create user account (if new employee)
      const employee = await tx.select().from(employees)
        .where(eq(employees.employeeCode, row.employee_code))
        .limit(1);
      
      const existingUser = await tx.select().from(users)
        .where(eq(users.employeeId, employee[0].id))
        .limit(1);
      
      if (existingUser.length === 0) {
        // Auto-create user account
        const hashedPassword = await bcrypt.hash(
          row.tgl_lahir.replace(/-/g, ""), // YYYYMMDD
          10
        );
        
        await tx.insert(users).values({
          username: row.employee_code,
          password: hashedPassword,
          role: "staff",
          employeeId: employee[0].id,
          branchId: branchId,
          mustChangePassword: true,
        });
      }
      
      // Upsert monthly_performance
      await tx.insert(monthlyPerformance).values({
        employeeId: employee[0].id,
        period: period,
        margin: row.margin,
        na: row.na,
        realityScore: row.margin / row.na,
        zone: calculateZone(row.margin / row.na),
        uploadSource: "excel",
      }).onConflictDoUpdate({
        target: [monthlyPerformance.employeeId, monthlyPerformance.period],
        set: {
          margin: row.margin,
          na: row.na,
          realityScore: row.margin / row.na,
          zone: calculateZone(row.margin / row.na),
          updatedAt: new Date(),
        }
      });
    }
    
    // Log upload
    await tx.insert(uploadLogs).values({
      branchId: branchId,
      uploadedBy: uploadedBy,
      period: period,
      fileName: file.originalname,
      totalRows: rows.length,
      successRows: rows.length,
      errorRows: 0,
      status: "success",
    });
  });
  
  return {
    status: "success",
    totalRows: rows.length,
    successRows: rows.length,
    message: `${rows.length} employees imported successfully`
  };
}
```

---

### 6.4 Upload Performance

**Scale Test:**
- 800 rows Excel file: ~2MB
- Parse time: ~5 seconds
- Validation time: ~10 seconds
- Database insert: ~30 seconds (transaction)
- **Total time: ~45 seconds** ⚡

**Optimization:**
- Batch inserts (100 rows per query)
- Indexes on employee_code, branch_id
- Async processing (background job for 1000+ rows)

---

## 7. HIERARCHY MANAGEMENT

### 7.1 Hierarchy Building (Auto from Excel)

**Algorithm: Recursive Tree Builder**

**Input:** Excel rows with `atasan_code` column

**Output:** Hierarchy tree (parent-child relationships)

**Process:**

```javascript
function buildHierarchy(rows) {
  // Step 1: Create employee map
  const employeeMap = new Map();
  for (const row of rows) {
    employeeMap.set(row.employee_code, {
      ...row,
      children: []
    });
  }
  
  // Step 2: Build parent-child relationships
  const roots = []; // Top employees (no manager)
  
  for (const row of rows) {
    if (row.atasan_code) {
      const manager = employeeMap.get(row.atasan_code);
      if (manager) {
        manager.children.push(employeeMap.get(row.employee_code));
      }
    } else {
      // No manager = top employee (VBM typically)
      roots.push(employeeMap.get(row.employee_code));
    }
  }
  
  return { employeeMap, roots };
}
```

**Example:**
```javascript
Input Excel:
EMP001 | BC  | atasan: EMP050
EMP002 | BC  | atasan: EMP050
EMP050 | SBC | atasan: EMP100
EMP100 | BsM | atasan: EMP200
EMP200 | VBM | atasan: NULL

Output Tree:
EMP200 (VBM)
└─ EMP100 (BsM)
   └─ EMP050 (SBC)
      ├─ EMP001 (BC)
      └─ EMP002 (BC)
```

---

### 7.2 Circular Reference Detection

**Problem:** A → B → C → A (infinite loop!)

**Detection Algorithm:**

```javascript
function hasCircularReference(employeeCode, employeeMap, visited = new Set()) {
  if (visited.has(employeeCode)) {
    return true; // Circular reference detected!
  }
  
  visited.add(employeeCode);
  
  const employee = employeeMap.get(employeeCode);
  if (!employee || !employee.atasan_code) {
    return false; // Reached top, no circular reference
  }
  
  return hasCircularReference(employee.atasan_code, employeeMap, visited);
}
```

**Example Error:**
```
Row 45: Circular reference detected
- EMP045 → atasan: EMP046
- EMP046 → atasan: EMP047
- EMP047 → atasan: EMP045 ❌ LOOP!
```

---

### 7.3 Get Subordinates (Recursive Query)

**Use Case:** Staff view dashboard → Show self + all subordinates

**SQL Query (PostgreSQL Recursive CTE):**

```sql
WITH RECURSIVE subordinate_tree AS (
  -- Base case: Start from current employee
  SELECT 
    id, 
    employee_code, 
    name, 
    position, 
    manager_id,
    0 as level
  FROM employees
  WHERE id = $employeeId
  
  UNION ALL
  
  -- Recursive case: Get all subordinates
  SELECT 
    e.id,
    e.employee_code,
    e.name,
    e.position,
    e.manager_id,
    st.level + 1
  FROM employees e
  INNER JOIN subordinate_tree st ON e.manager_id = st.id
)
SELECT * FROM subordinate_tree
ORDER BY level, name;
```

**Example:**
```
Input: employeeId = EMP100 (BsM)

Output:
EMP100 (BsM) - level 0
├─ EMP050 (SBC) - level 1
│  ├─ EMP001 (BC) - level 2
│  └─ EMP002 (BC) - level 2
└─ EMP051 (SBC) - level 1
   └─ EMP003 (BC) - level 2
```

---

### 7.4 Bottom-Up Aggregation

**Use Case:** Calculate total margin/NA for employee + subordinates

**Algorithm:**

```javascript
async function getAggregatedPerformance(employeeId, period) {
  // Get all subordinates (including self)
  const subordinates = await getSubordinates(employeeId);
  
  // Get monthly performance for all subordinates
  const performances = await db.select()
    .from(monthlyPerformance)
    .where(
      and(
        inArray(monthlyPerformance.employeeId, subordinates.map(s => s.id)),
        eq(monthlyPerformance.period, period)
      )
    );
  
  // Sum margin & NA
  const totalMargin = performances.reduce((sum, p) => sum + Number(p.margin), 0);
  const totalNA = performances.reduce((sum, p) => sum + p.na, 0);
  const realityScore = totalNA > 0 ? totalMargin / totalNA : 0;
  
  return {
    employeeCount: subordinates.length,
    totalMargin,
    totalNA,
    realityScore,
    zone: calculateZone(realityScore)
  };
}
```

**Example:**
```
Employee: EMP100 (BsM)
Subordinates: EMP050, EMP001, EMP002 (4 total including self)

Personal:
- Margin: 120,000,000
- NA: 25
- Reality Score: 4,800,000 🟩 Success

Aggregated (personal + subordinates):
- Total Margin: 185,000,000
- Total NA: 43
- Reality Score: 4,302,325 🟩 Success
```

---

## 8. MONTHLY AUDIT WORKFLOW

### 8.1 Monthly Cycle Overview

**Timeline:**

```
Day 1-5: BrM upload Excel (updated margin + NA)
Day 5-28: Staff isi 18 Pilar (monthly self-assessment)
Day 28-30: BrM review completion rate
Day 30: BrM export monthly report PDF
```

**Trigger:** Excel upload → Auto-notify staff "Data updated, isi 18 Pilar!"

---

### 8.2 Staff Monthly Workflow

**Step 1: Login & Check Dashboard**
```
Staff login → Dashboard shows:

╔═══════════════════════════════════════════════╗
║  Andi Wijaya (EMP001 - BC)                    ║
╠═══════════════════════════════════════════════╣
║  📅 Period: Januari 2025                      ║
║  💰 Margin: Rp 10,000,000                     ║
║  📊 NA: 5                                      ║
║  🎯 Reality Score: Rp 2,000,000 🟨 Warning    ║
║                                               ║
║  ⚠️ ALERT: Isi 18 Pilar bulan ini!           ║
║  [Isi 18 Pilar Sekarang →]                   ║
╚═══════════════════════════════════════════════╝
```

**Step 2: Isi 18 Pilar (Self-Assessment)**
```jsx
<Form onSubmit={submitAudit}>
  <h3>18 Pilar Assessment (Scale 1-5)</h3>
  
  {[1, 2, 3, ...18].map(pilarNum => (
    <FormField
      key={pilarNum}
      name={`pilar${pilarNum}`}
      label={`Pilar ${pilarNum}: ${PILAR_NAMES[pilarNum]}`}
      render={({ field }) => (
        <Select onValueChange={field.onChange}>
          <SelectItem value="1">1 - Sangat Kurang</SelectItem>
          <SelectItem value="2">2 - Kurang</SelectItem>
          <SelectItem value="3">3 - Cukup</SelectItem>
          <SelectItem value="4">4 - Baik</SelectItem>
          <SelectItem value="5">5 - Sangat Baik</SelectItem>
        </Select>
      )}
    />
  ))}
  
  <Button type="submit">💾 Simpan Audit</Button>
</Form>
```

**Step 3: System Calculate Scores**
```javascript
// Auto-calculated upon submit
const audit = {
  employeeId: "EMP001",
  period: "2025-01",
  
  // Personal data (from monthly_performance)
  personalMargin: 10000000,
  personalNA: 5,
  personalRealityScore: 2000000,
  
  // Aggregated data (if has subordinates)
  aggregatedMargin: await getAggregatedMargin("EMP001"),
  aggregatedNA: await getAggregatedNA("EMP001"),
  
  // 18 Pilar scores
  pilar1: 4,
  pilar2: 3,
  // ...
  pilar18: 5,
  
  // Calculated
  totalPilarScore: 72, // sum(pilar1...pilar18)
  avgPilarScore: 4.0, // totalPilarScore / 18
  zone: "warning", // based on realityScore
  
  // Auto-generated
  swot: await generateSWOT(audit),
  prodem: await generateProDem(audit),
  julukan: await generateJulukan(audit),
  
  isComplete: true,
  completedAt: new Date()
};
```

**Step 4: View Result**
```
╔═══════════════════════════════════════════════╗
║  ✅ Audit Berhasil Disimpan!                  ║
╠═══════════════════════════════════════════════╣
║  Reality Score: Rp 2,000,000 🟨 Warning       ║
║  Avg Pilar: 4.0 / 5.0                         ║
║  Zone: Warning (Perlu Improvement!)           ║
║                                               ║
║  Julukan: "Pejuang Tangguh"                   ║
║  Profile: Realistis - Achiever                ║
║                                               ║
║  [Lihat Detail →] [Export PDF →]             ║
╚═══════════════════════════════════════════════╝
```

---

### 8.3 BrM Monitoring Dashboard

**Overview Tab:**
```
╔═══════════════════════════════════════════════╗
║  AXA 2 - Jakarta (Januari 2025)               ║
╠═══════════════════════════════════════════════╣
║  Total Staff: 800                             ║
║  Audit Progress: 720 / 800 (90%)              ║
║                                               ║
║  Zone Distribution:                           ║
║  🟩 Success: 600 (75%)                        ║
║  🟨 Warning: 100 (12.5%)                      ║
║  🟥 Critical: 20 (2.5%)                       ║
║  ⚪ Not Done: 80 (10%)                        ║
║                                               ║
║  Total Margin: Rp 6,400,000,000               ║
║  Avg Reality Score: Rp 8,000,000              ║
║                                               ║
║  [Export Branch Report PDF →]                ║
╚═══════════════════════════════════════════════╝
```

**Staff List Tab (with filters):**
```
[Search: ___] [Filter Posisi: All ▼] [Filter Zone: All ▼]

Showing 1-50 of 800

┌────────┬──────────┬────────┬───────────┬─────┬────────┐
│ Code   │ Nama     │ Posisi │ Margin    │ Zone│ Status │
├────────┼──────────┼────────┼───────────┼─────┼────────┤
│ EMP001 │ Andi     │ BC     │ 10jt      │ 🟨  │ ✅ Done│
│ EMP002 │ Budi     │ BC     │ 15jt      │ 🟩  │ ✅ Done│
│ EMP003 │ Charlie  │ SBC    │ 50jt      │ 🟩  │ ⚪ TODO│
│ ... (47 more rows)                                    │
└────────┴──────────┴────────┴───────────┴─────┴────────┘

[◀ Prev] Page 1 of 16 [Next ▶]
```

---

### 8.4 Audit Completion Tracking

**Database Query:**
```sql
SELECT 
  b.name as branch_name,
  COUNT(e.id) as total_employees,
  COUNT(a.id) as completed_audits,
  ROUND(COUNT(a.id)::numeric / COUNT(e.id) * 100, 2) as completion_rate
FROM branches b
LEFT JOIN employees e ON e.branch_id = b.id
LEFT JOIN audits a ON a.employee_id = e.id AND a.period = '2025-01'
WHERE b.id = 'AXA2'
GROUP BY b.id, b.name;
```

**Result:**
```
branch_name         | total_employees | completed_audits | completion_rate
--------------------+-----------------+------------------+----------------
AXA 2 - Jakarta     | 800             | 720              | 90.00
```

**Alert Thresholds:**
- ✅ >= 90%: Excellent (green)
- ⚠️ 70-89%: Good (yellow)
- 🚨 < 70%: Poor (red, send reminder!)

---

## 9. DASHBOARD & REPORTING

### 9.1 Staff Dashboard

**Personal Overview Card:**
```jsx
<Card data-testid="card-personal-overview">
  <CardHeader>
    <CardTitle>{employee.name} ({employee.employeeCode})</CardTitle>
    <CardDescription>{employee.position} - {branch.name}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Margin</p>
        <p className="text-2xl font-bold">Rp {formatNumber(performance.margin)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">NA</p>
        <p className="text-2xl font-bold">{performance.na}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Reality Score</p>
        <p className="text-2xl font-bold">
          Rp {formatNumber(performance.realityScore)} {getZoneIcon(performance.zone)}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Zone</p>
        <Badge variant={getZoneVariant(performance.zone)}>
          {performance.zone.toUpperCase()}
        </Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

**Subordinates Table (if manager):**
```jsx
{hasSubordinates && (
  <Card data-testid="card-subordinates">
    <CardHeader>
      <CardTitle>Bawahan Langsung ({subordinates.length})</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Posisi</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Status Audit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subordinates.map(sub => (
            <TableRow key={sub.id} data-testid={`row-subordinate-${sub.employeeCode}`}>
              <TableCell>{sub.name}</TableCell>
              <TableCell>{sub.position}</TableCell>
              <TableCell>Rp {formatNumber(sub.margin)}</TableCell>
              <TableCell>{getZoneIcon(sub.zone)}</TableCell>
              <TableCell>
                {sub.auditComplete ? "✅ Done" : "⚪ Pending"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
)}
```

---

### 9.2 BrM Dashboard

**Branch Overview:**
```jsx
<div className="grid grid-cols-4 gap-4">
  <Card data-testid="card-total-employees">
    <CardHeader>
      <CardTitle>Total Staff</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">{stats.totalEmployees}</p>
    </CardContent>
  </Card>
  
  <Card data-testid="card-total-margin">
    <CardHeader>
      <CardTitle>Total Margin</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">Rp {formatNumber(stats.totalMargin)}</p>
    </CardContent>
  </Card>
  
  <Card data-testid="card-avg-reality-score">
    <CardHeader>
      <CardTitle>Avg Reality Score</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">Rp {formatNumber(stats.avgRealityScore)}</p>
    </CardContent>
  </Card>
  
  <Card data-testid="card-completion-rate">
    <CardHeader>
      <CardTitle>Audit Progress</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">{stats.completionRate}%</p>
      <p className="text-sm text-muted-foreground">
        {stats.completedAudits} / {stats.totalEmployees}
      </p>
    </CardContent>
  </Card>
</div>
```

**Zone Distribution Chart:**
```jsx
<Card data-testid="card-zone-distribution">
  <CardHeader>
    <CardTitle>Zone Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={[
            { name: "Success", value: stats.successCount, fill: "#10b981" },
            { name: "Warning", value: stats.warningCount, fill: "#f59e0b" },
            { name: "Critical", value: stats.criticalCount, fill: "#ef4444" },
          ]}
          dataKey="value"
          label
        />
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

### 9.3 PDF Export

**Staff Personal Report:**

```
Structure (12 pages):

Page 1: Cover
- Employee name, code, position
- Branch name
- Period (Januari 2025)
- Logo AISG

Page 2: Personal Data
- Margin, NA, Reality Score
- Zone (Success/Warning/Critical)
- Avg Pilar Score

Page 3-4: 18 Pilar Breakdown
- Table: Pilar 1-18, score (1-5), description

Page 5: Zone Analysis
- Chart: Reality Score vs Threshold
- Interpretation (Success/Warning/Critical)

Page 6: SWOT Analysis
- Strengths, Weaknesses, Opportunities, Threats

Page 7: Employee Profile
- ProDem (Profile + Demographic)
- Personality type

Page 8-9: Action Plan 30-60-90
- 30 days: Focus areas
- 60 days: Mid-term goals
- 90 days: Long-term targets

Page 10: Early Warning System
- Alert if Critical zone
- Recommended actions

Page 11: Magic Section
- Julukan (nickname)
- Zodiak
- Generasi (Gen X/Y/Z)

Page 12: Summary & Signature
- Overall performance summary
- BrM signature area
```

**Implementation (PDFKit):**
```javascript
async function generatePersonalPDF(employeeId, period) {
  const doc = new PDFDocument();
  const employee = await getEmployee(employeeId);
  const performance = await getPerformance(employeeId, period);
  const audit = await getAudit(employeeId, period);
  
  // Page 1: Cover
  doc.fontSize(24).text("AUDIT REPORT", { align: "center" });
  doc.fontSize(18).text(employee.name, { align: "center" });
  doc.fontSize(12).text(`${employee.employeeCode} - ${employee.position}`, { align: "center" });
  doc.addPage();
  
  // Page 2: Personal Data
  doc.fontSize(16).text("Personal Performance");
  doc.fontSize(12).text(`Margin: Rp ${formatNumber(performance.margin)}`);
  doc.text(`NA: ${performance.na}`);
  doc.text(`Reality Score: Rp ${formatNumber(performance.realityScore)}`);
  doc.text(`Zone: ${performance.zone.toUpperCase()}`);
  doc.addPage();
  
  // Page 3-4: 18 Pilar
  doc.fontSize(16).text("18 Pilar Assessment");
  for (let i = 1; i <= 18; i++) {
    doc.fontSize(12).text(`Pilar ${i}: ${PILAR_NAMES[i]} - Score: ${audit[`pilar${i}`]}/5`);
  }
  // ... more pages
  
  doc.end();
  return doc;
}
```

---

## 10. API ENDPOINTS

### 10.1 Authentication

**POST /api/auth/login**
```javascript
Request:
{
  "username": "EMP001",
  "password": "19900315" // or changed password
}

Response:
{
  "success": true,
  "user": {
    "id": "USER_001",
    "username": "EMP001",
    "role": "staff",
    "employeeId": "EMP001",
    "branchId": "AXA2",
    "mustChangePassword": true
  }
}
```

**POST /api/auth/change-password**
```javascript
Request:
{
  "oldPassword": "19900315",
  "newPassword": "MyNewPassword123"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

**POST /api/auth/forgot-password**
```javascript
Request:
{
  "username": "EMP001"
}

Response:
{
  "success": true,
  "questions": [
    "Nama ibu kandung?",
    "Kota tempat lahir?"
  ] // 2 of 3 questions, random
}
```

**POST /api/auth/reset-password**
```javascript
Request:
{
  "username": "EMP001",
  "answers": {
    "question1": "Siti",
    "question2": "Jakarta"
  },
  "newPassword": "MyNewPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 10.2 Employee Management

**GET /api/employees**
```javascript
Query params:
- branchId (required for BrM)
- page (default: 1)
- limit (default: 50)
- search (optional)
- position (optional filter)
- zone (optional filter)

Response:
{
  "employees": [
    {
      "id": "EMP001",
      "employeeCode": "EMP001",
      "name": "Andi Wijaya",
      "position": "BC",
      "margin": 10000000,
      "na": 5,
      "realityScore": 2000000,
      "zone": "warning",
      "auditComplete": true
    }
  ],
  "total": 800,
  "page": 1,
  "pages": 16
}
```

**GET /api/employees/:id**
```javascript
Response:
{
  "id": "EMP001",
  "employeeCode": "EMP001",
  "name": "Andi Wijaya",
  "email": "andi@gmail.com",
  "position": "BC",
  "branchId": "AXA2",
  "managerId": "EMP050",
  "tanggalLahir": "1990-03-15",
  "isActive": true
}
```

**GET /api/employees/:id/subordinates**
```javascript
Response:
{
  "subordinates": [
    {
      "id": "EMP001",
      "name": "Andi",
      "position": "BC",
      "margin": 10000000,
      "zone": "warning",
      "level": 1 // 1 = direct report, 2 = indirect, etc.
    }
  ],
  "total": 50
}
```

---

### 10.3 Excel Upload

**POST /api/upload**
```javascript
Request:
Content-Type: multipart/form-data
Body:
- file: Excel file
- period: "2025-01"

Response (validation mode):
{
  "status": "validation_failed",
  "totalRows": 800,
  "validRows": 798,
  "errors": [
    { "row": 45, "field": "atasan_code", "error": "EMP999 not found" }
  ],
  "preview": [ /* first 10 rows */ ]
}

Response (success):
{
  "status": "success",
  "totalRows": 800,
  "successRows": 800,
  "message": "800 employees imported successfully"
}
```

**GET /api/upload/template**
```javascript
Response: Excel file download
Headers:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="Template_Upload_Employee.xlsx"
```

**GET /api/upload/history**
```javascript
Query params:
- branchId (required for BrM)
- page (default: 1)

Response:
{
  "logs": [
    {
      "id": "LOG_001",
      "fileName": "AXA2_Jan2025.xlsx",
      "period": "2025-01",
      "totalRows": 800,
      "successRows": 798,
      "errorRows": 2,
      "status": "partial",
      "createdAt": "2025-01-05T10:30:00Z"
    }
  ]
}
```

---

### 10.4 Audit Management

**POST /api/audits**
```javascript
Request:
{
  "employeeId": "EMP001",
  "period": "2025-01",
  "pilar1": 4,
  "pilar2": 3,
  // ... pilar3-18
  "pilar18": 5
}

Response:
{
  "id": "AUDIT_001",
  "employeeId": "EMP001",
  "period": "2025-01",
  "totalPilarScore": 72,
  "avgPilarScore": 4.0,
  "realityScore": 2000000,
  "zone": "warning",
  "julukan": "Pejuang Tangguh",
  "isComplete": true
}
```

**GET /api/audits/:employeeId/:period**
```javascript
Response:
{
  "audit": { /* full audit object */ },
  "swot": {
    "strengths": ["Konsisten", "Disiplin"],
    "weaknesses": ["Margin rendah"],
    "opportunities": ["Market expansion"],
    "threats": ["High competition"]
  },
  "actionPlan": {
    "days30": ["Focus on closing deals"],
    "days60": ["Expand network"],
    "days90": ["Achieve 5jt target"]
  }
}
```

---

### 10.5 Dashboard Analytics

**GET /api/dashboard/branch/:branchId**
```javascript
Query params:
- period: "2025-01"

Response:
{
  "totalEmployees": 800,
  "completedAudits": 720,
  "completionRate": 90,
  "totalMargin": 6400000000,
  "avgRealityScore": 8000000,
  "zoneDistribution": {
    "success": 600,
    "warning": 150,
    "critical": 50
  }
}
```

**GET /api/dashboard/personal/:employeeId**
```javascript
Query params:
- period: "2025-01"

Response:
{
  "personal": {
    "margin": 10000000,
    "na": 5,
    "realityScore": 2000000,
    "zone": "warning"
  },
  "aggregated": {
    "totalMargin": 185000000,
    "totalNA": 43,
    "realityScore": 4302325,
    "zone": "success",
    "subordinateCount": 50
  },
  "auditComplete": true
}
```

---

### 10.6 PDF Export

**GET /api/export/personal/:employeeId/:period**
```javascript
Response: PDF file download
Headers:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="Audit_EMP001_Jan2025.pdf"
```

**GET /api/export/branch/:branchId/:period**
```javascript
Response: PDF file download (branch summary report)
```

---

## 11. UI/UX DESIGN

### 11.1 Design System

**Color Palette (Dark Mode Primary):**
```css
:root {
  --background: 222 47% 11%;
  --foreground: 213 31% 91%;
  
  --primary: 210 100% 50%; /* Blue gradient */
  --primary-foreground: 0 0% 100%;
  
  --success: 142 76% 36%; /* Green - Zone Success */
  --warning: 38 92% 50%; /* Yellow - Zone Warning */
  --critical: 0 84% 60%; /* Red - Zone Critical */
  
  --card: 224 71% 4%;
  --border: 216 34% 17%;
}
```

**Zone Color Coding:**
- 🟩 Success: `bg-success` (green, ≥4jt)
- 🟨 Warning: `bg-warning` (yellow, ≥2jt)
- 🟥 Critical: `bg-critical` (red, <2jt)

**Typography:**
- Headings: Inter font, font-bold
- Body: Inter font, font-normal
- Numbers: font-mono (for alignment)

---

### 11.2 Layout Structure

**Global Layout:**
```jsx
<SidebarProvider>
  <div className="flex h-screen w-full">
    <AppSidebar /> {/* Sticky left sidebar */}
    <div className="flex flex-col flex-1">
      <Header /> {/* Sticky top header */}
      <main className="flex-1 overflow-auto p-6">
        <Router /> {/* Page content */}
      </main>
    </div>
  </div>
</SidebarProvider>
```

**Sidebar Menu (Role-based):**
```jsx
// Super Admin
- 🏢 Branches
- 👥 Users
- 📊 Dashboard (All)
- ⚙️ Settings

// BrM
- 📤 Upload Excel
- 👥 Staff List
- 📊 Dashboard
- 📄 Reports

// Staff
- 🏠 Dashboard
- 📝 Isi Audit
- 👥 Bawahan
- 📄 Export PDF
```

---

### 11.3 Key Pages

**Page 1: Login**
```
╔═══════════════════════════════════════╗
║         AISG ENTERPRISE               ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ Username: _____________________ │  ║
║  │ Password: _____________________ │  ║
║  │                                 │  ║
║  │ [Login →]                       │  ║
║  │                                 │  ║
║  │ Lupa Password?                  │  ║
║  └─────────────────────────────────┘  ║
╚═══════════════════════════════════════╝
```

**Page 2: BrM - Upload Excel**
```
╔═══════════════════════════════════════════════╗
║  Upload Data Karyawan                         ║
╠═══════════════════════════════════════════════╣
║  Period: [Januari 2025 ▼]                     ║
║                                               ║
║  Step 1: Download Template                    ║
║  [📥 Download Template Excel]                 ║
║                                               ║
║  Step 2: Upload File                          ║
║  [Choose File...] [📤 Upload]                 ║
║                                               ║
║  Step 3: Review & Confirm                     ║
║  ┌───────────────────────────────────────┐    ║
║  │ Total: 800 rows                       │    ║
║  │ Valid: 798 ✅                         │    ║
║  │ Errors: 2 ❌                          │    ║
║  │                                       │    ║
║  │ Row 45: Invalid atasan_code           │    ║
║  │ Row 123: Invalid tgl_lahir            │    ║
║  └───────────────────────────────────────┘    ║
║                                               ║
║  [Fix Errors] [Confirm Upload →]             ║
╚═══════════════════════════════════════════════╝
```

**Page 3: Staff - Dashboard**
```
╔═══════════════════════════════════════════════╗
║  Andi Wijaya (EMP001 - BC)                    ║
╠═══════════════════════════════════════════════╣
║  ┌──────────────┬──────────────┬────────────┐ ║
║  │ Margin       │ NA           │ Reality    │ ║
║  │ Rp 10,000,000│ 5            │ Rp 2,000,000│ ║
║  │              │              │ 🟨 Warning │ ║
║  └──────────────┴──────────────┴────────────┘ ║
║                                               ║
║  ⚠️ ALERT: Isi 18 Pilar bulan ini!           ║
║  [Isi 18 Pilar Sekarang →]                   ║
║                                               ║
║  Bawahan Langsung (50 orang)                  ║
║  ┌────────┬─────────┬─────────┬──────┬─────┐ ║
║  │ Nama   │ Posisi  │ Margin  │ Zone │Audit│ ║
║  ├────────┼─────────┼─────────┼──────┼─────┤ ║
║  │ Budi   │ BC      │ 15jt    │ 🟩   │ ✅  │ ║
║  │ ...    │ ...     │ ...     │ ...  │ ... │ ║
║  └────────┴─────────┴─────────┴──────┴─────┘ ║
╚═══════════════════════════════════════════════╝
```

---

### 11.4 Responsive Design

**Breakpoints:**
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

**Mobile Considerations:**
- Collapsible sidebar (hamburger menu)
- Stacked cards (no grid)
- Table → horizontal scroll
- Touch-friendly buttons (min 44px)

---

## 12. IMPLEMENTATION ROADMAP

### 12.1 Phase 1: Foundation (Day 1-2)

**Tasks:**

1. **Database Setup**
   - [ ] Create tables (users, employees, branches, etc.)
   - [ ] Run migrations (`npm run db:push`)
   - [ ] Seed initial data (1 superadmin, 1 branch)

2. **Authentication System**
   - [ ] Login API (`POST /api/auth/login`)
   - [ ] Session management (express-session)
   - [ ] Password hashing (bcrypt)
   - [ ] Middleware (requireAuth, requireRole)

3. **Basic UI**
   - [ ] Login page
   - [ ] Layout (sidebar, header)
   - [ ] Role-based routing

**Deliverable:** Working login system (super admin can login)

---

### 12.2 Phase 2: Excel Upload (Day 2-3)

**Tasks:**

1. **Backend**
   - [ ] Upload API (`POST /api/upload`)
   - [ ] Excel parsing (XLSX library)
   - [ ] Validation logic (employee code, hierarchy)
   - [ ] Database insert (employees, users, monthly_performance)

2. **Frontend**
   - [ ] Upload page (download template, upload file)
   - [ ] Preview table (validation results)
   - [ ] Confirm/cancel flow

3. **Testing**
   - [ ] Test 800 rows upload
   - [ ] Test validation errors
   - [ ] Test hierarchy building

**Deliverable:** BrM can upload 800 employees via Excel

---

### 12.3 Phase 3: Staff Onboarding (Day 3-4)

**Tasks:**

1. **Password Strategy**
   - [ ] Auto-create user accounts (password = tgl_lahir)
   - [ ] Force password change (first login)
   - [ ] Security questions setup

2. **Password Reset**
   - [ ] Forgot password flow
   - [ ] Security questions validation
   - [ ] Reset password API

3. **Staff Dashboard**
   - [ ] Personal overview card
   - [ ] View margin, NA, reality score
   - [ ] View subordinates (if manager)

**Deliverable:** Staff can login, change password, view dashboard

---

### 12.4 Phase 4: Audit System (Day 4-5)

**Tasks:**

1. **18 Pilar Form**
   - [ ] Form UI (18 fields, scale 1-5)
   - [ ] Form validation (Zod)
   - [ ] Submit API (`POST /api/audits`)

2. **Score Calculation**
   - [ ] Reality Score (margin / NA)
   - [ ] Zone calculation (success/warning/critical)
   - [ ] Avg Pilar Score
   - [ ] SWOT, ProDem, Julukan generation

3. **Dashboard Updates**
   - [ ] Show audit status (complete/pending)
   - [ ] Show scores & zones
   - [ ] Alert: "Isi 18 Pilar!"

**Deliverable:** Staff can complete monthly audit

---

### 12.5 Phase 5: Dashboard & Reports (Day 5-6)

**Tasks:**

1. **BrM Dashboard**
   - [ ] Branch overview (total staff, margin, completion rate)
   - [ ] Zone distribution chart
   - [ ] Staff list (filterable, paginated)

2. **PDF Export**
   - [ ] Personal report (12 pages, PDFKit)
   - [ ] Branch report (summary)
   - [ ] Download endpoints

3. **Analytics**
   - [ ] Bottom-up aggregation (recursive CTE)
   - [ ] Completion tracking
   - [ ] Zone distribution

**Deliverable:** BrM can view dashboard & export PDF

---

### 12.6 Phase 6: Polish & Testing (Day 6-7)

**Tasks:**

1. **UI Polish**
   - [ ] Dark mode consistency
   - [ ] Loading states
   - [ ] Error messages
   - [ ] Responsive design (mobile)

2. **Testing**
   - [ ] Unit tests (business logic)
   - [ ] Integration tests (API endpoints)
   - [ ] E2E tests (user flows)
   - [ ] Performance tests (800 rows upload)

3. **Documentation**
   - [ ] Update replit.md
   - [ ] API documentation
   - [ ] User guide (PDF)

**Deliverable:** Production-ready MVP

---

### 12.7 Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | 1-2 days | Login system |
| 2. Excel Upload | 1 day | BrM upload 800 employees |
| 3. Staff Onboarding | 1 day | Staff login & dashboard |
| 4. Audit System | 1 day | Staff complete audit |
| 5. Dashboard & Reports | 1 day | BrM dashboard & PDF |
| 6. Polish & Testing | 1 day | Production ready |
| **TOTAL** | **5-7 days** | **MVP Complete** |

---

## 13. TESTING STRATEGY

### 13.1 Unit Tests

**Business Logic Tests:**

```typescript
// test/business-logic.test.ts

describe("Reality Score Calculation", () => {
  it("should calculate correctly", () => {
    const margin = 10000000;
    const na = 5;
    const expected = 2000000;
    
    const result = calculateRealityScore(margin, na);
    
    expect(result).toBe(expected);
  });
  
  it("should handle division by zero", () => {
    const margin = 10000000;
    const na = 0;
    
    const result = calculateRealityScore(margin, na);
    
    expect(result).toBe(0);
  });
});

describe("Zone Classification", () => {
  it("should classify as success (>=4jt)", () => {
    expect(calculateZone(5000000)).toBe("success");
  });
  
  it("should classify as warning (>=2jt, <4jt)", () => {
    expect(calculateZone(3000000)).toBe("warning");
  });
  
  it("should classify as critical (<2jt)", () => {
    expect(calculateZone(1000000)).toBe("critical");
  });
});
```

---

### 13.2 Integration Tests

**API Tests:**

```typescript
// test/api/upload.test.ts

describe("POST /api/upload", () => {
  it("should upload valid Excel file", async () => {
    const file = createTestExcel(800); // 800 valid rows
    
    const res = await request(app)
      .post("/api/upload")
      .attach("file", file)
      .field("period", "2025-01");
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.successRows).toBe(800);
  });
  
  it("should detect validation errors", async () => {
    const file = createTestExcel(800, {
      invalidRows: [
        { row: 45, field: "atasan_code", value: "INVALID" }
      ]
    });
    
    const res = await request(app)
      .post("/api/upload")
      .attach("file", file);
    
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("validation_failed");
    expect(res.body.errors).toHaveLength(1);
  });
  
  it("should reject large files (>10MB)", async () => {
    const file = createLargeExcel(5000); // 5000 rows = ~12MB
    
    const res = await request(app)
      .post("/api/upload")
      .attach("file", file);
    
    expect(res.status).toBe(413); // Payload Too Large
  });
});
```

---

### 13.3 E2E Tests

**User Flow Tests:**

```typescript
// test/e2e/brm-workflow.test.ts

describe("BrM Monthly Workflow", () => {
  it("should complete monthly upload cycle", async () => {
    // 1. BrM login
    await page.goto("/");
    await page.fill('[data-testid="input-username"]', 'brm_axa2');
    await page.fill('[data-testid="input-password"]', 'temp123');
    await page.click('[data-testid="button-login"]');
    
    // 2. Navigate to upload
    await page.click('[data-testid="link-upload"]');
    
    // 3. Download template
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="button-download-template"]')
    ]);
    expect(download.suggestedFilename()).toBe('Template_Upload_Employee.xlsx');
    
    // 4. Upload file
    await page.setInputFiles('[data-testid="input-upload-excel"]', 'test/fixtures/AXA2_Jan2025.xlsx');
    await page.click('[data-testid="button-upload"]');
    
    // 5. Confirm upload
    await page.waitForSelector('[data-testid="preview-table"]');
    await page.click('[data-testid="button-confirm-upload"]');
    
    // 6. Verify success
    await expect(page.locator('[data-testid="text-upload-status"]')).toHaveText('✅ 800 employees uploaded');
  });
});
```

---

### 13.4 Performance Tests

**Load Tests:**

```javascript
// test/performance/upload-load.test.js

import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp-up
    { duration: '3m', target: 10 }, // Steady state
    { duration: '1m', target: 0 },  // Ramp-down
  ],
};

export default function () {
  const file = open('./fixtures/AXA2_800rows.xlsx', 'b');
  
  const res = http.post('http://localhost:5000/api/upload', {
    file: http.file(file, 'AXA2_800rows.xlsx'),
    period: '2025-01'
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'upload time < 60s': (r) => r.timings.duration < 60000,
  });
}
```

**Expected Results:**
- Upload 800 rows: < 60 seconds
- Concurrent uploads (10 BrMs): < 2 minutes each
- Database queries: < 500ms
- Page load: < 2 seconds

---

## 14. FUTURE ENHANCEMENTS (Post-MVP)

### 14.1 BAS API Integration

**Purpose:** Replace manual Excel upload with auto-sync from BAS

**Implementation:**
- Daily cron job: Pull data from BAS API
- Incremental sync (only changed employees)
- Conflict resolution (BAS vs manual changes)

**Timeline:** 2-3 weeks post-MVP

---

### 14.2 PT/Legal Entity Reporting

**Purpose:** Cross-branch aggregation by PT

**Features:**
- Owner dashboard (all 5 PTs)
- CEO dashboard (assigned PTs)
- PT-level performance tracking

**Timeline:** 2 weeks post-MVP

---

### 14.3 CBO/CEO/Owner Roles

**Purpose:** Strategic-level access control

**Features:**
- CBO: Manage multiple branches (5-10)
- CEO: Manage PT (all branches under PT)
- Owner: View all data (read-only)

**Timeline:** 1 week post-MVP

---

### 14.4 Notification System

**Purpose:** Email/SMS alerts for audit reminders

**Features:**
- Daily digest (completion rate)
- Reminder: "Isi 18 Pilar sebelum tanggal X"
- Alert: Critical zone employees

**Timeline:** 1 week post-MVP

---

### 14.5 Advanced Analytics

**Purpose:** Trend analysis, forecasting

**Features:**
- 6-month trend charts (margin, NA, reality score)
- Predictive analytics (zone forecasting)
- Comparative analysis (branch vs branch)

**Timeline:** 2 weeks post-MVP

---

## 15. APPENDIX

### 15.1 18 Pilar Names

```javascript
export const PILAR_NAMES = {
  1: "Keyakinan & Ketaqwaan",
  2: "Kejujuran",
  3: "Tanggung Jawab",
  4: "Kepercayaan",
  5: "Keadilan",
  6: "Kepemimpinan",
  7: "Kerjasama",
  8: "Keseimbangan",
  9: "Ketekunan",
  10: "Kesabaran",
  11: "Keberanian",
  12: "Komitmen",
  13: "Inovasi",
  14: "Visi",
  15: "Komunikasi",
  16: "Adaptasi",
  17: "Empati",
  18: "Integritas"
};
```

---

### 15.2 Position Levels (Hierarchy Order)

```javascript
export const POSITION_LEVELS = {
  "BC": 1,   // Business Consultant (bottom)
  "SBC": 2,  // Senior Business Consultant
  "BsM": 3,  // Business Manager
  "SBM": 4,  // Senior Business Manager
  "EM": 5,   // Equity Manager
  "SEM": 6,  // Senior Equity Manager
  "VBM": 7,  // Vice Branch Manager
  "SVBM": 8, // Senior Vice Branch Manager (top employee)
};
```

---

### 15.3 Security Questions Pool

```javascript
export const SECURITY_QUESTIONS = [
  "Nama ibu kandung?",
  "Kota tempat lahir?",
  "Nama sekolah SD?",
  // Future expansion:
  // "Nama hewan peliharaan pertama?",
  // "Makanan favorit?",
  // "Warna favorit?",
];
```

---

### 15.4 Zone Thresholds

```javascript
export const ZONE_THRESHOLDS = {
  SUCCESS: 4000000,  // >= 4jt
  WARNING: 2000000,  // >= 2jt, < 4jt
  CRITICAL: 0,       // < 2jt
};

export function calculateZone(realityScore: number): string {
  if (realityScore >= ZONE_THRESHOLDS.SUCCESS) return "success";
  if (realityScore >= ZONE_THRESHOLDS.WARNING) return "warning";
  return "critical";
}
```

---

## 📝 DOCUMENT SIGN-OFF

**Author:** Replit Agent  
**Reviewed By:** [User Name]  
**Approved By:** [User Name]  
**Date:** November 13, 2025  

**Status:** ✅ Ready for Implementation

**Next Steps:**
1. User review & approval
2. Begin Phase 1 (Foundation)
3. Daily progress updates

---

**END OF DOCUMENT**
