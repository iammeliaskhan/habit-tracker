import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ensureDefaultUser, getActiveUserId } from "@/lib/activeUser";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  // Ensure there's always at least one user.
  await ensureDefaultUser();

  const activeUserId = await getActiveUserId();
  if (id === activeUserId) {
    return NextResponse.json(
      { error: "Cannot delete the active profile. Switch profiles first." },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
