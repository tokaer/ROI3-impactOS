import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  List,
  Columns3,
  Settings2,
  Play,
  Clock,
  UserPlus,
  Search,
  X,
  GripVertical,
} from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import CreateActionModal from "../components/CreateActionModal";
import { fetchActions, fetchUsers, updateAction } from "../api";
import type { Action, ActionStatus, User } from "../types";

const STATUS_LABELS: Record<ActionStatus, string> = {
  OFFEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  DONE: "Abgeschlossen",
};

const STATUS_COLORS: Record<ActionStatus, { bg: string; dot: string }> = {
  OFFEN: { bg: "bg-warn-60", dot: "bg-warn-80" },
  IN_PROGRESS: { bg: "bg-blue-10", dot: "bg-blue-100" },
  DONE: { bg: "bg-succ-60", dot: "bg-succ-80" },
};

const STATUS_ORDER: ActionStatus[] = ["OFFEN", "IN_PROGRESS", "DONE"];

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Zuletzt aktualisiert" },
  { value: "title", label: "Titel (A-Z)" },
  { value: "dueDate", label: "Zieldatum" },
  { value: "startDate", label: "Startdatum" },
];

type ViewMode = "list" | "kanban";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ActionsOverview() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus[]>([]);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir] = useState<"asc" | "desc">("desc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Config
  const [groupByStatus, setGroupByStatus] = useState(true);
  const [showAssignee, setShowAssignee] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [showConfigPopover, setShowConfigPopover] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Drag & drop
  const [draggedActionId, setDraggedActionId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] =
    useState<ActionStatus | null>(null);

  // Refs for click-outside
  const configRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const loadActions = useCallback(async () => {
    try {
      const data = await fetchActions({
        q: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        sortBy,
        sortDir: sortBy === "title" ? "asc" : sortDir,
      });
      setActions(data);
    } catch (err) {
      console.error("Failed to load actions:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        configRef.current &&
        !configRef.current.contains(e.target as Node)
      ) {
        setShowConfigPopover(false);
      }
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setShowFilterPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group actions by status
  const groupedActions: Record<ActionStatus, Action[]> = {
    OFFEN: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  actions.forEach((a) => {
    groupedActions[a.status as ActionStatus]?.push(a);
  });

  const toggleStatusFilter = (status: ActionStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const activeFilterCount = (searchQuery ? 1 : 0) + statusFilter.length;

  // ── Drag & drop handlers ───────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, actionId: string) {
    setDraggedActionId(actionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", actionId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedActionId(null);
    setDropTargetStatus(null);
  }

  function handleDragOver(e: React.DragEvent, status: ActionStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetStatus(status);
  }

  function handleDragLeave(e: React.DragEvent, status: ActionStatus) {
    const relatedTarget = e.relatedTarget as Node | null;
    if (
      e.currentTarget instanceof HTMLElement &&
      relatedTarget &&
      !e.currentTarget.contains(relatedTarget)
    ) {
      if (dropTargetStatus === status) {
        setDropTargetStatus(null);
      }
    }
  }

  async function handleDrop(e: React.DragEvent, newStatus: ActionStatus) {
    e.preventDefault();
    setDropTargetStatus(null);
    const actionId = e.dataTransfer.getData("text/plain");
    if (!actionId) return;

    const action = actions.find((a) => a.id === actionId);
    if (!action || action.status === newStatus) return;

    // Optimistic update
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a))
    );

    try {
      await updateAction(actionId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      loadActions();
    }
  }

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        segments={[
          { label: "Strategie" },
          { label: "ESG Strategy Hub" },
          { label: "Aktionen" },
        ]}
      />
      <h1 className="mt-2 text-xl font-semibold text-an-100">
        Aktionen
      </h1>

      {/* Toolbar */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-md transition-colors ${
                showFilterPanel || activeFilterCount > 0
                  ? "border-blue-100 bg-lilac-10 text-blue-100"
                  : "border-border-gray text-an-60 hover:bg-sfgray-5"
              }`}
            >
              <Filter size={15} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-md border border-border-gray bg-white p-4 shadow-lg">
                {/* Search */}
                <div className="relative mb-4">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-an-60"
                  />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-border-gray py-2 pl-9 pr-8 text-md outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-an-60 hover:text-an-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-an-60 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleStatusFilter(status)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          statusFilter.includes(status)
                            ? "bg-lilac-100 text-blue-100"
                            : "bg-sfgray-10 text-an-60 hover:bg-sfgray-20"
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-an-60 uppercase tracking-wider">
                    Sortierung
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Count */}
          <span className="text-md text-an-60">
            {actions.length} / {actions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-md border border-border-gray">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-l-md p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-lilac-100 text-blue-100"
                  : "text-an-60 hover:bg-sfgray-5"
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded-r-md p-2 transition-colors ${
                viewMode === "kanban"
                  ? "bg-lilac-100 text-blue-100"
                  : "text-an-60 hover:bg-sfgray-5"
              }`}
            >
              <Columns3 size={16} />
            </button>
          </div>

          {/* Config */}
          <div className="relative" ref={configRef}>
            <button
              onClick={() => setShowConfigPopover(!showConfigPopover)}
              className="flex items-center gap-2 rounded-md border border-border-gray px-3 py-2 text-md text-an-60 hover:bg-sfgray-5 transition-colors"
            >
              <Settings2 size={15} />
              <span>Konfigurieren</span>
            </button>

            {showConfigPopover && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-border-gray bg-white p-4 shadow-lg">
                <label className="flex items-center justify-between py-2">
                  <span className="text-md text-an-100">
                    Gruppiert nach Status
                  </span>
                  <ToggleSwitch
                    checked={groupByStatus}
                    onChange={setGroupByStatus}
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-md text-an-100">
                    Verantwortliche anzeigen
                  </span>
                  <ToggleSwitch
                    checked={showAssignee}
                    onChange={setShowAssignee}
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-md text-an-100">
                    Daten anzeigen
                  </span>
                  <ToggleSwitch
                    checked={showDates}
                    onChange={setShowDates}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group label (list only) */}
      {groupByStatus && viewMode === "list" && (
        <div className="mt-4 text-md text-an-100">
          <span className="font-semibold">Gruppiert</span> nach:{" "}
          <span className="font-semibold">Status</span>
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-md border-2 border-an-100 bg-white px-5 py-2.5 text-md font-semibold text-an-100 hover:bg-sfgray-5 transition-colors"
        >
          <Plus size={18} strokeWidth={2} />
          Neue Aktion erstellen
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-transparent" />
        </div>
      )}

      {/* ── Kanban View ───────────────────────────────────────────── */}
      {!loading && viewMode === "kanban" && (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const group = groupedActions[status];
            const colors = STATUS_COLORS[status];
            const isDropTarget = dropTargetStatus === status;
            const draggedAction = actions.find(
              (a) => a.id === draggedActionId
            );
            const isDraggingFromOther =
              draggedAction && draggedAction.status !== status;

            return (
              <div
                key={status}
                className={`flex w-80 shrink-0 flex-col rounded-md border-2 transition-colors ${
                  isDropTarget && isDraggingFromOther
                    ? "border-blue-100 bg-lilac-10"
                    : "border-border-gray bg-sfgray-5"
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border-gray">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${colors.dot}`}
                  />
                  <span className="text-md font-semibold text-an-100">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-sm font-medium text-an-60 border border-border-gray">
                    {group.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto p-3 min-h-[120px]">
                  {group.length === 0 && !isDropTarget && (
                    <p className="py-8 text-center text-sm text-an-60">
                      Keine Aktionen
                    </p>
                  )}
                  {group.length === 0 && isDropTarget && isDraggingFromOther && (
                    <div className="flex items-center justify-center rounded-md border-2 border-dashed border-blue-100/40 py-8">
                      <p className="text-sm text-blue-100">
                        Hier ablegen
                      </p>
                    </div>
                  )}
                  {group.map((action) => (
                    <KanbanCard
                      key={action.id}
                      action={action}
                      showAssignee={showAssignee}
                      showDates={showDates}
                      isDragging={draggedActionId === action.id}
                      onDragStart={(e) => handleDragStart(e, action.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() =>
                        navigate(
                          `/strategy/esg-hub/actions/${action.id}`
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────── */}
      {!loading && viewMode === "list" && groupByStatus ? (
        <div className="mt-4 space-y-6">
          {STATUS_ORDER.map((status) => {
            const group = groupedActions[status];
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="mb-3 text-md font-semibold text-an-100">
                  {STATUS_LABELS[status]}{" "}
                  <span className="ml-1 font-normal text-blue-100">
                    {group.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {group.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      showAssignee={showAssignee}
                      showDates={showDates}
                      onClick={() =>
                        navigate(
                          `/strategy/esg-hub/actions/${action.id}`
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && viewMode === "list" ? (
        <div className="mt-4 space-y-2">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              showAssignee={showAssignee}
              showDates={showDates}
              onClick={() =>
                navigate(`/strategy/esg-hub/actions/${action.id}`)
              }
            />
          ))}
        </div>
      ) : null}

      {!loading && actions.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center text-an-60">
          <p className="text-md">Keine Aktionen gefunden.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateActionModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadActions();
          }}
        />
      )}
    </div>
  );
}

// ── ActionCard (list view) ──────────────────────────────────────────────────

function ActionCard({
  action,
  showAssignee,
  showDates,
  onClick,
}: {
  action: Action;
  showAssignee: boolean;
  showDates: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center justify-between rounded-md border border-border-gray bg-white px-5 py-4 hover:shadow-lg hover:border-an-20 transition-all"
    >
      {/* Left */}
      <div className="min-w-0 flex-1 pr-4">
        <h4 className="text-md font-semibold text-an-100">
          {action.title}
        </h4>
        {action.description && (
          <p className="mt-0.5 truncate text-md text-an-60">
            {action.description}
          </p>
        )}
      </div>

      {/* Right pills */}
      <div className="flex shrink-0 items-center gap-3">
        {showAssignee && (
          <span className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-sm text-an-60">
            {action.assignee ? (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-darkgreen-100 text-[9px] font-medium text-white">
                  {action.assignee.initials}
                </span>
                {action.assignee.name}
              </>
            ) : (
              <>
                <UserPlus size={12} />
                Hinzufuegen
              </>
            )}
          </span>
        )}
        {showDates && action.startDate && (
          <span className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-sm text-an-60">
            <Play size={10} fill="currentColor" />
            {formatDate(action.startDate)}
          </span>
        )}
        {showDates && action.dueDate && (
          <span className="flex items-center gap-1.5 rounded-full border border-border-gray px-3 py-1 text-sm text-an-60">
            <Clock size={10} />
            {formatDate(action.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({
  action,
  showAssignee,
  showDates,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  action: Action;
  showAssignee: boolean;
  showDates: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group cursor-grab rounded-md border bg-white p-3.5 transition-all active:cursor-grabbing ${
        isDragging
          ? "border-blue-100 shadow-lg opacity-50"
          : "border-border-gray hover:shadow-lg hover:border-an-20"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 text-an-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-md font-semibold text-an-100 leading-snug">
            {action.title}
          </h4>
          {action.description && (
            <p className="mt-1 text-sm text-an-60 line-clamp-2">
              {action.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {showAssignee && action.assignee && (
              <span className="flex items-center gap-1 rounded-full bg-sfgray-10 px-2 py-0.5 text-sm text-an-60">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-darkgreen-100 text-[8px] font-medium text-white">
                  {action.assignee.initials}
                </span>
                {action.assignee.name.split(" ")[0]}
              </span>
            )}
            {showDates && action.dueDate && (
              <span className="flex items-center gap-1 rounded-full bg-sfgray-10 px-2 py-0.5 text-sm text-an-60">
                <Clock size={9} />
                {formatDate(action.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ───────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-blue-100" : "bg-an-20"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
