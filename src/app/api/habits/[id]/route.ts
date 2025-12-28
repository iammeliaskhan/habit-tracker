import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateHabitSchema } from "@/lib/schemas";
import { getActiveUserId } from "@/lib/activeUser";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  const json = await request.json().catch(() => null);
  const parsed = updateHabitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { archived, ...rest } = parsed.data;

  const userId = await getActiveUserId();

  const existing = await prisma.habit.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...rest,
      ...(archived === undefined
        ? {}
        : { archivedAt: archived ? new Date() : null }),
    },
    select: { id: true, name: true, color: true, createdAt: true, archivedAt: true },
  });

  return NextResponse.json({ habit });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const userId = await getActiveUserId();

  const existing = await prisma.habit.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  await prisma.habit.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
