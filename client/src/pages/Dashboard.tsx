import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  TrendingUp,
  Award,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import type { AuditDetailDto } from "@shared/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's employee data to get their audits
  const { data: employee } = useQuery<{
    id: string;
    fullName: string;
    position: { name: string; level: number };
  }>({
    queryKey: [`/api/enterprise/employees/by-user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch audits for current employee
  const { data: audits = [], isLoading } = useQuery<AuditDetailDto[]>({
    queryKey: ["/api/enterprise/audits/employee", employee?.id],
    queryFn: async () => {
      const res = await fetch(`/api/enterprise/audits/employee/${employee!.id}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    },
    enabled: !!employee?.id,
  });

  // Calculate statistics
  const totalAudits = audits.length;
  
  // Zone distribution
  const zonaDistribution = {
    hijau: audits.filter((a) => a.zonaFinal === "hijau").length,
    kuning: audits.filter((a) => a.zonaFinal === "kuning").length,
    merah: audits.filter((a) => a.zonaFinal === "merah").length,
  };

  const zonaPercentages = {
    hijau: totalAudits > 0 ? ((zonaDistribution.hijau / totalAudits) * 100).toFixed(1) : "0",
    kuning: totalAudits > 0 ? ((zonaDistribution.kuning / totalAudits) * 100).toFixed(1) : "0",
    merah: totalAudits > 0 ? ((zonaDistribution.merah / totalAudits) * 100).toFixed(1) : "0",
  };

  // Pie chart data for zone distribution
  const pieData = [
    { name: "Success (Hijau)", value: zonaDistribution.hijau, color: "#10b981" },
    { name: "Warning (Kuning)", value: zonaDistribution.kuning, color: "#f59e0b" },
    { name: "Critical (Merah)", value: zonaDistribution.merah, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Performance trends (quarterly)
  const trendData = audits
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    })
    .map((audit) => ({
      period: `Q${audit.quarter} ${audit.year}`,
      marginPersonal: parseFloat(audit.marginPersonalQ || "0"),
      marginTeam: parseFloat(audit.marginTeamQ || "0"),
      naPersonal: audit.naPersonalQ || 0,
      naTeam: audit.naTeamQ || 0,
    }));

  // Top performers (if user can see subordinates - for future enhancement)
  const pendingReviews = audits.filter(
    (a) => a.prodemRekomendasi.recommendation === "Promosi" || 
           a.prodemRekomendasi.recommendation === "Demosi"
  ).length;

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-lg font-bold text-primary">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 via-orange-500/30 to-amber-500/40 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-2 ring-amber-500/30">
                  <img
                    src="/logo-aisg.jpg"
                    alt="AiSG Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                AiSG – Audit Intelligence System Growth
              </h1>
              {employee && (
                <p className="text-lg text-gray-300">
                  Welcome back, <span className="font-semibold text-amber-400">{employee.fullName}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="max-w-3xl mx-auto">
              <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed px-4">
                A breakthrough AI system that helps you discover hidden potential & elevate performance.
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-3">
                **Powered by Newsmaker.id × AiSG Team × ChatGPT–OpenAI**
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Dashboard Analytics
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Sistem Audit Intelligence untuk Evaluasi Kinerja & Kepemimpinan
            </p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-900 font-semibold shadow-lg shadow-amber-500/30"
            data-testid="button-new-audit"
            onClick={() => setLocation("/audit/new")}
          >
            <Plus className="w-4 h-4" />
            Audit Baru
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card data-testid="stat-total-audits">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audit</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAudits}</div>
              <p className="text-xs text-muted-foreground">Audit selesai</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-zona-hijau">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Zone</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {zonaPercentages.hijau}%
              </div>
              <p className="text-xs text-muted-foreground">
                {zonaDistribution.hijau} audit hijau
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-zona-kuning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning Zone</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {zonaPercentages.kuning}%
              </div>
              <p className="text-xs text-muted-foreground">
                {zonaDistribution.kuning} audit kuning
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-review">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">ProDem rekomendasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Zone Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Zona</CardTitle>
                  <CardDescription>
                    Perbandingan zona Success, Warning, dan Critical
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Belum ada data audit
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Zone Breakdown Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown Zona</CardTitle>
                  <CardDescription>
                    Jumlah audit per kategori zona
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {totalAudits > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { zona: "Hijau", jumlah: zonaDistribution.hijau, fill: "#10b981" },
                          { zona: "Kuning", jumlah: zonaDistribution.kuning, fill: "#f59e0b" },
                          { zona: "Merah", jumlah: zonaDistribution.merah, fill: "#ef4444" },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="zona" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="jumlah" fill="#8884d8" radius={[8, 8, 0, 0]}>
                          {[
                            { zona: "Hijau", jumlah: zonaDistribution.hijau, fill: "#10b981" },
                            { zona: "Kuning", jumlah: zonaDistribution.kuning, fill: "#f59e0b" },
                            { zona: "Merah", jumlah: zonaDistribution.merah, fill: "#ef4444" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Belum ada data audit
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {/* Performance Trends Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Performa Quarterly</CardTitle>
                <CardDescription>
                  Perkembangan margin personal & team dari waktu ke waktu
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="marginPersonal"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Margin Personal"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="marginTeam"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Margin Team"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Belum ada data trend
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NA Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Trend NA (Nomor Akun)</CardTitle>
                <CardDescription>
                  Perkembangan jumlah NA personal & team
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="naPersonal"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="NA Personal"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="naTeam"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="NA Team"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Belum ada data trend
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {/* Audit History List */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Audit</CardTitle>
                <CardDescription>
                  Daftar lengkap audit yang telah selesai
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : audits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">Belum ada audit</p>
                    <p className="text-sm">
                      Klik "Audit Baru" untuk memulai audit pertama Anda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {audits.map((audit) => (
                      <div
                        key={audit.id}
                        className="border border-border rounded-lg p-4 hover-elevate active-elevate-2 cursor-pointer transition-all"
                        onClick={() => setLocation(`/audit/${audit.id}`)}
                        data-testid={`audit-card-${audit.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg">
                              {audit.employee.fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {audit.employee.position?.name || "No Position"} •{" "}
                              {audit.employee.branch?.name || "No Branch"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Q{audit.quarter} {audit.year} • {formatDate(audit.createdAt)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                audit.zonaFinal === "hijau"
                                  ? "bg-green-500/20 text-green-400"
                                  : audit.zonaFinal === "kuning"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {audit.zonaFinal === "hijau"
                                ? "🟩 Success"
                                : audit.zonaFinal === "kuning"
                                ? "🟨 Warning"
                                : "🟥 Critical"}
                            </div>
                            {audit.profil && typeof audit.profil === 'object' && (audit.profil as any).profileName && (
                              <div className="text-xs text-muted-foreground">
                                {(audit.profil as any).profileName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
