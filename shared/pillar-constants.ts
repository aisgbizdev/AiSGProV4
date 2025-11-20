export const PILAR_CATEGORIES = [
  {
    id: "A",
    name: "Pendorong Pemasukan",
    nameEn: "Revenue Drivers",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    id: "B",
    name: "Kekuatan Struktur Tim",
    nameEn: "Team Structure Strength",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "C",
    name: "Budaya & Operasional Tim",
    nameEn: "Team Culture & Operations",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
] as const;

export const PILARS = [
  // A. Pendorong Pemasukan (Revenue Drivers)
  {
    id: 1,
    category: "A",
    name: "Kemampuan Mencari Calon Nasabah",
    nameEn: "Ability to Find Potential Customers",
    description: "Seberapa efektif dalam mengidentifikasi dan mendekati calon nasabah baru",
  },
  {
    id: 2,
    category: "A",
    name: "Kemampuan Menutup Penjualan",
    nameEn: "Ability to Close Sales",
    description: "Kemampuan mengkonversi prospek menjadi nasabah aktif",
  },
  {
    id: 3,
    category: "A",
    name: "Kemampuan Menjaga Nasabah Aktif",
    nameEn: "Ability to Retain Active Customers",
    description: "Konsistensi dalam mempertahankan nasabah yang sudah ada",
  },
  {
    id: 4,
    category: "A",
    name: "Kemampuan Mencetak Tim Baru (Kaderisasi)",
    nameEn: "Ability to Develop New Team Members",
    description: "Efektivitas dalam merekrut dan mengembangkan anggota tim baru",
  },
  {
    id: 5,
    category: "A",
    name: "Pencapaian Target Penjualan",
    nameEn: "Achievement of Sales Targets",
    description: "Konsistensi mencapai atau melampaui target yang ditetapkan",
  },
  {
    id: 6,
    category: "A",
    name: "Penguasaan Pasar Wilayah",
    nameEn: "Mastery of Regional Market",
    description: "Pemahaman dan dominasi di wilayah pasar yang ditargetkan",
  },
  
  // B. Kekuatan Struktur Tim (Team Structure Strength)
  {
    id: 7,
    category: "B",
    name: "Kelengkapan Struktur Tim",
    nameEn: "Completeness of Team Structure",
    description: "Struktur tim yang lengkap dengan berbagai level hierarki",
  },
  {
    id: 8,
    category: "B",
    name: "Jumlah Jalur Aktif",
    nameEn: "Number of Active Lines",
    description: "Banyaknya jalur/downline yang aktif berkontribusi",
  },
  {
    id: 9,
    category: "B",
    name: "Produktivitas Pimpinan",
    nameEn: "Leadership Productivity",
    description: "Kontribusi langsung pimpinan dalam mencapai target tim",
  },
  {
    id: 10,
    category: "B",
    name: "Kesiapan Regenerasi",
    nameEn: "Readiness for Succession",
    description: "Ketersediaan kader yang siap menggantikan posisi atas",
  },
  {
    id: 11,
    category: "B",
    name: "Kerja Sama Antar Tim",
    nameEn: "Inter-Team Cooperation",
    description: "Sinergi dan kolaborasi antar anggota tim",
  },
  {
    id: 12,
    category: "B",
    name: "Kemampuan Beradaptasi",
    nameEn: "Adaptability",
    description: "Fleksibilitas dalam menghadapi perubahan pasar dan kondisi bisnis",
  },
  
  // C. Budaya & Operasional Tim (Team Culture & Operations)
  {
    id: 13,
    category: "C",
    name: "Disiplin & Konsistensi Kerja",
    nameEn: "Work Discipline & Consistency",
    description: "Kepatuhan terhadap SOP dan konsistensi dalam bekerja",
  },
  {
    id: 14,
    category: "C",
    name: "Semangat & Motivasi Tim",
    nameEn: "Team Spirit & Motivation",
    description: "Antusiasme dan dorongan internal tim untuk mencapai tujuan",
  },
  {
    id: 15,
    category: "C",
    name: "Inovasi Cara Kerja",
    nameEn: "Innovation in Work Methods",
    description: "Kreativitas dalam mengembangkan metode kerja yang lebih efektif",
  },
  {
    id: 16,
    category: "C",
    name: "Pelatihan & Pengembangan Keterampilan",
    nameEn: "Training & Skill Development",
    description: "Investasi dalam peningkatan kemampuan anggota tim",
  },
  {
    id: 17,
    category: "C",
    name: "Kepuasan Nasabah",
    nameEn: "Customer Satisfaction",
    description: "Tingkat kepuasan dan loyalitas nasabah terhadap layanan",
  },
  {
    id: 18,
    category: "C",
    name: "Pemahaman Pasar Lokal",
    nameEn: "Understanding of Local Market",
    description: "Pengetahuan mendalam tentang karakteristik pasar lokal",
  },
] as const;

export const SCORE_LEVELS = [
  {
    value: 1,
    label: "Sangat Kurang",
    labelEn: "Very Poor",
    color: "text-red-500",
    description: "Tidak memenuhi standar minimum, perlu perbaikan mendesak",
  },
  {
    value: 2,
    label: "Kurang",
    labelEn: "Poor",
    color: "text-orange-500",
    description: "Di bawah standar, memerlukan pembinaan intensif",
  },
  {
    value: 3,
    label: "Cukup",
    labelEn: "Fair",
    color: "text-yellow-500",
    description: "Memenuhi standar minimum, masih perlu peningkatan",
  },
  {
    value: 4,
    label: "Baik",
    labelEn: "Good",
    color: "text-blue-500",
    description: "Melampaui standar, kinerja solid dan konsisten",
  },
  {
    value: 5,
    label: "Sangat Baik",
    labelEn: "Excellent",
    color: "text-green-500",
    description: "Jauh melampaui ekspektasi, menjadi role model",
  },
] as const;

// Helper to get pilar by ID
export function getPilarById(id: number) {
  return PILARS.find(p => p.id === id);
}

// Helper to get pilars by category
export function getPilarsByCategory(categoryId: string) {
  return PILARS.filter(p => p.category === categoryId);
}

// Helper to get category info
export function getCategoryById(id: string) {
  return PILAR_CATEGORIES.find(c => c.id === id);
}

// Calculate average score by category
export function calculateCategoryAverage(
  pillarAnswers: Array<{ pillarId: number; score: number }>,
  categoryId: string
): number {
  const categoryPilars = getPilarsByCategory(categoryId);
  const categoryAnswers = pillarAnswers.filter(a =>
    categoryPilars.some(p => p.id === a.pillarId)
  );
  
  if (categoryAnswers.length === 0) return 0;
  
  const sum = categoryAnswers.reduce((acc, a) => acc + a.score, 0);
  return sum / categoryAnswers.length;
}

// Calculate total average score (all 18 pilars)
export function calculateTotalAverage(
  pillarAnswers: Array<{ pillarId: number; score: number }>
): number {
  if (pillarAnswers.length === 0) return 0;
  const sum = pillarAnswers.reduce((acc, a) => acc + a.score, 0);
  return sum / pillarAnswers.length;
}

// Validate that all 18 pilars are answered
export function validatePillarAnswers(
  pillarAnswers: Array<{ pillarId: number; score: number }>
): boolean {
  if (pillarAnswers.length !== 18) return false;
  
  const answeredIds = new Set(pillarAnswers.map(a => a.pillarId));
  return PILARS.every(p => answeredIds.has(p.id));
}
