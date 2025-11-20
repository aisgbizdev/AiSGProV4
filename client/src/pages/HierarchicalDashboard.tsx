import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Award, Target, Network, Building2, MapPin, ChevronDown, ChevronRight } from "lucide-react";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  positionId: string;
  ptId: string;
  branchId: string | null;
  ceoUnitId: string | null;
  managerId: string | null;
  status: "active" | "inactive";
  position?: { id: string; code: string; name: string; level: number };
  pt?: { id: string; code: string; name: string };
  branch?: { id: string; code: string; name: string } | null;
  ceoUnit?: { id: string; name: string } | null;
};

export default function HierarchicalDashboard() {
  const { user } = useAuth();

  // Fetch employees (backend will filter based on user permissions)
  const { data: employees = [], isLoading } = useQuery<Employee[]>({ 
    queryKey: ["/api/enterprise/employees"] 
  });

  // Calculate stats
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    inactive: employees.filter(e => e.status === "inactive").length,
    byPosition: employees.reduce((acc, emp) => {
      const posName = emp.position?.name || "Unknown";
      acc[posName] = (acc[posName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPt: employees.reduce((acc, emp) => {
      const ptCode = emp.pt?.code || "Unknown";
      acc[ptCode] = (acc[ptCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Get top 5 positions by count
  const topPositions = Object.entries(stats.byPosition)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Dashboard Hierarki
        </h1>
        <p className="text-muted-foreground" data-testid="text-welcome-message">
          Selamat datang, {user?.name || "User"}! 
          {user?.role === "super_admin" && " (Super Admin - Full Access)"}
          {user?.role === "owner" && " (Owner - Full Access)"}
          {user?.role === "employee" && " - Lihat tim dan struktur organisasi Anda"}
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Employees */}
          <Card className="hover-elevate active-elevate-2 transition-all" data-testid="card-total-employees">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-employees">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-total-context">
                {user?.role === "employee" ? "Dalam tim Anda" : "Seluruh organisasi"}
              </p>
            </CardContent>
          </Card>

          {/* Active Employees */}
          <Card className="hover-elevate active-elevate-2 transition-all" data-testid="card-active-employees">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Karyawan Aktif</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-active-employees">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-active-percentage">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% dari total
              </p>
            </CardContent>
          </Card>

          {/* Inactive Employees */}
          <Card className="hover-elevate active-elevate-2 transition-all" data-testid="card-inactive-employees">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tidak Aktif</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground" data-testid="stat-inactive-employees">
                {stats.inactive}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-inactive-percentage">
                {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% dari total
              </p>
            </CardContent>
          </Card>

          {/* Unique Positions */}
          <Card className="hover-elevate active-elevate-2 transition-all" data-testid="card-unique-positions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Positions</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-unique-positions">
                {Object.keys(stats.byPosition).length}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-positions-description">
                Level hierarki berbeda
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Employees by Position */}
        <Card data-testid="card-position-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Distribusi per Posisi
            </CardTitle>
            <CardDescription>Top 5 posisi dengan karyawan terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-positions">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data karyawan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPositions.map(([position, count], index) => (
                  <div 
                    key={position} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`position-stat-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-position-name-${index}`}>{position}</p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-position-count-${index}`}>{count} karyawan</p>
                      </div>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-position-percentage-${index}`}>
                      {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employees by PT */}
        <Card data-testid="card-pt-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Distribusi per PT
            </CardTitle>
            <CardDescription>Penyebaran karyawan di 5 PT companies</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : Object.keys(stats.byPt).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-pts">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data karyawan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byPt)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pt, count], index) => (
                    <div 
                      key={pt} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                      data-testid={`pt-stat-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {pt}
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-pt-name-${index}`}>{pt}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-pt-count-${index}`}>{count} karyawan</p>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-pt-percentage-${index}`}>
                        {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Info */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-purple-500/20" data-testid="card-organization-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Struktur Organisasi
          </CardTitle>
          <CardDescription>
            Jelajahi struktur hierarki organisasi dan tim Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm" data-testid="info-master-data">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <p className="font-medium text-sm">Master Data Karyawan</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lihat detail lengkap, struktur hierarki, dan kelola data karyawan
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm" data-testid="info-tree-view">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="w-4 h-4 text-blue-500" />
                  <p className="font-medium text-sm">Tree Visualization</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Visualisasi struktur reporting dengan tree view interaktif
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm" data-testid="info-performance">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-pink-500" />
                  <p className="font-medium text-sm">Performance Tracking</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  (Coming soon) Monitor kinerja tim dengan 18 Pilar framework
                </p>
              </div>
            </div>

            {user?.role === "employee" && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20" data-testid="info-employee-access">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <p className="font-semibold text-sm">Akses Terbatas</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sebagai employee, Anda hanya dapat melihat data tim Anda sendiri dan bawahan langsung Anda. 
                  Untuk akses penuh, hubungi administrator atau owner.
                </p>
              </div>
            )}

            {(user?.role === "super_admin" || user?.role === "owner") && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20" data-testid="info-full-access">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <p className="font-semibold text-sm">Full Access</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anda memiliki akses penuh ke seluruh sistem: kelola organisasi, karyawan, dan pengaturan sistem.
                  Gunakan menu "Setup Organisasi" dan "Master Karyawan" untuk mengelola data.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Hierarchy Tree View */}
      {stats.total > 0 && !isLoading && (
        <Card data-testid="card-team-hierarchy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Struktur Hierarki Tim
            </CardTitle>
            <CardDescription>
              Visualisasi struktur reporting organisasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.filter(emp => !emp.managerId).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-tree">
                  <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada karyawan top-level untuk ditampilkan</p>
                  <p className="text-xs mt-2">Pastikan ada karyawan dengan "Tidak ada atasan"</p>
                </div>
              ) : (
                employees
                  .filter(emp => !emp.managerId) // Get top-level employees
                  .map(rootEmp => (
                    <DashboardTreeNode
                      key={rootEmp.id}
                      employee={rootEmp}
                      allEmployees={employees}
                      level={0}
                    />
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Future Features */}
      {stats.total === 0 && !isLoading && (
        <Card data-testid="card-empty-state">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">Belum Ada Data Karyawan</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto" data-testid="text-empty-description">
                  Mulai dengan menambahkan struktur organisasi (PT, Cabang, Posisi) di menu "Setup Organisasi",
                  kemudian tambahkan karyawan di menu "Master Karyawan".
                </p>
              </div>
              {(user?.role === "super_admin" || user?.role === "owner") && (
                <div className="flex gap-2 justify-center pt-4">
                  <Link href="/organizational-setup">
                    <Badge variant="outline" className="cursor-pointer hover-elevate" data-testid="link-setup-org">
                      Setup Organisasi →
                    </Badge>
                  </Link>
                  <Link href="/employees">
                    <Badge variant="outline" className="cursor-pointer hover-elevate" data-testid="link-master-employee">
                      Master Karyawan →
                    </Badge>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Dashboard Tree Node Component (simplified for dashboard view)
type DashboardTreeNodeProps = {
  employee: Employee;
  allEmployees: Employee[];
  level: number;
};

function DashboardTreeNode({ employee, allEmployees, level }: DashboardTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get direct subordinates
  const subordinates = allEmployees.filter(emp => emp.managerId === employee.id);
  const hasSubordinates = subordinates.length > 0;

  // Get position level color
  const getLevelColor = (level: number | undefined) => {
    if (!level) return "bg-gray-500";
    if (level <= 3) return "bg-gradient-to-r from-purple-500 to-pink-500"; // Owner, CEO, CBO
    if (level <= 6) return "bg-gradient-to-r from-blue-500 to-cyan-500"; // BrM, VBM, SEM
    if (level <= 9) return "bg-gradient-to-r from-green-500 to-emerald-500"; // EM, SBM, BsM
    return "bg-gradient-to-r from-yellow-500 to-orange-500"; // SBC, BC
  };

  return (
    <div className="space-y-2" style={{ marginLeft: `${level * 1.5}rem` }}>
      {/* Employee Card */}
      <div 
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover-elevate transition-all"
        data-testid={`dashboard-tree-node-${employee.id}`}
      >
        {/* Expand/Collapse Button */}
        {hasSubordinates && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-dashboard-toggle-${employee.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}

        {/* Avatar with Position Level */}
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getLevelColor(employee.position?.level)}`}>
            {employee.fullName ? employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
          </div>
          {employee.position && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background border border-primary flex items-center justify-center text-[9px] font-bold">
              {employee.position.level}
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" data-testid={`text-dashboard-tree-name-${employee.id}`}>
              {employee.fullName}
            </p>
            <Badge variant="outline" className="text-xs shrink-0">
              {employee.employeeCode}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {employee.position?.name || "Unknown"}
            </Badge>
            <span>•</span>
            <span>{employee.pt?.code || "Unknown"}</span>
            {hasSubordinates && (
              <>
                <span>•</span>
                <span>{subordinates.length} bawahan</span>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Badge 
          variant={employee.status === "active" ? "default" : "secondary"}
          className={`text-xs shrink-0 ${employee.status === "active" ? "bg-green-600" : ""}`}
        >
          {employee.status === "active" ? "Aktif" : "Tidak Aktif"}
        </Badge>
      </div>

      {/* Subordinates (Recursive) */}
      {hasSubordinates && isExpanded && (
        <div className="space-y-2 border-l-2 border-muted pl-2">
          {subordinates.map(sub => (
            <DashboardTreeNode
              key={sub.id}
              employee={sub}
              allEmployees={allEmployees}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
