import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { findSession, toPublicUser, updateDb } from "@/lib/store";
import { validateProfile } from "@/lib/validation";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateProfile(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Bitte die markierten Profilfelder korrigieren." },
      { status: 400 },
    );
  }

  const result = await updateDb((db) => {
    const session = findSession(db, token);
    if (!session) {
      return { kind: "unauthorized" as const };
    }

    const user = db.users.find((entry) => entry.id === session.userId);
    if (!user) {
      return { kind: "unauthorized" as const };
    }

    const emailTaken = db.users.some((entry) => entry.email === validated.data.email && entry.id !== user.id);
    if (emailTaken) {
      return { kind: "conflict" as const };
    }

    const previousEmail = user.email;
    const previousName = user.fullName;

    user.fullName = validated.data.fullName;
    user.email = validated.data.email;
    user.abteilung = validated.data.abteilung;
    user.role = validated.data.role;
    user.supervisor = validated.data.supervisor;
    user.kuerzel = validated.data.kuerzel;
    user.image = validated.data.image ?? "";

    db.tasks.forEach((task) => {
      if (task.employeeEmail === previousEmail) {
        task.employeeEmail = user.email;
        task.employeeName = user.fullName;
        task.abteilung = user.abteilung;
      } else if (task.employeeName === previousName) {
        task.employeeName = user.fullName;
      }
    });

    db.weekConfigs.forEach((config) => {
      if (config.email === previousEmail) {
        config.email = user.email;
      }
    });

    return { kind: "ok" as const, user: toPublicUser(user) };
  });

  if (result.kind === "unauthorized") {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  if (result.kind === "conflict") {
    return NextResponse.json({ message: "Diese E-Mail wird bereits verwendet." }, { status: 409 });
  }

  return NextResponse.json({ user: result.user });
}
