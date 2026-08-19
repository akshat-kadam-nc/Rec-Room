"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecRoomDiorama, type RoomHotspot } from "./rec-room-diorama";
import { libraryVolumes, roomCollections, type RoomChapter } from "./room-content";

type FeedPost = { content?: string; link: string; publishedAt?: string; source: "medium" | "substack"; summary: string; title: string; type: string };

export function RecRoom() {
  const [active, setActive] = useState<RoomHotspot | null>(null);
  const [chapter, setChapter] = useState(0);
  const [libraryVolume, setLibraryVolume] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedStates, setFeedStates] = useState<Record<"medium" | "substack", "loading" | "ready" | "missing" | "unavailable">>({ medium: "loading", substack: "loading" });
  const [loaded, setLoaded] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const openHotspot = useCallback((hotspot: RoomHotspot, volume = 0) => { setLibraryVolume(hotspot === "library" ? volume : 0); setChapter(0); setExpanded(false); setActive(hotspot); }, []);
  const markLoaded = useCallback(() => setLoaded(true), []);

  useEffect(() => { if (active) closeButton.current?.focus(); }, [active]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    fetch("/api/library").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      setFeedPosts(data.posts ?? []);
      setFeedStates({ medium: data.sources?.medium ?? "missing", substack: data.sources?.substack ?? (data.unavailable ? "unavailable" : data.configured ? "ready" : "missing") });
    }).catch(() => setFeedStates({ medium: "unavailable", substack: "unavailable" }));
  }, []);

  const selectedVolume = libraryVolumes[libraryVolume] ?? libraryVolumes[0];
  const collection = active === "library" ? { eyebrow: selectedVolume.eyebrow, title: selectedVolume.title, chapters: selectedVolume.chapters } : active ? roomCollections[active] : null;
  const baseChapters = collection?.chapters ?? [];
  const sourcePosts = active === "library" && libraryVolume === 0 ? feedPosts.filter((post) => post.source === "substack") : active === "read" ? feedPosts.filter((post) => post.source === "medium") : [];
  const dynamicChapters = sourcePosts.map((post, index): RoomChapter => ({ id: `post-${index}`, title: post.title, eyebrow: `${post.type.toUpperCase()} / ${post.source.toUpperCase()}`, summary: post.summary, longform: post.content ? [post.content] : undefined, meta: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : post.source.toUpperCase(), href: post.link }));
  const chapters = active === "library" && dynamicChapters.length ? dynamicChapters : active === "read" && dynamicChapters.length ? [baseChapters[0], ...dynamicChapters, baseChapters[2]] : baseChapters;
  const currentChapter = chapters[Math.min(chapter, Math.max(chapters.length - 1, 0))];

  return <main className="rec-room-page">
    <header className="rec-room-nav">
      <Link className="issue-mark" href="/" aria-label="Akshat Kadam, home"><img src="/favicon.svg" alt="" /></Link>
      <div><span>PERSONAL ARCHIVE / ROOM 01</span><strong>THE REC ROOM</strong></div>
      <nav><Link href="/bookshelf-archive">Previous concept</Link><Link href="/">Main issue</Link></nav>
    </header>
    <section className={`rec-room-stage ${loaded ? "is-loaded" : ""}`} aria-label="Interactive recreation room">
      <RecRoomDiorama active={active} activeChapter={libraryVolume} onHotspot={openHotspot} onReady={markLoaded} />
      <div className="room-loading" role="status" aria-live="polite"><i /><span>PREPARING THE ROOM</span><strong>雨の夜 / MUMBAI</strong></div>
      <div className="room-weather"><span>MUMBAI / MONSOON STUDY</span><strong>RAIN AT THE WINDOW</strong></div>
      <div className="room-legend" aria-label="Interactive objects">
        {(["library", "watch", "play", "read"] as const).map((hotspot, index) => <button key={hotspot} type="button" onClick={() => openHotspot(hotspot)}><span>0{index + 1}</span>{roomCollections[hotspot].title}</button>)}
      </div>
      <p className="room-instruction">SELECT A MARKED OBJECT · ESC TO RETURN</p>
      {active && collection && currentChapter && <article className={`room-interface room-interface-${active} ${expanded ? "is-reading" : ""}`} role="dialog" aria-modal="true" aria-label={collection.title}>
        <button ref={closeButton} type="button" onClick={() => setActive(null)} aria-label="Return to room">×</button>
        {active === "watch" ? <div className="watch-browser">
          <header><strong>AK! SCREEN</strong><nav aria-label="Watch categories">{chapters.map((item, index) => <button key={item.id} type="button" className={chapter === index ? "is-current" : ""} onClick={() => setChapter(index)}>{item.title}</button>)}</nav><span>● AK</span></header>
          <div className="watch-feature"><span>{currentChapter.eyebrow}</span><h1>{currentChapter.title}</h1><p>{currentChapter.summary}</p><button type="button">▶ BROWSE PICKS</button></div>
          <section className="watch-row"><h2>Recommended for Akshat</h2><div>{Array.from({ length: 6 }, (_, index) => <button type="button" key={index} style={{ "--card": index } as React.CSSProperties}><i>0{index + 1}</i><strong>{currentChapter.title} Pick</strong><small>CURATION SLOT</small></button>)}</div></section>
        </div> : active === "play" ? <div className="console-browser">
          <header><strong>AK! SWITCH</strong><nav aria-label="Game categories">{chapters.map((item, index) => <button key={item.id} type="button" className={chapter === index ? "is-current" : ""} onClick={() => setChapter(index)}>{item.title}</button>)}</nav><span>● 22:08</span></header>
          <div className="game-carousel" aria-label={`${currentChapter.title} games`}>{Array.from({ length: 5 }, (_, index) => <button type="button" key={index} className={index === 0 ? "is-selected" : ""} style={{ "--game": index } as React.CSSProperties}><i>0{index + 1}</i><strong>{index === 0 ? currentChapter.title : `Game Slot ${String(index + 1).padStart(2, "0")}`}</strong><small>{index === 0 ? currentChapter.meta : "ADD GAME"}</small></button>)}</div>
          <footer><p>{currentChapter.summary}</p><span>Ⓐ SELECT&nbsp;&nbsp; Ⓑ BACK</span></footer>
        </div> : <><aside>
          <span>{collection.eyebrow}</span>
          <h1>{collection.title}</h1>
          <ol>{chapters.map((item, index) => <li key={item.id}><button type="button" className={chapter === index ? "is-current" : ""} onClick={() => { setChapter(index); setExpanded(false); }}><i>{String(index + 1).padStart(2, "0")}</i>{item.title}</button></li>)}</ol>
        </aside>
        <section>
          <span>{currentChapter.eyebrow}</span>
          <h2>{currentChapter.title}</h2>
          <p>{active === "library" && currentChapter.id === "feed-status" && feedStates.substack === "loading" ? "Checking the publishing feed…" : active === "library" && currentChapter.id === "feed-status" && feedStates.substack === "missing" ? "The reading room is ready, but the Substack feed has not been connected yet." : active === "library" && currentChapter.id === "feed-status" && feedStates.substack === "unavailable" ? "The Substack feed is temporarily unavailable. The rest of the room remains open." : active === "read" && currentChapter.id === "medium" && feedStates.medium === "loading" ? "Checking the Medium feed…" : active === "read" && currentChapter.id === "medium" && feedStates.medium === "unavailable" ? "The Medium feed is temporarily unavailable. Saved reading remains accessible." : currentChapter.summary}</p>
          {expanded && currentChapter.longform?.map((paragraph, index) => <p className="room-longform" key={index}>{paragraph}</p>)}
          <small>{currentChapter.meta}</small>
          <div className="room-reader-actions">
            {currentChapter.longform?.length ? <button className="room-read-more" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "COLLAPSE" : "READ MORE"} <b>{expanded ? "↑" : "↓"}</b></button> : null}
            {currentChapter.href && <Link className="room-read-more" href={currentChapter.href} target={currentChapter.href.startsWith("http") ? "_blank" : undefined} rel={currentChapter.href.startsWith("http") ? "noreferrer" : undefined}>{currentChapter.href.startsWith("http") ? "OPEN ORIGINAL" : "OPEN FILE"} <b>↗</b></Link>}
          </div>
        </section></>}
      </article>}
    </section>
  </main>;
}
