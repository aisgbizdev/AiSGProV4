import type { Employee, Audit } from "./schema";

export type QuarterlyPerformanceDto = {
  employeeId: string;
  year: number;
  quarter: number;
  aggregated: {
    totalMarginPersonal: string;
    totalNAPersonal: number;
    totalLotSettled: number;
  };
  months: Array<{
    month: number;
    marginPersonal: string;
    naPersonal: number;
    lotSettled: number;
  }>;
};

export type AuditDetailDto = Omit<Audit, 'employee'> & {
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    position: {
      id: string;
      code: string;
      name: string;
      level: number;
    } | null;
    pt: {
      id: string;
      code: string;
      name: string;
    } | null;
    branch: {
      id: string;
      code: string;
      name: string;
    } | null;
  };
};

export type PendingSubordinateDto = {
  id: string;
  employeeCode: string;
  fullName: string;
  positionName: string;
  positionLevel: number;
};

export type AuditCreateResultDto = {
  audit: AuditDetailDto;
  warnings: string[];
  pendingSubordinates: PendingSubordinateDto[];
};

export type AuditPdfDto = {
  fullName: string;
  position: string;
  branch: string;
  ptCompany: string;
  birthDate: string;
  year: number;
  quarter: number;
  totalRealityScore: number;
  totalSelfScore: number;
  totalGap: number;
  profil: string;
  zonaFinal: string;
  auditReport: any;
  prodemRekomendasi: any;
  magicSection: any;
  pillarAnswers: any[];
};
