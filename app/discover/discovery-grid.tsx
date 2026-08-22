"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type DiscoveryRoom = { slug: string; name: string; headline: string; bio: string; avatarUrl?: string; interests: string[]; roomTitle: string; roomImage: string };

export function DiscoveryGrid({ rooms }: { rooms: DiscoveryRoom[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/discovery/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slugs: rooms.map((room) => room.slug) }), signal: controller.signal })
      .then((response) => response.ok ? response.json() : { counts: {} })
      .then((result) => setCounts(result.counts ?? {}))
      .catch(() => undefined);
    return () => controller.abort();
  }, [rooms]);
  const ordered = useMemo(() => rooms.map((room, index) => ({ room, index })).sort((a, b) => (counts[b.room.slug] ?? 0) - (counts[a.room.slug] ?? 0) || a.index - b.index), [counts, rooms]);

  return <div>{ordered.map(({ room }) => {
    const count = counts[room.slug] ?? 0;
    return <article key={room.slug}><Link className="discover-room-image" href={`/${room.slug}`}><img src={room.roomImage} alt="" /><span>ENTER ROOM ↗</span><em className={count ? "is-live" : ""}>{count ? `${count} HERE NOW` : "ROOM OPEN"}</em></Link><div className="discover-profile-copy"><div className="discover-avatar">{room.avatarUrl ? <img src={room.avatarUrl} alt="" /> : room.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><small>@{room.slug}</small><h2>{room.name}</h2><strong>{room.headline}</strong><p>{room.bio}</p><div>{room.interests?.slice(0, 5).map((interest) => <i key={interest}>{interest}</i>)}</div><Link href={`/${room.slug}`}>{room.roomTitle} ↗</Link></div></article>;
  })}</div>;
}
