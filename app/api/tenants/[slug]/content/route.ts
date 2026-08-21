import { getDatabase } from "@/lib/mongodb";
import { requireTenantMembership } from "@/lib/tenants";
import { MARKER_STYLES, ROOM_THEMES } from "@/lib/tenants";
import { getRoomTemplate, ROOM_COMPONENTS, ROOM_TEMPLATE_IDS, type RoomComponent } from "@/lib/room-templates";
import { sanitizeContourDraft } from "@/lib/contour-authoring";
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
  const collection = db.collection("curatedContent");
  const current = await collection.findOne({ tenantId: access.tenant._id });
  if (!current) return NextResponse.json({ error: "Room content was not found" }, { status: 404 });
  if (!current.draftContent) {
    await collection.updateOne(
      { tenantId: access.tenant._id },
      { $set: { draftContent: { libraryVolumes: current.libraryVolumes, roomCollections: current.roomCollections } } },
    );
  }
  const result = await collection.updateOne({ tenantId: access.tenant._id }, { $set: { [`draftContent.${path}`]: safeEntry, draftUpdatedAt: new Date() } });
  if (!result.matchedCount) return NextResponse.json({ error: "Room content was not found" }, { status: 404 });
  return NextResponse.json({ ok: true, entry: safeEntry });
}

export async function PATCH(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { ownerName?: string; title?: string; city?: string; timeZone?: string; theme?: string; markerStyle?: string; templateId?: string; enabledComponents?: string[]; hotspotContours?: unknown } | null;
  const ownerName = body?.ownerName?.trim().slice(0, 80);
  const title = body?.title?.trim().slice(0, 80);
  const city = body?.city?.trim().slice(0, 80);
  const timeZone = body?.timeZone?.trim().slice(0, 80);
  const enabledComponents = [...new Set(body?.enabledComponents ?? [])];
  const hotspotContours = body?.hotspotContours === undefined ? undefined : sanitizeContourDraft(body.hotspotContours);
  let validTimeZone = true;
  try { new Intl.DateTimeFormat("en", { timeZone }).format(); } catch { validTimeZone = false; }
  if (!ownerName || !title || !city || !timeZone || !validTimeZone || !ROOM_THEMES.includes(body?.theme as (typeof ROOM_THEMES)[number]) || !MARKER_STYLES.includes(body?.markerStyle as (typeof MARKER_STYLES)[number]) || !ROOM_TEMPLATE_IDS.includes(body?.templateId ?? "") || enabledComponents.some((item) => !ROOM_COMPONENTS.includes(item as RoomComponent)) || body?.hotspotContours !== undefined && !hotspotContours) {
    return NextResponse.json({ error: "Invalid room appearance" }, { status: 400 });
  }
  const selectedTemplate = getRoomTemplate(body!.templateId);
  const db = await getDatabase();
  const result = await db.collection("roomConfigurations").updateOne(
    { tenantId: access.tenant._id },
    { $set: { draft: { ownerName, title, city, timeZone, locationLabel: city, background: { theme: body!.theme, templateId: selectedTemplate.id, desktop: selectedTemplate.desktop, mobile: selectedTemplate.mobile }, hotspotContours, objectVariation: { markers: body!.markerStyle, enabledComponents } }, draftUpdatedAt: new Date() } },
  );
  if (!result.matchedCount) return NextResponse.json({ error: "Room configuration was not found" }, { status: 404 });
  return NextResponse.json({ ok: true, state: "draft" });
}

export async function POST(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json().catch(() => null) as { scope?: "appearance" | "content" } | null;
  const db = await getDatabase();
  const now = new Date();
  if (body?.scope === "appearance") {
    const collection = db.collection("roomConfigurations");
    const configuration = await collection.findOne({ tenantId: access.tenant._id });
    if (!configuration?.draft) return NextResponse.json({ error: "Save your changes before publishing" }, { status: 409 });
    const draft = configuration.draft;
    await collection.updateOne(
      { tenantId: access.tenant._id },
      { $set: { ...draft, publishedAt: now, updatedAt: now }, $unset: { draft: "", draftUpdatedAt: "" } },
    );
    return NextResponse.json({ ok: true, state: "published" });
  }
  if (body?.scope === "content") {
    const collection = db.collection("curatedContent");
    const content = await collection.findOne({ tenantId: access.tenant._id });
    if (!content?.draftContent) return NextResponse.json({ error: "Save your changes before publishing" }, { status: 409 });
    await collection.updateOne(
      { tenantId: access.tenant._id },
      { $set: { libraryVolumes: content.draftContent.libraryVolumes, roomCollections: content.draftContent.roomCollections, publishedAt: now, updatedAt: now }, $unset: { draftContent: "", draftUpdatedAt: "" } },
    );
    return NextResponse.json({ ok: true, state: "published" });
  }
  return NextResponse.json({ error: "Invalid publish scope" }, { status: 400 });
}
