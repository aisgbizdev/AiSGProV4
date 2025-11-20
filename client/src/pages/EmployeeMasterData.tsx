import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Users, Search, Filter, Network, ChevronDown, ChevronRight, Mail, Phone, Calendar, Upload, FileSpreadsheet, Download } from "lucide-react";
import { UploadExcelDialog } from "@/components/UploadExcelDialog";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  positionId: string;
  ptId: string;
  branchId: string | null;
  ceoUnitId: string | null;
  managerId: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
  joinDate: string;
  status: "active" | "inactive";
  position?: { id: string; code: string; name: string; level: number };
  pt?: { id: string; code: string; name: string };
  branch?: { id: string; code: string; name: string } | null;
  ceoUnit?: { id: string; name: string } | null;
  manager?: { id: string; fullName: string; employeeCode: string } | null;
};

type Pt = { id: string; code: string; name: string };
type CeoUnit = { id: string; name: string };
type Branch = { id: string; code: string; name: string; ptId: string };
type Position = { id: string; code: string; name: string; level: number };

export default function EmployeeMasterData() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPt, setFilterPt] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [form, setForm] = useState({
    id: "",
    employeeCode: "",
    fullName: "",
    positionId: "",
    ptId: "",
    branchId: "",
    ceoUnitId: "",
    managerId: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    joinDate: new Date().toISOString().split('T')[0],
    status: "active" as "active" | "inactive"
  });

  // Fetch data
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({ 
    queryKey: ["/api/enterprise/employees"] 
  });
  const { data: pts = [] } = useQuery<Pt[]>({ queryKey: ["/api/enterprise/pts"] });
  const { data: ceoUnits = [] } = useQuery<CeoUnit[]>({ queryKey: ["/api/enterprise/ceo-units"] });
  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/enterprise/branches"] });
  const { data: positions = [] } = useQuery<Position[]>({ queryKey: ["/api/enterprise/positions"] });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/enterprise/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/employees"] });
      toast({ title: "Karyawan berhasil ditambahkan" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Gagal menambahkan karyawan", 
        description: error.message || "Terjadi kesalahan",
        variant: "destructive" 
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/enterprise/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/employees"] });
      toast({ title: "Karyawan berhasil diupdate" });
      setDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Gagal mengupdate karyawan",
        description: error.message || "Terjadi kesalahan", 
        variant: "destructive" 
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enterprise/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/employees"] });
      toast({ title: "Karyawan berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus karyawan", variant: "destructive" })
  });

  const resetForm = () => {
    setForm({
      id: "",
      employeeCode: "",
      fullName: "",
      positionId: "",
      ptId: "",
      branchId: "",
      ceoUnitId: "",
      managerId: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      joinDate: new Date().toISOString().split('T')[0],
      status: "active"
    });
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      positionId: emp.positionId,
      ptId: emp.ptId,
      branchId: emp.branchId || "",
      ceoUnitId: emp.ceoUnitId || "",
      managerId: emp.managerId || "",
      email: emp.email || "",
      phone: emp.phone || "",
      dateOfBirth: emp.dateOfBirth.split('T')[0],
      joinDate: emp.joinDate.split('T')[0],
      status: emp.status
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.employeeCode || !form.fullName || !form.positionId || !form.ptId || !form.dateOfBirth) {
      toast({ title: "Mohon lengkapi field yang wajib diisi", variant: "destructive" });
      return;
    }

    const payload = {
      employeeCode: form.employeeCode,
      fullName: form.fullName,
      positionId: form.positionId,
      ptId: form.ptId,
      branchId: form.branchId || null,
      ceoUnitId: form.ceoUnitId || null,
      managerId: form.managerId || null,
      email: form.email || null,
      phone: form.phone || null,
      dateOfBirth: form.dateOfBirth,
      joinDate: form.joinDate,
      status: form.status
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: form.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = searchQuery === "" || 
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPt = filterPt === "all" || emp.ptId === filterPt;
    const matchBranch = filterBranch === "all" || emp.branchId === filterBranch;
    const matchPosition = filterPosition === "all" || emp.positionId === filterPosition;
    const matchStatus = filterStatus === "all" || emp.status === filterStatus;
    return matchSearch && matchPt && matchBranch && matchPosition && matchStatus;
  });

  // Get available managers (higher rank = lower level number)
  const selectedPosition = positions.find(p => p.id === form.positionId);
  const availableManagers = employees.filter(emp => {
    if (editingEmployee && emp.id === editingEmployee.id) return false; // Can't be own manager
    if (!selectedPosition || !emp.position) return false;
    return emp.position.level < selectedPosition.level; // Manager level must be LOWER number (higher rank)
  });

  // Get branches filtered by selected PT
  const availableBranches = branches.filter(b => b.ptId === form.ptId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Master Data Marketing
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data marketing dan struktur hierarki organisasi
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <UploadExcelDialog branches={branches} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingEmployee(null);
                  resetForm();
                }}
                data-testid="button-add-employee"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Marketing
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Marketing" : "Tambah Marketing Baru"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Employee Code & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Kode Marketing *</Label>
                  <Input
                    id="employeeCode"
                    value={form.employeeCode}
                    onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                    placeholder="EMP001"
                    data-testid="input-employee-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="John Doe"
                    data-testid="input-full-name"
                  />
                </div>
              </div>

              {/* Position & PT */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posisi *</Label>
                  <Select 
                    value={form.positionId} 
                    onValueChange={(val) => setForm({ ...form, positionId: val })}
                  >
                    <SelectTrigger data-testid="select-position">
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name} (Level {pos.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pt">PT *</Label>
                  <Select 
                    value={form.ptId} 
                    onValueChange={(val) => {
                      setForm({ ...form, ptId: val, branchId: "" }); // Reset branch when PT changes
                    }}
                  >
                    <SelectTrigger data-testid="select-pt">
                      <SelectValue placeholder="Pilih PT" />
                    </SelectTrigger>
                    <SelectContent>
                      {pts.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.code} - {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Branch & CEO Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Cabang</Label>
                  <Select 
                    value={form.branchId || "none"} 
                    onValueChange={(val) => setForm({ ...form, branchId: val === "none" ? "" : val })}
                    disabled={!form.ptId || availableBranches.length === 0}
                  >
                    <SelectTrigger data-testid="select-branch">
                      <SelectValue placeholder={
                        !form.ptId ? "Pilih PT dulu" : 
                        availableBranches.length === 0 ? "Tidak ada cabang" : 
                        "Pilih cabang"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada cabang</SelectItem>
                      {availableBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.code} - {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceoUnit">CEO Unit</Label>
                  <Select 
                    value={form.ceoUnitId || "none"} 
                    onValueChange={(val) => setForm({ ...form, ceoUnitId: val === "none" ? "" : val })}
                  >
                    <SelectTrigger data-testid="select-ceo-unit">
                      <SelectValue placeholder="Pilih CEO unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada CEO Unit</SelectItem>
                      {ceoUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Manager Selection - Hierarchy Builder */}
              <div className="space-y-2">
                <Label htmlFor="manager">
                  Atasan Langsung (Manager)
                  {selectedPosition && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Hanya level lebih tinggi dari {selectedPosition.level})
                    </span>
                  )}
                </Label>
                <Select 
                  value={form.managerId || "none"} 
                  onValueChange={(val) => setForm({ ...form, managerId: val === "none" ? "" : val })}
                  disabled={!form.positionId}
                >
                  <SelectTrigger data-testid="select-manager">
                    <SelectValue placeholder={
                      !form.positionId ? "Pilih posisi dulu" :
                      availableManagers.length === 0 ? "Tidak ada atasan tersedia" :
                      "Pilih atasan"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada atasan (Top Level)</SelectItem>
                    {availableManagers.map(mgr => (
                      <SelectItem key={mgr.id} value={mgr.id}>
                        {mgr.employeeCode} - {mgr.fullName} ({mgr.position?.name || "Unknown"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tentukan siapa atasan langsung karyawan ini dalam hierarki organisasi
                </p>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08123456789"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Date of Birth & Join Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Tanggal Lahir *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    data-testid="input-date-of-birth"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Tanggal Bergabung *</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    data-testid="input-join-date"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(val: "active" | "inactive") => setForm({ ...form, status: val })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setEditingEmployee(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Batal
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-employee"
              >
                {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" data-testid="tab-list">
            <Users className="w-4 h-4 mr-2" />
            Daftar Karyawan
          </TabsTrigger>
          <TabsTrigger value="tree" data-testid="tab-tree">
            <Network className="w-4 h-4 mr-2" />
            Struktur Hierarki
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Cari Karyawan</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nama atau kode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-employee"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterPt">Filter PT</Label>
                  <Select value={filterPt} onValueChange={setFilterPt}>
                    <SelectTrigger data-testid="select-filter-pt">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua PT</SelectItem>
                      {pts.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterBranch">Filter Cabang</Label>
                  <Select value={filterBranch} onValueChange={setFilterBranch}>
                    <SelectTrigger data-testid="select-filter-branch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {branches
                        .sort((a, b) => {
                          const countA = employees.filter(e => e.branchId === a.id).length;
                          const countB = employees.filter(e => e.branchId === b.id).length;
                          return countB - countA;
                        })
                        .map(branch => {
                          const count = employees.filter(e => e.branchId === branch.id).length;
                          return (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.code} - {branch.name} ({count})
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterPosition">Filter Posisi</Label>
                  <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger data-testid="select-filter-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Posisi</SelectItem>
                      {positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterStatus">Filter Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger data-testid="select-filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Daftar Karyawan ({filteredEmployees.length})
              </CardTitle>
              <CardDescription>
                Kelola data karyawan dan struktur hierarki organisasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Posisi</TableHead>
                        <TableHead>PT</TableHead>
                        <TableHead>Cabang</TableHead>
                        <TableHead>Atasan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Tidak ada data karyawan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map(emp => (
                          <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`}>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-code-${emp.id}`}>
                                {emp.employeeCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-name-${emp.id}`}>
                              {emp.fullName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {emp.position?.name || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>{emp.pt?.code || "Unknown"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {emp.branch?.code || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {emp.manager?.fullName || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={emp.status === "active" ? "default" : "secondary"}
                                className={emp.status === "active" ? "bg-green-600" : ""}
                              >
                                {emp.status === "active" ? "Aktif" : "Tidak Aktif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(emp)}
                                  data-testid={`button-edit-${emp.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus karyawan:\n\n${emp.fullName} (${emp.employeeCode})\n${emp.position?.name || 'Unknown'} - ${emp.pt?.code || 'Unknown'}\n\nData yang terhapus tidak dapat dikembalikan!`)) {
                                      deleteMutation.mutate(emp.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${emp.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tree View */}
        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Struktur Hierarki Organisasi
              </CardTitle>
              <CardDescription>
                Visualisasi tree struktur reporting organisasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Filters for tree view */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="treeFilterPt">Filter PT</Label>
                      <Select value={filterPt} onValueChange={setFilterPt}>
                        <SelectTrigger data-testid="select-tree-filter-pt">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua PT</SelectItem>
                          {pts.map(pt => (
                            <SelectItem key={pt.id} value={pt.id}>
                              {pt.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treeFilterStatus">Filter Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger data-testid="select-tree-filter-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Total: {filteredEmployees.length} karyawan</p>
                        <p>Top-level: {filteredEmployees.filter(e => !e.managerId).length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tree Visualization */}
                  <div className="space-y-4">
                    {filteredEmployees.filter(emp => !emp.managerId).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada karyawan top-level untuk ditampilkan</p>
                        <p className="text-xs mt-2">Pastikan ada karyawan dengan "Tidak ada atasan"</p>
                      </div>
                    ) : (
                      filteredEmployees
                        .filter(emp => !emp.managerId) // Get top-level employees
                        .map(rootEmp => (
                          <EmployeeTreeNode
                            key={rootEmp.id}
                            employee={rootEmp}
                            allEmployees={filteredEmployees}
                            onEdit={handleEdit}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            level={0}
                          />
                        ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Recursive Tree Node Component
type EmployeeTreeNodeProps = {
  employee: Employee;
  allEmployees: Employee[];
  onEdit: (emp: Employee) => void;
  onDelete: (id: string) => void;
  level: number;
};

function EmployeeTreeNode({ employee, allEmployees, onEdit, onDelete, level }: EmployeeTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get direct subordinates
  const subordinates = allEmployees.filter(emp => emp.managerId === employee.id);
  const hasSubordinates = subordinates.length > 0;

  // Get position level color (gradient based on hierarchy)
  const getLevelColor = (level: number | undefined) => {
    if (!level) return "bg-gray-500";
    if (level <= 3) return "bg-gradient-to-r from-purple-500 to-pink-500"; // Owner, CEO, CBO
    if (level <= 6) return "bg-gradient-to-r from-blue-500 to-cyan-500"; // BrM, VBM, SEM
    if (level <= 9) return "bg-gradient-to-r from-green-500 to-emerald-500"; // EM, SBM, BsM
    return "bg-gradient-to-r from-yellow-500 to-orange-500"; // SBC, BC
  };

  return (
    <div className="space-y-2" style={{ marginLeft: `${level * 2}rem` }}>
      {/* Employee Card */}
      <Card 
        className="hover-elevate active-elevate-2 transition-all cursor-pointer"
        data-testid={`tree-node-${employee.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Expand/Collapse Button */}
            {hasSubordinates && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid={`button-toggle-${employee.id}`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Avatar with Position Level Indicator */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getLevelColor(employee.position?.level)}`}>
                {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              {employee.position && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-bold">
                  {employee.position.level}
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-base truncate" data-testid={`text-tree-name-${employee.id}`}>
                  {employee.fullName}
                </h4>
                <Badge variant="outline" className="shrink-0">
                  {employee.employeeCode}
                </Badge>
                <Badge 
                  variant={employee.status === "active" ? "default" : "secondary"}
                  className={employee.status === "active" ? "bg-green-600 shrink-0" : "shrink-0"}
                >
                  {employee.status === "active" ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {employee.position?.name || "Unknown"}
                  </Badge>
                </span>
                <span>•</span>
                <span>{employee.pt?.code || "Unknown"}</span>
                {employee.branch && (
                  <>
                    <span>•</span>
                    <span>{employee.branch.code}</span>
                  </>
                )}
                {employee.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {employee.email}
                    </span>
                  </>
                )}
                {employee.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {employee.phone}
                    </span>
                  </>
                )}
              </div>
              
              {hasSubordinates && (
                <div className="mt-2 text-xs text-muted-foreground">
                  👥 {subordinates.length} bawahan langsung
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(employee)}
                data-testid={`button-tree-edit-${employee.id}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus karyawan:\n\n${employee.fullName} (${employee.employeeCode})\n${employee.position?.name || 'Unknown'} - ${employee.pt?.code || 'Unknown'}\n\nData yang terhapus tidak dapat dikembalikan!`)) {
                    onDelete(employee.id);
                  }
                }}
                data-testid={`button-tree-delete-${employee.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subordinates (Recursive) */}
      {hasSubordinates && isExpanded && (
        <div className="space-y-2 border-l-2 border-muted pl-4">
          {subordinates.map(sub => (
            <EmployeeTreeNode
              key={sub.id}
              employee={sub}
              allEmployees={allEmployees}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
