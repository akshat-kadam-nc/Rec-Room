"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookshelfScene } from "./bookshelf-scene";
import { cabinetNames, libraryVolumes, type LibraryVolume } from "./library-data";

export function Bookshelf() {
  const [cabinet, setCabinet] = useState(0);
  const [selected, setSelected] = useState<LibraryVolume | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [substackPosts, setSubstackPosts] = useState<Array<{ link: string; summary: string; title: string; type: string }>>([]);
  const openTimer = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const selectVolume = useCallback((volume: LibraryVolume) => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    setSelected(volume);
    setReaderOpen(false);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    openTimer.current = window.setTimeout(() => setReaderOpen(true), reducedMotion ? 0 : 620);
  }, []);
  const closeVolume = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    setReaderOpen(false);
    setSelected(null);
  }, []);
  const changeCabinet = (direction: number) => {
    closeVolume();
    setCabinet((current) => (current + direction + cabinetNames.length) % cabinetNames.length);
  };
  useEffect(() => {
    fetch("/api/library").then((response) => response.ok ? response.json() : null).then((data) => setSubstackPosts(data?.posts ?? [])).catch(() => undefined);
  }, []);
  useEffect(() => { if (readerOpen) closeButton.current?.focus(); }, [readerOpen]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected) closeVolume();
      if (!selected && event.key === "ArrowLeft") changeCabinet(-1);
      if (!selected && event.key === "ArrowRight") changeCabinet(1);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => () => { if (openTimer.current) window.clearTimeout(openTimer.current); }, []);
  const currentPost = selected?.source === "SUBSTACK" ? substackPosts.find((post) => post.type === selected.id) : undefined;

  return <main className="library-page">
    <header className="library-nav"><Link className="issue-mark" href="/" aria-label="Akshat Kadam, home"><img src="/favicon.svg" alt="" /></Link><p>PERSONAL ARCHIVE / THE LIBRARY</p><Link href="/">← Back to the story</Link></header>
    <section className="library-header"><div><p>SIDE STORY 01 / THE PERSONAL CANON</p><h1>THE LIBRARY</h1></div><p>Essays, philosophies, and notes arrive from Substack. Everything else is catalogued here.</p></section>
    <section className="library-stage" aria-label="Akshat's library" aria-describedby="library-instructions">
      <BookshelfScene cabinet={cabinet} onSelect={selectVolume} selectedId={selected?.id ?? null} />
      <div className="cabinet-label"><span>BOOKCASE 0{cabinet + 1}</span><strong>{cabinetNames[cabinet]}</strong></div>
      <button className="cabinet-arrow cabinet-prev" type="button" onClick={() => changeCabinet(-1)} aria-label="Previous bookcase">←</button>
      <button className="cabinet-arrow cabinet-next" type="button" onClick={() => changeCabinet(1)} aria-label="Next bookcase">→</button>
      <div className="cabinet-dots" aria-label="Choose bookcase">{cabinetNames.map((name, index) => <button key={name} className={index === cabinet ? "is-active" : ""} type="button" onClick={() => { closeVolume(); setCabinet(index); }} aria-label={`Open ${name} bookcase`} aria-current={index === cabinet ? "true" : undefined} />)}</div>
      <div className="spine-controls" aria-label={`Volumes in ${cabinetNames[cabinet]}`}>{libraryVolumes.filter((volume) => volume.cabinet === cabinet).map((volume) => <button key={volume.id} style={{ "--shelf": volume.shelf } as React.CSSProperties} type="button" onClick={() => selectVolume(volume)} aria-label={`Pull out ${volume.title}`}><span>{volume.title}</span></button>)}</div>
      <p className="library-hint" id="library-instructions">SELECT A TITLED SPINE · ARROW KEYS CHANGE BOOKCASES</p>
      {selected && !readerOpen && <p className="volume-in-flight" role="status">PULLING VOL. {selected.number} FROM THE SHELF…</p>}
      {selected && readerOpen && <article className="reading-overlay" role="dialog" aria-modal="true" aria-label={`${selected.title}, volume ${selected.number}`}>
        <button ref={closeButton} type="button" className="reading-close" onClick={closeVolume} aria-label="Return volume to shelf">×</button>
        <div className={`reading-cover reading-${selected.color}`}><span>VOL. {selected.number}</span><b>{selected.title}</b><i>私<br />物</i><small>AKSHAT KADAM</small></div>
        <div className="reading-gutter" aria-hidden="true" />
        <div className="reading-page"><div className="reading-meta"><span>{selected.type}</span><span>{selected.source === "SUBSTACK" ? "SYNCED FROM SUBSTACK" : "CURATED LOCALLY"}</span></div><p>{selected.kicker}</p><h2>{currentPost?.title ?? selected.title}</h2><div className="reading-rule"><span>{selected.number}</span></div>{currentPost ? <p className="reading-summary">{currentPost.summary}</p> : <ol>{selected.notes.map((note, index) => <li key={note}><span>0{index + 1}</span>{note}</li>)}</ol>}{currentPost ? <a className="reading-action" href={currentPost.link} target="_blank" rel="noreferrer">READ ON SUBSTACK ↗</a> : selected.source === "SUBSTACK" ? <span className="reading-status">ADD SUBSTACK_FEED_URL TO SYNC</span> : <span className="reading-status">CATALOGUE IN PROGRESS</span>}</div>
      </article>}
    </section>
    <section className="library-index">
      <div className="catalogue-heading"><div><p>THE CARD CATALOGUE</p><h2>FIND A VOLUME</h2></div><p>Every marked cover has a story inside. Browse the drawers or pull one directly from the shelf.</p></div>
      <div className="catalogue-drawer">{libraryVolumes.map((volume) => <button className={`catalogue-card catalogue-${volume.color}`} key={volume.id} type="button" onClick={() => { setCabinet(volume.cabinet); window.setTimeout(() => selectVolume(volume), 420); }}><i aria-hidden="true">{volume.number}</i><span>VOL. {volume.number}</span><strong>{volume.title}</strong><small>{cabinetNames[volume.cabinet]} · {volume.source === "SUBSTACK" ? "SUBSTACK" : "CURATED"}</small></button>)}</div>
    </section>
    <footer className="shelf-footer"><span>図書館 / TOSHOKAN</span><p>MORE SHELVES.<br />MORE SIDE STORIES.</p><Link href="/">Return to Issue →</Link></footer>
  </main>;
}
