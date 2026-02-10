import { useState, useEffect, useCallback, useRef } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import { fetchRoiSettings, updateRoiSettings } from "../api";
import type { RoiSettings as RoiSettingsType } from "../types";

export default function RoiSettingsPage() {
  const [settings, setSettings] = useState<RoiSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback(async () => {
    try {
      const s = await fetchRoiSettings();
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

  const debouncedSave = useCallback(
    (field: string, value: number | string) => {
      if (!settings) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const updated = await updateRoiSettings(settings.id, {
            [field]: value,
          });
          setSettings(updated);
          setToast("Gespeichert");
          setTimeout(() => setToast(""), 1500);
        } catch (err) {
          console.error("Save failed:", err);
        }
      }, 600);
    },
    [settings]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-transparent" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <p className="text-an-60">Einstellungen nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: "ROI Einstellungen" },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-an-100">
        ROI Einstellungen
      </h1>

      <div className="mt-6 max-w-2xl rounded-md border border-border-gray bg-white p-8">
        <h2 className="mb-6 text-lg font-semibold text-an-100">
          Globale Annahmen
        </h2>

        <div className="space-y-5">
          {/* Currency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-100">
              Waehrung
            </label>
            <select
              value={settings.currency}
              onChange={(e) => {
                setSettings({ ...settings, currency: e.target.value });
                debouncedSave("currency", e.target.value);
              }}
              className="w-full rounded-md border border-border-gray px-4 py-3 text-md text-an-100 outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="CHF">CHF</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Discount Rate */}
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-100">
              Diskontierungssatz (WACC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.discountRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSettings({ ...settings, discountRate: val });
                  debouncedSave("discountRate", val);
                }}
                className="w-full rounded-md border border-border-gray px-4 py-3 pr-12 text-md text-an-100 outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-md text-an-60">
                ({(settings.discountRate * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="mt-1 text-sm text-an-60">
              Gewichteter Kapitalkostensatz zur Berechnung des Barwerts
              zukuenftiger Cashflows
            </p>
          </div>

          {/* Tax Rate */}
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-100">
              Steuersatz
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.taxRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSettings({ ...settings, taxRate: val });
                  debouncedSave("taxRate", val);
                }}
                className="w-full rounded-md border border-border-gray px-4 py-3 pr-12 text-md text-an-100 outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-md text-an-60">
                ({(settings.taxRate * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="mt-1 text-sm text-an-60">
              Koerperschaftsteuer + Gewerbesteuer fuer EBIT-Besteuerung
            </p>
          </div>

          {/* Cashflow Horizon */}
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-100">
              Cashflow-Horizont (Jahre)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="30"
              value={settings.cashflowHorizonYears}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 10;
                setSettings({ ...settings, cashflowHorizonYears: val });
                debouncedSave("cashflowHorizonYears", val);
              }}
              className="w-full rounded-md border border-border-gray px-4 py-3 text-md text-an-100 outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
            />
            <p className="mt-1 text-sm text-an-60">
              Anzahl Jahre fuer die NPV-Berechnung (Standardwert: 10)
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-darkgreen-100 px-4 py-2 text-md text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
