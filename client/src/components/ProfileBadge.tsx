import { Badge } from "@/components/ui/badge";
import { Crown, Target, Zap, AlertTriangle } from "lucide-react";

export type ProfileType = "Leader" | "Visionary" | "Performer" | "At-Risk";

interface ProfileBadgeProps {
  type: ProfileType;
  size?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

const profileConfig = {
  Leader: {
    icon: Crown,
    className: "bg-zone-success/20 text-zone-success border-zone-success/30"
  },
  Visionary: {
    icon: Zap,
    className: "bg-primary/20 text-primary border-primary/30"
  },
  Performer: {
    icon: Target,
    className: "bg-zone-warning/20 text-zone-warning border-zone-warning/30"
  },
  "At-Risk": {
    icon: AlertTriangle,
    className: "bg-zone-critical/20 text-zone-critical border-zone-critical/30"
  }
};

export default function ProfileBadge({ type, size = "md", "data-testid": testId }: ProfileBadgeProps) {
  const config = profileConfig[type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} font-semibold border`}
      data-testid={testId}
    >
      <Icon className={`${iconSizes[size]} mr-1.5`} />
      {type}
    </Badge>
  );
}
