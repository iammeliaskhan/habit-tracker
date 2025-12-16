import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { addDaysUTC, parseISODateUTC, todayISODate, toISODateUTC } from "@/lib/dates";
import StatsChart from "@/components/StatsChart";

export default async function StatsPage() {
  const days = 30;
  const endStr = todayISODate();
  const end = parseISODateUTC(endStr);
  const start = addDaysUTC(end, -(days - 1));

  const habits = await prisma.habit.findMany({
    where: { archivedAt: null },
    select: { id: true },
  });
  const total = habits.length;

  const checkIns =
    total === 0
      ? []
      : await prisma.habitCheckIn.findMany({
          where: {
            completed: true,
            date: { gte: start, lte: end },
            habitId: { in: habits.map((h) => h.id) },
          },
          select: { date: true, habitId: true },
        });

  const byDate = new Map<string, Set<string>>();
  for (const c of checkIns) {
    const key = toISODateUTC(c.date);
    const set = byDate.get(key) ?? new Set<string>();
    set.add(c.habitId);
    byDate.set(key, set);
  }

  const data = Array.from({ length: days }, (_, i) => {
    const d = addDaysUTC(start, i);
    const key = toISODateUTC(d);
    const completed = byDate.get(key)?.size ?? 0;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { date: key, percent, completed, total };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-zinc-500">Habit Tracker</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Stats</h1>
          <p className="mt-2 text-sm text-zinc-600">Completion over the last {days} days</p>
        </div>

        <Link
          href="/"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Back to tracker
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <StatsChart data={data} />
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Range: {toISODateUTC(start)} → {toISODateUTC(end)}
      </div>
    </div>
  );
}
