"use client";

import { useEffect, useRef } from "react";

export type RoomHotspot = "library" | "watch" | "play" | "read";

type Props = {
  active: RoomHotspot | null;
  activeChapter: number;
  onHotspot: (hotspot: RoomHotspot, chapter?: number) => void;
  onReady: () => void;
};

const hotspots: Array<{ chapter?: number; id: RoomHotspot; key: string; label: string; hint: string }> = [
  { id: "library", key: "writing", chapter: 0, label: "Writing", hint: "Open the Substack Writing volume" },
  { id: "library", key: "recommendations", chapter: 1, label: "Recs", hint: "Open the Recommendations volume" },
  { id: "library", key: "books", chapter: 2, label: "Books", hint: "Open the Books and Manga volume" },
  { id: "library", key: "interests", chapter: 3, label: "Ideas", hint: "Open the Interests and Ideas volume" },
  { id: "watch", key: "watch", label: "Watch", hint: "Open films, television, and anime" },
  { id: "play", key: "play", label: "Play", hint: "Open games and wishlists" },
  { id: "read", key: "read", label: "Read", hint: "Open the commonplace book" },
];

export function RecRoomDiorama({ active, activeChapter, onHotspot, onReady }: Props) {
  const room = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = artwork.current;
    if (!image) return;
    if (image.complete) {
      onReady();
      return;
    }
    image.addEventListener("load", onReady, { once: true });
    image.addEventListener("error", onReady, { once: true });
    return () => {
      image.removeEventListener("load", onReady);
      image.removeEventListener("error", onReady);
    };
  }, [onReady]);

  useEffect(() => {
    const node = room.current;
    const visualPlane = plane.current;
    if (!node || !visualPlane) return;

    const resize = () => {
      const mobile = matchMedia("(max-width: 760px)").matches;
      const ratio = mobile ? 9 / 16 : 16 / 9;
      let width = mobile ? node.clientWidth : Math.max(node.clientWidth, node.clientHeight * ratio);
      if (mobile && width / ratio > node.clientHeight) width = node.clientHeight * ratio;
      visualPlane.style.width = `${width}px`;
      visualPlane.style.height = `${width / ratio}px`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => observer.disconnect();

    const move = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      node.style.setProperty("--room-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * -12}px`);
      node.style.setProperty("--room-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -8}px`);
    };
    const reset = () => {
      node.style.setProperty("--room-x", "0px");
      node.style.setProperty("--room-y", "0px");
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => {
      observer.disconnect();
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div className="room-diorama" ref={room}>
      <div className="room-plane" ref={plane}>
        <picture className="room-art">
          <source media="(max-width: 760px)" srcSet="/rec-room-diorama-mobile.webp" />
          <img ref={artwork} src="/rec-room-diorama-desktop.webp" alt="A warm walnut recreation room overlooking rainy Mumbai" />
        </picture>
        <div className="room-window-loop" aria-hidden="true" />
        <div className="room-steam" aria-hidden="true"><i /><i /><i /></div>
        <div className="room-hotspots" aria-label="Objects in the recreation room">
          {hotspots.map(({ chapter, id, key, label, hint }, index) => (
            <button
              className={`room-hotspot room-hotspot-${key}`}
              key={key}
              type="button"
              aria-label={hint}
              aria-pressed={active === id && (id !== "library" || activeChapter === chapter)}
              onClick={() => onHotspot(id, chapter)}
            >
              <span className="room-hotspot-number">{id === "library" ? `B${index + 1}` : `0${index - 2}`}</span>
              <span className="room-hotspot-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
