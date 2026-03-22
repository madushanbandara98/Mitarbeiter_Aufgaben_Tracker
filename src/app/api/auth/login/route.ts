import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";
import { toPublicUser, updateDb } from "@/lib/store";
import { validateLogin } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateLogin(payload);

  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.errors, message: "Bitte eine gueltige E-Mail und ein Passwort eingeben." },
      { status: 400 },
    );
  }

  const result = await updateDb((db) => {
    const user = db.users.find((entry) => entry.email === validated.data.email);
    if (!user || !verifyPassword(validated.data.password, user.password)) {
      return null;
    }

    if (!isPasswordHash(user.password)) {
      user.password = hashPassword(validated.data.password);
    }

    const token = randomUUID();
    db.sessions = db.sessions.filter((session) => session.userId !== user.id);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });

    const publicUser = toPublicUser(user);
    return {
      user: publicUser,
      token,
      redirectTo: publicUser.userType === "admin" ? "/admin" : "/dashboard",
    };
  });

  if (!result) {
    return NextResponse.json({ message: "Ungueltige Zugangsdaten." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  return NextResponse.json({ user: result.user, redirectTo: result.redirectTo });
}
