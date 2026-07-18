"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, commitFiles, encodeBase64Unicode, GitHubApiError } from "@/lib/github";
import { Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";
import { inputClass, slugify } from "@/components/admin/shared";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

const PATH = "content/tasks.json";
const ARRAY_KEY = "tasks";

function makeId(base: string, existingIds: string[]): string {
  const baseSlug = slugify(base) || "task";
  let candidate = baseSlug;
  let n = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${baseSlug}-${n}`;
    n++;
  }
  return candidate;
}

export default function TasksManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [entries, setEntries] = useState<Task[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content);
      const loaded: Task[] = parsed[ARRAY_KEY] ?? [];
      setEntries(loaded);
      setLoadedOrderIds(loaded.map((t) => t.id));
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  const orderDirty =
    entries !== null && entries.map((t) => t.id).join("|") !== loadedOrderIds.join("|");

  function moveEntry(index: number, direction: -1 | 1) {
    setEntries((prev) => {
      if (!prev) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function commit(newEntries: Task[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    const payload = { [ARRAY_KEY]: newEntries };
    const content = JSON.stringify(payload, null, 2) + "\n";
    setSaving(true);
    setError(null);
    try {
      await commitFiles([{ path: PATH, content: encodeBase64Unicode(content) }], message, token, {
        path: PATH,
        expectedSha: fileSha,
      });
      setEntries(newEntries);
      setLoadedOrderIds(newEntries.map((t) => t.id));
      await load();
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask() {
    const text = newTaskText.trim();
    if (!text || !entries) return;
    const id = makeId(text, entries.map((t) => t.id));
    const updated = [...entries, { id, text, done: false }];
    const ok = await commit(updated, `content: add task "${text}"`);
    if (ok) setNewTaskText("");
  }

  async function toggleDone(task: Task) {
    if (!entries) return;
    const updated = entries.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t));
    await commit(updated, `content: mark "${task.text}" ${task.done ? "not done" : "done"}`);
  }

  async function handleDelete(task: Task) {
    if (!entries) return;
    if (!confirm(`Delete "${task.text}"?`)) return;
    const updated = entries.filter((t) => t.id !== task.id);
    await commit(updated, `content: delete task "${task.text}"`);
  }

  function startEditText(task: Task) {
    setEditingId(task.id);
    setEditingText(task.text);
  }

  async function saveEditText(task: Task) {
    const text = editingText.trim();
    setEditingId(null);
    if (!text || text === task.text || !entries) return;
    const updated = entries.map((t) => (t.id === task.id ? { ...t, text } : t));
    await commit(updated, `content: update task "${task.text}"`);
  }

  async function handleSaveOrder() {
    if (!entries) return;
    await commit(entries, "content: reorder tasks");
  }

  function discardOrder() {
    void load();
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAddTask();
        }}
        className="flex items-center gap-2 mb-4"
      >
        <input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a task…"
          className={inputClass}
          disabled={saving}
        />
        <button
          type="submit"
          disabled={saving || !newTaskText.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus size={16} />
          Add
        </button>
      </form>

      {orderDirty && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">Order changed</span>
          <button
            onClick={() => void handleSaveOrder()}
            disabled={saving}
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save order"}
          </button>
          <button
            onClick={discardOrder}
            disabled={saving}
            className="px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs transition-colors"
          >
            Discard
          </button>
        </div>
      )}

      {loading && <p className="text-muted text-sm">Loading…</p>}

      {!loading && entries && entries.length === 0 && (
        <p className="text-muted text-sm">No tasks yet.</p>
      )}

      {!loading && entries && entries.length > 0 && (
        <div className="border border-border rounded-lg divide-y divide-border">
          {entries.map((task, index) => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => void toggleDone(task)}
                disabled={saving}
                aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
                className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${
                  task.done
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-border text-transparent hover:border-accent/60"
                }`}
              >
                <Check size={14} />
              </button>

              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => void saveEditText(task)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEditText(task);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className={inputClass}
                  />
                ) : (
                  <button
                    onClick={() => startEditText(task)}
                    className={`text-left text-sm truncate w-full ${
                      task.done ? "text-muted line-through" : "text-foreground"
                    }`}
                  >
                    {task.text}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveEntry(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move "${task.text}" up`}
                  className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveEntry(index, 1)}
                  disabled={index === entries.length - 1}
                  aria-label={`Move "${task.text}" down`}
                  className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => void handleDelete(task)}
                  aria-label={`Delete "${task.text}"`}
                  className="p-2 text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
