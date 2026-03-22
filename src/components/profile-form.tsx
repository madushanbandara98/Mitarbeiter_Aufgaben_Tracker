"use client";

import { ChangeEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PublicUser } from "@/lib/types";

type ProfileFormProps = {
  user: PublicUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    fullName: user.fullName,
    email: user.email,
    abteilung: user.abteilung,
    role: user.role,
    supervisor: user.supervisor,
    kuerzel: user.kuerzel,
    image: user.image ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setValues((current) => ({
        ...current,
        image: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as {
      errors?: Record<string, string>;
      message?: string;
    };

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      setMessage(payload.message ?? "Profil konnte nicht gespeichert werden.");
      return;
    }

    setErrors({});
    setMessage("Profil aktualisiert.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="theme-panel mx-auto max-w-3xl rounded-[32px] p-8">
      <p className="theme-kicker">Profile Studio</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Persoenliche Angaben verwalten</h2>
      <p className="theme-copy mt-3 max-w-2xl text-sm leading-6">
        Das Profil ersetzt die lokale Browser-Speicherung aus der Spring-Version. Aenderungen bleiben jetzt persistent
        und werden auf Aufgaben, Sessions und Wochenkonfigurationen abgestimmt.
      </p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <div className="theme-panel-dark flex w-full max-w-xs flex-col items-center rounded-[28px] p-6 text-white">
          <div className="flex size-36 items-center justify-center overflow-hidden rounded-full bg-[color:var(--primary)] text-5xl font-semibold text-white">
            {values.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={values.fullName} src={values.image} className="size-full object-cover" />
            ) : (
              values.fullName.slice(0, 1).toUpperCase()
            )}
          </div>
          <p className="mt-4 text-lg font-semibold">{values.fullName}</p>
          <p className="text-sm text-white/70">{values.role}</p>
          <label className="mt-6 w-full">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">Profilbild</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/75 file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--accent)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </label>
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-2">
          {[
            ["fullName", "Vollstaendiger Name"],
            ["email", "E-Mail"],
            ["abteilung", "Abteilung"],
            ["role", "Rolle / Funktion"],
            ["supervisor", "Vorgesetzte Person"],
            ["kuerzel", "Kuerzel"],
          ].map(([name, label]) => (
            <label key={name}>
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">{label}</span>
              <input
                type={name === "email" ? "email" : "text"}
                value={values[name as keyof typeof values]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [name]: event.target.value,
                  }))
                }
                className={`theme-input rounded-2xl px-4 py-3 text-sm ${errors[name] ? "theme-input-error" : ""}`}
              />
              {errors[name] ? <span className="mt-2 block text-xs text-red-600">{errors[name]}</span> : null}
            </label>
          ))}

          {message ? <div className="theme-message theme-message-success md:col-span-2 rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

          <button
            type="button"
            onClick={saveProfile}
            disabled={pending}
            className="theme-button-primary md:col-span-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Speichert..." : "Profil speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
