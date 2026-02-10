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
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-an-100">
            Neue Aktion erstellen
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-sfgray-10 transition-colors"
          >
            <X size={18} className="text-an-60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-md font-medium text-an-100">
              Name <span className="text-dang-80">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100"
              placeholder="Titel der Aktion"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-md font-medium text-an-100">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100 focus:ring-1 focus:ring-lilac-100 resize-none"
              placeholder="Optionale Beschreibung"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="mb-1 block text-md font-medium text-an-100">
              Verantwortlich
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
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
              <label className="mb-1 block text-md font-medium text-an-100">
                Start Datum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-md font-medium text-an-100">
                Zieldatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-border-gray px-3 py-2 text-md outline-none focus:border-blue-100"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-md text-dang-80">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-gray px-4 py-2 text-md text-an-60 hover:bg-sfgray-5 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-darkgreen-100 px-4 py-2 text-md font-medium text-white hover:bg-darkgreen-75 transition-colors disabled:opacity-50"
            >
              {saving ? "Erstelle..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
