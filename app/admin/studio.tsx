"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_ROOM_TEMPLATES, getRoomTemplate, ROOM_COMPONENTS, type RoomComponent } from "@/lib/room-templates";

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
type StudioConfiguration = { ownerName?: string; title?: string; locationLabel?: string; background?: { templateId?: string; theme?: string }; objectVariation?: { enabledComponents?: RoomComponent[]; markers?: string } };

export function AdminStudio({ slug = "akshat", ownerName = "Akshat Kadam", initialContent, initialConfiguration }: { slug?: string; ownerName?: string; initialContent?: StudioContent; initialConfiguration?: StudioConfiguration }) {
  const readStoredEntry = (targetSection: (typeof sections)[number], targetIndex: number) => {
    const position = targetSection.offset + targetIndex;
    return targetSection.storageId.startsWith("library:")
      ? initialContent?.libraryVolumes?.[Number(targetSection.storageId.split(":")[1])]?.chapters?.[position]
      : initialContent?.roomCollections?.[targetSection.storageId]?.chapters?.[position];
  };
  const initialEntry = readStoredEntry(sections[1], 0);
  const [sectionId, setSectionId] = useState("recommendations");
  const [appearanceMode, setAppearanceMode] = useState(false);
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
  const [roomOwner, setRoomOwner] = useState(initialConfiguration?.ownerName ?? ownerName);
  const [roomTitle, setRoomTitle] = useState(initialConfiguration?.title ?? "The Rec Room");
  const [locationLabel, setLocationLabel] = useState(initialConfiguration?.locationLabel ?? "My corner of the internet");
  const [theme, setTheme] = useState(initialConfiguration?.background?.theme ?? "monsoon-walnut");
  const [templateId, setTemplateId] = useState(initialConfiguration?.background?.templateId ?? "monsoon-study");
  const [markerStyle, setMarkerStyle] = useState(initialConfiguration?.objectVariation?.markers ?? "ember");
  const [enabledComponents, setEnabledComponents] = useState<RoomComponent[]>(initialConfiguration?.objectVariation?.enabledComponents ?? [...ROOM_COMPONENTS]);
  const loadEditor = (targetSection: (typeof sections)[number], targetIndex: number) => { const targetEntry = readStoredEntry(targetSection, targetIndex); const fallbackTitle = sampleEntries[targetSection.id]?.[targetIndex] ?? "Untitled entry"; setTitle(targetEntry?.title ?? fallbackTitle); setSummary(targetEntry?.summary ?? `Add the short description shown inside ${targetSection.title}.`); setLongform(targetEntry?.longform?.join("\n\n") ?? ""); setHref(targetEntry?.href ?? ""); };
  const chooseSection = (id: string) => { const targetSection = sections.find((item) => item.id === id) ?? sections[1]; setAppearanceMode(false); setSectionId(id); setEntryIndex(0); loadEditor(targetSection, 0); setNotice(""); };
  const chooseEntry = (index: number) => { setEntryIndex(index); loadEditor(section, index); };
  const previewAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const publish = async () => {
    setNotice("SAVING…");
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ sectionId: section.storageId, entryIndex: section.offset + entryIndex, entry: { title, summary, longform, href, meta: storedEntry?.meta ?? "CURATED" } }) });
    previewAction(response.ok ? "Published to your room." : "Unable to publish. Please sign in again.");
  };
  const publishAppearance = async () => {
    setNotice("SAVING APPEARANCE…");
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerName: roomOwner, title: roomTitle, locationLabel, theme, templateId, markerStyle, enabledComponents }) });
    previewAction(response.ok ? "Room appearance published." : "Unable to update appearance.");
  };

  return <main className="admin-studio">
    <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>{ownerName.toUpperCase()} / CONTROL ROOM</span><strong>THE REC ROOM STUDIO</strong></div><nav><span>AUTHENTICATED</span><Link href={`/${slug}`}>View room ↗</Link></nav></header>
    <div className="admin-workspace">
      <aside className="admin-sections"><div><span>ROOM STUDIO</span><button type="button" onClick={() => previewAction("Collection creation is coming next.")}>＋</button></div><nav><button type="button" className={appearanceMode ? "is-active" : ""} onClick={() => { setAppearanceMode(true); setNotice(""); }}><i>00</i><span><small>ROOM</small><strong>Appearance</strong></span><b>✦</b></button>{sections.map((item) => <button type="button" key={item.id} className={!appearanceMode && sectionId === item.id ? "is-active" : ""} onClick={() => chooseSection(item.id)}><i>{item.number}</i><span><small>{item.group}</small><strong>{item.title}</strong></span><b>{item.source === "AUTOMATED" ? "↻" : String(sampleEntries[item.id]?.length ?? 0).padStart(2, "0")}</b></button>)}</nav><footer><span>DATABASE</span><strong>CONNECTED</strong><small>TENANT: /{slug}</small></footer></aside>
      <section className="admin-index">{appearanceMode ? <><header><span>ROOM / 00</span><h1>Templates</h1><p>{ALL_ROOM_TEMPLATES.length} ROOMS</p></header><div className="template-picker">{ALL_ROOM_TEMPLATES.map((roomTemplate) => <button type="button" key={roomTemplate.id} className={templateId === roomTemplate.id ? "is-active" : ""} onClick={() => setTemplateId(roomTemplate.id)}><img src={roomTemplate.desktop} alt="" /><span><strong>{roomTemplate.name}</strong><small>DESKTOP + MOBILE</small></span></button>)}</div></> : <><header><span>{section.group} / {section.number}</span><h1>{section.title}</h1><p>{section.source} SOURCE</p></header><button className="admin-new" type="button" onClick={() => previewAction("Entry creation is coming next.")}>＋ NEW ENTRY</button><ol>{entries.map((entryTitle, index) => <li key={entryTitle}><button type="button" className={entryIndex === index ? "is-active" : ""} onClick={() => chooseEntry(index)}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{entryTitle}</strong><small>PUBLISHED · MONGODB</small></span><b>›</b></button></li>)}</ol></>}</section>
      <section className="admin-editor"><header><div><span>{appearanceMode ? "ROOM DESIGN" : "ENTRY EDITOR"}</span><strong>{appearanceMode ? getRoomTemplate(templateId).name : title}</strong></div><div><button type="button" onClick={() => window.open(`/${slug}`, "_blank")}>PREVIEW</button><button className="admin-publish" type="button" onClick={appearanceMode ? publishAppearance : publish}>PUBLISH</button></div></header>{appearanceMode ? <form className="appearance-form" onSubmit={(event) => event.preventDefault()}><div className={`appearance-preview room-theme-${theme} room-markers-${markerStyle}`}><picture><source media="(max-width: 650px)" srcSet={getRoomTemplate(templateId).mobile} /><img src={getRoomTemplate(templateId).desktop} alt={`${getRoomTemplate(templateId).name} preview`} /></picture><span>{locationLabel}</span><i>{getRoomTemplate(templateId).name}</i></div><label><span>ROOM TITLE</span><input value={roomTitle} maxLength={80} onChange={(event) => setRoomTitle(event.target.value)} /></label><div className="admin-form-row"><label><span>OWNER DISPLAY NAME</span><input value={roomOwner} maxLength={80} onChange={(event) => setRoomOwner(event.target.value)} /></label><label><span>LOCATION / MOOD LABEL</span><input value={locationLabel} maxLength={100} onChange={(event) => setLocationLabel(event.target.value)} /></label></div><fieldset className="component-toggles"><legend>ROOM COMPONENTS</legend>{ROOM_COMPONENTS.map((component) => <label key={component}><input type="checkbox" checked={enabledComponents.includes(component)} onChange={() => setEnabledComponents((current) => current.includes(component) ? current.filter((item) => item !== component) : [...current, component])} /><span>{component === "watch" ? "TV" : component === "play" ? "Console" : component === "read" ? "Coffee table" : component[0].toUpperCase() + component.slice(1)}</span><small>{component === "jukebox" ? "PLAYER COMING NEXT" : "PUBLIC HOTSPOT"}</small></label>)}</fieldset><div className="admin-form-row"><label><span>ATMOSPHERE</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="monsoon-walnut">Natural</option><option value="midnight-blue">Midnight</option><option value="amber-evening">Amber evening</option></select></label><label><span>OBJECT MARKERS</span><select value={markerStyle} onChange={(event) => setMarkerStyle(event.target.value)}><option value="ember">Ember red</option><option value="brass">Brass gold</option><option value="quiet">Quiet cream</option></select></label></div><small className="appearance-help">Each room has calibrated desktop and mobile hotspots. Disabled components disappear from the public room; the Jukebox toggle is ready for the upcoming player.</small></form> : <form onSubmit={(event) => event.preventDefault()}><label><span>TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="admin-form-row"><label><span>STATUS</span><select defaultValue="published"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label><span>ORDER</span><input type="number" value={entryIndex + 1} readOnly /></label></div><label><span>SUMMARY</span><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></label><label><span>LONG-FORM CONTENT</span><textarea className="admin-body-field" rows={10} value={longform} onChange={(event) => setLongform(event.target.value)} placeholder="Write the complete chapter here." /></label><div className="admin-form-row"><label><span>EXTERNAL URL</span><input value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://" /></label><label><span>TAGS</span><input placeholder="personal, favourite" /></label></div></form>}{notice && <div className="admin-notice" role="status">{notice}</div>}</section>
    </div>
  </main>;
}
