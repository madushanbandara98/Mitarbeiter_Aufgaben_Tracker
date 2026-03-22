"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PublicUser, UserType } from "@/lib/types";

type AdminConsoleProps = {
  users: PublicUser[];
  taskCountByEmail: Record<string, number>;
};

type EditableUser = {
  id: number;
  fullName: string;
  email: string;
  abteilung: string;
  role: string;
  supervisor: string;
  kuerzel: string;
  image: string;
  userType: UserType;
};

function toEditableUser(user: PublicUser): EditableUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    abteilung: user.abteilung,
    role: user.role,
    supervisor: user.supervisor,
    kuerzel: user.kuerzel,
    image: user.image ?? "",
    userType: user.userType,
  };
}

export function AdminConsole({ users, taskCountByEmail }: AdminConsoleProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? 0);
  const [drafts, setDrafts] = useState<Record<number, EditableUser>>(
    Object.fromEntries(users.map((user) => [user.id, toEditableUser(user)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedUser = drafts[selectedUserId];

  async function saveUser() {
    if (!selectedUser) {
      return;
    }

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedUser),
    });

    const payload = (await response.json()) as {
      errors?: Record<string, string>;
      message?: string;
    };

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      setMessage(payload.message ?? "Benutzer konnte nicht gespeichert werden.");
      return;
    }

    setErrors({});
    setMessage("Benutzer aktualisiert.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="theme-panel rounded-[30px] p-6">
        <p className="theme-kicker">User Directory</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Alle Benutzer auf einen Blick</h2>
        <p className="theme-copy mt-3 text-sm leading-6">
          Admin-Benutzer koennen Profile, Rollen und den Benutzertyp zentral pflegen. Admin-Konten muessen weiterhin manuell in der Datenbank angelegt werden.
        </p>

        <div className="mt-6 space-y-3">
          {users.map((entry) => {
            const active = entry.id === selectedUserId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedUserId(entry.id);
                  setErrors({});
                  setMessage("");
                }}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-[color:var(--primary)] bg-[color:var(--primary-soft)]"
                    : "border-[color:var(--line)] bg-[color:var(--surface-strong)] hover:bg-[color:var(--surface-muted)]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{entry.fullName}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{entry.email}</p>
                  </div>
                  <span className="theme-pill rounded-full px-3 py-1 text-xs font-medium">
                    {entry.userType === "admin" ? "Admin" : "Normal"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                  <span>{entry.abteilung}</span>
                  <span>{taskCountByEmail[entry.email] ?? 0} Tasks</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="theme-panel rounded-[30px] p-6 lg:p-8">
        {selectedUser ? (
          <>
            <p className="theme-kicker">Admin Editor</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{selectedUser.fullName}</h2>
            <p className="theme-copy mt-3 text-sm leading-6">
              Aenderungen werden direkt auf Aufgaben und Wochenkonfigurationen des gewaehlten Benutzers uebertragen.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["fullName", "Vollstaendiger Name"],
                ["email", "E-Mail"],
                ["abteilung", "Abteilung"],
                ["role", "Rolle / Funktion"],
                ["supervisor", "Vorgesetzte Person"],
                ["kuerzel", "Kuerzel"],
                ["image", "Bild-URL / Data URI"],
              ].map(([field, label]) => (
                <label key={field} className={field === "image" ? "md:col-span-2 xl:col-span-3" : ""}>
                  <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">{label}</span>
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={selectedUser[field as keyof EditableUser] as string}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [selectedUser.id]: {
                          ...current[selectedUser.id],
                          [field]: event.target.value,
                        },
                      }))
                    }
                    className={`theme-input rounded-2xl px-4 py-3 text-sm ${errors[field] ? "theme-input-error" : ""}`}
                  />
                  {errors[field] ? <span className="mt-2 block text-xs text-red-600">{errors[field]}</span> : null}
                </label>
              ))}

              <label>
                <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">Benutzertyp</span>
                <select
                  value={selectedUser.userType}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [selectedUser.id]: {
                        ...current[selectedUser.id],
                        userType: event.target.value as UserType,
                      },
                    }))
                  }
                  className={`theme-input rounded-2xl px-4 py-3 text-sm ${errors.userType ? "theme-input-error" : ""}`}
                >
                  <option value="normal">Normal User</option>
                  <option value="admin">Admin User</option>
                </select>
                {errors.userType ? <span className="mt-2 block text-xs text-red-600">{errors.userType}</span> : null}
              </label>
            </div>

            {message ? <div className="theme-message theme-message-success mt-6 rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveUser}
                disabled={pending}
                className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Speichert..." : "Benutzer speichern"}
              </button>
              <div className="theme-pill rounded-full px-4 py-2 text-sm font-medium">
                {taskCountByEmail[selectedUser.email] ?? 0} zugeordnete Aufgaben
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">Keine Benutzer vorhanden.</div>
        )}
      </section>
    </div>
  );
}
