import { AdminConsole } from "@/components/admin-console";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { readDb, toPublicUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const db = await readDb();
  const users = db.users.map((entry) => toPublicUser(entry)).sort((left, right) => left.fullName.localeCompare(right.fullName));
  const taskCountByEmail = Object.fromEntries(
    users.map((entry) => [entry.email, db.tasks.filter((task) => task.employeeEmail === entry.email).length]),
  );

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <section className="theme-panel rounded-[34px] p-8">
          <p className="theme-kicker">Admin Console</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Zentrale Steuerung fuer Benutzer und Aufgaben</h1>
          <p className="theme-copy mt-3 max-w-4xl text-sm leading-6">
            Diese Ansicht ist nur fuer Admin-Benutzer sichtbar. Hier koennen Benutzerprofile, der Benutzertyp und die globale Aufgabenlage fuer das gesamte System gepflegt werden.
          </p>
        </section>

        <AdminConsole users={users} taskCountByEmail={taskCountByEmail} />
      </div>
    </AppShell>
  );
}

