"use client";

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { getRoomTemplate, type HotspotRect, type RoomComponent } from "@/lib/room-templates";
import { shapeToPath, type ContourDraft, type ContourMode, type ContourTarget } from "@/lib/contour-authoring";

export type RoomHotspot = "library" | "watch" | "play" | "read" | "jukebox" | "notes";

type Props = {
  active: RoomHotspot | null;
  activeChapter: number;
  enabledComponents: RoomComponent[];
  hotspotContours?: ContourDraft;
  onHotspot: (hotspot: RoomHotspot, chapter?: number) => void;
  onReady: () => void;
  templateId: string;
};

const hotspotDefinitions: Array<{ chapter?: number; id: RoomHotspot; key: string; label: string; hint: string }> = [
  { id: "library", key: "writing", chapter: 0, label: "Writing", hint: "Open the Substack Writing volume" },
  { id: "library", key: "recommendations", chapter: 1, label: "Recs", hint: "Open the Recommendations volume" },
  { id: "library", key: "books", chapter: 2, label: "Books", hint: "Open the Books and Manga volume" },
  { id: "library", key: "interests", chapter: 3, label: "Ideas", hint: "Open the Interests and Ideas volume" },
  { id: "watch", key: "watch", label: "Watch", hint: "Open films, television, and anime" },
  { id: "play", key: "play", label: "Play", hint: "Open games and wishlists" },
  { id: "read", key: "read", label: "Read", hint: "Open the commonplace book" },
  { id: "jukebox", key: "jukebox", label: "Listen", hint: "Open the jukebox" },
  { id: "notes", key: "notes", label: "Notes", hint: "Open the visitor guestbook" },
];

type HotspotStyle = CSSProperties & Record<`--${"desktop" | "mobile"}-${"left" | "top" | "width" | "height"}`, string>;
const value = (number: number) => `${number}%`;
function hotspotStyle(desktop: HotspotRect, mobile: HotspotRect): HotspotStyle {
  return { "--desktop-left": value(desktop.left), "--desktop-top": value(desktop.top), "--desktop-width": value(desktop.width), "--desktop-height": value(desktop.height), "--mobile-left": value(mobile.left), "--mobile-top": value(mobile.top), "--mobile-width": value(mobile.width), "--mobile-height": value(mobile.height) };
}
function libraryChapterRect(rectangle: HotspotRect, index: number, axis: "x" | "y") {
  return axis === "x" ? { ...rectangle, left: rectangle.left + rectangle.width * index / 4, width: rectangle.width / 4 } : { ...rectangle, top: rectangle.top + rectangle.height * index / 4, height: rectangle.height / 4 };
}
function activateContour(event: KeyboardEvent<SVGGElement>, activate: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activate();
}
function pathCenter(path: string) {
  const values = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const points = Array.from({ length: Math.floor(values.length / 2) }, (_, index) => ({ x: values[index * 2], y: values[index * 2 + 1] }));
  if (!points.length) return { x: 50, y: 50 };
  return { x: (Math.min(...points.map((point) => point.x)) + Math.max(...points.map((point) => point.x))) / 2, y: (Math.min(...points.map((point) => point.y)) + Math.max(...points.map((point) => point.y))) / 2 };
}

export function RecRoomDiorama({ active, activeChapter, enabledComponents, hotspotContours, onHotspot, onReady, templateId }: Props) {
  const room = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const selectedTemplate = getRoomTemplate(templateId);
  const hotspots = hotspotDefinitions.filter((item) => enabledComponents.includes(item.id));
  const contourFor = (mode: ContourMode, id: RoomHotspot, chapter?: number) => {
    const target = (id === "library" ? `library-${chapter ?? 0}` : id) as ContourTarget;
    const custom = hotspotContours?.[mode][target]?.map(shapeToPath).filter(Boolean).join(" ");
    if (custom) return custom;
    const defaults = selectedTemplate.contours?.[mode];
    if (id === "library") return defaults?.library[chapter ?? 0]?.path;
    if (defaults?.[id]?.path) return defaults[id]!.path;
    if (id === "notes") {
      const bounds = selectedTemplate.layout[mode].notes;
      return `M${bounds.left} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top + bounds.height} L${bounds.left} ${bounds.top + bounds.height} Z`;
    }
    return undefined;
  };

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
          <source media="(max-width: 760px)" srcSet={selectedTemplate.mobile} />
          <img ref={artwork} src={selectedTemplate.desktop} alt={`${selectedTemplate.name} recreation room`} />
        </picture>
        {selectedTemplate.id === "monsoon-study" && <><div className="room-window-loop" aria-hidden="true" /><div className="room-steam" aria-hidden="true"><i /><i /><i /></div></>}
        {(["desktop", "mobile"] as const).map((mode) => {
          const aspectHeight = mode === "desktop" ? 56.25 : 177.7778;
          const yScale = aspectHeight / 100;
          const traced = hotspots.filter(({ chapter, id }) => Boolean(contourFor(mode, id, chapter)));
          if (!traced.length) return null;
          return (
            <svg className={`room-traced-hotspots room-traced-hotspots-${mode}`} viewBox={`0 0 100 ${aspectHeight}`} preserveAspectRatio="none" aria-label="Objects in the recreation room" key={mode}>
              {traced.map(({ chapter, id, key, hint }) => {
                const contour = contourFor(mode, id, chapter)!;
                const definition = hotspotDefinitions.find((item) => item.key === key)!;
                const marker = pathCenter(contour);
                const number = id === "library" ? `B${(chapter ?? 0) + 1}` : id === "watch" ? "05" : id === "play" ? "06" : id === "read" ? "08" : id === "jukebox" ? "09" : "10";
                const badgeWidth = Math.max(3.8, definition.label.length * .53 + 1.5);
                const activate = () => onHotspot(id, chapter);
                return (
                  <g className="room-traced-hotspot" role="button" tabIndex={0} aria-label={hint} aria-pressed={active === id && (id !== "library" || activeChapter === chapter)} onClick={activate} onKeyDown={(event) => activateContour(event, activate)} key={key}>
                    <path className="room-traced-hit" d={contour} transform={`scale(1 ${yScale})`} />
                    <path className="room-traced-line" d={contour} transform={`scale(1 ${yScale})`} />
                    <g className="room-traced-marker" transform={`translate(${marker.x} ${marker.y * yScale})`} aria-hidden="true">
                      <circle r="1.05" /><text className="room-traced-number" textAnchor="middle" dominantBaseline="central" fontSize=".43">{number}</text>
                      <rect x="1.45" y="-1" width={badgeWidth} height="2" rx=".28" />
                      <text className="room-traced-label" x="2.05" dominantBaseline="central" fontSize=".58">{definition.label}</text>
                    </g>
                  </g>
                );
              })}
            </svg>
          );
        })}
        {(["desktop", "mobile"] as const).map((mode) => <div className={`room-hotspots room-hotspots-mode-${mode}`} aria-label={`Objects in the recreation room (${mode})`} key={mode}>
          {hotspots.filter(({ chapter, id }) => !contourFor(mode, id, chapter)).map(({ chapter, id, key, label, hint }, index) => {
            const desktopRect = id === "library" ? libraryChapterRect(selectedTemplate.layout.desktop.library, chapter ?? 0, selectedTemplate.libraryAxis) : selectedTemplate.layout.desktop[id];
            const mobileRect = id === "library" ? libraryChapterRect(selectedTemplate.layout.mobile.library, chapter ?? 0, selectedTemplate.libraryAxis) : selectedTemplate.layout.mobile[id];
            return (
            <button
              className={`room-hotspot room-hotspot-template room-hotspot-${key}`}
              key={key}
              style={hotspotStyle(desktopRect, mobileRect)}
              type="button"
              aria-label={hint}
              aria-pressed={active === id && (id !== "library" || activeChapter === chapter)}
              onClick={() => onHotspot(id, chapter)}
            >
              <span className="room-hotspot-number">{id === "library" ? `B${index + 1}` : `0${index - 2}`}</span>
              <span className="room-hotspot-label">{label}</span>
            </button>
          )})}
        </div>)}
      </div>
    </div>
  );
}
