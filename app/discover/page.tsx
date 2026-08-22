import Link from "next/link";
import { getDatabase } from "@/lib/mongodb";
import { DiscoveryGrid, type DiscoveryRoom } from "./discovery-grid";

type Context = { searchParams: Promise<{ q?: string }> };

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export const metadata = { title: "Discover rooms | Rec Room", description: "Find public Rec Rooms and the people arranging them." };

export default async function DiscoverPage({ searchParams }: Context) {
  const query = (await searchParams).q?.trim().slice(0, 80) ?? "";
  const db = await getDatabase();
  const filter = query ? { $or: ["displayName", "headline", "bio", "interests"].map((field) => ({ [field]: { $regex: escapeRegex(query), $options: "i" } })) } : {};
  const rooms = await db.collection("tenantProfiles").aggregate<DiscoveryRoom>([
    { $match: { isPublic: true, discoverable: true, ...filter } },
    { $sort: { updatedAt: -1 } }, { $limit: 60 },
    { $lookup: { from: "tenants", localField: "tenantId", foreignField: "_id", as: "tenant" } },
    { $lookup: { from: "roomConfigurations", localField: "tenantId", foreignField: "tenantId", as: "room" } },
    { $unwind: "$tenant" }, { $match: { "tenant.isPublic": true } },
    { $project: { _id: 0, slug: "$tenant.slug", name: "$displayName", headline: 1, bio: 1, avatarUrl: 1, interests: 1, roomTitle: { $ifNull: [{ $first: "$room.title" }, "$tenant.name"] }, roomImage: { $ifNull: [{ $first: "$room.background.desktop" }, "/rec-room-diorama-desktop.webp"] }, updatedAt: 1 } },
  ]).toArray();
  return <main className="discover-page">
    <header className="discover-nav"><Link href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><strong>DISCOVER REC ROOMS</strong><nav><Link href="/login">STUDIO</Link><Link href="/register">CREATE A ROOM</Link></nav></header>
    <section className="discover-hero"><span>PUBLIC PROFILES / OPEN DOORS</span><h1 style={{ fontSize: "clamp(5rem, 10vw, 10rem)", lineHeight: .7 }}>Find a room<br />worth entering.</h1><p>Personal corners of the internet, arranged by the people who live in them.</p><form><input name="q" defaultValue={query} placeholder="Search people, rooms, or interests" aria-label="Search public rooms" /><button type="submit">SEARCH</button></form></section>
    <section className="discover-results"><header><span>{query ? `RESULTS FOR “${query.toUpperCase()}”` : "RECENTLY ARRANGED"}</span><strong>{rooms.length} PUBLIC {rooms.length === 1 ? "ROOM" : "ROOMS"}</strong></header>{rooms.length ? <DiscoveryGrid rooms={rooms} /> : <aside><strong>No rooms found.</strong><p>Try another interest or owner name.</p><Link href="/discover">CLEAR SEARCH</Link></aside>}</section>
  </main>;
}
