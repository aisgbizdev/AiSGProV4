import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import HierarchicalDashboard from "@/pages/HierarchicalDashboard";
import AuditDetail from "@/pages/AuditDetail";
import NewAudit from "@/pages/NewAudit";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAuditLog from "@/pages/AdminAuditLog";
import OrganizationalSetup from "@/pages/OrganizationalSetup";
import EmployeeMasterData from "@/pages/EmployeeMasterData";
import PerformanceInput from "@/pages/PerformanceInput";
import AuditCreation from "@/pages/AuditCreation";
import PersonalSelfAssessment from "@/pages/PersonalSelfAssessment";
import PersonalAuditForm from "@/pages/PersonalAuditForm";
import PersonalAuditHistory from "@/pages/PersonalAuditHistory";
import AdminPersonalAudits from "@/pages/AdminPersonalAudits";
import NotFound from "@/pages/not-found";
import { ClipboardList, MessageCircle, LogOut, UserCircle, Shield, Home, FileText, Building2, Users, TrendingUp, ClipboardCheck, User } from "lucide-react";
import type { ReactNode } from "react";

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the intended destination before redirecting to login
    sessionStorage.setItem("returnUrl", location);
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* Protected routes - Order matters! More specific routes first */}
      <Route path="/">
        <ProtectedRoute>
          <HierarchicalDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/organizational-setup">
        <ProtectedRoute>
          <OrganizationalSetup />
        </ProtectedRoute>
      </Route>
      <Route path="/employees">
        <ProtectedRoute>
          <EmployeeMasterData />
        </ProtectedRoute>
      </Route>
      <Route path="/performance">
        <ProtectedRoute>
          <PerformanceInput />
        </ProtectedRoute>
      </Route>
      <Route path="/audit/create">
        <ProtectedRoute>
          <AuditCreation />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/audit-log">
        <ProtectedRoute>
          <AdminAuditLog />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/personal-audits">
        <ProtectedRoute>
          <AdminPersonalAudits />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/audit/new">
        <ProtectedRoute>
          <NewAudit />
        </ProtectedRoute>
      </Route>
      <Route path="/audit/:id">
        <ProtectedRoute>
          <AuditDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/personal-audit/new">
        <ProtectedRoute>
          <PersonalAuditForm />
        </ProtectedRoute>
      </Route>
      <Route path="/personal-audit/history">
        <ProtectedRoute>
          <PersonalAuditHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/personal-audit">
        <ProtectedRoute>
          <PersonalSelfAssessment />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Header with auth info
function AppHeader() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/")}>
            <div className="rounded-full overflow-hidden shadow-lg ring-2 ring-amber-500/30 hover:ring-amber-500/50 w-10 h-10 sm:w-12 sm:h-12 transition-all">
              <img 
                src="/logo-aisg.jpg" 
                alt="AiSG" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">AiSG</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Audit Intelligence SG</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-1.5"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button
              variant={location === "/performance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/performance")}
              className="gap-1.5"
              data-testid="nav-performance"
            >
              <TrendingUp className="w-4 h-4" />
              Performance
            </Button>
            <Button
              variant={location === "/audit/create" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/audit/create")}
              className="gap-1.5"
              data-testid="nav-audit-create"
            >
              <ClipboardCheck className="w-4 h-4" />
              Buat Audit
            </Button>
            <Button
              variant={location.startsWith("/personal-audit") ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/personal-audit")}
              className="gap-1.5"
              data-testid="nav-personal-audit"
            >
              <User className="w-4 h-4" />
              Self-Assessment
            </Button>
            {(user.role === "super_admin" || user.role === "owner" || user.role === "brm") && (
              <Button
                variant={location === "/admin/personal-audits" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation("/admin/personal-audits")}
                className="gap-1.5"
              >
                <ClipboardList className="w-4 h-4" />
                Manage Personal
              </Button>
            )}
            {(user.role === "super_admin" || user.role === "owner") && (
              <>
                <Button
                  variant={location === "/organizational-setup" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation("/organizational-setup")}
                  className="gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  Setup Organisasi
                </Button>
                <Button
                  variant={location === "/employees" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation("/employees")}
                  className="gap-1.5"
                  data-testid="nav-employees"
                >
                  <Users className="w-4 h-4" />
                  Master Marketing
                </Button>
                <Button
                  variant={location === "/admin" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation("/admin")}
                  className="gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
                <Button
                  variant={location === "/admin/audit-log" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setLocation("/admin/audit-log")}
                  className="gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Audit Log
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-300"
            onClick={() => window.open('https://chatgpt.com/g/g-68f60e2ded048191816ee3e67eea952f-aisg-audit-intelligence-system-growth', '_blank')}
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">ChatGPT</span>
            <span className="sm:hidden">GPT</span>
          </Button>
          
          <ThemeToggle />
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                data-testid="button-user-profile"
              >
                <UserCircle className="w-4 h-4 text-purple-400" />
                <div className="hidden md:block text-left text-xs">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-purple-300">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role.replace('_', ' ')}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.role === 'super_admin' ? 'Super Admin - Full Access' : user.role.replace('_', ' ')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 focus:text-red-600 focus:bg-red-500/10 cursor-pointer"
                data-testid="menu-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <AppHeader />
            <div className="pt-[60px] sm:pt-[68px]">
              <Router />
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
