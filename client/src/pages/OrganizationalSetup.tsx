import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Briefcase, Plus, Pencil, Trash2, Building } from "lucide-react";
import type { Pt, CeoUnit, Branch, Position } from "@shared/schema";

export default function OrganizationalSetup() {
  const { toast } = useToast();
  const [ptDialogOpen, setPtDialogOpen] = useState(false);
  const [ceoDialogOpen, setCeoDialogOpen] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);

  // Form states for PT
  const [ptForm, setPtForm] = useState({ id: "", code: "", name: "" });
  const [editingPt, setEditingPt] = useState<Pt | null>(null);

  // Form states for CEO Unit (with ptId and code)
  const [ceoForm, setCeoForm] = useState({ id: "", ptId: "", code: "", name: "" });
  const [editingCeo, setEditingCeo] = useState<CeoUnit | null>(null);

  // Form states for Branch (with ceoUnitId)
  const [branchForm, setBranchForm] = useState({ id: "", code: "", name: "", region: "", ptId: "", ceoUnitId: "" });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form states for Position
  const [positionForm, setPositionForm] = useState({ id: "", code: "", name: "", level: 1, description: "" });
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // Fetch data
  const { data: pts = [], isLoading: ptsLoading } = useQuery<Pt[]>({ queryKey: ["/api/enterprise/pts"] });
  const { data: ceoUnits = [], isLoading: ceosLoading } = useQuery<CeoUnit[]>({ queryKey: ["/api/enterprise/ceo-units"] });
  const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({ queryKey: ["/api/enterprise/branches"] });
  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({ queryKey: ["/api/enterprise/positions"] });

  // PT mutations
  const createPtMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/enterprise/pts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/pts"] });
      toast({ title: "PT berhasil ditambahkan" });
      setPtDialogOpen(false);
      setPtForm({ id: "", code: "", name: "" });
    },
    onError: () => toast({ title: "Gagal menambahkan PT", variant: "destructive" })
  });

  const updatePtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/enterprise/pts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/pts"] });
      toast({ title: "PT berhasil diupdate" });
      setPtDialogOpen(false);
      setEditingPt(null);
      setPtForm({ id: "", code: "", name: "" });
    },
    onError: () => toast({ title: "Gagal mengupdate PT", variant: "destructive" })
  });

  const deletePtMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enterprise/pts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/pts"] });
      toast({ title: "PT berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus PT", variant: "destructive" })
  });

  // CEO Unit mutations
  const createCeoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/enterprise/ceo-units", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/ceo-units"] });
      toast({ title: "CEO Unit berhasil ditambahkan" });
      setCeoDialogOpen(false);
      setCeoForm({ id: "", ptId: "", code: "", name: "" });
    },
    onError: () => toast({ title: "Gagal menambahkan CEO Unit", variant: "destructive" })
  });

  const updateCeoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/enterprise/ceo-units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/ceo-units"] });
      toast({ title: "CEO Unit berhasil diupdate" });
      setCeoDialogOpen(false);
      setEditingCeo(null);
      setCeoForm({ id: "", ptId: "", code: "", name: "" });
    },
    onError: () => toast({ title: "Gagal mengupdate CEO Unit", variant: "destructive" })
  });

  const deleteCeoMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enterprise/ceo-units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/ceo-units"] });
      toast({ title: "CEO Unit berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus CEO Unit", variant: "destructive" })
  });

  // Branch mutations
  const createBranchMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/enterprise/branches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/branches"] });
      toast({ title: "Cabang berhasil ditambahkan" });
      setBranchDialogOpen(false);
      setBranchForm({ id: "", code: "", name: "", region: "", ptId: "", ceoUnitId: "" });
    },
    onError: () => toast({ title: "Gagal menambahkan cabang", variant: "destructive" })
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/enterprise/branches/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/branches"] });
      toast({ title: "Cabang berhasil diupdate" });
      setBranchDialogOpen(false);
      setEditingBranch(null);
      setBranchForm({ id: "", code: "", name: "", region: "", ptId: "", ceoUnitId: "" });
    },
    onError: () => toast({ title: "Gagal mengupdate cabang", variant: "destructive" })
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enterprise/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/branches"] });
      toast({ title: "Cabang berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus cabang", variant: "destructive" })
  });

  // Position mutations
  const createPositionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/enterprise/positions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/positions"] });
      toast({ title: "Posisi berhasil ditambahkan" });
      setPositionDialogOpen(false);
      setPositionForm({ id: "", code: "", name: "", level: 1, description: "" });
    },
    onError: () => toast({ title: "Gagal menambahkan posisi", variant: "destructive" })
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/enterprise/positions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/positions"] });
      toast({ title: "Posisi berhasil diupdate" });
      setPositionDialogOpen(false);
      setEditingPosition(null);
      setPositionForm({ id: "", code: "", name: "", level: 1, description: "" });
    },
    onError: () => toast({ title: "Gagal mengupdate posisi", variant: "destructive" })
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enterprise/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/positions"] });
      toast({ title: "Posisi berhasil dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus posisi", variant: "destructive" })
  });

  // Handle PT submit
  const handlePtSubmit = () => {
    if (editingPt) {
      updatePtMutation.mutate({ id: editingPt.id, data: { code: ptForm.code, name: ptForm.name } });
    } else {
      createPtMutation.mutate({ code: ptForm.code, name: ptForm.name });
    }
  };

  // Handle CEO submit
  const handleCeoSubmit = () => {
    if (editingCeo) {
      updateCeoMutation.mutate({ id: editingCeo.id, data: { ptId: ceoForm.ptId, code: ceoForm.code, name: ceoForm.name } });
    } else {
      createCeoMutation.mutate({ ptId: ceoForm.ptId, code: ceoForm.code, name: ceoForm.name });
    }
  };

  // Handle Branch submit
  const handleBranchSubmit = () => {
    if (editingBranch) {
      updateBranchMutation.mutate({ 
        id: editingBranch.id, 
        data: { 
          code: branchForm.code, 
          name: branchForm.name, 
          region: branchForm.region || null,
          ceoUnitId: branchForm.ceoUnitId,
          ptId: branchForm.ptId || null
        } 
      });
    } else {
      createBranchMutation.mutate({ 
        code: branchForm.code, 
        name: branchForm.name, 
        region: branchForm.region || null,
        ceoUnitId: branchForm.ceoUnitId,
        ptId: branchForm.ptId || null
      });
    }
  };

  // Handle Position submit
  const handlePositionSubmit = () => {
    if (editingPosition) {
      updatePositionMutation.mutate({ 
        id: editingPosition.id, 
        data: { 
          code: positionForm.code, 
          name: positionForm.name, 
          level: positionForm.level,
          description: positionForm.description || null
        } 
      });
    } else {
      createPositionMutation.mutate({ 
        code: positionForm.code, 
        name: positionForm.name, 
        level: positionForm.level,
        description: positionForm.description || null
      });
    }
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Pengaturan Organisasi
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola struktur organisasi perusahaan (PT, CEO Unit, Cabang, Posisi)
            </p>
          </div>
        </div>

        <Tabs defaultValue="pts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger value="pts" className="flex items-center gap-2" data-testid="tab-pts">
              <Building2 className="w-4 h-4" />
              PT Companies
            </TabsTrigger>
            <TabsTrigger value="ceos" className="flex items-center gap-2" data-testid="tab-ceos">
              <Building className="w-4 h-4" />
              CEO Units
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2" data-testid="tab-branches">
              <MapPin className="w-4 h-4" />
              Cabang
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2" data-testid="tab-positions">
              <Briefcase className="w-4 h-4" />
              Posisi
            </TabsTrigger>
          </TabsList>

          {/* PT Tab */}
          <TabsContent value="pts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>PT Companies</CardTitle>
                  <CardDescription>5 perusahaan PT dalam grup AISG</CardDescription>
                </div>
                <Dialog open={ptDialogOpen} onOpenChange={setPtDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingPt(null);
                        setPtForm({ id: "", code: "", name: "" });
                      }}
                      data-testid="button-add-pt"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah PT
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-pt-form">
                    <DialogHeader>
                      <DialogTitle>{editingPt ? "Edit PT" : "Tambah PT Baru"}</DialogTitle>
                      <DialogDescription>
                        {editingPt ? "Ubah data PT" : "Tambahkan PT baru ke dalam sistem"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pt-code">Kode PT</Label>
                        <Input
                          id="pt-code"
                          value={ptForm.code}
                          onChange={(e) => setPtForm({ ...ptForm, code: e.target.value })}
                          placeholder="e.g., RFB"
                          data-testid="input-pt-code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pt-name">Nama PT</Label>
                        <Input
                          id="pt-name"
                          value={ptForm.name}
                          onChange={(e) => setPtForm({ ...ptForm, name: e.target.value })}
                          placeholder="e.g., PT Rifan Financindo Berjangka"
                          data-testid="input-pt-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handlePtSubmit} 
                        disabled={createPtMutation.isPending || updatePtMutation.isPending}
                        data-testid="button-submit-pt"
                      >
                        {editingPt ? "Update" : "Tambah"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {ptsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama PT</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pts.map((pt) => (
                        <TableRow key={pt.id} data-testid={`row-pt-${pt.code}`}>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-pt-code-${pt.code}`}>{pt.code}</Badge>
                          </TableCell>
                          <TableCell data-testid={`text-pt-name-${pt.code}`}>{pt.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingPt(pt);
                                  setPtForm({ id: pt.id, code: pt.code, name: pt.name });
                                  setPtDialogOpen(true);
                                }}
                                data-testid={`button-edit-pt-${pt.code}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus PT ${pt.name}?`)) {
                                    deletePtMutation.mutate(pt.id);
                                  }
                                }}
                                data-testid={`button-delete-pt-${pt.code}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CEO Units Tab */}
          <TabsContent value="ceos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>CEO Units</CardTitle>
                  <CardDescription>5 unit CEO dalam organisasi</CardDescription>
                </div>
                <Dialog open={ceoDialogOpen} onOpenChange={setCeoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingCeo(null);
                        setCeoForm({ id: "", ptId: "", code: "", name: "" });
                      }}
                      data-testid="button-add-ceo"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah CEO Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-ceo-form">
                    <DialogHeader>
                      <DialogTitle>{editingCeo ? "Edit CEO Unit" : "Tambah CEO Unit Baru"}</DialogTitle>
                      <DialogDescription>
                        {editingCeo ? "Ubah data CEO Unit" : "Tambahkan CEO Unit baru"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ceo-pt">PT Company *</Label>
                        <Select value={ceoForm.ptId} onValueChange={(value) => setCeoForm({ ...ceoForm, ptId: value })}>
                          <SelectTrigger id="ceo-pt" data-testid="select-ceo-pt">
                            <SelectValue placeholder="Pilih PT" />
                          </SelectTrigger>
                          <SelectContent>
                            {pts.map((pt) => (
                              <SelectItem key={pt.id} value={pt.id}>
                                {pt.code} - {pt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ceo-code">Kode Unit *</Label>
                        <Input
                          id="ceo-code"
                          value={ceoForm.code}
                          onChange={(e) => setCeoForm({ ...ceoForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., NL"
                          data-testid="input-ceo-code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceo-name">Nama CEO Unit</Label>
                        <Input
                          id="ceo-name"
                          value={ceoForm.name}
                          onChange={(e) => setCeoForm({ ...ceoForm, name: e.target.value })}
                          placeholder="e.g., ISRIYETTI"
                          data-testid="input-ceo-name"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Gunakan nama CEO sebagai identifier (e.g., ISRIYETTI, NL, GS, TJANDRA, EDWIN)
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCeoSubmit} 
                        disabled={createCeoMutation.isPending || updateCeoMutation.isPending}
                        data-testid="button-submit-ceo"
                      >
                        {editingCeo ? "Update" : "Tambah"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {ceosLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama CEO Unit</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ceoUnits.map((ceo) => (
                        <TableRow key={ceo.id} data-testid={`row-ceo-${ceo.name}`}>
                          <TableCell>
                            <Badge data-testid={`badge-ceo-name-${ceo.name}`}>{ceo.name}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingCeo(ceo);
                                  setCeoForm({ id: ceo.id, ptId: ceo.ptId, code: ceo.code, name: ceo.name });
                                  setCeoDialogOpen(true);
                                }}
                                data-testid={`button-edit-ceo-${ceo.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus CEO Unit ${ceo.name}?`)) {
                                    deleteCeoMutation.mutate(ceo.id);
                                  }
                                }}
                                data-testid={`button-delete-ceo-${ceo.name}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>Cabang</CardTitle>
                  <CardDescription>{branches.length} cabang tersebar di seluruh Indonesia</CardDescription>
                </div>
                <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingBranch(null);
                        setBranchForm({ id: "", code: "", name: "", region: "", ptId: "", ceoUnitId: "" });
                      }}
                      data-testid="button-add-branch"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Cabang
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-branch-form">
                    <DialogHeader>
                      <DialogTitle>{editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
                      <DialogDescription>
                        {editingBranch ? "Ubah data cabang" : "Tambahkan cabang baru"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="branch-code">Kode Cabang</Label>
                        <Input
                          id="branch-code"
                          value={branchForm.code}
                          onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                          placeholder="e.g., JKT-01"
                          data-testid="input-branch-code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch-name">Nama Cabang</Label>
                        <Input
                          id="branch-name"
                          value={branchForm.name}
                          onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                          placeholder="e.g., Jakarta Pusat"
                          data-testid="input-branch-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch-region">Region (Opsional)</Label>
                        <Input
                          id="branch-region"
                          value={branchForm.region}
                          onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                          placeholder="e.g., Jakarta, Medan, Surabaya"
                          data-testid="input-branch-region"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Wilayah cabang untuk pengelompokan geografis
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="branch-ceo">CEO Unit *</Label>
                        <Select 
                          value={branchForm.ceoUnitId} 
                          onValueChange={(value) => setBranchForm({ ...branchForm, ceoUnitId: value })}
                        >
                          <SelectTrigger id="branch-ceo" data-testid="select-branch-ceo">
                            <SelectValue placeholder="Pilih CEO Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {ceoUnits.map((ceo) => (
                              <SelectItem key={ceo.id} value={ceo.id}>{ceo.code} - {ceo.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="branch-pt">PT Company (Opsional)</Label>
                        <Select 
                          value={branchForm.ptId} 
                          onValueChange={(value) => setBranchForm({ ...branchForm, ptId: value })}
                        >
                          <SelectTrigger id="branch-pt" data-testid="select-branch-pt">
                            <SelectValue placeholder="Pilih PT" />
                          </SelectTrigger>
                          <SelectContent>
                            {pts.map((pt) => (
                              <SelectItem key={pt.id} value={pt.id}>{pt.code} - {pt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleBranchSubmit} 
                        disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                        data-testid="button-submit-branch"
                      >
                        {editingBranch ? "Update" : "Tambah"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {branchesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Cabang</TableHead>
                        <TableHead>PT</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((branch) => {
                        const pt = pts.find((p) => p.id === branch.ptId);
                        return (
                          <TableRow key={branch.id} data-testid={`row-branch-${branch.code}`}>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-branch-code-${branch.code}`}>
                                {branch.code}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-branch-name-${branch.code}`}>{branch.name}</TableCell>
                            <TableCell>
                              <Badge data-testid={`badge-branch-pt-${branch.code}`}>{pt?.code}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-branch-region-${branch.code}`}>
                              {branch.region || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingBranch(branch);
                                    setBranchForm({
                                      id: branch.id,
                                      code: branch.code,
                                      name: branch.name,
                                      region: branch.region || "",
                                      ceoUnitId: branch.ceoUnitId,
                                      ptId: branch.ptId || ""
                                    });
                                    setBranchDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-branch-${branch.code}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Yakin ingin menghapus cabang ${branch.name}?`)) {
                                      deleteBranchMutation.mutate(branch.id);
                                    }
                                  }}
                                  data-testid={`button-delete-branch-${branch.code}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>Posisi</CardTitle>
                  <CardDescription>11 level posisi dalam hierarki organisasi</CardDescription>
                </div>
                <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingPosition(null);
                        setPositionForm({ id: "", code: "", name: "", level: 1, description: "" });
                      }}
                      data-testid="button-add-position"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Posisi
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-position-form">
                    <DialogHeader>
                      <DialogTitle>{editingPosition ? "Edit Posisi" : "Tambah Posisi Baru"}</DialogTitle>
                      <DialogDescription>
                        {editingPosition ? "Ubah data posisi" : "Tambahkan posisi baru"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="position-code">Kode Posisi</Label>
                        <Input
                          id="position-code"
                          value={positionForm.code}
                          onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                          placeholder="e.g., BC"
                          data-testid="input-position-code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position-name">Nama Posisi</Label>
                        <Input
                          id="position-name"
                          value={positionForm.name}
                          onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                          placeholder="e.g., Business Consultant"
                          data-testid="input-position-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position-level">Level (1=Tertinggi, 11=Terendah)</Label>
                        <Input
                          id="position-level"
                          type="number"
                          min={1}
                          max={11}
                          value={positionForm.level}
                          onChange={(e) => setPositionForm({ ...positionForm, level: parseInt(e.target.value) || 1 })}
                          data-testid="input-position-level"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position-description">Deskripsi (Opsional)</Label>
                        <Input
                          id="position-description"
                          value={positionForm.description}
                          onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                          placeholder="Deskripsi posisi"
                          data-testid="input-position-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handlePositionSubmit} 
                        disabled={createPositionMutation.isPending || updatePositionMutation.isPending}
                        data-testid="button-submit-position"
                      >
                        {editingPosition ? "Update" : "Tambah"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {positionsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Posisi</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.sort((a, b) => a.level - b.level).map((position) => (
                        <TableRow key={position.id} data-testid={`row-position-${position.code}`}>
                          <TableCell>
                            <Badge 
                              variant={position.level === 1 ? "default" : position.level <= 5 ? "secondary" : "outline"}
                              data-testid={`badge-position-level-${position.code}`}
                            >
                              {position.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-position-code-${position.code}`}>
                              {position.code}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-position-name-${position.code}`}>{position.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`text-position-description-${position.code}`}>
                            {position.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingPosition(position);
                                  setPositionForm({
                                    id: position.id,
                                    code: position.code,
                                    name: position.name,
                                    level: position.level,
                                    description: position.description || ""
                                  });
                                  setPositionDialogOpen(true);
                                }}
                                data-testid={`button-edit-position-${position.code}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus posisi ${position.name}?`)) {
                                    deletePositionMutation.mutate(position.id);
                                  }
                                }}
                                data-testid={`button-delete-position-${position.code}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
