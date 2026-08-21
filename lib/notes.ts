import { createHmac, randomUUID } from "node:crypto";
import type { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

export const NOTE_MAX_LENGTH = 1200;
export const NOTE_NAME_MAX_LENGTH = 48;
export const NOTE_REPORT_THRESHOLD = 3;

export type RoomNote = {
  _id: ObjectId;
  tenantId: ObjectId;
  authorName: string;
  authorKey: string;
  message: string;
  visibility: "public" | "private";
  moderationStatus: "visible" | "hidden";
  reportCount: number;
  reporterKeys: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function cleanPlainText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex -- remove non-printing input while preserving tabs/newlines
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

export function noteIdentity(request: Request, visitorId?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 200) || "unknown";
  const secret = process.env.NOTE_ABUSE_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("NOTE_ABUSE_SECRET or BETTER_AUTH_SECRET must be configured");
  const browserId = visitorId || randomUUID();
  const digest = createHmac("sha256", secret || "rec-room-development-only").update(`${browserId}|${address}|${agent}`).digest("hex");
  return { authorKey: digest, browserId };
}

export async function consumeNoteRateLimit(key: string, action: "create" | "report") {
  const db = await getDatabase();
  const windowMs = action === "create" ? 10 * 60_000 : 60 * 60_000;
  const limit = action === "create" ? 5 : 20;
  const bucket = Math.floor(Date.now() / windowMs);
  const rateKey = `${action}:${key}:${bucket}`;
  const expiresAt = new Date((bucket + 2) * windowMs);
  const result = await db.collection("noteRateLimits").findOneAndUpdate(
    { key: rateKey },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after" },
  );
  return (result?.count ?? limit + 1) <= limit;
}

export function publicNote(note: RoomNote) {
  return { id: note._id.toHexString(), authorName: note.authorName, message: note.message, createdAt: note.createdAt.toISOString() };
}

export function ownerNote(note: RoomNote) {
  return { ...publicNote(note), visibility: note.visibility, moderationStatus: note.moderationStatus, reportCount: note.reportCount };
}
