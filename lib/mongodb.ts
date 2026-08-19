import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "rec_room";

if (!uri) throw new Error("MONGODB_URI is not configured");

const globalMongo = globalThis as typeof globalThis & { recRoomMongo?: Promise<MongoClient> };
const clientPromise = globalMongo.recRoomMongo ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") globalMongo.recRoomMongo = clientPromise;

export async function getDatabase() {
  return (await clientPromise).db(databaseName);
}

export { clientPromise };
