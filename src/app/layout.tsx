import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mitarbeiter Aufgaben Tracker",
  description: "Next.js-Version des Mitarbeiter Aufgaben Trackers mit Aufgabenverwaltung, Profil und Wochenreport.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geist.className} h-full antialiased`}>
      <body className="min-h-full bg-[color:var(--background)] text-[color:var(--foreground)]">{children}</body>
    </html>
  );
}
