import { Badge } from "@/components/ui/badge";

export type ZoneType = "success" | "warning" | "critical";

interface ZoneBadgeProps {
  type: ZoneType;
  label?: string;
  size?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

const zoneConfig = {
  success: {
    emoji: "🟩",
    label: "Optimal",
    className: "bg-zone-success text-zone-success-foreground border-zone-success"
  },
  warning: {
    emoji: "🟨",
    label: "Perhatian",
    className: "bg-zone-warning text-zone-warning-foreground border-zone-warning"
  },
  critical: {
    emoji: "🟥",
    label: "Kritikal",
    className: "bg-zone-critical text-zone-critical-foreground border-zone-critical"
  }
};

export default function ZoneBadge({ type, label, size = "md", "data-testid": testId }: ZoneBadgeProps) {
  const config = zoneConfig[type];
  const displayLabel = label || config.label;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 min-w-[100px]",
    md: "text-sm px-3 py-1 min-w-[120px]",
    lg: "text-base px-4 py-1.5 min-w-[140px]"
  };

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} font-medium inline-flex items-center justify-center`}
      data-testid={testId}
    >
      <span className="mr-1">{config.emoji}</span>
      {displayLabel}
    </Badge>
  );
}
