import { ObjectId, type Document } from "mongodb";
import { headers } from "next/headers";
import { getAuth } from "./auth";
import { getDatabase } from "./mongodb";
import { libraryVolumes, roomCollections } from "@/app/bookshelf/room-content";

export const RESERVED_SLUGS = new Set(["admin", "api", "archive", "bookshelf-archive", "favicon", "login", "logout", "register", "signup", "studio", "www"]);
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export type TenantDocument = {
  _id: ObjectId;
  slug: string;
  name: string;
  ownerUserId: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomConfiguration = {
  tenantId: ObjectId;
  ownerName: string;
  title: string;
  locationLabel: string;
  background: { desktop: string; mobile: string; theme: string };
  objectVariation: Record<string, string>;
  updatedAt: Date;
};

export async function ensureTenantIndexes() {
  const db = await getDatabase();
  await Promise.all([
    db.collection("tenants").createIndex({ slug: 1 }, { unique: true }),
    db.collection("memberships").createIndex({ tenantId: 1, userId: 1 }, { unique: true }),
    db.collection("roomConfigurations").createIndex({ tenantId: 1 }, { unique: true }),
    db.collection("curatedContent").createIndex({ tenantId: 1 }, { unique: true }),
  ]);
}

export async function seedAkshatTenant() {
  await ensureTenantIndexes();
  const db = await getDatabase();
  const now = new Date();
  const result = await db.collection<TenantDocument>("tenants").findOneAndUpdate(
    { slug: "akshat" },
    { $setOnInsert: { slug: "akshat", name: "Akshat's Rec Room", ownerUserId: null, isPublic: true, createdAt: now, updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Unable to seed Akshat tenant");
  await Promise.all([
    db.collection<RoomConfiguration>("roomConfigurations").updateOne(
      { tenantId: result._id },
      { $setOnInsert: { tenantId: result._id, ownerName: "Akshat Kadam", title: "The Rec Room", locationLabel: "Mumbai / Monsoon Study", background: { desktop: "/rec-room-diorama-desktop.webp", mobile: "/rec-room-diorama-mobile.webp", theme: "monsoon-walnut" }, objectVariation: { library: "walnut", watch: "crt", play: "console", read: "coffee-table" }, updatedAt: now } },
      { upsert: true },
    ),
    db.collection("curatedContent").updateOne(
      { tenantId: result._id },
      { $setOnInsert: { tenantId: result._id, libraryVolumes, roomCollections, updatedAt: now } },
      { upsert: true },
    ),
  ]);
  return result;
}

export async function findPublicTenant(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  if (slug === "akshat") await seedAkshatTenant();
  const db = await getDatabase();
  return db.collection<TenantDocument>("tenants").findOne({ slug, isPublic: true });
}

export async function getTenantRoom(slug: string) {
  const tenant = await findPublicTenant(slug);
  if (!tenant) return null;
  const db = await getDatabase();
  const [configuration, content] = await Promise.all([
    db.collection<RoomConfiguration>("roomConfigurations").findOne({ tenantId: tenant._id }),
    db.collection("curatedContent").findOne({ tenantId: tenant._id }),
  ]);
  return { tenant, configuration, content };
}

export async function getSession() {
  return (await getAuth()).api.getSession({ headers: await headers() });
}

export async function requireTenantMembership(slug: string) {
  const session = await getSession();
  if (!session) return null;
  const db = await getDatabase();
  const tenant = await db.collection<TenantDocument>("tenants").findOne({ slug });
  if (!tenant) return null;
  const membership = await db.collection("memberships").findOne({ tenantId: tenant._id, userId: session.user.id });
  return membership ? { session, tenant, membership } : null;
}

export function serializeDocument<T extends Document>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
