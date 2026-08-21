"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type OwnerNote = { id: string; authorName: string; message: string; createdAt: string; visibility: "public" | "private"; moderationStatus: "visible" | "hidden"; reportCount: number };

export function NotesStudio({ embedded = false, initialNotes = [], ownerName, slug }: { embedded?: boolean; initialNotes?: OwnerNote[]; ownerName: string; slug: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [filter, setFilter] = useState<"all" | "public" | "private" | "hidden">("all");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (initialNotes.length) return; fetch(`/api/tenants/${slug}/admin/notes`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setNotes(data.notes ?? [])).catch(() => setNotice("Unable to load visitor notes.")); }, [initialNotes.length, slug]);
  const shown = useMemo(() => notes.filter((note) => filter === "all" || filter === "hidden" ? filter === "all" || note.moderationStatus === "hidden" : note.visibility === filter), [filter, notes]);
  const moderate = async (note: OwnerNote, moderationStatus: "visible" | "hidden") => {
    const response = await fetch(`/api/tenants/${slug}/admin/notes`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: note.id, moderationStatus }) });
    if (response.ok) setNotes((current) => current.map((item) => item.id === note.id ? { ...item, moderationStatus } : item));
    setNotice(response.ok ? moderationStatus === "hidden" ? "Note hidden from the public room." : "Note restored." : "Unable to moderate that note.");
  };
  const remove = async (note: OwnerNote) => {
    if (!window.confirm("Permanently delete this note? This cannot be undone.")) return;
    const response = await fetch(`/api/tenants/${slug}/admin/notes?id=${encodeURIComponent(note.id)}`, { method: "DELETE" });
    if (response.ok) setNotes((current) => current.filter((item) => item.id !== note.id));
    setNotice(response.ok ? "Note permanently deleted." : "Unable to delete that note.");
  };
  return <main className={`notes-studio ${embedded ? "notes-studio-embedded" : ""}`}>
    {!embedded && <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>{ownerName.toUpperCase()} / CONTROL ROOM</span><strong>VISITOR NOTES</strong></div><nav><Link href={`/${slug}/admin`}>Studio</Link><Link href={`/${slug}`}>View room ↗</Link></nav></header>}
    <section className="notes-studio-heading"><span>INBOX / @{slug}</span><h1>Things people left behind.</h1><p>Private notes stay here. Hide public notes from the guestbook or delete anything that does not belong.</p></section>
    <nav className="notes-filters" aria-label="Filter notes">{(["all", "public", "private", "hidden"] as const).map((value) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{value.toUpperCase()} <span>{value === "all" ? notes.length : value === "hidden" ? notes.filter((note) => note.moderationStatus === "hidden").length : notes.filter((note) => note.visibility === value).length}</span></button>)}</nav>
    {notice && <p className="notes-studio-notice" role="status">{notice}</p>}
    <ol className="notes-studio-list">{shown.map((note) => <li key={note.id} className={note.moderationStatus === "hidden" ? "is-hidden" : ""}><header><span className={`note-visibility note-visibility-${note.visibility}`}>{note.visibility.toUpperCase()}</span>{note.reportCount > 0 && <b>{note.reportCount} REPORT{note.reportCount === 1 ? "" : "S"}</b>}<time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time></header><blockquote>{note.message}</blockquote><footer><strong>— {note.authorName}</strong><div>{note.visibility === "public" && <button type="button" onClick={() => void moderate(note, note.moderationStatus === "visible" ? "hidden" : "visible")}>{note.moderationStatus === "visible" ? "HIDE" : "RESTORE"}</button>}<button className="note-delete" type="button" onClick={() => void remove(note)}>DELETE</button></div></footer></li>)}</ol>
    {!shown.length && <p className="notes-studio-empty">No notes in this view.</p>}
  </main>;
}
