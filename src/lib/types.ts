export type UserType = "normal" | "admin";

export type UserRecord = {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: string;
  userType: UserType;
  supervisor: string;
  abteilung: string;
  kuerzel: string;
  image?: string;
};

export type TaskRecord = {
  id: number;
  employeeName: string;
  employeeEmail: string;
  abteilung: string;
  aufgabenbereich: string;
  aufgabe: string;
  kategorie: string;
  haufigkeit: number;
  einheit: string;
  dauerMinuten: number;
  datum: string;
  gesamtMinuten: number;
  output: string;
  systemTool: string;
  abhaengigkeit: string;
  wartezeit: number;
  mussSein: string;
  vaNva: string;
  verbesserungsidee: string;
  kommentar: string;
  stundenProWoche: number;
};

export type WeekConfigRecord = {
  id: number;
  email: string;
  kw: number;
  arbeitsort: string;
  schicht: string;
  arbeitszeit: number;
};

export type SessionRecord = {
  token: string;
  userId: number;
  createdAt: string;
};

export type Database = {
  users: UserRecord[];
  tasks: TaskRecord[];
  weekConfigs: WeekConfigRecord[];
  sessions: SessionRecord[];
  nextIds: {
    users: number;
    tasks: number;
    weekConfigs: number;
  };
};

export type PublicUser = Omit<UserRecord, "password">;
