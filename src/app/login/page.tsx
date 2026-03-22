import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.userType === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center gap-10">
        <div className="hidden max-w-md lg:block">
          <p className="theme-kicker">Blue Shift</p>
          <h1 className="mt-4 text-6xl font-semibold leading-none tracking-tight text-[color:var(--foreground)]">
            Arbeitsaufgaben in einem klaren, ruhigen Fluss.
          </h1>
          <p className="theme-copy mt-6 text-base leading-7">
            Der Tracker arbeitet jetzt mit einer klaren Blau-Gruen-Thematik, persistenten Daten, validierten Formularen
            und einer deutlich belastbareren Bedienung als die alte Spring-Version.
          </p>
        </div>

        <AuthCard
          title="Anmelden"
          subtitle="Mit Ihrer E-Mail-Adresse und dem bestehenden Passwort einloggen. Bestehende Klartext-Passwoerter werden beim erfolgreichen Login automatisch in sichere Hashes ueberfuehrt."
          endpoint="/api/auth/login"
          submitLabel="Einloggen"
          alternateLabel="Noch kein Konto? Registrierung starten"
          alternateHref="/register"
          fields={[
            {
              name: "email",
              label: "E-Mail",
              type: "email",
              autoComplete: "email",
              placeholder: "name@firma.de",
            },
            {
              name: "password",
              label: "Passwort",
              type: "password",
              autoComplete: "current-password",
              placeholder: "Mindestens 6 Zeichen",
            },
          ]}
        />
      </div>
    </main>
  );
}
