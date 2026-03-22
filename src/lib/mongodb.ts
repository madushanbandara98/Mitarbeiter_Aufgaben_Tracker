import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "tracker";

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as GlobalMongo;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const mongoClient = new MongoClient(uri, {
  appName: "ett",
});

export function getMongoClient() {
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = mongoClient.connect();
  }

  return globalForMongo._mongoClientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}
