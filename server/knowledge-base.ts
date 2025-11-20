/**
 * Internal Knowledge Base for AiSG AI Coach
 * Provides fallback responses when external AI APIs are unavailable
 */

interface KnowledgeEntry {
  keywords: string[];
  response: string;
  category: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // Leadership & Management
  {
    keywords: ["leadership", "kepemimpinan", "memimpin", "leader", "pimpin tim"],
    category: "Leadership",
    response: `**Leadership & Kepemimpinan**

Berdasarkan hasil audit Anda, berikut tips meningkatkan kepemimpinan:

**1. Vision & Direction**
- Buat visi jelas untuk tim
- Komunikasikan goal secara konsisten
- Jadilah role model dalam action

**2. Team Empowerment**
- Delegasi tugas sesuai kekuatan masing-masing
- Berikan feedback konstruktif regular
- Ciptakan environment yang supportif

**3. Decision Making**
- Ambil keputusan berdasarkan data
- Libatkan tim dalam brainstorming
- Berani ambil tanggung jawab atas hasil

Terapkan ini di action plan 30 hari pertama Anda untuk hasil maksimal.`
  },
  {
    keywords: ["teamwork", "kerja sama", "kolaborasi", "tim", "team building"],
    category: "Teamwork",
    response: `**Teamwork & Kolaborasi**

Kunci membangun tim yang solid:

**1. Komunikasi Efektif**
- Daily standup meeting (15 menit)
- Open communication channel (WhatsApp/Telegram grup)
- Active listening dalam setiap diskusi

**2. Trust Building**
- Transparansi dalam informasi
- Deliver on promises
- Celebrate wins bersama

**3. Conflict Resolution**
- Address issues segera, jangan ditunda
- Focus on solution, bukan blame
- Win-win mindset

Tim yang kuat = performance yang kuat. Mulai dari membangun trust hari ini!`
  },
  {
    keywords: ["public speaking", "presentasi", "berbicara di depan umum", "pidato"],
    category: "Public Speaking",
    response: `**Public Speaking & Presentation Skills**

Tips meningkatkan kemampuan berbicara di depan umum:

**1. Preparation**
- Pahami audience Anda
- Structure: Opening (hook) → Body (value) → Closing (call-to-action)
- Practice 3-5 kali sebelum presentasi

**2. Delivery**
- Kontak mata dengan audience
- Gunakan body language yang confident
- Pace: tidak terlalu cepat, pakai pause

**3. Confidence Building**
- Mulai dari audience kecil
- Record practice Anda, evaluasi
- Focus pada message, bukan perfection

Practice makes progress. Setiap presentasi adalah kesempatan belajar!`
  },

  // Sales & Marketing
  {
    keywords: ["closing", "closing power", "menutup penjualan", "deal", "sales"],
    category: "Sales - Closing",
    response: `**Closing Power - Menutup Penjualan**

Teknik closing yang terbukti efektif:

**1. Trial Close Technique**
- "Bagaimana menurut Anda sejauh ini?"
- Ukur interest level sebelum final close

**2. Assumptive Close**
- "Kapan Anda ingin mulai?"
- Assume mereka sudah setuju

**3. Alternative Close**
- "Lebih prefer paket A atau B?"
- Beri pilihan, bukan yes/no

**4. Urgency Close**
- "Promo ini hanya sampai akhir bulan"
- Create sense of urgency

**Tips Penting:**
- Handle objections dengan empati
- Don't be pushy, be consultative
- Follow up adalah kunci!

Closing bukan soal manipulasi, tapi helping customer make decision.`
  },
  {
    keywords: ["kepercayaan diri", "confidence", "percaya diri", "self confidence"],
    category: "Personal Development",
    response: `**Meningkatkan Kepercayaan Diri**

Strategi membangun confidence:

**1. Small Wins Strategy**
- Set achievable daily targets
- Celebrate setiap pencapaian kecil
- Build momentum dari success

**2. Competence = Confidence**
- Master your product knowledge
- Practice your pitch daily
- Terus upgrade skills

**3. Positive Self-Talk**
- Replace "Saya tidak bisa" → "Saya sedang belajar"
- Visualisasi success sebelum action
- Fokus pada progress, bukan perfection

**4. Physical Confidence**
- Power pose sebelum meeting penting
- Dress professionally
- Maintain good posture

Remember: Confidence bukan tentang never feeling fear, tapi taking action despite the fear!`
  },
  {
    keywords: ["marketing", "pemasaran", "promosi", "market"],
    category: "Marketing",
    response: `**Marketing Skills - Fundamental**

Framework marketing yang efektif:

**1. Know Your Market**
- Identifikasi target customer
- Pahami pain points mereka
- Research competitor

**2. Value Proposition**
- Apa unique selling point Anda?
- Benefit apa yang customer dapat?
- Why choose you vs competitor?

**3. Multi-Channel Approach**
- Social media (Instagram, Facebook, LinkedIn)
- WhatsApp Business
- Networking events
- Referral program

**4. Content Marketing**
- Edukasi, bukan hard-selling
- Share success stories
- Provide value first

Marketing bukan soal selling, tapi soal creating demand dan building trust.`
  },
  {
    keywords: ["contacting", "prospecting", "mencari nasabah", "cari calon", "database"],
    category: "Prospecting",
    response: `**Contacting & Prospecting - Mencari Calon Nasabah**

Strategi efektif mencari prospek:

**1. Sumber Database**
- Network pribadi (family, friends)
- LinkedIn connections
- Community groups
- Business events/seminars
- Alumni network

**2. Qualification (BANT)**
- **B**udget: Ada kemampuan finansial?
- **A**uthority: Decision maker?
- **N**eed: Ada kebutuhan product?
- **T**imeline: Kapan butuhnya?

**3. First Contact Script**
"Hi [Nama], saya [Nama Anda] dari [Company]. Saya lihat Anda [reason]. Boleh saya sharing 5 menit tentang [value proposition]?"

**4. Follow Up System**
- Day 1: Initial contact
- Day 3: Follow up email/WA
- Day 7: Value-add content
- Day 14: Re-engage

**Pro Tip:** 80% penjualan terjadi di follow up ke-5, jangan give up too early!`
  },

  // Team Building & Recruitment
  {
    keywords: ["keep staff", "retain", "mempertahankan karyawan", "staff retention"],
    category: "Team Management",
    response: `**Cara Keep Staff / Retain Karyawan**

Strategi mempertahankan anggota tim terbaik:

**1. Recognition & Appreciation**
- Apresiasi achievement (public recognition)
- Bonus/reward untuk top performers
- Personal thank you notes

**2. Growth Opportunities**
- Training & development program
- Clear career path
- Mentorship dari senior

**3. Work Environment**
- Positive team culture
- Work-life balance
- Open communication

**4. Compensation Review**
- Regular performance review
- Competitive commission structure
- Incentive untuk longevity

**5. Belonging**
- Team bonding activities
- Include dalam decision making
- Create family-like atmosphere

People don't leave companies, they leave managers. Be the leader people want to stay for.`
  },
  {
    keywords: ["recruitment", "rekrut", "hiring", "cari staff", "tanpa gaji", "komisi"],
    category: "Recruitment",
    response: `**Recruitment Staff Tanpa Gaji (Base on Komisi)**

Strategi merekrut dengan compensation berbasis komisi:

**1. Value Proposition**
- Highlight: Unlimited earning potential
- Success stories staff yang sukses
- Training & mentoring FREE
- Flexibility waktu kerja

**2. Target Prospek yang Tepat**
- Fresh graduate yang hungry
- Career switcher yang motivated
- Entrepreneur mindset
- Part-timer yang cari extra income

**3. Recruitment Script**
"Saya cari partner bisnis yang mau grow bersama. Modal: nol. Yang dibutuhkan: willing to learn & work hard. Potensi income: unlimited. Tertarik diskusi 15 menit?"

**4. Selection Process**
- Interview: assess attitude > skill
- Trial period 30 hari
- Buddy system (pairing dengan senior)

**5. Support System**
- Comprehensive training program
- Weekly coaching sessions
- Quick wins dalam 7 hari pertama
- Team support 24/7

**Mindset:** You're not hiring employees, you're building business partners. Invest in their success!`
  },

  // Planning & Strategy
  {
    keywords: ["planning", "rencana kerja", "work plan", "strategi", "target"],
    category: "Planning",
    response: `**Membuat Planning Kerja yang Efektif**

Framework 30-60-90 Day Plan:

**30 Hari Pertama (Learn)**
- Product knowledge mastery
- Observe top performers
- Build database 50+ contacts
- Target: 3 closing

**60 Hari (Execute)**
- Implement best practices
- Expand network
- Refine your pitch
- Target: 6 closing

**90 Hari (Lead)**
- Share knowledge dengan team
- Recruit 1-2 new members
- Optimize process
- Target: 10 closing

**Daily Structure:**
- 08:00-10:00: Prospecting & calling
- 10:00-12:00: Appointments
- 12:00-13:00: Break
- 13:00-16:00: Follow ups & meetings
- 16:00-17:00: Admin & planning next day

**Weekly Review:**
- What worked well?
- What needs improvement?
- Adjust plan accordingly

Plan your work, then work your plan!`
  },
  {
    keywords: ["trading plan", "financial plan", "margin", "target keuangan"],
    category: "Financial Planning",
    response: `**Trading Plan & Target Keuangan**

Membuat trading plan yang realistis:

**1. Set SMART Goals**
- Specific: Target margin Rp X per bulan
- Measurable: Track weekly progress
- Achievable: Based on history & capability
- Relevant: Align dengan team target
- Time-bound: Quarterly milestones

**2. Income Breakdown**
- Personal sales: 60%
- Team override: 30%
- Bonuses: 10%

**3. Activity Metrics**
- Berapa prospect perlu dihubungi untuk 1 closing?
- Jika target 10 closing/bulan = berapa daily activity?
- Track conversion rate

**4. Risk Management**
- Diversifikasi source of income
- Build emergency fund
- Reinvest in business development

**5. Monthly Review**
- Actual vs Target
- Adjust strategy if needed
- Identify bottlenecks

Formula Success: Consistent Activity + Quality Execution = Target Achievement!`
  },

  // General Improvement
  {
    keywords: ["improvement", "perbaikan", "meningkatkan", "develop", "grow"],
    category: "General",
    response: `**Strategi Improvement Berdasarkan Audit**

Berdasarkan hasil audit Anda, fokus pada 3 area ini:

**1. Identifikasi Gap**
- Lihat pilar dengan score terendah
- Itu adalah priority improvement area
- Focus on fixing 1-2 pilar per bulan

**2. Action Plan**
- Gunakan Action Plan 30-60-90 dari audit
- Set specific daily/weekly tasks
- Measure progress regularly

**3. Leverage Strengths**
- Maksimalkan pilar dengan score tinggi
- Use strengths untuk compensate weakness
- Share best practices dengan team

**4. Continuous Learning**
- Product knowledge updates
- Sales technique workshops
- Leadership development

**5. Accountability**
- Weekly check-in dengan mentor
- Share progress dengan team
- Celebrate small wins

Improvement adalah journey, bukan destination. Consistent small steps > big plans without action!`
  },

  // SWOT & Analysis
  {
    keywords: ["swot", "strength", "weakness", "kekuatan", "kelemahan"],
    category: "Analysis",
    response: `**Memahami SWOT Analysis Anda**

Cara memanfaatkan SWOT untuk improvement:

**Strengths (Kekuatan)**
- Maximize: Gunakan setiap hari
- Monetize: Convert jadi competitive advantage
- Share: Ajarkan ke team

**Weaknesses (Kelemahan)**
- Acknowledge: Jujur pada diri sendiri
- Improve: Buat specific action plan
- Delegate: Partner dengan yang kuat di area ini

**Opportunities (Peluang)**
- Act Fast: First mover advantage
- Prepare: Build capability sekarang
- Network: Connect dengan opportunity

**Threats (Ancaman)**
- Monitor: Stay alert
- Mitigate: Buat contingency plan
- Adapt: Be flexible

Strategy: Play to your strengths, manage weaknesses, seize opportunities, prepare for threats.`
  },

  // Zona Performance
  {
    keywords: ["zona", "zone", "merah", "kuning", "hijau", "performance"],
    category: "Performance",
    response: `**Memahami Zona Performance**

Strategi untuk setiap zona:

**Zona Merah (Critical)**
- **Immediate Action Required!**
- Focus 100% pada improvement
- Daily coaching session
- Simplify tasks, master basics
- Set micro-targets (daily wins)

**Zona Kuning (Warning)**
- **Stabilkan dulu, baru scale**
- Identify specific gap
- Implement Action Plan 30-60
- Peer learning dengan top performer
- Consistent execution

**Zona Hijau (Success)**
- **Maintain & Expand**
- Share best practices
- Mentor junior team members
- Aim for next level (ProDem)
- Explore new opportunities

Remember: Zona bukan label permanen, tapi snapshot saat ini. Dengan action yang tepat, semua bisa improve!`
  },

  // ProDem Recommendation
  {
    keywords: ["prodem", "promosi", "demosi", "promotion", "naik jabatan"],
    category: "Career",
    response: `**Memahami ProDem Recommendation**

**Promosi:**
- Pertahankan consistency
- Document achievements
- Prepare untuk tanggung jawab lebih besar
- Mentor potential successors
- Timeline: 3-6 bulan dengan performance konsisten

**Pertahankan:**
- Stabilkan performance
- Strengthen weak areas
- Build track record
- Show improvement trend
- Timeline: Review quarterly

**Pembinaan:**
- Terima feedback dengan positive mindset
- Focus pada action plan
- Daily improvement
- Seek mentorship
- Timeline: 90 hari untuk turnaround

**Demosi/Mutasi:**
- Evaluasi apakah fit dengan role
- Consider career pivot
- Fresh start opportunity
- Learn dari experience

Career bukan sprint, tapi marathon. Every setback is setup for comeback!`
  },

  // Default responses
  {
    keywords: ["hasil audit", "report", "skor", "score"],
    category: "General",
    response: `Berdasarkan hasil audit Anda, saya merekomendasikan untuk:

1. **Focus pada Action Plan** yang sudah disediakan
2. **Prioritaskan** pilar dengan gap terbesar
3. **Konsisten** jalankan daily activities
4. **Track progress** setiap minggu
5. **Adjust strategy** based on results

Apakah ada area spesifik yang ingin Anda diskusikan lebih detail? (Leadership, Sales, Planning, dll)`
  }
];

/**
 * Find relevant knowledge based on user query
 */
export function findKnowledge(query: string): string | null {
  const lowercaseQuery = query.toLowerCase();
  
  // Find best matching entry
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(keyword => lowercaseQuery.includes(keyword.toLowerCase()))) {
      return entry.response;
    }
  }
  
  return null;
}

/**
 * Generate response using knowledge base
 */
export function generateKnowledgeBasedResponse(query: string, auditData: any): string {
  const knowledge = findKnowledge(query);
  
  if (knowledge) {
    return knowledge;
  }
  
  // Fallback generic response
  return `Terima kasih atas pertanyaan Anda tentang hasil audit.

**Hasil Audit Anda:**
- Reality Score: ${auditData.totalRealityScore}/90
- Profil: ${auditData.profil}
- Zona: ${auditData.zonaFinal}
- Rekomendasi: ${auditData.prodemRekomendasi.recommendation}

Saya merekomendasikan untuk:
1. Review Action Plan 30-60-90 yang sudah disediakan
2. Diskusikan dengan mentor/leader Anda
3. Focus pada improvement area dengan gap terbesar

Untuk pertanyaan lebih spesifik tentang **Leadership**, **Sales Skills**, **Team Building**, **Planning**, atau topik lainnya, silakan tanyakan!`;
}
