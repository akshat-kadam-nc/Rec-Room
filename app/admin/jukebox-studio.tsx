"use client";

import Link from "next/link";
import { useState } from "react";
import type { RoomPlaylist } from "@/lib/playlists";

type PlaylistInput = Pick<RoomPlaylist, "id" | "title" | "url">;

export function JukeboxStudio({ slug, initialAutoplayPlaylistId, initialDraft, initialPublished, initialHasDraft, initialPlayerStyle }: { slug: string; initialAutoplayPlaylistId: string | null; initialDraft: RoomPlaylist[]; initialPublished: RoomPlaylist[]; initialHasDraft: boolean; initialPlayerStyle: "rec-room" | "saloon" }) {
  const [playlists, setPlaylists] = useState<PlaylistInput[]>(initialHasDraft ? initialDraft : initialPublished);
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [notice, setNotice] = useState("");
  const [playerStyle, setPlayerStyle] = useState(initialPlayerStyle);
  const [autoplayPlaylistId, setAutoplayPlaylistId] = useState(initialAutoplayPlaylistId ?? "");
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3000); };
  const update = (id: string, field: "title" | "url", value: string) => setPlaylists((current) => current.map((playlist) => playlist.id === id ? { ...playlist, [field]: value } : playlist));
  const add = () => setPlaylists((current) => [...current, { id: crypto.randomUUID(), title: "", url: "" }]);
  const remove = (id: string) => { setPlaylists((current) => current.filter((playlist) => playlist.id !== id)); if (autoplayPlaylistId === id) setAutoplayPlaylistId(""); };
  const save = async () => {
    setNotice("SAVING PLAYLIST DRAFT…");
    const response = await fetch(`/api/tenants/${slug}/playlists`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ playlists, playerStyle, autoplayPlaylistId: autoplayPlaylistId || null }) });
    const data = await response.json().catch(() => null) as { error?: string; playlists?: RoomPlaylist[] } | null;
    if (response.ok) { setHasDraft(true); if (data?.playlists) setPlaylists(data.playlists); }
    flash(response.ok ? "Playlist draft saved." : data?.error || "Unable to save playlists.");
  };
  const publish = async () => {
    setNotice("PUBLISHING JUKEBOX…");
    const response = await fetch(`/api/tenants/${slug}/playlists`, { method: "POST" });
    if (response.ok) setHasDraft(false);
    flash(response.ok ? "The Jukebox is now live." : "Save the playlist draft before publishing.");
  };

  return <main className="jukebox-studio-page">
    <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>@{slug.toUpperCase()} / CONTROL ROOM</span><strong>JUKEBOX STUDIO</strong></div><nav><Link href={`/${slug}/admin`}>← Studio</Link><Link href={`/${slug}`}>View room ↗</Link></nav></header>
    <section className="jukebox-studio-shell">
      <aside><span>JUKEBOX / 09</span><h1>Set the room&apos;s soundtrack.</h1><p>Add public Spotify or YouTube Music playlist URLs. Visitors choose what to play when they open the Jukebox.</p><div><strong>{initialPublished.length}</strong><small>PLAYLISTS LIVE</small></div><div><strong>{playlists.length}</strong><small>IN THIS {hasDraft ? "SAVED DRAFT" : "EDITOR"}</small></div><Link href={`/${slug}/admin`}>RETURN TO CONTROL ROOM</Link></aside>
      <div className="jukebox-studio-list"><header><div><span>PLAYLIST SOURCES</span><strong>{hasDraft ? "SAVED DRAFT / NOT LIVE" : "PUBLISHED STATE"}</strong></div><div><button type="button" onClick={add}>＋ ADD PLAYLIST</button><button type="button" onClick={save}>SAVE CHANGES</button><button type="button" disabled={!hasDraft} onClick={publish}>PUBLISH</button></div></header>
        <fieldset className="player-style-picker"><legend>PLAYER APPEARANCE</legend><label className={playerStyle === "rec-room" ? "is-selected" : ""}><input type="radio" name="playerStyle" value="rec-room" checked={playerStyle === "rec-room"} onChange={() => setPlayerStyle("rec-room")} /><span><strong>REC ROOM</strong><small>Framed, editorial and integrated with the room.</small></span><i className="player-style-rec-room">NOW PLAYING</i></label><label className={playerStyle === "saloon" ? "is-selected" : ""}><input type="radio" name="playerStyle" value="saloon" checked={playerStyle === "saloon"} onChange={() => setPlayerStyle("saloon")} /><span><strong>SALOON</strong><small>Compact dark pill with circular artwork and transport controls.</small></span><i className="player-style-saloon">▶</i></label></fieldset>
        <section className="jukebox-autoplay-setting"><div><span>ROOM ENTRY SOUNDTRACK</span><strong>AUTOPLAY PLAYLIST</strong><p>Start one published playlist when a visitor enters. Browsers may require the visitor&apos;s first interaction before unmuted audio can begin.</p></div><label><span>PLAY ON ENTRY</span><select value={autoplayPlaylistId} onChange={(event) => setAutoplayPlaylistId(event.target.value)}><option value="">Off — visitors choose</option>{playlists.filter((playlist) => playlist.title.trim()).map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.title}</option>)}</select></label></section>
        <ol>{playlists.map((playlist, index) => <li key={playlist.id}><i>{String(index + 1).padStart(2, "0")}</i><label><span>DISPLAY NAME</span><input value={playlist.title} maxLength={100} placeholder="Sunday morning records" onChange={(event) => update(playlist.id, "title", event.target.value)} /></label><label><span>PUBLIC PLAYLIST URL</span><input type="url" value={playlist.url} placeholder="https://music.youtube.com/playlist?list=…" onChange={(event) => update(playlist.id, "url", event.target.value)} /></label><button type="button" onClick={() => remove(playlist.id)}>REMOVE</button></li>)}</ol>
        {!playlists.length && <div className="jukebox-studio-empty"><strong>No playlists yet.</strong><p>Add a public YouTube Music or Spotify playlist to open the Jukebox.</p><button type="button" onClick={add}>＋ ADD THE FIRST PLAYLIST</button></div>}
      </div>
    </section>
    {notice && <div className="admin-notice" role="status">{notice}</div>}
  </main>;
}
