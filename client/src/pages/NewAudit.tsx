import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, TrendingUp } from "lucide-react";
import { insertAuditSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { InsertAudit } from "@shared/schema";

const PILAR_NAMES = [
  "P1: Kemampuan Mencari Calon Nasabah",
  "P2: Kemampuan Menutup Penjualan",
  "P3: Kemampuan Menjaga Nasabah Aktif",
  "P4: Kemampuan Mencetak Tim Baru (Kaderisasi)",
  "P5: Pencapaian Target Penjualan",
  "P6: Penguasaan Pasar Wilayah",
  "P7: Kelengkapan Struktur Tim",
  "P8: Jumlah Jalur Aktif",
  "P9: Produktivitas Pimpinan",
  "P10: Kesiapan Regenerasi",
  "P11: Kerja Sama Antar Tim",
  "P12: Kemampuan Beradaptasi",
  "P13: Disiplin & Konsistensi Kerja",
  "P14: Semangat & Motivasi Tim",
  "P15: Inovasi Cara Kerja",
  "P16: Pelatihan & Pengembangan Keterampilan",
  "P17: Kepuasan Nasabah",
  "P18: Pemahaman Pasar Lokal"
];

// Helper function to determine which team structure fields should be shown
const getVisibleTeamFields = (jabatan: string) => {
  const hierarchy = [
    "BC",
    "SBC",
    "BSM",
    "SBM",
    "EM",
    "SEM",
    "VBM",
    "BrM"
  ];
  
  // Map full jabatan names to hierarchy keys
  const jabatanMap: Record<string, string> = {
    "Business Consultant (BC)": "BC",
    "Senior Business Consultant (SBC)": "SBC",
    "Business Manager (BSM)": "BSM",
    "Senior Business Manager (SBM)": "SBM",
    "Executive Manager (EM)": "EM",
    "Senior Executive Manager (SEM)": "SEM",
    "Vice Business Manager (VBM)": "VBM",
    "Branch Manager (BrM)": "BrM"
  };
  
  const userLevel = jabatanMap[jabatan];
  if (!userLevel) return []; // Show nothing if unknown
  
  const userIndex = hierarchy.indexOf(userLevel);
  if (userIndex === -1) return []; // Show nothing if not found
  
  // ProDem system: user can have subordinates up to their own level (inclusive)
  // User CANNOT have subordinates with higher position than their own
  // Example: BC can have BC subordinates
  //          SBC can have BC and SBC subordinates
  //          BSM can have BC, SBC, and BSM subordinates
  return hierarchy.slice(0, userIndex + 1);
};

export default function NewAudit() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertAudit>({
    resolver: zodResolver(insertAuditSchema),
    defaultValues: {
      nama: "",
      jabatan: "",
      cabang: "",
      tanggalLahir: "",
      marginTimQ1: 0,
      marginTimQ2: 0,
      marginTimQ3: 0,
      marginTimQ4: 0,
      naTimQ1: 0,
      naTimQ2: 0,
      naTimQ3: 0,
      naTimQ4: 0,
      marginPribadiQ1: 0,
      marginPribadiQ2: 0,
      marginPribadiQ3: 0,
      marginPribadiQ4: 0,
      nasabahPribadiQ1: 0,
      nasabahPribadiQ2: 0,
      nasabahPribadiQ3: 0,
      nasabahPribadiQ4: 0,
      jumlahBC: 0,
      jumlahSBC: 0,
      jumlahBsM: 0,
      jumlahSBM: 0,
      jumlahEM: 0,
      jumlahSEM: 0,
      jumlahVBM: 0,
      jumlahBrM: 0,
      pillarAnswers: Array.from({ length: 18 }, (_, i) => ({
        pillarId: i + 1,
        selfScore: 3
      }))
    }
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data: InsertAudit) => {
      const response = await apiRequest("POST", "/api/audit", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Audit berhasil dibuat!",
        description: "Audit telah berhasil disimpan dan dapat dilihat di dashboard."
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat audit. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertAudit) => {
    console.log("Submitting audit:", data);
    createAuditMutation.mutate(data);
  };

  const nextStep = async () => {
    // Step 4 (pillarAnswers) doesn't need validation since sliders always have valid values (1-5)
    if (step === 4) {
      setStep(step + 1);
      return;
    }
    
    let fieldsToValidate: (keyof InsertAudit)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["nama", "jabatan", "cabang", "tanggalLahir"];
    } else if (step === 2) {
      fieldsToValidate = ["marginTimQ1", "marginTimQ2", "marginTimQ3", "marginTimQ4", "naTimQ1", "naTimQ2", "naTimQ3", "naTimQ4", "marginPribadiQ1", "marginPribadiQ2", "marginPribadiQ3", "marginPribadiQ4", "nasabahPribadiQ1", "nasabahPribadiQ2", "nasabahPribadiQ3", "nasabahPribadiQ4"];
    } else if (step === 3) {
      fieldsToValidate = ["jumlahBC", "jumlahSBC", "jumlahBsM", "jumlahSBM", "jumlahEM", "jumlahSEM", "jumlahVBM", "jumlahBrM"];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Baru</h1>
            <p className="text-muted-foreground">Evaluasi kinerja quarterly dengan 18 Pilar framework</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? "w-12 bg-primary" : s < step ? "w-8 bg-primary/50" : "w-8 bg-muted"
              }`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informasi Personal</h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama lengkap" {...field} data-testid="input-nama" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jabatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-jabatan">
                              <SelectValue placeholder="Pilih jabatan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Business Consultant (BC)">Business Consultant (BC)</SelectItem>
                            <SelectItem value="Senior Business Consultant (SBC)">Senior Business Consultant (SBC)</SelectItem>
                            <SelectItem value="Business Manager (BSM)">Business Manager (BSM)</SelectItem>
                            <SelectItem value="Senior Business Manager (SBM)">Senior Business Manager (SBM)</SelectItem>
                            <SelectItem value="Executive Manager (EM)">Executive Manager (EM)</SelectItem>
                            <SelectItem value="Senior Executive Manager (SEM)">Senior Executive Manager (SEM)</SelectItem>
                            <SelectItem value="Vice Business Manager (VBM)">Vice Business Manager (VBM)</SelectItem>
                            <SelectItem value="Branch Manager (BrM)">Branch Manager (BrM)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cabang"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cabang</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: XYZ Jakarta" {...field} data-testid="input-cabang" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tanggalLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="DD-MM-YYYY (contoh: 15-08-1990)" 
                            {...field} 
                            data-testid="input-tanggal-lahir" 
                          />
                        </FormControl>
                        <FormDescription>Format: DD-MM-YYYY (untuk zodiak booster)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            )}

            {/* STEP 2: Quarterly Performance */}
            {step === 2 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performa Quarterly (Tim & Pribadi)
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Isi data margin dan New Account (NA) untuk tim dan pribadi per kuartal
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Q1 */}
                  <div className="space-y-3 p-4 border rounded-md">
                    <h3 className="font-semibold text-sm mb-2">Q1 (Jan-Mar)</h3>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Performa Tim</p>
                      <FormField
                        control={form.control}
                        name="marginTimQ1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Tim (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-tim-q1" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="naTimQ1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">NA Tim</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-na-tim-q1" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Performa Pribadi</p>
                      <FormField
                        control={form.control}
                        name="marginPribadiQ1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Pribadi (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-pribadi-q1" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nasabahPribadiQ1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nasabah Pribadi</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-nasabah-pribadi-q1" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-3 p-4 border rounded-md">
                    <h3 className="font-semibold text-sm mb-2">Q2 (Apr-Jun)</h3>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Performa Tim</p>
                      <FormField
                        control={form.control}
                        name="marginTimQ2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Tim (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-tim-q2" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="naTimQ2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">NA Tim</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-na-tim-q2" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Performa Pribadi</p>
                      <FormField
                        control={form.control}
                        name="marginPribadiQ2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Pribadi (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-pribadi-q2" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nasabahPribadiQ2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nasabah Pribadi</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-nasabah-pribadi-q2" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="space-y-3 p-4 border rounded-md">
                    <h3 className="font-semibold text-sm mb-2">Q3 (Jul-Sep)</h3>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Performa Tim</p>
                      <FormField
                        control={form.control}
                        name="marginTimQ3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Tim (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-tim-q3" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="naTimQ3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">NA Tim</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-na-tim-q3" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Performa Pribadi</p>
                      <FormField
                        control={form.control}
                        name="marginPribadiQ3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Pribadi (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-pribadi-q3" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nasabahPribadiQ3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nasabah Pribadi</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-nasabah-pribadi-q3" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-3 p-4 border rounded-md">
                    <h3 className="font-semibold text-sm mb-2">Q4 (Oct-Dec)</h3>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Performa Tim</p>
                      <FormField
                        control={form.control}
                        name="marginTimQ4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Tim (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-tim-q4" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="naTimQ4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">NA Tim</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-na-tim-q4" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Performa Pribadi</p>
                      <FormField
                        control={form.control}
                        name="marginPribadiQ4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Margin Pribadi (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-margin-pribadi-q4" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nasabahPribadiQ4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nasabah Pribadi</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-nasabah-pribadi-q4" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 3: Team Structure */}
            {step === 3 && (() => {
              const visibleFields = getVisibleTeamFields(form.watch("jabatan"));
              return (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Struktur Tim</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Isi jumlah anggota tim di setiap level (isi 0 jika tidak punya tim di level tersebut)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {visibleFields.includes("BC") && (
                      <FormField
                        control={form.control}
                        name="jumlahBC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BC</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-bc" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("SBC") && (
                      <FormField
                        control={form.control}
                        name="jumlahSBC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SBC</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-sbc" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("BSM") && (
                      <FormField
                        control={form.control}
                        name="jumlahBsM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BSM/BsM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-bsm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("SBM") && (
                      <FormField
                        control={form.control}
                        name="jumlahSBM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SBM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-sbm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("EM") && (
                      <FormField
                        control={form.control}
                        name="jumlahEM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>EM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-em" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("SEM") && (
                      <FormField
                        control={form.control}
                        name="jumlahSEM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-sem" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("VBM") && (
                      <FormField
                        control={form.control}
                        name="jumlahVBM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VBM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-vbm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {visibleFields.includes("BrM") && (
                      <FormField
                        control={form.control}
                        name="jumlahBrM"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BrM</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-brm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </Card>
              );
            })()}

            {/* STEP 4: 18 Pilar Self Assessment (Scale 1-5) */}
            {step === 4 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">18 Pilar Self Assessment</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Nilai kemampuan Anda di setiap pilar (1 = Sangat Rendah, 5 = Sangat Tinggi)
                </p>
                <div className="space-y-6">
                  {PILAR_NAMES.map((name, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`pillarAnswers.${index}.selfScore`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium mb-3 block">{name}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(parseInt(val))}
                              value={field.value.toString()}
                              className="flex gap-4"
                            >
                              {[1, 2, 3, 4, 5].map((score) => (
                                <div key={score} className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value={score.toString()} 
                                    id={`pilar-${index}-score-${score}`}
                                    data-testid={`radio-pilar-${index + 1}-score-${score}`}
                                  />
                                  <label 
                                    htmlFor={`pilar-${index}-score-${score}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {score}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>1 - Sangat Rendah</span>
                            <span>5 - Sangat Tinggi</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* STEP 5: Review & Submit */}
            {step === 5 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Review Data Audit</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold">Nama:</p>
                    <p className="text-muted-foreground">{form.getValues("nama")}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Jabatan:</p>
                    <p className="text-muted-foreground">{form.getValues("jabatan")}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Cabang:</p>
                    <p className="text-muted-foreground">{form.getValues("cabang")}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="font-semibold">Q1 Margin:</p>
                      <p className="text-muted-foreground">${form.getValues("marginTimQ1").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Q2 Margin:</p>
                      <p className="text-muted-foreground">${form.getValues("marginTimQ2").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Q3 Margin:</p>
                      <p className="text-muted-foreground">${form.getValues("marginTimQ3").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Q4 Margin:</p>
                      <p className="text-muted-foreground">${form.getValues("marginTimQ4").toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Total Tim:</p>
                    <p className="text-muted-foreground">
                      {(form.getValues("jumlahBC") || 0) + (form.getValues("jumlahSBC") || 0) + (form.getValues("jumlahBsM") || 0) + 
                       (form.getValues("jumlahSBM") || 0) + (form.getValues("jumlahEM") || 0) + (form.getValues("jumlahSEM") || 0) + 
                       (form.getValues("jumlahVBM") || 0) + (form.getValues("jumlahBrM") || 0)} orang
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">18 Pilar Avg Score:</p>
                    <p className="text-muted-foreground">
                      {(form.getValues("pillarAnswers").reduce((sum, p) => sum + p.selfScore, 0) / 18).toFixed(1)} / 5.0
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-prev"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 5 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    data-testid="button-next"
                  >
                    Lanjut
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {step === 5 && (
                  <Button
                    type="submit"
                    disabled={createAuditMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createAuditMutation.isPending ? (
                      "Memproses..."
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Submit Audit
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
