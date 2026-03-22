import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authCookieName } from "@/lib/auth";
import { getCurrentKW, getWeekRange } from "@/lib/date";
import { createWeeklyPdf } from "@/lib/pdf";
import { findSession, readDb, toPublicUser } from "@/lib/store";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const db = await readDb();
  const session = findSession(db, token);

  if (!session) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  const { start, end } = getWeekRange();
  const currentKw = getCurrentKW();

  const tasks = db.tasks.filter((task) => {
    if (task.employeeEmail !== user.email) {
      return false;
    }
    const value = new Date(task.datum);
    return value >= start && value <= end;
  });

  const config = db.weekConfigs.find((entry) => entry.email === user.email && entry.kw === currentKw) ?? null;
  const pdf = createWeeklyPdf(tasks, toPublicUser(user), config);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="wochenreport.pdf"',
    },
  });
}
