import PDFDocument from "pdfkit";
import type { AuditPdfDto } from "@shared/types";

export function generateAuditPDF(data: AuditPdfDto): typeof PDFDocument {
  const doc = new PDFDocument({ 
    size: "A4", 
    margin: 50,
    info: {
      Title: `Audit Report - ${data.fullName}`,
      Author: "AiSG - Audit Intelligence SG",
      Subject: "Performance Audit Report"
    }
  });

  const report = data.auditReport as any;
  const prodem = data.prodemRekomendasi as any;
  const magic = data.magicSection as any;
  
  doc.fontSize(24).font("Helvetica-Bold").text("AiSG - AUDIT INTELLIGENCE", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(18).text("Performance Audit Report", { align: "center" });
  doc.moveDown(2);
  
  doc.fontSize(12).font("Helvetica");
  doc.fillColor("#666");
  doc.text(`Period: Q${data.quarter} ${data.year}`);
  doc.text(`Generated: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`);
  doc.moveDown(2);
  
  doc.fontSize(16).font("Helvetica-Bold").text("Personal Information");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  doc.text(`Nama: ${data.fullName}`);
  doc.text(`Jabatan: ${data.position}`);
  doc.text(`Cabang: ${data.branch}`);
  doc.text(`PT Company: ${data.ptCompany}`);
  doc.text(`Tanggal Lahir: ${data.birthDate}`);
  doc.moveDown(1.5);
  
  doc.fontSize(16).font("Helvetica-Bold").text("Executive Summary");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  doc.text(report.executiveSummary, { align: "justify" });
  doc.moveDown(1.5);
  
  doc.fontSize(16).font("Helvetica-Bold").text("Performance Metrics");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  doc.text(`Reality Score: ${data.totalRealityScore}/90`);
  doc.text(`Self Score: ${data.totalSelfScore}/90`);
  doc.text(`Gap: ${data.totalGap}`);
  doc.text(`Profil: ${data.profil}`);
  doc.text(`Zona: ${data.zonaFinal.toUpperCase()}`);
  doc.moveDown(1.5);
  
  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold").text("SWOT Analysis");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  
  doc.fontSize(13).font("Helvetica-Bold").text("Strengths:");
  doc.fontSize(11).font("Helvetica");
  report.swotAnalysis.strength.forEach((item: string, idx: number) => {
    doc.text(`${idx + 1}. ${item}`, { indent: 20 });
  });
  doc.moveDown(0.5);
  
  doc.fontSize(13).font("Helvetica-Bold").text("Weaknesses:");
  doc.fontSize(11).font("Helvetica");
  report.swotAnalysis.weakness.forEach((item: string, idx: number) => {
    doc.text(`${idx + 1}. ${item}`, { indent: 20 });
  });
  doc.moveDown(0.5);
  
  doc.fontSize(13).font("Helvetica-Bold").text("Opportunities:");
  doc.fontSize(11).font("Helvetica");
  report.swotAnalysis.opportunity.forEach((item: string, idx: number) => {
    doc.text(`${idx + 1}. ${item}`, { indent: 20 });
  });
  doc.moveDown(0.5);
  
  doc.fontSize(13).font("Helvetica-Bold").text("Threats:");
  doc.fontSize(11).font("Helvetica");
  report.swotAnalysis.threat.forEach((item: string, idx: number) => {
    doc.text(`${idx + 1}. ${item}`, { indent: 20 });
  });
  doc.moveDown(1.5);
  
  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold").text("Action Plan 30-60-90");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  
  report.actionPlan.forEach((plan: any) => {
    doc.fontSize(13).font("Helvetica-Bold").text(`${plan.periode}:`);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Target: ${plan.target}`, { indent: 20 });
    doc.text(`Aktivitas: ${plan.aktivitas}`, { indent: 20 });
    doc.text(`PIC: ${plan.pic}`, { indent: 20 });
    doc.text(`Output: ${plan.output}`, { indent: 20 });
    doc.moveDown(0.5);
  });
  doc.moveDown(1);
  
  doc.fontSize(16).font("Helvetica-Bold").text("ProDem Recommendation");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  doc.text(`Current Level: ${prodem.currentLevel}`);
  doc.text(`Recommendation: ${prodem.recommendation}`);
  if (prodem.nextLevel) {
    doc.text(`Next Level: ${prodem.nextLevel}`);
  }
  doc.text(`Reason: ${prodem.reason}`, { align: "justify" });
  doc.moveDown(0.5);
  doc.text(`Konsekuensi: ${prodem.konsekuensi}`, { align: "justify" });
  doc.moveDown(0.5);
  doc.text(`Next Step: ${prodem.nextStep}`, { align: "justify" });
  doc.moveDown(1.5);
  
  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold").text("Magic Section");
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  doc.text(`Julukan: ${magic.julukan}`);
  doc.text(`Zodiak: ${magic.zodiak}`);
  doc.text(`Generasi: ${magic.generasi}`);
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica").text(magic.narasi, { align: "justify" });
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Oblique").text(`"${magic.quote}"`, { align: "center" });
  doc.moveDown(1.5);
  
  doc.fontSize(16).font("Helvetica-Bold").text("18 Pilar Performance", { underline: true });
  doc.fontSize(11).font("Helvetica");
  doc.moveDown(0.5);
  
  const pillars = data.pillarAnswers as any[];
  pillars.forEach((pilar, idx) => {
    if (idx > 0 && idx % 6 === 0) {
      doc.addPage();
    }
    doc.fontSize(11).font("Helvetica-Bold").text(`${pilar.pillarName}`);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Self Score: ${pilar.selfScore}/5 | Reality Score: ${pilar.realityScore}/5 | Gap: ${pilar.gap}`, { indent: 15 });
    doc.text(`Insight: ${pilar.insight}`, { indent: 15, align: "justify" });
    doc.moveDown(0.3);
  });
  
  doc.addPage();
  doc.fontSize(10).font("Helvetica").fillColor("#999");
  doc.text("---", { align: "center" });
  doc.text("This report is confidential and intended for internal use only.", { align: "center" });
  doc.text(`AiSG - Audit Intelligence SG © ${new Date().getFullYear()}`, { align: "center" });
  
  // Note: Do NOT call doc.end() here - let caller pipe first, then end
  return doc;
}
