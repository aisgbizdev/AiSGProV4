# AISG Enterprise MVP - Simplified Audit System

## Overview
AISG Enterprise MVP is an employee performance audit platform designed for multi-branch organizations, leveraging Excel uploads for data management. It supports scalability up to 42 branches with over 800 employees per branch. The system utilizes an 18-Pillar framework for monthly self-assessments, features an auto-hierarchy builder, bottom-up aggregation of performance data, and zone-based analytics (Success 🟩, Warning 🟨, Critical 🟥) to provide clear insights into employee performance.

**Dual-Mode System:**
1. **Enterprise Mode** - Official branch audits with Excel uploads, Master Marketing hierarchy, and BrM oversight
2. **Personal Self-Assessment Mode** - Individual self-improvement tracking with 18-Pillar framework, Reality Score calculation, and optional AI coaching

The current MVP focuses on core functionalities including manual Excel uploads, simplified authentication, comprehensive reporting, and personal progress tracking.

## User Preferences
**Communication Style**: Simple, everyday language (Bahasa Indonesia)

**Design Preferences**:
- Modern professional dark mode theme
- Zone-based color coding (Success 🟩, Warning 🟨, Critical 🟥)
- Clear, prominent UI elements
- Sticky navigation (header, sidebar)
- Responsive design (mobile-friendly)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **UI**: shadcn/ui components (Radix UI) with dark mode
- **State Management**: TanStack Query for server state, React Hook Form with Zod for forms
- **Routing**: Wouter
- **Key Features**: Excel upload interface, hierarchical employee dashboard, monthly 18 Pilar assessment form, zone-based analytics, and PDF export.

### Backend
- **Runtime**: Node.js with Express.js
- **API**: RESTful JSON API
- **Business Logic**: Includes Excel parsing & validation, auto-hierarchy building, Reality Score calculation, zone classification, bottom-up aggregation, and SWOT/ProDem/Action Plan generation.
- **Validation**: Zod schemas (shared with frontend).
- **Patterns**: Storage interface abstraction, schema-driven development, position-based RBAC.

### Data Storage
- **Database**: PostgreSQL 16 (Neon serverless) using Drizzle ORM.
- **Schema**: 9 tables including `users`, `employees`, `branches`, `monthly_performance`, `audits`, `personal_audits` (self-assessment tracking), `chatMessages` (optional AI feature), `security_questions`, and `upload_logs`.
- **Key Features**: UUID primary keys, JSONB for flexible data (pillar scores), self-referencing employee hierarchy, decimal precision for financial/score data, 90-day auto-expiry for personal audits, and cascading deletes. Hierarchical queries use recursive CTEs.

### Authentication & Authorization
- **Architecture**: Session-based authentication with position-based RBAC.
- **Session Management**: express-session with MemoryStore.
- **Password Strategy**: Auto-created accounts use `tanggal lahir` (YYYYMMDD) as initial password, forced change on first login, bcrypt hashing.
- **Password Reset**: Via security questions (3 questions, 2 correct answers needed).
- **Role Types**: Simplified to `super_admin`, `brm`, and `staff` for MVP.
- **Security**: CSRF protection, secure cookies, rate limiting, circular reference prevention.

### Monthly Audit Workflow

**Enterprise Mode:**
- **Frequency**: Monthly cycle for performance assessment.
- **Flow**: BrM uploads Excel, system auto-updates margin/NA, staff complete 18 Pilar assessment, BrM reviews completion, then exports PDF reports.
- **Bottom-Up Aggregation**: Real-time cascading aggregation of margin/NA from subordinates up the hierarchy, with Reality Score calculated at each level.

**Personal Self-Assessment Mode:**
- **Frequency**: User-driven (can create multiple audits for tracking progress).
- **Flow**: User fills 18 Pilar self-assessment form → Reality Score auto-calculated → Zone classification (🟩🟨🟥) → Optional AI coaching suggestions.
- **Features**: 
  - History tracking with progress charts
  - 90-day retention with auto-expiry warnings (7 days before deletion)
  - User can extend retention or delete manually
  - No hierarchy requirements (nama/posisi entered manually)
  - Separate storage from enterprise audits (`personal_audits` table)

## Deployment Status (Nov 17, 2025)

**✅ PRODUCTION-READY WITH DB:PUSH STRATEGY (Nov 17, 2025):**
- ✅ **Deployment Strategy Changed:** Using `db:push --force` instead of migrations (no more migration conflicts!)
- ✅ **Schema Cleanup:** Removed legacy `chat_messages` table to avoid FK constraint conflicts
- ✅ **Schema Sync:** personal-schema.ts now matches schema.ts (ceo_units punya ptId+code, branches punya ceoUnitId)
- ✅ **Build Verified:** 218.2 KB backend, 1.16 MB frontend - production ready
- ✅ **Migration-Free:** All migration files deleted, using direct schema push for reliability

**Enterprise Upload Features (Production-Ready):**
- ✅ BAS production data parser: 3,248 employees parsed successfully
- ✅ Bulk upload API: 3,246 employees + 38,952 performance records in ~12 seconds
- ✅ Auto-seeding: 42 branches, PTs, CEO Units discovered from BAS data
- ✅ Email deduplication: Duplicate emails nullified + reporting for remediation
- ✅ Performance batching: 1,000 records per batch (no stack overflow)
- ✅ Scoped delete: Only uploaded employees' data cleaned (safe for partial uploads)
- ✅ Branch Mapping: Automatic PT assignment from branch codes (e.g., BM→RFB, AB→SGB)

**Login Credentials (Development):**
- **Admin:** username `admin` / password `admin123`
- **Superadmin:** username `superadmin` / password `vito1007`

**Database Schema:**
- Runtime uses `shared/schema.ts` (all enterprise features, chatMessages temporarily disabled)
- Deployment uses `shared/personal-schema.ts` for drizzle-kit operations (matches schema.ts)
- Personal feature uses separate `personal_audits` table (90-day retention, auto-expiry warnings)

**Known Issues:**
- Manager linking: Name-based matching finds duplicate names, causing linking errors for some employees
- 2 LSP type errors in storage.ts (non-blocking)
- chatMessages feature temporarily disabled (will re-enable after production stable)

## External Dependencies
- **AI Services (Optional)**: OpenAI ChatGPT (gpt-4o-mini), Google Gemini (gemini-2.0-flash-exp).
- **Database**: Neon Serverless PostgreSQL.
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React.
- **Form & Validation**: React Hook Form, Zod.
- **Excel Processing**: XLSX library (SheetJS).
- **PDF Generation**: PDFKit.
- **Development Tools**: Vite, TypeScript, Tailwind CSS, Drizzle Kit.