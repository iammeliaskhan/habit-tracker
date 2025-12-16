"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { addDaysUTC, parseISODateUTC, toISODateUTC } from "@/lib/dates";

type Habit = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

type InitialData = {
  today: string; // YYYY-MM-DD
  weekStart: string; // YYYY-MM-DD (Monday)
  habits: Habit[];
  completedByDate: Record<string, string[]>; // date -> habitIds
};

type View = "today" | "week" | "history";

function classNames(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function weekdayLabel(dateStr: string): string {
  const d = parseISODateUTC(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    timeZone: "UTC",
  }).format(d);
}

function monthDayLabel(dateStr: string): string {
  const d = parseISODateUTC(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function buildCompletedMap(initial: Record<string, string[]>) {
  const map = new Map<string, Set<string>>();
  for (const [date, ids] of Object.entries(initial)) {
    map.set(date, new Set(ids));
  }
  return map;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={classNames(
        "inline-flex h-5 w-5 items-center justify-center rounded border",
        checked
          ? "border-zinc-900 bg-zinc-900"
          : "border-zinc-300 bg-white hover:border-zinc-400",
      )}
      aria-hidden
    >
      {checked ? (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 text-white"
        >
          <path
            d="M16.25 5.5L8.25 13.5L3.75 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export default function HabitTracker({ initial }: { initial: InitialData }) {
  const [view, setView] = useState<View>("today");
  const [focusedDate, setFocusedDate] = useState<string>(initial.today);

  const [habits, setHabits] = useState<Habit[]>(initial.habits);
  const [completed, setCompleted] = useState<Map<string, Set<string>>>(() =>
    buildCompletedMap(initial.completedByDate),
  );

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const weekDates = useMemo(() => {
    const start = parseISODateUTC(initial.weekStart);
    return Array.from({ length: 7 }, (_, i) => toISODateUTC(addDaysUTC(start, i)));
  }, [initial.weekStart]);

  const historyDates = useMemo(() => {
    const end = parseISODateUTC(initial.today);
    // last 30 days, newest first
    return Array.from({ length: 30 }, (_, i) => toISODateUTC(addDaysUTC(end, -i)));
  }, [initial.today]);


  const isCompleted = useCallback(
    (date: string, habitId: string): boolean => {
      return completed.get(date)?.has(habitId) ?? false;
    },
    [completed],
  );

  function setCompletedValue(date: string, habitId: string, value: boolean) {
    setCompleted((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(date) ?? []);
      if (value) set.add(habitId);
      else set.delete(habitId);
      next.set(date, set);
      return next;
    });
  }

  async function toggle(date: string, habitId: string) {
    const nextValue = !isCompleted(date, habitId);

    setError(null);
    setCompletedValue(date, habitId, nextValue);

    const res = await fetch(`/api/habits/${habitId}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, completed: nextValue }),
    });

    if (!res.ok) {
      // rollback
      setCompletedValue(date, habitId, !nextValue);
      setError("Failed to update check-in");
    }
  }

  async function onAddHabit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    if (!name) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: color || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create habit");
      }

      const body = (await res.json()) as { habit: Habit };
      setHabits((prev) => [...prev, body.habit]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create habit");
    } finally {
      setBusy(false);
    }
  }

  async function deleteHabit(habitId: string) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete habit");

      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setCompleted((prev) => {
        const next = new Map(prev);
        for (const [date, set] of next.entries()) {
          const newSet = new Set(set);
          newSet.delete(habitId);
          next.set(date, newSet);
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete habit");
    } finally {
      setBusy(false);
    }
  }

  const statsForDate = useCallback(
    (date: string) => {
      const done = habits.reduce(
        (acc, h) => acc + (isCompleted(date, h.id) ? 1 : 0),
        0,
      );
      const total = habits.length;
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      return { done, total, percent };
    },
    [habits, isCompleted],
  );

  const todayStats = useMemo(
    () => statsForDate(initial.today),
    [initial.today, statsForDate],
  );

  const weekAvg = useMemo(() => {
    if (weekDates.length === 0) return 0;
    const sum = weekDates.reduce((acc, d) => acc + statsForDate(d).percent, 0);
    return Math.round(sum / weekDates.length);
  }, [statsForDate, weekDates]);

  const last30Avg = useMemo(() => {
    if (historyDates.length === 0) return 0;
    const sum = historyDates.reduce((acc, d) => acc + statsForDate(d).percent, 0);
    return Math.round(sum / historyDates.length);
  }, [historyDates, statsForDate]);

  function renderChecklist(date: string) {
    const { done, total, percent } = statsForDate(date);

    return (
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-800">{weekdayLabel(date)}</div>
            <div className="text-xs text-zinc-500">{monthDayLabel(date)} • {done}/{total} ({percent}%)</div>
          </div>

          <span className="inline-flex h-2 w-28 overflow-hidden rounded-full bg-zinc-100">
            <span
              className="block h-full bg-zinc-900"
              style={{ width: `${percent}%` }}
              aria-hidden
            />
          </span>
        </div>

        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
          {habits.map((h) => {
            const checked = isCompleted(date, h.id);
            return (
              <li key={h.id} className="flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  onClick={() => void toggle(date, h.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                  aria-label={`${checked ? "Uncheck" : "Check"} ${h.name} for ${date}`}
                >
                  <Checkbox checked={checked} />
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: h.color ?? "#94a3b8" }}
                      aria-hidden
                    />
                    <span className="text-sm text-zinc-900">{h.name}</span>
                  </span>
                </button>
              </li>
            );
          })}

          {habits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-zinc-600">No habits yet.</li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl">
              ✨
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Habit Tracker</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Notion-style entries database with Today / This Week (calendar) / History views.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/stats"
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Stats
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">Today</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{todayStats.percent}%</div>
            <div className="mt-1 text-xs text-zinc-500 tabular-nums">
              {todayStats.done}/{todayStats.total} completed
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">This Week (avg)</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{weekAvg}%</div>
            <div className="mt-1 text-xs text-zinc-500">Mon–Sun</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">Last 30 days (avg)</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{last30Avg}%</div>
            <div className="mt-1 text-xs text-zinc-500">History</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Habits</h2>
            <span className="text-xs text-zinc-500">{habits.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {habits.map((h) => (
              <div
                key={h.id}
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: h.color ?? "#94a3b8" }}
                  aria-hidden
                />
                <span className="max-w-[180px] truncate">{h.name}</span>
                <button
                  type="button"
                  onClick={() => void deleteHabit(h.id)}
                  disabled={busy}
                  className="ml-1 hidden rounded px-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 group-hover:inline-flex disabled:opacity-50"
                  aria-label={`Delete ${h.name}`}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <form action={onAddHabit} className="flex items-end gap-2">
              <label className="flex-1">
                <div className="mb-1 text-xs font-medium text-zinc-600">New habit</div>
                <input
                  name="name"
                  placeholder="e.g. Read"
                  disabled={busy}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-300"
                />
              </label>

              <label>
                <div className="mb-1 text-xs font-medium text-zinc-600">Color</div>
                <input
                  name="color"
                  type="color"
                  defaultValue="#0ea5e9"
                  disabled={busy}
                  className="h-9 w-12 rounded-md border border-zinc-200 bg-white p-1"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Add
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Entries</h2>

            <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setView("today");
                  setFocusedDate(initial.today);
                }}
                className={classNames(
                  "rounded px-2 py-1 text-xs font-medium",
                  view === "today"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={classNames(
                  "rounded px-2 py-1 text-xs font-medium",
                  view === "week"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setView("history")}
                className={classNames(
                  "rounded px-2 py-1 text-xs font-medium",
                  view === "history"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                History
              </button>
            </div>
          </div>

          {view === "week" ? (
            <div className="mt-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((d) => {
                  const { percent } = statsForDate(d);
                  const isFocused = d === focusedDate;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFocusedDate(d)}
                      className={classNames(
                        "rounded-lg border px-2 py-2 text-left",
                        isFocused
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50",
                      )}
                    >
                      <div className="text-xs font-medium text-zinc-600">
                        {new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(
                          parseISODateUTC(d),
                        )}
                      </div>
                      <div className="mt-1 text-sm font-semibold tabular-nums text-zinc-900">
                        {parseISODateUTC(d).getUTCDate()}
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 tabular-nums">{percent}%</div>
                    </button>
                  );
                })}
              </div>

              {renderChecklist(focusedDate)}
            </div>
          ) : null}

          {view === "today" ? renderChecklist(focusedDate) : null}

          {view === "history" ? (
            <div className="mt-4">
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold text-zinc-600">
                        Date
                      </th>
                      <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold text-zinc-600">
                        Progress
                      </th>
                      <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-right text-xs font-semibold text-zinc-600">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyDates.map((d) => {
                      const { done, total, percent } = statsForDate(d);
                      return (
                        <tr key={d} className="hover:bg-zinc-50">
                          <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-900">
                            <div className="font-medium">{weekdayLabel(d)}</div>
                            <div className="text-xs text-zinc-500">{d}</div>
                          </td>
                          <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-600">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
                                <span
                                  className="block h-full bg-zinc-900"
                                  style={{ width: `${percent}%` }}
                                  aria-hidden
                                />
                              </span>
                              <span className="tabular-nums">{done}/{total} ({percent}%)</span>
                            </span>
                          </td>
                          <td className="border-b border-zinc-100 px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setFocusedDate(d);
                                setView("today");
                              }}
                              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Dates are treated as UTC days (YYYY-MM-DD).
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
