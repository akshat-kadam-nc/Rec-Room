import { createHmac } from "node:crypto";

export function presenceSecret(apiKey = process.env.ABLY_API_KEY) {
  return process.env.PRESENCE_ID_SECRET || process.env.NOTE_ABUSE_SECRET || process.env.BETTER_AUTH_SECRET || apiKey || "";
}

export function presenceDigest(value: string, secret = presenceSecret()) {
  if (!secret) throw new Error("Presence is not configured");
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

export function presenceChannelName(tenantId: string, secret = presenceSecret()) {
  return `room-presence:${presenceDigest(`tenant:${tenantId}`, secret)}`;
}
