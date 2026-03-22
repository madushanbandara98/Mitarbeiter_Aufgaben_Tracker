import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { findSession, updateDb } from "@/lib/store";
import { validateWeekConfig } from "@/lib/validation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateWeekConfig(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Wocheneinstellungen sind unvollstaendig." },
      { status: 400 },
    );
  }

  const result = await updateDb((db) => {
    const session = findSession(db, token);
    if (!session) {
      return null;
    }

    const user = db.users.find((entry) => entry.id === session.userId);
    if (!user) {
      return null;
    }

    const existing = db.weekConfigs.find((entry) => entry.email === user.email && entry.kw === validated.data.kw);
    if (existing) {
      existing.arbeitszeit = validated.data.arbeitszeit;
      existing.arbeitsort = validated.data.arbeitsort;
      existing.schicht = validated.data.schicht;
      return existing;
    }

    const config = {
      id: db.nextIds.weekConfigs++,
      email: user.email,
      kw: validated.data.kw,
      arbeitszeit: validated.data.arbeitszeit,
      arbeitsort: validated.data.arbeitsort,
      schicht: validated.data.schicht,
    };

    db.weekConfigs.push(config);
    return config;
  });

  if (!result) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  return NextResponse.json({ config: result });
}
