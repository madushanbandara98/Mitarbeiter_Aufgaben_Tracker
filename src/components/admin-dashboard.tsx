"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { formatDayLabel, toDateInputValue } from "@/lib/date";
import type { PublicUser, TaskRecord } from "@/lib/types";

type AdminDashboardProps = {
  admin: PublicUser;
  users: PublicUser[];
  tasks: TaskRecord[];
};

type CompanyDayPoint = {
  date: string;
  work: number;
  wait: number;
};

function formatHours(value: number) {
  return `${value.toFixed(2)} h`;
}

function formatMinutes(value: number) {
  return `${value} min`;
}

function formatAxisDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function buildChartPath(values: number[], width: number, height: number, maxValue: number) {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length === 1 ? 0 : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function AdminDashboard({ admin, users, tasks }: AdminDashboardProps) {
  const employees = useMemo(
    () =>
      users
        .filter((user) => user.userType !== "admin")
        .sort((left, right) => left.abteilung.localeCompare(right.abteilung) || left.fullName.localeCompare(right.fullName)),
    [users],
  );
  const [selectedUserId, setSelectedUserId] = useState(employees[0]?.id ?? 0);
  const selectedUser = employees.find((entry) => entry.id === selectedUserId) ?? employees[0] ?? null;

  const groupedEmployees = useMemo(() => {
    return employees.reduce<Record<string, PublicUser[]>>((accumulator, user) => {
      const department = user.abteilung || "Ohne Abteilung";
      if (!accumulator[department]) {
        accumulator[department] = [];
      }
      accumulator[department].push(user);
      return accumulator;
    }, {});
  }, [employees]);

  const selectedUserTasks = useMemo(
    () =>
      selectedUser
        ? tasks
            .filter((task) => task.employeeEmail === selectedUser.email)
            .sort((left, right) => right.datum.localeCompare(left.datum) || left.aufgabe.localeCompare(right.aufgabe))
        : [],
    [selectedUser, tasks],
  );

  const availableDates = useMemo(
    () => Array.from(new Set(selectedUserTasks.map((task) => task.datum))).sort((left, right) => right.localeCompare(left)),
    [selectedUserTasks],
  );

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] ?? toDateInputValue());
  const deferredDate = useDeferredValue(selectedDate);
  const today = toDateInputValue();
  const effectiveDate = deferredDate || availableDates[0] || today;
  const quickDateValue = availableDates.includes(effectiveDate) ? effectiveDate : "";

  const taskCountByEmail = useMemo(
    () =>
      tasks.reduce<Record<string, number>>((accumulator, task) => {
        accumulator[task.employeeEmail] = (accumulator[task.employeeEmail] ?? 0) + 1;
        return accumulator;
      }, {}),
    [tasks],
  );

  const companySeries = useMemo(() => {
    const grouped = tasks.reduce<Record<string, CompanyDayPoint>>((accumulator, task) => {
      if (!accumulator[task.datum]) {
        accumulator[task.datum] = { date: task.datum, work: 0, wait: 0 };
      }

      accumulator[task.datum].work += task.stundenProWoche;
      accumulator[task.datum].wait += task.wartezeit / 60;
      return accumulator;
    }, {});

    return Object.values(grouped).sort((left, right) => left.date.localeCompare(right.date));
  }, [tasks]);

  const chartPoints = companySeries.slice(-10);
  const chartMax = Math.max(8, ...chartPoints.flatMap((point) => [point.work, point.wait]));
  const chartWidth = 760;
  const chartHeight = 240;
  const workPath = buildChartPath(chartPoints.map((point) => point.work), chartWidth, chartHeight, chartMax);
  const waitPath = buildChartPath(chartPoints.map((point) => point.wait), chartWidth, chartHeight, chartMax);
  const chartStepX = chartPoints.length <= 1 ? 0 : chartWidth / (chartPoints.length - 1);
  const chartTicks = Array.from({ length: 5 }, (_, index) => {
    const value = (chartMax / 4) * (4 - index);
    const y = (chartHeight / 4) * index;
    return { value, y };
  });

  const todayTaskCount = tasks.filter((task) => task.datum === today).length;
  const activeDepartments = Object.keys(groupedEmployees).length;
  const selectedDayTasks = selectedUserTasks.filter((task) => task.datum === effectiveDate);
  const selectedDayHours = selectedDayTasks.reduce((sum, task) => sum + task.stundenProWoche, 0);
  const selectedDayWait = selectedDayTasks.reduce((sum, task) => sum + task.wartezeit, 0);
  const selectedWeekHours = selectedUserTasks.reduce((sum, task) => sum + task.stundenProWoche, 0);

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <section className="theme-panel rounded-[30px] p-4 lg:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.22fr_0.88fr]">
          <div
            className="overflow-hidden rounded-[28px] px-6 py-6 text-white shadow-[0_24px_60px_rgba(7,17,31,0.24)] lg:px-8 lg:py-7"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(34,211,238,0.28), transparent 28%), linear-gradient(135deg, #071422 0%, #10304f 58%, #184972 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Admin Leitstand</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-[2.7rem] lg:leading-[1.04]">
              Mitarbeiteruebersicht, Tagestrends und Detailpruefung an einem Ort.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72">
              Arbeits- und Wartezeiten im Unternehmen beobachten, Teams nach Abteilung gruppieren und die Tagesdaten jedes
              Mitarbeiters in einer klaren Admin-Ansicht pruefen.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Mitarbeiter", String(employees.length), "Erfasst ueber alle aktiven Abteilungen"],
                ["Tasks heute", String(todayTaskCount), "Aktuelle Tagesaktivitaet"],
                ["Abteilungen", String(activeDepartments), "Gruppierte Teamuebersicht"],
              ].map(([label, value, copy]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-white/12 px-4 py-4 backdrop-blur"
                  style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/45">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div
              className="rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(7,17,31,0.08)]"
              style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)", borderColor: "rgba(7,17,31,0.12)" }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Admin</p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{admin.fullName}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{admin.role}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Datum waehlen
                    </span>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="theme-input rounded-2xl px-4 py-3 text-sm"
                    />
                  </label>
                  <div className="inline-flex h-fit rounded-2xl bg-[color:var(--primary-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary-strong)]">
                    Live
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Ausgewaehlter Tag",
                  value: formatHours(selectedDayHours),
                  badge: "Blaue Zone",
                  style: {
                    background: "linear-gradient(180deg, rgba(39,147,255,0.12), rgba(255,255,255,0.96))",
                    borderColor: "rgba(39,147,255,0.16)",
                  },
                  badgeClass: "bg-[#2793ff] text-white",
                },
                {
                  label: "Wartezeit",
                  value: formatMinutes(selectedDayWait),
                  badge: "Rote Zone",
                  style: {
                    background: "linear-gradient(180deg, rgba(255,91,110,0.12), rgba(255,255,255,0.96))",
                    borderColor: "rgba(255,91,110,0.16)",
                  },
                  badgeClass: "bg-[#ff5b6e] text-white",
                },
              ].map((card) => (
                <article key={card.label} className="rounded-[24px] border p-4 shadow-[0_16px_36px_rgba(7,17,31,0.08)]" style={card.style}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{card.label}</p>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">{card.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[30px] p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="theme-kicker">Zeitreihe</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Arbeits- und Wartezeit im Unternehmen pro Tag</h3>
            <p className="theme-copy mt-2 text-sm leading-6">
              Vergleiche die blauen Arbeitsstunden mit den roten Wartezeiten fuer das gesamte Unternehmen pro Tag.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#1d6fe8] bg-[#2793ff] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(39,147,255,0.35)]">
              <span className="size-2 rounded-full bg-white" /> Arbeitsstunden
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#e44a5e] bg-[#ff5b6e] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(255,91,110,0.32)]">
              <span className="size-2 rounded-full bg-white" /> Wartezeit
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-[color:var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 sm:p-5">
          {chartPoints.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-[color:var(--muted)]">
              Noch keine unternehmensweiten Task-Daten vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth + 80} ${chartHeight + 56}`} className="min-w-[760px] w-full" role="img" aria-label="Diagramm der Unternehmensstunden">
                <g transform="translate(54 12)">
                  {chartTicks.map((tick) => (
                    <g key={tick.y}>
                      <line x1="0" y1={tick.y} x2={chartWidth} y2={tick.y} stroke="rgba(7,17,31,0.08)" strokeDasharray="4 6" />
                      <text x="-14" y={tick.y + 4} textAnchor="end" fontSize="11" fill="#7b8794">
                        {tick.value.toFixed(1)}h
                      </text>
                    </g>
                  ))}

                  <path d={waitPath} fill="none" stroke="#ff5b6e" strokeWidth="3" strokeLinecap="round" />
                  <path d={workPath} fill="none" stroke="#2793ff" strokeWidth="3" strokeLinecap="round" />

                  {chartPoints.map((point, index) => {
                    const x = index * chartStepX;
                    const workY = chartHeight - (point.work / chartMax) * chartHeight;
                    const waitY = chartHeight - (point.wait / chartMax) * chartHeight;

                    return (
                      <g key={point.date}>
                        <circle cx={x} cy={workY} r="4" fill="#2793ff" />
                        <circle cx={x} cy={waitY} r="4" fill="#ff5b6e" />
                        <text x={x} y={chartHeight + 24} textAnchor="middle" fontSize="11" fill="#7b8794">
                          {formatAxisDate(point.date)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1.45fr)_340px]">
        <aside className="theme-panel-dark rounded-[30px] p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Team</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Mitarbeiter nach Abteilung</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/72">
              {employees.length}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {employees.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/65">
                Noch keine Mitarbeiterkonten vorhanden.
              </div>
            ) : (
              Object.entries(groupedEmployees).map(([department, members]) => (
                <div key={department} className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3 px-2 pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/78">{department}</p>
                      <p className="mt-1 text-sm text-white/55">{members.length} Mitarbeiter</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {members.map((user) => {
                      const active = user.id === selectedUser?.id;
                      const totalTasks = taskCountByEmail[user.email] ?? 0;
                      const initials = user.fullName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            const nextDates = Array.from(
                              new Set(tasks.filter((task) => task.employeeEmail === user.email).map((task) => task.datum)),
                            ).sort((left, right) => right.localeCompare(left));
                            setSelectedDate(nextDates[0] ?? today);
                          }}
                          className={`w-full rounded-[20px] border px-3 py-3 text-left transition ${
                            active
                              ? "border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(59,130,246,0.22))]"
                              : "border-white/8 bg-black/10 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-white">
                              {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={user.fullName} src={user.image} className="size-full rounded-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-white">{user.fullName}</p>
                              <p className="truncate text-xs text-white/58">{user.role}</p>
                            </div>
                            <span className="text-xs text-white/58">{totalTasks}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="theme-panel rounded-[30px] p-5 lg:p-6">
          {selectedUser ? (
            <>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="theme-kicker">Tagesprotokoll</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight">{selectedUser.fullName}</h3>
                  <p className="theme-copy mt-2 text-sm leading-6">
                    Vollstaendiges Task-Protokoll fuer den gewaehlten Tag inklusive Bearbeitungszeit, Wartezeit, Output und Systemnutzung.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Schnellauswahl
                    </span>
                    <select
                      value={quickDateValue}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="theme-input rounded-2xl px-4 py-3 text-sm"
                    >
                      <option value="">Verfuegbare Daten</option>
                      {availableDates.length === 0 ? <option value={today}>Heute</option> : null}
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDayLabel(date)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--line)]">
                <div className="hidden grid-cols-[1.15fr_0.8fr_0.75fr_0.75fr_1fr_1fr] gap-4 bg-[color:var(--foreground)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/72 lg:grid">
                  <span>Aufgabe</span>
                  <span>Bereich</span>
                  <span>Kategorie</span>
                  <span>Dauer</span>
                  <span>Output</span>
                  <span>System</span>
                </div>

                <div className="bg-[color:var(--surface-strong)]">
                  {selectedDayTasks.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-[color:var(--muted)]">
                      Fuer diesen Tag wurden keine Eintraege erfasst.
                    </div>
                  ) : (
                    selectedDayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="grid gap-4 border-t border-[color:var(--line)] px-4 py-4 first:border-t-0 lg:grid-cols-[1.15fr_0.8fr_0.75fr_0.75fr_1fr_1fr]"
                      >
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">{task.aufgabe}</p>
                          <p className="mt-1 text-xs text-[color:var(--muted)]">{task.kommentar || "Kein zusaetzlicher Kommentar"}</p>
                        </div>
                        <div className="text-sm text-[color:var(--muted)]">{task.aufgabenbereich}</div>
                        <div className="text-sm text-[color:var(--muted)]">{task.kategorie}</div>
                        <div>
                          <p className="text-sm font-medium text-[color:var(--foreground)]">{formatMinutes(task.dauerMinuten)}</p>
                          <p className="mt-1 text-xs text-[color:var(--muted)]">Wartezeit {formatMinutes(task.wartezeit)}</p>
                        </div>
                        <div className="text-sm text-[color:var(--muted)]">{task.output || "Nicht angegeben"}</div>
                        <div className="text-sm text-[color:var(--muted)]">{task.systemTool || "Nicht angegeben"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-[color:var(--muted)]">Keine Mitarbeiter auswaehlbar.</div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="theme-panel rounded-[30px] p-5 lg:p-6">
            <p className="theme-kicker">Tageszusammenfassung</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Profil des ausgewaehlten Benutzers</h3>

            <div className="mt-5 flex items-center justify-center">
              <div className="relative flex size-40 items-center justify-center rounded-full border-[12px] border-dashed border-[color:var(--primary-soft)] bg-[radial-gradient(circle_at_top,#ffffff,#eef5ff)]">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-[color:var(--foreground)]">{selectedDayTasks.length}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Tasks</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Arbeitszeit am ausgewaehlten Tag", formatHours(selectedDayHours)],
                ["Wartezeit", formatMinutes(selectedDayWait)],
                ["Gesamt erfasster Umfang", formatHours(selectedWeekHours)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-muted)] px-4 py-3">
                  <span className="text-sm text-[color:var(--muted)]">{label}</span>
                  <span className="text-sm font-semibold text-[color:var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="theme-panel rounded-[30px] p-5 lg:p-6">
            <p className="theme-kicker">Heute</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Aktivste Mitarbeiter</h3>

            <div className="mt-5 space-y-3">
              {employees.slice(0, 4).map((user) => {
                const userTodayTasks = tasks.filter((task) => task.employeeEmail === user.email && task.datum === today);
                const hours = userTodayTasks.reduce((sum, task) => sum + task.stundenProWoche, 0);

                return (
                  <div key={user.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--line)] px-4 py-4">
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">{user.fullName}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {userTodayTasks.length === 0 ? "Keine Eintraege heute" : `${userTodayTasks.length} Tasks heute`}
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--primary-strong)]">
                      {formatHours(hours)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
