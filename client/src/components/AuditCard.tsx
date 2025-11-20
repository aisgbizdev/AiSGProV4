import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ZoneBadge, { ZoneType } from "./ZoneBadge";
import ProfileBadge, { ProfileType } from "./ProfileBadge";
import { Calendar, Building2, User, Eye, Trash2 } from "lucide-react";

interface AuditCardProps {
  auditId: string;
  nama: string;
  jabatan: string;
  cabang: string;
  zonaKinerja: ZoneType;
  zonaPerilaku: ZoneType;
  profil: ProfileType;
  tanggal: string;
  onView?: () => void;
  onDelete?: () => void;
  "data-testid"?: string;
}

export default function AuditCard({
  auditId,
  nama,
  jabatan,
  cabang,
  zonaKinerja,
  zonaPerilaku,
  profil,
  tanggal,
  onView,
  onDelete,
  "data-testid": testId
}: AuditCardProps) {
  return (
    <Card className="p-6 hover-elevate" data-testid={testId}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs font-mono text-muted-foreground" data-testid={`${testId}-id`}>
                {auditId}
              </code>
              <ProfileBadge type={profil} size="sm" data-testid={`${testId}-profile`} />
            </div>
            <h3 className="font-semibold text-lg mb-1 truncate" data-testid={`${testId}-nama`}>{nama}</h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>{jabatan}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>{cabang}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{tanggal}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground whitespace-nowrap w-[70px]">Kinerja:</span>
            <ZoneBadge type={zonaKinerja} size="sm" data-testid={`${testId}-zona-kinerja`} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground whitespace-nowrap w-[70px]">Perilaku:</span>
            <ZoneBadge type={zonaPerilaku} size="sm" data-testid={`${testId}-zona-perilaku`} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={onView}
            data-testid={`${testId}-view-button`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Detail
          </Button>
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDelete}
              data-testid={`${testId}-delete-button`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
