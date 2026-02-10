import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, TrendingUp, Hash, Pencil } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  fetchVariables,
  createVariable,
  deleteVariable as apiDeleteVariable,
} from "../api";
import type { Variable } from "../types";

const METHOD_LABELS: Record<string, string> = {
  fix: "Fixwert",
  cagr: "CAGR",
  manual: "Manuell",
};

export default function VariablesList() {
  const navigate = useNavigate();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchVariables();
      setVariables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const v = await createVariable({
        name: newName.trim(),
        unit: newUnit.trim(),
        startYear: new Date().getFullYear(),
      });
      setShowCreate(false);
      setNewName("");
      setNewUnit("");
      navigate(`/strategy/esg-hub/variables/${v.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Variable "${name}" wirklich loeschen?`)) return;
    try {
      await apiDeleteVariable(id);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: "Variablen" },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-an-100">
        Variablen
      </h1>
      <p className="mt-1 text-md text-an-60">
        Zeitreihen-Variablen fuer die Monetarisierung (z.B. Preise, Tarife)
      </p>

      {/* Actions bar */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md border-2 border-an-100 bg-white px-5 py-2.5 text-md font-semibold text-an-100 hover:bg-sfgray-5 transition-colors"
        >
          <Plus size={18} strokeWidth={2} />
          Neue Variable
        </button>
      </div>

      {/* Create inline form */}
      {showCreate && (
        <div className="mt-4 rounded-md border border-lilac-100 bg-lilac-10 p-4">
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (z.B. Strompreis)"
              className="flex-1 rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Einheit (z.B. EUR/kWh)"
              className="w-40 rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-md bg-blue-100 px-4 py-2 text-md font-medium text-white hover:bg-blue-100/90 disabled:opacity-50"
            >
              Erstellen
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-border-gray px-4 py-2 text-md text-an-60 hover:bg-sfgray-5"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {variables.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-md border border-border-gray p-16">
          <TrendingUp size={32} className="text-an-60 mb-3" />
          <p className="text-md text-an-60">
            Noch keine Variablen angelegt.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-border-gray">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-gray bg-sfgray-5">
                <th className="px-4 py-3 text-left text-sm font-medium text-an-60 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-an-60 uppercase tracking-wider">
                  Einheit
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-an-60 uppercase tracking-wider">
                  Methode
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-an-60 uppercase tracking-wider">
                  Startwert
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-an-60 uppercase tracking-wider">
                  CAGR
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-an-60 uppercase tracking-wider">
                  Zeitraum
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {variables.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border-gray last:border-b-0 hover:bg-sfgray-5 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/strategy/esg-hub/variables/${v.id}`)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-blue-100" />
                      <span className="text-md font-medium text-an-100">
                        {v.name}
                      </span>
                    </div>
                    {v.description && (
                      <p className="mt-0.5 text-sm text-an-60 truncate max-w-xs">
                        {v.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-md text-an-60">
                    {v.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sfgray-10 px-2 py-0.5 text-sm font-medium text-an-60">
                      {METHOD_LABELS[v.method] || v.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-md text-an-100 font-mono">
                    {v.startValue}
                  </td>
                  <td className="px-4 py-3 text-right text-md text-an-100 font-mono">
                    {v.method === "cagr"
                      ? `${(v.cagr * 100).toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-md text-an-60">
                    {v.startYear} - {v.startYear + v.horizonYears}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/strategy/esg-hub/variables/${v.id}`
                          );
                        }}
                        className="rounded-md p-1.5 hover:bg-sfgray-10 transition-colors"
                      >
                        <Pencil size={14} className="text-an-60" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(v.id, v.name);
                        }}
                        className="rounded-md p-1.5 hover:bg-dang-60 transition-colors"
                      >
                        <Trash2
                          size={14}
                          className="text-an-60 hover:text-dang-80"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
