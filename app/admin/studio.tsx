"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const sections = [
  { id: "writing", storageId: "library:0", offset: 0, number: "01", group: "LIBRARY", title: "Substack Writing", source: "AUTOMATED" },
  { id: "recommendations", storageId: "library:1", offset: 0, number: "02", group: "LIBRARY", title: "Recommendations", source: "CURATED" },
  { id: "books", storageId: "library:2", offset: 0, number: "03", group: "LIBRARY", title: "Books & Manga", source: "CURATED" },
  { id: "ideas", storageId: "library:3", offset: 0, number: "04", group: "LIBRARY", title: "Interests & Ideas", source: "CURATED" },
  { id: "watch", storageId: "watch", offset: 0, number: "05", group: "TV", title: "Watch", source: "CURATED" },
  { id: "played", storageId: "play", offset: 0, number: "06", group: "CONSOLE", title: "Played", source: "CURATED" },
  { id: "wishlist", storageId: "play", offset: 1, number: "07", group: "CONSOLE", title: "Wishlist", source: "CURATED" },
  { id: "commonplace", storageId: "read", offset: 0, number: "08", group: "TABLE", title: "Commonplace Book", source: "CURATED" },
] as const;

const sampleEntries: Record<string, string[]> = {
  writing: ["Feed-managed chapters"], recommendations: ["Books Worth Keeping", "Films Worth Arguing About", "Games Worth Disappearing Into"],
  books: ["Reading Notes", "Manga", "Reading List"], ideas: ["AI & Product Systems", "Education & Learning", "World-building & Visual Culture"],
  watch: ["Films", "Television", "Anime", "Watchlist"], played: ["Played & Remembered"], wishlist: ["Wishlist"], commonplace: ["From the Internet", "Medium", "Marginalia"],
};

type StudioEntry = { title?: string; summary?: string; meta?: string; href?: string; longform?: string[] };
type StudioContent = { libraryVolumes?: { chapters?: StudioEntry[] }[]; roomCollections?: Record<string, { chapters?: StudioEntry[] }> };

export function AdminStudio({ slug = "akshat", ownerName = "Akshat Kadam", initialContent }: { slug?: string; ownerName?: string; initialContent?: StudioContent }) {
  const readStoredEntry = (targetSection: (typeof sections)[number], targetIndex: number) => {
    const position = targetSection.offset + targetIndex;
    return targetSection.storageId.startsWith("library:")
      ? initialContent?.libraryVolumes?.[Number(targetSection.storageId.split(":")[1])]?.chapters?.[position]
      : initialContent?.roomCollections?.[targetSection.storageId]?.chapters?.[position];
  };
  const initialEntry = readStoredEntry(sections[1], 0);
  const [sectionId, setSectionId] = useState("recommendations");
  const [entryIndex, setEntryIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const section = sections.find((item) => item.id === sectionId) ?? sections[1];
  const entries = useMemo(() => sampleEntries[sectionId] ?? [], [sectionId]);
  const entry = entries[Math.min(entryIndex, Math.max(entries.length - 1, 0))] ?? "Untitled entry";
  const storedEntry = useMemo(() => {
    const position = section.offset + entryIndex;
    return section.storageId.startsWith("library:")
      ? initialContent?.libraryVolumes?.[Number(section.storageId.split(":")[1])]?.chapters?.[position]
      : initialContent?.roomCollections?.[section.storageId]?.chapters?.[position];
  }, [entryIndex, initialContent, section]);
  const [title, setTitle] = useState(initialEntry?.title ?? entry);
  const [summary, setSummary] = useState(initialEntry?.summary ?? `Add the short description shown inside ${sections[1].title}.`);
  const [longform, setLongform] = useState(initialEntry?.longform?.join("\n\n") ?? "");
  const [href, setHref] = useState(initialEntry?.href ?? "");
  const loadEditor = (targetSection: (typeof sections)[number], targetIndex: number) => { const targetEntry = readStoredEntry(targetSection, targetIndex); const fallbackTitle = sampleEntries[targetSection.id]?.[targetIndex] ?? "Untitled entry"; setTitle(targetEntry?.title ?? fallbackTitle); setSummary(targetEntry?.summary ?? `Add the short description shown inside ${targetSection.title}.`); setLongform(targetEntry?.longform?.join("\n\n") ?? ""); setHref(targetEntry?.href ?? ""); };
  const chooseSection = (id: string) => { const targetSection = sections.find((item) => item.id === id) ?? sections[1]; setSectionId(id); setEntryIndex(0); loadEditor(targetSection, 0); setNotice(""); };
  const chooseEntry = (index: number) => { setEntryIndex(index); loadEditor(section, index); };
  const previewAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const publish = async () => {
    setNotice("SAVING…");
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ sectionId: section.storageId, entryIndex: section.offset + entryIndex, entry: { title, summary, longform, href, meta: storedEntry?.meta ?? "CURATED" } }) });
    previewAction(response.ok ? "Published to your room." : "Unable to publish. Please sign in again.");
  };

  return <main className="admin-studio">
    <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>{ownerName.toUpperCase()} / CONTROL ROOM</span><strong>THE REC ROOM STUDIO</strong></div><nav><span>AUTHENTICATED</span><Link href={`/${slug}`}>View room ↗</Link></nav></header>
    <div className="admin-workspace">
      <aside className="admin-sections"><div><span>CONTENT MAP</span><button type="button" onClick={() => previewAction("Collection creation is coming next.")}>＋</button></div><nav>{sections.map((item) => <button type="button" key={item.id} className={sectionId === item.id ? "is-active" : ""} onClick={() => chooseSection(item.id)}><i>{item.number}</i><span><small>{item.group}</small><strong>{item.title}</strong></span><b>{item.source === "AUTOMATED" ? "↻" : String(sampleEntries[item.id]?.length ?? 0).padStart(2, "0")}</b></button>)}</nav><footer><span>DATABASE</span><strong>CONNECTED</strong><small>TENANT: /{slug}</small></footer></aside>
      <section className="admin-index"><header><span>{section.group} / {section.number}</span><h1>{section.title}</h1><p>{section.source} SOURCE</p></header><button className="admin-new" type="button" onClick={() => previewAction("Entry creation is coming next.")}>＋ NEW ENTRY</button><ol>{entries.map((entryTitle, index) => <li key={entryTitle}><button type="button" className={entryIndex === index ? "is-active" : ""} onClick={() => chooseEntry(index)}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{entryTitle}</strong><small>PUBLISHED · MONGODB</small></span><b>›</b></button></li>)}</ol></section>
      <section className="admin-editor"><header><div><span>ENTRY EDITOR</span><strong>{title}</strong></div><div><button type="button" onClick={() => window.open(`/${slug}`, "_blank")}>PREVIEW</button><button className="admin-publish" type="button" onClick={publish}>PUBLISH</button></div></header><form onSubmit={(event) => event.preventDefault()}><label><span>TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="admin-form-row"><label><span>STATUS</span><select defaultValue="published"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label><span>ORDER</span><input type="number" value={entryIndex + 1} readOnly /></label></div><label><span>SUMMARY</span><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></label><label><span>LONG-FORM CONTENT</span><textarea className="admin-body-field" rows={10} value={longform} onChange={(event) => setLongform(event.target.value)} placeholder="Write the complete chapter here." /></label><div className="admin-form-row"><label><span>EXTERNAL URL</span><input value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://" /></label><label><span>TAGS</span><input placeholder="personal, favourite" /></label></div></form>{notice && <div className="admin-notice" role="status">{notice}</div>}</section>
    </div>
  </main>;
}
