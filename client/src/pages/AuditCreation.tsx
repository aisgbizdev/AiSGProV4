import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { PILARS, PILAR_CATEGORIES, SCORE_LEVELS, getCategoryById } from "@shared/pillar-constants";
import type { Employee } from "@shared/schema";
import type { AuditCreateResultDto, QuarterlyPerformanceDto, PendingSubordinateDto } from "@shared/types";

const auditFormSchema = z.object({
  employeeId: z.string().min(1, "Pilih marketing"),
  year: z.coerce.number().int().min(2020).max(2030),
  quarter: z.coerce.number().int().min(1).max(4),
  pillarAnswers: z.array(z.object({
    pillarId: z.number(),
    pillarName: z.string(),
    category: z.string(),
    score: z.number().min(1).max(5),
    notes: z.string().optional(),
  })).length(18, "Semua 18 pilar harus diisi"),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

export default function AuditCreation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  // Fetch employees (RBAC-filtered on backend)
  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/enterprise/employees"],
  });

  // Fetch quarterly performance for selected employee
  const { data: quarterlyPerf, isLoading: loadingPerf } = useQuery<QuarterlyPerformanceDto>({
    queryKey: ["/api/enterprise/performance/quarterly", selectedEmployeeId, selectedYear, selectedQuarter],
    enabled: !!selectedEmployeeId,
  });

  // Initialize form with default scores
  const defaultPillarAnswers = PILARS.map(pilar => ({
    pillarId: pilar.id,
    pillarName: pilar.name,
    category: pilar.category,
    score: 3, // Default to "Cukup"
    notes: "",
  }));

  const form = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      employeeId: "",
      year: new Date().getFullYear(),
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      pillarAnswers: defaultPillarAnswers,
    },
  });

  const [auditWarnings, setAuditWarnings] = useState<string[]>([]);
  const [pendingSubordinates, setPendingSubordinates] = useState<PendingSubordinateDto[]>([]);

  // Create audit mutation
  const createAudit = useMutation({
    mutationFn: async (data: AuditFormData) => {
      return await apiRequest<AuditCreateResultDto>("/api/enterprise/audits", "POST", data);
    },
    onSuccess: (response) => {
      // Always reset warnings (prevent stale state)
      setAuditWarnings(response.warnings || []);
      setPendingSubordinates(response.pendingSubordinates || []);
      
      toast({
        title: "Audit Berhasil Dibuat!",
        description: response.warnings.length > 0 
          ? `Audit tersimpan dengan ${response.warnings.length} catatan`
          : "Audit marketing telah tersimpan",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/audits"] });
      form.reset();
      setSelectedEmployeeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Audit",
        description: error.message || "Terjadi kesalahan saat membuat audit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AuditFormData) => {
    createAudit.mutate(data);
  };

  const quarterNames = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Okt-Des)"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Buat Audit Marketing
          </h1>
          <p className="text-muted-foreground">
            Audit kinerja marketing berdasarkan 18 Pilar Framework
          </p>
        </div>

        {/* Warnings Display */}
        {auditWarnings.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10" data-testid="alert-audit-warnings">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-500">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {auditWarnings.map((warning, idx) => (
                    <li key={idx} className="text-muted-foreground">{warning}</li>
                  ))}
                </ul>
                {pendingSubordinates.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50">
                    <p className="text-sm font-semibold mb-2">Subordinate yang belum audit:</p>
                    <div className="space-y-1 text-xs">
                      {pendingSubordinates.map((sub, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{sub.fullName} ({sub.employeeCode})</span>
                          <span className="text-muted-foreground">{sub.positionName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAuditWarnings([]);
                    setPendingSubordinates([]);
                  }}
                  className="mt-2"
                  data-testid="button-dismiss-warnings"
                >
                  Tutup
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee & Period Selection */}
            <Card className="border-purple-500/20 shadow-xl shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  Informasi Audit
                </CardTitle>
                <CardDescription>Pilih marketing dan periode audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing *</FormLabel>
                      <Select
                        disabled={loadingEmployees}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedEmployeeId(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-audit">
                            <SelectValue placeholder="Pilih marketing..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.employeeCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2025"
                            data-testid="input-audit-year"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSelectedYear(parseInt(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quarter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quarter *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            setSelectedQuarter(parseInt(value));
                          }}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-audit-quarter">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {quarterNames.map((name, idx) => (
                              <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Performance Summary */}
                {selectedEmployeeId && quarterlyPerf && (
                  <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Performance {quarterNames[selectedQuarter - 1]} {selectedYear}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Margin Personal:</span>
                        <p className="font-semibold">Rp {parseFloat(quarterlyPerf.aggregated.totalMarginPersonal).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NA Personal:</span>
                        <p className="font-semibold">{quarterlyPerf.aggregated.totalNAPersonal}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lot Settled:</span>
                        <p className="font-semibold">{quarterlyPerf.aggregated.totalLotSettled}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bulan Tersedia:</span>
                        <p className="font-semibold">{quarterlyPerf.months.length}/3 bulan</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 18 Pilar Assessment */}
            {PILAR_CATEGORIES.map((category) => {
              const categoryPilars = PILARS.filter(p => p.category === category.id);
              const catInfo = getCategoryById(category.id);
              
              return (
                <Card key={category.id} className={`border-l-4 ${catInfo?.borderColor} shadow-xl shadow-purple-500/5`}>
                  <CardHeader className={catInfo?.bgColor}>
                    <CardTitle className={`text-lg ${catInfo?.color}`}>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.nameEn}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {categoryPilars.map((pilar, idx) => {
                      const pillarIndex = PILARS.findIndex(p => p.id === pilar.id);
                      
                      return (
                        <FormField
                          key={pilar.id}
                          control={form.control}
                          name={`pillarAnswers.${pillarIndex}.score`}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-semibold">
                                {pilar.id}. {pilar.name}
                              </FormLabel>
                              <FormDescription className="text-xs">
                                {pilar.description}
                              </FormDescription>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value?.toString()}
                                  className="flex gap-4"
                                >
                                  {SCORE_LEVELS.map((level) => (
                                    <div key={level.value} className="flex items-center space-x-2">
                                      <RadioGroupItem 
                                        value={level.value.toString()} 
                                        id={`pilar-${pilar.id}-${level.value}`}
                                        data-testid={`radio-pilar-${pilar.id}-score-${level.value}`}
                                      />
                                      <Label 
                                        htmlFor={`pilar-${pilar.id}-${level.value}`}
                                        className={`text-sm cursor-pointer ${level.color}`}
                                      >
                                        {level.value} - {level.label}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}

            {/* Submit Button */}
            <Card className="border-purple-500/20">
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={createAudit.isPending || !selectedEmployeeId}
                  data-testid="button-submit-audit"
                >
                  {createAudit.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat Audit...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Buat Audit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
