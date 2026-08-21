import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { cleanPlainText, consumeNoteRateLimit, NOTE_MAX_LENGTH, NOTE_NAME_MAX_LENGTH, noteIdentity, publicNote, type RoomNote } from "@/lib/notes";
import { ensureTenantIndexes, findPublicTenant } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string }> };
const VISITOR_COOKIE = "rec_room_visitor";

export async function GET(_: Request, { params }: Context) {
  const tenant = await findPublicTenant((await params).slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const db = await getDatabase();
  const notes = await db.collection<RoomNote>("roomNotes").find({ tenantId: tenant._id, visibility: "public", moderationStatus: "visible" }).sort({ createdAt: -1 }).limit(50).toArray();
  return NextResponse.json({ notes: notes.map(publicNote) });
}

export async function POST(request: Request, { params }: Context) {
  const tenant = await findPublicTenant((await params).slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { authorName?: unknown; message?: unknown; visibility?: unknown } | null;
  const authorName = cleanPlainText(body?.authorName, NOTE_NAME_MAX_LENGTH) || "A visitor";
  const message = cleanPlainText(body?.message, NOTE_MAX_LENGTH);
  const visibility = body?.visibility;
  if (message.length < 2 || (visibility !== "public" && visibility !== "private")) return NextResponse.json({ error: "Write a note and choose who can see it." }, { status: 400 });
  await ensureTenantIndexes();
  const cookieStore = await cookies();
  const identity = noteIdentity(request, cookieStore.get(VISITOR_COOKIE)?.value);
  if (!await consumeNoteRateLimit(identity.authorKey, "create")) return NextResponse.json({ error: "Too many notes. Please try again later." }, { status: 429 });
  const db = await getDatabase();
  const recentDuplicate = await db.collection<RoomNote>("roomNotes").findOne({ tenantId: tenant._id, authorKey: identity.authorKey, message, createdAt: { $gt: new Date(Date.now() - 10 * 60_000) } });
  if (recentDuplicate) return NextResponse.json({ error: "That note was already delivered." }, { status: 409 });
  const now = new Date();
  const result = await db.collection<Omit<RoomNote, "_id">>("roomNotes").insertOne({ tenantId: tenant._id, authorName, authorKey: identity.authorKey, message, visibility, moderationStatus: "visible", reportCount: 0, reporterKeys: [], createdAt: now, updatedAt: now });
  const response = NextResponse.json({ ok: true, id: result.insertedId.toHexString(), visibility }, { status: 201 });
  if (!cookieStore.get(VISITOR_COOKIE)) response.cookies.set(VISITOR_COOKIE, identity.browserId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
