"use client";

import { useEffect, useState } from "react";
import * as Ably from "ably";

type PresenceTokenResponse = { channelName: string; tokenRequest: Ably.TokenRequest };

export function RoomPresence({ slug }: { slug: string }) {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let realtime: Ably.Realtime | null = null;
    const connect = async () => {
      try {
        const tokenEndpoint = `/api/tenants/${encodeURIComponent(slug)}/presence-token`;
        const response = await fetch(tokenEndpoint, { method: "POST" });
        if (!response.ok) return;
        const initial = await response.json() as PresenceTokenResponse;
        let pendingToken: Ably.TokenRequest | null = initial.tokenRequest;
        realtime = new Ably.Realtime({
          authCallback: async (_params, callback) => {
            try {
              if (pendingToken) {
                const tokenRequest = pendingToken;
                pendingToken = null;
                callback(null, tokenRequest);
                return;
              }
              const renewal = await fetch(tokenEndpoint, { method: "POST" });
              if (!renewal.ok) throw new Error("Unable to renew room presence");
              callback(null, ((await renewal.json()) as PresenceTokenResponse).tokenRequest);
            } catch (error) {
              callback(error instanceof Error ? error.message : "Unable to renew room presence", null);
            }
          },
          closeOnUnload: true,
        });
        const channel = realtime.channels.get(initial.channelName);
        const refreshCount = async () => {
          const members = await channel.presence.get();
          if (active) setVisitorCount(new Set(members.map((member) => member.clientId)).size);
        };
        await channel.presence.subscribe(() => { void refreshCount().catch(() => undefined); });
        await channel.presence.enter();
        await refreshCount();
      } catch {
        if (active) setVisitorCount(null);
        realtime?.close();
      }
    };
    void connect();
    return () => { active = false; realtime?.close(); };
  }, [slug]);

  if (visitorCount === null || visitorCount < 1) return null;
  return <div className="room-presence" role="status" aria-live="polite"><i aria-hidden="true" /><span>{visitorCount === 1 ? "JUST YOU HERE" : `${visitorCount} VISITORS HERE`}</span></div>;
}
