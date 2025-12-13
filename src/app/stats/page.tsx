import { prisma } from "@/lib/prisma";
import { parseISODateUTC, todayISODate, toISODateUTC } from "@/lib/dates";
import StatsChart from "@/components/StatsChart";

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

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

  const checkIns = await prisma.habitCheckIn.findMany({
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Completion over the last {days} days
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <StatsChart data={data} />
      </div>

      <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Range: {toISODateUTC(start)} → {toISODateUTC(end)}
      </div>
    </div>
  );
}
