import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  fetchVariable,
  updateVariable,
  deleteVariable as apiDeleteVariable,
} from "../api";
import { getVariableValue } from "../lib/roiEngine";
import type { Variable } from "../types";

const METHOD_OPTIONS = [
  { value: "fix", label: "Fixwert", desc: "Gleicher Wert jedes Jahr" },
  { value: "cagr", label: "CAGR", desc: "Jaehrliches Wachstum in %" },
  {
    value: "manual",
    label: "Manuell",
    desc: "Werte pro Jahr einzeln eingeben",
  },
];

export default function VariableDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [variable, setVariable] = useState<Variable | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const v = await fetchVariable(id);
      setVariable(v);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const debouncedSave = useCallback(
    (field: string, value: string | number) => {
      if (!id) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const updated = await updateVariable(id, { [field]: value });
          setVariable(updated);
        } catch (err) {
          console.error("Save failed:", err);
        }
      }, 600);
    },
    [id]
  );

  const immediateSave = useCallback(
    async (field: string, value: string | number) => {
      if (!id) return;
      try {
        const updated = await updateVariable(id, { [field]: value });
        setVariable(updated);
      } catch (err) {
        console.error("Save failed:", err);
      }
    },
    [id]
  );

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Variable wirklich loeschen?")) return;
    try {
      await apiDeleteVariable(id);
      navigate("/strategy/esg-hub/variables");
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-lilac-text border-t-transparent" />
      </div>
    );
  }

  if (!variable) {
    return (
      <div className="p-6">
        <p className="text-text-subtle">Variable nicht gefunden.</p>
      </div>
    );
  }

  // Generate preview values
  const previewYears: { year: number; value: number }[] = [];
  for (let i = 0; i <= variable.horizonYears; i++) {
    const year = variable.startYear + i;
    previewYears.push({ year, value: getVariableValue(variable, year) });
  }

  // Manual values parsing
  const manualValues: Record<string, number> = JSON.parse(
    variable.manualValues || "{}"
  );

  function updateManualValue(year: number, val: number) {
    const newManual = { ...manualValues, [String(year)]: val };
    const newStr = JSON.stringify(newManual);
    setVariable({ ...variable!, manualValues: newStr });
    debouncedSave("manualValues", newStr);
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: "Variablen", path: "/strategy/esg-hub/variables" },
          { label: variable.name },
        ]}
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/strategy/esg-hub/variables")}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-text-subtle" />
          </button>
          <h1 className="text-xl font-semibold text-text-primary">
            Variable bearbeiten
          </h1>
        </div>
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 hover:bg-red-50 transition-colors"
          title="Loeschen"
        >
          <Trash2 size={18} className="text-text-subtle hover:text-red-500" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="rounded-2xl border border-border-gray bg-white p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                value={variable.name}
                onChange={(e) => {
                  setVariable({ ...variable, name: e.target.value });
                  debouncedSave("name", e.target.value);
                }}
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Beschreibung
              </label>
              <textarea
                value={variable.description ?? ""}
                onChange={(e) => {
                  setVariable({ ...variable, description: e.target.value });
                  debouncedSave("description", e.target.value);
                }}
                rows={2}
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac resize-y"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Einheit
              </label>
              <input
                value={variable.unit}
                onChange={(e) => {
                  setVariable({ ...variable, unit: e.target.value });
                  debouncedSave("unit", e.target.value);
                }}
                placeholder="z.B. EUR/kWh"
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
              />
            </div>

            {/* Method */}
            <div>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Methode
              </label>
              <div className="space-y-2">
                {METHOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      variable.method === opt.value
                        ? "border-accent-lilac-text bg-accent-lilac/5"
                        : "border-border-gray hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={opt.value}
                      checked={variable.method === opt.value}
                      onChange={() => {
                        setVariable({ ...variable, method: opt.value as "fix" | "cagr" | "manual" });
                        immediateSave("method", opt.value);
                      }}
                      className="mt-0.5 accent-accent-lilac-text"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-text-subtle">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Start Year + Horizon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                  Startjahr
                </label>
                <input
                  type="number"
                  value={variable.startYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2025;
                    setVariable({ ...variable, startYear: val });
                    debouncedSave("startYear", val);
                  }}
                  className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                  Horizont (Jahre)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={variable.horizonYears}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    setVariable({ ...variable, horizonYears: val });
                    debouncedSave("horizonYears", val);
                  }}
                  className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
                />
              </div>
            </div>

            {/* Start Value */}
            <div>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Startwert
              </label>
              <input
                type="number"
                step="any"
                value={variable.startValue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setVariable({ ...variable, startValue: val });
                  debouncedSave("startValue", val);
                }}
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
              />
            </div>

            {/* CAGR (only for cagr method) */}
            {variable.method === "cagr" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                  CAGR (jaehrliche Wachstumsrate)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={variable.cagr}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setVariable({ ...variable, cagr: val });
                      debouncedSave("cagr", val);
                    }}
                    className="w-full rounded-lg border border-border-gray px-4 py-3 pr-12 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-subtle">
                    ({(variable.cagr * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Manual values */}
            {variable.method === "manual" && (
              <div>
                <label className="mb-2 block text-xs font-medium text-accent-lilac-text">
                  Werte pro Jahr
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {previewYears.map(({ year }) => (
                    <div key={year} className="flex items-center gap-2">
                      <span className="w-12 text-xs font-mono text-text-subtle">
                        {year}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={manualValues[String(year)] ?? variable.startValue}
                        onChange={(e) =>
                          updateManualValue(year, parseFloat(e.target.value) || 0)
                        }
                        className="flex-1 rounded border border-border-gray px-2 py-1 text-sm font-mono text-text-primary outline-none focus:border-accent-lilac-text"
                      />
                      <span className="text-xs text-text-subtle">
                        {variable.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview Table */}
        <div className="rounded-2xl border border-border-gray bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">
            Vorschau: Werte ueber Zeit
          </h3>
          <div className="overflow-hidden rounded-lg border border-border-gray">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-border-gray">
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-subtle">
                    Jahr
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-subtle">
                    Wert ({variable.unit})
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewYears.map(({ year, value }) => (
                  <tr
                    key={year}
                    className="border-b border-border-gray last:border-b-0"
                  >
                    <td className="px-3 py-2 text-sm font-mono text-text-primary">
                      {year}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-mono text-text-primary">
                      {value < 1 ? value.toFixed(4) : value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple bar visualization */}
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium text-text-subtle">
              Verlauf
            </h4>
            <div className="flex items-end gap-1 h-24">
              {previewYears.map(({ year, value }) => {
                const maxVal = Math.max(...previewYears.map((p) => p.value));
                const height = maxVal > 0 ? (value / maxVal) * 100 : 0;
                return (
                  <div
                    key={year}
                    className="flex-1 bg-accent-lilac hover:bg-accent-lilac-text/30 rounded-t transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${year}: ${value.toFixed(2)} ${variable.unit}`}
                  />
                );
              })}
            </div>
            <div className="flex gap-1 mt-1">
              {previewYears
                .filter((_, i) => i % 2 === 0)
                .map(({ year }) => (
                  <div
                    key={year}
                    className="flex-1 text-center text-[9px] text-text-subtle"
                    style={{ flex: 2 }}
                  >
                    {year}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-sidebar-dark px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
