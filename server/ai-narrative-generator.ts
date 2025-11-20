/**
 * AI Narrative Generator
 * 
 * Generates rich narrative sections for audit reports using 3-source fallback:
 * 1. OpenAI ChatGPT (gpt-4o-mini) - Primary
 * 2. Google Gemini (gemini-2.0-flash-exp) - Secondary
 * 3. Internal Knowledge Base - Fallback
 * 
 * Sections generated:
 * - executiveSummary: High-level overview for leadership
 * - insightLengkap: Deep-dive analysis with context
 * - swot: Strengths, Weaknesses, Opportunities, Threats
 * - coaching: Personalized coaching recommendations
 * - actionPlan: 30-60-90 day action plan
 * - visi: Vision statement for next quarter
 * - magicSection: Motivational closing with personalized wisdom
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { ZonaType, ProfileType, ProdemResult } from "./business-logic";

// ============================================================================
// AI CLIENT INITIALIZATION
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ============================================================================
// FALLBACK SYSTEM
// ============================================================================

/**
 * Try generating content with OpenAI, Gemini, then fallback
 */
async function generateWithFallback(
  prompt: string,
  fallbackContent: string
): Promise<string> {
  // Try OpenAI first
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Kamu adalah konsultan HR senior yang ahli dalam performance management dan employee development di Indonesia. Berikan insight dalam Bahasa Indonesia yang profesional, actionable, dan konstruktif.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (content && content.trim().length > 50) {
      return content.trim();
    }
  } catch (error) {
    console.warn("OpenAI generation failed, trying Gemini:", error);
  }

  // Try Gemini second
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
    });
    const content = result.response.text();
    
    if (content && content.trim().length > 50) {
      return content.trim();
    }
  } catch (error) {
    console.warn("Gemini generation failed, using fallback:", error);
  }

  // Fallback to internal knowledge base
  return fallbackContent;
}

// ============================================================================
// NARRATIVE GENERATORS
// ============================================================================

export interface AuditNarrativeInput {
  employeeName: string;
  positionName: string;
  quarterLabel: string; // "Q1 2024"
  zonaKinerja: ZonaType;
  zonaPerilaku: ZonaType;
  zonaFinal: ZonaType;
  profile: ProfileType;
  prodem: ProdemResult;
  pillarScores: Array<{
    pillarName: string;
    category: "A" | "B" | "C";
    selfScore: number;
    realityScore: number;
    gap: number;
  }>;
  progressKuartal: {
    ringkasan: string;
    personalAchievement: any;
    teamAchievement: any;
  };
  ews: {
    level: "critical" | "warning" | "good";
    ringkasan: string;
    criticalPillars: any[];
    warningPillars: any[];
  };
}

/**
 * Generate Executive Summary
 */
export async function generateExecutiveSummary(
  input: AuditNarrativeInput
): Promise<string> {
  const prompt = `
Buat executive summary untuk audit kinerja kuartal:

**Employee:** ${input.employeeName} - ${input.positionName}
**Periode:** ${input.quarterLabel}
**Zona Final:** ${input.zonaFinal.toUpperCase()}
**Profile:** ${input.profile}
**Rekomendasi ProDem:** ${input.prodem.recommendation}

**Kinerja Kuartal:**
${input.progressKuartal.ringkasan}

**Early Warning:**
${input.ews.ringkasan}

Tulis executive summary (150-200 kata) yang mencakup:
1. Overall performance highlight
2. Key achievements & concerns
3. Rekomendasi utama untuk leadership

Format: Paragraf tunggal, profesional, data-driven.
`;

  const fallback = `Audit kinerja ${input.quarterLabel} untuk ${input.employeeName} (${input.positionName}) menunjukkan performa di zona ${input.zonaFinal} dengan profile ${input.profile}. ${input.progressKuartal.ringkasan} Rekomendasi: ${input.prodem.recommendation} - ${input.prodem.reason}`;

  return generateWithFallback(prompt, fallback);
}

/**
 * Generate Insight Lengkap (Deep Analysis)
 */
export async function generateInsightLengkap(
  input: AuditNarrativeInput
): Promise<string> {
  const topGaps = input.pillarScores
    .filter(p => Math.abs(p.gap) > 1.0)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 3)
    .map(p => `${p.pillarName} (gap: ${p.gap.toFixed(1)})`)
    .join(", ");

  const prompt = `
Buat analisis mendalam untuk audit kinerja:

**Context:**
- Employee: ${input.employeeName} - ${input.positionName}
- Zona Kinerja: ${input.zonaKinerja}, Zona Perilaku: ${input.zonaPerilaku}, Final: ${input.zonaFinal}
- Profile: ${input.profile}
- Top Gap Pillars: ${topGaps || "Tidak ada gap signifikan"}

**Performance:**
${input.progressKuartal.ringkasan}

Tulis analisis lengkap (250-300 kata) yang mencakup:
1. Root cause analysis dari current performance
2. Pattern recognition dari gap analysis
3. Contextual insights (industry, position level, team dynamics)
4. Forward-looking recommendations

Format: 3-4 paragraf, insightful, actionable.
`;

  const fallback = `Analisis kinerja ${input.employeeName} menunjukkan zona ${input.zonaFinal} dengan karakteristik profile ${input.profile}. Gap analysis mengidentifikasi area improvement di ${topGaps || "beberapa pilar"}. ${input.progressKuartal.ringkasan} Diperlukan fokus coaching pada area gap terbesar untuk improvement berkelanjutan.`;

  return generateWithFallback(prompt, fallback);
}

/**
 * Generate SWOT Analysis
 */
export async function generateSWOT(
  input: AuditNarrativeInput
): Promise<{
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}> {
  const highScores = input.pillarScores
    .filter(p => p.realityScore >= 4.0)
    .map(p => p.pillarName)
    .slice(0, 3);

  const lowScores = input.pillarScores
    .filter(p => p.realityScore < 3.5)
    .map(p => p.pillarName)
    .slice(0, 3);

  const prompt = `
Generate SWOT analysis untuk ${input.employeeName}:

**Profile:** ${input.profile}
**Zona:** ${input.zonaFinal}
**High-performing pillars:** ${highScores.join(", ") || "None"}
**Low-performing pillars:** ${lowScores.join(", ") || "None"}

Return JSON format:
{
  "strengths": ["point 1", "point 2", "point 3"],
  "weaknesses": ["point 1", "point 2"],
  "opportunities": ["point 1", "point 2"],
  "threats": ["point 1", "point 2"]
}

Maksimal 3 points per kategori. Singkat, spesifik, actionable. Bahasa Indonesia.
`;

  const fallbackSWOT = {
    strengths: highScores.length > 0 
      ? [`Strong performance in: ${highScores.join(", ")}`]
      : ["Konsistensi dalam execution"],
    weaknesses: lowScores.length > 0
      ? [`Perlu improvement di: ${lowScores.join(", ")}`]
      : ["Self-awareness calibration needed"],
    opportunities: [
      "Coaching & development programs",
      "Cross-functional collaboration",
    ],
    threats: [
      "Market competition pressure",
      "Changing business landscape",
    ],
  };

  try {
    const content = await generateWithFallback(prompt, JSON.stringify(fallbackSWOT));
    // Try to parse JSON
    const parsed = JSON.parse(content);
    if (parsed.strengths && parsed.weaknesses && parsed.opportunities && parsed.threats) {
      return parsed;
    }
  } catch (error) {
    console.warn("SWOT parsing failed, using fallback");
  }

  return fallbackSWOT;
}

/**
 * Generate Coaching Recommendations
 */
export async function generateCoaching(
  input: AuditNarrativeInput
): Promise<string> {
  const focusAreas = input.prodem.requirements
    .map((r: { label: string; value: string; met: boolean }) => r.label)
    .join(", ");

  const prompt = `
Buat coaching recommendations untuk:

**Employee:** ${input.employeeName} - ${input.positionName}
**Profile:** ${input.profile}
**ProDem:** ${input.prodem.recommendation}
**Focus Areas:** ${focusAreas}

Tulis coaching plan (200-250 kata) yang mencakup:
1. Coaching approach yang sesuai dengan profile
2. Specific behavioral changes needed
3. Development activities (training, mentoring, shadowing)
4. Success metrics & checkpoints

Format: Konkret, actionable, dengan timeline jelas.
`;

  const fallback = `Coaching focus untuk ${input.employeeName}: ${input.prodem.reason} Area pengembangan utama: ${focusAreas}. Rekomendasi: Regular one-on-one coaching sessions, targeted training programs, dan mentorship dari senior leader. Follow-up evaluasi setiap 30 hari untuk tracking progress.`;

  return generateWithFallback(prompt, fallback);
}

/**
 * Generate 30-60-90 Day Action Plan
 */
export async function generateActionPlan(
  input: AuditNarrativeInput
): Promise<{
  days30: string[];
  days60: string[];
  days90: string[];
}> {
  const prompt = `
Create 30-60-90 day action plan untuk ${input.employeeName}:

**Profile:** ${input.profile}
**Rekomendasi:** ${input.prodem.recommendation}
**Requirements:**
${input.prodem.requirements.map((r: { label: string; value: string }) => `- ${r.label}: ${r.value}`).join("\n")}

Return JSON format:
{
  "days30": ["action 1", "action 2", "action 3"],
  "days60": ["action 1", "action 2", "action 3"],
  "days90": ["action 1", "action 2", "action 3"]
}

Each action: specific, measurable, achievable. Bahasa Indonesia.
`;

  const fallbackPlan = {
    days30: [
      "Initial assessment & goal setting",
      "Kick-off coaching sessions",
      "Identify quick wins & early actions",
    ],
    days60: [
      "Progress review & calibration",
      "Implement development activities",
      "Mid-cycle performance check",
    ],
    days90: [
      "Final evaluation & outcomes",
      "Sustainability plan",
      "Next quarter goal setting",
    ],
  };

  try {
    const content = await generateWithFallback(prompt, JSON.stringify(fallbackPlan));
    const parsed = JSON.parse(content);
    if (parsed.days30 && parsed.days60 && parsed.days90) {
      return parsed;
    }
  } catch (error) {
    console.warn("Action plan parsing failed, using fallback");
  }

  return fallbackPlan;
}

/**
 * Generate Vision Statement
 */
export async function generateVisi(
  input: AuditNarrativeInput
): Promise<string> {
  const prompt = `
Buat vision statement untuk ${input.employeeName} (next quarter):

**Current State:**
- Zona: ${input.zonaFinal}
- Profile: ${input.profile}
- ProDem: ${input.prodem.recommendation}

**Target State:**
${input.prodem.nextStep}

Tulis vision statement (100-150 kata) yang:
1. Inspirational & motivating
2. Anchored in reality (bukan hanya aspirasi kosong)
3. Clear direction untuk next quarter
4. Aligned dengan ProDem recommendation

Format: 1-2 paragraf, powerful, forward-looking.
`;

  const fallback = `Vision untuk ${input.employeeName} next quarter: ${input.prodem.nextStep} Dengan fokus improvement pada area key dan komitmen terhadap action plan, target performa adalah mencapai sustainable growth dan contribution yang lebih tinggi. Journey menuju excellence dimulai dengan langkah konsisten hari ini.`;

  return generateWithFallback(prompt, fallback);
}

/**
 * Generate Magic Section (Personalized Wisdom)
 */
export async function generateMagicSection(
  input: AuditNarrativeInput
): Promise<string> {
  const prompt = `
Create a "Magic Section" - personalized wisdom & motivation untuk ${input.employeeName}:

**Context:**
- Position: ${input.positionName}
- Profile: ${input.profile}
- Journey: ${input.prodem.recommendation} - ${input.prodem.reason}

Tulis pesan penutup (150-200 kata) yang:
1. Deeply personal & resonant
2. Acknowledgement of their journey
3. Wisdom tailored to their profile
4. Motivational boost untuk next steps
5. Quote atau metaphor yang powerful (opsional)

Tone: Warm, wise, empowering. Bahasa Indonesia yang natural.
`;

  const fallback = `${input.employeeName}, perjalanan pengembangan diri adalah marathon, bukan sprint. Setiap pilar yang Anda kembangkan adalah fondasi untuk kesuksesan jangka panjang. Profile ${input.profile} menunjukkan potensi Anda - dan ${input.prodem.recommendation} adalah langkah strategis untuk memaksimalkannya. Ingat: Growth requires discomfort, tapi discomfort is temporary; growth is permanent. Keep moving forward with confidence and commitment.`;

  return generateWithFallback(prompt, fallback);
}
