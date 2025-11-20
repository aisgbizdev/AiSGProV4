import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";

type Branch = { id: string; code: string; name: string; ptId: string };

interface UploadResult {
  success: boolean;
  uploadLogId: string;
  summary: {
    totalRows: number;
    employeesCreated: number;
    employeesUpdated: number;
    usersCreated: number;
    performanceRecordsCreated: number;
    errors: Array<{
      row: number;
      field: string;
      error: string;
      value?: any;
    }>;
  };
  message: string;
}

interface UploadExcelDialogProps {
  branches: Branch[];
  trigger?: React.ReactNode;
}

export function UploadExcelDialog({ branches, trigger }: UploadExcelDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  const [uploadMode, setUploadMode] = useState<"single" | "bulk">("single");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/enterprise/upload-excel", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorData: any = null;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Upload gagal");
        }
        
        // Handle validation errors with details
        if (errorData.invalidRows && errorData.summary) {
          const { summary, invalidRows } = errorData;
          const firstErrors = invalidRows.slice(0, 3);
          const errorDetails = firstErrors.map((item: any) => 
            `Row ${item.row}: ${item.errors.map((e: any) => `${e.field} - ${e.error}`).join(', ')}`
          ).join('\n');
          
          const more = invalidRows.length > 3 ? `\n... dan ${invalidRows.length - 3} error lainnya` : '';
          throw new Error(`${summary.invalid} dari ${summary.total} baris tidak valid:\n\n${errorDetails}${more}\n\nPeriksa format:\n- Tanggal: YYYY-MM-DD\n- Margin/NA: angka valid`);
        }
        
        throw new Error(errorData.error || errorData.message || errorText || "Upload gagal");
      }
      
      return res.json() as Promise<UploadResult>;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/branches"] });
      
      const hasErrors = data.summary.errors.length > 0;
      toast({
        title: hasErrors ? "Upload selesai dengan error" : "Upload berhasil!",
        description: `${data.summary.employeesCreated + data.summary.employeesUpdated} marketing berhasil diproses${hasErrors ? `, ${data.summary.errors.length} baris error` : ''}`,
        variant: hasErrors ? "default" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Maksimum ukuran file adalah 50MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Format file tidak valid",
        description: "Hanya file Excel (.xlsx, .xls) yang diperbolehkan",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const bulkUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/enterprise/upload-bas-bulk", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorData: any = null;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Upload BAS gagal");
        }
        throw new Error(errorData.error || errorData.message || errorText || "Upload BAS gagal");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/pts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/ceo-units"] });
      
      toast({
        title: "Upload BAS berhasil!",
        description: `${data.summary.employeesCreated + data.summary.employeesUpdated} karyawan, ${data.summary.branchesCreated} cabang, ${data.summary.performanceRecordsCreated} records diproses`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload BAS gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    // Validation based on mode
    if (uploadMode === "single") {
      if (!selectedFile || !selectedBranchId || !period) {
        toast({
          title: "Data tidak lengkap",
          description: "Pilih file, branch, dan period terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("branchId", selectedBranchId);
      formData.append("period", period);
      formData.append("overwriteExisting", String(overwriteExisting));

      uploadMutation.mutate(formData);
    } else {
      // Bulk mode (BAS format)
      if (!selectedFile || !period) {
        toast({
          title: "Data tidak lengkap",
          description: "Pilih file dan period terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("period", period);
      formData.append("overwriteExisting", String(overwriteExisting));

      bulkUploadMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setSelectedFile(null);
      setSelectedBranchId("");
      setPeriod(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      });
      setOverwriteExisting(false);
      setShowAdvanced(false);
      setUploadResult(null);
    }, 200);
  };

  const downloadErrorReport = () => {
    if (!uploadResult || uploadResult.summary.errors.length === 0) return;

    const headers = ["Row", "Field", "Error", "Value"];
    const rows = uploadResult.summary.errors.map(err => [
      err.row,
      err.field,
      err.error,
      err.value ?? ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `error-report-${uploadResult.uploadLogId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isUploadDisabled = 
    !selectedFile || 
    !period || 
    (uploadMode === "single" && !selectedBranchId) || 
    uploadMutation.isPending || 
    bulkUploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Upload Data Marketing (Excel)" : "Hasil Upload"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Persyaratan Upload:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Format: Excel (.xlsx atau .xls)</li>
                    <li>Ukuran maksimum: 50MB</li>
                    <li>Maksimum 10,000 baris data (support untuk full BAS data ~3K employees)</li>
                    <li>Gunakan template yang tersedia untuk menghindari error</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Template Excel</Label>
                <a
                  href="/templates/employee-upload.xlsx"
                  download
                  className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Template
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Mode Upload</Label>
              <Select value={uploadMode} onValueChange={(value) => setUploadMode(value as "single" | "bulk")} disabled={uploadMutation.isPending || bulkUploadMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mode upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Branch (Template Standard)</SelectItem>
                  <SelectItem value="bulk">Multi-Branch - Auto-Detect (Format BAS)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {uploadMode === "single" 
                  ? "Upload untuk 1 branch dengan template standard" 
                  : "Upload semua cabang sekaligus (format Data_BAS.xls) - otomatis deteksi PT, CEO Unit, dan Branches"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File Excel *</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending || bulkUploadMutation.isPending}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File dipilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {uploadMode === "single" && (
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={uploadMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.code} - {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="period">Period (Bulan/Tahun) *</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={uploadMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Format: YYYY-MM (contoh: 2025-01)
              </p>
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="text-sm">Opsi Lanjutan</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) => setOverwriteExisting(!!checked)}
                    disabled={uploadMutation.isPending}
                  />
                  <Label htmlFor="overwrite" className="text-sm font-normal cursor-pointer">
                    Timpa data yang sudah ada (overwrite)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika dicentang, data marketing yang sudah ada akan diupdate. Jika tidak, hanya marketing baru yang akan ditambahkan.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending || bulkUploadMutation.isPending}>
                Batal
              </Button>
              <Button onClick={handleUpload} disabled={isUploadDisabled}>
                {(uploadMutation.isPending || bulkUploadMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {(uploadMutation.isPending || bulkUploadMutation.isPending) ? "Mengupload..." : "Upload"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && uploadResult && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {uploadResult.summary.errors.length === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Upload Berhasil
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      Upload Selesai dengan Warning
                    </>
                  )}
                </CardTitle>
                <CardDescription>{uploadResult.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Baris</p>
                    <p className="text-2xl font-bold">{uploadResult.summary.totalRows}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Marketing Dibuat</p>
                    <p className="text-2xl font-bold text-green-500">{uploadResult.summary.employeesCreated}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Marketing Diupdate</p>
                    <p className="text-2xl font-bold text-blue-500">{uploadResult.summary.employeesUpdated}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">User Dibuat</p>
                    <p className="text-2xl font-bold text-purple-500">{uploadResult.summary.usersCreated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {uploadResult.summary.errors.length > 0 && (
              <Tabs defaultValue="errors" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="errors">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error ({uploadResult.summary.errors.length})
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Ringkasan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="errors" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {uploadResult.summary.errors.length} baris dengan error
                    </p>
                    <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Baris</TableHead>
                          <TableHead className="w-32">Field</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead className="w-32">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.summary.errors.slice(0, 50).map((err, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{err.row}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{err.field}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-red-500">{err.error}</TableCell>
                            <TableCell className="font-mono text-xs truncate max-w-[200px]">
                              {err.value !== undefined ? String(err.value) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {uploadResult.summary.errors.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Menampilkan 50 dari {uploadResult.summary.errors.length} error. Download error report untuk melihat semua.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="summary">
                  <Card>
                    <CardContent className="pt-6 space-y-2">
                      <p className="text-sm">✅ {uploadResult.summary.employeesCreated} marketing baru berhasil ditambahkan</p>
                      <p className="text-sm">📝 {uploadResult.summary.employeesUpdated} marketing berhasil diupdate</p>
                      <p className="text-sm">👤 {uploadResult.summary.usersCreated} user account berhasil dibuat</p>
                      <p className="text-sm">📊 {uploadResult.summary.performanceRecordsCreated} performance record berhasil dibuat</p>
                      {uploadResult.summary.errors.length > 0 && (
                        <p className="text-sm text-yellow-600">⚠️ {uploadResult.summary.errors.length} baris gagal diproses</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Upload File Lain
              </Button>
              <Button onClick={handleClose}>
                Selesai
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
