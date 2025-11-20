import ProDemCard from "../ProDemCard";

export default function ProDemCardExample() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-background">
      <ProDemCard
        currentLevel="SBC (Senior Business Consultant)"
        recommendation="Promosi"
        nextLevel="BSM (Business Sales Manager)"
        reason="Performa kinerja konsisten berada di zona hijau. Margin tim mencapai 140K USD, melebihi target 125K. Leadership skills dan kemampuan coaching tim sudah sangat baik."
        requirements={[
          { label: "Margin Tim USD", value: "$140,000 / $125,000", met: true },
          { label: "BC Aktif", value: "5 / 3", met: true },
          { label: "Periode Minimal", value: "8 bulan / 6 bulan", met: true }
        ]}
        data-testid="prodem-promosi"
      />
      <ProDemCard
        currentLevel="BSM (Business Sales Manager)"
        recommendation="Pertahankan"
        reason="Kinerja berada di zona kuning. Margin tim masih di bawah target untuk promosi ke SBM. Perlu fokus pada peningkatan produktivitas tim dan pengembangan BC baru."
        requirements={[
          { label: "Margin Tim USD", value: "$180,000 / $250,000", met: false },
          { label: "BC Aktif", value: "4 / 5", met: false },
          { label: "Periode Minimal", value: "7 bulan / 9 bulan", met: false }
        ]}
        data-testid="prodem-pertahankan"
      />
    </div>
  );
}
