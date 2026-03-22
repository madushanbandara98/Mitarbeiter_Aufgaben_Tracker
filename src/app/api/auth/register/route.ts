import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { toPublicUser, updateDb } from "@/lib/store";
import { validateRegister } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateRegister(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Bitte die markierten Felder korrigieren." },
      { status: 400 },
    );
  }

  const user = await updateDb((db) => {
    const exists = db.users.some((entry) => entry.email === validated.data.email);
    if (exists) {
      return null;
    }

    const newUser = {
      id: db.nextIds.users++,
      ...validated.data,
      userType: "normal" as const,
      password: hashPassword(validated.data.password),
      image: "",
    };

    db.users.push(newUser);
    const token = randomUUID();
    db.sessions.push({ token, userId: newUser.id, createdAt: new Date().toISOString() });

    return { user: toPublicUser(newUser), token, redirectTo: "/dashboard" };
  });

  if (!user) {
    return NextResponse.json({ message: "Diese E-Mail ist bereits registriert." }, { status: 409 });
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, user.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  return NextResponse.json({ user: user.user, redirectTo: user.redirectTo }, { status: 201 });
}
