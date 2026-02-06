export type ActionStatus = "OFFEN" | "IN_PROGRESS" | "DONE";

export interface User {
  id: string;
  name: string;
  initials: string;
}

export interface RoiSettings {
  id: string;
  currency: string;
  discountRate: number;
  taxRate: number;
  cashflowHorizonYears: number;
}

export interface Variable {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  method: "fix" | "cagr" | "manual";
  startYear: number;
  horizonYears: number;
  startValue: number;
  cagr: number;
  manualValues: string; // JSON string of { [year: number]: number }
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  assigneeId: string | null;
  assignee: User | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  progressNote: string | null;

  // ROI: KPI
  kpiName: string | null;
  kpiUnit: string | null;
  kpiBaselinePerYear: number | null;
  impactType: string | null;
  impactValue: number | null;

  // ROI: Monetization
  monetizationFixedEurPerUnit: number | null;
  monetizationVariableId: string | null;
  monetizationVariable: Variable | null;

  // ROI: CAPEX
  capexEquipment: number | null;
  capexInstallation: number | null;
  capexSoftware: number | null;
  capexConsulting: number | null;
  capexOther: number | null;

  // ROI: Funding
  grantAmount: number | null;
  grantPercent: number | null;

  // ROI: OPEX
  opexMaintenance: number | null;
  opexLicenses: number | null;
  opexPersonnel: number | null;
  opexOther: number | null;

  // ROI: Other
  otherBenefitsPerYear: number | null;
  otherCostsPerYear: number | null;
  depreciationYears: number | null;
  justification: string | null;
}

export interface CreateActionPayload {
  title: string;
  description?: string;
  status?: ActionStatus;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  progressNote?: string | null;
}

export type UpdateActionPayload = Record<string, unknown>;

export interface CreateVariablePayload {
  name: string;
  description?: string;
  unit?: string;
  method?: string;
  startYear: number;
  horizonYears?: number;
  startValue?: number;
  cagr?: number;
  manualValues?: string;
}

export type UpdateVariablePayload = Partial<CreateVariablePayload>;
