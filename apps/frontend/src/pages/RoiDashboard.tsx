import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Breadcrumbs from "../components/Breadcrumbs";
import { fetchActions, fetchRoiSettings } from "../api";
import { calculateRoi, formatEur } from "../lib/roiEngine";
import type { Action, RoiSettings, ActionStatus } from "../types";

const STATUS_LABELS: Record<ActionStatus, string> = {
  OFFEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  DONE: "Abgeschlossen",
};

export default function RoiDashboard() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [settings, setSettings] = useState<RoiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ActionStatus[]>([]);

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([fetchActions(), fetchRoiSettings()]);
      setActions(a);
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredActions = useMemo(() => {
    if (statusFilter.length === 0) return actions;
    return actions.filter((a) => statusFilter.includes(a.status as ActionStatus));
  }, [actions, statusFilter]);

  const roiResults = useMemo(() => {
    if (!settings) return [];
    return filteredActions
      .map((a) => ({ action: a, roi: calculateRoi(a, settings) }))
      .filter((r) => r.roi !== null) as {
      action: Action;
      roi: NonNullable<ReturnType<typeof calculateRoi>>;
    }[];
  }, [filteredActions, settings]);

  // Aggregates
  const totalCapex = roiResults.reduce((s, r) => s + r.roi.capexTotal, 0);
  const totalNetCapex = roiResults.reduce((s, r) => s + r.roi.netCapex, 0);
  const totalGrant = roiResults.reduce((s, r) => s + r.roi.grantEffective, 0);
  const totalNpv = roiResults.reduce((s, r) => s + r.roi.npv, 0);
  const avgPayback =
    roiResults.filter((r) => r.roi.paybackYears !== null).length > 0
      ? roiResults
          .filter((r) => r.roi.paybackYears !== null)
          .reduce((s, r) => s + (r.roi.paybackYears ?? 0), 0) /
        roiResults.filter((r) => r.roi.paybackYears !== null).length
      : null;

  // NPV chart data
  const npvChartData = roiResults
    .map((r) => ({
      name: r.action.title.length > 25 ? r.action.title.slice(0, 25) + "..." : r.action.title,
      fullTitle: r.action.title,
      npv: Math.round(r.roi.npv),
      actionId: r.action.id,
    }))
    .sort((a, b) => b.npv - a.npv);

  // MACC chart data (sorted by MACC ascending)
  const maccChartData = roiResults
    .filter((r) => r.roi.macc !== null)
    .map((r) => ({
      name: r.action.title.length > 20 ? r.action.title.slice(0, 20) + "..." : r.action.title,
      fullTitle: r.action.title,
      macc: r.roi.macc!,
      kpiReduction: r.roi.kpiReductionPerYear,
      actionId: r.action.id,
    }))
    .sort((a, b) => a.macc - b.macc);

  function toggleStatus(status: ActionStatus) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-lilac-text border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: "ROI Dashboard" },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-text-primary">
        ROI Dashboard
      </h1>
      <p className="mt-1 text-sm text-text-subtle">
        Portfolio-Uebersicht aller Massnahmen mit ROI-Berechnung
      </p>

      {/* Filters */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-text-subtle mr-1">Filter:</span>
        {(["OFFEN", "IN_PROGRESS", "DONE"] as ActionStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter.includes(s)
                ? "bg-accent-lilac text-accent-lilac-text"
                : "bg-gray-100 text-text-subtle hover:bg-gray-200"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        {statusFilter.length > 0 && (
          <button
            onClick={() => setStatusFilter([])}
            className="text-xs text-accent-lilac-text hover:underline ml-2"
          >
            Alle anzeigen
          </button>
        )}
        <span className="ml-auto text-sm text-text-subtle">
          {roiResults.length} von {filteredActions.length} Aktionen mit ROI-Daten
        </span>
      </div>

      {/* Summary Tiles */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryTile label="Aktionen" value={String(roiResults.length)} />
        <SummaryTile label="CAPEX Gesamt" value={formatEur(totalCapex)} />
        <SummaryTile label="Foerderung" value={formatEur(totalGrant)} sub="abzueglich" />
        <SummaryTile
          label="Portfolio NPV"
          value={formatEur(totalNpv)}
          color={totalNpv >= 0 ? "green" : "red"}
        />
        <SummaryTile
          label="Ø Payback"
          value={avgPayback !== null ? `${avgPayback.toFixed(1)} Jahre` : "n/a"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPV by Action */}
        <div className="rounded-2xl border border-border-gray bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            NPV je Massnahme
          </h3>
          {npvChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={npvChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E7" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(value) => formatEur(Number(value ?? 0))}
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.fullTitle ?? ""
                    }
                  />
                  <Bar dataKey="npv" name="NPV" radius={[0, 4, 4, 0]}>
                    {npvChartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.npv >= 0 ? "#7C5CFC" : "#f87171"}
                        cursor="pointer"
                        onClick={() =>
                          navigate(
                            `/strategy/esg-hub/actions/${entry.actionId}`
                          )
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-text-subtle">
              Keine Daten vorhanden
            </p>
          )}
        </div>

        {/* MACC */}
        <div className="rounded-2xl border border-border-gray bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            MACC (Vermeidungskosten)
          </h3>
          {maccChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={maccChartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E7E7" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(value) => `${Number(value ?? 0).toFixed(2)} EUR/Einheit`}
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.fullTitle ?? ""
                    }
                  />
                  <Bar dataKey="macc" name="MACC" radius={[4, 4, 0, 0]}>
                    {maccChartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.macc <= 0 ? "#22c55e" : "#f59e0b"}
                        cursor="pointer"
                        onClick={() =>
                          navigate(
                            `/strategy/esg-hub/actions/${entry.actionId}`
                          )
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-text-subtle">
              Keine Daten vorhanden
            </p>
          )}
        </div>
      </div>

      {/* Actions Table */}
      <div className="mt-6 rounded-2xl border border-border-gray bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-border-gray">
          <h3 className="text-sm font-semibold text-text-primary">
            Detailuebersicht
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 border-b border-border-gray">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-subtle">Massnahme</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-subtle">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">CAPEX</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">Netto-CAPEX</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">NPV</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">IRR</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">Payback</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-subtle">Quick ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiResults.map(({ action, roi }) => (
                <tr
                  key={action.id}
                  className="border-b border-border-gray last:border-b-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/strategy/esg-hub/actions/${action.id}`)
                  }
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-text-primary">
                      {action.title}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-text-subtle">
                      {STATUS_LABELS[action.status as ActionStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {formatEur(roi.capexTotal)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {formatEur(roi.netCapex)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono font-medium ${
                      roi.npv >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {formatEur(roi.npv)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {roi.irr !== null ? `${(roi.irr * 100).toFixed(1)}%` : "n/a"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {roi.paybackYears !== null
                      ? `${roi.paybackYears.toFixed(1)} J.`
                      : "> Hor."}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {roi.quickRoi.toFixed(1)}x
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              {roiResults.length > 0 && (
                <tr className="bg-gray-50/70 font-semibold">
                  <td className="px-4 py-2.5 text-text-primary">Gesamt</td>
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5 text-right font-mono">{formatEur(totalCapex)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatEur(totalNetCapex)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono ${totalNpv >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatEur(totalNpv)}
                  </td>
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5 text-right font-mono">
                    {avgPayback !== null ? `Ø ${avgPayback.toFixed(1)} J.` : ""}
                  </td>
                  <td className="px-4 py-2.5" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "green" | "red";
}) {
  return (
    <div className="rounded-xl border border-border-gray bg-white p-4">
      <span className="text-xs text-text-subtle">{label}</span>
      {sub && <span className="text-[10px] text-text-subtle ml-1">({sub})</span>}
      <p
        className={`mt-1 text-lg font-bold ${
          color === "green"
            ? "text-green-700"
            : color === "red"
            ? "text-red-600"
            : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
