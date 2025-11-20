import PDFDocument from "pdfkit";

export interface PersonalAuditPdfData {
  nama: string;
  posisi: string;
  period: string;
  realityScore: string;
  zone: "success" | "warning" | "critical";
  pillarScores: Array<{
    pillarName: string;
    score: number;
    notes: string;
  }>;
  aiCoaching?: string;
  createdAt: Date;
}

export function generatePersonalAuditPDF(data: PersonalAuditPdfData): typeof PDFDocument {
  const doc = new PDFDocument({ 
    size: "A4", 
    margin: 50,
    info: {
      Title: `Personal Audit - ${data.nama}`,
      Author: "AiSG - Personal Self-Assessment",
      Subject: "Personal Performance Audit"
    }
  });

  const zoneColors: Record<string, string> = {
    success: "#22c55e",
    warning: "#f59e0b", 
    critical: "#ef4444"
  };

  const zoneLabels: Record<string, string> = {
    success: "🟩 SUCCESS ZONE",
    warning: "🟨 WARNING ZONE",
    critical: "🟥 CRITICAL ZONE"
  };

  doc.fontSize(24).font("Helvetica-Bold").text("AiSG - PERSONAL SELF-ASSESSMENT", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor("#666").text("18 Pilar Performance Report", { align: "center" });
  doc.moveDown(2);
  
  doc.fontSize(12).font("Helvetica").fillColor("#000");
  doc.text(`Nama: ${data.nama}`);
  doc.text(`Posisi: ${data.posisi}`);
  doc.text(`Period: ${data.period}`);
  doc.text(`Tanggal Audit: ${new Date(data.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`);
  doc.moveDown(2);
  
  doc.fontSize(16).font("Helvetica-Bold").text("Reality Score");
  doc.moveDown(0.5);
  doc.fontSize(32).font("Helvetica-Bold").fillColor(zoneColors[data.zone]).text(data.realityScore, { align: "center" });
  doc.fontSize(14).fillColor(zoneColors[data.zone]).text(zoneLabels[data.zone], { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(2);
  
  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold").text("18 Pilar Performance Breakdown");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(1);
  
  data.pillarScores.forEach((pilar, idx) => {
    if (idx > 0 && idx % 9 === 0) {
      doc.addPage();
    }
    
    doc.fontSize(11).font("Helvetica-Bold").text(`${idx + 1}. ${pilar.pillarName}`);
    doc.fontSize(10).font("Helvetica");
    
    const scoreColor = pilar.score >= 4 ? "#22c55e" : pilar.score >= 3 ? "#f59e0b" : "#ef4444";
    doc.fillColor(scoreColor).text(`Score: ${pilar.score}/5`, { indent: 20 });
    doc.fillColor("#000");
    
    if (pilar.notes && pilar.notes.trim()) {
      doc.text(`Notes: ${pilar.notes}`, { indent: 20, align: "justify" });
    }
    doc.moveDown(0.5);
  });
  
  if (data.aiCoaching) {
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#6366f1").text("🤖 AI Coaching Suggestions");
    doc.fillColor("#000");
    doc.fontSize(11).font("Helvetica");
    doc.moveDown(1);
    doc.text(data.aiCoaching, { align: "justify" });
    doc.moveDown(1);
  }
  
  doc.addPage();
  doc.fontSize(10).font("Helvetica").fillColor("#999");
  doc.text("---", { align: "center" });
  doc.text("Personal Self-Assessment Report - For Self-Improvement Tracking", { align: "center" });
  doc.text(`AiSG © ${new Date().getFullYear()}`, { align: "center" });
  
  return doc;
}
