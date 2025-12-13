"use client";

import { useEffect, useMemo, useState } from "react";

import { todayISODate } from "@/lib/dates";

type Habit = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  completed: boolean;
};

type HabitsResponse = {
  date: string;
  habits: Habit[];
};

async function fetchHabits(date: string): Promise<HabitsResponse> {
  const res = await fetch(`/api/habits?date=${encodeURIComponent(date)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load habits");
  return res.json();
}

export default function Dashboard() {
  const [date, setDate] = useState<string>(() => todayISODate());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const completedCount = useMemo(
    () => habits.filter((h) => h.completed).length,
    [habits],
  );

  async function refresh(selectedDate = date) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHabits(selectedDate);
      setHabits(data.habits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function onAddHabit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();

    if (!name) return;

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: color || undefined }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create habit");
      return;
    }

    await refresh();
  }

  async function toggleHabit(habitId: string) {
    // optimistic
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, completed: !h.completed } : h)),
    );

    const res = await fetch(`/api/habits/${habitId}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    if (!res.ok) {
      // rollback
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completed: !h.completed } : h,
        ),
      );
      setError("Failed to toggle check-in");
    }
  }

  async function deleteHabit(habitId: string) {
    const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete habit");
      return;
    }
    await refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {completedCount}/{habits.length} completed
          </p>
        </div>

        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <form
          action={onAddHabit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Habit name
            <input
              name="name"
              placeholder="e.g. Meditate"
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            Color
            <input
              name="color"
              type="color"
              defaultValue="#0ea5e9"
              className="h-10 w-16 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-black"
            />
          </label>

          <button
            type="submit"
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Add
          </button>
        </form>

        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : habits.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No habits yet. Add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {habits.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-black"
              >
                <button
                  type="button"
                  onClick={() => void toggleHabit(h.id)}
                  className="group flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: h.color ?? "#94a3b8" }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {h.name}
                  </span>
                  <span
                    className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      h.completed
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    {h.completed ? "Done" : "Not done"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void deleteHabit(h.id)}
                  className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
