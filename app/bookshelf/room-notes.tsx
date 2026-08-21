"use client";

import { useCallback, useEffect, useState } from "react";

type PublicNote = { id: string; authorName: string; message: string; createdAt: string };

export function RoomNotes({ onClose, ownerName, slug }: { onClose: () => void; ownerName: string; slug: string }) {
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const loadNotes = useCallback(async () => {
    const response = await fetch(`/api/tenants/${encodeURIComponent(slug)}/notes`);
    if (response.ok) setNotes((await response.json()).notes ?? []);
  }, [slug]);
  useEffect(() => { void fetch(`/api/tenants/${encodeURIComponent(slug)}/notes`).then(async (response) => { if (response.ok) setNotes((await response.json()).notes ?? []); }); }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSending(true); setStatus("DELIVERING…");
    const response = await fetch(`/api/tenants/${encodeURIComponent(slug)}/notes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ authorName, message, visibility }) });
    const result = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) { setStatus(result.error || "The note could not be delivered."); return; }
    setMessage(""); setStatus(visibility === "private" ? `Delivered privately to ${ownerName}.` : "Pinned to the public guestbook.");
    if (visibility === "public") await loadNotes();
  };

  const report = async (id: string) => {
    const response = await fetch(`/api/tenants/${encodeURIComponent(slug)}/notes/${id}/report`, { method: "POST" });
    setStatus(response.ok ? "Thanks. The owner will review that note." : "That report could not be sent.");
  };

  return <article className="room-notes-panel" role="dialog" aria-modal="true" aria-label={`Notes for ${ownerName}`}>
      <button className="room-notes-close" type="button" onClick={onClose} aria-label="Return to room">×</button>
      <header><span>GUESTBOOK / @{slug}</span><h1>Leave something thoughtful behind.</h1><p>Share a message or recommendation. Private notes go only to {ownerName}.</p></header>
      <form onSubmit={submit}>
        <label><span>YOUR NAME <small>OPTIONAL</small></span><input value={authorName} maxLength={48} onChange={(event) => setAuthorName(event.target.value)} placeholder="A visitor" /></label>
        <label><span>YOUR NOTE</span><textarea required minLength={2} maxLength={1200} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="A thought, a recommendation, a hello…" /></label>
        <fieldset><legend>WHO CAN READ IT?</legend><label><input aria-label="Public note" type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} /><span><strong>PUBLIC</strong><small>Appears in this guestbook</small></span></label><label><input aria-label="Private note" type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} /><span><strong>PRIVATE</strong><small>Only the room owner</small></span></label></fieldset>
        <button type="submit" disabled={sending}>{sending ? "DELIVERING…" : "LEAVE NOTE →"}</button>
        {status && <p className="room-notes-status" role="status">{status}</p>}
      </form>
      <section className="room-notes-wall"><div><span>PUBLIC NOTES</span><strong>{notes.length.toString().padStart(2, "0")}</strong></div>{notes.length ? <ol>{notes.map((note) => <li key={note.id}><p>{note.message}</p><footer><span>— {note.authorName}</span><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</time><button type="button" onClick={() => void report(note.id)}>REPORT</button></footer></li>)}</ol> : <p className="room-notes-empty">No public notes yet. You could leave the first.</p>}</section>
    </article>;
}
