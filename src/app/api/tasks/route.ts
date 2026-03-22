import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { findSession, sanitizeTask, updateDb } from "@/lib/store";
import { validateTask } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateTask(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Bitte die markierten Aufgabenfelder korrigieren." },
      { status: 400 },
    );
  }

  const task = await updateDb((db) => {
    const session = findSession(db, token);
    if (!session) {
      return null;
    }

    const currentUser = db.users.find((entry) => entry.id === session.userId);
    if (!currentUser) {
      return null;
    }

    const owner = currentUser.userType === "admin" && validated.data.employeeEmail
      ? db.users.find((entry) => entry.email === validated.data.employeeEmail)
      : currentUser;

    if (!owner) {
      return undefined;
    }

    const gesamtMinuten = validated.data.haufigkeit * validated.data.dauerMinuten;
    const taskData = { ...validated.data };
    delete taskData.employeeEmail;

    const newTask = {
      id: db.nextIds.tasks++,
      employeeName: owner.fullName,
      employeeEmail: owner.email,
      abteilung: owner.abteilung,
      ...taskData,
      gesamtMinuten,
      stundenProWoche: Number((gesamtMinuten / 60).toFixed(2)),
    };

    db.tasks.push(newTask);
    return sanitizeTask(newTask);
  });

  if (task === null) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  if (task === undefined) {
    return NextResponse.json({ message: "Zielbenutzer wurde nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ task }, { status: 201 });
}

