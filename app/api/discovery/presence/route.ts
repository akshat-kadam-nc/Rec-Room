import * as Ably from "ably";
import type { BatchPresenceFailureResult, BatchPresenceSuccessResult, BatchResult } from "ably";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { presenceChannelName, presenceSecret } from "@/lib/presence";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return NextResponse.json({ counts: {} });

  const body = await request.json().catch(() => null) as { slugs?: unknown } | null;
  const slugs = Array.isArray(body?.slugs)
    ? [...new Set(body.slugs.filter((slug): slug is string => typeof slug === "string" && SLUG_PATTERN.test(slug)).slice(0, 60))]
    : [];
  if (!slugs.length) return NextResponse.json({ counts: {} });

  const db = await getDatabase();
  const tenants = await db.collection("tenants").aggregate<{ _id: { toHexString(): string }; slug: string }>([
    { $match: { slug: { $in: slugs }, isPublic: true } },
    { $lookup: { from: "tenantProfiles", localField: "_id", foreignField: "tenantId", as: "profile" } },
    { $match: { profile: { $elemMatch: { isPublic: true, discoverable: true } } } },
    { $project: { slug: 1 } },
  ]).toArray();

  const secret = presenceSecret(apiKey);
  const channelToSlug = new Map(tenants.map((tenant) => [presenceChannelName(tenant._id.toHexString(), secret), tenant.slug]));
  const counts: Record<string, number> = Object.fromEntries(tenants.map((tenant) => [tenant.slug, 0]));
  if (channelToSlug.size) {
    const batchResponse = await new Ably.Rest({ key: apiKey }).batchPresence([...channelToSlug.keys()]);
    const batches = (Array.isArray(batchResponse) ? batchResponse : [batchResponse]) as BatchResult<BatchPresenceSuccessResult | BatchPresenceFailureResult>[];
    for (const batch of batches) for (const result of batch.results) {
      if (!("presence" in result)) continue;
      const slug = channelToSlug.get(result.channel);
      if (slug) counts[slug] = new Set(result.presence.map((member) => member.clientId).filter(Boolean)).size;
    }
  }

  const response = NextResponse.json({ counts });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
