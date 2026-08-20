import { getDatabase } from "@/lib/mongodb";
import { normalizePlaylist } from "@/lib/playlists";
import { requireTenantMembership } from "@/lib/tenants";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { playlists?: { id?: string; title?: string; url?: string }[]; playerStyle?: string } | null;
  if (!Array.isArray(body?.playlists) || body.playlists.length > 20 || !["rec-room", "saloon"].includes(body.playerStyle ?? "")) return NextResponse.json({ error: "Invalid playlists or player style" }, { status: 400 });
  const playlists = body.playlists.map(normalizePlaylist);
  if (playlists.some((playlist) => !playlist)) return NextResponse.json({ error: "Use a valid public Spotify or YouTube Music playlist URL" }, { status: 400 });
  const db = await getDatabase();
  await db.collection("roomPlaylists").updateOne(
    { tenantId: access.tenant._id },
    { $set: { draft: playlists, draftPlayerStyle: body.playerStyle, draftUpdatedAt: new Date() }, $setOnInsert: { tenantId: access.tenant._id, playlists: [], playerStyle: "rec-room", updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true, playlists, playerStyle: body.playerStyle, state: "draft" });
}

export async function POST(_: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const db = await getDatabase();
  const collection = db.collection("roomPlaylists");
  const document = await collection.findOne({ tenantId: access.tenant._id });
  if (!document?.draft) return NextResponse.json({ error: "Save your playlist draft before publishing" }, { status: 409 });
  const now = new Date();
  await collection.updateOne(
    { tenantId: access.tenant._id },
    { $set: { playlists: document.draft, playerStyle: document.draftPlayerStyle ?? document.playerStyle ?? "rec-room", publishedAt: now, updatedAt: now }, $unset: { draft: "", draftPlayerStyle: "", draftUpdatedAt: "" } },
  );
  return NextResponse.json({ ok: true, playlists: document.draft, state: "published" });
}
