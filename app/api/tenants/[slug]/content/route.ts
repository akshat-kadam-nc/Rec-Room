import { getDatabase } from "@/lib/mongodb";
import { requireTenantMembership } from "@/lib/tenants";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const db = await getDatabase();
  const [configuration, content] = await Promise.all([
    db.collection("roomConfigurations").findOne({ tenantId: access.tenant._id }),
    db.collection("curatedContent").findOne({ tenantId: access.tenant._id }),
  ]);
  return NextResponse.json({ configuration, content });
}

export async function PUT(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { sectionId?: string; entryIndex?: number; entry?: { title?: string; summary?: string; meta?: string; href?: string; longform?: string } } | null;
  const allowedSections = new Set(["library:0", "library:1", "library:2", "library:3", "watch", "play", "read"]);
  if (!body?.sectionId || !allowedSections.has(body.sectionId) || !Number.isInteger(body.entryIndex) || body.entryIndex! < 0 || body.entryIndex! > 50 || !body.entry) return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  const entryIndex = body.entryIndex!;
  const safeEntry = {
    title: body.entry.title?.trim().slice(0, 160) || "Untitled",
    summary: body.entry.summary?.trim().slice(0, 2000) || "",
    meta: body.entry.meta?.trim().slice(0, 120) || "CURATED",
    href: body.entry.href?.trim().slice(0, 500) || undefined,
    longform: body.entry.longform?.trim() ? [body.entry.longform.trim().slice(0, 30000)] : undefined,
  };
  const path = body.sectionId.startsWith("library:")
    ? `libraryVolumes.${Number(body.sectionId.split(":")[1])}.chapters.${entryIndex}`
    : `roomCollections.${body.sectionId}.chapters.${entryIndex}`;
  const db = await getDatabase();
  const result = await db.collection("curatedContent").updateOne({ tenantId: access.tenant._id }, { $set: { [path]: safeEntry, updatedAt: new Date() } });
  if (!result.matchedCount) return NextResponse.json({ error: "Room content was not found" }, { status: 404 });
  return NextResponse.json({ ok: true, entry: safeEntry });
}
