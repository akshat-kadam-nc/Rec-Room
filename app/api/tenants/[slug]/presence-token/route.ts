import { createHmac, randomUUID } from "node:crypto";
import * as Ably from "ably";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findPublicTenant } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string }> };
const VISITOR_COOKIE = "rec_room_visitor";

export async function POST(_: Request, { params }: Context) {
  const tenant = await findPublicTenant((await params).slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Presence is not configured" }, { status: 503 });

  const cookieStore = await cookies();
  const browserId = cookieStore.get(VISITOR_COOKIE)?.value || randomUUID();
  const secret = process.env.PRESENCE_ID_SECRET || process.env.NOTE_ABUSE_SECRET || process.env.BETTER_AUTH_SECRET || apiKey;
  const digest = (value: string) => createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
  const tenantKey = tenant._id.toHexString();
  const channelName = `room-presence:${digest(`tenant:${tenantKey}`)}`;
  const clientId = `visitor-${digest(`tenant:${tenantKey}|browser:${browserId}`)}`;
  const ably = new Ably.Rest({ key: apiKey });
  const tokenRequest = await ably.auth.createTokenRequest({ capability: JSON.stringify({ [channelName]: ["presence", "subscribe"] }), clientId, ttl: 60 * 60_000 });
  const response = NextResponse.json({ channelName, tokenRequest });
  response.headers.set("Cache-Control", "no-store");
  if (!cookieStore.get(VISITOR_COOKIE)) response.cookies.set(VISITOR_COOKIE, browserId, { httpOnly: true, maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}
