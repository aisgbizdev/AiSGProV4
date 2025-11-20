import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, History, PlusCircle, TrendingUp } from "lucide-react";
import PersonalAuditExpiryNotification from "@/components/PersonalAuditExpiryNotification";

export default function PersonalSelfAssessment() {
  return (
    <>
      <PersonalAuditExpiryNotification />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Self-Assessment Pribadi</h1>
          <p className="text-muted-foreground mt-2">
            Lacak perkembangan diri Anda dengan sistem penilaian 18 Pilar
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/personal-audit/new">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PlusCircle className="h-8 w-8 text-primary" />
                <CardTitle>Buat Audit Baru</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Mulai penilaian diri baru dengan 18 Pilar framework untuk mengukur kinerja dan perilaku Anda
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/personal-audit/history">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-8 w-8 text-blue-500" />
                <CardTitle>Riwayat Audit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Lihat dan bandingkan hasil audit sebelumnya untuk tracking progress Anda dari waktu ke waktu
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/personal-audit/progress">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <CardTitle>Grafik Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualisasi perkembangan Reality Score dan pencapaian Anda dalam bentuk grafik interaktif
              </CardDescription>
            </CardContent>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tentang Self-Assessment Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🎯 Tujuan</h3>
            <p className="text-sm text-muted-foreground">
              Self-Assessment Pribadi adalah alat untuk pengembangan diri yang mandiri. 
              Tidak terhubung dengan data Master Marketing atau struktur hierarki perusahaan.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Sistem Penilaian</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Gunakan skala 1-5 untuk setiap pilar:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>5</strong> - Sangat Baik (Konsisten melampaui ekspektasi)</li>
              <li>• <strong>4</strong> - Baik (Sering melampaui ekspektasi)</li>
              <li>• <strong>3</strong> - Cukup (Memenuhi ekspektasi standar)</li>
              <li>• <strong>2</strong> - Kurang (Kadang di bawah ekspektasi)</li>
              <li>• <strong>1</strong> - Sangat Kurang (Perlu perbaikan segera)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🎨 Zona Kinerja</h3>
            <div className="grid grid-cols-3 gap-2 mt-2">
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
          </div>

          <div>
            <h3 className="font-semibold mb-2">💡 Fitur AI Coaching</h3>
            <p className="text-sm text-muted-foreground">
              Setelah selesai audit, Anda akan mendapat saran improvement dari AI Coach berdasarkan hasil penilaian Anda.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🗑️ Data Retention</h3>
            <p className="text-sm text-muted-foreground">
              Audit personal akan dihapus otomatis setelah 3 bulan. Anda akan diberi notifikasi untuk memilih: 
              <strong> Delete</strong> atau <strong>Keep</strong> (perpanjang 90 hari).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Link href="/personal-audit/new">
          <Button size="lg" className="gap-2">
            <Activity className="h-5 w-5" />
            Mulai Self-Assessment Sekarang
          </Button>
        </Link>
      </div>
    </div>
    </>
  );
}
