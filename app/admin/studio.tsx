"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const sections = [
  { id: "writing", number: "01", group: "LIBRARY", title: "Substack Writing", source: "AUTOMATED" },
  { id: "recommendations", number: "02", group: "LIBRARY", title: "Recommendations", source: "CURATED" },
  { id: "books", number: "03", group: "LIBRARY", title: "Books & Manga", source: "CURATED" },
  { id: "ideas", number: "04", group: "LIBRARY", title: "Interests & Ideas", source: "CURATED" },
  { id: "watch", number: "05", group: "TV", title: "Watch", source: "CURATED" },
  { id: "played", number: "06", group: "CONSOLE", title: "Played", source: "CURATED" },
  { id: "wishlist", number: "07", group: "CONSOLE", title: "Wishlist", source: "CURATED" },
  { id: "commonplace", number: "08", group: "TABLE", title: "Commonplace Book", source: "CURATED" },
] as const;

const sampleEntries: Record<string, string[]> = {
  writing: ["Feed-managed chapters"], recommendations: ["Books Worth Keeping", "Films Worth Arguing About", "Games Worth Disappearing Into"],
  books: ["Reading Notes", "Manga", "Reading List"], ideas: ["AI & Product Systems", "Education & Learning", "World-building & Visual Culture"],
  watch: ["Films", "Television", "Anime", "Watchlist"], played: ["Played & Remembered"], wishlist: ["Wishlist"], commonplace: ["From the Internet", "Medium", "Marginalia"],
};

export function AdminStudio() {
  const [sectionId, setSectionId] = useState("recommendations");
  const [entryIndex, setEntryIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const section = sections.find((item) => item.id === sectionId) ?? sections[1];
  const entries = useMemo(() => sampleEntries[sectionId] ?? [], [sectionId]);
  const entry = entries[Math.min(entryIndex, Math.max(entries.length - 1, 0))] ?? "Untitled entry";
  const chooseSection = (id: string) => { setSectionId(id); setEntryIndex(0); setNotice(""); };
  const previewAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };

  return <main className="admin-studio">
    <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Akshat Kadam, home"><img src="/favicon.svg" alt="" /></Link><div><span>PRIVATE ARCHIVE / CONTROL ROOM</span><strong>THE ARCHIVE STUDIO</strong></div><nav><span>LOCAL PREVIEW</span><Link href="/bookshelf">View room ↗</Link></nav></header>
    <div className="admin-workspace">
      <aside className="admin-sections"><div><span>CONTENT MAP</span><button type="button" onClick={() => previewAction("Storage must be connected before creating collections.")}>＋</button></div><nav>{sections.map((item) => <button type="button" key={item.id} className={sectionId === item.id ? "is-active" : ""} onClick={() => chooseSection(item.id)}><i>{item.number}</i><span><small>{item.group}</small><strong>{item.title}</strong></span><b>{item.source === "AUTOMATED" ? "↻" : String(sampleEntries[item.id]?.length ?? 0).padStart(2, "0")}</b></button>)}</nav><footer><span>DATABASE</span><strong>NOT CONNECTED</strong><small>MONGODB ATLAS + AUTH REQUIRED</small></footer></aside>
      <section className="admin-index"><header><span>{section.group} / {section.number}</span><h1>{section.title}</h1><p>{section.source} SOURCE</p></header><button className="admin-new" type="button" onClick={() => previewAction("Entry creation will activate after MongoDB is connected.")}>＋ NEW ENTRY</button><ol>{entries.map((title, index) => <li key={title}><button type="button" className={entryIndex === index ? "is-active" : ""} onClick={() => setEntryIndex(index)}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{title}</strong><small>DRAFT · UPDATED LOCALLY</small></span><b>›</b></button></li>)}</ol></section>
      <section className="admin-editor"><header><div><span>ENTRY EDITOR</span><strong>{entry}</strong></div><div><button type="button" onClick={() => previewAction("Preview generated locally.")}>PREVIEW</button><button className="admin-publish" type="button" onClick={() => previewAction("Publishing is disabled until MongoDB is connected.")}>PUBLISH</button></div></header><form onSubmit={(event) => event.preventDefault()}><label><span>TITLE</span><input key={`${sectionId}-${entry}`} defaultValue={entry} /></label><div className="admin-form-row"><label><span>STATUS</span><select defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label><span>ORDER</span><input type="number" defaultValue={entryIndex + 1} /></label></div><label><span>SUMMARY</span><textarea rows={4} defaultValue={`Add the short description shown inside ${section.title}.`} /></label><label><span>LONG-FORM CONTENT</span><textarea className="admin-body-field" rows={10} defaultValue="Write the complete chapter here. Markdown support will be enabled with the MongoDB-backed editor." /></label><div className="admin-form-row"><label><span>EXTERNAL URL</span><input placeholder="https://" /></label><label><span>TAGS</span><input placeholder="personal, favourite" /></label></div></form>{notice && <div className="admin-notice" role="status">{notice}</div>}</section>
    </div>
  </main>;
}
