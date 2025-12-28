import { NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { activeUserCookieName, ensureDefaultUser } from "@/lib/activeUser";

const bodySchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  await ensureDefaultUser();

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(activeUserCookieName(), parsed.data.userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // local-first app; keep it for a long time.
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
