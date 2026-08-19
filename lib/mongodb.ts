import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "rec_room";

if (!uri) throw new Error("MONGODB_URI is not configured");

const globalMongo = globalThis as typeof globalThis & { recRoomMongo?: Promise<MongoClient> };

export function getMongoClient() {
  const clientPromise = globalMongo.recRoomMongo ?? new MongoClient(uri!).connect();
  globalMongo.recRoomMongo = clientPromise;
  return clientPromise;
}

export async function getDatabase() {
  return (await getMongoClient()).db(databaseName);
}
