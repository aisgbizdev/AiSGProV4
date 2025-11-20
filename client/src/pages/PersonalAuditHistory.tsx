import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, FileText, Calendar, TrendingUp, Loader2, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PersonalAudit } from "@shared/schema";

export default function PersonalAuditHistory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterPeriod, setFilterPeriod] = useState("");

  const { data: audits = [], isLoading } = useQuery<PersonalAudit[]>({
    queryKey: ["personal-audits"],
    queryFn: async () => {
      const response = await fetch("/api/personal-audits", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Gagal memuat riwayat audit");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personal-audits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus audit");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Audit Dihapus",
        description: "Audit personal berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: ["personal-audits"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAudits = filterPeriod
    ? audits.filter((a) => a.period.includes(filterPeriod))
    : audits;

  const chartData = [...filteredAudits]
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
    .map((audit) => ({
      period: new Date(audit.period + "-01").toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      }),
      realityScore: parseFloat(audit.realityScore || "0"),
      zona: audit.zone === "success" ? "Sukses" : audit.zone === "warning" ? "Warning" : "Kritis",
    }));

  const getZoneColor = (zone: string) => {
    if (zone === "success") return "bg-green-500";
    if (zone === "warning") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getZoneText = (zone: string) => {
    if (zone === "success") return "Zona Sukses 🟩";
    if (zone === "warning") return "Zona Warning 🟨";
    return "Zona Kritis 🟥";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat riwayat audit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/personal-audit")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Riwayat Audit Personal</h1>
          <p className="text-muted-foreground">
            Lihat dan bandingkan hasil audit Anda dari waktu ke waktu
          </p>
        </div>
      </div>

      {audits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Audit</h3>
            <p className="text-muted-foreground mb-6">
              Buat audit personal pertama Anda untuk mulai tracking progress
            </p>
            <Button onClick={() => setLocation("/personal-audit/new")}>
              Buat Audit Baru
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                type="month"
                placeholder="Filter by period..."
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              />
            </div>
            <Button onClick={() => setLocation("/personal-audit/new")}>
              + Buat Audit Baru
            </Button>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Grafik Progress Reality Score
                </CardTitle>
                <CardDescription>
                  Tracking perkembangan Reality Score Anda dari waktu ke waktu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="realityScore"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 6 }}
                      name="Reality Score"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-muted-foreground">Zona Sukses: ≥ 4.0</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-muted-foreground">Zona Warning: 3.0 - 3.9</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-muted-foreground">Zona Kritis: &lt; 3.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {filteredAudits.map((audit) => (
              <Card key={audit.id!}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {new Date(audit.period + "-01").toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                          })}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {audit.nama} - {audit.posisi}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <span className="text-3xl font-bold text-purple-500">
                          {audit.realityScore}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${getZoneColor(
                          audit.zone || "critical"
                        )}`}
                      >
                        {getZoneText(audit.zone || "critical")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Dibuat: {new Date(audit.createdAt).toLocaleDateString("id-ID")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/api/personal-audits/${audit.id}/pdf`, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Audit?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Audit untuk periode{" "}
                              {new Date(audit.period + "-01").toLocaleDateString("id-ID", {
                                month: "long",
                                year: "numeric",
                              })}{" "}
                              akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(audit.id!)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Menghapus...
                                </>
                              ) : (
                                "Ya, Hapus"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
