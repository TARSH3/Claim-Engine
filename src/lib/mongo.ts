import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });

const g = globalThis as unknown as { _mongoPromise?: Promise<MongoClient> };
export const mongoPromise: Promise<MongoClient> = g._mongoPromise ?? (g._mongoPromise = client.connect().catch((err) => {
  console.warn("MongoDB connection warning (NoSQL store may be unavailable):", err.message);
  return client;
}));

export async function getDb(): Promise<Db> {
  const cli = await mongoPromise;
  return cli.db(process.env.MONGODB_DB ?? "claims_engine_unstructured");
}

export const REPORTS = "IncidentReports";
