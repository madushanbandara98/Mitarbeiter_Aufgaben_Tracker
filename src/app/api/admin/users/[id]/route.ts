import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { findSession, toPublicUser, updateDb } from "@/lib/store";
import { validateAdminUser } from "@/lib/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const { id } = await context.params;
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateAdminUser(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Bitte die markierten Benutzerfelder korrigieren." },
      { status: 400 },
    );
  }

  const result = await updateDb((db) => {
    const session = findSession(db, token);
    if (!session) {
      return { kind: "unauthorized" as const };
    }

    const admin = db.users.find((entry) => entry.id === session.userId);
    if (!admin || admin.userType !== "admin") {
      return { kind: "unauthorized" as const };
    }

    const target = db.users.find((entry) => entry.id === Number(id));
    if (!target) {
      return { kind: "not_found" as const };
    }

    const emailTaken = db.users.some((entry) => entry.email === validated.data.email && entry.id !== target.id);
    if (emailTaken) {
      return { kind: "conflict" as const };
    }

    const previousEmail = target.email;
    const previousName = target.fullName;

    target.fullName = validated.data.fullName;
    target.email = validated.data.email;
    target.abteilung = validated.data.abteilung;
    target.role = validated.data.role;
    target.supervisor = validated.data.supervisor;
    target.kuerzel = validated.data.kuerzel;
    target.image = validated.data.image ?? "";
    target.userType = validated.data.userType;

    db.tasks.forEach((task) => {
      if (task.employeeEmail === previousEmail) {
        task.employeeEmail = target.email;
        task.employeeName = target.fullName;
        task.abteilung = target.abteilung;
      } else if (task.employeeName === previousName) {
        task.employeeName = target.fullName;
      }
    });

    db.weekConfigs.forEach((config) => {
      if (config.email === previousEmail) {
        config.email = target.email;
      }
    });

    return { kind: "ok" as const, user: toPublicUser(target) };
  });

  if (result.kind === "unauthorized") {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  if (result.kind === "not_found") {
    return NextResponse.json({ message: "Benutzer nicht gefunden." }, { status: 404 });
  }

  if (result.kind === "conflict") {
    return NextResponse.json({ message: "Diese E-Mail wird bereits verwendet." }, { status: 409 });
  }

  return NextResponse.json({ user: result.user });
}
