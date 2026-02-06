import { useState } from "react";
import { X } from "lucide-react";
import { createAction } from "../api";
import type { User } from "../types";

export default function CreateActionModal({
  users,
  onClose,
  onCreated,
}: {
  users: User[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Titel ist erforderlich");
      return;
    }
    setSaving(true);
    try {
      await createAction({
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: assigneeId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      });
      onCreated();
    } catch (err) {
      setError("Fehler beim Erstellen");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            Neue Aktion erstellen
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-text-subtle" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac"
              placeholder="Titel der Aktion"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-accent-lilac-text focus:ring-1 focus:ring-accent-lilac resize-none"
              placeholder="Optionale Beschreibung"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Verantwortlich
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-accent-lilac-text"
            >
              <option value="">nicht zugewiesen</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Start Datum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-accent-lilac-text"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Zieldatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-accent-lilac-text"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-gray px-4 py-2 text-sm text-text-subtle hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sidebar-dark px-4 py-2 text-sm font-medium text-white hover:bg-sidebar-darker transition-colors disabled:opacity-50"
            >
              {saving ? "Erstelle..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
