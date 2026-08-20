"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { getRoomTemplate, type HotspotContour, type RoomComponent } from "@/lib/room-templates";

export type RoomHotspot = "library" | "watch" | "play" | "read" | "jukebox";

type Props = { active: RoomHotspot | null; activeChapter: number; enabledComponents: RoomComponent[]; onHotspot: (hotspot: RoomHotspot, chapter?: number) => void; onReady: () => void; templateId: string };

const hotspotDefinitions: Array<{ chapter?: number; id: RoomHotspot; key: string; label: string; hint: string }> = [
  { id: "library", key: "writing", chapter: 0, label: "Writing", hint: "Open the Substack Writing volume" },
  { id: "library", key: "recommendations", chapter: 1, label: "Recs", hint: "Open the Recommendations volume" },
  { id: "library", key: "books", chapter: 2, label: "Books", hint: "Open the Books and Manga volume" },
  { id: "library", key: "interests", chapter: 3, label: "Ideas", hint: "Open the Interests and Ideas volume" },
  { id: "watch", key: "watch", label: "Watch", hint: "Open films, television, and anime" },
  { id: "play", key: "play", label: "Play", hint: "Open games and wishlists" },
  { id: "read", key: "read", label: "Read", hint: "Open the commonplace book" },
  { id: "jukebox", key: "jukebox", label: "Listen", hint: "Open the jukebox" },
];

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, activate: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activate();
}

function Contour({ active, aspectHeight, contour, hint, onActivate }: { active: boolean; aspectHeight: number; contour: HotspotContour; hint: string; onActivate: () => void }) {
  const yScale = aspectHeight / 100;
  return (
    <g className="room-contour" role="button" tabIndex={0} aria-label={hint} aria-pressed={active} onClick={onActivate} onKeyDown={(event) => activateWithKeyboard(event, onActivate)}>
      <path className="room-contour-hit" d={contour.path} transform={`scale(1 ${yScale})`} />
      <path className="room-contour-line" d={contour.path} transform={`scale(1 ${yScale})`} />
      <g className="room-contour-marker" transform={`translate(${contour.labelX} ${contour.labelY * yScale})`} aria-hidden="true">
        <circle r="1.45" />
      </g>
    </g>
  );
}

export function RecRoomDiorama({ active, activeChapter, enabledComponents, onHotspot, onReady, templateId }: Props) {
  const room = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const selectedTemplate = getRoomTemplate(templateId);
  const hotspots = hotspotDefinitions.filter((item) => enabledComponents.includes(item.id));

  useEffect(() => {
    const image = artwork.current;
    if (!image) return;
    if (image.complete) { onReady(); return; }
    image.addEventListener("load", onReady, { once: true });
    image.addEventListener("error", onReady, { once: true });
    return () => { image.removeEventListener("load", onReady); image.removeEventListener("error", onReady); };
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
    const reset = () => { node.style.setProperty("--room-x", "0px"); node.style.setProperty("--room-y", "0px"); };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => { observer.disconnect(); node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", reset); };
  }, []);

  const contours = (mode: "desktop" | "mobile", aspectHeight: number) => (
    <svg className={`room-contours room-contours-${mode}`} viewBox={`0 0 100 ${aspectHeight}`} preserveAspectRatio="none" aria-label="Objects in the recreation room">
      {hotspots.map(({ chapter, id, key, hint }) => {
        const layout = selectedTemplate.contours[mode];
        const contour = id === "library" ? layout.library[chapter ?? 0] : layout[id];
        return <Contour active={active === id && (id !== "library" || activeChapter === chapter)} aspectHeight={aspectHeight} contour={contour} hint={hint} key={key} onActivate={() => onHotspot(id, chapter)} />;
      })}
    </svg>
  );

  return (
    <div className="room-diorama" ref={room}>
      <div className="room-plane" ref={plane}>
        <picture className="room-art"><source media="(max-width: 760px)" srcSet={selectedTemplate.mobile} /><img ref={artwork} src={selectedTemplate.desktop} alt={`${selectedTemplate.name} recreation room`} /></picture>
        {selectedTemplate.id === "monsoon-study" && <><div className="room-window-loop" aria-hidden="true" /><div className="room-steam" aria-hidden="true"><i /><i /><i /></div></>}
        {contours("desktop", 56.25)}
        {contours("mobile", 177.7778)}
      </div>
    </div>
  );
}
