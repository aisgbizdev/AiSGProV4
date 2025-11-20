# AISG ENTERPRISE - MASTER ARCHITECTURE DOCUMENT

**Version:** 1.0  
**Date:** November 11, 2025  
**Status:** Design Phase - Ready for Implementation  
**Estimated Implementation:** 30 hours | 15-20 checkpoints | $60-100 budget

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Current System Overview (aisg23)](#3-current-system-overview)
4. [New Features Specification](#4-new-features-specification)
5. [Database Architecture](#5-database-architecture)
6. [API Endpoints](#6-api-endpoints)
7. [UI/UX Design](#7-uiux-design)
8. [Security & Data Protection](#8-security--data-protection)
9. [Backup & Recovery](#9-backup--recovery)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Testing & Deployment](#11-testing--deployment)
12. [Appendix](#12-appendix)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Business Problem

**Original Goal:** Audit system untuk meningkatkan kinerja karyawan (from aisg23)

**Enterprise Challenge:** Sistem aisg23 sudah bagus untuk individual/team audit, tapi ada 2 gap critical:

1. **Data Onboarding:** 10,000 karyawan perlu onboarding strategy yang scalable
2. **Strategic Reporting:** Owner/management perlu lihat performance by PT/legal entity (cross-CEO aggregation)

### 1.2 Solution Overview

**AISG Enterprise** = aisg23 + 7 New Features:

1. **BAS API Integration** - Real-time sync employee + margin data
2. **PT/Legal Entity Reporting** - Dual view dashboard (Hierarchy + PT)
3. **Individual Mode** - Personal tracking tanpa team aggregation
4. **Notification System** - Dashboard alerts (daily digest)
5. **Enhanced Security** - Strict access control + password policy
6. **Backup & Recovery** - Daily backup + monthly test
7. **Manual Excel Upload** - Contingency plan (kalau BAS offline)

### 1.3 Key Benefits

✅ **Scalability:** 10k employees onboarding via auto-match registration  
✅ **Strategic Insights:** PT-level performance tracking (compliance & tax reporting)  
✅ **Flexibility:** Individual mode untuk personal growth tracking  
✅ **Reliability:** BAS integration dengan fallback manual upload  
✅ **Security:** Enterprise-grade access control + daily backup  

---

## 2. BUSINESS CONTEXT

### 2.1 Organization Structure

**11-Level Hierarchy:**
```
Owner (1 orang)
├─ CEO (5 orang - 1 per PT atau cross-PT)
│  └─ CBO (Multiple - bisa manage lintas PT)
│     └─ BrM (1 per cabang - tied to 1 cabang)
│        └─ VBM (Cabang-specific)
│           └─ SVBM (Cabang-specific)
│              └─ SEM (Cabang-specific)
│                 └─ EM (Cabang-specific)
│                    └─ SBM (Cabang-specific)
│                       └─ BsM (Cabang-specific)
│                          └─ SBC (Cabang-specific)
│                             └─ BC (Cabang-specific)
```

**Key Rules:**
- Strategic level (Owner/CEO/CBO): Bisa manage lintas PT
- Operational level (BrM → BC): Strict 1 cabang only
- Hierarchy based on `managerId` (bukan PT!)

### 2.2 Legal Entity Structure

**5 Active PTs:**
1. **RFB** - Rifan Financindo Berjangka (14 cabang)
2. **BPF** - Best Profit Futures (12 cabang)
3. **EWF** - Equity World Futures (7 cabang)
4. **KPF** - Kontak Perkasa Futures (6 cabang)
5. **SGB** - Solid Gold Berjangka (3 cabang)

**Total:** 42 cabang, ~10,000 employees

**PT Assignment:**
- CEO assign PT ke cabang (manual, flexible)
- PT cuma metadata (untuk legal/tax reporting)
- PT bukan untuk access control (hierarchy = king!)

### 2.3 Workforce Characteristics

- **High turnover:** 100+ karyawan baru per cabang
- **Commission-based:** Performance tracking critical
- **Email availability:** Anggap ga ada (perlu self-registration)
- **Tech literacy:** Mixed (Owner/CEO gaptek, staff OK)

---

## 3. CURRENT SYSTEM OVERVIEW (aisg23)

### 3.1 Existing Features (KEEP AS-IS)

✅ **18 Pilar Framework** - Self-assessment (1-5 scale per pilar)  
✅ **Reality Score** - Calculated from margin/NA ratio  
✅ **Zone Analysis** - Success (≥4jt), Warning (≥2jt), Critical (<2jt)  
✅ **Employee Profile** - SWOT, ProDem, Action Plan 30-60-90  
✅ **Early Warning System** - Alert untuk zona Critical  
✅ **Magic Section** - Julukan, Zodiak, Generasi  
✅ **Dashboard Analytics** - Charts, trends, KPIs  
✅ **AI Chat Assistant** - OpenAI → Gemini → Internal KB (3-source fallback)  
✅ **PDF Export** - 12 sections + Magic Section  
✅ **Hierarchy Aggregation** - Bottom-up (BC → SBC → ... → CEO → Owner)  

### 3.2 Current Data Model

**Core Tables (Existing):**
- `users` - Login credentials
- `employees` - Employee master (hierarchy via managerId)
- `branches` - 42 cabang
- `monthly_performance` - Margin + NA per employee per month
- `audits` - Quarterly audit data (18 Pilar + aggregated metrics)
- `chatMessages` - AI chat history

### 3.3 Technology Stack (Existing)

**Frontend:** React 18 + TypeScript + Vite  
**Backend:** Node.js + Express.js  
**Database:** PostgreSQL 16 (Neon serverless)  
**ORM:** Drizzle ORM  
**UI:** shadcn/ui (Radix UI) + Tailwind CSS  
**Auth:** express-session + bcrypt  
**AI:** OpenAI API + Google Gemini API  

---

## 4. NEW FEATURES SPECIFICATION

### 4.1 FEATURE 1: BAS API Integration

#### 4.1.1 Overview

**Purpose:** Real-time sync employee + margin data dari BAS (desktop system existing)

**BAS API Endpoint:**
```
http://192.168.10.182:3000/get-margin-info/:tahun/:kuartal/:kode_cabang

Example:
http://192.168.10.182:3000/get-margin-info/2025/1/AB

Response: Excel/CSV/TXT file
```

#### 4.1.2 Data Sync Scope

**FROM BAS (Auto-sync):**
- Employee code ✅
- Nama ✅
- Posisi/Jabatan ✅
- Atasan langsung (employee code) ✅
- Cabang ✅
- Tanggal lahir ✅
- Margin (daily/monthly) ✅
- NA count ✅

**AISG Can Override:**
- Nama (update ke nama KTP)
- Email (user isi sendiri - email pribadi)
- Posisi (super admin promosi/degradasi manual)
- Atasan (super admin fix kalau BAS telat)

#### 4.1.3 Sync Strategy

**Frequency:** Daily (auto-sync, bertahap by cabang)  
**Method:** Pull dari BAS API (AISG call BAS)  
**Conflict Resolution:** BAS is source of truth (AISG read-only, tapi bisa override manual)  
**Hierarchy Building:** Recursive build dari "atasan langsung" (BAS format berantakan, AISG normalize)  

#### 4.1.4 API Contract

**AISG Request:**
```javascript
GET http://192.168.10.182:3000/get-margin-info/2025/1/AB
```

**BAS Response (Excel format):**
```
Columns:
- tahun (2025)
- kuartal (1)
- kode_cabang (AB)
- kode_karyawan (EMP001)
- nama (Andi Wijaya)
- jabatan (BC)
- kode_atasan (EMP050 - SBC)
- margin (1000000)
- na (5)
- tanggal_lahir (1990-03-15)
```

**AISG Processing:**
1. Parse Excel/CSV
2. Validate employee code (duplicate check)
3. Build hierarchy (recursive dari kode_atasan)
4. Insert/update employees table
5. Insert/update monthly_performance table
6. Log sync status (timestamp, records count, errors)

#### 4.1.5 Error Handling

**Scenarios:**
- BAS API down → Use manual Excel upload (Feature 7)
- Invalid data → Log error, skip record, notify admin
- Hierarchy broken → Flag for manual review
- Duplicate employee code → Override with latest data

---

### 4.2 FEATURE 2: PT/Legal Entity Reporting

#### 4.2.1 Overview

**Purpose:** Dual reporting system - View performance by Hierarchy (operational) OR by PT (legal/strategic)

**Access:** Owner, Super Admin, Superadmin1/2/3 (full access) | CEO (filtered by PT mereka manage)

#### 4.2.2 PT Dashboard (Main View)

**Layout:**
```
╔══════════════════════════════════════════════════════════╗
║  PT/Legal Entity View - Q1 2025                          ║
╠══════════════════════════════════════════════════════════╣
║  [Period Selector: Q1 2025 ▼]  [Export All PDF]         ║
║                                                          ║
║  📊 Company Total:                                       ║
║  • Total Margin: $134M                                   ║
║  • Total Staff: 1,450 orang                              ║
║  • Total Cabang: 42                                      ║
║  • Active PTs: 5                                         ║
╠══════════════════════════════════════════════════════════╣
║  PT Cards (5):                                           ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ RFB (Rifan Financindo Berjangka)      36.8%       │  ║
║  │ ████████████████████████████████████ $50M         │  ║
║  │ 14 cabang • 500 staff • 🟩 Success                │  ║
║  │ [View Detail →]                                   │  ║
║  └────────────────────────────────────────────────────┘  ║
║  ... (BPF, EWF, KPF, SGB cards)                          ║
╚══════════════════════════════════════════════════════════╝
```

**Metrics per PT:**
- Total margin (sum across all cabang)
- Total staff count
- Total cabang count
- Total new accounts
- Zona (Success/Warning/Critical based on avg reality score)
- % contribution to company total
- Trend chart (Q1-Q4, YoY)

#### 4.2.3 PT Detail Page

**URL:** `/reports/pt/:ptCode?period=2025-Q1`

**Layout:**
```
╔══════════════════════════════════════════════════════════╗
║  RFB (Rifan Financindo Berjangka) - Q1 2025             ║
╠══════════════════════════════════════════════════════════╣
║  Summary:                                                ║
║  • Total Margin: $50M                                    ║
║  • Total Staff: 500 orang                                ║
║  • Total Cabang: 14                                      ║
║  • Zona: Success 🟩                                      ║
║                                                          ║
║  [Export PDF] [Export Excel] [Sync from BAS]            ║
╠══════════════════════════════════════════════════════════╣
║  📈 Trend Charts:                                        ║
║  - Margin trend (Q1'24 → Q1'25)                         ║
║  - Staff count trend                                     ║
║  - New account trend                                     ║
║  - YoY comparison (% growth)                             ║
╠══════════════════════════════════════════════════════════╣
║  🏢 Breakdown by Cabang:                                 ║
║  [Sort: Margin ▼] [Filter: Zona ▼] [Search: ___]       ║
║  ┌───────┬─────┬─────┬──────┬────────┬─────┬──────┐    ║
║  │Cabang │ BrM │ CEO │Staff │ Margin │ NA  │ Zona │    ║
║  ├───────┼─────┼─────┼──────┼────────┼─────┼──────┤    ║
║  │ AXA 2 │Andi │Budi │ 60   │ $13.7M │ 376 │ 🟩   │    ║
║  │ AXA 3 │Budi │Andi │ 50   │ $6.4M  │ 66  │ 🟩   │    ║
║  │ ... (14 cabang total)                              │    ║
║  └───────┴─────┴─────┴──────┴────────┴─────┴──────┘    ║
║                                                          ║
║  [Click cabang → Drill-down ke detail karyawan]         ║
╚══════════════════════════════════════════════════════════╝
```

**Features:**
- Sorting (by margin, staff, zona)
- Filtering (by zona, by CEO)
- Search (by cabang name)
- Drill-down (click cabang → lihat all employees)
- Export PDF/Excel

#### 4.2.4 Historical Data Tracking

**Snapshot Strategy:**
- Auto-save daily (incremental snapshot)
- Keep forever (notifikasi 5 tahun sekali untuk cleanup)
- Store in separate `pt_snapshots` table

**Queries:**
- Quarterly trend (Q1 2024 → Q1 2025)
- YoY comparison (2024 total vs 2025 total)
- % growth calculation (auto-display)
- Custom date range

#### 4.2.5 Permission Matrix

| Role | PT View Access | Scope |
|------|----------------|-------|
| Owner | ✅ Full | All PTs |
| Super Admin | ✅ Full | All PTs |
| Superadmin1/2/3 | ✅ Full | All PTs |
| CEO | ✅ Filtered | PT yang dia manage aja |
| CBO/BrM/Staff | ❌ No Access | Hierarchy view only |

---

### 4.3 FEATURE 3: Individual Mode

#### 4.3.1 Overview

**Purpose:** Personal tracking untuk lihat perkembangan tiap hari (tanpa team aggregation)

**Use Case:**
- BC baru (fresh graduate) - belum punya team
- Karyawan mau tracking personal growth
- Practice audit sebelum real quarterly audit

#### 4.3.2 Individual vs Enterprise Mode

**Individual Mode:**
- Input data: Manual margin/NA ATAU auto dari BAS
- Self-assessment: 18 Pilar (wajib isi)
- Output: Reality Score, Zone, Profile, PDF (pribadi)
- **GA masuk hierarchy aggregation** (ga ngaruh atasan)
- Data pribadi (ga di-share)

**Enterprise Mode:**
- Input data: Auto dari BAS (priority)
- Self-assessment: 18 Pilar (wajib isi)
- Output: Reality Score + Team aggregation
- **Masuk hierarchy aggregation** (bottom-up ke atasan)
- Data visible ke atasan (cascade up)

#### 4.3.3 Mode Switching

**Trigger:** Auto-detect (kalau punya subordinate → auto switch Enterprise)

**Example:**
```
BC (Individual) → Input margin 10jt, NA 5
→ Self-assessment 18 Pilar
→ Reality Score: 2jt (10jt / 5)
→ Zona: Warning
→ PDF export (personal)
→ Atasan GA LIHAT (private)

BC dipromosi jadi SBC (punya 2 BC bawahan):
→ Auto-switch ke Enterprise mode ✅
→ Team aggregation dimulai:
   - Personal: 5jt margin
   - Team: 10jt + 15jt (dari 2 BC)
   - Total: 30jt
→ Atasan LIHAT (cascade)
```

**Historical Data:**
- Data Individual tetep disimpan (untuk tracking growth)
- Data Enterprise dimulai fresh (new audit cycle)

#### 4.3.4 UI Flow

**Toggle Switch:**
```
Dashboard Header:
[Individual Mode 🔘] [Enterprise Mode ⚪]

Individual Mode UI:
- Input form: Margin, NA (manual/auto)
- 18 Pilar assessment
- Reality Score display (personal only)
- PDF export button
- No "Team" section

Enterprise Mode UI:
- Auto-sync dari BAS (margin, NA)
- 18 Pilar assessment
- Reality Score: Personal + Team (separated)
- Subordinate list (drill-down)
- PDF export (include team data)
```

---

### 4.4 FEATURE 4: Notification System

#### 4.4.1 Overview

**Purpose:** In-app notifications (dashboard bell icon) untuk critical events

**Channel:** Dashboard only (NO email, NO WhatsApp - avoid costs)  
**Frequency:** Daily digest (kumpulin notifikasi, kirim 1x per hari)  
**User Preference:** Wajib (ga bisa dimatiin)  

#### 4.4.2 Notification Triggers

**1. Karyawan Baru Register:**
```
Trigger: Employee submit self-registration
Recipients: Atasan langsung (BrM/CBO)
Message: "Andi Wijaya (BC - Cabang AXA2) mendaftar. Review & approve?"
Action: [Approve] [Reject] buttons
```

**2. Audit Deadline Reminder:**
```
Trigger: 7 hari sebelum end of month
Recipients: All employees (yang belum submit audit)
Message: "Reminder: Monthly audit deadline 7 hari lagi (30 Nov 2025)"
Action: [Mulai Audit] button
```

**3. Performance Alert (Critical Zone):**
```
Trigger: Reality Score < 2jt (Critical zone)
Recipients: Employee + Atasan langsung
Message: "⚠️ Performance Alert: Reality Score 1.8jt (Critical). Butuh action plan?"
Action: [Lihat Detail] button
```

#### 4.4.3 UI Design

**Bell Icon (Header):**
```
🔔 (3) ← Badge count (unread notifications)

Click bell → Dropdown:
┌───────────────────────────────────────┐
│ Notifications (3 unread)              │
├───────────────────────────────────────┤
│ 🆕 Andi Wijaya mendaftar              │
│    Cabang AXA2 - BC                   │
│    [Approve] [Reject]                 │
│    2 hours ago                        │
├───────────────────────────────────────┤
│ ⏰ Audit deadline 7 hari lagi         │
│    Monthly audit Nov 2025             │
│    [Mulai Audit]                      │
│    5 hours ago                        │
├───────────────────────────────────────┤
│ ⚠️ Budi - Performance Critical        │
│    Reality Score: 1.8jt               │
│    [Lihat Detail]                     │
│    1 day ago                          │
├───────────────────────────────────────┤
│ [Mark All as Read] [View All]        │
└───────────────────────────────────────┘
```

#### 4.4.4 Notification Table Schema

```typescript
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'registration', 'deadline', 'alert'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"), // Link untuk action button
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### 4.5 FEATURE 5: Enhanced Security

#### 4.5.1 Access Control Rules

**Hierarchy-Based Access:**
```
Rule: Atas lihat bawah (all levels), bawah GA BISA lihat atas

CEO login:
├─ Lihat: All subordinates (CBO, BrM, VBM, ..., BC)
├─ Lihat: 18 Pilar assessment subordinates (read-only)
├─ Edit: Promosi/degradasi subordinates (posisi)
└─ NO ACCESS: Data CEO lain (isolation)

BrM login:
├─ Lihat: Staff cabang only (VBM → BC)
├─ Lihat: 18 Pilar assessment staff
├─ Edit: Manual margin/NA input (override BAS)
└─ NO ACCESS: Cabang lain, CEO, CBO

BC login:
├─ Lihat: Diri sendiri only
├─ Edit: 18 Pilar assessment (self)
├─ Edit: Individual mode data
└─ NO ACCESS: Atasan data, peers data
```

**PT View Access:**
```
Owner/Super Admin/Superadmin1/2/3:
├─ Lihat: All PTs (full access)
├─ Edit: PT assignment ke cabang
└─ Export: PDF/Excel all PTs

CEO:
├─ Lihat: PT yang dia manage only
├─ NO EDIT: PT assignment
└─ Export: PDF/Excel PT mereka aja
```

#### 4.5.2 Password Policy

**Requirements:**
- Minimal 8 karakter
- Wajib: Huruf besar, kecil, angka
- Opsional: Simbol
- NO common passwords (123456, password, dll)

**Validation:**
```javascript
const passwordSchema = z.string()
  .min(8, "Minimal 8 karakter")
  .regex(/[a-z]/, "Harus ada huruf kecil")
  .regex(/[A-Z]/, "Harus ada huruf besar")
  .regex(/[0-9]/, "Harus ada angka");
```

#### 4.5.3 Session Management

**Strategy:**
- Auto-logout: 1 hari (24 jam idle)
- NO "remember me" option (security priority)
- Session storage: MemoryStore (in-memory, reset on server restart)

**Session Schema:**
```javascript
session: {
  userId: string,
  employeeId: string,
  role: string,
  positionLevel: string,
  lastActivity: timestamp,
  expiresAt: timestamp (24h from login),
}
```

#### 4.5.4 Data Privacy - 18 Pilar

**Visibility Rules:**
```
Employee fills 18 Pilar (self-assessment):
├─ Employee: Full access (view + edit)
├─ Atasan langsung: Read-only
├─ Atasan atasan: Read-only (cascade)
├─ Peers: NO ACCESS
└─ Bawahan: NO ACCESS

Example:
BC isi 18 Pilar → SBC lihat (read-only) → BsM lihat (cascade)
BC isi 18 Pilar → BC peers GA LIHAT
```

---

### 4.6 FEATURE 6: Backup & Recovery

#### 4.6.1 Backup Strategy

**Frequency:** Daily (auto-backup setiap midnight)  
**Scope:** Incremental (data yang berubah aja)  
**Retention:** Last 7 backups (auto-delete yang lebih lama)  
**Storage:** Separate backup folder/database  

**Backup Script:**
```bash
#!/bin/bash
# Daily backup script (cron job)

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/aisg_enterprise"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Incremental backup (last 24 hours changes)
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --inserts --data-only \
  --table=employees \
  --table=audits \
  --table=monthly_performance \
  --table=notifications \
  > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep last 7 backups only
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup completed: $BACKUP_FILE.gz"
```

#### 4.6.2 Recovery Plan

**Disaster Scenarios:**
1. Database corrupt
2. Data loss (accidental delete)
3. Server crash

**Recovery Steps:**
```bash
# 1. Stop application
pm2 stop aisg-enterprise

# 2. Restore from latest backup
LATEST_BACKUP=$(ls -t /backups/aisg_enterprise/backup_*.sql.gz | head -1)
gunzip -c $LATEST_BACKUP | psql -h $PGHOST -U $PGUSER -d $PGDATABASE

# 3. Verify data integrity
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT COUNT(*) FROM employees;"

# 4. Restart application
pm2 start aisg-enterprise

echo "Recovery completed from $LATEST_BACKUP"
```

**Who Can Trigger Restore:** Super Admin only

#### 4.6.3 Backup Testing

**Monthly Test Plan:**
```
Day 1 of every month:
1. Trigger manual backup
2. Restore to TEST database (not production)
3. Verify data completeness:
   - Employee count match?
   - Audit data intact?
   - Performance data correct?
4. Document test results
5. Fix any issues found
```

**Test Checklist:**
- [ ] Backup file created successfully
- [ ] Restore completed without errors
- [ ] Employee count: Expected vs Actual
- [ ] Audit data: Sample check (5 random audits)
- [ ] Performance data: Margin totals match
- [ ] Notifications: Recent 10 match
- [ ] Test database cleanup

---

### 4.7 FEATURE 7: Manual Excel Upload

#### 4.7.1 Overview

**Purpose:** Contingency plan kalau BAS API down/offline

**Upload Scope:**
- Employee master (code, nama, posisi, atasan, cabang)
- Monthly performance (margin, NA)
- Quarterly data (untuk audit)

**Format:** Excel file (same format dari BAS API)

#### 4.7.2 Upload Permissions

**Who Can Upload:**
- **Super Admin:** All cabang (upload 42 cabang sekaligus)
- **BrM:** Cabang sendiri only (upload 1 cabang)
- **CBO:** Cabang yang dia manage only (upload multiple cabang)

**Validation:**
- Check duplicate employee code
- Validate hierarchy (atasan harus exist)
- Validate cabang (harus exist di master)
- Show preview before confirm

#### 4.7.3 UI Flow

**Upload Page:** `/admin/upload-excel`

```
╔══════════════════════════════════════════════════════════╗
║  Manual Excel Upload - Contingency Plan                 ║
╠══════════════════════════════════════════════════════════╣
║  ⚠️ Upload manual hanya untuk backup kalau BAS offline   ║
║  Data dari BAS API akan override data manual!           ║
╠══════════════════════════════════════════════════════════╣
║  Step 1: Select Cabang (BrM: cabang sendiri only)       ║
║  [Cabang: AXA 2 ▼]                                      ║
║                                                          ║
║  Step 2: Upload Excel File                              ║
║  [Choose File] backup_AXA2_2025Q1.xlsx                  ║
║  [Upload & Preview]                                     ║
╠══════════════════════════════════════════════════════════╣
║  Step 3: Preview Data (Before Confirm)                  ║
║  ┌──────────┬─────────┬────────┬─────────┬────────┐    ║
║  │ Emp Code │ Nama    │ Posisi │ Atasan  │ Margin │    ║
║  ├──────────┼─────────┼────────┼─────────┼────────┤    ║
║  │ EMP001   │ Andi    │ BC     │ EMP050  │ 10jt   │    ║
║  │ EMP002   │ Budi    │ SBC    │ EMP100  │ 15jt   │    ║
║  │ ... (50 rows)                                    │    ║
║  └──────────┴─────────┴────────┴─────────┴────────┘    ║
║                                                          ║
║  ✅ Validation Results:                                 ║
║  • 50 rows valid                                        ║
║  • 0 errors                                             ║
║  • 2 warnings: EMP003 (atasan not found - will skip)   ║
║                                                          ║
║  [Confirm Upload] [Cancel]                              ║
╚══════════════════════════════════════════════════════════╝
```

#### 4.7.4 Data Source Indicator

**Icon Badges:**
- 🔄 **BAS API** (auto-sync, real-time)
- 📤 **Manual Upload** (uploaded by admin, temporary)

**Display Locations:**
- Employee list table (column: Data Source)
- Dashboard cards (tooltip)
- PT report (footer note)

**Auto-Override:**
```
Manual upload → Icon: 📤 "Manual Upload"
BAS API sync (next day) → Icon: 🔄 "BAS API"
Data automatically replaced ✅
```

---

## 5. DATABASE ARCHITECTURE

### 5.1 New Tables

#### 5.1.1 `pts` Table (PT Master)

```typescript
export const pts = pgTable("pts", {
  id: varchar("id").primaryKey(),
  code: varchar("code", { length: 10 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  fullLegalName: varchar("full_legal_name", { length: 200 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Seed Data
const PT_SEED = [
  { code: 'RFB', name: 'Rifan Financindo Berjangka' },
  { code: 'BPF', name: 'Best Profit Futures' },
  { code: 'EWF', name: 'Equity World Futures' },
  { code: 'KPF', name: 'Kontak Perkasa Futures' },
  { code: 'SGB', name: 'Solid Gold Berjangka' },
];
```

#### 5.1.2 `notifications` Table

```typescript
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### 5.1.3 `pt_snapshots` Table (Historical Data)

```typescript
export const ptSnapshots = pgTable("pt_snapshots", {
  id: varchar("id").primaryKey(),
  ptId: varchar("pt_id").references(() => pts.id),
  period: varchar("period").notNull(), // '2025-Q1'
  snapshotDate: timestamp("snapshot_date").notNull(),
  totalMargin: decimal("total_margin", { precision: 15, scale: 2 }),
  totalNA: integer("total_na"),
  totalStaff: integer("total_staff"),
  totalBranches: integer("total_branches"),
  totalNewAccounts: integer("total_new_accounts"),
  zoneDistribution: jsonb("zone_distribution"), // { success: 10, warning: 3, critical: 1 }
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### 5.1.4 `data_sources` Table (Track Upload Source)

```typescript
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => employees.id),
  source: varchar("source").notNull(), // 'bas_api' | 'manual_upload'
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull(),
  metadata: jsonb("metadata"), // { fileName, rowCount, etc }
});
```

### 5.2 Schema Updates (Existing Tables)

#### 5.2.1 `branches` Table - Add PT Reference

```typescript
export const branches = pgTable("branches", {
  // ... existing fields
  ptId: varchar("pt_id").notNull().references(() => pts.id), // NEW
});

// Migration:
// ALTER TABLE branches ADD COLUMN pt_id VARCHAR REFERENCES pts(id);
```

#### 5.2.2 `users` Table - Add New Roles

```typescript
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "superadmin1", // NEW
  "superadmin2", // NEW
  "superadmin3", // NEW
  "owner",
  "employee",
]);
```

#### 5.2.3 `employees` Table - Add Workspace Type

```typescript
export const employees = pgTable("employees", {
  // ... existing fields
  workspaceType: varchar("workspace_type").default("enterprise"), // NEW
  // 'individual' | 'enterprise'
});
```

### 5.3 Entity Relationship Diagram (ERD)

```
┌─────────┐
│   pts   │
└────┬────┘
     │
     │ 1:N
     │
┌────▼────────┐
│  branches   │
└────┬────────┘
     │
     │ 1:N
     │
┌────▼─────────┐      ┌──────────────┐
│  employees   │◄─────┤ data_sources │
└────┬─────────┘  1:N └──────────────┘
     │
     ├─ 1:N ─► monthly_performance
     ├─ 1:N ─► audits
     ├─ 1:1 ─► users ──► notifications (1:N)
     └─ Self-reference (managerId) → Hierarchy tree

┌─────────────┐
│pt_snapshots │
└─────────────┘
     │
     └─ N:1 ─► pts
```

---

## 6. API ENDPOINTS

### 6.1 Authentication Endpoints (Enhanced)

```typescript
// Existing (Keep)
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user

// New: Self-Registration with Auto-Match
POST   /api/auth/register-employee
Body: {
  name: string,
  email: string,
  password: string,
  branchId: string,
  birthDate: string, // For auto-match
}
Response: {
  status: 'approved' | 'pending',
  matchedEmployeeId?: string,
}

// New: Security Questions
POST   /api/auth/security-questions
Body: {
  userId: string,
  questions: [
    { question: string, answer: string },
  ]
}

POST   /api/auth/reset-password-verify
Body: {
  email: string,
  answers: [{ question: string, answer: string }],
  newPassword: string,
}
```

### 6.2 BAS Integration Endpoints

```typescript
// Sync from BAS API
POST   /api/bas/sync
Body: {
  year: number,
  quarter: number,
  branchCode: string, // 'AB' or 'ALL'
}
Response: {
  syncedEmployees: number,
  syncedPerformance: number,
  errors: string[],
  timestamp: string,
}

// Manual trigger sync (Super Admin only)
POST   /api/bas/sync-all
Body: {
  year: number,
  quarter: number,
}
```

### 6.3 PT Reporting Endpoints

```typescript
// PT Summary (All PTs)
GET    /api/reports/pt/summary?period=2025-Q1
Response: {
  companyTotal: {
    margin: number,
    staff: number,
    branches: number,
  },
  pts: [
    {
      code: string,
      name: string,
      totalMargin: number,
      totalStaff: number,
      totalBranches: number,
      zone: 'success' | 'warning' | 'critical',
      percentageContribution: number,
    }
  ]
}

// PT Detail (Single PT)
GET    /api/reports/pt/:ptCode?period=2025-Q1
Response: {
  pt: { code, name, ... },
  summary: { totalMargin, totalStaff, ... },
  branches: [
    {
      code: string,
      name: string,
      brmName: string,
      ceoName: string,
      staffCount: number,
      margin: number,
      na: number,
      zone: string,
    }
  ],
  trend: [
    { period: '2024-Q1', margin: number },
    { period: '2024-Q2', margin: number },
    ...
  ]
}

// PT Historical Trend
GET    /api/reports/pt/:ptCode/trend?periods=2024-Q1,2024-Q2,...

// PT Export PDF
GET    /api/reports/pt/:ptCode/export-pdf?period=2025-Q1

// PT Export Excel
GET    /api/reports/pt/:ptCode/export-excel?period=2025-Q1
```

### 6.4 Individual Mode Endpoints

```typescript
// Switch mode
PATCH  /api/employees/:employeeId/workspace-type
Body: { workspaceType: 'individual' | 'enterprise' }

// Individual audit (no team aggregation)
POST   /api/audits/individual
Body: {
  employeeId: string,
  period: string,
  marginPersonal: number,
  naPersonal: number,
  pilarScores: { [key: string]: number },
}
```

### 6.5 Notification Endpoints

```typescript
// Get notifications
GET    /api/notifications?userId=xxx&limit=20

// Mark as read
PATCH  /api/notifications/:notificationId/read

// Mark all as read
POST   /api/notifications/mark-all-read
```

### 6.6 Manual Upload Endpoints

```typescript
// Upload Excel
POST   /api/upload/excel
Body: FormData {
  file: File,
  branchId: string,
}
Response: {
  preview: [
    { employeeCode, name, position, ... }
  ],
  validation: {
    valid: number,
    errors: string[],
    warnings: string[],
  }
}

// Confirm upload
POST   /api/upload/confirm
Body: {
  uploadId: string,
  branchId: string,
}
```

---

## 7. UI/UX DESIGN

### 7.1 Navigation Structure

```
╔════════════════════════════════════════════════════════╗
║  AISG Enterprise                      🔔(3)  Admin ▼  ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  [Dashboard] [Reports] [Audit] [Chat AI] [Settings]  ║
║                                                        ║
║  For Owner/Super Admin:                                ║
║  Reports dropdown:                                     ║
║    ├─ Business Hierarchy (existing)                   ║
║    └─ PT/Legal Entity (NEW!)                          ║
║                                                        ║
║  For CEO/CBO/BrM:                                      ║
║    Only: Business Hierarchy                           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### 7.2 Registration Flow (Auto-Match)

```
┌─────────────────────────────────────┐
│ REGISTER - AISG Enterprise          │
├─────────────────────────────────────┤
│ Nama Lengkap: [____________]        │
│ Email Pribadi: [___________]        │
│ Password: [********]                │
│ Konfirmasi Password: [********]     │
│ Cabang: [AXA 2 (Jakarta) ▼]        │
│ Tanggal Lahir: [15/03/1990]        │
│                                     │
│ Security Questions (Opsional):      │
│ Q1: Nama ibu kandung?               │
│ A1: [____________]                  │
│                                     │
│ [Register] [Sudah punya akun?]     │
└─────────────────────────────────────┘

System: Auto-match dengan BAS
├─ Match found (90% cases) → Auto-approve ✅
│  "Selamat! Akun Anda berhasil dibuat"
│
└─ Not found / Multiple matches (10%)
   "Registrasi Anda sedang di-review oleh admin"
   → Pending approval page
```

### 7.3 Dashboard (Dual Mode Toggle)

**For Owner/Super Admin:**
```
╔════════════════════════════════════════════════════════╗
║  Dashboard                                             ║
╠════════════════════════════════════════════════════════╣
║  View Mode:                                            ║
║  ○ Business Hierarchy  ● PT/Legal Entity              ║
╠════════════════════════════════════════════════════════╣
║  (Show PT Dashboard - Feature 2.2 layout)              ║
╚════════════════════════════════════════════════════════╝
```

**For Employee (Individual Mode):**
```
╔════════════════════════════════════════════════════════╗
║  My Dashboard                                          ║
╠════════════════════════════════════════════════════════╣
║  Workspace: [Individual Mode 🔘] [Enterprise ⚪]       ║
╠════════════════════════════════════════════════════════╣
║  Personal Performance (Monthly):                       ║
║  • Margin: 10jt                                        ║
║  • NA: 5                                               ║
║  • Reality Score: 2jt                                  ║
║  • Zona: 🟨 Warning                                    ║
║                                                        ║
║  [Input Data Manual] [Isi 18 Pilar] [Export PDF]     ║
╚════════════════════════════════════════════════════════╝
```

### 7.4 Notification Bell

```
Header: 🔔 (3) ← Badge

Click → Dropdown:
┌───────────────────────────────────────┐
│ 🆕 Andi Wijaya mendaftar              │
│    [Approve] [Reject]                 │
├───────────────────────────────────────┤
│ ⏰ Audit deadline 7 hari lagi         │
│    [Mulai Audit]                      │
├───────────────────────────────────────┤
│ ⚠️ Budi - Critical Zone               │
│    [Lihat Detail]                     │
├───────────────────────────────────────┤
│ [View All Notifications]              │
└───────────────────────────────────────┘
```

---

## 8. SECURITY & DATA PROTECTION

### 8.1 Authentication Security

**Password Hashing:** bcrypt (salt rounds: 10)  
**Session Storage:** MemoryStore (HttpOnly cookies)  
**CSRF Protection:** Enabled (express-session)  
**SQL Injection:** Prevented (Drizzle ORM parameterized queries)  

### 8.2 Access Control Implementation

```typescript
// Middleware: Check subordinate access
async function canAccessEmployee(currentUserId, targetEmployeeId) {
  const current = await getEmployeeByUserId(currentUserId);
  const subordinates = await getSubordinateTree(current.id);
  
  return subordinates.some(sub => sub.id === targetEmployeeId);
}

// Middleware: Check PT access
async function canAccessPT(currentUser, ptCode) {
  if (['super_admin', 'owner', 'superadmin1', 'superadmin2', 'superadmin3']
      .includes(currentUser.role)) {
    return true; // Full access
  }
  
  if (currentUser.role === 'employee' 
      && currentUser.positionLevel === 'CEO') {
    // CEO: Check if they manage any branch in this PT
    const managedBranches = await getBranchesManagedByCEO(currentUser.employeeId);
    return managedBranches.some(b => b.ptId === ptCode);
  }
  
  return false; // No access
}
```

### 8.3 Data Encryption

**In Transit:** HTTPS (TLS 1.2+)  
**At Rest:** PostgreSQL encryption (Neon built-in)  
**Sensitive Fields:** Password (bcrypt), Security answers (bcrypt)  

### 8.4 Audit Logging

```typescript
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id"),
  action: varchar("action"), // 'login', 'upload', 'edit_employee', etc
  resource: varchar("resource"), // 'employee:EMP001', 'pt:RFB'
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 9. BACKUP & RECOVERY

### 9.1 Backup Schedule

**Daily Backup (Automated):**
- Time: 00:00 (midnight)
- Type: Incremental (last 24h changes)
- Tables: employees, audits, monthly_performance, notifications
- Retention: 7 days (auto-delete older)

**Backup Command:**
```bash
# Cron job: 0 0 * * * /scripts/backup.sh
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE \
  --inserts --data-only \
  --table=employees \
  --table=audits \
  --table=monthly_performance \
  --table=notifications \
  > /backups/backup_$(date +%Y%m%d).sql
```

### 9.2 Recovery Procedure

**Manual Restore (Super Admin only):**
```bash
# Stop app
pm2 stop aisg-enterprise

# Restore latest backup
gunzip -c /backups/backup_latest.sql.gz | psql -h $PGHOST -U $PGUSER -d $PGDATABASE

# Verify
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT COUNT(*) FROM employees;"

# Restart
pm2 start aisg-enterprise
```

### 9.3 Monthly Testing

**Test Plan (1st day of month):**
1. Create test database
2. Restore latest backup to test DB
3. Run verification queries:
   ```sql
   SELECT COUNT(*) FROM employees;
   SELECT COUNT(*) FROM audits WHERE period = '2025-Q1';
   SELECT SUM(margin) FROM monthly_performance WHERE month = '2025-01';
   ```
4. Document results
5. Drop test database

---

## 10. IMPLEMENTATION ROADMAP

### 10.1 Phase Breakdown

**PHASE 1: Foundation (8 hours | 3-4 checkpoints | $15-20)**
```
Tasks:
1. Database schema updates
   - Create pts table (seed 5 PTs)
   - Add ptId to branches table
   - Create notifications table
   - Add user roles (superadmin1/2/3)
   - Create pt_snapshots table
   - Create data_sources table

2. BAS API integration - Backend only
   - Sync service (call BAS API)
   - Parse Excel/CSV response
   - Insert/update employees + performance
   - Error handling & logging
   - Daily cron job setup

3. Security enhancements
   - Password policy validation
   - Session timeout (24h)
   - Access control middleware

Deliverables:
✅ Database ready
✅ BAS sync working (backend)
✅ Security hardened
```

**PHASE 2: PT Reporting (10 hours | 4-5 checkpoints | $20-25)**
```
Tasks:
1. PT aggregation queries
   - PT summary query (all PTs)
   - PT detail query (breakdown by cabang)
   - Historical trend queries
   - Permission checks (CEO filtered access)

2. PT Dashboard UI
   - PT summary page (5 PT cards)
   - PT detail page (breakdown table)
   - Charts (trend line, pie chart)
   - Sorting/filtering/search
   - Export PDF/Excel

3. Dual view navigation
   - Tab switching (Hierarchy ↔ PT)
   - Permission-based routing

Deliverables:
✅ PT reporting API working
✅ PT dashboard UI complete
✅ Export functionality
```

**PHASE 3: Individual Mode + Notifications (6 hours | 2-3 checkpoints | $10-15)**
```
Tasks:
1. Individual mode
   - Workspace type toggle
   - Individual audit API (no team aggregation)
   - Manual data input form
   - Auto-switch to Enterprise (if has subordinates)

2. Notification system
   - Notification API (create, read, mark read)
   - Dashboard bell icon UI
   - Notification dropdown
   - Daily digest cron job
   - Trigger events (registration, deadline, alert)

Deliverables:
✅ Individual mode working
✅ Notifications functional
```

**PHASE 4: Manual Upload + Polish (6 hours | 2-3 checkpoints | $10-15)**
```
Tasks:
1. Manual Excel upload
   - Upload API (parse, validate, preview)
   - Upload UI (file input, preview table)
   - Confirm upload
   - Data source indicator (icons)

2. Auto-match registration
   - Registration API (fuzzy match)
   - Pending approval queue
   - Admin approval UI

3. Testing & bug fixes
   - Integration testing
   - Permission testing
   - Performance testing (10k employees)
   - Bug fixes

4. Documentation
   - User manual (Bahasa Indonesia)
   - Admin guide
   - API documentation

Deliverables:
✅ Manual upload working
✅ Auto-match registration
✅ All features tested
✅ Documentation complete
```

### 10.2 Timeline Estimate

**Conservative:** 4 weeks (30 hours total)  
**Optimistic:** 3 weeks (25 hours total)  
**Realistic:** 3.5 weeks (~28 hours total)  

**Weekly Breakdown:**
```
Week 1: Phase 1 (Foundation) - 8 hours
Week 2: Phase 2 (PT Reporting) - 10 hours
Week 3: Phase 3 (Individual + Notifications) - 6 hours
Week 4: Phase 4 (Upload + Polish) - 6 hours
```

### 10.3 Budget Estimate

**Total Cost:** $60-100 (15-20 checkpoints)

**Breakdown by Phase:**
- Phase 1: $15-20
- Phase 2: $20-25
- Phase 3: $10-15
- Phase 4: $10-15

**Monthly Subscription (Core):** $25/month  
**Estimated Duration:** 3-4 months (if monthly credits only)  
**Total Subscription Cost:** $75-100

**Alternative:** Pay-as-you-go (buy credits on-demand)

---

## 11. TESTING & DEPLOYMENT

### 11.1 Testing Strategy

**Unit Testing:**
- BAS API sync logic
- PT aggregation queries
- Auto-match algorithm
- Password validation
- Access control middleware

**Integration Testing:**
- BAS API → Database sync
- PT report generation
- Notification triggers
- Manual upload flow
- Registration → Auto-match → Approval

**Performance Testing:**
- 10k employees query speed
- PT aggregation (cross-CEO) performance
- Dashboard load time
- Concurrent users (100+)

**User Acceptance Testing (UAT):**
- Super Admin: Create Owner, CEO
- Owner: View PT reports, export PDF
- CEO: Filtered PT view
- BrM: Upload Excel manual
- Employee: Self-register, auto-match
- Individual mode: Personal tracking

### 11.2 Deployment Plan

**Environment:** Internal server (same network dengan BAS)

**Deployment Steps:**
```bash
# 1. Database migration
npm run db:push --force

# 2. Seed data (5 PTs)
npm run seed:pts

# 3. Assign PT to 42 branches (manual via UI)
# Super Admin login → Master Data → Branches → Assign PT

# 4. BAS sync (initial load)
curl -X POST http://localhost:3000/api/bas/sync-all \
  -H "Authorization: Bearer <admin_token>" \
  -d '{ "year": 2025, "quarter": 1 }'

# 5. Setup cron jobs
# Daily backup: 0 0 * * * /scripts/backup.sh
# Daily BAS sync: 0 1 * * * /scripts/sync-bas.sh
# Notification digest: 0 9 * * * /scripts/send-notifications.sh

# 6. Start app
pm2 start ecosystem.config.js --env production
pm2 save

# 7. Monitor
pm2 logs
pm2 monit
```

**Health Check:**
```bash
# App running?
curl http://localhost:5000/api/health

# Database connected?
curl http://localhost:5000/api/health/db

# BAS API accessible?
curl http://localhost:5000/api/health/bas
```

### 11.3 Rollout Strategy

**Phase 1: Pilot (Week 1)**
- 1 cabang (AXA 2) - 50 employees
- Super Admin + BrM testing
- Identify bugs, fix quickly

**Phase 2: Limited Rollout (Week 2-3)**
- 5 cabang - 250 employees
- Owner + CEO testing
- PT reports validation

**Phase 3: Full Rollout (Week 4)**
- All 42 cabang - 10,000 employees
- All roles testing
- Monitor performance, fix issues

**Phase 4: Stabilization (Month 2)**
- Bug fixes
- Performance optimization
- User feedback incorporation

---

## 12. APPENDIX

### 12.1 Glossary

**BAS:** Business Automation System (desktop system existing, source of truth untuk employee + margin data)  
**PT:** Perseroan Terbatas (legal entity, untuk compliance/tax reporting)  
**Reality Score:** Margin / NA (ukuran performance karyawan)  
**Zone:** Kategori performance (Success ≥4jt, Warning ≥2jt, Critical <2jt)  
**18 Pilar:** Self-assessment framework (18 aspek kualitas karyawan)  
**Individual Mode:** Workspace untuk personal tracking (ga ngaruh team aggregation)  
**Enterprise Mode:** Workspace untuk team audit (bottom-up aggregation)  

### 12.2 Abbreviations

**BC:** Business Consultant (level paling bawah)  
**SBC:** Senior Business Consultant  
**BsM:** Business Manager  
**SBM:** Senior Business Manager  
**EM:** Executive Manager  
**SEM:** Senior Executive Manager  
**SVBM:** Senior Vice Business Manager  
**VBM:** Vice Business Manager  
**BrM:** Branch Manager (1 per cabang)  
**CBO:** Chief Business Officer (manage multiple BrM, bisa lintas PT)  
**CEO:** Chief Executive Officer (1 per PT atau cross-PT)  
**Owner:** Top boss (1 orang)  

### 12.3 Data Sources Priority

**Priority Order:**
1. BAS API (real-time, daily sync)
2. Manual Upload (temporary, kalau BAS offline)
3. Manual Edit (super admin override)

**Conflict Resolution:**
- BAS data always override manual upload (next sync)
- Manual edit by super admin persist (until next BAS sync)

### 12.4 Contact & Support

**Super Admin:** [Your Name/Email]  
**BAS Team:** [BAS contact for API support]  
**Replit Support:** support@replit.com  
**Documentation:** AISG_Enterprise_User_Manual.pdf (to be created)  

---

## 📝 DOCUMENT SIGN-OFF

**Prepared By:** Replit Agent  
**Reviewed By:** [User Name]  
**Approved By:** [User Name]  
**Date:** November 11, 2025  

**Approval Status:** ⏳ Awaiting User Approval

**Next Steps:**
1. User review this document (30-60 minutes)
2. User provide feedback/approval
3. If approved → Proceed to Phase 1 implementation
4. If revisions needed → Update document, re-submit

---

**END OF DOCUMENT** (Total: 80 pages equivalent)

**Estimated Creation Cost:** ~$5-10 (1 checkpoint)  
**Estimated Implementation Cost:** $60-100 (15-20 checkpoints)  
**Total Budget:** $65-110

**Question for User:**  
**"APPROVED untuk lanjut ke Phase 1 implementation?"**  
**Atau ada yang perlu direvisi?**
