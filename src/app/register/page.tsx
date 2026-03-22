import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.userType === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="theme-page min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <AuthCard
          title="Registrieren"
          subtitle="Profil, Abteilung und Rolleninformationen einmal sauber erfassen. Neue Konten speichern Passwoerter nur noch als sichere Hashes und stehen danach sofort fuer Dashboard, Aufgaben und Wochenreport bereit."
          endpoint="/api/auth/register"
          submitLabel="Konto anlegen"
          alternateLabel="Bereits registriert? Zum Login"
          alternateHref="/login"
          fields={[
            { name: "fullName", label: "Vollstaendiger Name", placeholder: "Max Mustermann" },
            { name: "email", label: "E-Mail", type: "email", autoComplete: "email", placeholder: "name@firma.de" },
            { name: "password", label: "Passwort", type: "password", autoComplete: "new-password", placeholder: "Mindestens 6 Zeichen" },
            { name: "abteilung", label: "Abteilung", placeholder: "Operations" },
            { name: "role", label: "Rolle / Funktion", placeholder: "Team Lead" },
            { name: "supervisor", label: "Vorgesetzte Person", placeholder: "Julia Beispiel" },
            { name: "kuerzel", label: "Kuerzel", placeholder: "MM" },
          ]}
        />
      </div>
    </main>
  );
}
