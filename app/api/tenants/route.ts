import { getDatabase } from "@/lib/mongodb";
import { ensureTenantIndexes, getSession, RESERVED_SLUGS, SLUG_PATTERN, type TenantDocument } from "@/lib/tenants";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { libraryVolumes, roomCollections } from "@/app/bookshelf/room-content";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const db = await getDatabase();
  const membership = await db.collection("memberships").findOne({ userId: session.user.id });
  if (!membership) return NextResponse.json({ error: "No room belongs to this account" }, { status: 404 });
  const tenant = await db.collection<TenantDocument>("tenants").findOne({ _id: membership.tenantId });
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ slug: tenant.slug });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { slug?: string; tenantName?: string } | null;
  const slug = body?.slug?.trim().toLowerCase() ?? "";
  const tenantName = body?.tenantName?.trim().slice(0, 80) || `${session.user.name}'s Rec Room`;
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: "Choose a 3–30 character slug using letters, numbers, or hyphens." }, { status: 400 });

  await ensureTenantIndexes();
  const db = await getDatabase();
  const existingMembership = await db.collection("memberships").findOne({ userId: session.user.id });
  if (existingMembership) return NextResponse.json({ error: "This account already owns a room." }, { status: 409 });
  const now = new Date();

  try {
    let tenant = await db.collection<TenantDocument>("tenants").findOne({ slug });
    if (tenant) {
      if (slug !== "akshat" || tenant.ownerUserId || process.env.NODE_ENV === "production") return NextResponse.json({ error: "That room URL is already taken." }, { status: 409 });
      await db.collection("tenants").updateOne({ _id: tenant._id, ownerUserId: null }, { $set: { ownerUserId: session.user.id, name: tenantName, updatedAt: now } });
      tenant = { ...tenant, ownerUserId: session.user.id, name: tenantName, updatedAt: now };
    } else {
      const tenantId = new ObjectId();
      tenant = { _id: tenantId, slug, name: tenantName, ownerUserId: session.user.id, isPublic: true, createdAt: now, updatedAt: now };
      await db.collection<TenantDocument>("tenants").insertOne(tenant);
    }
    await Promise.all([
      db.collection("memberships").insertOne({ tenantId: tenant._id, userId: session.user.id, role: "owner", createdAt: now }),
      db.collection("roomConfigurations").updateOne({ tenantId: tenant._id }, { $setOnInsert: { tenantId: tenant._id, ownerName: session.user.name, title: "The Rec Room", city: "Mumbai", timeZone: "Asia/Kolkata", locationLabel: "Mumbai", background: { desktop: "/rec-room-diorama-desktop.webp", mobile: "/rec-room-diorama-mobile.webp", templateId: "monsoon-study", theme: "monsoon-walnut" }, objectVariation: { library: "walnut", watch: "screen", play: "console", read: "coffee-table", markers: "ember", enabledComponents: ["library", "watch", "play", "read", "jukebox", "notes"] }, publishedAt: now, updatedAt: now } }, { upsert: true }),
      db.collection("curatedContent").updateOne({ tenantId: tenant._id }, { $setOnInsert: { tenantId: tenant._id, libraryVolumes, roomCollections, updatedAt: now } }, { upsert: true }),
    ]);
    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    console.error("Unable to create tenant", error);
    return NextResponse.json({ error: "Unable to create the room. The URL may already be taken." }, { status: 409 });
  }
}
