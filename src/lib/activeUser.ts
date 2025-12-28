import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const ACTIVE_USER_COOKIE = "activeUserId";

export async function ensureDefaultUser() {
  // Keep a stable default profile in local-first mode.
  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { name: "Default", color: "#0ea5e9" },
    select: { id: true },
  });

  return created.id;
}

export async function getActiveUserId(): Promise<string> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ACTIVE_USER_COOKIE)?.value;
  if (cookieId) {
    const exists = await prisma.user.findUnique({
      where: { id: cookieId },
      select: { id: true },
    });
    if (exists) return cookieId;
  }

  return ensureDefaultUser();
}

export function activeUserCookieName() {
  return ACTIVE_USER_COOKIE;
}
