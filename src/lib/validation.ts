import { toDateInputValue } from "@/lib/date";
import type { UserType } from "@/lib/types";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  abteilung: string;
  role: string;
  supervisor: string;
  kuerzel: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ProfileInput = {
  fullName: string;
  email: string;
  abteilung: string;
  role: string;
  supervisor: string;
  kuerzel: string;
  image?: string;
};

export type AdminUserInput = ProfileInput & {
  userType: UserType;
};

export type TaskInput = {
  employeeEmail?: string;
  aufgabenbereich: string;
  aufgabe: string;
  kategorie: string;
  haufigkeit: number;
  einheit: string;
  dauerMinuten: number;
  wartezeit: number;
  output: string;
  systemTool: string;
  abhaengigkeit: string;
  mussSein: string;
  vaNva: string;
  verbesserungsidee: string;
  kommentar: string;
  datum: string;
};

export type WeekConfigInput = {
  arbeitszeit: number;
  arbeitsort: string;
  schicht: string;
  kw: number;
};

function requireText(value: unknown, label: string, max = 120) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return `${label} ist erforderlich.`;
  }
  if (text.length > max) {
    return `${label} darf maximal ${max} Zeichen lang sein.`;
  }
  return "";
}

function optionalText(value: unknown, max = 250) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) {
    return `Maximal ${max} Zeichen erlaubt.`;
  }
  return "";
}

function emailError(value: unknown) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) {
    return "E-Mail ist erforderlich.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Bitte eine gueltige E-Mail-Adresse angeben.";
  }
  return "";
}

function optionalEmailError(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return emailError(value);
}

export function validateRegister(input: Record<string, unknown>): ValidationResult<RegisterInput> {
  const errors: Record<string, string> = {};

  errors.fullName = requireText(input.fullName, "Name");
  errors.email = emailError(input.email);
  errors.password =
    typeof input.password === "string" && input.password.trim().length >= 6
      ? ""
      : "Passwort muss mindestens 6 Zeichen haben.";
  errors.abteilung = requireText(input.abteilung, "Abteilung");
  errors.role = requireText(input.role, "Rolle");
  errors.supervisor = requireText(input.supervisor, "Vorgesetzte Person");
  errors.kuerzel = requireText(input.kuerzel, "Kuerzel", 12);

  if (Object.values(errors).some(Boolean)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName: String(input.fullName).trim(),
      email: String(input.email).trim().toLowerCase(),
      password: String(input.password).trim(),
      abteilung: String(input.abteilung).trim(),
      role: String(input.role).trim(),
      supervisor: String(input.supervisor).trim(),
      kuerzel: String(input.kuerzel).trim().toUpperCase(),
    },
  };
}

export function validateLogin(input: Record<string, unknown>): ValidationResult<LoginInput> {
  const errors: Record<string, string> = {};
  errors.email = emailError(input.email);
  errors.password = requireText(input.password, "Passwort", 200);

  if (Object.values(errors).some(Boolean)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email: String(input.email).trim().toLowerCase(),
      password: String(input.password),
    },
  };
}

export function validateProfile(input: Record<string, unknown>): ValidationResult<ProfileInput> {
  const errors: Record<string, string> = {};
  errors.fullName = requireText(input.fullName, "Name");
  errors.email = emailError(input.email);
  errors.abteilung = requireText(input.abteilung, "Abteilung");
  errors.role = requireText(input.role, "Rolle");
  errors.supervisor = requireText(input.supervisor, "Vorgesetzte Person");
  errors.kuerzel = requireText(input.kuerzel, "Kuerzel", 12);
  errors.image = optionalText(input.image, 2_000_000);

  if (Object.values(errors).some(Boolean)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName: String(input.fullName).trim(),
      email: String(input.email).trim().toLowerCase(),
      abteilung: String(input.abteilung).trim(),
      role: String(input.role).trim(),
      supervisor: String(input.supervisor).trim(),
      kuerzel: String(input.kuerzel).trim().toUpperCase(),
      image: typeof input.image === "string" ? input.image : undefined,
    },
  };
}

export function validateAdminUser(input: Record<string, unknown>): ValidationResult<AdminUserInput> {
  const profile = validateProfile(input);
  if (!profile.success) {
    return profile;
  }

  const userType = input.userType === "admin" ? "admin" : input.userType === "normal" ? "normal" : null;
  if (!userType) {
    return { success: false, errors: { userType: "Benutzertyp ist ungueltig." } };
  }

  return {
    success: true,
    data: {
      ...profile.data,
      userType,
    },
  };
}

export function validateTask(input: Record<string, unknown>): ValidationResult<TaskInput> {
  const errors: Record<string, string> = {};
  const haufigkeit = Number(input.haufigkeit);
  const dauerMinuten = Number(input.dauerMinuten);
  const wartezeit = Number(input.wartezeit ?? 0);
  const datum = typeof input.datum === "string" && input.datum ? input.datum : toDateInputValue();

  errors.employeeEmail = optionalEmailError(input.employeeEmail);
  errors.aufgabenbereich = requireText(input.aufgabenbereich, "Aufgabenbereich");
  errors.aufgabe = requireText(input.aufgabe, "Aufgabe");
  errors.kategorie = requireText(input.kategorie, "Kategorie");
  errors.haufigkeit =
    Number.isInteger(haufigkeit) && haufigkeit > 0 && haufigkeit <= 500
      ? ""
      : "Haeufigkeit muss zwischen 1 und 500 liegen.";
  errors.einheit = requireText(input.einheit, "Einheit", 50);
  errors.dauerMinuten =
    Number.isInteger(dauerMinuten) && dauerMinuten > 0 && dauerMinuten <= 1440
      ? ""
      : "Minuten muessen zwischen 1 und 1440 liegen.";
  errors.wartezeit =
    Number.isFinite(wartezeit) && wartezeit >= 0 && wartezeit <= 10080
      ? ""
      : "Wartezeit muss zwischen 0 und 10080 Minuten liegen.";
  errors.output = optionalText(input.output);
  errors.systemTool = optionalText(input.systemTool);
  errors.abhaengigkeit = optionalText(input.abhaengigkeit);
  errors.mussSein = optionalText(input.mussSein, 30);
  errors.vaNva = optionalText(input.vaNva, 30);
  errors.verbesserungsidee = optionalText(input.verbesserungsidee, 500);
  errors.kommentar = optionalText(input.kommentar, 500);
  errors.datum = /^\d{4}-\d{2}-\d{2}$/.test(datum) ? "" : "Datum ist ungueltig.";

  if (Object.values(errors).some(Boolean)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      employeeEmail: typeof input.employeeEmail === "string" && input.employeeEmail.trim()
        ? String(input.employeeEmail).trim().toLowerCase()
        : undefined,
      aufgabenbereich: String(input.aufgabenbereich).trim(),
      aufgabe: String(input.aufgabe).trim(),
      kategorie: String(input.kategorie).trim(),
      haufigkeit,
      einheit: String(input.einheit).trim(),
      dauerMinuten,
      wartezeit,
      output: String(input.output ?? "").trim(),
      systemTool: String(input.systemTool ?? "").trim(),
      abhaengigkeit: String(input.abhaengigkeit ?? "").trim(),
      mussSein: String(input.mussSein ?? "").trim(),
      vaNva: String(input.vaNva ?? "").trim(),
      verbesserungsidee: String(input.verbesserungsidee ?? "").trim(),
      kommentar: String(input.kommentar ?? "").trim(),
      datum,
    },
  };
}

export function validateWeekConfig(input: Record<string, unknown>): ValidationResult<WeekConfigInput> {
  const arbeitszeit = Number(input.arbeitszeit);
  const kw = Number(input.kw);
  const errors: Record<string, string> = {};

  errors.arbeitszeit =
    Number.isInteger(arbeitszeit) && arbeitszeit >= 1 && arbeitszeit <= 80
      ? ""
      : "Arbeitszeit muss zwischen 1 und 80 Stunden liegen.";
  errors.arbeitsort = requireText(input.arbeitsort, "Arbeitsort", 80);
  errors.schicht = requireText(input.schicht, "Schicht", 80);
  errors.kw = Number.isInteger(kw) && kw >= 1 && kw <= 53 ? "" : "KW ist ungueltig.";

  if (Object.values(errors).some(Boolean)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      arbeitszeit,
      arbeitsort: String(input.arbeitsort).trim(),
      schicht: String(input.schicht).trim(),
      kw,
    },
  };
}
