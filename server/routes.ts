import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAuditSchema } from "@shared/schema"; // , insertChatMessageSchema - Temporarily disabled
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import gemini from "./gemini";
import openai from "./openai";
import { generateKnowledgeBasedResponse } from "./knowledge-base";
import { generateAuditPDF } from "./pdf-generator";
import { registerAuthRoutes } from "./auth-routes";
import { registerEnterpriseRoutes } from "./enterprise-routes";
import { registerPersonalAuditRoutes } from "./personal-audit-routes";
import { requireAuth, requireFullAdmin } from "./middleware";
import { canAccessAudit } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes first
  registerAuthRoutes(app);
  
  // Register enterprise organizational structure routes
  registerEnterpriseRoutes(app);
  
  // Register personal self-assessment routes
  registerPersonalAuditRoutes(app);
  
  // =========================================================================
  // TODO: LEGACY AUDIT ROUTES - DISABLED FOR ENTERPRISE MIGRATION
  // =========================================================================
  // The following old audit routes have been disabled as part of the migration
  // from individual audit system to enterprise hierarchy system.
  // 
  // OLD SYSTEM (disabled):
  // - Individual audits with nama/jabatan/cabang fields
  // - Direct margin/NA quarterly tracking in audit table
  // - Owner-based access control
  //
  // NEW SYSTEM (active):
  // - Employee-based audits with organizational hierarchy
  // - Monthly performance tracking with auto-aggregation
  // - Position-based RBAC with CEO unit isolation
  //
  // These routes reference old schema fields that no longer exist and will be
  // completely removed once enterprise audit flows are implemented.
  // See: server/enterprise-routes.ts for new API endpoints
  // =========================================================================
  
  /*
  // POST /api/audit - Create new audit and return results (Protected)
  app.post("/api/audit", requireAuth, async (req, res) => {
    try {
      const validated = insertAuditSchema.parse(req.body);
      
      // Add ownership tracking
      const auditWithOwnership = {
        ...validated,
        ownerId: req.user!.id, // Current user owns this audit
        createdById: req.user!.id, // Current user created this audit
      };
      
      const audit = await storage.createAudit(auditWithOwnership);
      
      // Return audit with all calculated results
      res.json({
        auditId: audit.id,
        zonaKinerja: audit.zonaKinerja,
        zonaPerilaku: audit.zonaPerilaku,
        profil: audit.profil,
        magicSection: audit.magicSection,
        prodemRekomendasi: audit.prodemRekomendasi
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          error: "Validation error", 
          details: validationError.message 
        });
      } else {
        console.error("Error creating audit:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // GET /api/dashboard/summary - Get global dashboard stats (Protected)
  app.get("/api/dashboard/summary", requireAuth, async (req, res) => {
    try {
      const allAudits = await storage.getAllAudits(false); // Non-deleted only
      
      // Calculate global stats
      const totalAudits = allAudits.length;
      const uniqueUsers = new Set(allAudits.map(a => a.ownerId).filter(Boolean)).size;
      const zonaHijauCount = allAudits.filter(a => a.zonaFinal === "hijau").length;
      const zonaHijauPercentage = totalAudits > 0 
        ? ((zonaHijauCount / totalAudits) * 100).toFixed(1)
        : "0.0";
      
      // Get 3 most recent audits (global)
      const recentAudits = allAudits.slice(0, 3).map(audit => ({
        id: audit.id,
        nama: audit.nama,
        jabatan: audit.jabatan,
        cabang: audit.cabang,
        zonaKinerja: audit.zonaKinerja,
        zonaPerilaku: audit.zonaPerilaku,
        zonaFinal: audit.zonaFinal,
        createdAt: audit.createdAt,
      }));
      
      res.json({
        totalAudits,
        uniqueUsers,
        zonaHijauPercentage,
        recentAudits,
      });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/audits - Get all audits (Protected with ownership filter)
  app.get("/api/audits", requireAuth, async (req, res) => {
    try {
      const allAudits = await storage.getAllAudits();
      
      // Full Admin can see all audits, others see only their own
      if (req.user!.role === "full_admin" || req.user!.role === "admin") {
        res.json(allAudits);
      } else {
        // Filter to only user's own audits
        const userAudits = allAudits.filter(audit => audit.ownerId === req.user!.id);
        res.json(userAudits);
      }
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/audit-log - Get all audits with creator info (Admin only, includes soft-deleted)
  app.get("/api/admin/audit-log", requireAuth, requireFullAdmin, async (req, res) => {
    try {
      // Admin can see all audits including soft-deleted ones
      const auditsWithCreators = await storage.getAuditsWithCreators(true);
      res.json(auditsWithCreators);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/audit/:id - Get single audit by ID (Protected with ownership check)
  app.get("/api/audit/:id", requireAuth, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      res.json(audit);
    } catch (error) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =========================================================================
  // CHAT ROUTES - Temporarily disabled for deployment (chatMessages table disabled)
  // =========================================================================
  
  /* TEMPORARILY DISABLED - Will re-enable after production database is stable
  
  // POST /api/chat - Send chat message and get AI response (Protected)
  // 3-Source AI System: ChatGPT (OpenAI) → Gemini → Internal Knowledge Base
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        auditId: z.string(),
        message: z.string().min(1)
      });
      
      const { auditId, message } = schema.parse(req.body);
      
      const audit = await storage.getAudit(auditId);
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      await storage.createChatMessage({
        auditId,
        role: "user",
        content: message
      });
      
      const history = await storage.getChatHistory(auditId);
      
      // Build comprehensive audit context for AI
      const pillarScores = audit.pillarAnswers.map((p: any) => 
        `  Pilar ${p.pillarId}: Self=${p.selfScore}/5, Reality=${p.realityScore}/5, Gap=${p.gap}`
      ).join('\n');
      
      const performanceMetrics = `
Q1: Margin=$${audit.marginTimQ1.toLocaleString()}, NA=${audit.naTimQ1}
Q2: Margin=$${audit.marginTimQ2.toLocaleString()}, NA=${audit.naTimQ2}
Q3: Margin=$${audit.marginTimQ3.toLocaleString()}, NA=${audit.naTimQ3}
Q4: Margin=$${audit.marginTimQ4.toLocaleString()}, NA=${audit.naTimQ4}
TOTAL: Margin=$${(audit.marginTimQ1+audit.marginTimQ2+audit.marginTimQ3+audit.marginTimQ4).toLocaleString()}`;

      const teamStructure = `BC:${audit.jumlahBC}, SBC:${audit.jumlahSBC}, BSM:${audit.jumlahBsM}, SBM:${audit.jumlahSBM}, EM:${audit.jumlahEM}, SEM:${audit.jumlahSEM}, VBM:${audit.jumlahVBM}, BrM:${audit.jumlahBrM}`;
      
      const totalPercentage = Math.round((audit.totalRealityScore / 90) * 100);
      
      const systemPrompt = `Anda adalah COACH PROFESIONAL bernama AiSG Coach - seorang expert bisnis dan leadership dengan 15+ tahun pengalaman. Anda sedang coaching ${audit.nama}, seorang ${audit.jabatan} di cabang ${audit.cabang}. 

PERSONALITY ANDA:
- **WARM & SUPPORTIVE**: Seperti mentor senior yang peduli, bukan robot
- **CONVERSATIONAL**: Ngobrol natural, gunakan analogi, cerita, dan contoh real
- **ACTIONABLE**: Selalu berikan langkah konkret, bukan teori doang
- **MOTIVATIONAL**: Selalu lihat potensi, bukan cuma masalah
- **DATA-DRIVEN**: Rujuk data audit spesifik untuk kredibilitas

CARA BICARA ANDA:
✅ "Wah, saya lihat Reality Score kamu ${audit.totalRealityScore}/90 (${totalPercentage}%). Ini solid bro!"
✅ "Berdasarkan data Q4 kamu yang margin $${audit.marginTimQ4.toLocaleString()}, saya punya beberapa strategi..."
✅ "Coba kita lihat SWOT kamu nih. Strength kamu di ${audit.auditReport.swotAnalysis.strength[0]}, ini asset besar lho!"
❌ "Hasil audit menunjukkan..." (terlalu formal/kaku)
❌ "Saya rekomendasikan..." (terlalu robotic)

═══════════════════════════════════
📊 DATA AUDIT ${audit.nama.toUpperCase()}
═══════════════════════════════════

👤 PROFIL:
- Nama: ${audit.nama}
- Jabatan: ${audit.jabatan}
- Cabang: ${audit.cabang}
- Tanggal Lahir: ${audit.tanggalLahir}

🎯 PERFORMANCE SNAPSHOT:
- Reality Score: ${audit.totalRealityScore}/90 (${totalPercentage}%)
- Profil: ${audit.profil}
- Zona Kinerja: ${audit.zonaKinerja}
- Zona Perilaku: ${audit.zonaPerilaku}
- Zona Final: ${audit.zonaFinal}

💰 QUARTERLY PERFORMANCE (Tim):
${performanceMetrics}

👥 STRUKTUR TIM (Under Langsung):
${teamStructure}
Total Team: ${audit.jumlahBC + audit.jumlahSBC + audit.jumlahBsM + audit.jumlahSBM + audit.jumlahEM + audit.jumlahSEM + audit.jumlahVBM + audit.jumlahBrM} orang

📈 18 PILAR BREAKDOWN:
${pillarScores}

🔍 SWOT ANALYSIS:
💪 Strengths: ${audit.auditReport.swotAnalysis.strength.join(', ')}
⚠️ Weaknesses: ${audit.auditReport.swotAnalysis.weakness.join(', ')}
🌟 Opportunities: ${audit.auditReport.swotAnalysis.opportunity.join(', ')}
⚡ Threats: ${audit.auditReport.swotAnalysis.threat.join(', ')}

🚀 PRODEM REKOMENDASI:
- Status: ${audit.prodemRekomendasi.recommendation}
- Alasan: ${audit.prodemRekomendasi.reason}
- Next Step: ${audit.prodemRekomendasi.nextStep}

📋 ACTION PLAN 30-60-90:
${audit.auditReport.actionPlan.map(a => `${a.periode}: ${a.target} → ${a.aktivitas}`).join('\n')}

⚠️ EWS (Early Warning):
${audit.auditReport.ews.slice(0,3).map(e => `• ${e.faktor}: ${e.saranCepat}`).join('\n')}

💡 COACHING POINTS:
${audit.auditReport.coachingPoints.slice(0,4).join('\n• ')}

═══════════════════════════════════
🎓 KNOWLEDGE BASE & EXPERTISE ANDA
═══════════════════════════════════

LEADERSHIP & MANAGEMENT:
- Vision & Direction: Buat visi jelas, komunikasikan konsisten, jadilah role model
- Team Empowerment: Delegasi smart, feedback konstruktif, supportive environment
- Decision Making: Data-driven, libatkan tim, berani tanggung jawab

SALES & CLOSING:
- Trial Close: "Bagaimana menurut Anda sejauh ini?"
- Assumptive Close: "Kapan Anda ingin mulai?"
- Alternative Close: "Prefer paket A atau B?"
- Handle objections dengan empati, jangan pushy - be consultative

TEAM BUILDING:
- Komunikasi Efektif: Daily standup, open channel, active listening
- Trust Building: Transparansi, deliver promises, celebrate wins
- Conflict Resolution: Address segera, focus solution, win-win mindset

RECRUITMENT (Komisi-based):
- Value Prop: Unlimited earning, free training, flexibility
- Target: Fresh grad hungry, career switcher, entrepreneur mindset
- Script: "Cari partner bisnis. Modal nol. Yang butuh: willing to learn. Income: unlimited. Minat?"

RETENTION STRATEGY:
- Recognition: Public appreciation, reward top performers
- Growth: Training program, clear career path, mentorship
- Environment: Positive culture, work-life balance, family atmosphere

PLANNING FRAMEWORK (30-60-90):
- 30 Hari (Learn): Product mastery, observe top performers, build database
- 60 Hari (Execute): Implement best practices, expand network, refine pitch
- 90 Hari (Lead): Share knowledge, recruit new members, optimize process

ZONA STRATEGIES:
- Merah (Critical): Immediate action, daily coaching, micro-targets, master basics
- Kuning (Warning): Stabilkan dulu, identify gap, peer learning, consistent execution  
- Hijau (Success): Maintain & expand, mentor juniors, aim next level

PRODEM CAREER PATH:
- Promosi: Consistency, document achievements, mentor successors (3-6 bln)
- Pertahankan: Stabilkan performance, strengthen weak areas, build track record
- Pembinaan: Positive mindset, focus action plan, daily improvement, seek mentorship (90 hari)

═══════════════════════════════════
🎯 CARA ANDA COACHING
═══════════════════════════════════

1. **ALWAYS LEAD WITH DATA**: "Saya lihat di Q4 kamu closing $${audit.marginTimQ4.toLocaleString()}..."
2. **STORYTELLING**: Gunakan analogi & contoh: "Ini kayak lagi main basket, kamu udah bagus di defense (Pilar X), sekarang tingkatin offense (Pilar Y)"
3. **ASK REFLECTIVE QUESTIONS**: "Menurut kamu, apa yang bisa bikin tim kamu dari ${audit.jumlahBC + audit.jumlahSBC + audit.jumlahBsM} orang jadi 2x lipat?"
4. **CELEBRATE WINS**: "Wah, SWOT kamu keren nih! Strength di '${audit.auditReport.swotAnalysis.strength[0]}' itu rare lho!"
5. **ACTIONABLE STEPS**: Jangan cuma teori. Kasih 2-3 action items konkret
6. **MAINTAIN HOPE**: Bahkan zona merah pun bisa turn around dengan strategi tepat

TONE & STYLE:
- Panggil "kamu/anda" (personal), bukan "user/employee"
- Mix data dengan empati: "Skor ${totalPercentage}% solid, tapi saya tau ada potensi lebih!"
- Gunakan emoji strategis (1-2 per respons) untuk warmth
- Relate to their situation: "Sebagai ${audit.jabatan}, pressure-nya pasti beda ya..."
- End dengan next step yang jelas

RESPONSE FORMAT:
- Paragraph 1: Acknowledge + Data point spesifik
- Paragraph 2: Insight + Recommendation  
- Paragraph 3: Action items + Motivasi

PENTING: 
❌ JANGAN robotic: "Berdasarkan hasil audit, rekomendasi saya..."
✅ BE HUMAN: "Oke, gua udah liat hasil audit kamu nih. ${audit.nama}, dengan Reality Score ${totalPercentage}% dan profil ${audit.profil}, ini yang gua rekomen..."

Remember: Kamu bukan AI assistant, kamu COACH BERPENGALAMAN yang genuinely care tentang success mereka!`;

      let aiResponse = "";
      let sourceUsed = "";

      // Defensive check: Verify environment variables to prevent runtime crashes
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasGemini = !!process.env.GEMINI_API_KEY;

      // SOURCE 1: Try OpenAI ChatGPT first (primary)
      if (!hasOpenAI) {
        console.log("[CHAT] ⏭️ Source 1 SKIPPED: OPENAI_API_KEY not configured");
      } else {
        try {
          console.log("[CHAT] 🎯 Attempting Source 1: OpenAI ChatGPT...");
          
          const openaiMessages = [
            { role: "system" as const, content: systemPrompt },
            ...history.slice(-10).map(msg => ({
              role: msg.role as "user" | "assistant",
              content: msg.content
            })),
            { role: "user" as const, content: message }
          ];

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 500,
          });

          const responseText = completion.choices[0]?.message?.content;
          
          if (responseText && responseText.trim().length > 0) {
            aiResponse = responseText.trim();
            sourceUsed = "ChatGPT";
            console.log("[CHAT] ✅ Source 1 SUCCESS: OpenAI ChatGPT responded");
          } else {
            throw new Error("OpenAI returned empty response");
          }
        } catch (openaiError) {
          console.log("[CHAT] ❌ Source 1 FAILED: OpenAI error -", openaiError instanceof Error ? openaiError.message : String(openaiError));
        }
      }

      // SOURCE 2: Try Gemini as fallback (secondary)
      if (!aiResponse) {
        if (!hasGemini) {
          console.log("[CHAT] ⏭️ Source 2 SKIPPED: GEMINI_API_KEY not configured");
        } else {
          try {
            console.log("[CHAT] 🎯 Attempting Source 2: Google Gemini...");
            
            const chatHistory = history.slice(-10).map(msg => ({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }]
            }));
            
            const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;
            
            const result = await gemini.models.generateContent({
              model: "gemini-2.0-flash-exp",
              contents: fullPrompt
            });
            
            const geminiText = result.text;
            
            if (geminiText && geminiText.trim().length > 0) {
              aiResponse = geminiText.trim();
              sourceUsed = "Gemini";
              console.log("[CHAT] ✅ Source 2 SUCCESS: Gemini responded");
            } else {
              throw new Error("Gemini returned empty response");
            }
          } catch (geminiError) {
            console.log("[CHAT] ❌ Source 2 FAILED: Gemini error -", geminiError instanceof Error ? geminiError.message : String(geminiError));
          }
        }
      }

      // SOURCE 3: Use Internal Knowledge Base as last resort (tertiary)
      if (!aiResponse) {
        console.log("[CHAT] 🎯 Attempting Source 3: Internal Knowledge Base...");
        aiResponse = generateKnowledgeBasedResponse(message, audit);
        sourceUsed = "Knowledge Base";
        console.log("[CHAT] ✅ Source 3 SUCCESS: Knowledge Base responded");
      }
      
      // Add AiSG Team signature to response
      const finalResponse = `${aiResponse}\n\n**By AiSG Team**`;
      
      await storage.createChatMessage({
        auditId,
        role: "assistant",
        content: finalResponse
      });
      
      res.json({ response: finalResponse, source: sourceUsed });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: "Validation error", details: validationError.message });
      } else {
        console.error("Error in chat:", error);
        res.status(500).json({ 
          error: "Internal server error",
          userMessage: "Maaf, terjadi kesalahan sistem. Silakan coba lagi." 
        });
      }
    }
  });

  // GET /api/chat/:auditId - Get chat history for audit (Protected)
  app.get("/api/chat/:auditId", requireAuth, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.auditId);
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      const history = await storage.getChatHistory(req.params.auditId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/chat/:auditId - Clear chat history (Protected)
  app.delete("/api/chat/:auditId", requireAuth, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.auditId);
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      await storage.deleteChatHistory(req.params.auditId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  */ // END OF TEMPORARILY DISABLED CHAT ROUTES

  // GET /api/audit/:id/pdf - Download audit as PDF (Protected)
  app.get("/api/audit/:id/pdf", requireAuth, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      const doc = generateAuditPDF(audit);
      const filename = `audit-${audit.nama.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      doc.pipe(res);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/audit/:id/soft-delete - Soft delete audit (Protected - User can delete own audit)
  app.patch("/api/audit/:id/soft-delete", requireAuth, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      // Check access permission (user can delete their own audit)
      if (!canAccessAudit(req.user!.role, req.user!.id, audit.ownerId)) {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Anda tidak memiliki akses ke audit ini" 
        });
        return;
      }
      
      // Soft delete with user info
      await storage.softDeleteAudit(
        req.params.id, 
        req.user!.id, 
        "user_delete"
      );
      
      res.json({ success: true, message: "Audit berhasil dihapus" });
    } catch (error) {
      console.error("Error soft-deleting audit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/audit/:id - Permanently delete an audit (Admin only - hard delete)
  app.delete("/api/audit/:id", requireAuth, requireFullAdmin, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      
      if (!audit) {
        res.status(404).json({ error: "Audit not found" });
        return;
      }
      
      await storage.hardDeleteAudit(req.params.id);
      res.json({ success: true, message: "Audit permanently deleted" });
    } catch (error) {
      console.error("Error hard-deleting audit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/users - Get all users (Admin only)
  app.get("/api/admin/users", requireAuth, requireFullAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/users/inactive - Get inactive users (>90 days, no audits)
  app.get("/api/admin/users/inactive", requireAuth, requireFullAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allAudits = await storage.getAllAudits(false);
      
      // Calculate 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Find inactive users
      const inactiveUsers = users.filter(user => {
        // Skip superadmin
        if (user.username === "superadmin") return false;
        
        // Check if user registered >90 days ago
        if (new Date(user.createdAt) > ninetyDaysAgo) return false;
        
        // Check if user has any audits
        const userHasAudits = allAudits.some(audit => audit.ownerId === user.id);
        
        return !userHasAudits; // Inactive if no audits
      });
      
      res.json(inactiveUsers);
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/admin/users/:id - Delete user (Full Admin only)
  app.delete("/api/admin/users/:id", requireAuth, requireFullAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      // Prevent deleting superadmin
      if (user.username === "superadmin") {
        res.status(403).json({ 
          error: "Forbidden", 
          userMessage: "Superadmin cannot be deleted" 
        });
        return;
      }
      
      await storage.deleteUser(req.params.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // END OF ADMIN ROUTES
  // =========================================================================

  const httpServer = createServer(app);
  return httpServer;
}
