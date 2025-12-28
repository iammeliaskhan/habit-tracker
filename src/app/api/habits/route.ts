import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { todayISODate, parseISODateUTC } from "@/lib/dates";
import { createHabitSchema } from "@/lib/schemas";
import { getActiveUserId } from "@/lib/activeUser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date") ?? todayISODate();

  let date: Date;
  try {
    date = parseISODateUTC(dateStr);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid date" },
      { status: 400 },
    );
  }

  const userId = await getActiveUserId();

  const habits = await prisma.habit.findMany({
    where: { archivedAt: null, userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  const checkIns = await prisma.habitCheckIn.findMany({
    where: {
      date,
      habitId: { in: habits.map((h) => h.id) },
      completed: true,
    },
    select: { habitId: true },
  });

  const completed = new Set(checkIns.map((c) => c.habitId));

  return NextResponse.json({
    date: dateStr,
    habits: habits.map((h) => ({
      ...h,
      completed: completed.has(h.id),
    })),
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createHabitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const userId = await getActiveUserId();

  const habit = await prisma.habit.create({
    data: { ...parsed.data, userId },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  return NextResponse.json({ habit }, { status: 201 });
}
