import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  Building2, 
  User, 
  TrendingUp, 
  Users as UsersIcon,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
  Clock,
  MessageSquare,
  X
} from "lucide-react";
import type { Audit } from "@shared/schema";
import type { AuditDetailDto } from "@shared/types";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/ChatPanel";

export default function AuditDetail() {
  const [, params] = useRoute("/audit/:id");
  const [, setLocation] = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const auditId = params?.id;

  const { data: audit, isLoading} = useQuery<AuditDetailDto>({
    queryKey: [`/api/audit/${auditId}`],
    enabled: !!auditId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-card rounded-lg w-1/3" />
            <div className="h-64 bg-card rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-48 bg-card rounded-lg" />
              <div className="h-48 bg-card rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Audit tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">ID audit yang Anda cari tidak tersedia</p>
          <Button onClick={() => setLocation("/")}>Kembali ke Dashboard</Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  const getZonaBadgeColor = (zona: string) => {
    if (zona === "hijau" || zona === "success") return "bg-green-500/20 text-green-600 border-green-500/30";
    if (zona === "kuning" || zona === "warning") return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/20 text-red-600 border-red-500/30";
  };

  const getZonaText = (zona: string) => {
    if (zona === "hijau" || zona === "success") return "Hijau ✅";
    if (zona === "kuning" || zona === "warning") return "Kuning ⚠️";
    return "Merah 🔴";
  };

  const getProfilBadge = (profil: string) => {
    const colors: Record<string, string> = {
      "Leader": "bg-blue-500/20 text-blue-600 border-blue-500/30",
      "Visionary": "bg-purple-500/20 text-purple-600 border-purple-500/30",
      "Performer": "bg-green-500/20 text-green-600 border-green-500/30",
      "At-Risk": "bg-red-500/20 text-red-600 border-red-500/30"
    };
    return colors[profil] || colors["At-Risk"];
  };

  const report = audit.auditReport as any;
  const prodem = audit.prodemRekomendasi as any;
  const magic = audit.magicSection as any;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              data-testid="button-back"
              onClick={() => setLocation("/")}
              className="shrink-0 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50 transition-all"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Audit Report</h1>
                <Badge className={`${getProfilBadge(audit.profil)} border shrink-0`}>
                  {audit.profil}
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-900 font-semibold shadow-lg shadow-amber-500/30 shrink-0" 
            onClick={() => window.open(`/api/enterprise/audits/${audit.id}/pdf`, "_blank")}
            data-testid="button-download-pdf"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>

        {/* Executive Summary */}
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-amber-500/20 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 p-2">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Executive Summary</h2>
          </div>
          <p className="text-sm sm:text-base leading-relaxed">{report?.executiveSummary}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="text-center p-3 bg-background/60 rounded-xl backdrop-blur-sm border border-amber-500/20">
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">{audit.totalRealityScore}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Reality Score</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-xl backdrop-blur-sm">
              <p className="text-xl sm:text-2xl font-bold">{audit.totalSelfScore}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Self Score</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-xl backdrop-blur-sm">
              <p className={`text-xl sm:text-2xl font-bold ${audit.totalGap > 0 ? 'text-yellow-500' : audit.totalGap < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {audit.totalGap > 0 ? '+' : ''}{audit.totalGap}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Gap</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-xl backdrop-blur-sm flex items-center justify-center">
              <Badge className={`${getZonaBadgeColor(audit.zonaFinal)} text-xs sm:text-sm border`}>
                {getZonaText(audit.zonaFinal)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Personal Info & Quarter Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informasi Personal</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium" data-testid="detail-nama">{audit.employee.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Jabatan</p>
                  <p className="font-medium" data-testid="detail-jabatan">{audit.employee.position?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cabang</p>
                  <p className="font-medium" data-testid="detail-cabang">{audit.employee.branch?.name || audit.employee.pt?.name || "Pusat"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Audit</p>
                  <p className="font-medium">{formatDate(audit.createdAt)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Progress Kuartal</h2>
            </div>
            {report?.progressKuartal && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Kuartal: {report.progressKuartal.kuartalBerjalan}</span>
                    <span className="text-sm text-muted-foreground">{report.progressKuartal.sisaHari} hari tersisa</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Margin Target</span>
                    <span className="text-sm font-semibold">${report.progressKuartal.realisasiMargin.toLocaleString()} / ${report.progressKuartal.targetMargin.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(report.progressKuartal.percentageMargin, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{report.progressKuartal.percentageMargin}% tercapai</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">NA Target</span>
                    <span className="text-sm font-semibold">{report.progressKuartal.realisasiNA} / {report.progressKuartal.targetNA}</span>
                  </div>
                  <Progress value={Math.min(report.progressKuartal.percentageNA, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{report.progressKuartal.percentageNA}% tercapai</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm italic">{report.progressKuartal.catatan}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pilar" className="space-y-6">
          <div className="sticky top-[60px] sm:top-[68px] z-40 bg-background/95 backdrop-blur-xl pb-4 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 border-b">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-4xl mx-auto h-auto gap-2 bg-transparent p-1">
              <TabsTrigger 
                value="pilar" 
                className="text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground h-10 rounded-lg font-medium transition-all"
              >
                18 Pilar
              </TabsTrigger>
              <TabsTrigger 
                value="swot" 
                className="text-xs sm:text-sm data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground h-10 rounded-lg font-medium transition-all"
              >
                SWOT & Action
              </TabsTrigger>
              <TabsTrigger 
                value="prodem" 
                className="text-xs sm:text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground h-10 rounded-lg font-medium transition-all"
              >
                ProDem
              </TabsTrigger>
              <TabsTrigger 
                value="magic" 
                className="text-xs sm:text-sm data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground h-10 rounded-lg font-medium transition-all"
              >
                Magic Section
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 18 Pilar Tab */}
          <TabsContent value="pilar" className="pt-8 sm:pt-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">18 Pilar Reality Score</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Sistem menganalisis self-assessment Anda dan membandingkannya dengan data real performa untuk menghasilkan Reality Score
              </p>
              <div className="space-y-3 sm:space-y-4">
                {audit.pillarAnswers && Array.isArray(audit.pillarAnswers) && audit.pillarAnswers.map((pilar: any) => (
                  <div
                    key={pilar.pillarId}
                    className="rounded-xl border bg-card/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                    data-testid={`pilar-${pilar.pillarId}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1 text-sm sm:text-base">{pilar.pillarName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{pilar.insight}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-center px-2 sm:px-3 py-2 rounded-lg bg-muted/50">
                          <p className="text-xl sm:text-2xl font-bold">{pilar.selfScore}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Self</p>
                        </div>
                        <div className="w-8 sm:w-10 text-center">
                          {pilar.gap === 0 ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto" />
                          ) : pilar.gap > 0 ? (
                            <span className="text-base sm:text-lg text-yellow-500 font-bold">+{pilar.gap}</span>
                          ) : (
                            <span className="text-base sm:text-lg text-red-500 font-bold">{pilar.gap}</span>
                          )}
                        </div>
                        <div className="text-center px-2 sm:px-3 py-2 rounded-lg bg-primary/10">
                          <p className="text-xl sm:text-2xl font-bold text-primary">{pilar.realityScore}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Reality</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gap Analysis & Recommendation - Only show if there's a gap */}
                    {pilar.gap !== 0 && (
                      <div className={`px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t ${
                        pilar.gap > 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className="flex items-start gap-2 mb-2">
                          {pilar.gap > 0 ? (
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-xs sm:text-sm font-semibold mb-1 ${
                              pilar.gap > 0 ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                              {pilar.gap > 0 ? 'Overestimasi' : 'Underestimasi'} ({Math.abs(pilar.gap)} poin)
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                              {pilar.gap > 0 
                                ? `Self-assessment Anda lebih tinggi ${Math.abs(pilar.gap)} poin dari reality score. Ini menunjukkan persepsi diri yang mungkin perlu disesuaikan dengan data performa aktual.`
                                : `Reality score Anda lebih tinggi ${Math.abs(pilar.gap)} poin dari self-assessment. Ini menunjukkan Anda memiliki potensi yang belum Anda sadari sepenuhnya.`
                              }
                            </p>
                            <div className="flex items-start gap-1.5 bg-background/50 rounded-lg p-2 sm:p-3">
                              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-primary mb-1">Rekomendasi Perbaikan:</p>
                                <p className="text-xs text-foreground/90">
                                  {pilar.gap > 0
                                    ? `Fokus pada peningkatan kinerja aktual di area ini. Tinjau metrik performa, identifikasi hambatan, dan buat action plan konkret untuk meningkatkan hasil dari ${pilar.realityScore} menuju target ${pilar.selfScore}.`
                                    : `Tingkatkan kepercayaan diri Anda. Data menunjukkan performa Anda sudah baik (${pilar.realityScore}). Akui pencapaian ini dan manfaatkan momentum untuk terus berkembang.`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Perfect Score */}
                    {pilar.gap === 0 && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t bg-green-500/5 border-green-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                          <p className="text-xs sm:text-sm text-green-700 font-medium">
                            Self-assessment sesuai dengan reality score - Persepsi diri Anda akurat!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* SWOT & Action Tab */}
          <TabsContent value="swot" className="pt-8 sm:pt-6">
            <div className="space-y-6">
              {/* Insight Lengkap */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Insight Lengkap</h2>
                <p className="text-base leading-relaxed">{report?.insightLengkap}</p>
              </Card>

              {/* SWOT Analysis */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">SWOT Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Strength */}
                  <div className="p-4 border border-green-500/30 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm">
                    <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                      <div className="rounded-lg bg-green-500/20 p-1.5">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-sm sm:text-base">Strength</span>
                    </h3>
                    <ul className="space-y-2">
                      {report?.swotAnalysis?.strength?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs sm:text-sm flex gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weakness */}
                  <div className="p-4 border border-red-500/30 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-sm">
                    <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <div className="rounded-lg bg-red-500/20 p-1.5">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-sm sm:text-base">Weakness</span>
                    </h3>
                    <ul className="space-y-2">
                      {report?.swotAnalysis?.weakness?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs sm:text-sm flex gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunity */}
                  <div className="p-4 border border-blue-500/30 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm">
                    <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <div className="rounded-lg bg-blue-500/20 p-1.5">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-sm sm:text-base">Opportunity</span>
                    </h3>
                    <ul className="space-y-2">
                      {report?.swotAnalysis?.opportunity?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs sm:text-sm flex gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threat */}
                  <div className="p-4 border border-yellow-500/30 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 backdrop-blur-sm">
                    <h3 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                      <div className="rounded-lg bg-yellow-500/20 p-1.5">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-sm sm:text-base">Threat</span>
                    </h3>
                    <ul className="space-y-2">
                      {report?.swotAnalysis?.threat?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs sm:text-sm flex gap-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Coaching Points */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold">Coaching Points</h2>
                </div>
                <ul className="space-y-3">
                  {report?.coachingPoints?.map((point: string, idx: number) => (
                    <li key={idx} className="flex gap-3 p-3 bg-card/50 rounded-lg">
                      <span className="text-primary font-bold">{idx + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Action Plan 30-60-90 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Action Plan 30-60-90</h2>
                </div>
                <div className="space-y-4">
                  {report?.actionPlan?.map((plan: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg hover-elevate">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{plan.periode}</Badge>
                        <h3 className="font-semibold">{plan.target}</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Aktivitas: </span>
                          <span>{plan.aktivitas}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">PIC: </span>
                          <span>{plan.pic}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Output: </span>
                          <span className="text-primary font-medium">{plan.output}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* EWS */}
              <Card className="p-6 border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-semibold">Early Warning System (EWS)</h2>
                </div>
                <div className="space-y-3">
                  {report?.ews?.map((warning: any, idx: number) => (
                    <div key={idx} className="p-4 bg-background rounded-lg border border-yellow-500/20">
                      <div className="font-semibold mb-2">{warning.faktor}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Indikator: </span>
                          <span className="font-medium">{warning.indikator}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risiko: </span>
                          <span className="font-medium text-red-600">{warning.risiko}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saran: </span>
                          <span className="font-medium text-green-600">{warning.saranCepat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ProDem Tab */}
          <TabsContent value="prodem" className="pt-8 sm:pt-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Rekomendasi ProDem (Promotion-Demotion)</h2>
              {prodem && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Level</p>
                      <p className="text-lg sm:text-xl font-bold">{prodem.currentLevel}</p>
                    </div>
                    <div className="text-left sm:text-center">
                      <Badge 
                        className={`text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 ${
                          prodem.recommendation === 'Promosi' ? 'bg-green-500' :
                          prodem.recommendation === 'Demosi' ? 'bg-red-500' :
                          prodem.recommendation === 'Pembinaan' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                      >
                        {prodem.recommendation}
                      </Badge>
                      {prodem.nextLevel && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">→ {prodem.nextLevel}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 border rounded-xl bg-card/50">
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">Alasan</h3>
                      <p className="text-xs sm:text-sm">{prodem.reason}</p>
                    </div>
                    <div className="p-3 sm:p-4 border rounded-xl bg-card/50">
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">Konsekuensi</h3>
                      <p className="text-xs sm:text-sm">{prodem.konsekuensi}</p>
                    </div>
                    <div className="p-3 sm:p-4 border rounded-xl bg-card/50">
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">Next Step</h3>
                      <p className="text-xs sm:text-sm">{prodem.nextStep}</p>
                    </div>
                    {prodem.strategyType && prodem.strategyType !== "N/A" && (
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <h3 className="font-semibold mb-2">Strategy Type</h3>
                        <Badge variant="outline">{prodem.strategyType}</Badge>
                      </div>
                    )}
                  </div>

                  {prodem.requirements && prodem.requirements.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-4">Requirements Check</h3>
                      <div className="space-y-2">
                        {prodem.requirements.map((req: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-card/50 rounded">
                            <span className="font-medium">{req.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{req.value}</span>
                              {req.met ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Magic Section Tab */}
          <TabsContent value="magic" className="pt-8 sm:pt-6">
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <h2 className="text-2xl font-bold mb-6 text-center">✨ Magic Section ✨</h2>
              {magic && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-background/50 rounded-lg">
                    <h3 className="text-3xl font-bold mb-2">{magic.julukan}</h3>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span>{magic.zodiak}</span>
                      <span>•</span>
                      <span>{magic.generasi}</span>
                    </div>
                  </div>

                  <div className="p-6 bg-background/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Narasi Personal</h3>
                    <p className="leading-relaxed">{magic.narasi}</p>
                  </div>

                  <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-3">Zodiak Booster 🌟</h3>
                    <p className="italic">{magic.zodiakBooster}</p>
                  </div>

                  <div className="p-6 bg-background/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Coaching Highlight</h3>
                    <p>{magic.coachingHighlight}</p>
                  </div>

                  <div className="p-6 bg-background/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Call to Action</h3>
                    <p>{magic.callToAction}</p>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg border border-primary/30">
                    <p className="text-center text-lg italic font-medium">"{magic.quote}"</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Chat Button - Only show when chat is CLOSED */}
        {!chatOpen && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:bottom-8 sm:left-auto sm:right-8 sm:translate-x-0 z-[100]">
            <Button
              className="h-12 sm:h-16 px-4 sm:px-6 rounded-full shadow-2xl animate-pulse hover:animate-none gap-2 sm:gap-3 text-xs sm:text-base font-semibold whitespace-nowrap"
              onClick={() => setChatOpen(true)}
              data-testid="button-toggle-chat"
            >
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
              <span className="hidden sm:inline">Yuk... diskusikan hasil auditnya disini! 💬</span>
              <span className="sm:hidden text-[11px]">Diskusi Hasil Audit 💬</span>
            </Button>
          </div>
        )}

        {/* Chat Panel Sidebar */}
        {chatOpen && (
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-96 h-[85vh] sm:h-[600px] z-50 shadow-2xl sm:rounded-lg overflow-hidden border-t-2 sm:border-2 border-primary/20">
            <div className="h-full flex flex-col bg-card">
              <div className="flex items-center justify-between p-3 border-b bg-primary/5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="font-semibold">AI Coach</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChatOpen(false)}
                  data-testid="button-close-chat"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel auditId={audit.id} auditName={audit.employee.fullName} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
