import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "mongodb";
import { getDatabase } from "./mongodb";

function createAuth(database: Db) {
  return betterAuth({
    appName: "Rec Room",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(database),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;
const globalAuth = globalThis as typeof globalThis & { recRoomAuth?: Promise<AuthInstance> };

export function getAuth() {
  if (!globalAuth.recRoomAuth) {
    globalAuth.recRoomAuth = getDatabase().then(createAuth);
  }
  return globalAuth.recRoomAuth!;
}
