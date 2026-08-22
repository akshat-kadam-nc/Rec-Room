import type { ObjectId } from "mongodb";

export const PROFILE_BIO_MAX_LENGTH = 600;
export const PROFILE_INTEREST_LIMIT = 12;
export const PROFILE_LINK_LIMIT = 5;

export type ProfileLink = { label: string; url: string };

export type TenantProfile = {
  tenantId: ObjectId;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  interests: string[];
  links: ProfileLink[];
  isPublic: boolean;
  discoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  const withoutControls = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? " " : character;
  }).join("");
  return withoutControls.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeHttpsUrl(value: unknown) {
  const text = cleanText(value, 500);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}

export function sanitizeProfile(value: unknown) {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const displayName = cleanText(body.displayName, 80);
  const headline = cleanText(body.headline, 120);
  const bio = cleanText(body.bio, PROFILE_BIO_MAX_LENGTH);
  const avatarUrl = safeHttpsUrl(body.avatarUrl) || undefined;
  const interests = Array.isArray(body.interests) ? [...new Set(body.interests.map((item) => cleanText(item, 36)).filter(Boolean))].slice(0, PROFILE_INTEREST_LIMIT) : [];
  const links = Array.isArray(body.links) ? body.links.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { label: cleanText(record.label, 32), url: safeHttpsUrl(record.url) };
  }).filter((item) => item.label && item.url).slice(0, PROFILE_LINK_LIMIT) : [];
  return { displayName, headline, bio, avatarUrl, interests, links, isPublic: body.isPublic !== false, discoverable: body.discoverable !== false };
}
