import type { PublicUser, TaskRecord, WeekConfigRecord } from "@/lib/types";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildStream(lines: string[]) {
  const content = lines.join("\n");
  return `BT\n/F1 10 Tf\n14 TL\n${content}\nET`;
}

function textLine(x: number, y: number, text: string) {
  return `${x} ${y} Td (${escapePdfText(text)}) Tj`;
}

export function createWeeklyPdf(tasks: TaskRecord[], user: PublicUser, config: WeekConfigRecord | null) {
  const totalHours = tasks.reduce((sum, task) => sum + task.stundenProWoche, 0);
  const waitingHours = tasks.reduce((sum, task) => sum + task.wartezeit / 60, 0);

  const lines: string[] = [
    textLine(36, 560, "Mitarbeiter Aufgaben Tracker - Wochenreport"),
    textLine(0, -20, `Name: ${user.fullName}`),
    textLine(0, -14, `Abteilung: ${user.abteilung}   Rolle: ${user.role}   Kuerzel: ${user.kuerzel}`),
    textLine(0, -14, `Vorgesetzte Person: ${user.supervisor}`),
    textLine(0, -14, `Arbeitszeit: ${config?.arbeitszeit ?? 40}h   Arbeitsort: ${config?.arbeitsort ?? "-"}   Schicht: ${config?.schicht ?? "-"}`),
    textLine(0, -22, "Aufgaben:"),
  ];

  tasks.slice(0, 20).forEach((task, index) => {
    lines.push(
      textLine(
        0,
        -14,
        `${index + 1}. ${task.aufgabe} | ${task.kategorie} | ${task.haufigkeit}x ${task.dauerMinuten}min | ${task.stundenProWoche.toFixed(2)}h/Woche`,
      ),
    );
  });

  if (tasks.length > 20) {
    lines.push(textLine(0, -14, `... ${tasks.length - 20} weitere Aufgaben nicht angezeigt.`));
  }

  lines.push(textLine(0, -22, `Gesamtstunden: ${totalHours.toFixed(2)} h`));
  lines.push(textLine(0, -14, `Gesamtwartezeit: ${waitingHours.toFixed(2)} h`));

  const stream = buildStream(lines);
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}
