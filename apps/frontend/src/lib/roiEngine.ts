import type { Action, Variable, RoiSettings } from "../types";

// ── Variable value resolution ─────────────────────────────────────────────

export function getVariableValue(v: Variable, year: number): number {
  const idx = year - v.startYear;
  if (idx < 0) return v.startValue;

  switch (v.method) {
    case "cagr":
      return v.startValue * Math.pow(1 + v.cagr, idx);
    case "manual": {
      const manual: Record<string, number> = JSON.parse(v.manualValues || "{}");
      if (manual[String(year)] !== undefined) return manual[String(year)];
      return v.startValue;
    }
    case "fix":
    default:
      return v.startValue;
  }
}

// ── ROI Calculation ───────────────────────────────────────────────────────

export interface RoiYearRow {
  year: number;
  t: number; // period index (0 = investment year)
  goLiveFactor: number;
  kpiReduction: number;
  eurPerUnit: number;
  grossBenefit: number;
  otherBenefits: number;
  totalBenefit: number;
  opex: number;
  otherCosts: number;
  depreciation: number;
  ebit: number;
  taxes: number;
  netCashflow: number;
  discountFactor: number;
  discountedCF: number;
  cumulativeCF: number;
}

export interface RoiResult {
  // Summaries
  capexTotal: number;
  grantEffective: number;
  netCapex: number;
  opexPerYear: number;
  kpiReductionPerYear: number;

  // KPIs
  npv: number;
  irr: number | null;
  paybackYears: number | null;
  quickRoi: number;
  macc: number | null; // EUR per unit of KPI avoided

  // Year-by-year table
  years: RoiYearRow[];
}

export function calculateRoi(
  action: Action,
  settings: RoiSettings
): RoiResult | null {
  // Need at least a KPI baseline to calculate
  if (!action.kpiBaselinePerYear || !action.impactValue) return null;

  const horizon = settings.cashflowHorizonYears;
  const discountRate = settings.discountRate;
  const taxRate = settings.taxRate;

  // ── CAPEX ─────────────────────────────────────────────────────────────
  const capexTotal =
    (action.capexEquipment ?? 0) +
    (action.capexInstallation ?? 0) +
    (action.capexSoftware ?? 0) +
    (action.capexConsulting ?? 0) +
    (action.capexOther ?? 0);

  // Grant: either fixed amount or percentage of CAPEX
  let grantEffective = action.grantAmount ?? 0;
  if (!grantEffective && action.grantPercent) {
    grantEffective = capexTotal * (action.grantPercent / 100);
  }
  const netCapex = capexTotal - grantEffective;

  // ── OPEX ──────────────────────────────────────────────────────────────
  const opexPerYear =
    (action.opexMaintenance ?? 0) +
    (action.opexLicenses ?? 0) +
    (action.opexPersonnel ?? 0) +
    (action.opexOther ?? 0);

  // ── KPI Reduction ─────────────────────────────────────────────────────
  let kpiReductionPerYear: number;
  if (action.impactType === "reduction_percent") {
    kpiReductionPerYear =
      action.kpiBaselinePerYear * (action.impactValue / 100);
  } else {
    // reduction_absolute: negative means increase (e.g. "gain 40 suppliers")
    kpiReductionPerYear = Math.abs(action.impactValue);
  }

  // ── Go-live factor ────────────────────────────────────────────────────
  // Based on dueDate: what fraction of Year 1 is the measure active?
  const currentYear = new Date().getFullYear();
  function goLiveFactor(year: number): number {
    if (!action.dueDate) return year === currentYear ? 0.5 : year > currentYear ? 1 : 0;
    const dueYear = new Date(action.dueDate).getFullYear();
    const dueMonth = new Date(action.dueDate).getMonth(); // 0-indexed
    if (year < dueYear) return 0;
    if (year === dueYear) return (12 - dueMonth) / 12;
    return 1;
  }

  // ── Depreciation ──────────────────────────────────────────────────────
  const depYears = action.depreciationYears ?? horizon;
  const annualDep = depYears > 0 ? netCapex / depYears : 0;

  // ── Year-by-year calculation ──────────────────────────────────────────
  const years: RoiYearRow[] = [];
  let cumulativeCF = -netCapex; // t=0 is the investment

  // t=0 row (investment year)
  years.push({
    year: currentYear,
    t: 0,
    goLiveFactor: 0,
    kpiReduction: 0,
    eurPerUnit: 0,
    grossBenefit: 0,
    otherBenefits: 0,
    totalBenefit: 0,
    opex: 0,
    otherCosts: 0,
    depreciation: 0,
    ebit: -netCapex,
    taxes: 0,
    netCashflow: -netCapex,
    discountFactor: 1,
    discountedCF: -netCapex,
    cumulativeCF,
  });

  for (let t = 1; t <= horizon; t++) {
    const year = currentYear + t;
    const glf = goLiveFactor(year);

    const kpiRed = kpiReductionPerYear * glf;

    // EUR per unit: from variable (time-series) or fixed
    let eurPerUnit = action.monetizationFixedEurPerUnit ?? 0;
    if (action.monetizationVariable) {
      eurPerUnit = getVariableValue(action.monetizationVariable, year);
    }

    const grossBenefit = kpiRed * eurPerUnit;
    const otherBen = (action.otherBenefitsPerYear ?? 0) * glf;
    const totalBenefit = grossBenefit + otherBen;

    const opex = opexPerYear * glf;
    const otherCosts = (action.otherCostsPerYear ?? 0) * glf;
    const dep = t <= depYears ? annualDep : 0;

    const ebit = totalBenefit - opex - otherCosts - dep;
    const taxes = ebit > 0 ? ebit * taxRate : 0;
    const netCF = totalBenefit - opex - otherCosts - taxes;

    const discountFactor = 1 / Math.pow(1 + discountRate, t);
    const discountedCF = netCF * discountFactor;
    cumulativeCF += netCF;

    years.push({
      year,
      t,
      goLiveFactor: glf,
      kpiReduction: kpiRed,
      eurPerUnit,
      grossBenefit,
      otherBenefits: otherBen,
      totalBenefit,
      opex,
      otherCosts,
      depreciation: dep,
      ebit,
      taxes,
      netCashflow: netCF,
      discountFactor,
      discountedCF,
      cumulativeCF,
    });
  }

  // ── NPV ───────────────────────────────────────────────────────────────
  const npv = years.reduce((sum, r) => sum + r.discountedCF, 0);

  // ── IRR (Newton-Raphson) ──────────────────────────────────────────────
  const cashflows = years.map((r) => r.netCashflow);
  const irr = computeIRR(cashflows);

  // ── Payback ───────────────────────────────────────────────────────────
  let paybackYears: number | null = null;
  for (let i = 1; i < years.length; i++) {
    if (years[i].cumulativeCF >= 0 && years[i - 1].cumulativeCF < 0) {
      const prev = years[i - 1].cumulativeCF;
      const curr = years[i].netCashflow;
      paybackYears = (i - 1) + (-prev / curr);
      break;
    }
  }

  // ── Quick ROI ─────────────────────────────────────────────────────────
  // (Total undiscounted benefits over horizon) / netCapex
  const totalBenefits = years.reduce((s, r) => s + r.totalBenefit, 0);
  const quickRoi = netCapex > 0 ? totalBenefits / netCapex : 0;

  // ── MACC ──────────────────────────────────────────────────────────────
  // Marginal abatement cost curve: net cost per unit of KPI reduction
  const totalKpiReduction = years.reduce((s, r) => s + r.kpiReduction, 0);
  const totalNetCost = -npv; // positive means net cost
  const macc = totalKpiReduction > 0 ? totalNetCost / totalKpiReduction : null;

  return {
    capexTotal,
    grantEffective,
    netCapex,
    opexPerYear,
    kpiReductionPerYear,
    npv,
    irr,
    paybackYears,
    quickRoi,
    macc,
    years,
  };
}

// ── IRR via Newton-Raphson ────────────────────────────────────────────────

function computeIRR(
  cashflows: number[],
  guess = 0.1,
  maxIter = 100,
  tol = 1e-7
): number | null {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const pv = cashflows[t] / Math.pow(1 + rate, t);
      npv += pv;
      if (t > 0) {
        dnpv -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    if (Math.abs(dnpv) < 1e-14) return null;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return null; // didn't converge
}

// ── Formatting helpers ───────────────────────────────────────────────────

export function formatEur(value: number, decimals = 0): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
