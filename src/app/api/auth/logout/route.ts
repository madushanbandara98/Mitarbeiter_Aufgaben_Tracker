import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { updateDb } from "@/lib/store";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  await updateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });

  cookieStore.delete(authCookieName);

  return NextResponse.json({ ok: true });
}
