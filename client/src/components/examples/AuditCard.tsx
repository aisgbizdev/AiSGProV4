import AuditCard from "../AuditCard";

export default function AuditCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-background">
      <AuditCard
        auditId="AUD-2024-001"
        nama="Budi Santoso"
        jabatan="Senior Business Consultant (SBC)"
        cabang="Jakarta Pusat"
        zonaKinerja="success"
        zonaPerilaku="success"
        profil="Leader"
        tanggal="20 Jan 2024"
        onView={() => console.log("View audit AUD-2024-001")}
        data-testid="audit-card-1"
      />
      <AuditCard
        auditId="AUD-2024-002"
        nama="Siti Nurhaliza"
        jabatan="Business Sales Manager (BSM)"
        cabang="Surabaya"
        zonaKinerja="warning"
        zonaPerilaku="success"
        profil="Visionary"
        tanggal="19 Jan 2024"
        onView={() => console.log("View audit AUD-2024-002")}
        data-testid="audit-card-2"
      />
      <AuditCard
        auditId="AUD-2024-003"
        nama="Ahmad Rizki"
        jabatan="Business Consultant (BC)"
        cabang="Bandung"
        zonaKinerja="success"
        zonaPerilaku="warning"
        profil="Performer"
        tanggal="18 Jan 2024"
        onView={() => console.log("View audit AUD-2024-003")}
        data-testid="audit-card-3"
      />
      <AuditCard
        auditId="AUD-2024-004"
        nama="Dewi Lestari"
        jabatan="Executive Manager (EM)"
        cabang="Medan"
        zonaKinerja="critical"
        zonaPerilaku="warning"
        profil="At-Risk"
        tanggal="17 Jan 2024"
        onView={() => console.log("View audit AUD-2024-004")}
        data-testid="audit-card-4"
      />
    </div>
  );
}
