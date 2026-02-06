import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share2, Trash2, Play, Clock, UserPlus } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import RoiInputsPanel from "../components/RoiInputsPanel";
import RoiOutputsPanel from "../components/RoiOutputsPanel";
import {
  fetchAction,
  updateAction,
  deleteAction as apiDeleteAction,
  fetchUsers,
  fetchRoiSettings,
} from "../api";
import type { Action, ActionStatus, User, RoiSettings } from "../types";

const STATUS_OPTIONS: { value: ActionStatus; label: string; color: string }[] =
  [
    { value: "OFFEN", label: "Offen", color: "bg-orange-100 text-orange-700" },
    {
      value: "IN_PROGRESS",
      label: "In Bearbeitung",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "DONE",
      label: "Abgeschlossen",
      color: "bg-green-100 text-green-700",
    },
  ];

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function ActionDetail() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<Action | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<RoiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Debounce timer
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback(async () => {
    if (!actionId) return;
    try {
      const [a, u, s] = await Promise.all([
        fetchAction(actionId),
        fetchUsers(),
        fetchRoiSettings(),
      ]);
      setAction(a);
      setUsers(u);
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node))
        setShowStatusDropdown(false);
      if (
        assigneeRef.current &&
        !assigneeRef.current.contains(e.target as Node)
      )
        setShowAssigneeDropdown(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (field: string, value: string | null) => {
      if (!actionId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const updated = await updateAction(actionId, { [field]: value });
          setAction(updated);
        } catch (err) {
          console.error("Save failed:", err);
        }
      }, 600);
    },
    [actionId]
  );

  // Immediate save (for dropdowns)
  const immediateSave = useCallback(
    async (field: string, value: string | null) => {
      if (!actionId) return;
      try {
        const updated = await updateAction(actionId, { [field]: value });
        setAction(updated);
      } catch (err) {
        console.error("Save failed:", err);
      }
    },
    [actionId]
  );

  async function handleDelete() {
    if (!actionId) return;
    if (!window.confirm("Aktion wirklich loeschen?")) return;
    try {
      await apiDeleteAction(actionId);
      navigate("/strategy/esg-hub/actions");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setToast("Link kopiert!");
    setTimeout(() => setToast(""), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-lilac-text border-t-transparent" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="p-6">
        <p className="text-text-subtle">Aktion nicht gefunden.</p>
      </div>
    );
  }

  const statusOpt = STATUS_OPTIONS.find((o) => o.value === action.status);

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          {
            label: "Aktionen",
            path: "/strategy/esg-hub/actions",
          },
          { label: action.title },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-text-primary">
        Aktionen
      </h1>

      {/* Main Content */}
      <div className="mt-6 rounded-2xl border border-border-gray bg-white p-8">
        <div className="flex gap-8">
          {/* Left Column */}
          <div className="flex-1 min-w-0">
            {/* Top-right icons */}
            <div className="flex justify-end gap-2 mb-6">
              <button
                onClick={handleShare}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                title="Link teilen"
              >
                <Share2 size={18} className="text-text-subtle" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 hover:bg-red-50 transition-colors"
                title="Loeschen"
              >
                <Trash2 size={18} className="text-text-subtle hover:text-red-500" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-6">
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                value={action.title}
                onChange={(e) => {
                  setAction({ ...action, title: e.target.value });
                  debouncedSave("title", e.target.value);
                }}
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
              />
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Beschreibung:
              </label>
              <textarea
                value={action.description ?? ""}
                onChange={(e) => {
                  setAction({ ...action, description: e.target.value });
                  debouncedSave("description", e.target.value || null);
                }}
                rows={5}
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac resize-y"
              />
            </div>

            {/* Progress */}
            <div>
              <h3 className="mb-3 text-base font-semibold text-text-primary">
                Progress
              </h3>
              <label className="mb-1 block text-xs font-medium text-accent-lilac-text">
                Hinweis:
              </label>
              <textarea
                value={action.progressNote ?? ""}
                onChange={(e) => {
                  setAction({ ...action, progressNote: e.target.value });
                  debouncedSave("progressNote", e.target.value || null);
                }}
                rows={5}
                placeholder="Notiz schreiben"
                className="w-full rounded-lg border border-border-gray px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-lilac-text focus:ring-2 focus:ring-accent-lilac resize-y"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-72 shrink-0">
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">Status</span>
                <div className="relative" ref={statusRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusOpt?.color ?? ""}`}
                  >
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current opacity-50" />
                    {statusOpt?.label}
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border-gray bg-white shadow-lg">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setAction({ ...action, status: opt.value });
                            immediateSave("status", opt.value);
                            setShowStatusDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                            action.status === opt.value ? "font-medium" : ""
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${opt.color.split(" ")[0]}`}
                          />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates metadata */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">Erstellt am</span>
                <span className="text-sm text-text-primary">
                  {formatDateDisplay(action.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">
                  Zuletzt aktualisiert
                </span>
                <span className="text-sm text-text-primary">
                  {formatDateDisplay(action.updatedAt)}
                </span>
              </div>

              {/* Divider */}
              <hr className="border-border-gray" />

              <h4 className="text-sm font-semibold text-text-primary">
                Details
              </h4>

              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">
                  Verantwortlich
                </span>
                <div className="relative" ref={assigneeRef}>
                  <button
                    onClick={() =>
                      setShowAssigneeDropdown(!showAssigneeDropdown)
                    }
                    className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-xs text-text-subtle hover:bg-gray-50 transition-colors"
                  >
                    {action.assignee ? (
                      <>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-dark text-[9px] font-medium text-white">
                          {action.assignee.initials}
                        </span>
                        {action.assignee.name}
                      </>
                    ) : (
                      <>
                        <UserPlus size={12} />
                        nicht zugewiesen
                      </>
                    )}
                  </button>
                  {showAssigneeDropdown && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-lg border border-border-gray bg-white shadow-lg">
                      <button
                        onClick={() => {
                          setAction({
                            ...action,
                            assigneeId: null,
                            assignee: null,
                          });
                          immediateSave("assigneeId", null);
                          setShowAssigneeDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <UserPlus size={14} className="text-text-subtle" />
                        nicht zugewiesen
                      </button>
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setAction({
                              ...action,
                              assigneeId: u.id,
                              assignee: u,
                            });
                            immediateSave("assigneeId", u.id);
                            setShowAssigneeDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                            action.assigneeId === u.id ? "font-medium" : ""
                          }`}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-dark text-[9px] font-medium text-white">
                            {u.initials}
                          </span>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">Start Datum</span>
                <div className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-xs text-text-subtle">
                  <Play size={10} fill="currentColor" />
                  <input
                    type="date"
                    value={toInputDate(action.startDate)}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      setAction({ ...action, startDate: val });
                      immediateSave("startDate", val);
                    }}
                    className="bg-transparent text-xs outline-none"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-subtle">Zieldatum</span>
                <div className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-xs text-text-subtle">
                  <Clock size={10} />
                  <input
                    type="date"
                    value={toInputDate(action.dueDate)}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      setAction({ ...action, dueDate: val });
                      immediateSave("dueDate", val);
                    }}
                    className="bg-transparent text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Panels */}
      <div className="mt-6 space-y-6">
        <RoiInputsPanel
          action={action}
          onUpdate={(updated) => setAction(updated)}
        />
        {settings && <RoiOutputsPanel action={action} settings={settings} />}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-sidebar-dark px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
