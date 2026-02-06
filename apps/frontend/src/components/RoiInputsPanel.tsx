import { useState, useEffect, useCallback, useRef } from "react";
import type { Action, Variable } from "../types";
import { updateAction, fetchVariables } from "../api";

interface Props {
  action: Action;
  onUpdate: (action: Action) => void;
}

function NumField({
  label,
  value,
  field,
  suffix,
  onSave,
}: {
  label: string;
  value: number | null;
  field: string;
  suffix?: string;
  onSave: (field: string, value: number | null) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(field, v === "" ? null : Number(v));
    }, 600);
  }

  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={local}
          onChange={handleChange}
          placeholder="--"
          className="w-full rounded border border-border-gray px-2 py-1.5 text-sm font-mono text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-subtle">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RoiInputsPanel({ action, onUpdate }: Props) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchVariables().then(setVariables).catch(console.error);
  }, []);

  const save = useCallback(
    async (field: string, value: string | number | null) => {
      try {
        const updated = await updateAction(action.id, { [field]: value });
        onUpdate(updated);
      } catch (err) {
        console.error("ROI save failed:", err);
      }
    },
    [action.id, onUpdate]
  );

  return (
    <div className="rounded-2xl border border-border-gray bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4"
      >
        <h3 className="text-base font-semibold text-text-primary">
          ROI Eingaben
        </h3>
        <span className="text-text-subtle text-sm">
          {expanded ? "Einklappen" : "Aufklappen"}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* KPI Section */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              KPI / Wirkung
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
                  KPI Name
                </label>
                <input
                  value={action.kpiName ?? ""}
                  onChange={(e) => {
                    onUpdate({ ...action, kpiName: e.target.value || null });
                    save("kpiName", e.target.value || null);
                  }}
                  placeholder="z.B. Stromverbrauch"
                  className="w-full rounded border border-border-gray px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent-lilac-text"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
                  KPI Einheit
                </label>
                <input
                  value={action.kpiUnit ?? ""}
                  onChange={(e) => {
                    onUpdate({ ...action, kpiUnit: e.target.value || null });
                    save("kpiUnit", e.target.value || null);
                  }}
                  placeholder="z.B. kWh/Jahr"
                  className="w-full rounded border border-border-gray px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent-lilac-text"
                />
              </div>
              <NumField
                label="Baseline pro Jahr"
                value={action.kpiBaselinePerYear}
                field="kpiBaselinePerYear"
                onSave={save}
              />
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
                  Wirkungstyp
                </label>
                <select
                  value={action.impactType ?? ""}
                  onChange={(e) => {
                    onUpdate({ ...action, impactType: e.target.value || null });
                    save("impactType", e.target.value || null);
                  }}
                  className="w-full rounded border border-border-gray px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent-lilac-text"
                >
                  <option value="">-- waehlen --</option>
                  <option value="reduction_percent">Reduktion (%)</option>
                  <option value="reduction_absolute">Reduktion (absolut)</option>
                </select>
              </div>
              <NumField
                label="Wirkungswert"
                value={action.impactValue}
                field="impactValue"
                suffix={action.impactType === "reduction_percent" ? "%" : ""}
                onSave={save}
              />
            </div>
          </section>

          {/* Monetization Section */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              Monetarisierung
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Fester EUR/Einheit"
                value={action.monetizationFixedEurPerUnit}
                field="monetizationFixedEurPerUnit"
                suffix="EUR"
                onSave={save}
              />
              <div>
                <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
                  Variable (Zeitreihe)
                </label>
                <select
                  value={action.monetizationVariableId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    onUpdate({ ...action, monetizationVariableId: val });
                    save("monetizationVariableId", val);
                  }}
                  className="w-full rounded border border-border-gray px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent-lilac-text"
                >
                  <option value="">-- keine --</option>
                  {variables.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* CAPEX Section */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              CAPEX (Investitionskosten)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Ausruestung" value={action.capexEquipment} field="capexEquipment" suffix="EUR" onSave={save} />
              <NumField label="Installation" value={action.capexInstallation} field="capexInstallation" suffix="EUR" onSave={save} />
              <NumField label="Software" value={action.capexSoftware} field="capexSoftware" suffix="EUR" onSave={save} />
              <NumField label="Beratung" value={action.capexConsulting} field="capexConsulting" suffix="EUR" onSave={save} />
              <NumField label="Sonstiges" value={action.capexOther} field="capexOther" suffix="EUR" onSave={save} />
            </div>
          </section>

          {/* Funding Section */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              Foerderung
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Foerderbetrag" value={action.grantAmount} field="grantAmount" suffix="EUR" onSave={save} />
              <NumField label="Foerderquote" value={action.grantPercent} field="grantPercent" suffix="%" onSave={save} />
            </div>
          </section>

          {/* OPEX Section */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              OPEX (laufende Kosten p.a.)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Wartung" value={action.opexMaintenance} field="opexMaintenance" suffix="EUR" onSave={save} />
              <NumField label="Lizenzen" value={action.opexLicenses} field="opexLicenses" suffix="EUR" onSave={save} />
              <NumField label="Personal" value={action.opexPersonnel} field="opexPersonnel" suffix="EUR" onSave={save} />
              <NumField label="Sonstiges" value={action.opexOther} field="opexOther" suffix="EUR" onSave={save} />
            </div>
          </section>

          {/* Other */}
          <section>
            <h4 className="mb-3 text-sm font-semibold text-accent-lilac-text border-b border-border-gray pb-2">
              Weitere Angaben
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Weitere Erloes p.a." value={action.otherBenefitsPerYear} field="otherBenefitsPerYear" suffix="EUR" onSave={save} />
              <NumField label="Weitere Kosten p.a." value={action.otherCostsPerYear} field="otherCostsPerYear" suffix="EUR" onSave={save} />
              <NumField label="Abschreibung (Jahre)" value={action.depreciationYears} field="depreciationYears" suffix="J." onSave={save} />
            </div>
            <div className="mt-3">
              <label className="mb-0.5 block text-[11px] font-medium text-text-subtle">
                Begruendung
              </label>
              <textarea
                value={action.justification ?? ""}
                onChange={(e) => {
                  onUpdate({ ...action, justification: e.target.value || null });
                  save("justification", e.target.value || null);
                }}
                rows={2}
                placeholder="Strategische Begruendung..."
                className="w-full rounded border border-border-gray px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent-lilac-text resize-y"
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
