import { NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ensureDefaultUser, getActiveUserId } from "@/lib/activeUser";

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET() {
  const activeUserId = await getActiveUserId();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  return NextResponse.json({
    activeUserId,
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  await ensureDefaultUser();

  // Inherit the currently-active profile's habits so new profiles start with
  // the same "loaded" habit set.
  const sourceUserId = await getActiveUserId();

  const json = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const user = await prisma.user.create({
    data: { name: parsed.data.name, color: parsed.data.color },
    select: { id: true, name: true, color: true, createdAt: true },
  });

  const sourceHabits = await prisma.habit.findMany({
    where: { userId: sourceUserId, archivedAt: null },
    select: { name: true, color: true },
  });

  if (sourceHabits.length > 0) {
    await prisma.habit.createMany({
      data: sourceHabits.map((h) => ({ ...h, userId: user.id })),
    });
  }

  return NextResponse.json(
    {
      user: { ...user, createdAt: user.createdAt.toISOString() },
    },
    { status: 201 },
  );
}
