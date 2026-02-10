import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Action, RoiSettings } from "../types";
import { calculateRoi, formatEur, formatPercent, formatNumber } from "../lib/roiEngine";

interface Props {
  action: Action;
  settings: RoiSettings;
}

export default function RoiOutputsPanel({ action, settings }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(
    () => calculateRoi(action, settings),
    [action, settings]
  );

  if (!result) {
    return (
      <div className="rounded-md border border-border-gray bg-white p-6">
        <h3 className="text-lg font-semibold text-an-100 mb-3">
          ROI Ergebnisse
        </h3>
        <div className="flex items-center justify-center py-8 text-md text-an-60">
          Bitte KPI-Daten und Monetarisierung eingeben, um die Berechnung zu starten.
        </div>
      </div>
    );
  }

  const chartData = result.years.filter((r) => r.t > 0).map((r) => ({
    year: r.year,
    benefit: Math.round(r.totalBenefit),
    costs: -Math.round(r.opex + r.otherCosts + r.taxes),
    netCF: Math.round(r.netCashflow),
    cumCF: Math.round(r.cumulativeCF),
  }));

  return (
    <div className="rounded-md border border-border-gray bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4"
      >
        <h3 className="text-lg font-semibold text-an-100">
          ROI Ergebnisse
        </h3>
        <span className="text-an-60 text-md">
          {expanded ? "Einklappen" : "Aufklappen"}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Tile
              label="NPV"
              value={formatEur(result.npv)}
              color={result.npv >= 0 ? "green" : "red"}
              tooltip="Net Present Value: Barwert aller zukuenftigen Cashflows abzueglich Investition"
            />
            <Tile
              label="IRR"
              value={result.irr !== null ? formatPercent(result.irr) : "n/a"}
              color={result.irr !== null && result.irr > settings.discountRate ? "green" : "orange"}
              tooltip="Internal Rate of Return: Interner Zinsfuss"
            />
            <Tile
              label="Payback"
              value={result.paybackYears !== null ? `${result.paybackYears.toFixed(1)} J.` : "> Horizont"}
              color={result.paybackYears !== null && result.paybackYears <= 5 ? "green" : "orange"}
              tooltip="Amortisationszeit in Jahren"
            />
            <Tile
              label="Quick ROI"
              value={`${result.quickRoi.toFixed(1)}x`}
              color={result.quickRoi >= 1 ? "green" : "red"}
              tooltip="Undiskontierter Gesamtnutzen / Netto-CAPEX"
            />
            <Tile
              label="MACC"
              value={result.macc !== null ? `${formatNumber(result.macc, 2)} EUR/${action.kpiUnit ?? "Einheit"}` : "n/a"}
              color="neutral"
              tooltip="Marginal Abatement Cost Curve: Netto-Kosten pro vermiedene KPI-Einheit"
            />
          </div>

          {/* Summary boxes */}
          <div className="grid grid-cols-3 gap-3 text-md">
            <div className="rounded-md bg-sfgray-5 p-3">
              <span className="text-sm text-an-60">CAPEX Gesamt</span>
              <p className="font-semibold text-an-100">{formatEur(result.capexTotal)}</p>
            </div>
            <div className="rounded-md bg-sfgray-5 p-3">
              <span className="text-sm text-an-60">Foerderung</span>
              <p className="font-semibold text-succ-100">-{formatEur(result.grantEffective)}</p>
            </div>
            <div className="rounded-md bg-sfgray-5 p-3">
              <span className="text-sm text-an-60">Netto-CAPEX</span>
              <p className="font-semibold text-an-100">{formatEur(result.netCapex)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cashflow Bar Chart */}
            <div>
              <h4 className="mb-2 text-md font-medium text-an-100">
                Jaehrlicher Cashflow
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E9ED" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => formatEur(Number(value ?? 0))}
                      labelFormatter={(label) => `Jahr ${label}`}
                    />
                    <Bar dataKey="benefit" fill="#5D47FF" name="Nutzen" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="costs" fill="#F4516C" name="Kosten" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cumulative Line Chart */}
            <div>
              <h4 className="mb-2 text-md font-medium text-an-100">
                Kumulierter Cashflow
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E9ED" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => formatEur(Number(value ?? 0))}
                      labelFormatter={(label) => `Jahr ${label}`}
                    />
                    <ReferenceLine y={0} stroke="#A7ABAD" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="cumCF"
                      stroke="#5D47FF"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Kumuliert"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Year table toggle */}
          <div>
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-md text-blue-100 hover:underline"
            >
              {showTable ? "Tabelle ausblenden" : "Detailtabelle anzeigen"}
            </button>

            {showTable && (
              <div className="mt-3 overflow-x-auto rounded-md border border-border-gray">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sfgray-5 border-b border-border-gray">
                      <th className="px-2 py-1.5 text-left font-medium text-an-60">Jahr</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Go-Live</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">KPI Red.</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">EUR/Einh.</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Nutzen</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">OPEX</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">AfA</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">EBIT</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Steuern</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Netto-CF</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Disk. CF</th>
                      <th className="px-2 py-1.5 text-right font-medium text-an-60">Kumuliert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.years.map((r) => (
                      <tr key={r.t} className="border-b border-border-gray last:border-b-0 hover:bg-sfgray-5">
                        <td className="px-2 py-1 font-mono">{r.year}</td>
                        <td className="px-2 py-1 text-right font-mono">{(r.goLiveFactor * 100).toFixed(0)}%</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(r.kpiReduction)}</td>
                        <td className="px-2 py-1 text-right font-mono">{r.eurPerUnit.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right font-mono text-succ-100">{formatNumber(r.totalBenefit)}</td>
                        <td className="px-2 py-1 text-right font-mono text-dang-80">{formatNumber(r.opex)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(r.depreciation)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(r.ebit)}</td>
                        <td className="px-2 py-1 text-right font-mono text-dang-80">{formatNumber(r.taxes)}</td>
                        <td className={`px-2 py-1 text-right font-mono font-medium ${r.netCashflow >= 0 ? "text-succ-100" : "text-dang-80"}`}>
                          {formatNumber(r.netCashflow)}
                        </td>
                        <td className="px-2 py-1 text-right font-mono">{formatNumber(r.discountedCF)}</td>
                        <td className={`px-2 py-1 text-right font-mono font-medium ${r.cumulativeCF >= 0 ? "text-succ-100" : "text-dang-80"}`}>
                          {formatNumber(r.cumulativeCF)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  color,
  tooltip,
}: {
  label: string;
  value: string;
  color: "green" | "red" | "orange" | "neutral";
  tooltip: string;
}) {
  const bgMap = {
    green: "bg-succ-60 border-sfgreen-40",
    red: "bg-dang-60 border-red-10",
    orange: "bg-warn-60 border-morningsun-40",
    neutral: "bg-sfgray-5 border-border-gray",
  };
  const textMap = {
    green: "text-succ-100",
    red: "text-dang-100",
    orange: "text-warn-100",
    neutral: "text-an-100",
  };

  return (
    <div
      className={`rounded-md border p-3 ${bgMap[color]}`}
      title={tooltip}
    >
      <span className="text-sm font-medium text-an-60">{label}</span>
      <p className={`mt-0.5 text-xl font-bold ${textMap[color]}`}>{value}</p>
    </div>
  );
}
