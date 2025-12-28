import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseISODateUTC } from "@/lib/dates";
import { toggleCheckInSchema } from "@/lib/schemas";
import { getActiveUserId } from "@/lib/activeUser";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: habitId } = await params;

  const json = await request.json().catch(() => null);
  const parsed = toggleCheckInSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let date: Date;
  try {
    date = parseISODateUTC(parsed.data.date);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid date" },
      { status: 400 },
    );
  }

  const userId = await getActiveUserId();

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const key = { habitId, date };

  const existing = await prisma.habitCheckIn.findUnique({
    where: { habitId_date: key },
  });

  const desired = parsed.data.completed;

  if (desired === false) {
    if (existing) {
      await prisma.habitCheckIn.delete({ where: { habitId_date: key } });
    }
    return NextResponse.json({ completed: false });
  }

  if (existing) {
    // toggle off
    await prisma.habitCheckIn.delete({ where: { habitId_date: key } });
    return NextResponse.json({ completed: false });
  }

  await prisma.habitCheckIn.create({
    data: { habitId, date, completed: true },
  });

  return NextResponse.json({ completed: true });
}
