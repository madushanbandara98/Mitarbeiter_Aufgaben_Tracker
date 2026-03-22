import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findSession, readDb, toPublicUser } from "@/lib/store";

const sessionCookie = "tracker_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const db = await readDb();
  const session = findSession(db, token);

  if (!session) {
    return null;
  }

  const user = db.users.find((entry) => entry.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.userType !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

export function isAdminUser(user: { userType: string }) {
  return user.userType === "admin";
}

export const authCookieName = sessionCookie;
