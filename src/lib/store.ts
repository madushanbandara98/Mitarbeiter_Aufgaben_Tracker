import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import type {
  Database,
  PublicUser,
  SessionRecord,
  TaskRecord,
  UserRecord,
  WeekConfigRecord,
} from "@/lib/types";

function withoutMongoId<T extends { _id?: unknown }>(doc: T): Omit<T, "_id"> {
  const clone = { ...doc } as T & { _id?: unknown };
  delete clone._id;
  return clone;
}

function normalizeUser(user: Omit<UserRecord, "userType"> & { userType?: string }): UserRecord {
  return {
    ...user,
    userType: user.userType === "admin" ? "admin" : "normal",
  };
}

async function getCollections() {
  const db = await getMongoDb();
  return {
    users: db.collection<UserRecord>("users"),
    tasks: db.collection<TaskRecord>("tasks"),
    weekConfigs: db.collection<WeekConfigRecord>("weekConfigs"),
    sessions: db.collection<SessionRecord>("sessions"),
  };
}

async function nextId<T extends { id: number }>(collection: Collection<T>) {
  const record = await collection.find({}, { projection: { id: 1 } }).sort({ id: -1 }).limit(1).next();
  return (record?.id ?? 0) + 1;
}

export async function readDb(): Promise<Database> {
  const collections = await getCollections();
  const [users, tasks, weekConfigs, sessions, nextUserId, nextTaskId, nextWeekConfigId] = await Promise.all([
    collections.users.find({}).toArray(),
    collections.tasks.find({}).toArray(),
    collections.weekConfigs.find({}).toArray(),
    collections.sessions.find({}).toArray(),
    nextId(collections.users),
    nextId(collections.tasks),
    nextId(collections.weekConfigs),
  ]);

  return {
    users: users.map((entry) => normalizeUser(withoutMongoId(entry) as Omit<UserRecord, "userType"> & { userType?: string })),
    tasks: tasks.map((entry) => sanitizeTask(withoutMongoId(entry))),
    weekConfigs: weekConfigs.map((entry) => withoutMongoId(entry)),
    sessions: sessions.map((entry) => withoutMongoId(entry)),
    nextIds: {
      users: nextUserId,
      tasks: nextTaskId,
      weekConfigs: nextWeekConfigId,
    },
  };
}

export async function writeDb(db: Database) {
  const collections = await getCollections();

  await Promise.all([
    collections.users.deleteMany({}),
    collections.tasks.deleteMany({}),
    collections.weekConfigs.deleteMany({}),
    collections.sessions.deleteMany({}),
  ]);

  await Promise.all([
    db.users.length ? collections.users.insertMany(db.users.map((user) => normalizeUser(user))) : Promise.resolve(),
    db.tasks.length ? collections.tasks.insertMany(db.tasks.map((task) => sanitizeTask(task))) : Promise.resolve(),
    db.weekConfigs.length ? collections.weekConfigs.insertMany(db.weekConfigs) : Promise.resolve(),
    db.sessions.length ? collections.sessions.insertMany(db.sessions) : Promise.resolve(),
  ]);
}

export async function updateDb<T>(updater: (db: Database) => T | Promise<T>) {
  const db = await readDb();
  const result = await updater(db);
  await writeDb(db);
  return result;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const publicUser = { ...normalizeUser(user) } as Partial<UserRecord>;
  delete publicUser.password;
  return publicUser as PublicUser;
}

export function findSession(db: Database, token?: string | null): SessionRecord | undefined {
  if (!token) {
    return undefined;
  }
  return db.sessions.find((session) => session.token === token);
}

export function sanitizeTask(task: TaskRecord) {
  return {
    ...task,
    stundenProWoche: Number(task.stundenProWoche.toFixed(2)),
  };
}

export function sanitizeWeekConfig(config: WeekConfigRecord | undefined) {
  return config ?? null;
}
