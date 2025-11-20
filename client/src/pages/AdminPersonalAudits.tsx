import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Loader2, FileText, Search } from "lucide-react";

interface PersonalAuditAdmin {
  id: string;
  userId: string;
  period: string;
  nama: string;
  posisi: string;
  realityScore: string | null;
  zone: string | null;
  createdAt: Date;
  keepUntil: Date | null;
  userName: string | null;
  userEmail: string | null;
}

export default function AdminPersonalAudits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: audits = [], isLoading } = useQuery<PersonalAuditAdmin[]>({
    queryKey: ["admin-personal-audits"],
    queryFn: async () => {
      const res = await fetch("/api/admin/personal-audits");
      if (!res.ok) throw new Error("Failed to fetch audits");
      return res.json();
    },
    enabled: user?.role === "super_admin" || user?.role === "brm",
  });

  const deleteMutation = useMutation({
    mutationFn: async (auditIds: string[]) => {
      const res = await fetch("/api/admin/personal-audits/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete audits");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-personal-audits"] });
      setSelectedAudits([]);
      setDeleteDialogOpen(false);
      toast({
        title: "✅ Berhasil",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user?.role !== "super_admin" && user?.role !== "brm") {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Akses ditolak. Halaman ini hanya untuk Admin/BrM.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredAudits = audits.filter((audit) => {
    const query = searchQuery.toLowerCase();
    return (
      audit.nama.toLowerCase().includes(query) ||
      audit.posisi.toLowerCase().includes(query) ||
      audit.userName?.toLowerCase().includes(query) ||
      audit.userEmail?.toLowerCase().includes(query) ||
      audit.period.includes(query)
    );
  });

  const toggleAudit = (auditId: string) => {
    setSelectedAudits((prev) =>
      prev.includes(auditId) ? prev.filter((id) => id !== auditId) : [...prev, auditId]
    );
  };

  const toggleAll = () => {
    if (selectedAudits.length === filteredAudits.length) {
      setSelectedAudits([]);
    } else {
      setSelectedAudits(filteredAudits.map((a) => a.id));
    }
  };

  const getZoneColor = (zone: string | null) => {
    if (zone === "success") return "bg-green-500";
    if (zone === "warning") return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin - Personal Audits</h1>
          <p className="text-muted-foreground">
            Kelola semua personal audit dari seluruh user
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{audits.length} Total Audits</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Personal Audits
          </CardTitle>
          <CardDescription>
            {selectedAudits.length > 0 && `${selectedAudits.length} audit dipilih`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama, posisi, user, email, atau period..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedAudits.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus {selectedAudits.length} Audit
              </Button>
            )}
          </div>

          {filteredAudits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada personal audit"}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">
                        <Checkbox
                          checked={selectedAudits.length === filteredAudits.length}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      <th className="p-3 text-left">Period</th>
                      <th className="p-3 text-left">Nama</th>
                      <th className="p-3 text-left">Posisi</th>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Score</th>
                      <th className="p-3 text-left">Zone</th>
                      <th className="p-3 text-left">Created</th>
                      <th className="p-3 text-left">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.map((audit) => (
                      <tr key={audit.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedAudits.includes(audit.id)}
                            onCheckedChange={() => toggleAudit(audit.id)}
                          />
                        </td>
                        <td className="p-3 font-mono text-sm">{audit.period}</td>
                        <td className="p-3">{audit.nama}</td>
                        <td className="p-3 text-sm text-muted-foreground">{audit.posisi}</td>
                        <td className="p-3 text-sm">
                          <div>{audit.userName}</div>
                          <div className="text-xs text-muted-foreground">{audit.userEmail}</div>
                        </td>
                        <td className="p-3 font-bold text-purple-500">{audit.realityScore}</td>
                        <td className="p-3">
                          <span className={`inline-block w-3 h-3 rounded-full ${getZoneColor(audit.zone)}`} />
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {audit.keepUntil ? new Date(audit.keepUntil).toLocaleDateString("id-ID") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedAudits.length} Audit?</AlertDialogTitle>
            <AlertDialogDescription>
              Audit yang dipilih akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedAudits)}
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
  );
}
