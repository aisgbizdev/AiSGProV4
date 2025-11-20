/**
 * Business Logic Module
 * 
 * Contains all business rules for audit calculations:
 * - Reality Score calculation from performance data
 * - Zone Analysis (Kinerja, Perilaku, Final)
 * - Profile mapping (Leader, Visionary, Performer, At-Risk)
 * - ProDem recommendations (Promosi, Dipertahankan, Pembinaan, Demosi)
 * 
 * All formulas provided by architect review (Task 13 planning)
 */

import type { MonthlyPerformance } from "@shared/schema";

// ============================================================================
// QUARTERLY AGGREGATION HELPER
// ============================================================================

/**
 * Aggregate 3 months of performance data into quarterly totals
 * 
 * @param monthlyPerformance - Array of 3 MonthlyPerformance records
 * @returns Aggregated quarterly performance
 */
export function aggregateQuarterlyPerformance(
  monthlyPerformance: MonthlyPerformance[]
): {
  marginPersonalQ: string;
  naPersonalQ: number;
  marginTeamQ: string;
  naTeamQ: number;
} {
  if (monthlyPerformance.length < 3) {
    throw new Error("Quarterly aggregation requires 3 months of data");
  }

  // Sum all 3 months
  const marginPersonalQ = monthlyPerformance
    .reduce((sum, month) => sum + (parseFloat(month.marginPersonal) || 0), 0)
    .toFixed(2);

  const naPersonalQ = monthlyPerformance
    .reduce((sum, month) => sum + (month.naPersonal || 0), 0);

  const marginTeamQ = monthlyPerformance
    .reduce((sum, month) => sum + (parseFloat(month.marginTeam || "0") || 0), 0)
    .toFixed(2);

  const naTeamQ = monthlyPerformance
    .reduce((sum, month) => sum + (month.naTeam || 0), 0);

  return {
    marginPersonalQ,
    naPersonalQ,
    marginTeamQ,
    naTeamQ,
  };
}

// ============================================================================
// REALITY SCORE CALCULATION
// ============================================================================

/**
 * Performance achievement ratio thresholds for score mapping
 * Based on quarterly performance vs targets
 */
const PERFORMANCE_SCORE_THRESHOLDS = {
  EXCELLENT: { min: 1.10, score: 5 }, // >110% achievement
  GOOD: { min: 0.81, max: 1.10, score: 4 }, // 81-110%
  ADEQUATE: { min: 0.61, max: 0.80, score: 3 }, // 61-80%
  POOR: { min: 0, max: 0.60, score: 2 }, // ≤60%
  DEFAULT: 3, // Default when no data
} as const;

/**
 * Convert performance achievement ratio (0-2+) to reality score (1-5)
 */
function performanceRatioToScore(ratio: number): number {
  if (ratio >= PERFORMANCE_SCORE_THRESHOLDS.EXCELLENT.min) return PERFORMANCE_SCORE_THRESHOLDS.EXCELLENT.score;
  if (ratio >= PERFORMANCE_SCORE_THRESHOLDS.GOOD.min) return PERFORMANCE_SCORE_THRESHOLDS.GOOD.score;
  if (ratio >= PERFORMANCE_SCORE_THRESHOLDS.ADEQUATE.min) return PERFORMANCE_SCORE_THRESHOLDS.ADEQUATE.score;
  return PERFORMANCE_SCORE_THRESHOLDS.POOR.score;
}

/**
 * Calculate reality score for a single pilar based on performance data
 * 
 * Mapping logic:
 * - Category A (Kinerja Individu): Based on personal margin + NA achievement
 * - Category B (Perilaku & Karakter): Behavioral - use selfScore (no performance mapping)
 * - Category C (Kerja Tim & Leadership): Based on team margin + NA achievement
 * 
 * @param pillarId - Pilar ID (1-18)
 * @param category - Pilar category ("A", "B", "C")
 * @param selfScore - Employee's self-assessment score (1-5)
 * @param quarterlyPerformance - Aggregated quarterly performance data
 * @returns Reality score (1-5)
 */
export function calculatePillarRealityScore(
  pillarId: number,
  category: "A" | "B" | "C",
  selfScore: number,
  quarterlyPerformance: {
    marginPersonalQ: string;
    naPersonalQ: number;
    marginTeamQ: string;
    naTeamQ: number;
    // Targets (from business plan or historical averages)
    targetMarginPersonal?: number;
    targetNAPersonal?: number;
    targetMarginTeam?: number;
    targetNATeam?: number;
  }
): number {
  // Category B (Perilaku & Karakter) - behavioral traits, no performance mapping
  if (category === "B") {
    return selfScore; // Use self-assessment for behavioral categories
  }

  // Parse performance values
  const marginPersonal = parseFloat(quarterlyPerformance.marginPersonalQ) || 0;
  const naPersonal = quarterlyPerformance.naPersonalQ || 0;
  const marginTeam = parseFloat(quarterlyPerformance.marginTeamQ) || 0;
  const naTeam = quarterlyPerformance.naTeamQ || 0;

  // Category A (Kinerja Individu) - performance-based
  if (category === "A") {
    // Use targets if available, otherwise use self-score as baseline
    if (!quarterlyPerformance.targetMarginPersonal && !quarterlyPerformance.targetNAPersonal) {
      return selfScore; // No targets = use self-assessment
    }

    // Calculate achievement ratios
    const marginRatio = quarterlyPerformance.targetMarginPersonal
      ? marginPersonal / quarterlyPerformance.targetMarginPersonal
      : 1.0;

    const naRatio = quarterlyPerformance.targetNAPersonal
      ? naPersonal / quarterlyPerformance.targetNAPersonal
      : 1.0;

    // Weight: 70% margin, 30% NA (configurable per business needs)
    const combinedRatio = marginRatio * 0.7 + naRatio * 0.3;

    return performanceRatioToScore(combinedRatio);
  }

  // Category C (Kerja Tim & Leadership) - team performance-based
  if (category === "C") {
    // Use targets if available, otherwise use self-score as baseline
    if (!quarterlyPerformance.targetMarginTeam && !quarterlyPerformance.targetNATeam) {
      return selfScore; // No targets = use self-assessment
    }

    // Calculate team achievement ratios
    const marginRatio = quarterlyPerformance.targetMarginTeam
      ? marginTeam / quarterlyPerformance.targetMarginTeam
      : 1.0;

    const naRatio = quarterlyPerformance.targetNATeam
      ? naTeam / quarterlyPerformance.targetNATeam
      : 1.0;

    // Weight: 70% margin, 30% NA
    const combinedRatio = marginRatio * 0.7 + naRatio * 0.3;

    return performanceRatioToScore(combinedRatio);
  }

  // Fallback (should never reach here)
  return selfScore;
}

/**
 * Calculate gap between reality score and self score
 * 
 * Gap logic:
 * - Positive gap: Reality > Self (under-estimated performance)
 * - Negative gap: Reality < Self (over-estimated performance)
 * - For behavioral categories (B), cap negative gaps at 0 (no penalty)
 * 
 * @returns Gap value (can be negative for performance categories)
 */
export function calculatePillarGap(
  realityScore: number,
  selfScore: number,
  category: "A" | "B" | "C"
): number {
  const gap = realityScore - selfScore;

  // Cap negative gaps at 0 for behavioral categories
  if (category === "B" && gap < 0) {
    return 0;
  }

  return gap;
}

/**
 * Generate insight text for a pilar based on gap analysis
 * 
 * MVP: Simple template-based insights
 * TODO Phase 2: AI-generated personalized insights
 */
export function generatePillarInsight(
  pillarName: string,
  selfScore: number,
  realityScore: number,
  gap: number,
  category: "A" | "B" | "C"
): string {
  // Large positive gap (under-estimated)
  if (gap >= 1.5) {
    return `Performa ${pillarName} melebihi ekspektasi Anda (+${gap.toFixed(1)}). Kekuatan yang perlu dipertahankan!`;
  }

  // Small positive gap
  if (gap > 0 && gap < 1.5) {
    return `${pillarName} menunjukkan performa sedikit lebih baik dari self-assessment. Terus tingkatkan!`;
  }

  // Aligned (gap near zero)
  if (gap >= -0.5 && gap <= 0) {
    return `Self-assessment ${pillarName} akurat dengan realitas performa. Pertahankan konsistensi!`;
  }

  // Negative gap (over-estimated)
  if (gap < -0.5 && gap >= -1.5) {
    return `Ada gap kecil di ${pillarName}. Fokuskan perbaikan untuk mencapai target self-assessment.`;
  }

  // Large negative gap
  if (gap < -1.5) {
    return `Gap signifikan di ${pillarName} (-${Math.abs(gap).toFixed(1)}). Perlu action plan intensif untuk improvement.`;
  }

  return `${pillarName}: Analisis lebih lanjut diperlukan.`;
}

// ============================================================================
// ZONE ANALYSIS
// ============================================================================

/**
 * Zone thresholds for success/warning/critical classification
 * Based on average reality scores (1-5 scale)
 */
const ZONE_THRESHOLDS = {
  SUCCESS: 4.0, // ≥4.0 = Success Zone (Green)
  WARNING: 3.0, // 3.0-3.99 = Warning Zone (Yellow)
  // <3.0 = Critical Zone (Red)
} as const;

export type ZonaType = "success" | "warning" | "critical";

/**
 * Determine zone based on average score
 */
function scoreToZone(avgScore: number): ZonaType {
  if (avgScore >= ZONE_THRESHOLDS.SUCCESS) return "success";
  if (avgScore >= ZONE_THRESHOLDS.WARNING) return "warning";
  return "critical";
}

/**
 * Calculate Zona Kinerja from categories A + B weighted average
 * Weight: A (60%), B (40%)
 */
export function calculateZonaKinerja(pillarScores: Array<{
  category: "A" | "B" | "C";
  realityScore: number;
}>): ZonaType {
  const categoryA = pillarScores.filter(p => p.category === "A");
  const categoryB = pillarScores.filter(p => p.category === "B");

  if (categoryA.length === 0 || categoryB.length === 0) {
    throw new Error("Missing category A or B pillars for Zona Kinerja calculation");
  }

  // Calculate averages
  const avgA = categoryA.reduce((sum, p) => sum + p.realityScore, 0) / categoryA.length;
  const avgB = categoryB.reduce((sum, p) => sum + p.realityScore, 0) / categoryB.length;

  // Weighted average: A (60%), B (40%)
  const weightedAvg = avgA * 0.6 + avgB * 0.4;

  return scoreToZone(weightedAvg);
}

/**
 * Calculate Zona Perilaku from category C average
 */
export function calculateZonaPerilaku(pillarScores: Array<{
  category: "A" | "B" | "C";
  realityScore: number;
}>): ZonaType {
  const categoryC = pillarScores.filter(p => p.category === "C");

  if (categoryC.length === 0) {
    throw new Error("Missing category C pillars for Zona Perilaku calculation");
  }

  const avgC = categoryC.reduce((sum, p) => sum + p.realityScore, 0) / categoryC.length;

  return scoreToZone(avgC);
}

/**
 * Calculate Zona Final with cascade rules
 * 
 * Blend: 70% Kinerja + 30% Perilaku
 * Cascade rules:
 * - ANY critical → Final is critical
 * - warning + success → Final is warning
 */
export function calculateZonaFinal(
  zonaKinerja: ZonaType,
  zonaPerilaku: ZonaType,
  pillarScores: Array<{ category: "A" | "B" | "C"; realityScore: number }>
): ZonaType {
  // Cascade rule: Any critical → Final is critical
  if (zonaKinerja === "critical" || zonaPerilaku === "critical") {
    return "critical";
  }

  // Cascade rule: warning + success → Final is warning
  if (
    (zonaKinerja === "warning" && zonaPerilaku === "success") ||
    (zonaKinerja === "success" && zonaPerilaku === "warning")
  ) {
    return "warning";
  }

  // Both success → Final is success
  if (zonaKinerja === "success" && zonaPerilaku === "success") {
    return "success";
  }

  // Both warning → Calculate weighted average (70% Kinerja, 30% Perilaku)
  const categoryA = pillarScores.filter(p => p.category === "A");
  const categoryB = pillarScores.filter(p => p.category === "B");
  const categoryC = pillarScores.filter(p => p.category === "C");

  const avgA = categoryA.reduce((sum, p) => sum + p.realityScore, 0) / categoryA.length;
  const avgB = categoryB.reduce((sum, p) => sum + p.realityScore, 0) / categoryB.length;
  const avgC = categoryC.reduce((sum, p) => sum + p.realityScore, 0) / categoryC.length;

  // Kinerja = weighted A(60%) + B(40%)
  const kinerjaScore = avgA * 0.6 + avgB * 0.4;
  // Perilaku = C average
  const perilakuScore = avgC;

  // Final = 70% Kinerja + 30% Perilaku
  const finalWeightedAvg = kinerjaScore * 0.7 + perilakuScore * 0.3;

  return scoreToZone(finalWeightedAvg);
}

// ============================================================================
// PROFILE MAPPING
// ============================================================================

export type ProfileType = "Leader" | "Visionary" | "Performer" | "At-Risk";

/**
 * Determine employee profile based on reality score average and gap patterns
 * 
 * Mapping logic:
 * - Leader: ≥4.2 avg & gap ≤0.5 (high performer, accurate self-awareness)
 * - Visionary: 3.6-4.19 avg (strong performer)
 * - Performer: 3.0-3.59 OR gap >1.0 (solid performer or needs calibration)
 * - At-Risk: <3.0 avg (needs significant improvement)
 */
export function calculateProfile(
  pillarScores: Array<{ realityScore: number; gap: number }>
): ProfileType {
  const avgScore = pillarScores.reduce((sum, p) => sum + p.realityScore, 0) / pillarScores.length;
  // Use mean of ABSOLUTE gaps (not absolute of mean gaps) - prevents cancellation
  const avgGap = pillarScores.reduce((sum, p) => sum + Math.abs(p.gap), 0) / pillarScores.length;

  // Leader: High performance + accurate self-awareness
  if (avgScore >= 4.2 && avgGap <= 0.5) {
    return "Leader";
  }

  // Visionary: Strong performance
  if (avgScore >= 3.6 && avgScore < 4.2) {
    return "Visionary";
  }

  // Performer: Solid performance OR needs self-awareness calibration
  if ((avgScore >= 3.0 && avgScore < 3.6) || avgGap > 1.0) {
    return "Performer";
  }

  // At-Risk: Needs improvement
  return "At-Risk";
}

// ============================================================================
// PRODEM RECOMMENDATION
// ============================================================================

export type ProdemRecommendation = "Promosi" | "Dipertahankan" | "Pembinaan" | "Demosi";

export interface ProdemResult {
  currentPosition: string;
  recommendation: ProdemRecommendation;
  nextPosition?: string;
  reason: string;
  konsekuensi: string;
  nextStep: string;
  requirements: Array<{
    label: string;
    value: string;
    met: boolean;
  }>;
}

/**
 * Generate ProDem recommendation based on zones, profile, and performance trends
 * 
 * Logic:
 * - Success zone:
 *   - Promosi: If Leader profile + sustained over-target margin
 *   - Dipertahankan: Otherwise
 * - Warning zone:
 *   - Pembinaan: Standard
 *   - Demosi: If large downward trend detected
 * - Critical zone:
 *   - Demosi: Standard
 *   - Pembinaan: If tenure <6 months (new employee grace period)
 */
export function calculateProDemRecommendation(
  zonaFinal: ZonaType,
  profile: ProfileType,
  currentPosition: string,
  pillarScores: Array<{
    pillarId: number;
    pillarName: string;
    category: "A" | "B" | "C";
    realityScore: number;
    gap: number;
  }>,
  options: {
    marginOverTarget?: boolean; // Is margin consistently over target?
    employeeTenureMonths?: number; // Employee tenure in months
    nextPositionName?: string; // Next position if promotion
  } = {}
): ProdemResult {
  const { marginOverTarget = false, employeeTenureMonths = 12, nextPositionName } = options;

  // Success Zone
  if (zonaFinal === "success") {
    // Promosi: Leader + sustained over-target
    if (profile === "Leader" && marginOverTarget) {
      return {
        currentPosition,
        recommendation: "Promosi",
        nextPosition: nextPositionName,
        reason: "Performa konsisten di Success Zone dengan profile Leader. Margin melebihi target secara berkelanjutan.",
        konsekuensi: "Promosi ke posisi lebih tinggi untuk memaksimalkan potensi kepemimpinan.",
        nextStep: "Persiapan onboarding role baru, knowledge transfer, dan succession planning.",
        requirements: [
          {
            label: "Avg Reality Score",
            value: "≥4.2",
            met: true,
          },
          {
            label: "Zona Final",
            value: "Success",
            met: true,
          },
          {
            label: "Margin Achievement",
            value: ">110% target",
            met: marginOverTarget,
          },
        ],
      };
    }

    // Dipertahankan: Success but not ready for promotion
    return {
      currentPosition,
      recommendation: "Dipertahankan",
      reason: `Performa solid di Success Zone (${profile}). Pertahankan konsistensi untuk promosi berikutnya.`,
      konsekuensi: "Maintain current role dengan peningkatan tanggung jawab.",
      nextStep: "Focus on leadership development dan skill enhancement untuk persiapan promosi.",
      requirements: [
        {
          label: "Zona Final",
          value: "Success",
          met: true,
        },
        {
          label: "Konsistensi",
          value: "Pertahankan 2-3 quarter",
          met: false,
        },
      ],
    };
  }

  // Warning Zone
  if (zonaFinal === "warning") {
    // Check for large downward trend (many pillars with big negative gaps)
    const largeNegativeGaps = pillarScores.filter(p => p.gap < -1.5).length;
    const avgRealityScore = pillarScores.reduce((sum, p) => sum + p.realityScore, 0) / pillarScores.length;
    
    // Demosi if large downward trend detected (>6 pillars with negative gap AND avg<3.2)
    if (largeNegativeGaps >= 6 && avgRealityScore < 3.2) {
      return {
        currentPosition,
        recommendation: "Demosi",
        reason: `Warning Zone dengan tren penurunan signifikan. ${largeNegativeGaps} pilar dengan gap negatif besar menunjukkan over-estimation sistematis.`,
        konsekuensi: "Demosi ke posisi level lebih rendah dengan program pembinaan intensif.",
        nextStep: "Diskusi one-on-one untuk role transition dan realistic goal setting.",
        requirements: [
          {
            label: "Avg Reality Score",
            value: "Target min 3.5 dalam 3 bulan",
            met: false,
          },
          {
            label: "Self-Awareness Calibration",
            value: "Align self-assessment dengan reality",
            met: false,
          },
        ],
      };
    }

    // Pembinaan: Standard warning zone action
    // Identify gap-heavy pillars for coaching focus (SORTED by magnitude)
    const gapPillars = pillarScores
      .filter(p => Math.abs(p.gap) > 1.0)
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)) // Sort by gap magnitude DESC
      .slice(0, 3); // Top 3 gap pillars

    return {
      currentPosition,
      recommendation: "Pembinaan",
      reason: `Performa di Warning Zone memerlukan improvement plan. Gap terbesar di: ${gapPillars.map(p => p.pillarName).join(", ")}.`,
      konsekuensi: "Program pembinaan intensif selama 3-6 bulan. Evaluasi berkala untuk progress tracking.",
      nextStep: "Action plan 30-60-90 hari dengan fokus coaching pada area gap terbesar.",
      requirements: gapPillars.map(p => ({
        label: p.pillarName,
        value: `Improve score dari ${p.realityScore} ke min 4.0`,
        met: false,
      })),
    };
  }

  // Critical Zone
  if (zonaFinal === "critical") {
    // Grace period for new employees (<6 months)
    if (employeeTenureMonths < 6) {
      return {
        currentPosition,
        recommendation: "Pembinaan",
        reason: "Performa Critical Zone pada tahap awal (tenure <6 bulan). Berikan kesempatan improvement dengan coaching intensif.",
        konsekuensi: "Program onboarding diperpanjang dengan mentoring khusus selama 3 bulan. Re-evaluasi setelah periode pembinaan.",
        nextStep: "Daily/weekly check-in dengan supervisor, skill training, dan clear performance milestones.",
        requirements: [
          {
            label: "Avg Reality Score",
            value: "Target min 3.5 dalam 3 bulan",
            met: false,
          },
          {
            label: "Attendance & Attitude",
            value: "100% compliance",
            met: false,
          },
        ],
      };
    }

    // Demosi for established employees
    return {
      currentPosition,
      recommendation: "Demosi",
      reason: "Performa Critical Zone berkelanjutan. Perlu penempatan role yang lebih sesuai dengan current capability.",
      konsekuensi: "Demosi ke posisi level lebih rendah dengan action plan perbaikan. Monitoring ketat selama 6 bulan.",
      nextStep: "Diskusi one-on-one untuk role transition, setting realistic targets, dan commitment plan.",
      requirements: [
        {
          label: "Avg Reality Score",
          value: "Target min 3.0 dalam role baru",
          met: false,
        },
        {
          label: "Attitude & Effort",
          value: "Komitmen improvement",
          met: false,
        },
      ],
    };
  }

  // Fallback (should never reach here)
  return {
    currentPosition,
    recommendation: "Dipertahankan",
    reason: "Status quo - evaluasi lebih lanjut diperlukan.",
    konsekuensi: "Maintain current position.",
    nextStep: "Regular performance review.",
    requirements: [],
  };
}

// ============================================================================
// DETERMINISTIC REPORT SECTIONS
// ============================================================================

/**
 * Generate quarterly performance progress narrative
 * 
 * Transforms quarterly performance data into structured analysis:
 * - Revenue achievement vs target
 * - Margin performance trends
 * - NA (New Accounts) acquisition
 * - Key performance indicators
 */
export function generateProgressKuartal(
  quarterlyPerformance: {
    marginPersonalQ: string;
    naPersonalQ: number;
    marginTeamQ: string;
    naTeamQ: number;
    targetMarginPersonal?: number;
    targetNAPersonal?: number;
    targetMarginTeam?: number;
    targetNATeam?: number;
  }
): {
  ringkasan: string;
  personalAchievement: {
    margin: { actual: string; target?: number; status: "above" | "meet" | "below" };
    na: { actual: number; target?: number; status: "above" | "meet" | "below" };
  };
  teamAchievement: {
    margin: { actual: string; target?: number; status: "above" | "meet" | "below" };
    na: { actual: number; target?: number; status: "above" | "meet" | "below" };
  };
} {
  const marginPersonal = parseFloat(quarterlyPerformance.marginPersonalQ) || 0;
  const marginTeam = parseFloat(quarterlyPerformance.marginTeamQ) || 0;
  const naPersonal = quarterlyPerformance.naPersonalQ || 0;
  const naTeam = quarterlyPerformance.naTeamQ || 0;

  // Determine achievement status
  const getStatus = (actual: number, target?: number): "above" | "meet" | "below" => {
    if (!target) return "meet";
    if (actual > target * 1.05) return "above"; // >5% over target
    if (actual >= target * 0.95) return "meet"; // Within ±5%
    return "below";
  };

  const personalMarginStatus = getStatus(marginPersonal, quarterlyPerformance.targetMarginPersonal);
  const personalNAStatus = getStatus(naPersonal, quarterlyPerformance.targetNAPersonal);
  const teamMarginStatus = getStatus(marginTeam, quarterlyPerformance.targetMarginTeam);
  const teamNAStatus = getStatus(naTeam, quarterlyPerformance.targetNATeam);

  // Generate summary narrative
  const achievements: string[] = [];
  if (personalMarginStatus === "above") achievements.push("margin personal melampaui target");
  if (personalNAStatus === "above") achievements.push("akuisisi NA personal excellent");
  if (teamMarginStatus === "above") achievements.push("margin team outstanding");
  if (teamNAStatus === "above") achievements.push("team NA acquisition strong");

  const concerns: string[] = [];
  if (personalMarginStatus === "below") concerns.push("margin personal below target");
  if (personalNAStatus === "below") concerns.push("NA personal acquisition needs improvement");
  if (teamMarginStatus === "below") concerns.push("margin team underperforming");
  if (teamNAStatus === "below") concerns.push("team NA acquisition sluggish");

  let ringkasan = "Performance kuartal ini ";
  if (achievements.length > 0) {
    ringkasan += `menunjukkan kekuatan di: ${achievements.join(", ")}. `;
  }
  if (concerns.length > 0) {
    ringkasan += `Area yang memerlukan perhatian: ${concerns.join(", ")}.`;
  } else if (achievements.length === 0) {
    ringkasan += "sesuai dengan target yang ditetapkan.";
  }

  return {
    ringkasan,
    personalAchievement: {
      margin: {
        actual: quarterlyPerformance.marginPersonalQ,
        target: quarterlyPerformance.targetMarginPersonal,
        status: personalMarginStatus,
      },
      na: {
        actual: naPersonal,
        target: quarterlyPerformance.targetNAPersonal,
        status: personalNAStatus,
      },
    },
    teamAchievement: {
      margin: {
        actual: quarterlyPerformance.marginTeamQ,
        target: quarterlyPerformance.targetMarginTeam,
        status: teamMarginStatus,
      },
      na: {
        actual: naTeam,
        target: quarterlyPerformance.targetNATeam,
        status: teamNAStatus,
      },
    },
  };
}

/**
 * Generate Early Warning System (EWS) alerts
 * 
 * Identifies low-scoring pillars that require immediate attention:
 * - Critical pillars (score <3.0)
 * - Warning pillars (score 3.0-3.5)
 * - Large gap pillars (self-assessment vs reality)
 */
export function generateEWS(
  pillarScores: Array<{
    pillarId: number;
    pillarName: string;
    category: "A" | "B" | "C";
    selfScore: number;
    realityScore: number;
    gap: number;
  }>
): {
  level: "critical" | "warning" | "good";
  ringkasan: string;
  criticalPillars: Array<{ pillarName: string; score: number; gap: number }>;
  warningPillars: Array<{ pillarName: string; score: number; gap: number }>;
  largeGapPillars: Array<{ pillarName: string; selfScore: number; realityScore: number; gap: number }>;
} {
  // Identify problematic pillars
  const criticalPillars = pillarScores
    .filter(p => p.realityScore < 3.0)
    .map(p => ({ pillarName: p.pillarName, score: p.realityScore, gap: p.gap }))
    .sort((a, b) => a.score - b.score); // Lowest score first

  const warningPillars = pillarScores
    .filter(p => p.realityScore >= 3.0 && p.realityScore < 3.5)
    .map(p => ({ pillarName: p.pillarName, score: p.realityScore, gap: p.gap }))
    .sort((a, b) => a.score - b.score);

  const largeGapPillars = pillarScores
    .filter(p => Math.abs(p.gap) > 1.5)
    .map(p => ({
      pillarName: p.pillarName,
      selfScore: p.selfScore,
      realityScore: p.realityScore,
      gap: p.gap,
    }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)); // Largest gap first

  // Determine overall EWS level
  let level: "critical" | "warning" | "good";
  let ringkasan: string;

  if (criticalPillars.length > 0) {
    level = "critical";
    ringkasan = `CRITICAL: ${criticalPillars.length} pilar dengan score <3.0 memerlukan immediate action. ${
      largeGapPillars.length > 0
        ? `Self-awareness gap detected pada ${largeGapPillars.length} pilar.`
        : ""
    }`;
  } else if (warningPillars.length >= 3) {
    level = "warning";
    ringkasan = `WARNING: ${warningPillars.length} pilar dalam warning zone (3.0-3.5). Preventive action diperlukan untuk mencegah penurunan lebih lanjut.`;
  } else if (warningPillars.length > 0 || largeGapPillars.length > 0) {
    level = "warning";
    ringkasan = `CAUTION: ${warningPillars.length} pilar needs improvement. ${
      largeGapPillars.length > 0
        ? `Gap awareness detected - coaching untuk self-calibration recommended.`
        : ""
    }`;
  } else {
    level = "good";
    ringkasan = "HEALTHY: Semua pilar dalam kondisi baik. Maintain momentum dan continue best practices.";
  }

  return {
    level,
    ringkasan,
    criticalPillars,
    warningPillars,
    largeGapPillars,
  };
}
