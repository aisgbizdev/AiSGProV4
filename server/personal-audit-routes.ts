/**
 * Personal Self-Assessment Routes
 * Handles individual personal audit tracking (no hierarchy)
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { insertPersonalAuditSchema, type PersonalAudit } from "@shared/schema";
import { db } from "./db";
import { personalAudits, users } from "@shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import { requireAuth } from "./middleware";
import { calculatePillarRealityScore, calculateZonaFinal } from "./business-logic";
import openai from "./openai";

export function registerPersonalAuditRoutes(app: Express) {
  /**
   * POST /api/personal-audits
   * Create new personal audit
   */
  app.post("/api/personal-audits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const data = insertPersonalAuditSchema.parse(req.body);

      const pillarScores = data.pillarScores.map((p) => ({
        pillarId: p.pillarId,
        pillarName: p.pillarName,
        category: p.category,
        score: p.score,
        notes: p.notes || "",
      }));

      const totalScore = pillarScores.reduce((sum, p) => sum + p.score, 0);
      const realityScore = totalScore / 18;
      const realityScoreRounded = Number(realityScore.toFixed(2));

      let zone: "success" | "warning" | "critical" = "success";
      if (realityScoreRounded >= 4.0) {
        zone = "success";
      } else if (realityScoreRounded >= 3.0) {
        zone = "warning";
      } else {
        zone = "critical";
      }

      const result = await db.insert(personalAudits).values({
        userId,
        period: data.period,
        nama: data.nama,
        posisi: data.posisi,
        pillarScores,
        realityScore: realityScoreRounded.toString(),
        zone,
        keepUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      }).returning();

      res.status(201).json(result[0]);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data tidak valid", details: error.errors });
      }
      console.error("Error creating personal audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/personal-audits
   * Get user's personal audit history
   */
  app.get("/api/personal-audits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const audits = await db
        .select()
        .from(personalAudits)
        .where(eq(personalAudits.userId, userId))
        .orderBy(desc(personalAudits.period), desc(personalAudits.createdAt));

      res.json(audits);
    } catch (error: any) {
      console.error("Error fetching personal audits:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/personal-audits/check-expiry
   * Check for audits expiring soon (keepUntil within 7 days or already passed)
   * IMPORTANT: This route must come BEFORE /:id route to avoid matching "check-expiry" as an ID
   */
  app.get("/api/personal-audits/check-expiry", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const now = new Date();
      const warningDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const allAudits = await db
        .select()
        .from(personalAudits)
        .where(eq(personalAudits.userId, userId))
        .orderBy(desc(personalAudits.createdAt));

      const expiringAudits = allAudits.filter((audit) => {
        const keepUntil = audit.keepUntil ? new Date(audit.keepUntil) : null;
        return keepUntil && keepUntil <= warningDate;
      });

      res.json(expiringAudits);
    } catch (error: any) {
      console.error("Error checking audit expiry:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/personal-audits/:id
   * Get single personal audit (only if belongs to user)
   */
  app.get("/api/personal-audits/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const audit = await db
        .select()
        .from(personalAudits)
        .where(
          and(
            eq(personalAudits.id, req.params.id),
            eq(personalAudits.userId, userId)
          )
        )
        .limit(1);

      if (!audit.length) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }

      res.json(audit[0]);
    } catch (error: any) {
      console.error("Error fetching personal audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/personal-audits/:id
   * Delete personal audit (only if belongs to user)
   */
  app.delete("/api/personal-audits/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await db
        .delete(personalAudits)
        .where(
          and(
            eq(personalAudits.id, req.params.id),
            eq(personalAudits.userId, userId)
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }

      res.json({ success: true, message: "Audit berhasil dihapus" });
    } catch (error: any) {
      console.error("Error deleting personal audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/personal-audits/:id/keep
   * Extend keepUntil date (user wants to keep audit)
   */
  app.patch("/api/personal-audits/:id/keep", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { days } = req.body;
      const extensionDays = days || 90; // Default 90 days

      const newKeepUntil = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000);

      const result = await db
        .update(personalAudits)
        .set({ keepUntil: newKeepUntil })
        .where(
          and(
            eq(personalAudits.id, req.params.id),
            eq(personalAudits.userId, userId)
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }

      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating keep until:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/personal-audits/:id/ai-coaching
   * Generate AI coaching suggestions based on audit results
   */
  app.post("/api/personal-audits/:id/ai-coaching", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const audit = await db
        .select()
        .from(personalAudits)
        .where(
          and(
            eq(personalAudits.id, req.params.id),
            eq(personalAudits.userId, userId)
          )
        )
        .limit(1);

      if (!audit.length) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }

      const auditData = audit[0];
      const pillarScores = auditData.pillarScores as any[];

      const lowScorePillars = pillarScores
        .filter((p) => p.score < 3)
        .map((p) => `${p.pillarName} (${p.score}/5)`)
        .join(", ");

      const mediumScorePillars = pillarScores
        .filter((p) => p.score >= 3 && p.score < 4)
        .map((p) => `${p.pillarName} (${p.score}/5)`)
        .join(", ");

      const prompt = `Anda adalah AI Coach profesional yang membantu individu meningkatkan performa mereka.

Berikut hasil self-assessment dari ${auditData.nama} (${auditData.posisi}):

Reality Score: ${auditData.realityScore}/5.0
Zona: ${auditData.zone === "success" ? "Sukses 🟩" : auditData.zone === "warning" ? "Warning 🟨" : "Kritis 🟥"}

Pilar dengan skor rendah (<3): ${lowScorePillars || "Tidak ada"}
Pilar yang perlu improvement (3-4): ${mediumScorePillars || "Tidak ada"}

Berikan coaching yang:
1. Jujur dan konstruktif
2. Fokus pada 3 action items konkret dan actionable
3. Motivasi dan supportif
4. Maksimal 200 kata

Format: Langsung berikan saran tanpa greeting.`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const coaching = aiResponse.choices[0].message.content || "AI coaching tidak tersedia saat ini.";

      await db
        .update(personalAudits)
        .set({ aiCoaching: coaching })
        .where(eq(personalAudits.id, req.params.id));

      res.json({ coaching });
    } catch (error: any) {
      console.error("Error generating AI coaching:", error);
      if (error.message?.includes("API key")) {
        return res.status(503).json({ 
          error: "AI Coaching tidak tersedia",
          message: "OpenAI API key belum dikonfigurasi"
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/personal-audits/:id/pdf
   * Download personal audit as PDF
   */
  app.get("/api/personal-audits/:id/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const audit = await db
        .select()
        .from(personalAudits)
        .where(
          and(
            eq(personalAudits.id, req.params.id),
            eq(personalAudits.userId, userId)
          )
        )
        .limit(1);

      if (!audit.length) {
        return res.status(404).json({ error: "Audit tidak ditemukan" });
      }

      const auditData = audit[0];
      const { generatePersonalAuditPDF } = await import("./personal-pdf-generator");

      const pdfData = {
        nama: auditData.nama,
        posisi: auditData.posisi,
        period: auditData.period,
        realityScore: auditData.realityScore || "0.00",
        zone: (auditData.zone as "success" | "warning" | "critical") || "critical",
        pillarScores: auditData.pillarScores as any[],
        aiCoaching: auditData.aiCoaching || undefined,
        createdAt: auditData.createdAt,
      };

      const doc = generatePersonalAuditPDF(pdfData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Personal-Audit-${auditData.nama}-${auditData.period}.pdf"`);

      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/admin/personal-audits
   * Get all personal audits (admin only)
   */
  app.get("/api/admin/personal-audits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const requestingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!requestingUser.length || (requestingUser[0].role !== "super_admin" && requestingUser[0].role !== "brm")) {
        return res.status(403).json({ error: "Akses ditolak. Hanya untuk Admin/BrM" });
      }

      const allAudits = await db
        .select({
          id: personalAudits.id,
          userId: personalAudits.userId,
          period: personalAudits.period,
          nama: personalAudits.nama,
          posisi: personalAudits.posisi,
          realityScore: personalAudits.realityScore,
          zone: personalAudits.zone,
          createdAt: personalAudits.createdAt,
          keepUntil: personalAudits.keepUntil,
          userName: users.name,
          userEmail: users.email,
        })
        .from(personalAudits)
        .leftJoin(users, eq(personalAudits.userId, users.id))
        .orderBy(desc(personalAudits.createdAt));

      res.json(allAudits);
    } catch (error: any) {
      console.error("Error fetching all personal audits:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/admin/personal-audits/bulk
   * Bulk delete personal audits (admin only)
   */
  app.delete("/api/admin/personal-audits/bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const requestingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!requestingUser.length || (requestingUser[0].role !== "super_admin" && requestingUser[0].role !== "brm")) {
        return res.status(403).json({ error: "Akses ditolak. Hanya untuk Admin/BrM" });
      }

      const { auditIds } = req.body;
      if (!auditIds || !Array.isArray(auditIds) || auditIds.length === 0) {
        return res.status(400).json({ error: "auditIds harus berupa array yang tidak kosong" });
      }

      const result = await db
        .delete(personalAudits)
        .where(inArray(personalAudits.id, auditIds))
        .returning();

      res.json({ 
        success: true, 
        message: `${result.length} audit berhasil dihapus`,
        deletedCount: result.length 
      });
    } catch (error: any) {
      console.error("Error bulk deleting personal audits:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
