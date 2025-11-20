import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Trash2, Check } from "lucide-react";
import type { PersonalAudit } from "@shared/schema";

export default function PersonalAuditExpiryNotification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<PersonalAudit | null>(null);

  const { data: expiringAudits = [] } = useQuery<PersonalAudit[]>({
    queryKey: ["personal-audits-expiring"],
    queryFn: async () => {
      const response = await fetch("/api/personal-audits/check-expiry", {
        credentials: "include",
      });
      if (!response.ok) return [];
      const allAudits: PersonalAudit[] = await response.json();
      
      const now = new Date();
      const warningDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return allAudits.filter((audit) => {
        const keepUntil = audit.keepUntil ? new Date(audit.keepUntil) : null;
        return keepUntil && keepUntil <= warningDate;
      });
    },
    refetchInterval: 60000,
  });

  const keepMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personal-audits/${id}/keep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ days: 90 }),
      });
      if (!response.ok) throw new Error("Gagal memperpanjang audit");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Audit Diperpanjang",
        description: "Audit akan disimpan selama 90 hari lagi",
      });
      queryClient.invalidateQueries({ queryKey: ["personal-audits-expiring"] });
      queryClient.invalidateQueries({ queryKey: ["personal-audits"] });
      setShowDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personal-audits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Gagal menghapus audit");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Audit Dihapus",
        description: "Audit telah dihapus permanen",
      });
      queryClient.invalidateQueries({ queryKey: ["personal-audits-expiring"] });
      queryClient.invalidateQueries({ queryKey: ["personal-audits"] });
      setShowDialog(false);
    },
  });

  useEffect(() => {
    if (expiringAudits.length > 0 && !showDialog) {
      const firstExpiring = expiringAudits[0];
      const keepUntil = firstExpiring.keepUntil ? new Date(firstExpiring.keepUntil) : null;
      const daysLeft = keepUntil 
        ? Math.ceil((keepUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      toast({
        title: "⚠️ Audit Akan Dihapus",
        description: `${expiringAudits.length} audit akan dihapus dalam ${daysLeft} hari. Klik untuk mengelola.`,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedAudit(firstExpiring);
              setShowDialog(true);
            }}
          >
            Kelola
          </Button>
        ),
      });
    }
  }, [expiringAudits, showDialog, toast]);

  if (!selectedAudit) return null;

  const keepUntil = selectedAudit.keepUntil ? new Date(selectedAudit.keepUntil) : null;
  const daysLeft = keepUntil 
    ? Math.ceil((keepUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Audit Akan Dihapus Otomatis
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Audit untuk periode{" "}
              <strong>
                {new Date(selectedAudit.period + "-01").toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>{" "}
              akan dihapus otomatis dalam <strong>{daysLeft} hari</strong>.
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Nama:</strong> {selectedAudit.nama}
              </p>
              <p className="text-sm">
                <strong>Posisi:</strong> {selectedAudit.posisi}
              </p>
              <p className="text-sm">
                <strong>Reality Score:</strong> {selectedAudit.realityScore}
              </p>
            </div>
            <p className="text-sm">
              Pilih <strong>Keep</strong> untuk menyimpan 90 hari lagi, atau{" "}
              <strong>Delete</strong> untuk hapus sekarang.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDialog(false)}>
            Tutup
          </AlertDialogCancel>
          <Button
            variant="outline"
            className="text-red-500 hover:bg-red-500/10"
            onClick={() => deleteMutation.mutate(selectedAudit.id!)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <AlertDialogAction
            onClick={() => keepMutation.mutate(selectedAudit.id!)}
            disabled={keepMutation.isPending}
            className="bg-green-500 hover:bg-green-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Keep (90 Hari)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
