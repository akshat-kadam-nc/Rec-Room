import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ownerNote, type RoomNote } from "@/lib/notes";
import { requireTenantMembership } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Context) {
  const access = await requireTenantMembership((await params).slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const db = await getDatabase();
  const notes = await db.collection<RoomNote>("roomNotes").find({ tenantId: access.tenant._id }).sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json({ notes: notes.map(ownerNote) });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireTenantMembership((await params).slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string; moderationStatus?: string } | null;
  if (!body?.id || !ObjectId.isValid(body.id) || !["visible", "hidden"].includes(body.moderationStatus ?? "")) return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
  const db = await getDatabase();
  const result = await db.collection<RoomNote>("roomNotes").updateOne({ _id: new ObjectId(body.id), tenantId: access.tenant._id }, { $set: { moderationStatus: body.moderationStatus as "visible" | "hidden", updatedAt: new Date() } });
  if (!result.matchedCount) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const access = await requireTenantMembership((await params).slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  const db = await getDatabase();
  const result = await db.collection<RoomNote>("roomNotes").deleteOne({ _id: new ObjectId(id), tenantId: access.tenant._id });
  if (!result.deletedCount) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
