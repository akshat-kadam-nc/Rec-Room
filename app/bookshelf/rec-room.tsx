"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecRoomDiorama, type RoomHotspot } from "./rec-room-diorama";
import { libraryVolumes as defaultLibraryVolumes, roomCollections as defaultRoomCollections, type LibraryVolume, type RoomChapter, type RoomCollection } from "./room-content";
import type { RoomComponent } from "@/lib/room-templates";
import type { RoomPlaylist } from "@/lib/playlists";
import { SaloonYouTubePlayer } from "./saloon-youtube-player";

type FeedPost = { content?: string; link: string; publishedAt?: string; source: "medium" | "substack"; summary: string; title: string; type: string };

type RecRoomProps = {
  enabledComponents?: RoomComponent[];
  city?: string;
  timeZone?: string;
  markerStyle?: string;
  ownerName?: string;
  roomTitle?: string;
  slug?: string;
  theme?: string;
  templateId?: string;
  volumes?: readonly LibraryVolume[];
  collections?: typeof defaultRoomCollections;
  playlists?: RoomPlaylist[];
  playerStyle?: "rec-room" | "saloon";
};

export function RecRoom({ city = "Mumbai", enabledComponents = ["library", "watch", "play", "read", "jukebox"], markerStyle = "ember", ownerName = "Akshat Kadam", roomTitle = "The Rec Room", slug = "akshat", theme = "monsoon-walnut", templateId = "monsoon-study", timeZone = "Asia/Kolkata", volumes = defaultLibraryVolumes, collections = defaultRoomCollections, playlists = [], playerStyle = "rec-room" }: RecRoomProps) {
  const [active, setActive] = useState<RoomHotspot | null>(null);
  const [chapter, setChapter] = useState(0);
  const [libraryVolume, setLibraryVolume] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedStates, setFeedStates] = useState<Record<"medium" | "substack", "loading" | "ready" | "missing" | "unavailable">>({ medium: "loading", substack: "loading" });
  const [loaded, setLoaded] = useState(false);
  const [clock, setClock] = useState("");
  const [activePlaylist, setActivePlaylist] = useState<RoomPlaylist | null>(null);
  const [playerOpen, setPlayerOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const page = useRef<HTMLElement>(null);
  const openHotspot = useCallback((hotspot: RoomHotspot, volume = 0) => { setLibraryVolume(hotspot === "library" ? volume : 0); setChapter(0); setExpanded(false); setActive(hotspot); }, []);
  const markLoaded = useCallback(() => setLoaded(true), []);
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await page.current?.requestFullscreen();
  }, []);

  useEffect(() => { if (active) closeButton.current?.focus(); }, [active]);
  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [timeZone]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      const target = event.target as HTMLElement | null;
      if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.metaKey && !event.altKey && !target?.matches("input, textarea, select, [contenteditable=true]")) { event.preventDefault(); void toggleFullscreen(); }
    };
    const fullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", keydown);
    document.addEventListener("fullscreenchange", fullscreenChange);
    return () => { window.removeEventListener("keydown", keydown); document.removeEventListener("fullscreenchange", fullscreenChange); };
  }, [toggleFullscreen]);
  useEffect(() => {
    if (!enabledComponents.includes("library") && !enabledComponents.includes("read")) {
      return;
    }
    fetch(`/api/library?tenant=${encodeURIComponent(slug)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      setFeedPosts(data.posts ?? []);
      setFeedStates({ medium: data.sources?.medium ?? "missing", substack: data.sources?.substack ?? (data.unavailable ? "unavailable" : data.configured ? "ready" : "missing") });
    }).catch(() => setFeedStates({ medium: "unavailable", substack: "unavailable" }));
  }, [enabledComponents, slug]);

  const selectedVolume = volumes[libraryVolume] ?? volumes[0];
  const collection: RoomCollection | null = active === "library" ? { eyebrow: selectedVolume.eyebrow, title: selectedVolume.title, chapters: selectedVolume.chapters } : active ? collections[active] ?? defaultRoomCollections[active] : null;
  const baseChapters = collection?.chapters ?? [];
  const sourcePosts = active === "library" && libraryVolume === 0 ? feedPosts.filter((post) => post.source === "substack") : active === "read" ? feedPosts.filter((post) => post.source === "medium") : [];
  const dynamicChapters = sourcePosts.map((post, index): RoomChapter => ({ id: `post-${index}`, title: post.title, eyebrow: `${post.type.toUpperCase()} / ${post.source.toUpperCase()}`, summary: post.summary, longform: post.content ? [post.content] : undefined, meta: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : post.source.toUpperCase(), href: post.link }));
  const chapters = active === "library" && dynamicChapters.length ? dynamicChapters : active === "read" && dynamicChapters.length ? [baseChapters[0], ...dynamicChapters, baseChapters[2]] : baseChapters;
  const currentChapter = chapters[Math.min(chapter, Math.max(chapters.length - 1, 0))];

  return <main className="rec-room-page" ref={page}>
    <section className={`rec-room-stage room-theme-${theme} room-markers-${markerStyle} ${loaded ? "is-loaded" : ""}`} aria-label="Interactive recreation room">
      <RecRoomDiorama active={active} activeChapter={libraryVolume} enabledComponents={enabledComponents} templateId={templateId} onHotspot={openHotspot} onReady={markLoaded} />
      <div className="room-identity"><Link href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>{ownerName.toUpperCase()} / @{slug}</span><strong>{roomTitle.toUpperCase()}</strong></div></div>
      <nav className="room-actions" aria-label="Room controls"><Link href={`/${slug}/admin`}>STUDIO</Link><Link href="/">REC ROOM</Link><button type="button" onClick={() => void toggleFullscreen()} aria-keyshortcuts="F">{isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"} <kbd>F</kbd></button></nav>
      <div className="room-loading" role="status" aria-live="polite"><i /><span>PREPARING THE ROOM</span><strong>雨の夜 / MUMBAI</strong></div>
      <div className="room-weather"><span>{city.toUpperCase()}</span><strong suppressHydrationWarning>{clock || "--:--:--"}</strong></div>
      <div className="room-legend" aria-label="Interactive objects">
        {(["library", "watch", "play", "read", "jukebox"] as const).filter((hotspot) => enabledComponents.includes(hotspot)).map((hotspot, index) => <button key={hotspot} type="button" onClick={() => openHotspot(hotspot)}><span>0{index + 1}</span>{collections[hotspot]?.title ?? defaultRoomCollections[hotspot].title}</button>)}
      </div>
      <p className="room-instruction">SELECT A MARKED OBJECT · ESC TO RETURN</p>
      {active === "jukebox" && <article className="jukebox-browser" role="dialog" aria-modal="true" aria-label="Jukebox playlists">
        <button ref={closeButton} type="button" onClick={() => setActive(null)} aria-label="Return to room">×</button>
        <header><span>JUKEBOX / @{slug}</span><h1>Choose the room&apos;s soundtrack.</h1><p>Public playlists selected by {ownerName}.</p></header>
        <ol>{playlists.length ? playlists.map((playlist, index) => <li key={playlist.id}><button type="button" onClick={() => { setActivePlaylist(playlist); setPlayerOpen(playerStyle === "rec-room" || playlist.provider === "spotify"); setActive(null); }}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{playlist.title}</strong><small>{playlist.provider === "youtube" ? "YOUTUBE MUSIC" : "SPOTIFY"}</small></span><b>PLAY ↗</b></button></li>) : <li className="jukebox-empty">The owner has not published a playlist yet.</li>}</ol>
      </article>}
      {active && active !== "jukebox" && collection && currentChapter && <article className={`room-interface room-interface-${active} ${expanded ? "is-reading" : ""}`} role="dialog" aria-modal="true" aria-label={collection.title}>
        <button ref={closeButton} type="button" onClick={() => setActive(null)} aria-label="Return to room">×</button>
        {active === "watch" ? <div className="watch-browser">
          <header><strong>AK! SCREEN</strong><nav aria-label="Watch categories">{chapters.map((item, index) => <button key={item.id} type="button" className={chapter === index ? "is-current" : ""} onClick={() => setChapter(index)}>{item.title}</button>)}</nav><span>● AK</span></header>
          <div className="watch-feature"><span>{currentChapter.eyebrow}</span><h1>{currentChapter.title}</h1><p>{currentChapter.summary}</p><button type="button">▶ BROWSE PICKS</button></div>
          <section className="watch-row"><h2>Recommended by {ownerName}</h2><div>{Array.from({ length: 6 }, (_, index) => <button type="button" key={index} style={{ "--card": index } as React.CSSProperties}><i>0{index + 1}</i><strong>{currentChapter.title} Pick</strong><small>CURATION SLOT</small></button>)}</div></section>
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
      {activePlaylist && playerStyle === "saloon" && activePlaylist.provider === "youtube" ? <SaloonYouTubePlayer playlist={activePlaylist} onClose={() => setActivePlaylist(null)} /> : activePlaylist ? <aside className={`room-player room-player-style-${playerStyle} room-player-${activePlaylist.provider} ${playerOpen ? "is-open" : ""}`} aria-label="Room music player">
        <div className="room-player-embed"><iframe src={activePlaylist.embedUrl} title={`${activePlaylist.title} player`} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager" /></div>
        {playerStyle === "saloon" ? <div className="spotify-glass-footer"><strong>{activePlaylist.title}</strong><small>SPOTIFY OFFICIAL PLAYER</small><Link href={activePlaylist.url} target="_blank" rel="noreferrer">SOURCE ↗</Link><button type="button" onClick={() => setActivePlaylist(null)} aria-label="Close player">×</button></div> : <div className="room-player-bar"><span className="room-player-pulse"><i /><i /><i /></span><div><small>NOW PLAYING / {activePlaylist.provider === "youtube" ? "YOUTUBE MUSIC" : "SPOTIFY"}</small><strong>{activePlaylist.title}</strong></div><Link href={activePlaylist.url} target="_blank" rel="noreferrer">SOURCE ↗</Link><button type="button" onClick={() => setPlayerOpen((value) => !value)}>{playerOpen ? "HIDE PLAYER" : "OPEN PLAYER"}</button><button type="button" onClick={() => setActivePlaylist(null)} aria-label="Stop and close player">×</button></div>}
      </aside> : null}
    </section>
  </main>;
}
