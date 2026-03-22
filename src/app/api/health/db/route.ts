import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getMongoDb();
    const ping = await db.admin().ping();
    return NextResponse.json({ ok: true, database: db.databaseName, ping });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

