import { getDatabase } from "@/lib/mongodb";
import { requireTenantMembership } from "@/lib/tenants";
import { MARKER_STYLES, ROOM_THEMES } from "@/lib/tenants";
import { getRoomTemplate, ROOM_COMPONENTS, ROOM_TEMPLATE_IDS, type RoomComponent } from "@/lib/room-templates";
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

export async function PATCH(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { ownerName?: string; title?: string; locationLabel?: string; theme?: string; markerStyle?: string; templateId?: string; enabledComponents?: string[] } | null;
  const ownerName = body?.ownerName?.trim().slice(0, 80);
  const title = body?.title?.trim().slice(0, 80);
  const locationLabel = body?.locationLabel?.trim().slice(0, 100);
  const enabledComponents = [...new Set(body?.enabledComponents ?? [])];
  if (!ownerName || !title || !locationLabel || !ROOM_THEMES.includes(body?.theme as (typeof ROOM_THEMES)[number]) || !MARKER_STYLES.includes(body?.markerStyle as (typeof MARKER_STYLES)[number]) || !ROOM_TEMPLATE_IDS.includes(body?.templateId ?? "") || enabledComponents.some((item) => !ROOM_COMPONENTS.includes(item as RoomComponent))) {
    return NextResponse.json({ error: "Invalid room appearance" }, { status: 400 });
  }
  const selectedTemplate = getRoomTemplate(body!.templateId);
  const db = await getDatabase();
  const result = await db.collection("roomConfigurations").updateOne(
    { tenantId: access.tenant._id },
    { $set: { ownerName, title, locationLabel, "background.theme": body!.theme, "background.templateId": selectedTemplate.id, "background.desktop": selectedTemplate.desktop, "background.mobile": selectedTemplate.mobile, "objectVariation.markers": body!.markerStyle, "objectVariation.enabledComponents": enabledComponents, updatedAt: new Date() } },
  );
  if (!result.matchedCount) return NextResponse.json({ error: "Room configuration was not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
