import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sanitizeProfile, type TenantProfile } from "@/lib/profiles";
import { findPublicTenant, requireTenantMembership } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Context) {
  const tenant = await findPublicTenant((await params).slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const profile = await (await getDatabase()).collection<TenantProfile>("tenantProfiles").findOne({ tenantId: tenant._id, isPublic: true });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request, { params }: Context) {
  const access = await requireTenantMembership((await params).slug);
  if (!access) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const profile = sanitizeProfile(await request.json().catch(() => null));
  if (!profile.displayName || !profile.headline || !profile.bio) return NextResponse.json({ error: "Name, headline, and bio are required" }, { status: 400 });
  const now = new Date();
  await (await getDatabase()).collection<TenantProfile>("tenantProfiles").updateOne(
    { tenantId: access.tenant._id },
    { $set: { ...profile, updatedAt: now }, $setOnInsert: { tenantId: access.tenant._id, createdAt: now } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true, profile });
}
