import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Target, Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Employee, MonthlyPerformance } from "@shared/schema";

// Form validation schema
const performanceFormSchema = z.object({
  employeeId: z.string().min(1, "Pilih marketing"),
  year: z.coerce.number().int().min(2020).max(2030),
  month: z.coerce.number().int().min(1).max(12),
  marginPersonal: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Format decimal tidak valid (contoh: 1234.56)"),
  naPersonal: z.coerce.number().int().min(0, "NA harus 0 atau lebih"),
  lotSettled: z.coerce.number().int().min(0, "Lot Settled harus 0 atau lebih"),
});

type PerformanceFormData = z.infer<typeof performanceFormSchema>;

export default function PerformanceInput() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  // Fetch employees (filtered by RBAC on backend)
  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/enterprise/employees"],
  });

  // Fetch performance history for selected employee
  const { data: performanceHistory = [], isLoading: loadingHistory } = useQuery<MonthlyPerformance[]>({
    queryKey: ["/api/enterprise/performance/employee", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  // Form setup
  const form = useForm<PerformanceFormData>({
    resolver: zodResolver(performanceFormSchema),
    defaultValues: {
      employeeId: "",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      marginPersonal: "0.00",
      naPersonal: 0,
      lotSettled: 0,
    },
  });

  // Create performance mutation
  const createPerformance = useMutation({
    mutationFn: async (data: PerformanceFormData) => {
      return await apiRequest("/api/enterprise/performance", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: "Data performance berhasil diinput",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/performance/employee", selectedEmployeeId] });
      form.reset({
        employeeId: selectedEmployeeId,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        marginPersonal: "0.00",
        naPersonal: 0,
        lotSettled: 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal!",
        description: error.message || "Gagal menyimpan data performance",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PerformanceFormData) => {
    createPerformance.mutate(data);
  };

  // Month names for display
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Calculate quarter from month
  const getQuarterName = (month: number) => {
    const quarter = Math.ceil(month / 3);
    return `Q${quarter}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Input Performance Bulanan
          </h1>
          <p className="text-muted-foreground">
            Input data performance marketing untuk perhitungan audit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="border-purple-500/20 shadow-xl shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Form Input Performance
                </CardTitle>
                <CardDescription>
                  Isi data performance bulanan untuk marketing yang Anda kelola
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Employee Selector */}
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
                              <SelectTrigger data-testid="select-employee">
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

                    {/* Period Selection */}
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
                                data-testid="input-year"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bulan *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-month">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {monthNames.map((name, idx) => (
                                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                                    {name} ({getQuarterName(idx + 1)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                      <h3 className="font-semibold text-sm text-purple-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Data Performance Personal
                      </h3>

                      <FormField
                        control={form.control}
                        name="marginPersonal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Margin Personal (Rp)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="0.00"
                                data-testid="input-margin"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Format: 1234567.89 (bisa negatif)
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="naPersonal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National Agreement (NA)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                data-testid="input-na"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Jumlah National Agreement yang dicapai
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lotSettled"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lot Settled</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                data-testid="input-lot"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Jumlah lot yang telah settled
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={createPerformance.isPending}
                      data-testid="button-submit-performance"
                    >
                      {createPerformance.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          Simpan Data Performance
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Performance History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-purple-500/20 shadow-xl shadow-purple-500/5 sticky top-24">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    Riwayat Performance
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    data-testid="button-toggle-history"
                  >
                    {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CardTitle>
                {selectedEmployeeId && (
                  <CardDescription className="text-xs">
                    {employees.find(e => e.id === selectedEmployeeId)?.fullName || ""}
                  </CardDescription>
                )}
              </CardHeader>
              {showHistory && selectedEmployeeId && (
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  ) : performanceHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Belum ada data performance
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {performanceHistory
                        .sort((a, b) => {
                          if (a.year !== b.year) return b.year - a.year;
                          return b.month - a.month;
                        })
                        .map((perf) => (
                          <div
                            key={perf.id}
                            className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 space-y-1"
                            data-testid={`history-item-${perf.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-purple-400">
                                {monthNames[perf.month - 1]} {perf.year}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getQuarterName(perf.month)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Margin:</span>
                                <p className="font-medium">Rp {parseFloat(perf.marginPersonal).toLocaleString('id-ID')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">NA:</span>
                                <p className="font-medium">{perf.naPersonal}</p>
                              </div>
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">Lot:</span>
                              <span className="font-medium ml-1">{perf.lotSettled || 0}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
