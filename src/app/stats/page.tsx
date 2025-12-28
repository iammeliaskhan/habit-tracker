import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { addDaysUTC, parseISODateUTC, todayISODate, toISODateUTC } from "@/lib/dates";
import StatsChart from "@/components/StatsChart";

const DISTINCT_COLORS = [
  "#0ea5e9", // sky
  "#ef4444", // red
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // yellow
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#6366f1", // indigo
];

export default async function StatsPage() {
  const days = 30;
  const endStr = todayISODate();
  const end = parseISODateUTC(endStr);
  const start = addDaysUTC(end, -(days - 1));

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true },
  });

  const habits = await prisma.habit.findMany({
    where: { archivedAt: null },
    select: { id: true, userId: true },
  });

  const totalByUser = new Map<string, number>();
  for (const u of users) totalByUser.set(u.id, 0);
  for (const h of habits) {
    if (!h.userId) continue;
    totalByUser.set(h.userId, (totalByUser.get(h.userId) ?? 0) + 1);
  }

  const checkIns =
    habits.length === 0
      ? []
      : await prisma.habitCheckIn.findMany({
          where: {
            completed: true,
            date: { gte: start, lte: end },
            habitId: { in: habits.map((h) => h.id) },
          },
          select: { date: true, habitId: true, habit: { select: { userId: true } } },
        });

  // date -> userId -> completed habitIds
  const byDateUser = new Map<string, Map<string, Set<string>>>();
  for (const c of checkIns) {
    const userId = c.habit.userId;
    if (!userId) continue;

    const dateKey = toISODateUTC(c.date);
    const userMap = byDateUser.get(dateKey) ?? new Map<string, Set<string>>();
    const set = userMap.get(userId) ?? new Set<string>();
    set.add(c.habitId);
    userMap.set(userId, set);
    byDateUser.set(dateKey, userMap);
  }

  type MultiPoint = { date: string; [key: string]: number | string };

  const data: MultiPoint[] = Array.from({ length: days }, (_, i) => {
    const d = addDaysUTC(start, i);
    const dateKey = toISODateUTC(d);

    const row: MultiPoint = { date: dateKey };

    for (const u of users) {
      const total = totalByUser.get(u.id) ?? 0;
      const completed = byDateUser.get(dateKey)?.get(u.id)?.size ?? 0;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      row[u.id] = percent;
    }

    return row;
  });

  const series = users.map((u, idx) => ({
    userId: u.id,
    name: u.name,
    color: u.color ?? DISTINCT_COLORS[idx % DISTINCT_COLORS.length],
  }));

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
        <StatsChart data={data} series={series} />
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Range: {toISODateUTC(start)} → {toISODateUTC(end)}
      </div>
    </div>
  );
}
