"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatDayLabel } from "@/lib/date";
import type { PublicUser, TaskRecord, UserType, WeekConfigRecord } from "@/lib/types";

type UserOption = {
  id: number;
  email: string;
  fullName: string;
  abteilung: string;
  userType: UserType;
};

type TasksWorkspaceProps = {
  user: PublicUser;
  initialTasks: TaskRecord[];
  initialWeekConfig: WeekConfigRecord | null;
  currentKw: number;
  availableUsers: UserOption[];
};

type TaskFormState = {
  employeeEmail: string;
  aufgabenbereich: string;
  aufgabe: string;
  kategorie: string;
  haufigkeit: string;
  einheit: string;
  dauerMinuten: string;
  wartezeit: string;
  output: string;
  systemTool: string;
  abhaengigkeit: string;
  mussSein: string;
  vaNva: string;
  verbesserungsidee: string;
  kommentar: string;
  datum: string;
};

const taskFields = [
  ["aufgabenbereich", "Aufgabenbereich"],
  ["aufgabe", "Aufgabe"],
  ["kategorie", "Kategorie"],
  ["haufigkeit", "Haeufigkeit"],
  ["einheit", "Einheit"],
  ["dauerMinuten", "Minuten pro Durchfuehrung"],
  ["wartezeit", "Wartezeit in Minuten"],
  ["output", "Output"],
  ["systemTool", "System oder Tool"],
  ["abhaengigkeit", "Abhaengigkeit"],
  ["mussSein", "Muss sein?"],
  ["vaNva", "VA oder NVA"],
  ["verbesserungsidee", "Verbesserungsidee"],
  ["kommentar", "Kommentar"],
] as const;

export function TasksWorkspace({
  user,
  initialTasks,
  initialWeekConfig,
  currentKw,
  availableUsers,
}: TasksWorkspaceProps) {
  const router = useRouter();
  const isAdmin = user.userType === "admin";
  const defaultOwnerEmail = isAdmin ? availableUsers.find((entry) => entry.userType !== "admin")?.email ?? user.email : user.email;

  const createEmptyTaskForm = () => ({
    employeeEmail: defaultOwnerEmail,
    aufgabenbereich: "",
    aufgabe: "",
    kategorie: "",
    haufigkeit: "1",
    einheit: "pro Tag",
    dauerMinuten: "30",
    wartezeit: "0",
    output: "",
    systemTool: "",
    abhaengigkeit: "",
    mussSein: "",
    vaNva: "",
    verbesserungsidee: "",
    kommentar: "",
    datum: new Date().toISOString().split("T")[0],
  });

  const [tasks, setTasks] = useState(initialTasks);
  const [weekConfig, setWeekConfig] = useState({
    arbeitszeit: String(initialWeekConfig?.arbeitszeit ?? 40),
    arbeitsort: initialWeekConfig?.arbeitsort ?? "Buerostandort",
    schicht: initialWeekConfig?.schicht ?? "Tagschicht",
  });
  const [taskForm, setTaskForm] = useState<TaskFormState>(createEmptyTaskForm());
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
  const [weekErrors, setWeekErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scope, setScope] = useState<"current" | "all">("current");
  const [ownerFilter, setOwnerFilter] = useState<string>(isAdmin ? "all" : user.email);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredTasks = useMemo(() => {
    if (!isAdmin || ownerFilter === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.employeeEmail === ownerFilter);
  }, [isAdmin, ownerFilter, tasks]);

  const visibleTasks = useMemo(() => {
    if (scope === "all") {
      return filteredTasks;
    }

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return filteredTasks.filter((task) => {
      const value = new Date(task.datum);
      return value >= start && value <= end;
    });
  }, [filteredTasks, scope]);

  const groupedTasks = useMemo(() => {
    return visibleTasks.reduce<Record<string, TaskRecord[]>>((groups, task) => {
      if (!groups[task.datum]) {
        groups[task.datum] = [];
      }
      groups[task.datum].push(task);
      return groups;
    }, {});
  }, [visibleTasks]);

  async function saveWeekConfig() {
    const response = await fetch("/api/week-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...weekConfig, kw: currentKw }),
    });
    const payload = (await response.json()) as { errors?: Record<string, string>; message?: string };

    if (!response.ok) {
      setWeekErrors(payload.errors ?? {});
      setBanner(payload.message ?? "Wocheneinstellungen konnten nicht gespeichert werden.");
      return;
    }

    setWeekErrors({});
    setBanner("Wocheneinstellungen gespeichert.");
    startTransition(() => router.refresh());
  }

  async function submitTask() {
    const endpoint = editingId === null ? "/api/tasks" : `/api/tasks/${editingId}`;
    const method = editingId === null ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskForm),
    });
    const payload = (await response.json()) as { errors?: Record<string, string>; task?: TaskRecord; message?: string };

    if (!response.ok) {
      setTaskErrors(payload.errors ?? {});
      setBanner(payload.message ?? "Aufgabe konnte nicht gespeichert werden.");
      return;
    }

    setTaskErrors({});
    if (payload.task) {
      setTasks((current) =>
        editingId === null
          ? [payload.task!, ...current]
          : current.map((task) => (task.id === payload.task!.id ? payload.task! : task)),
      );
    }
    setTaskForm(createEmptyTaskForm());
    setEditingId(null);
    setBanner(editingId === null ? "Aufgabe gespeichert." : "Aufgabe aktualisiert.");
    startTransition(() => router.refresh());
  }

  async function deleteTask(id: number) {
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setBanner("Aufgabe konnte nicht geloescht werden.");
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) {
      setTaskForm(createEmptyTaskForm());
      setEditingId(null);
    }
    setBanner("Aufgabe geloescht.");
    startTransition(() => router.refresh());
  }

  function startEdit(task: TaskRecord) {
    setEditingId(task.id);
    setTaskErrors({});
    setTaskForm({
      employeeEmail: task.employeeEmail,
      aufgabenbereich: task.aufgabenbereich,
      aufgabe: task.aufgabe,
      kategorie: task.kategorie,
      haufigkeit: String(task.haufigkeit),
      einheit: task.einheit,
      dauerMinuten: String(task.dauerMinuten),
      wartezeit: String(task.wartezeit),
      output: task.output,
      systemTool: task.systemTool,
      abhaengigkeit: task.abhaengigkeit,
      mussSein: task.mussSein,
      vaNva: task.vaNva,
      verbesserungsidee: task.verbesserungsidee,
      kommentar: task.kommentar,
      datum: task.datum,
    });
  }

  return (
    <div className="space-y-6">
      <header className="theme-panel rounded-[30px] p-6 lg:p-8">
        <p className="theme-kicker">Execution Board</p>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{isAdmin ? "Aufgaben fuer alle Teams verwalten" : "Aufgaben sauber erfassen und auswerten"}</h2>
            <p className="theme-copy mt-2 max-w-4xl text-sm leading-6">
              {isAdmin
                ? "Admin-Benutzer sehen alle Aufgaben, koennen Eintraege auf beliebige Benutzer umhaengen, filtern und zentral verwalten."
                : "Wochenkontext festlegen, Aufgaben dokumentieren, direkt bearbeiten und den aktuellen Stand als PDF exportieren."}
            </p>
          </div>
          <a href="/api/reports/current-week" className="theme-button-primary inline-flex rounded-2xl px-5 py-3 text-sm font-semibold">
            Wochenreport als PDF
          </a>
        </div>
      </header>

      {banner ? <div className="theme-message theme-message-success rounded-2xl px-4 py-3 text-sm">{banner}</div> : null}

      <section className="grid gap-6 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="theme-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="theme-kicker">KW {currentKw}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Wocheneinstellungen</h3>
            </div>
            <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">{user.abteilung}</span>
          </div>

          <div className="mt-6 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-medium">Arbeitszeit in Stunden</span>
              <input type="number" min="1" max="80" value={weekConfig.arbeitszeit} onChange={(event) => setWeekConfig((current) => ({ ...current, arbeitszeit: event.target.value }))} className={`theme-input rounded-2xl px-4 py-3 text-sm ${weekErrors.arbeitszeit ? "theme-input-error" : ""}`} />
              {weekErrors.arbeitszeit ? <span className="mt-2 block text-xs text-red-600">{weekErrors.arbeitszeit}</span> : null}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium">Arbeitsort</span>
              <input value={weekConfig.arbeitsort} onChange={(event) => setWeekConfig((current) => ({ ...current, arbeitsort: event.target.value }))} className={`theme-input rounded-2xl px-4 py-3 text-sm ${weekErrors.arbeitsort ? "theme-input-error" : ""}`} />
              {weekErrors.arbeitsort ? <span className="mt-2 block text-xs text-red-600">{weekErrors.arbeitsort}</span> : null}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium">Schicht</span>
              <input value={weekConfig.schicht} onChange={(event) => setWeekConfig((current) => ({ ...current, schicht: event.target.value }))} className={`theme-input rounded-2xl px-4 py-3 text-sm ${weekErrors.schicht ? "theme-input-error" : ""}`} />
              {weekErrors.schicht ? <span className="mt-2 block text-xs text-red-600">{weekErrors.schicht}</span> : null}
            </label>

            <button type="button" onClick={saveWeekConfig} disabled={pending} className="theme-button-accent rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              Einstellungen speichern
            </button>
          </div>
        </div>

        <div className="theme-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-kicker">Task Input</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{editingId === null ? "Neue Aufgabe anlegen" : "Aufgabe bearbeiten"}</h3>
            </div>
            {editingId !== null ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTaskForm(createEmptyTaskForm());
                  setTaskErrors({});
                }}
                className="theme-button-secondary rounded-full px-3 py-1 text-xs font-medium"
              >
                Abbrechen
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isAdmin ? (
              <label>
                <span className="mb-2 block text-sm font-medium">Benutzer</span>
                <select
                  value={taskForm.employeeEmail}
                  onChange={(event) => setTaskForm((current) => ({ ...current, employeeEmail: event.target.value }))}
                  className={`theme-input rounded-2xl px-4 py-3 text-sm ${taskErrors.employeeEmail ? "theme-input-error" : ""}`}
                >
                  {availableUsers.map((entry) => (
                    <option key={entry.id} value={entry.email}>
                      {entry.fullName} ({entry.email})
                    </option>
                  ))}
                </select>
                {taskErrors.employeeEmail ? <span className="mt-2 block text-xs text-red-600">{taskErrors.employeeEmail}</span> : null}
              </label>
            ) : null}

            {taskFields.map(([name, label]) => (
              <label key={name}>
                <span className="mb-2 block text-sm font-medium">{label}</span>
                <input
                  type={name === "haufigkeit" || name === "dauerMinuten" || name === "wartezeit" ? "number" : "text"}
                  min={name === "wartezeit" ? 0 : name === "haufigkeit" || name === "dauerMinuten" ? 1 : undefined}
                  value={taskForm[name]}
                  onChange={(event) => setTaskForm((current) => ({ ...current, [name]: event.target.value }))}
                  className={`theme-input rounded-2xl px-4 py-3 text-sm ${taskErrors[name] ? "theme-input-error" : ""}`}
                />
                {taskErrors[name] ? <span className="mt-2 block text-xs text-red-600">{taskErrors[name]}</span> : null}
              </label>
            ))}

            <label>
              <span className="mb-2 block text-sm font-medium">Datum</span>
              <input
                type="date"
                value={taskForm.datum}
                onChange={(event) => setTaskForm((current) => ({ ...current, datum: event.target.value }))}
                className={`theme-input rounded-2xl px-4 py-3 text-sm ${taskErrors.datum ? "theme-input-error" : ""}`}
              />
              {taskErrors.datum ? <span className="mt-2 block text-xs text-red-600">{taskErrors.datum}</span> : null}
            </label>
          </div>

          <button type="button" onClick={submitTask} disabled={pending} className="theme-button-primary mt-6 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
            {editingId === null ? "Aufgabe speichern" : "Aufgabe aktualisieren"}
          </button>
        </div>
      </section>

      <section className="theme-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="theme-kicker">Task Log</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Erfasste Aufgaben</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAdmin ? (
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="theme-input rounded-full px-4 py-2 text-sm">
                <option value="all">Alle Benutzer</option>
                {availableUsers.map((entry) => (
                  <option key={entry.id} value={entry.email}>
                    {entry.fullName}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex gap-3">
              <button type="button" onClick={() => setScope("current")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${scope === "current" ? "theme-button-primary" : "theme-button-secondary"}`}>
                Aktuelle Woche
              </button>
              <button type="button" onClick={() => setScope("all")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${scope === "all" ? "theme-button-primary" : "theme-button-secondary"}`}>
                Alle Aufgaben
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--line)]">
          <div className={`hidden gap-4 bg-[color:var(--foreground)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/72 md:grid ${isAdmin ? "md:grid-cols-[1.2fr_1.1fr_0.8fr_0.7fr_0.8fr_0.9fr_1fr]" : "md:grid-cols-[1.7fr_0.8fr_0.7fr_0.8fr_0.9fr_1fr]"}`}>
            {isAdmin ? <span>Benutzer</span> : null}
            <span>Aufgabe</span>
            <span>Kategorie</span>
            <span>Haeufigkeit</span>
            <span>Minuten</span>
            <span>Std / Woche</span>
            <span>Aktionen</span>
          </div>

          <div className="bg-[color:var(--surface-strong)]">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[color:var(--muted)]">Noch keine Aufgaben in dieser Auswahl vorhanden.</div>
            ) : (
              Object.entries(groupedTasks).sort(([left], [right]) => right.localeCompare(left)).map(([date, entries]) => {
                const total = entries.reduce((sum, task) => sum + task.stundenProWoche, 0);
                const overbooked = total > 8;
                const exact = Math.abs(total - 8) < 0.001;
                const expanded = expandedDates[date] ?? true;

                return (
                  <div key={date} className="border-t border-[color:var(--line)] first:border-t-0">
                    <button
                      type="button"
                      onClick={() => setExpandedDates((current) => ({ ...current, [date]: !expanded }))}
                      className={`flex w-full items-center justify-between px-4 py-4 text-left ${
                        overbooked
                          ? "bg-[color:var(--danger-soft)] text-red-900"
                          : exact
                            ? "bg-[color:var(--accent-soft)] text-green-900"
                            : "bg-[color:var(--surface-muted)] text-[color:var(--foreground)]"
                      }`}
                    >
                      <span className="font-semibold">{formatDayLabel(date)}</span>
                      <span className="text-sm">{total.toFixed(2)} h</span>
                    </button>

                    {expanded ? (
                      <div>
                        {entries.map((task) => (
                          <div key={task.id} className={`grid gap-3 border-t border-[color:var(--line)] px-4 py-4 md:items-center ${isAdmin ? "md:grid-cols-[1.2fr_1.1fr_0.8fr_0.7fr_0.8fr_0.9fr_1fr]" : "md:grid-cols-[1.7fr_0.8fr_0.7fr_0.8fr_0.9fr_1fr]"}`}>
                            {isAdmin ? (
                              <div>
                                <p className="font-medium text-[color:var(--foreground)]">{task.employeeName}</p>
                                <p className="mt-1 text-xs text-[color:var(--muted)]">{task.employeeEmail}</p>
                              </div>
                            ) : null}
                            <div>
                              <p className="font-medium text-[color:var(--foreground)]">{task.aufgabe}</p>
                              <p className="mt-1 text-xs text-[color:var(--muted)]">{task.aufgabenbereich}</p>
                            </div>
                            <span className="text-sm text-[color:var(--muted)]">{task.kategorie}</span>
                            <span className="text-sm text-[color:var(--muted)]">{task.haufigkeit}</span>
                            <span className="text-sm text-[color:var(--muted)]">{task.dauerMinuten}</span>
                            <span className="text-sm font-medium text-[color:var(--foreground)]">{task.stundenProWoche.toFixed(2)}</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => startEdit(task)} className="theme-button-secondary rounded-full px-3 py-2 text-xs font-semibold">
                                Bearbeiten
                              </button>
                              <button type="button" onClick={() => deleteTask(task.id)} className="theme-button-danger rounded-full px-3 py-2 text-xs font-semibold">
                                Loeschen
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
