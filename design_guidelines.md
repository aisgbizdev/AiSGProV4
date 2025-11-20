# AISG Design Guidelines
## Audit Intelligence Platform - Corporate Enterprise System

---

## Design Approach

**Selected Approach**: Material Design System (Data-Dense Enterprise Application)

**Justification**: AISG is a utility-focused, information-dense performance auditing platform requiring clear data hierarchy, consistent visual feedback, and professional corporate aesthetics. Material Design provides excellent support for data visualization, status indicators, and enterprise workflows.

**Key Design Principles**:
- Clarity and data hierarchy above decorative elements
- Instant visual feedback through zone color-coding
- Professional corporate identity reflecting SG organizational standards
- Efficient workflows for audit processing and report generation

---

## Core Design Elements

### A. Color Palette

**Brand & Primary Colors**:
- Primary: `220 70% 45%` (Corporate Blue - professional, trustworthy)
- Primary Light: `220 65% 55%` (for hover states)
- Primary Dark: `220 75% 35%` (for active states)

**Zone Status Colors** (Critical for audit results):
- Success Zone (🟩): `142 70% 45%` (Green - optimal performance)
- Warning Zone (🟨): `45 95% 55%` (Amber - needs attention)
- Critical Zone (🟥): `0 70% 55%` (Red - requires intervention)

**Neutral Palette** (Dark Mode Focused):
- Background: `220 15% 10%` (Deep slate)
- Surface: `220 12% 15%` (Elevated cards)
- Surface Variant: `220 10% 20%` (Tertiary containers)
- Border: `220 8% 25%` (Subtle divisions)
- Text Primary: `0 0% 95%`
- Text Secondary: `220 5% 70%`
- Text Muted: `220 5% 55%`

**Accent Colors** (Minimal use):
- Accent: `280 60% 55%` (Purple for Magic Section highlights only)

---

### B. Typography

**Font Families**:
- Primary: 'Inter' (Google Fonts) - Clean, modern, excellent for data
- Mono: 'JetBrains Mono' (for audit IDs, codes, timestamps)

**Type Scale**:
- Display: 3rem (48px), font-weight: 700 - Dashboard headers
- Heading 1: 2.25rem (36px), font-weight: 600 - Section titles
- Heading 2: 1.875rem (30px), font-weight: 600 - Card headers
- Heading 3: 1.5rem (24px), font-weight: 500 - Subsections
- Body Large: 1.125rem (18px), font-weight: 400 - Primary content
- Body: 1rem (16px), font-weight: 400 - Default text
- Body Small: 0.875rem (14px), font-weight: 400 - Secondary info
- Caption: 0.75rem (12px), font-weight: 500 - Labels, metadata

---

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16** consistently
- Micro spacing: p-4, gap-4 (16px) - Within cards
- Section padding: py-8, px-6 (32px/24px) - Card containers
- Page margins: py-12, px-8 (48px/32px) - Main containers
- Large gaps: gap-8, space-y-12 (32px/48px) - Between sections

**Grid Structure**:
- Dashboard: 12-column grid with gap-6
- Audit cards: 3-column on desktop (lg:grid-cols-3), 1-column mobile
- Report layout: 2-column split (form + preview or data + chart)
- Max container width: max-w-7xl (1280px)

---

### D. Component Library

**Navigation**:
- Top navbar: Fixed, dark surface with logo, main nav items, user profile
- Sidebar (dashboard): Collapsible, icons + labels, active state highlighting
- Breadcrumbs: For audit drill-down (Dashboard > Audits > Report #123)

**Cards & Containers**:
- Audit Summary Card: Zone-color left border (4px), surface background, p-6
- Stat Cards: Large number display, label, trend indicator (↑↓)
- Report Container: White/light surface with subtle shadow, rounded corners
- Magic Section Card: Accent purple gradient border, slightly elevated

**Data Display**:
- Tables: Striped rows, sticky headers, sortable columns, zone color badges
- Charts: Line/bar charts for performance trends (use Chart.js or similar)
- Progress Bars: Zone-colored, percentage labels, smooth animations
- Status Badges: Pill-shaped, zone colors, bold text

**Forms**:
- Input Fields: Dark background, light border, focus state with primary color glow
- Select Dropdowns: Custom styled, search capability for long lists
- Date Picker: Calendar modal for tanggal_lahir input
- Multi-step Form: Progress indicator, clear section divisions

**Buttons**:
- Primary: Solid primary color, white text, rounded-lg
- Secondary: Outline with primary color, hover fill
- Danger: Red for critical actions (demosi recommendations)
- Success: Green for approvals

**Feedback Elements**:
- Toast Notifications: Top-right, zone-colored, auto-dismiss
- Loading States: Skeleton screens for data tables, spinner for actions
- Empty States: Centered icon + message for no audit data

**Overlays**:
- Modals: Centered, max-w-2xl, for detailed audit reviews
- Drawer: Right-side slide for quick actions, filters
- Tooltips: Minimal, dark background, explain ProDem criteria

---

### E. Animations

**Minimal, purposeful only**:
- Card hover: Subtle lift (translate-y-1) + shadow increase
- Zone transitions: Smooth color fade when status changes
- Loading: Gentle pulse for skeleton screens
- Page transitions: Simple fade-in for route changes
- NO decorative animations, scrolling effects, or complex interactions

---

## Page-Specific Layouts

### Dashboard (Main View)
- **Hero Stats Row**: 4 stat cards (Total Audits, Active Users, Avg Score, Pending Reviews)
- **Performance Overview**: Line chart showing monthly trends
- **Recent Audits Table**: Latest 10 audits with quick actions
- **Zone Distribution**: Pie/donut chart showing 🟩🟨🟥 breakdown
- **Quick Actions Panel**: Start New Audit, View Reports, Export Data

### Audit Input Form
- **Multi-step wizard**:
  1. Identity (Nama, Jabatan, Cabang)
  2. Quarter Metrics (Margin, BC counts)
  3. 18 Pilar Questions (grouped by theme)
  4. Magic Section (Tanggal Lahir)
  5. Review & Submit
- **Progress bar** at top, clear step labels
- **Validation** with inline error messages

### Audit Report View
- **Header**: Audit ID, timestamp, user identity card
- **Zone Indicators**: Large, prominent 🟩🟨🟥 badges for both zones
- **Profile Badge**: Leader/Visionary/Performer/At-Risk with icon
- **Metrics Grid**: Margin, BC stats in 2x2 layout
- **18 Pilar Breakdown**: Accordion/expandable sections with YA/SEBAGIAN/TIDAK
- **Magic Section**: Purple-accented card with Zodiak + Booster + Quote
- **ProDem Recommendation**: Clear call-out box with next steps
- **Export Button**: PDF download, prominent placement

### Images
No large hero images required for this enterprise dashboard. Use:
- **Icon illustrations** for empty states (simple, line-style)
- **Small avatar/profile images** for user cards
- **Logo** in navigation header
- **Charts/graphs** as primary visual elements (data-driven)

---

## Mobile Responsiveness
- Stack all multi-column layouts to single column on mobile
- Sticky navigation with hamburger menu
- Swipeable cards for audit browsing
- Bottom sheet for quick actions instead of modals
- Touch-friendly tap targets (min 44px height)

---

This design system creates a **professional, data-focused audit platform** with clear visual hierarchy, efficient workflows, and immediate status recognition through color-coding—perfectly suited for the AISG enterprise environment.