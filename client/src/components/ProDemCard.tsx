import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ProDemCardProps {
  currentLevel: string;
  recommendation: "Promosi" | "Pertahankan" | "Demosi";
  nextLevel?: string;
  reason: string;
  requirements?: Array<{ label: string; value: string; met: boolean }>;
  "data-testid"?: string;
}

export default function ProDemCard({
  currentLevel,
  recommendation,
  nextLevel,
  reason,
  requirements,
  "data-testid": testId
}: ProDemCardProps) {
  const config = {
    Promosi: {
      icon: TrendingUp,
      className: "bg-zone-success/10 border-zone-success/30 text-zone-success",
      badgeClassName: "bg-zone-success text-zone-success-foreground"
    },
    Pertahankan: {
      icon: AlertCircle,
      className: "bg-zone-warning/10 border-zone-warning/30 text-zone-warning",
      badgeClassName: "bg-zone-warning text-zone-warning-foreground"
    },
    Demosi: {
      icon: TrendingDown,
      className: "bg-zone-critical/10 border-zone-critical/30 text-zone-critical",
      badgeClassName: "bg-zone-critical text-zone-critical-foreground"
    }
  };

  const { icon: Icon, className, badgeClassName } = config[recommendation];

  return (
    <Card className={`p-6 border ${className}`} data-testid={testId}>
      <div className="flex items-start gap-4 mb-4">
        <div className="rounded-lg bg-current/10 p-3">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">Rekomendasi ProDem</h3>
            <Badge className={badgeClassName} data-testid={`${testId}-recommendation`}>
              {recommendation}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Posisi saat ini:</span>
            <span className="font-medium">{currentLevel}</span>
            {nextLevel && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold">{nextLevel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Alasan:</p>
          <p className="text-sm leading-relaxed" data-testid={`${testId}-reason`}>{reason}</p>
        </div>

        {requirements && requirements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">Persyaratan:</p>
            <div className="space-y-2">
              {requirements.map((req, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-sm p-2 rounded-md bg-card/50"
                  data-testid={`${testId}-requirement-${idx}`}
                >
                  <span className="text-muted-foreground">{req.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{req.value}</span>
                    <span className={`text-xs ${req.met ? "text-zone-success" : "text-zone-critical"}`}>
                      {req.met ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
