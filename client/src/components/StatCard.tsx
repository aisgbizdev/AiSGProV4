import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  "data-testid"?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, "data-testid": testId }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-6 hover-elevate transition-all duration-300 hover:shadow-lg" data-testid={testId}>
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" data-testid={`${testId}-value`}>{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend.isPositive ? "text-zone-success" : "text-zone-critical"
                }`}
                data-testid={`${testId}-trend`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">vs bulan lalu</span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2 sm:p-3 shadow-sm">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
