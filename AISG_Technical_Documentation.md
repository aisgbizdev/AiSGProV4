# AISG - Technical Architecture Documentation

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Status**: Production Ready  
**Target Audience**: Software Developers, System Architects, DevOps Engineers

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagrams](#2-architecture-diagrams)
3. [Technology Stack](#3-technology-stack)
4. [Data Flow & Request Lifecycle](#4-data-flow--request-lifecycle)
5. [Database Schema & Design](#5-database-schema--design)
6. [API Specification](#6-api-specification)
7. [Business Logic Algorithms](#7-business-logic-algorithms)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Backend Architecture](#9-backend-architecture)
10. [Code Structure & Conventions](#10-code-structure--conventions)
11. [Error Handling & Validation](#11-error-handling--validation)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Security Considerations](#13-security-considerations)
14. [Performance Optimization](#14-performance-optimization)
15. [Testing Strategy](#15-testing-strategy)
16. [Troubleshooting Guide](#16-troubleshooting-guide)

---

## 1. System Overview

### 1.1 Purpose

AISG (Audit Intelligence SG) is a full-stack web application for corporate performance auditing using the standardized 18 Pilar framework. The system automates:
- Employee self-assessment data collection
- Complex performance calculations (Reality Score, Zones, ProDem)
- Comprehensive report generation (12 sections)
- AI-powered coaching via GPT-4o
- Professional PDF export

### 1.2 Key Features

**Core Audit System**:
- 5-step multi-form data collection
- 18 Pilar self-assessment (scale 1-5)
- Quarterly performance tracking (Q1-Q4)
- Team hierarchy structure
- Automated zone calculation (Success/Warning/Critical)

**Advanced Features**:
- AI Chat Integration (OpenAI GPT-4o)
- PDF Report Generation (PDFKit)
- CRUD operations (Create, Read, Delete)
- Chat history persistence
- Real-time validation

### 1.3 System Constraints

- **Authentication**: Not implemented (all data publicly accessible)
- **Single Database**: No replication or backup automation
- **OpenAI Dependency**: Requires paid API credits
- **Manual Data Entry**: No HRIS integration
- **PostgreSQL Only**: No multi-database support

---

## 2. Architecture Diagrams

### 2.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React 18 + TypeScript (Vite)                         │ │
│  │  - Wouter (Routing)                                    │ │
│  │  - TanStack Query (State Management)                   │ │
│  │  - React Hook Form + Zod (Forms)                       │ │
│  │  - shadcn/ui + Tailwind CSS (UI)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/JSON (REST API)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       SERVER LAYER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js (Node.js Runtime)                          │ │
│  │  - API Routes (RESTful endpoints)                      │ │
│  │  - Business Logic (audit processing)                   │ │
│  │  - Storage Interface (database abstraction)            │ │
│  │  - OpenAI Integration (GPT-4o API)                     │ │
│  │  - PDF Generation (PDFKit)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬───────────────┬────────────────────────┘
                     │               │
        ┌────────────▼──────┐   ┌───▼────────────┐
        │  PostgreSQL 16    │   │  OpenAI API    │
        │  (Neon Serverless)│   │  (GPT-4o)      │
        │  - Drizzle ORM    │   │                │
        │  - JSONB Support  │   └────────────────┘
        └───────────────────┘
```

### 2.2 Component Interaction Diagram

```
┌─────────────┐       ┌──────────────┐       ┌────────────┐
│   Browser   │◄─────►│  Vite Server │◄─────►│   React    │
│             │       │  (Dev Only)  │       │  Frontend  │
└─────────────┘       └──────────────┘       └──────┬─────┘
      │                                             │
      │ HTTP Request                                │
      │ (Production)                                │
      ▼                                             ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Backend                          │
│  ┌────────────┐  ┌───────────────┐  ┌────────────────┐ │
│  │   Routes   │─►│ Business Logic│─►│    Storage     │ │
│  │ (REST API) │  │  (Processing) │  │  (Interface)   │ │
│  └────────────┘  └───────┬───────┘  └────────┬───────┘ │
│                          │                    │          │
│                          ▼                    ▼          │
│                  ┌───────────────┐    ┌──────────────┐  │
│                  │ OpenAI Client │    │ Drizzle ORM  │  │
│                  └───────┬───────┘    └──────┬───────┘  │
└──────────────────────────┼────────────────────┼─────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐      ┌──────────┐
                    │ OpenAI API  │      │PostgreSQL│
                    │  (GPT-4o)   │      │  (Neon)  │
                    └─────────────┘      └──────────┘
```

### 2.3 Data Flow - Audit Creation

```
User Input (5 Steps)
      │
      ▼
┌──────────────────────┐
│ Step 1: Personal Info│
│ - Nama, Jabatan, etc │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 2: Quarterly    │
│ - Margin, NA (Q1-Q4) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 3: Team Struct  │
│ - BC, SBC, BsM, etc  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 4: 18 Pilar     │
│ - Self-assessment    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 5: Review       │
│ - Confirm & Submit   │
└──────────┬───────────┘
           │
           │ POST /api/audit
           ▼
    ┌──────────────────┐
    │ Backend Receives │
    │ Raw Audit Data   │
    └────────┬─────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ Zod Validation          │
    │ - Check required fields │
    │ - Type checking         │
    └────────┬────────────────┘
             │ Valid?
             │ Yes
             ▼
    ┌─────────────────────────────────┐
    │ Business Logic Processing       │
    │ 1. Calculate Reality Score      │
    │ 2. Determine Performance Zone   │
    │ 3. Determine Behavioral Zone    │
    │ 4. Calculate Final Zone         │
    │ 5. Generate Employee Profile    │
    │ 6. Generate SWOT Analysis       │
    │ 7. Generate ProDem Recommendation│
    │ 8. Generate Action Plan 30-60-90│
    │ 9. Generate EWS                 │
    │10. Generate Magic Section       │
    └────────┬────────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Save to Database │
    │ (audits table)   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Return Audit ID  │
    │ + Full Report    │
    └────────┬─────────┘
             │
             ▼
    Frontend Redirects to
    /audit/:id (Detail Page)
```

### 2.4 Data Flow - AI Chat

```
User Types Message
      │
      ▼
┌─────────────────┐
│ Input Field     │
│ "Bagaimana      │
│  performa saya?"│
└────────┬────────┘
         │
         │ Click Send
         ▼
┌──────────────────────┐
│ POST /api/chat       │
│ Body: {              │
│   auditId: "xxx",    │
│   message: "..."     │
│ }                    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────┐
│ Backend: Save User Msg   │
│ to chatMessages table    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Load Chat History        │
│ (last 10 messages)       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Build System Prompt      │
│ - Include audit data:    │
│   * Nama, Jabatan        │
│   * Reality Score        │
│   * Zona Final           │
│   * Profil               │
│   * ProDem Recommendation│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Call OpenAI API          │
│ - Model: gpt-4o          │
│ - Messages: [            │
│     {role: "system", ... }│
│     ...history           │
│   ]                      │
│ - Max Tokens: 500        │
│ - Temperature: 0.7       │
└────────┬─────────────────┘
         │
         │ Response or Error?
         │
    ┌────┴────┐
    │         │
 Success    Error
    │         │
    ▼         ▼
┌─────┐  ┌──────────────┐
│Save │  │ Return 429   │
│AI   │  │ or 500 error │
│Msg  │  └──────┬───────┘
└──┬──┘         │
   │            │
   ▼            ▼
┌──────────────────┐
│ Frontend:        │
│ - Refresh history│
│ - Clear input    │
│ - Show toast     │
│   (success/error)│
└──────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend Stack

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| React | 18.3.1 | UI Framework | Industry standard, rich ecosystem |
| TypeScript | 5.x | Type Safety | Catch errors at compile time, better DX |
| Vite | 5.x | Build Tool | Fast HMR, optimized builds |
| Wouter | 3.x | Routing | Lightweight (1.3KB), hook-based API |
| TanStack Query | 5.x | Server State | Automatic caching, background refetch |
| React Hook Form | 7.x | Form Management | Minimal re-renders, great performance |
| Zod | 3.x | Validation | Runtime type checking, TypeScript integration |
| shadcn/ui | Latest | UI Components | High-quality, customizable, accessible |
| Tailwind CSS | 3.x | Styling | Utility-first, rapid development |
| Lucide React | Latest | Icons | Consistent, tree-shakeable |

### 3.2 Backend Stack

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Node.js | 20.x | Runtime | Async I/O, JavaScript everywhere |
| Express.js | 4.x | Web Framework | Minimalist, proven, middleware-rich |
| TypeScript | 5.x | Type Safety | Shared types with frontend |
| Drizzle ORM | 0.33.x | Database ORM | Lightweight, type-safe, zero-cost |
| Zod | 3.x | Validation | Shared schemas with frontend |
| tsx | Latest | TS Execution | No build step for development |

### 3.3 External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Neon PostgreSQL | Database | Free tier (3GB) |
| OpenAI GPT-4o | AI Chat | ~$2.50 per 1M input tokens |
| Replit Hosting | Deployment | $20/month (Core plan) |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| Drizzle Kit | Database migrations |
| ESBuild | Fast bundling (via Vite) |
| PostCSS | CSS processing |
| Autoprefixer | Browser compatibility |

---

## 4. Data Flow & Request Lifecycle

### 4.1 Frontend Request Flow (TanStack Query)

```typescript
// Example: Fetching audit detail
const { data: audit } = useQuery<Audit>({
  queryKey: [`/api/audit/${auditId}`],
  enabled: !!auditId,
});

// Behind the scenes:
// 1. TanStack Query checks cache (queryKey)
// 2. If cache miss or stale:
//    - Call default fetcher (configured in queryClient)
//    - Fetcher uses fetch(`/api/audit/${auditId}`)
// 3. Parse JSON response
// 4. Store in cache (key: `/api/audit/${auditId}`)
// 5. Return data to component
// 6. Auto-refetch on window focus (configurable)
```

**Default Fetcher** (`client/src/lib/queryClient.ts`):

```typescript
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey[0] as string;
  const res = await fetch(url, { credentials: "include" });
  
  if (!res.ok) {
    // Extract error message
    const error = await res.text();
    throw new Error(`${res.status}: ${error}`);
  }
  
  return res.json();
};
```

### 4.2 Backend Request Lifecycle

```
1. Client sends HTTP request
   ↓
2. Express middleware chain:
   - JSON body parser
   - CORS (if configured)
   - Session middleware (not active yet)
   ↓
3. Route handler matched
   Example: app.post("/api/audit", async (req, res) => {...})
   ↓
4. Zod validation
   - Parse req.body with Zod schema
   - If invalid: return 400 error
   ↓
5. Business logic processing
   - Call functions from business-logic.ts
   - Complex calculations, data transformation
   ↓
6. Database operations
   - Use storage interface (IStorage)
   - Drizzle ORM executes SQL
   ↓
7. Response sent
   - res.json({ data }) or res.status(error).json({ error })
   ↓
8. Client receives response
   - TanStack Query caches result
   - Component re-renders with new data
```

### 4.3 Error Propagation Flow

```
Backend Error (try-catch)
      │
      ├─ Zod Validation Error
      │  └─> 400 Bad Request
      │      { error: "Validation error", details: "..." }
      │
      ├─ Database Error
      │  └─> 500 Internal Server Error
      │      { error: "Internal server error" }
      │
      ├─ OpenAI API Error
      │  ├─ 429 Rate Limit
      │  │  └─> 429 Rate Limit
      │  │      { error: "AI service rate limit", 
      │  │        userMessage: "Maaf, layanan AI..." }
      │  │
      │  └─ Other errors
      │     └─> 500 Internal Server Error
      │         { error: "Internal server error",
      │           userMessage: "Maaf, terjadi kesalahan..." }
      │
      └─ Audit Not Found
         └─> 404 Not Found
             { error: "Audit not found" }

Frontend Error Handling
      │
      ▼
TanStack Query onError callback
      │
      ├─ Extract userMessage (if exists)
      │  └─ Parse error string, look for JSON
      │
      └─ Show toast notification
         └─ useToast({ title: "Error", description: "..." })
```

---

## 5. Database Schema & Design

### 5.1 Entity Relationship Diagram

```
┌─────────────────────┐
│      users          │
│─────────────────────│
│ id (UUID) PK        │
│ username (unique)   │
│ password (hashed)   │
│ email (unique)      │
│ role (varchar)      │
│ createdAt           │
└─────────────────────┘
         │
         │ (Not enforced FK - future use)
         │
         ▼
┌──────────────────────────┐
│      audits              │◄────────────────┐
│──────────────────────────│                 │
│ id (UUID) PK             │                 │
│ nama                     │                 │
│ jabatan                  │                 │
│ cabang                   │                 │
│ tanggalLahir             │                 │
│ marginTimQ1-Q4           │                 │
│ naTimQ1-Q4               │                 │
│ marginPribadiQ1-Q4 (NEW) │                 │
│ nasabahPribadiQ1-Q4 (NEW)│                 │
│ jumlahBC, SBC, BsM, etc  │                 │
│ pillarAnswers (JSONB)    │                 │
│ totalRealityScore        │                 │
│ zonaPerforma             │                 │
│ zonaBehavioral           │                 │
│ zonaFinal                │                 │
│ profil                   │                 │
│ magicSection (JSONB)     │                 │
│ prodemRekomendasi (JSONB)│                 │
│ auditReport (JSONB)      │                 │
│ createdAt                │                 │
└────────┬─────────────────┘                 │
         │                                    │
         │ 1:N (CASCADE DELETE)               │
         │                                    │
         ▼                                    │
┌──────────────────────┐                     │
│   chatMessages       │                     │
│──────────────────────│                     │
│ id (UUID) PK         │                     │
│ auditId (UUID) FK ───┼─────────────────────┘
│ role (user/assistant)│
│ content (text)       │
│ createdAt            │
└──────────────────────┘

┌─────────────────────┐
│     branches        │ (Not used yet)
│─────────────────────│
│ id (UUID) PK        │
│ name                │
│ region              │
│ createdAt           │
└─────────────────────┘
```

### 5.2 Detailed Schema Definitions

#### audits Table

```typescript
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Personal Info
  nama: varchar("nama", { length: 255 }).notNull(),
  jabatan: varchar("jabatan", { length: 100 }).notNull(),
  cabang: varchar("cabang", { length: 255 }).notNull(),
  tanggalLahir: varchar("tanggal_lahir", { length: 20 }).notNull(),
  
  // Team Quarterly Performance
  marginTimQ1: integer("margin_tim_q1").default(0),
  marginTimQ2: integer("margin_tim_q2").default(0),
  marginTimQ3: integer("margin_tim_q3").default(0),
  marginTimQ4: integer("margin_tim_q4").default(0),
  naTimQ1: integer("na_tim_q1").default(0),
  naTimQ2: integer("na_tim_q2").default(0),
  naTimQ3: integer("na_tim_q3").default(0),
  naTimQ4: integer("na_tim_q4").default(0),
  
  // Personal Quarterly Performance (NEW - October 23, 2025)
  marginPribadiQ1: integer("margin_pribadi_q1").default(0),
  marginPribadiQ2: integer("margin_pribadi_q2").default(0),
  marginPribadiQ3: integer("margin_pribadi_q3").default(0),
  marginPribadiQ4: integer("margin_pribadi_q4").default(0),
  nasabahPribadiQ1: integer("nasabah_pribadi_q1").default(0),
  nasabahPribadiQ2: integer("nasabah_pribadi_q2").default(0),
  nasabahPribadiQ3: integer("nasabah_pribadi_q3").default(0),
  nasabahPribadiQ4: integer("nasabah_pribadi_q4").default(0),
  
  // Team Structure
  jumlahBC: integer("jumlah_bc").default(0),
  jumlahSBC: integer("jumlah_sbc").default(0),
  jumlahBsM: integer("jumlah_bsm").default(0),
  jumlahSBM: integer("jumlah_sbm").default(0),
  jumlahEM: integer("jumlah_em").default(0),
  jumlahSEM: integer("jumlah_sem").default(0),
  jumlahVBM: integer("jumlah_vbm").default(0),
  
  // Assessment Results (JSONB for flexibility)
  pillarAnswers: jsonb("pillar_answers"), // [{ pillarId: 1, selfScore: 3 }, ...]
  
  // Calculated Fields
  totalRealityScore: integer("total_reality_score").default(0),
  zonaPerforma: varchar("zona_performa", { length: 50 }),
  zonaBehavioral: varchar("zona_behavioral", { length: 50 }),
  zonaFinal: varchar("zona_final", { length: 50 }),
  profil: varchar("profil", { length: 100 }),
  
  // Complex Results (JSONB)
  magicSection: jsonb("magic_section"), // { zodiac, quote, booster }
  prodemRekomendasi: jsonb("prodem_rekomendasi"), // { recommendation, reasoning, strategy }
  auditReport: jsonb("audit_report"), // Full 12-section report
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});
```

**JSONB Structure Examples**:

```typescript
// pillarAnswers
[
  { pillarId: 1, selfScore: 3 },
  { pillarId: 2, selfScore: 4 },
  // ... 18 items total
]

// magicSection
{
  zodiac: "Leo",
  quote: "Your determination will lead you to success",
  booster: "Focus on building team collaboration this quarter"
}

// prodemRekomendasi
{
  recommendation: "Hold",
  reasoning: "Performance in Warning zone with improvement trend...",
  strategy: "Save by Margin",
  timeline: "Re-evaluate in 3 months"
}

// auditReport
{
  executiveSummary: "...",
  swotAnalysis: { strengths: [...], weaknesses: [...], ... },
  actionPlan3060 90: { days30: [...], days60: [...], days90: [...] },
  // ... all 12 sections
}
```

#### chatMessages Table

```typescript
export const chatMessages = pgTable("chatMessages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull()
    .references(() => audits.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Foreign Key Behavior**:
- `ON DELETE CASCADE`: When audit deleted, all associated chat messages auto-deleted
- Enforced at database level for data integrity

### 5.3 Indexing Strategy

**Current Indexes** (implicit):
- Primary keys (id) on all tables → B-tree index
- Foreign keys (auditId) → B-tree index

**Recommended Future Indexes**:

```sql
-- For filtering audits by name (search functionality)
CREATE INDEX idx_audits_nama ON audits(nama);

-- For sorting by creation date (most recent first)
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

-- For chat history queries (frequently accessed)
CREATE INDEX idx_chat_audit_created ON chatMessages(audit_id, created_at);

-- For zona filtering (if implemented)
CREATE INDEX idx_audits_zona_final ON audits(zona_final);
```

### 5.4 Data Migration History

**October 23, 2025 Migration**:

1. **Column Renames** (preserve data):
   ```sql
   ALTER TABLE audits RENAME COLUMN na_q1 TO na_tim_q1;
   ALTER TABLE audits RENAME COLUMN na_q2 TO na_tim_q2;
   ALTER TABLE audits RENAME COLUMN na_q3 TO na_tim_q3;
   ALTER TABLE audits RENAME COLUMN na_q4 TO na_tim_q4;
   ```

2. **New Columns** (personal performance tracking):
   ```sql
   ALTER TABLE audits ADD COLUMN margin_pribadi_q1 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN margin_pribadi_q2 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN margin_pribadi_q3 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN margin_pribadi_q4 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN nasabah_pribadi_q1 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN nasabah_pribadi_q2 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN nasabah_pribadi_q3 INTEGER DEFAULT 0;
   ALTER TABLE audits ADD COLUMN nasabah_pribadi_q4 INTEGER DEFAULT 0;
   ```

**Migration Process**:
- Handled via Replit Publishing UI (conflict resolution wizard)
- Production database updated without data loss
- All existing audits retained with new columns defaulting to 0

---

## 6. API Specification

### 6.1 Audit Endpoints

#### POST /api/audit

**Purpose**: Create new audit and return calculated results

**Request**:
```typescript
{
  // Personal Info
  nama: string;
  jabatan: string;
  cabang: string;
  tanggalLahir: string; // Format: "DD-MM-YYYY"
  
  // Team Quarterly Performance
  marginTimQ1: number;
  marginTimQ2: number;
  marginTimQ3: number;
  marginTimQ4: number;
  naTimQ1: number; // "na" = New Account (nasabah baru)
  naTimQ2: number;
  naTimQ3: number;
  naTimQ4: number;
  
  // Personal Quarterly Performance
  marginPribadiQ1: number;
  marginPribadiQ2: number;
  marginPribadiQ3: number;
  marginPribadiQ4: number;
  nasabahPribadiQ1: number;
  nasabahPribadiQ2: number;
  nasabahPribadiQ3: number;
  nasabahPribadiQ4: number;
  
  // Team Structure
  jumlahBC: number;
  jumlahSBC: number;
  jumlahBsM: number;
  jumlahSBM: number;
  jumlahEM: number;
  jumlahSEM: number;
  jumlahVBM: number;
  
  // 18 Pilar Self-Assessment
  pillarAnswers: Array<{
    pillarId: number; // 1-18
    selfScore: number; // 1-5
  }>;
}
```

**Response** (200 OK):
```typescript
{
  id: string; // UUID
  nama: string;
  // ... all input fields
  
  // Calculated fields
  totalRealityScore: number; // Sum of pillar scores
  zonaPerforma: string; // "success" | "warning" | "critical"
  zonaBehavioral: string;
  zonaFinal: string;
  profil: string; // "Consistency Expert" | "Balanced Performer" | etc.
  
  // Complex results
  magicSection: {
    zodiac: string;
    quote: string;
    booster: string;
  };
  prodemRekomendasi: {
    recommendation: string; // "Promosi" | "Demotion" | "Hold"
    reasoning: string;
    strategy: string;
    timeline: string;
  };
  auditReport: {
    executiveSummary: string;
    swotAnalysis: object;
    actionPlan30_60_90: object;
    ews: object;
    // ... 12 sections total
  };
  
  createdAt: string; // ISO timestamp
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (Zod schema mismatch)
  ```json
  {
    "error": "Validation error",
    "details": "pillarAnswers: Required"
  }
  ```

- `500 Internal Server Error`: Database or processing error
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Processing Flow**:
1. Validate request body with Zod schema
2. Call `processAudit(data)` from business-logic.ts
3. Save to database via `storage.createAudit(processedData)`
4. Return full audit object with all calculated fields

---

#### GET /api/audits

**Purpose**: Retrieve all audits (list view)

**Request**: None (no query parameters)

**Response** (200 OK):
```typescript
[
  {
    id: string;
    nama: string;
    jabatan: string;
    cabang: string;
    totalRealityScore: number;
    zonaFinal: string;
    profil: string;
    createdAt: string;
    // ... other fields
  },
  // ... more audits
]
```

**Sorting**: Newest first (ORDER BY createdAt DESC)

**Error Responses**:
- `500 Internal Server Error`: Database query failed

---

#### GET /api/audit/:id

**Purpose**: Retrieve single audit by ID

**URL Parameters**:
- `id` (string, UUID): Audit ID

**Response** (200 OK):
```typescript
{
  id: string;
  nama: string;
  // ... all fields (same as POST response)
}
```

**Error Responses**:
- `404 Not Found`: Audit ID doesn't exist
  ```json
  {
    "error": "Audit not found"
  }
  ```

- `500 Internal Server Error`: Database query failed

---

#### DELETE /api/audit/:id

**Purpose**: Delete audit and associated chat messages (CASCADE)

**URL Parameters**:
- `id` (string, UUID): Audit ID

**Response** (200 OK):
```json
{
  "message": "Audit deleted successfully"
}
```

**Processing Flow**:
1. Delete chat messages first: `storage.deleteChatHistory(id)`
2. Delete audit: `storage.deleteAudit(id)`
3. Both operations wrapped in transaction (future: explicit transaction handling)

**Error Responses**:
- `404 Not Found`: Audit ID doesn't exist
- `500 Internal Server Error`: Database deletion failed

**Note**: Frontend shows confirmation dialog before calling this endpoint

---

### 6.2 Chat Endpoints

#### POST /api/chat

**Purpose**: Send chat message and get AI response

**Request**:
```typescript
{
  auditId: string; // UUID
  message: string; // User's question
}
```

**Response** (200 OK):
```json
{
  "response": "AI generated response text..."
}
```

**Processing Flow**:
1. Validate request body with Zod
2. Verify audit exists (404 if not)
3. **Save user message** to database FIRST
4. Load chat history (last 10 messages for context)
5. Build system prompt with audit context:
   ```typescript
   const systemPrompt = `
   Anda adalah AI coach profesional untuk AISG.
   
   DATA AUDIT:
   - Nama: ${audit.nama}
   - Jabatan: ${audit.jabatan}
   - Reality Score: ${audit.totalRealityScore}/90
   - Profil: ${audit.profil}
   - Zona: ${audit.zonaFinal}
   - ProDem: ${audit.prodemRekomendasi.recommendation}
   
   TUGAS ANDA:
   1. Jawab pertanyaan tentang hasil audit
   2. Berikan insight actionable
   3. Motivasi karyawan untuk improve
   4. Gunakan Bahasa Indonesia profesional
   `;
   ```
6. Call OpenAI API:
   ```typescript
   const completion = await openai.chat.completions.create({
     model: "gpt-4o",
     messages: [
       { role: "system", content: systemPrompt },
       ...history.map(msg => ({ role: msg.role, content: msg.content }))
     ],
     max_tokens: 500,
     temperature: 0.7
   });
   ```
7. Save AI response to database
8. Return AI response to frontend

**Error Responses**:
- `404 Not Found`: Audit ID doesn't exist
- `429 Rate Limit`: OpenAI quota exceeded
  ```json
  {
    "error": "AI service rate limit",
    "userMessage": "Maaf, layanan AI sedang mencapai batas penggunaan. Mohon coba lagi dalam beberapa saat."
  }
  ```
- `500 Internal Server Error`: OpenAI API or database error
  ```json
  {
    "error": "Internal server error",
    "userMessage": "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi."
  }
  ```

**Important Behavior**:
- User message is **saved BEFORE** calling OpenAI API
- If OpenAI fails, user message still persists in database
- Frontend refreshes chat history even on error (to show user's message)

---

#### GET /api/chat/:auditId

**Purpose**: Retrieve chat history for specific audit

**URL Parameters**:
- `auditId` (string, UUID): Audit ID

**Response** (200 OK):
```typescript
[
  {
    id: string;
    auditId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string; // ISO timestamp
  },
  // ... ordered by createdAt ASC (oldest first)
]
```

**Error Responses**:
- `500 Internal Server Error`: Database query failed

**Note**: Returns empty array `[]` if no chat history exists (not an error)

---

#### DELETE /api/chat/:auditId

**Purpose**: Clear all chat messages for specific audit

**URL Parameters**:
- `auditId` (string, UUID): Audit ID

**Response** (200 OK):
```json
{
  "message": "Chat history cleared successfully"
}
```

**Error Responses**:
- `500 Internal Server Error`: Database deletion failed

---

### 6.3 PDF Export Endpoint

#### GET /api/audit/:id/pdf

**Purpose**: Generate and download audit report as PDF

**URL Parameters**:
- `id` (string, UUID): Audit ID

**Response** (200 OK):
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="Audit-[Nama]-[Date].pdf"`
- Body: PDF file stream (binary)

**Processing**:
1. Retrieve audit from database
2. Generate PDF using PDFKit with all 12 sections
3. Stream PDF to response

**Error Responses**:
- `404 Not Found`: Audit ID doesn't exist
- `500 Internal Server Error`: PDF generation failed

**Frontend Usage**:
```typescript
const handleDownloadPDF = () => {
  window.location.href = `/api/audit/${auditId}/pdf`;
  // Browser automatically downloads file
};
```

---

## 7. Business Logic Algorithms

### 7.1 Reality Score Calculation

**File**: `server/business-logic.ts`

**Algorithm**:
```typescript
function calculateRealityScore(pillarAnswers: PillarAnswer[]): number {
  // Sum all self-assessment scores
  const total = pillarAnswers.reduce((sum, answer) => {
    return sum + answer.selfScore;
  }, 0);
  
  // Max possible: 18 pillars × 5 points = 90
  return total;
}
```

**Input**: Array of 18 pillar self-assessments (1-5 scale)  
**Output**: Total score (0-90)

**Example**:
```typescript
pillarAnswers = [
  { pillarId: 1, selfScore: 3 },
  { pillarId: 2, selfScore: 4 },
  { pillarId: 3, selfScore: 3 },
  // ... 15 more
  { pillarId: 18, selfScore: 4 }
];

totalRealityScore = 3 + 4 + 3 + ... + 4 = 58
```

---

### 7.2 Performance Zone Determination

**Algorithm**:
```typescript
function determinePerformanceZone(audit: AuditInput): string {
  // Aggregate quarterly performance
  const totalMargin = audit.marginTimQ1 + audit.marginTimQ2 + 
                      audit.marginTimQ3 + audit.marginTimQ4;
  const totalNA = audit.naTimQ1 + audit.naTimQ2 + 
                  audit.naTimQ3 + audit.naTimQ4;
  
  // Define thresholds (based on jabatan)
  const thresholds = getThresholds(audit.jabatan);
  
  // Determine zone
  if (totalMargin >= thresholds.margin.success && 
      totalNA >= thresholds.na.success) {
    return "success"; // 🟩 Green
  } else if (totalMargin >= thresholds.margin.warning && 
             totalNA >= thresholds.na.warning) {
    return "warning"; // 🟨 Yellow
  } else {
    return "critical"; // 🟥 Red
  }
}

function getThresholds(jabatan: string) {
  // Example thresholds (configurable per jabatan)
  const thresholdsMap = {
    "Business Manager": {
      margin: { success: 200000, warning: 100000 },
      na: { success: 10, warning: 5 }
    },
    "Sales Business Manager": {
      margin: { success: 500000, warning: 250000 },
      na: { success: 20, warning: 10 }
    },
    // ... more jabatan
  };
  
  return thresholdsMap[jabatan] || thresholdsMap["Business Manager"];
}
```

**Input**: Quarterly margin & NA data + jabatan  
**Output**: "success" | "warning" | "critical"

**Zone Criteria**:
- **Success (🟩)**: Exceeds both margin AND NA success thresholds
- **Warning (🟨)**: Meets warning thresholds but not success
- **Critical (🟥)**: Below warning thresholds

---

### 7.3 Behavioral Zone Analysis

**Algorithm**:
```typescript
function determineBehavioralZone(pillarAnswers: PillarAnswer[]): string {
  // Calculate average score
  const avgScore = pillarAnswers.reduce((sum, p) => sum + p.selfScore, 0) / 18;
  
  // Calculate variance (consistency check)
  const variance = calculateVariance(pillarAnswers.map(p => p.selfScore));
  
  // Determine zone based on avg score and consistency
  if (avgScore >= 4.0 && variance < 0.5) {
    return "success"; // High scores + consistent
  } else if (avgScore >= 3.0 && variance < 1.0) {
    return "warning"; // Moderate scores or some inconsistency
  } else {
    return "critical"; // Low scores or high variance
  }
}

function calculateVariance(scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  return variance;
}
```

**Input**: 18 Pilar self-assessment scores  
**Output**: "success" | "warning" | "critical"

**Analysis Factors**:
1. **Average Score**: Overall competency level
2. **Variance**: Consistency across pillars (low variance = balanced skill set)

---

### 7.4 Final Zone Calculation

**Algorithm**:
```typescript
function determineFinalZone(zonaPerforma: string, zonaBehavioral: string): string {
  // Weighted decision matrix
  const zoneMatrix = {
    "success-success": "success",
    "success-warning": "success", // Performance outweighs
    "success-critical": "warning", // Behavioral issues drag down
    "warning-success": "warning",
    "warning-warning": "warning",
    "warning-critical": "critical",
    "critical-success": "warning", // Behavioral can't save poor performance
    "critical-warning": "critical",
    "critical-critical": "critical"
  };
  
  const key = `${zonaPerforma}-${zonaBehavioral}`;
  return zoneMatrix[key] || "warning"; // Default to warning if unknown
}
```

**Input**: Performance Zone + Behavioral Zone  
**Output**: Final Zone (used for ProDem decisions)

**Decision Logic**:
- Performance zone has slightly higher weight (60/40)
- Both critical → Always critical final
- One success → Can elevate to warning/success depending on other

---

### 7.5 Employee Profile Generation

**Algorithm**:
```typescript
function generateEmployeeProfile(audit: ProcessedAudit): string {
  const { pillarAnswers, marginTimQ1, marginTimQ2, marginTimQ3, marginTimQ4 } = audit;
  
  // Pattern 1: Consistency Check
  const variance = calculateVariance(pillarAnswers.map(p => p.selfScore));
  const isConsistent = variance < 0.5;
  
  // Pattern 2: Trend Analysis
  const trend = analyzeTrend([marginTimQ1, marginTimQ2, marginTimQ3, marginTimQ4]);
  
  // Pattern 3: Score Level
  const avgScore = pillarAnswers.reduce((s, p) => s + p.selfScore, 0) / 18;
  
  // Profile Decision Tree
  if (isConsistent && avgScore >= 4 && trend === "stable") {
    return "Consistency Expert";
  } else if (avgScore >= 4 && trend === "upward") {
    return "Rising Star";
  } else if (!isConsistent && avgScore >= 3.5) {
    return "Balanced Performer";
  } else if (trend === "upward" && avgScore >= 3) {
    return "Growth Trajectory";
  } else if (trend === "downward" || avgScore < 3) {
    return "At-Risk";
  } else {
    return "Developing Professional";
  }
}

function analyzeTrend(quarterlyData: number[]): "upward" | "downward" | "stable" {
  // Simple linear regression slope
  const n = quarterlyData.length;
  const xMean = (n - 1) / 2; // [0,1,2,3] mean = 1.5
  const yMean = quarterlyData.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (quarterlyData[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  const slope = numerator / denominator;
  
  if (slope > 5000) return "upward"; // Increasing trend
  if (slope < -5000) return "downward"; // Decreasing trend
  return "stable"; // Flat trend
}
```

**Profile Types**:
1. **Consistency Expert**: High scores, low variance, stable performance
2. **Rising Star**: High scores with upward trend
3. **Balanced Performer**: Moderate scores, good overall balance
4. **Growth Trajectory**: Improving performance over quarters
5. **At-Risk**: Low scores or declining trend
6. **Developing Professional**: Default for mixed patterns

---

### 7.6 SWOT Analysis Generation

**Algorithm**:
```typescript
function generateSWOT(audit: ProcessedAudit): SWOTAnalysis {
  const { pillarAnswers, zonaPerforma, zonaBehavioral, totalRealityScore } = audit;
  
  // STRENGTHS: Top 3 pillar scores + zona success areas
  const topPillars = pillarAnswers
    .sort((a, b) => b.selfScore - a.selfScore)
    .slice(0, 3)
    .map(p => getPillarName(p.pillarId));
  
  const strengths = [
    `Strong performance in: ${topPillars.join(", ")}`,
    zonaPerforma === "success" ? "Excellent quarterly performance metrics" : null,
    totalRealityScore >= 70 ? "High overall competency (Reality Score)" : null,
  ].filter(Boolean); // Remove null values
  
  // WEAKNESSES: Bottom 3 pillar scores + zona critical areas
  const bottomPillars = pillarAnswers
    .sort((a, b) => a.selfScore - b.selfScore)
    .slice(0, 3)
    .map(p => getPillarName(p.pillarId));
  
  const weaknesses = [
    `Need improvement in: ${bottomPillars.join(", ")}`,
    zonaBehavioral === "critical" ? "Inconsistent behavioral patterns" : null,
    zonaPerforma === "critical" ? "Performance metrics below expectations" : null,
  ].filter(Boolean);
  
  // OPPORTUNITIES: Growth potential based on trend
  const trend = analyzeTrend([audit.marginTimQ1, audit.marginTimQ2, audit.marginTimQ3, audit.marginTimQ4]);
  const opportunities = [
    trend === "upward" ? "Capitalize on positive momentum" : "Opportunity to improve quarterly performance",
    "Leverage strengths to mentor team members",
    "Develop skills in identified weakness areas",
  ];
  
  // THREATS: Risk factors from EWS
  const threats = [];
  if (trend === "downward") threats.push("Declining performance trend requires immediate attention");
  if (zonaBehavioral === "critical") threats.push("Behavioral inconsistency may impact team morale");
  if (zonaPerforma === "critical") threats.push("Risk of not meeting annual targets");
  if (threats.length === 0) threats.push("Maintain consistency to avoid performance dips");
  
  return { strengths, weaknesses, opportunities, threats };
}
```

**Output Structure**:
```typescript
{
  strengths: string[];    // 2-4 items
  weaknesses: string[];   // 2-4 items
  opportunities: string[]; // 3-4 items
  threats: string[];      // 1-3 items
}
```

---

### 7.7 ProDem Recommendation Algorithm

**Algorithm**:
```typescript
function generateProDemRecommendation(audit: ProcessedAudit): ProDemResult {
  const { zonaFinal, totalRealityScore, marginTimQ1, marginTimQ2, marginTimQ3, marginTimQ4 } = audit;
  
  const trend = analyzeTrend([marginTimQ1, marginTimQ2, marginTimQ3, marginTimQ4]);
  
  let recommendation: "Promosi" | "Demotion" | "Hold";
  let reasoning: string;
  let strategy: "Save by Margin" | "Save by Staff" | "N/A";
  let timeline: string;
  
  // Decision Logic
  if (zonaFinal === "success" && trend === "upward" && totalRealityScore >= 70) {
    recommendation = "Promosi";
    reasoning = "Excellent performance across all metrics with consistent upward trend. Ready for increased responsibilities.";
    strategy = "N/A";
    timeline = "Immediate promotion consideration";
    
  } else if (zonaFinal === "critical" && trend === "downward" && totalRealityScore < 50) {
    recommendation = "Demotion";
    reasoning = "Sustained poor performance with declining trend. Current role may be beyond capability or fit.";
    strategy = "Save by Staff"; // Rotate to different team/role
    timeline = "3-month improvement plan, then re-evaluate";
    
  } else if (zonaFinal === "critical" && trend === "stable") {
    recommendation = "Hold";
    reasoning = "Performance below expectations but stable. Focus on targeted improvement.";
    strategy = "Save by Margin"; // Focus on improving key metrics
    timeline = "6-month improvement plan with quarterly checkpoints";
    
  } else {
    recommendation = "Hold";
    reasoning = "Moderate performance. Continue development and monitor progress.";
    strategy = zonaFinal === "warning" ? "Save by Margin" : "N/A";
    timeline = "Re-evaluate in 3 months";
  }
  
  return { recommendation, reasoning, strategy, timeline };
}
```

**Decision Factors**:
1. **Final Zone**: Primary indicator (success/warning/critical)
2. **Trend**: Upward/downward/stable performance trajectory
3. **Reality Score**: Overall competency level

**Strategies**:
- **Save by Margin**: Focus on improving performance metrics (margin, NA)
- **Save by Staff**: Consider role change, team rotation, or additional support
- **N/A**: Not applicable (for promotion or stable performance)

---

### 7.8 Action Plan 30-60-90 Generation

**Algorithm**:
```typescript
function generateActionPlan(audit: ProcessedAudit, swot: SWOTAnalysis): ActionPlan {
  const { zonaFinal, pillarAnswers } = audit;
  
  // Get bottom 3 pillars for targeted improvement
  const weakPillars = pillarAnswers
    .sort((a, b) => a.selfScore - b.selfScore)
    .slice(0, 3);
  
  // 30 DAYS: Quick wins & foundational changes
  const days30 = [
    `Focus on improving ${getPillarName(weakPillars[0].pillarId)}`,
    "Set daily KPI tracking routine",
    "Schedule weekly 1-on-1 with manager",
  ];
  
  if (zonaFinal === "critical") {
    days30.push("Identify immediate performance blockers");
  }
  
  // 60 DAYS: Skill development & process improvement
  const days60 = [
    `Attend training for ${getPillarName(weakPillars[1].pillarId)}`,
    "Implement new customer acquisition strategies",
    "Build stronger team collaboration processes",
  ];
  
  // 90 DAYS: Strategic initiatives & long-term goals
  const days90 = [
    `Master ${getPillarName(weakPillars[2].pillarId)} competency`,
    "Achieve quarterly targets with 10% buffer",
    "Mentor 1-2 junior team members",
  ];
  
  if (zonaFinal === "success") {
    days90.push("Prepare for leadership expansion opportunities");
  }
  
  return { days30, days60, days90 };
}
```

**Output Structure**:
```typescript
{
  days30: string[];  // 3-4 actionable items
  days60: string[];  // 3-4 actionable items
  days90: string[];  // 3-4 actionable items
}
```

---

### 7.9 Early Warning System (EWS)

**Algorithm**:
```typescript
function generateEWS(audit: ProcessedAudit): EWS {
  const redFlags: string[] = [];
  let riskLevel: "Low" | "Medium" | "High";
  const preventiveActions: string[] = [];
  
  // Check 1: Declining quarterly trend
  const quarters = [audit.marginTimQ1, audit.marginTimQ2, audit.marginTimQ3, audit.marginTimQ4];
  const trend = analyzeTrend(quarters);
  
  if (trend === "downward") {
    redFlags.push("⚠️ Declining quarterly performance (3+ quarters)");
    preventiveActions.push("Immediate performance review with manager");
  }
  
  // Check 2: Low Reality Score
  if (audit.totalRealityScore < 45) { // < 50% of max
    redFlags.push("⚠️ Reality Score significantly below expectations");
    preventiveActions.push("Comprehensive skills assessment and training plan");
  }
  
  // Check 3: Critical zone persistence
  if (audit.zonaFinal === "critical") {
    redFlags.push("🔴 Performance in Critical zone");
    preventiveActions.push("30-day intensive improvement program");
  }
  
  // Check 4: High variance in behavioral scores
  const variance = calculateVariance(audit.pillarAnswers.map(p => p.selfScore));
  if (variance > 1.5) {
    redFlags.push("⚠️ Highly inconsistent competency levels");
    preventiveActions.push("Focus on balanced skill development");
  }
  
  // Determine risk level
  if (redFlags.length >= 3) {
    riskLevel = "High";
  } else if (redFlags.length >= 1) {
    riskLevel = "Medium";
  } else {
    riskLevel = "Low";
    redFlags.push("✅ No immediate concerns detected");
    preventiveActions.push("Maintain current performance levels");
  }
  
  return { redFlags, riskLevel, preventiveActions };
}
```

**Output Structure**:
```typescript
{
  redFlags: string[];          // Detected issues
  riskLevel: "Low" | "Medium" | "High";
  preventiveActions: string[]; // Recommended interventions
}
```

---

### 7.10 Magic Section (Zodiac Motivation)

**Algorithm**:
```typescript
function generateMagicSection(audit: ProcessedAudit): MagicSection {
  // Calculate zodiac from birth date
  const zodiac = calculateZodiac(audit.tanggalLahir);
  
  // Load zodiac-specific quotes from knowledge base
  const quotes = loadZodiacQuotes(zodiac);
  
  // Select quote based on profil
  const quote = selectQuote(quotes, audit.profil);
  
  // Generate booster message based on zona
  const booster = generateBooster(audit.zonaFinal, zodiac);
  
  return { zodiac, quote, booster };
}

function calculateZodiac(tanggalLahir: string): string {
  // Parse DD-MM-YYYY
  const [day, month, year] = tanggalLahir.split("-").map(Number);
  
  const zodiacDates = [
    { sign: "Capricorn", start: [12, 22], end: [1, 19] },
    { sign: "Aquarius", start: [1, 20], end: [2, 18] },
    { sign: "Pisces", start: [2, 19], end: [3, 20] },
    { sign: "Aries", start: [3, 21], end: [4, 19] },
    { sign: "Taurus", start: [4, 20], end: [5, 20] },
    { sign: "Gemini", start: [5, 21], end: [6, 20] },
    { sign: "Cancer", start: [6, 21], end: [7, 22] },
    { sign: "Leo", start: [7, 23], end: [8, 22] },
    { sign: "Virgo", start: [8, 23], end: [9, 22] },
    { sign: "Libra", start: [9, 23], end: [10, 22] },
    { sign: "Scorpio", start: [10, 23], end: [11, 21] },
    { sign: "Sagittarius", start: [11, 22], end: [12, 21] },
  ];
  
  for (const { sign, start, end } of zodiacDates) {
    const [startMonth, startDay] = start;
    const [endMonth, endDay] = end;
    
    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign;
    }
  }
  
  return "Capricorn"; // Fallback
}
```

**Knowledge Base Integration**:
- Zodiac quotes loaded from `attached_assets/zodiac_*.txt`
- Profile-based quote selection for personalization
- Gamification element to increase engagement

---

## 8. Frontend Architecture

### 8.1 Component Tree

```
App (Router)
├── HomePage (/)
│   ├── Header
│   ├── AuditCard[] (list of audits)
│   └── FloatingActionButton (+ New Audit)
│
├── NewAuditPage (/new-audit)
│   ├── MultiStepForm (5 steps)
│   │   ├── Step1: PersonalInfoForm
│   │   ├── Step2: QuarterlyPerformanceForm
│   │   ├── Step3: TeamStructureForm
│   │   ├── Step4: PillarAssessmentForm (18 pillars)
│   │   └── Step5: ReviewStep
│   └── ProgressIndicator
│
└── AuditDetailPage (/audit/:id)
    ├── Header (back button, download PDF)
    ├── AuditSummaryCard (Executive Summary)
    ├── Tabs (12 sections)
    │   ├── RealityScoreSection
    │   ├── PerformanceZoneSection
    │   ├── BehavioralZoneSection
    │   ├── ProfilSection
    │   ├── SWOTSection
    │   ├── EWSSection
    │   ├── ActionPlanSection
    │   ├── ProDemSection
    │   └── MagicSection
    ├── FloatingChatButton (prominent with text)
    └── ChatPanel (sidebar overlay)
        ├── ChatHeader (title + close button)
        ├── MessageList (ScrollArea)
        └── ChatInput (form with send button)
```

### 8.2 State Management Strategy

**Server State** (TanStack Query):
```typescript
// Audit list
const { data: audits } = useQuery<Audit[]>({
  queryKey: ["/api/audits"],
});

// Single audit
const { data: audit } = useQuery<Audit>({
  queryKey: [`/api/audit/${auditId}`],
  enabled: !!auditId,
});

// Chat history
const { data: messages } = useQuery<ChatMessage[]>({
  queryKey: ["/api/chat", auditId],
});
```

**Form State** (React Hook Form):
```typescript
const form = useForm<AuditFormData>({
  resolver: zodResolver(auditSchema),
  defaultValues: {
    nama: "",
    jabatan: "",
    // ... all fields with defaults
  },
});

// Access values
const nama = form.watch("nama");

// Set values
form.setValue("marginTimQ1", 50000);

// Submit
const onSubmit = (data: AuditFormData) => {
  createAuditMutation.mutate(data);
};
```

**Local UI State** (useState):
```typescript
// Multi-step form current step
const [currentStep, setCurrentStep] = useState(1);

// Chat panel open/closed
const [chatOpen, setChatOpen] = useState(false);

// Loading states (handled by TanStack Query)
const { isLoading, isPending } = useQuery/useMutation;
```

### 8.3 Routing & Navigation

**Routes** (`client/src/App.tsx`):
```typescript
<Switch>
  <Route path="/" component={HomePage} />
  <Route path="/new-audit" component={NewAuditPage} />
  <Route path="/audit/:id" component={AuditDetailPage} />
  <Route component={NotFoundPage} />
</Switch>
```

**Navigation Methods**:
```typescript
import { useLocation } from "wouter";

const [, setLocation] = useLocation();

// Programmatic navigation
setLocation("/audit/123");

// Link component
import { Link } from "wouter";
<Link href="/new-audit">Buat Audit Baru</Link>
```

### 8.4 Form Validation Flow

```
User Input
    │
    ▼
React Hook Form
(controlled components)
    │
    ▼
Real-time Validation
(onChange for UX)
    │
    ▼
Zod Schema Validation
    │
    ├─ Valid → Update form state
    │
    └─ Invalid → Show error message
           │
           ▼
    form.formState.errors
           │
           ▼
    Display <FormMessage>
    
Submit Button Click
    │
    ▼
Final Validation
    │
    ├─ Valid → Call mutation
    │    │
    │    ▼
    │   POST /api/audit
    │
    └─ Invalid → Prevent submit
             Show all errors
```

**Example Validation**:
```typescript
const auditSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib dipilih"),
  marginTimQ1: z.number().min(0, "Margin tidak boleh negatif"),
  pillarAnswers: z.array(z.object({
    pillarId: z.number().min(1).max(18),
    selfScore: z.number().min(1).max(5),
  })).length(18, "Semua 18 pilar harus dinilai"),
});
```

### 8.5 Error Handling Patterns

**Query Errors**:
```typescript
const { data, error, isError } = useQuery({
  queryKey: ["/api/audit/123"],
  retry: 1, // Retry once on failure
});

if (isError) {
  return (
    <div>
      <AlertCircle className="w-6 h-6 text-destructive" />
      <p>Error: {error.message}</p>
      <Button onClick={() => refetch()}>Coba Lagi</Button>
    </div>
  );
}
```

**Mutation Errors**:
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/audit", data),
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
    setLocation(`/audit/${data.id}`);
  },
});
```

### 8.6 Performance Optimizations

**Code Splitting** (Vite automatic):
```typescript
// Each route component is lazy-loaded
import HomePage from "./pages/HomePage"; // Bundled separately
```

**Memoization**:
```typescript
// Expensive calculations
const processedData = useMemo(() => {
  return complexCalculation(audit);
}, [audit]);

// Callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Debouncing** (search input):
```typescript
import { useDebounce } from "@/hooks/use-debounce";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300); // 300ms delay

// Only queries when user stops typing
const { data } = useQuery({
  queryKey: ["/api/audits/name", debouncedSearch],
  enabled: debouncedSearch.length > 0,
});
```

**Virtual Scrolling** (future enhancement for large lists):
```typescript
import { useVirtualizer } from "@tanstack/react-virtual";
// Render only visible items in long audit lists
```

---

## 9. Backend Architecture

### 9.1 Express Middleware Stack

```typescript
// server/index.ts

import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const app = express();

// 1. JSON body parser
app.use(express.json());

// 2. URL-encoded body parser
app.use(express.urlencoded({ extended: true }));

// 3. Session middleware (configured but auth not implemented)
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
  }),
  secret: process.env.SESSION_SECRET || "default-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// 4. Custom logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[express] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// 5. API routes
import { registerRoutes } from "./routes";
registerRoutes(app);

// 6. Vite middleware (development only)
if (process.env.NODE_ENV === "development") {
  const { setupVite } = await import("./vite");
  await setupVite(app);
}

// 7. Error handling middleware (implicit - Express default)
```

**Request Flow**:
```
HTTP Request
    │
    ▼
1. JSON Parser → req.body available
    │
    ▼
2. Session Middleware → req.session available (not used yet)
    │
    ▼
3. Logging Middleware → Console log
    │
    ▼
4. Route Handler → Custom business logic
    │
    ▼
5. Response sent → res.json() or res.status().json()
```

### 9.2 Storage Interface Pattern

**File**: `server/storage.ts`

**Interface Definition**:
```typescript
export interface IStorage {
  // Audit operations
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAllAudits(): Promise<Audit[]>;
  getAudit(id: string): Promise<Audit | undefined>;
  getAuditsByName(name: string): Promise<Audit[]>;
  deleteAudit(id: string): Promise<void>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(auditId: string): Promise<ChatMessage[]>;
  deleteChatHistory(auditId: string): Promise<void>;
}
```

**PostgreSQL Implementation**:
```typescript
export class PostgresStorage implements IStorage {
  private db: NodePgDatabase<typeof schema>;
  
  constructor(connectionString: string) {
    const client = new Pool({ connectionString });
    this.db = drizzle(client, { schema });
  }
  
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [created] = await this.db
      .insert(schema.audits)
      .values(audit)
      .returning();
    return created;
  }
  
  async getAllAudits(): Promise<Audit[]> {
    return this.db
      .select()
      .from(schema.audits)
      .orderBy(desc(schema.audits.createdAt));
  }
  
  // ... more methods
}
```

**Benefits**:
1. **Abstraction**: Easy to swap PostgreSQL for MongoDB, etc.
2. **Testability**: Mock storage for unit tests
3. **Type Safety**: TypeScript enforces interface contract

### 9.3 Error Handling Strategy

**Try-Catch Pattern**:
```typescript
app.post("/api/audit", async (req, res) => {
  try {
    // 1. Validation
    const data = auditSchema.parse(req.body);
    
    // 2. Business logic
    const processed = processAudit(data);
    
    // 3. Database operation
    const audit = await storage.createAudit(processed);
    
    // 4. Success response
    res.json(audit);
    
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      // Validation error
      res.status(400).json({
        error: "Validation error",
        details: fromZodError(error).message,
      });
    } else {
      // Unexpected error
      console.error("Error creating audit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
```

**OpenAI-Specific Error Handling**:
```typescript
try {
  const completion = await openai.chat.completions.create({...});
  // Success
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("rate") || errorMessage.includes("quota") || errorMessage.includes("429")) {
    res.status(429).json({
      error: "AI service rate limit",
      userMessage: "Maaf, layanan AI sedang mencapai batas penggunaan.",
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      userMessage: "Maaf, terjadi kesalahan saat menghubungi AI.",
    });
  }
}
```

### 9.4 OpenAI Integration Architecture

**Client Configuration** (`server/openai.ts`):
```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Chat Completion Flow**:
```
1. User sends message
   │
   ▼
2. Save user message to DB
   │
   ▼
3. Load chat history (last 10)
   │
   ▼
4. Build system prompt with audit context
   │
   ▼
5. Construct messages array:
   [
     { role: "system", content: systemPrompt },
     { role: "user", content: "first user message" },
     { role: "assistant", content: "first AI response" },
     ...
     { role: "user", content: "current message" }
   ]
   │
   ▼
6. Call OpenAI API:
   openai.chat.completions.create({
     model: "gpt-4o",
     messages: [...],
     max_tokens: 500,
     temperature: 0.7
   })
   │
   ▼
7. Extract response:
   completion.choices[0].message.content
   │
   ▼
8. Save AI response to DB
   │
   ▼
9. Return to frontend
```

**System Prompt Template**:
```typescript
const systemPrompt = `Anda adalah AI coach profesional untuk AISG (Audit Intelligence SG). 
Anda membantu karyawan memahami hasil audit performa mereka.

DATA AUDIT:
- Nama: ${audit.nama}
- Jabatan: ${audit.jabatan}
- Reality Score: ${audit.totalRealityScore}/90
- Profil: ${audit.profil}
- Zona: ${audit.zonaFinal}
- ProDem: ${audit.prodemRekomendasi.recommendation}

TUGAS ANDA:
1. Jawab pertanyaan tentang hasil audit dengan jelas dan supportif
2. Berikan insight actionable berdasarkan data audit
3. Motivasi karyawan untuk improve dengan tone profesional namun friendly
4. Jika ditanya tentang strategi improvement, refer ke Action Plan 30-60-90
5. Gunakan Bahasa Indonesia yang profesional

Jawab dengan concise (2-3 paragraf max), fokus pada value bukan panjang teks.`;
```

**Token Management**:
- Input tokens: System prompt + history ≈ 800-1000 tokens
- Output tokens: Max 500 (configured)
- Total cost per chat: ~$0.0025 (very cheap!)

---

## 10. Code Structure & Conventions

### 10.1 Directory Structure

```
aisg/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # shadcn components (Button, Card, etc.)
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── AuditCard.tsx
│   │   │   └── ...
│   │   ├── pages/            # Route components
│   │   │   ├── HomePage.tsx
│   │   │   ├── NewAudit.tsx
│   │   │   └── AuditDetail.tsx
│   │   ├── lib/              # Utilities
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── hooks/            # Custom hooks
│   │   │   └── use-toast.ts
│   │   ├── App.tsx           # Root component (router)
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles + Tailwind
│   └── index.html
│
├── server/                   # Backend Express application
│   ├── routes.ts             # API route handlers
│   ├── business-logic.ts     # Audit processing algorithms
│   ├── storage.ts            # Database abstraction (IStorage)
│   ├── openai.ts             # OpenAI client configuration
│   ├── index.ts              # Express server entry point
│   └── vite.ts               # Vite middleware (dev only)
│
├── shared/                   # Shared TypeScript code
│   └── schema.ts             # Drizzle schema + Zod validation
│
├── attached_assets/          # Knowledge base files
│   ├── 18_pilar_*.txt
│   ├── prodem_*.txt
│   ├── zodiac_*.txt
│   └── AISG_Manual_Book.txt
│
├── migrations/               # Database migrations (auto-generated)
│   └── 0000_*.sql
│
├── .config/                  # Config files
│
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
├── vite.config.ts            # Vite config
├── drizzle.config.ts         # Drizzle ORM config
├── replit.md                 # System documentation
└── AISG_Technical_Documentation.md  # This file
```

### 10.2 Naming Conventions

**Files**:
- React components: `PascalCase.tsx` (e.g., `HomePage.tsx`)
- Utilities: `camelCase.ts` (e.g., `queryClient.ts`)
- Config files: `kebab-case.ts` (e.g., `tailwind.config.ts`)

**Variables & Functions**:
- Variables: `camelCase` (e.g., `auditData`, `totalScore`)
- Functions: `camelCase` (e.g., `calculateRealityScore`, `generateSWOT`)
- React components: `PascalCase` (e.g., `ChatPanel`, `AuditCard`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_REALITY_SCORE = 90`)

**Types & Interfaces**:
- Types: `PascalCase` (e.g., `Audit`, `ChatMessage`)
- Interfaces: `PascalCase` with `I` prefix for abstract interfaces (e.g., `IStorage`)

**Database**:
- Table names: `camelCase` (e.g., `audits`, `chatMessages`)
- Column names: `snake_case` in SQL, `camelCase` in TypeScript (Drizzle handles mapping)

**API Routes**:
- RESTful conventions: `/api/resource` and `/api/resource/:id`
- Kebab-case for multi-word: `/api/chat-history` (not used currently)

### 10.3 TypeScript Patterns

**Shared Types** (`shared/schema.ts`):
```typescript
// Drizzle schema (source of truth)
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey(),
  nama: varchar("nama").notNull(),
  // ...
});

// Inferred types
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = typeof audits.$inferInsert;

// Zod schemas for validation
export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
});

export const selectAuditSchema = createSelectSchema(audits);
```

**Type Imports** (consistent across codebase):
```typescript
import type { Audit, ChatMessage } from "@shared/schema";
```

**Generic Typing**:
```typescript
// TanStack Query
const { data } = useQuery<Audit>({ queryKey: [...] });

// Array methods
const topPillars = pillarAnswers
  .sort((a, b) => b.selfScore - a.selfScore)
  .slice(0, 3)
  .map((p): string => getPillarName(p.pillarId));
```

### 10.4 Import Aliases

**Configured in `tsconfig.json` and `vite.config.ts`**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@assets/*": ["./attached_assets/*"]
    }
  }
}
```

**Usage**:
```typescript
// Instead of: import { Button } from "../../components/ui/button"
import { Button } from "@/components/ui/button";

// Instead of: import type { Audit } from "../../shared/schema"
import type { Audit } from "@shared/schema";

// Assets (images, etc.)
import logoPath from "@assets/logo.png";
```

### 10.5 Comment Conventions

**Minimal Comments** (code should be self-documenting):
```typescript
// ❌ Bad (obvious comment)
// Get audit by ID
const audit = await storage.getAudit(id);

// ✅ Good (explains "why", not "what")
// User message must be saved BEFORE calling OpenAI
// to ensure it persists even if API call fails
await storage.createChatMessage({ auditId, role: "user", content: message });
const aiResponse = await callOpenAI(message);
```

**Function Documentation** (JSDoc for complex functions):
```typescript
/**
 * Calculates Reality Score by summing all 18 Pilar self-assessment scores
 * @param pillarAnswers - Array of 18 pillar assessments (1-5 scale)
 * @returns Total score (0-90)
 */
function calculateRealityScore(pillarAnswers: PillarAnswer[]): number {
  return pillarAnswers.reduce((sum, p) => sum + p.selfScore, 0);
}
```

**TODO Comments**:
```typescript
// TODO: Add pagination for large audit lists
// TODO: Implement real-time streaming for AI responses
// FIXME: Handle edge case where all quarterly values are 0
```

---

## 11. Error Handling & Validation

### 11.1 Validation Layers

**Layer 1: Frontend (React Hook Form + Zod)**
```typescript
// Immediate feedback to user
const form = useForm({
  resolver: zodResolver(schema),
});

// Validation runs:
// - onChange (real-time)
// - onBlur (when field loses focus)
// - onSubmit (before API call)
```

**Layer 2: Backend (Zod)**
```typescript
// Server-side validation (defense in depth)
const schema = z.object({
  nama: z.string().min(1),
  marginTimQ1: z.number().min(0),
  // ...
});

const data = schema.parse(req.body);
// Throws ZodError if invalid
```

**Layer 3: Database (PostgreSQL Constraints)**
```sql
-- Enforced at DB level
nama VARCHAR(255) NOT NULL,
margin_tim_q1 INTEGER DEFAULT 0,
-- Foreign key constraints
audit_id VARCHAR REFERENCES audits(id) ON DELETE CASCADE
```

### 11.2 Error Response Standards

**Consistent Error Format**:
```typescript
// Validation error (400)
{
  error: "Validation error",
  details: "nama: Required field missing"
}

// Not found (404)
{
  error: "Audit not found"
}

// Rate limit (429)
{
  error: "AI service rate limit",
  userMessage: "Maaf, layanan AI sedang mencapai batas penggunaan."
}

// Server error (500)
{
  error: "Internal server error",
  userMessage: "Maaf, terjadi kesalahan. Silakan coba lagi."
}
```

**userMessage Field**:
- User-facing error message (Bahasa Indonesia)
- Only included for expected errors (quota, validation, etc.)
- Frontend displays this in toast notification

### 11.3 Logging Strategy

**Console Logging** (current):
```typescript
// Request logging
console.log("[express] GET /api/audits 200 in 45ms");

// Chat logging
console.log("[CHAT] Calling OpenAI API with messages:", messages.length);
console.log("[CHAT] OpenAI response received:", { choices: 1, content: "..." });

// Error logging
console.error("Error creating audit:", error);
```

**Structured Logging** (future enhancement):
```typescript
import winston from "winston";

logger.info("Audit created", {
  auditId: "123",
  userId: "456",
  timestamp: new Date(),
});

logger.error("OpenAI API failed", {
  error: error.message,
  auditId: "123",
  retries: 1,
});
```

---

## 12. Deployment & DevOps

### 12.1 Development Environment

**Setup**:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens Express (backend) + Vite (frontend) on http://localhost:5000
```

**Environment Variables** (`.env` - not committed):
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=random-secret
NODE_ENV=development
```

**Hot Module Replacement (HMR)**:
- Vite handles frontend HMR (instant updates)
- `tsx` watches server files (auto-restart on change)
- Database schema changes require manual migration

### 12.2 Database Migrations

**Workflow**:
```bash
# 1. Edit schema in shared/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Review migration in migrations/XXXX_*.sql
# 4. Apply migration (development)
npm run db:push

# 5. For production, use Replit Publishing UI
```

**Production Migration**:
- Replit detects schema changes during deployment
- Conflict resolution wizard appears
- Choose "Rename" or "Create new" for each column change
- Database migrated safely with zero downtime

### 12.3 Production Deployment (Replit)

**Deployment Process**:
```
1. Click "Deploy" button in Replit UI
   │
   ▼
2. PROVISION Phase
   ├─ Detect database changes
   ├─ Show conflict resolution wizard
   └─ Apply migrations
   │
   ▼
3. BUILD Phase
   ├─ Install dependencies (npm install)
   ├─ Run Vite build (npm run build)
   └─ Compile TypeScript
   │
   ▼
4. BUNDLE Phase
   ├─ Package frontend assets
   └─ Prepare server code
   │
   ▼
5. PROMOTE Phase
   ├─ Deploy to production URL
   ├─ Health check
   └─ Switch traffic to new version
   │
   ▼
6. DONE
   Production URL: https://aisg23.replit.app
```

**Environment** (Production):
- Node.js 20.x
- PostgreSQL 16 (Neon)
- Always-on (Replit Core plan)
- HTTPS automatic (Replit)
- Custom domain support (optional)

**Secrets Management**:
- Secrets stored in Replit Secrets (encrypted)
- Accessed via `process.env.SECRET_NAME`
- Not exposed in logs or client-side code

### 12.4 Monitoring & Observability

**Current Monitoring**:
- Replit built-in logs (console output)
- Browser console errors (client-side)
- HTTP status codes in logs

**Recommended Future Monitoring**:
1. **Application Performance Monitoring (APM)**:
   - New Relic, Datadog, or Sentry
   - Track API response times
   - Identify slow database queries

2. **Error Tracking**:
   - Sentry for both frontend and backend
   - Capture stack traces
   - Group similar errors

3. **Database Monitoring**:
   - Neon dashboard (query performance)
   - Slow query log
   - Connection pool stats

4. **Uptime Monitoring**:
   - Uptime Robot or Pingdom
   - Alert on downtime
   - Health check endpoint: `GET /health`

**Health Check Endpoint** (to implement):
```typescript
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await storage.getAllAudits();
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});
```

### 12.5 Backup & Recovery

**Database Backups**:
- Neon provides automatic backups (7-day retention on free tier)
- Manual backups: Export SQL dump via Neon dashboard
- Point-in-time recovery (PITR) available on paid plans

**Code Backups**:
- Git repository (Replit auto-commits)
- Manual git backup to GitHub/GitLab recommended

**Recovery Procedure**:
1. **Database Corruption**:
   - Restore from Neon backup (via dashboard)
   - Re-run migrations if needed

2. **Code Rollback**:
   - Revert to previous Git commit
   - Redeploy via Replit

3. **Full Disaster**:
   - Create new Replit instance
   - Restore database from backup
   - Deploy latest code

### 12.6 CI/CD Pipeline (Future)

**Recommended Setup**:
```yaml
# .github/workflows/ci.yml (if using GitHub)
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run typecheck
      - run: npm run test # (if tests exist)
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Replit
        run: |
          # Replit CLI deployment
          replit deploy
```

---

## 13. Security Considerations

### 13.1 Current Security Posture

**✅ Implemented**:
- HTTPS (automatic via Replit)
- Environment secrets (not in code)
- SQL injection prevention (Drizzle parameterized queries)
- XSS protection (React escapes by default)
- JSONB validation (Zod schemas)

**❌ Not Implemented (CRITICAL)**:
- Authentication (anyone can access all data)
- Authorization (no role-based access control)
- Rate limiting (vulnerable to DoS)
- CSRF protection
- Input sanitization (beyond Zod)
- Audit logging (who did what when)

### 13.2 Security Recommendations

**Priority 1: Authentication**
```typescript
// Implement session-based auth
import passport from "passport";
import LocalStrategy from "passport-local";

passport.use(new LocalStrategy(
  async (username, password, done) => {
    const user = await storage.getUserByUsername(username);
    if (!user) return done(null, false);
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return done(null, false);
    
    return done(null, user);
  }
));

// Protect routes
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.post("/api/audit", requireAuth, async (req, res) => {
  // Only authenticated users can create audits
});
```

**Priority 2: Authorization**
```typescript
// Role-based access control
const requireRole = (role: string) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Employees can only view their own audits
app.get("/api/audit/:id", requireAuth, async (req, res) => {
  const audit = await storage.getAudit(req.params.id);
  
  if (req.user.role !== "admin" && audit.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  res.json(audit);
});
```

**Priority 3: Rate Limiting**
```typescript
import rateLimit from "express-rate-limit";

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
}));

// Chat endpoint (stricter limit)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  // ...
});
```

**Priority 4: Input Sanitization**
```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitize user input before storing
const sanitizedMessage = DOMPurify.sanitize(req.body.message);
```

**Priority 5: CSRF Protection**
```typescript
import csrf from "csurf";

const csrfProtection = csrf({ cookie: true });

app.post("/api/audit", csrfProtection, async (req, res) => {
  // CSRF token validated automatically
});
```

### 13.3 Secrets Management

**Current**:
- Secrets stored in Replit Secrets (encrypted)
- Accessed via `process.env`

**Best Practices**:
```typescript
// ✅ Good
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY not configured");
}

// ❌ Bad (never log secrets!)
console.log("API Key:", process.env.OPENAI_API_KEY);

// ❌ Bad (never send to client!)
res.json({ apiKey: process.env.OPENAI_API_KEY });
```

**Secret Rotation**:
1. Generate new secret
2. Update in Replit Secrets
3. Restart application (automatic)
4. Revoke old secret

### 13.4 Data Privacy

**GDPR Considerations** (future):
- **Right to Access**: Provide audit data export
- **Right to Erasure**: Implement DELETE /api/audit/:id (already done)
- **Right to Portability**: PDF export (already done)
- **Consent Management**: Add consent checkboxes

**Encryption**:
- **In Transit**: HTTPS (Replit automatic)
- **At Rest**: Not implemented (PostgreSQL default storage)
  - Recommendation: Enable Neon encryption (paid plan)

**Audit Logging**:
```typescript
// Track who did what when
const auditLog = {
  userId: req.user.id,
  action: "CREATE_AUDIT",
  resourceId: audit.id,
  timestamp: new Date(),
  ipAddress: req.ip,
};
await storage.createAuditLog(auditLog);
```

---

## 14. Performance Optimization

### 14.1 Database Query Optimization

**Current Queries**:
```typescript
// Get all audits (could be slow with 10K+ audits)
const audits = await db
  .select()
  .from(schema.audits)
  .orderBy(desc(schema.audits.createdAt));
```

**Optimizations**:
```typescript
// Add pagination
const audits = await db
  .select()
  .from(schema.audits)
  .orderBy(desc(schema.audits.createdAt))
  .limit(20)
  .offset((page - 1) * 20);

// Add indexes (see Section 5.3)
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

// Select only needed columns (avoid SELECT *)
const audits = await db
  .select({
    id: schema.audits.id,
    nama: schema.audits.nama,
    zonaFinal: schema.audits.zonaFinal,
    createdAt: schema.audits.createdAt,
  })
  .from(schema.audits);
```

### 14.2 Frontend Optimization

**Current**:
- Code splitting (Vite automatic)
- React Query caching
- Lazy loading (not used yet)

**Future Optimizations**:
```typescript
// Lazy load routes
const HomePage = lazy(() => import("./pages/HomePage"));
const AuditDetail = lazy(() => import("./pages/AuditDetail"));

<Suspense fallback={<LoadingSpinner />}>
  <Routes />
</Suspense>

// Image optimization
import { Image } from "@/components/OptimizedImage";
<Image src="/logo.png" width={200} height={100} alt="Logo" />

// Virtual scrolling for large lists
import { useVirtualizer } from "@tanstack/react-virtual";
```

### 14.3 Caching Strategy

**Browser Caching** (Vite automatic):
```
Static assets (JS, CSS, images):
  Cache-Control: public, max-age=31536000, immutable
  (1 year cache with content hashing)
```

**API Response Caching** (future):
```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

app.get("/api/audits", async (req, res) => {
  const cached = cache.get("all-audits");
  if (cached) {
    return res.json(cached);
  }
  
  const audits = await storage.getAllAudits();
  cache.set("all-audits", audits);
  res.json(audits);
});

// Invalidate cache on mutation
app.post("/api/audit", async (req, res) => {
  const audit = await storage.createAudit(data);
  cache.del("all-audits"); // Invalidate
  res.json(audit);
});
```

**CDN** (future):
- Serve static assets via CDN (Cloudflare, etc.)
- Cache audit PDFs for repeat downloads

### 14.4 Bundle Size Optimization

**Current Bundle** (Vite production build):
```
dist/assets/index-[hash].js    ~250 KB (gzipped)
dist/assets/index-[hash].css   ~15 KB (gzipped)
```

**Optimizations**:
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Tree-shaking (automatic with Vite)
# Import only what you need
import { Button } from "@/components/ui/button";
// Instead of: import * as UI from "@/components/ui";

# Remove unused dependencies
npm prune
```

### 14.5 OpenAI API Optimization

**Current Cost**: ~$0.0025 per chat interaction

**Optimizations**:
```typescript
// 1. Reduce max_tokens (less output = lower cost)
max_tokens: 300, // Instead of 500

// 2. Cache common questions (future)
const commonQuestions = {
  "bagaimana performa saya": "Berdasarkan Reality Score Anda...",
  // ...
};

if (commonQuestions[message.toLowerCase()]) {
  return res.json({ response: commonQuestions[message.toLowerCase()] });
}

// 3. Use cheaper model for simple questions (future)
const isSimple = message.length < 50;
const model = isSimple ? "gpt-3.5-turbo" : "gpt-4o";

// 4. Batch multiple questions (future)
// Allow users to ask multiple questions in one call
```

---

## 15. Testing Strategy

### 15.1 Current Testing Status

**✅ E2E Testing** (Manual via Playwright):
- Audit creation flow (5 steps)
- AI chat interaction
- PDF download
- Audit deletion

**❌ Not Implemented**:
- Unit tests
- Integration tests
- Automated E2E tests
- Load testing

### 15.2 Recommended Testing Pyramid

```
        /\
       /E2E\         10% - Full user flows
      /______\
     /        \
    /Integration\   30% - API + DB + External services
   /______________\
  /                \
 /   Unit Tests     \ 60% - Business logic, utilities
/____________________\
```

### 15.3 Unit Testing Setup

**Framework**: Vitest (Vite-native)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Unit Tests**:
```typescript
// server/business-logic.test.ts
import { describe, it, expect } from "vitest";
import { calculateRealityScore } from "./business-logic";

describe("calculateRealityScore", () => {
  it("should sum all pillar scores", () => {
    const pillars = [
      { pillarId: 1, selfScore: 3 },
      { pillarId: 2, selfScore: 4 },
      { pillarId: 3, selfScore: 5 },
    ];
    
    expect(calculateRealityScore(pillars)).toBe(12);
  });
  
  it("should return 0 for empty array", () => {
    expect(calculateRealityScore([])).toBe(0);
  });
  
  it("should handle max score (90)", () => {
    const pillars = Array.from({ length: 18 }, (_, i) => ({
      pillarId: i + 1,
      selfScore: 5,
    }));
    
    expect(calculateRealityScore(pillars)).toBe(90);
  });
});
```

**Component Tests**:
```typescript
// client/src/components/AuditCard.test.tsx
import { render, screen } from "@testing-library/react";
import { AuditCard } from "./AuditCard";

describe("AuditCard", () => {
  it("should display audit name", () => {
    const audit = {
      id: "123",
      nama: "John Doe",
      zonaFinal: "success",
      // ...
    };
    
    render(<AuditCard audit={audit} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
  
  it("should show success badge for success zone", () => {
    const audit = { /* ... */ zonaFinal: "success" };
    render(<AuditCard audit={audit} />);
    expect(screen.getByText(/hijau/i)).toBeInTheDocument();
  });
});
```

### 15.4 Integration Testing

**API Tests** (Supertest):
```typescript
import request from "supertest";
import { app } from "./server";

describe("POST /api/audit", () => {
  it("should create audit and return calculated results", async () => {
    const response = await request(app)
      .post("/api/audit")
      .send({
        nama: "Test User",
        jabatan: "Business Manager",
        // ... full audit data
      })
      .expect(200);
    
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("totalRealityScore");
    expect(response.body.zonaFinal).toMatch(/success|warning|critical/);
  });
  
  it("should return 400 for invalid data", async () => {
    await request(app)
      .post("/api/audit")
      .send({ nama: "" }) // Missing required fields
      .expect(400);
  });
});
```

### 15.5 E2E Testing (Playwright)

**Setup**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Example E2E Test**:
```typescript
// e2e/audit-creation.spec.ts
import { test, expect } from "@playwright/test";

test("should create audit and display results", async ({ page }) => {
  // Navigate to new audit page
  await page.goto("http://localhost:5000/new-audit");
  
  // Step 1: Personal Info
  await page.fill('[data-testid="input-nama"]', "Test User");
  await page.selectOption('[data-testid="select-jabatan"]', "Business Manager");
  await page.fill('[data-testid="input-cabang"]', "Jakarta");
  await page.fill('[data-testid="input-tanggal-lahir"]', "15-08-1990");
  await page.click('[data-testid="button-next"]');
  
  // Step 2-4: Fill remaining steps (omitted for brevity)
  // ...
  
  // Step 5: Submit
  await page.click('[data-testid="button-submit"]');
  
  // Verify redirect to detail page
  await expect(page).toHaveURL(/\/audit\/.+/);
  
  // Verify audit data displayed
  await expect(page.getByText("Test User")).toBeVisible();
  await expect(page.getByText(/Reality Score/i)).toBeVisible();
});
```

### 15.6 Load Testing

**Tool**: k6 or Artillery

**Example Load Test**:
```javascript
// load-test.js (k6)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '1m', // Run for 1 minute
};

export default function () {
  const res = http.get('https://aisg23.replit.app/api/audits');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Run**:
```bash
k6 run load-test.js
```

---

## 16. Troubleshooting Guide

### 16.1 Common Development Issues

**Issue 1: "Module not found" errors**

```
Error: Cannot find module '@/components/ui/button'
```

**Solution**:
1. Check `tsconfig.json` paths are configured
2. Restart TypeScript server in IDE
3. Clear Vite cache: `rm -rf node_modules/.vite`

---

**Issue 2: Database connection errors**

```
Error: connect ECONNREFUSED
```

**Solution**:
1. Verify `DATABASE_URL` in `.env`
2. Check Neon dashboard (database active?)
3. Test connection: `npm run db:studio`

---

**Issue 3: OpenAI API quota errors**

```
429 Error: You exceeded your current quota
```

**Solution**:
1. Check usage: https://platform.openai.com/usage
2. Top up credits: https://platform.openai.com/settings/organization/billing
3. Temporary fix: Comment out AI chat feature

---

**Issue 4: Vite HMR not working**

```
[vite] hmr update failed
```

**Solution**:
1. Hard refresh browser: Ctrl+Shift+R
2. Restart dev server: Stop + `npm run dev`
3. Clear browser cache

---

### 16.2 Production Deployment Issues

**Issue 1: Database migration conflicts**

**Symptom**: Replit Publishing shows conflict wizard

**Solution**:
1. For renamed columns: Select "Rename column X to Y"
2. For new columns: Select "Create new column X"
3. NEVER select wrong option (data loss!)

---

**Issue 2: Build fails with TypeScript errors**

**Symptom**: Deployment stuck at BUILD phase

**Solution**:
1. Run `npm run typecheck` locally
2. Fix all TypeScript errors
3. Push fixes and redeploy

---

**Issue 3: 500 errors in production**

**Symptom**: API calls failing in production but working locally

**Solution**:
1. Check Replit logs (Publishing tab → Logs)
2. Verify environment secrets are set
3. Check database connection
4. Rollback deployment if needed

---

### 16.3 Performance Issues

**Issue 1: Slow API responses (>2 seconds)**

**Diagnostic**:
1. Check Replit logs for slow database queries
2. Use Neon dashboard to identify slow queries
3. Check OpenAI API latency

**Solution**:
1. Add database indexes (see Section 5.3)
2. Implement pagination for large datasets
3. Add caching layer (see Section 14.3)

---

**Issue 2: Frontend slow loading**

**Diagnostic**:
1. Check Network tab in browser DevTools
2. Look for large bundle sizes
3. Check for unnecessary re-renders (React DevTools)

**Solution**:
1. Lazy load routes (see Section 14.2)
2. Optimize images (compress, use WebP)
3. Memoize expensive components

---

### 16.4 Security Issues

**Issue 1: Unauthorized access to audits**

**Current Status**: KNOWN ISSUE (no authentication)

**Mitigation**:
1. Deploy behind VPN (for internal use only)
2. Implement authentication ASAP (see Section 13.2)

---

**Issue 2: CORS errors**

**Symptom**: Frontend can't call backend API

**Solution**:
```typescript
// server/index.ts
import cors from "cors";

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  credentials: true,
}));
```

---

### 16.5 Debugging Checklist

**Before asking for help**:
- [ ] Check browser console for errors (F12)
- [ ] Check server logs in Replit
- [ ] Verify environment secrets are set
- [ ] Try in incognito mode (rule out cache issues)
- [ ] Check database connection (Neon dashboard)
- [ ] Verify API endpoints (curl or Postman)
- [ ] Check Git history for recent changes
- [ ] Try rollback to previous working version

**When reporting bugs**:
- Include error message (full stack trace)
- Include steps to reproduce
- Include browser/OS information
- Include screenshots if UI issue
- Include request/response (Network tab)

---

## Appendix A: Glossary

**18 Pilar**: Standardized framework of 18 competency categories for employee assessment

**Reality Score**: Total sum of 18 Pilar self-assessment scores (0-90)

**Zona (Zone)**: Performance classification (Success/Warning/Critical) indicated by color (🟩🟨🟥)

**ProDem**: Promotion-Demotion recommendation system based on audit results

**EWS**: Early Warning System for detecting performance risks

**Magic Section**: Gamification feature with zodiac-based motivational content

**BSM (Business Manager)**: Job title / position level

**NA (New Account)**: Number of new customers acquired (Nasabah Baru)

**Margin**: Revenue or profit margin (in Rupiah)

**Q1-Q4**: Quarterly periods (Quarter 1 through Quarter 4)

---

## Appendix B: Quick Reference

**Start Development**:
```bash
npm run dev
```

**Database Commands**:
```bash
npm run db:generate    # Create migration
npm run db:push        # Apply changes to dev DB
npm run db:studio      # Open DB GUI
```

**Type Checking**:
```bash
npm run typecheck
```

**Production URL**:
```
https://aisg23.replit.app
```

**Key Files**:
- Business Logic: `server/business-logic.ts`
- API Routes: `server/routes.ts`
- Database Schema: `shared/schema.ts`
- Main Frontend: `client/src/App.tsx`

---

## Appendix C: External Resources

**Documentation**:
- React: https://react.dev
- TanStack Query: https://tanstack.com/query/latest
- Drizzle ORM: https://orm.drizzle.team
- shadcn/ui: https://ui.shadcn.com
- OpenAI API: https://platform.openai.com/docs

**Support**:
- Replit Docs: https://docs.replit.com
- Neon Docs: https://neon.tech/docs

---

**END OF TECHNICAL DOCUMENTATION**

For user-facing documentation, see `AISG_Manual_Book.txt`.

For system overview, see `replit.md`.
