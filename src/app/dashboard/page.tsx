import Link from "next/link";

import { AdminDashboard } from "@/components/admin-dashboard";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { formatDayLabel } from "@/lib/date";
import { readDb, toPublicUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await readDb();

  if (user.userType === "admin") {
    return (
      <AppShell user={user}>
        <AdminDashboard admin={user} users={db.users.map((entry) => toPublicUser(entry))} tasks={db.tasks} />
      </AppShell>
    );
  }

  const tasks = db.tasks
    .filter((task) => task.employeeEmail === user.email)
    .sort((left, right) => left.datum.localeCompare(right.datum));

  const totalHours = tasks.reduce((sum, task) => sum + task.stundenProWoche, 0);
  const totalWaitingHours = tasks.reduce((sum, task) => sum + task.wartezeit / 60, 0);

  const grouped = tasks.reduce<Record<string, { work: number; wait: number }>>((accumulator, task) => {
    if (!accumulator[task.datum]) {
      accumulator[task.datum] = { work: 0, wait: 0 };
    }
    accumulator[task.datum].work += task.stundenProWoche;
    accumulator[task.datum].wait += task.wartezeit / 60;
    return accumulator;
  }, {});

  const chartRows = Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right));
  const maxValue = chartRows.reduce((max, [, values]) => Math.max(max, values.work + values.wait), 8);

  const strongestDay = chartRows
    .map(([date, values]) => ({ date, total: values.work + values.wait }))
    .sort((left, right) => right.total - left.total)[0];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <section className="theme-panel rounded-[34px] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="theme-kicker">Dashboard</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">Arbeitslast auf einen Blick</h2>
              <p className="theme-copy mt-3 max-w-3xl text-sm leading-6">
                Tageswerte, Wochenlast und Wartezeiten werden in einem ruhigeren Farbsystem dargestellt, damit die Zahlen
                schneller lesbar bleiben und die Ansicht weniger visuell driftet.
              </p>
            </div>
            <Link href="/tasks" className="theme-button-primary inline-flex rounded-2xl px-5 py-3 text-sm font-semibold">
              Aufgaben verwalten
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              { label: "Erfasste Aufgaben", value: String(tasks.length), accent: "bg-[color:var(--primary)]" },
              { label: "Gesamtstunden", value: `${totalHours.toFixed(2)} h`, accent: "bg-[color:var(--accent)]" },
              { label: "Wartezeit", value: `${totalWaitingHours.toFixed(2)} h`, accent: "bg-black" },
            ].map((card) => (
              <article key={card.label} className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-5">
                <div className={`h-2 w-20 rounded-full ${card.accent}`} />
                <p className="mt-5 text-sm text-[color:var(--muted)]">{card.label}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{card.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="theme-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="theme-kicker">Zeitverlauf</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Arbeits- und Wartezeit je Tag</h3>
              </div>
              <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">{tasks.length} Tasks</span>
            </div>

            <div className="mt-8 space-y-5">
              {chartRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--line-strong)] px-4 py-10 text-center text-sm text-[color:var(--muted)]">
                  Noch keine Daten vorhanden. Aufgaben auf der Aufgaben-Seite anlegen, dann erscheint hier die Tagesauswertung.
                </div>
              ) : (
                chartRows.map(([date, values]) => {
                  const workPercent = (values.work / maxValue) * 100;
                  const waitPercent = (values.wait / maxValue) * 100;

                  return (
                    <div key={date} className="grid gap-3 md:grid-cols-[160px_1fr_80px] md:items-center">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">{formatDayLabel(date)}</p>
                      <div className="overflow-hidden rounded-full bg-[color:var(--primary-soft)]">
                        <div className="flex h-5">
                          <div className="bg-[color:var(--primary)]" style={{ width: `${workPercent}%` }} />
                          <div className="bg-[color:var(--accent)]" style={{ width: `${waitPercent}%` }} />
                        </div>
                      </div>
                      <p className="text-right text-sm text-[color:var(--muted)]">{(values.work + values.wait).toFixed(2)} h</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <aside className="theme-panel-dark rounded-[30px] p-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">Focus</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Was faellt auf?</h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/65">Stark belegter Tag</p>
                <p className="mt-2 text-lg font-semibold">{strongestDay ? formatDayLabel(strongestDay.date) : "Noch offen"}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/65">Aktueller Zustand</p>
                <p className="mt-2 text-lg font-semibold">
                  {tasks.length === 0 ? "Keine Aufgaben" : totalHours > 40 ? "Hohe Wochenlast" : "Stabile Auslastung"}
                </p>
                <p className="mt-1 text-sm text-white/45">
                  {tasks.length === 0
                    ? "Zuerst Aufgaben anlegen."
                    : "Die Kennzahl basiert auf den dokumentierten Stunden pro Woche."}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
