import StatCard from "../StatCard";
import { BarChart3, Users, TrendingUp, Clock } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-background">
      <StatCard
        title="Total Audit"
        value="248"
        icon={BarChart3}
        trend={{ value: 12.5, isPositive: true }}
        data-testid="stat-total-audits"
      />
      <StatCard
        title="Pengguna Aktif"
        value="156"
        icon={Users}
        trend={{ value: 8.2, isPositive: true }}
        data-testid="stat-active-users"
      />
      <StatCard
        title="Rata-rata Skor"
        value="87.5"
        icon={TrendingUp}
        trend={{ value: 3.1, isPositive: false }}
        data-testid="stat-avg-score"
      />
      <StatCard
        title="Pending Review"
        value="12"
        icon={Clock}
        data-testid="stat-pending-review"
      />
    </div>
  );
}
