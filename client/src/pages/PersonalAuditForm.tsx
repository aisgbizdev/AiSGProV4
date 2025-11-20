import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { insertPersonalAuditSchema } from "@shared/schema";

const EIGHTEEN_PILLARS = [
  { id: 1, name: "Margin Produksi Pribadi", category: "A" as const },
  { id: 2, name: "NA Pribadi", category: "A" as const },
  { id: 3, name: "Margin Team", category: "A" as const },
  { id: 4, name: "NA Team", category: "A" as const },
  { id: 5, name: "Produktivitas", category: "B" as const },
  { id: 6, name: "Kecepatan & Akurasi", category: "B" as const },
  { id: 7, name: "Inovasi & Kreativitas", category: "B" as const },
  { id: 8, name: "Problem Solving", category: "B" as const },
  { id: 9, name: "Kolaborasi Tim", category: "B" as const },
  { id: 10, name: "Komunikasi", category: "B" as const },
  { id: 11, name: "Kedisiplinan", category: "C" as const },
  { id: 12, name: "Integritas", category: "C" as const },
  { id: 13, name: "Kepemimpinan", category: "C" as const },
  { id: 14, name: "Inisiatif", category: "C" as const },
  { id: 15, name: "Adaptabilitas", category: "C" as const },
  { id: 16, name: "Customer Service", category: "C" as const },
  { id: 17, name: "Mentoring & Development", category: "C" as const },
  { id: 18, name: "Manajemen Waktu", category: "C" as const },
];

type PillarScore = {
  pillarId: number;
  pillarName: string;
  category: "A" | "B" | "C";
  score: number;
  notes: string;
};

type FormData = z.infer<typeof insertPersonalAuditSchema>;

export default function PersonalAuditForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pillarScores, setPillarScores] = useState<PillarScore[]>(
    EIGHTEEN_PILLARS.map((p) => ({
      pillarId: p.id,
      pillarName: p.name,
      category: p.category,
      score: 3,
      notes: "",
    }))
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(insertPersonalAuditSchema),
    defaultValues: {
      period: new Date().toISOString().slice(0, 7),
      nama: "",
      posisi: "",
      pillarScores: pillarScores,
    },
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/personal-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan audit");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audit Berhasil Disimpan!",
        description: `Reality Score: ${data.realityScore} - Zona ${data.zone === "success" ? "Sukses 🟩" : data.zone === "warning" ? "Warning 🟨" : "Kritis 🟥"}`,
      });
      setLocation("/personal-audit/history");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<FormData, "pillarScores">) => {
    const payload: FormData = {
      ...data,
      pillarScores,
    };
    createAuditMutation.mutate(payload);
  };

  const updatePillarScore = (pillarId: number, score: number) => {
    setPillarScores((prev) =>
      prev.map((p) => (p.pillarId === pillarId ? { ...p, score } : p))
    );
  };

  const updatePillarNotes = (pillarId: number, notes: string) => {
    setPillarScores((prev) =>
      prev.map((p) => (p.pillarId === pillarId ? { ...p, notes } : p))
    );
  };

  const avgScore = pillarScores.reduce((sum, p) => sum + p.score, 0) / 18;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
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
          <h1 className="text-3xl font-bold">Buat Personal Audit Baru</h1>
          <p className="text-muted-foreground">
            Isi data diri dan nilai 18 Pilar Anda (skala 1-5)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Data diri dan periode audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  {...register("nama")}
                  placeholder="Nama Anda"
                />
                {errors.nama && (
                  <p className="text-sm text-red-500">{errors.nama.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="posisi">Posisi/Jabatan *</Label>
                <Input
                  id="posisi"
                  {...register("posisi")}
                  placeholder="Posisi Anda"
                />
                {errors.posisi && (
                  <p className="text-sm text-red-500">{errors.posisi.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Periode (Bulan/Tahun) *</Label>
                <Input
                  id="period"
                  type="month"
                  {...register("period")}
                />
                {errors.period && (
                  <p className="text-sm text-red-500">{errors.period.message}</p>
                )}
              </div>

              <div className="space-y-2 flex items-end">
                <div className="w-full p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reality Score Preview</p>
                  <p className={`text-2xl font-bold ${
                    avgScore >= 4.0 ? "text-green-500" :
                    avgScore >= 3.0 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {avgScore.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>18 Pilar Self-Assessment</CardTitle>
            <CardDescription>
              Nilai diri Anda untuk setiap pilar (1 = Sangat Kurang, 5 = Sangat Baik)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {EIGHTEEN_PILLARS.map((pillar, index) => {
                const pillarData = pillarScores.find((p) => p.pillarId === pillar.id);
                const score = pillarData?.score || 3;

                return (
                  <div
                    key={pillar.id}
                    className={`p-4 border rounded-lg ${
                      pillar.category === "A" ? "border-blue-500/30 bg-blue-500/5" :
                      pillar.category === "B" ? "border-purple-500/30 bg-purple-500/5" :
                      "border-amber-500/30 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            pillar.category === "A" ? "bg-blue-500 text-white" :
                            pillar.category === "B" ? "bg-purple-500 text-white" :
                            "bg-amber-500 text-white"
                          }`}>
                            {pillar.category}
                          </span>
                          <h4 className="font-semibold">{pillar.name}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${
                          score >= 4 ? "text-green-500" :
                          score >= 3 ? "text-yellow-500" : "text-red-500"
                        }`}>
                          {score}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Slider
                        value={[score]}
                        onValueChange={(val) => updatePillarScore(pillar.id, val[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>Sangat Kurang</span>
                        <span>Sangat Baik</span>
                      </div>

                      <Textarea
                        placeholder="Catatan (opsional)"
                        value={pillarData?.notes || ""}
                        onChange={(e) => updatePillarNotes(pillar.id, e.target.value)}
                        className="text-sm h-16"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/personal-audit")}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createAuditMutation.isPending}
            className="gap-2"
          >
            {createAuditMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Audit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
