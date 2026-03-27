"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { PublicUser } from "@/lib/types";

type AppShellProps = {
  user: PublicUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tasks", label: "Aufgaben" },
    { href: "/profile", label: "Profil" },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="theme-page min-h-screen text-[color:var(--foreground)]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[color:var(--foreground)] px-5 py-5 text-white lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-6 xl:w-96">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">Task Intelligence</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Mitarbeiter Tracker</h1>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.2em] lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
            >
              Menu
            </button>
          </div>

          <div className={`mt-6 ${menuOpen ? "block" : "hidden"} lg:block`}>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-[color:var(--primary)] text-lg font-semibold text-white">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={user.fullName} src={user.image} className="size-full object-cover" />
                  ) : (
                    user.fullName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.fullName}</p>
                  <p className="text-sm text-white/70">{user.role}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">{user.userType === "admin" ? "Admin User" : user.abteilung}</p>
                </div>
              </div>

              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                        active ? "bg-[color:var(--primary)] text-white" : "bg-white/5 text-white/72 hover:bg-white/10"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em]">{active ? "Live" : "Open"}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/76">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Supervisor</p>
                <p className="mt-2 font-medium text-white">{user.supervisor}</p>
                <p className="mt-1 text-xs text-white/45">Kuerzel {user.kuerzel}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={pending}
              className="theme-button-danger mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Abmeldung..." : "Abmelden"}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
