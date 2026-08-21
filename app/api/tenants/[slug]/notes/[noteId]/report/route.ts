import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { consumeNoteRateLimit, NOTE_REPORT_THRESHOLD, noteIdentity, type RoomNote } from "@/lib/notes";
import { findPublicTenant } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string; noteId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { slug, noteId } = await params;
  if (!ObjectId.isValid(noteId)) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  const tenant = await findPublicTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const cookieStore = await cookies();
  const identity = noteIdentity(request, cookieStore.get("rec_room_visitor")?.value);
  if (!await consumeNoteRateLimit(identity.authorKey, "report")) return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  const db = await getDatabase();
  const note = await db.collection<RoomNote>("roomNotes").findOne({ _id: new ObjectId(noteId), tenantId: tenant._id, visibility: "public" });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (note.reporterKeys.includes(identity.authorKey)) return NextResponse.json({ ok: true });
  const updated = await db.collection<RoomNote>("roomNotes").findOneAndUpdate(
    { _id: note._id, tenantId: tenant._id, reporterKeys: { $ne: identity.authorKey } },
    { $addToSet: { reporterKeys: identity.authorKey }, $inc: { reportCount: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (updated && updated.reportCount >= NOTE_REPORT_THRESHOLD) await db.collection<RoomNote>("roomNotes").updateOne({ _id: note._id, tenantId: tenant._id }, { $set: { moderationStatus: "hidden", updatedAt: new Date() } });
  const response = NextResponse.json({ ok: true });
  if (!cookieStore.get("rec_room_visitor")) response.cookies.set("rec_room_visitor", identity.browserId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
