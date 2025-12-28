import HabitTracker from "@/components/HabitTracker";
import { prisma } from "@/lib/prisma";
import { getActiveUserId } from "@/lib/activeUser";
import {
  addDaysUTC,
  parseISODateUTC,
  startOfWeekUTC,
  todayISODate,
  toISODateUTC,
} from "@/lib/dates";

export default async function Home() {
  const todayStr = todayISODate();
  const today = parseISODateUTC(todayStr);

  const weekStart = startOfWeekUTC(today, 1);
  const weekEnd = addDaysUTC(weekStart, 6);

  // For "History" and summary stats, include the last 30 days (incl. today).
  const historyStart = addDaysUTC(today, -29);

  const activeUserId = await getActiveUserId();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  const habits = await prisma.habit.findMany({
    where: { archivedAt: null, userId: activeUserId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  // Fetch check-ins once for the whole range the UI needs (history + this week).
  const checkIns =
    habits.length === 0
      ? []
      : await prisma.habitCheckIn.findMany({
          where: {
            completed: true,
            date: { gte: historyStart, lte: weekEnd },
            habitId: { in: habits.map((h) => h.id) },
          },
          select: { date: true, habitId: true },
        });

  const completedByDate: Record<string, string[]> = {};
  for (const c of checkIns) {
    const key = toISODateUTC(c.date);
    (completedByDate[key] ??= []).push(c.habitId);
  }

  return (
    <HabitTracker
      initial={{
        today: todayStr,
        weekStart: toISODateUTC(weekStart),
        users: users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
        activeUserId,
        habits: habits.map((h) => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
        })),
        completedByDate,
      }}
    />
  );
}
