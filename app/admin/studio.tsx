"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_ROOM_TEMPLATES, getRoomTemplate, ROOM_COMPONENTS, type RoomComponent } from "@/lib/room-templates";
import type { RoomPlaylist } from "@/lib/playlists";
import { ContourEditor } from "./contour-editor";
import type { ContourDraft } from "@/lib/contour-authoring";
import { NotesStudio } from "./notes-studio";
import { ProfileStudio } from "./profile-studio";
import type { TenantProfile } from "@/lib/profiles";

const sections = [
  { id: "writing", storageId: "library:0", offset: 0, number: "01", group: "LIBRARY", title: "Substack Writing", source: "AUTOMATED" },
  { id: "recommendations", storageId: "library:1", offset: 0, number: "02", group: "LIBRARY", title: "Recommendations", source: "CURATED" },
  { id: "books", storageId: "library:2", offset: 0, number: "03", group: "LIBRARY", title: "Books & Manga", source: "CURATED" },
  { id: "ideas", storageId: "library:3", offset: 0, number: "04", group: "LIBRARY", title: "Interests & Ideas", source: "CURATED" },
  { id: "watch", storageId: "watch", offset: 0, number: "05", group: "TV", title: "Watch", source: "CURATED" },
  { id: "played", storageId: "play", offset: 0, number: "06", group: "CONSOLE", title: "Played", source: "CURATED" },
  { id: "wishlist", storageId: "play", offset: 1, number: "07", group: "CONSOLE", title: "Wishlist", source: "CURATED" },
  { id: "commonplace", storageId: "read", offset: 0, number: "08", group: "TABLE", title: "Commonplace Book", source: "CURATED" },
  { id: "jukebox", storageId: "jukebox", offset: 0, number: "09", group: "JUKEBOX", title: "Playlists", source: "CURATED" },
] as const;

const sampleEntries: Record<string, string[]> = {
  writing: ["Feed-managed chapters"], recommendations: ["Books Worth Keeping", "Films Worth Arguing About", "Games Worth Disappearing Into"],
  books: ["Reading Notes", "Manga", "Reading List"], ideas: ["AI & Product Systems", "Education & Learning", "World-building & Visual Culture"],
  watch: ["Films", "Television", "Anime", "Watchlist"], played: ["Played & Remembered"], wishlist: ["Wishlist"], commonplace: ["From the Internet", "Medium", "Marginalia"], jukebox: ["Public playlists"],
};

type StudioEntry = { title?: string; summary?: string; meta?: string; href?: string; longform?: string[] };
type StudioContentData = { libraryVolumes?: { chapters?: StudioEntry[] }[]; roomCollections?: Record<string, { chapters?: StudioEntry[] }> };
type StudioContent = StudioContentData & { draftContent?: StudioContentData };
type AppearanceData = { ownerName?: string; title?: string; city?: string; timeZone?: string; locationLabel?: string; background?: { templateId?: string; theme?: string }; hotspotContours?: ContourDraft; objectVariation?: { enabledComponents?: RoomComponent[]; markers?: string } };
type StudioConfiguration = AppearanceData & { draft?: AppearanceData };
type PlaylistDocument = { playlists?: RoomPlaylist[]; draft?: RoomPlaylist[] };

const TIME_ZONES = [
  ["Asia/Kolkata", "India"], ["Asia/Dubai", "Dubai"], ["Asia/Singapore", "Singapore"], ["Asia/Tokyo", "Tokyo"],
  ["Europe/London", "London"], ["Europe/Paris", "Paris"], ["America/New_York", "New York"], ["America/Chicago", "Chicago"],
  ["America/Los_Angeles", "Los Angeles"], ["America/Toronto", "Toronto"], ["Australia/Sydney", "Sydney"], ["Pacific/Auckland", "Auckland"],
] as const;

export function AdminStudio({ slug = "akshat", ownerName = "Akshat Kadam", initialContent, initialConfiguration, initialPlaylists, initialProfile }: { slug?: string; ownerName?: string; initialContent?: StudioContent; initialConfiguration?: StudioConfiguration; initialPlaylists?: PlaylistDocument; initialProfile?: Partial<TenantProfile> }) {
  const editorContent = initialContent?.draftContent ?? initialContent;
  const editorAppearance = initialConfiguration?.draft ?? initialConfiguration;
  const readStoredEntry = (targetSection: (typeof sections)[number], targetIndex: number) => {
    const position = targetSection.offset + targetIndex;
    return targetSection.storageId.startsWith("library:")
      ? editorContent?.libraryVolumes?.[Number(targetSection.storageId.split(":")[1])]?.chapters?.[position]
      : editorContent?.roomCollections?.[targetSection.storageId]?.chapters?.[position];
  };
  const initialEntry = readStoredEntry(sections[1], 0);
  const [sectionId, setSectionId] = useState("recommendations");
  const [appearanceMode, setAppearanceMode] = useState(true);
  const [notesMode, setNotesMode] = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const [entryIndex, setEntryIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const section = sections.find((item) => item.id === sectionId) ?? sections[1];
  const entries = useMemo(() => sampleEntries[sectionId] ?? [], [sectionId]);
  const entry = entries[Math.min(entryIndex, Math.max(entries.length - 1, 0))] ?? "Untitled entry";
  const storedEntry = useMemo(() => {
    const position = section.offset + entryIndex;
    return section.storageId.startsWith("library:")
      ? editorContent?.libraryVolumes?.[Number(section.storageId.split(":")[1])]?.chapters?.[position]
      : editorContent?.roomCollections?.[section.storageId]?.chapters?.[position];
  }, [editorContent, entryIndex, section]);
  const [title, setTitle] = useState(initialEntry?.title ?? entry);
  const [summary, setSummary] = useState(initialEntry?.summary ?? `Add the short description shown inside ${sections[1].title}.`);
  const [longform, setLongform] = useState(initialEntry?.longform?.join("\n\n") ?? "");
  const [href, setHref] = useState(initialEntry?.href ?? "");
  const [roomOwner, setRoomOwner] = useState(editorAppearance?.ownerName ?? ownerName);
  const [roomTitle, setRoomTitle] = useState(editorAppearance?.title ?? "The Rec Room");
  const [city, setCity] = useState(editorAppearance?.city ?? editorAppearance?.locationLabel?.split("/")[0]?.trim() ?? "Mumbai");
  const [timeZone, setTimeZone] = useState(editorAppearance?.timeZone ?? "Asia/Kolkata");
  const [theme, setTheme] = useState(editorAppearance?.background?.theme ?? "monsoon-walnut");
  const [templateId, setTemplateId] = useState(editorAppearance?.background?.templateId ?? "monsoon-study");
  const [publishedTemplateId, setPublishedTemplateId] = useState(initialConfiguration?.background?.templateId ?? "monsoon-study");
  const [savedTemplateId, setSavedTemplateId] = useState(editorAppearance?.background?.templateId ?? "monsoon-study");
  const [hasAppearanceDraft, setHasAppearanceDraft] = useState(Boolean(initialConfiguration?.draft));
  const [hasContentDraft, setHasContentDraft] = useState(Boolean(initialContent?.draftContent));
  const [markerStyle, setMarkerStyle] = useState(editorAppearance?.objectVariation?.markers ?? "ember");
  const [enabledComponents, setEnabledComponents] = useState<RoomComponent[]>(editorAppearance?.objectVariation?.enabledComponents ?? [...ROOM_COMPONENTS]);
  const [playlists, setPlaylists] = useState<Array<Pick<RoomPlaylist, "id" | "title" | "url">>>(initialPlaylists?.draft ?? initialPlaylists?.playlists ?? []);
  const jukeboxMode = !appearanceMode && sectionId === "jukebox";
  const loadEditor = (targetSection: (typeof sections)[number], targetIndex: number) => { const targetEntry = readStoredEntry(targetSection, targetIndex); const fallbackTitle = sampleEntries[targetSection.id]?.[targetIndex] ?? "Untitled entry"; setTitle(targetEntry?.title ?? fallbackTitle); setSummary(targetEntry?.summary ?? `Add the short description shown inside ${targetSection.title}.`); setLongform(targetEntry?.longform?.join("\n\n") ?? ""); setHref(targetEntry?.href ?? ""); };
  const chooseSection = (id: string) => { if (id === "jukebox") { window.location.assign(`/${slug}/admin/jukebox`); return; } const targetSection = sections.find((item) => item.id === id) ?? sections[1]; setProfileMode(false); setNotesMode(false); setAppearanceMode(false); setSectionId(id); setEntryIndex(0); loadEditor(targetSection, 0); setNotice(""); };
  const chooseEntry = (index: number) => { setEntryIndex(index); loadEditor(section, index); };
  const previewAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const saveContent = async () => {
    setNotice("SAVING…");
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ sectionId: section.storageId, entryIndex: section.offset + entryIndex, entry: { title, summary, longform, href, meta: storedEntry?.meta ?? "CURATED" } }) });
    if (response.ok) setHasContentDraft(true);
    previewAction(response.ok ? "Draft saved. Publish when you are ready." : "Unable to save. Please sign in again.");
  };
  const saveAppearance = async () => {
    setNotice("SAVING APPEARANCE…");
    const storedContours = localStorage.getItem(`rec-room:contours:${templateId}:v1`);
    const hotspotContours = storedContours ? JSON.parse(storedContours) as ContourDraft : undefined;
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerName: roomOwner, title: roomTitle, city, timeZone, theme, templateId, markerStyle, enabledComponents, hotspotContours }) });
    if (response.ok) { setHasAppearanceDraft(true); setSavedTemplateId(templateId); }
    previewAction(response.ok ? "Appearance draft saved. Publish when ready." : "Unable to save appearance.");
  };
  const publishSaved = async (scope: "appearance" | "content") => {
    setNotice("PUBLISHING SAVED DRAFT…");
    const response = await fetch(`/api/tenants/${slug}/content`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scope }) });
    if (response.ok && scope === "appearance") { setHasAppearanceDraft(false); setPublishedTemplateId(savedTemplateId); }
    if (response.ok && scope === "content") setHasContentDraft(false);
    previewAction(response.ok ? "Saved draft is now live." : "Save changes before publishing.");
  };
  const addPlaylist = () => setPlaylists((current) => [...current, { id: crypto.randomUUID(), title: "", url: "" }]);

  return <main className="admin-studio">
    <header className="admin-header"><Link className="issue-mark" href="/" aria-label="Rec Room home"><img src="/favicon.svg" alt="" /></Link><div><span>{ownerName.toUpperCase()} / CONTROL ROOM</span><strong>THE REC ROOM STUDIO</strong></div><nav><span>AUTHENTICATED</span><Link href={`/${slug}`}>View room ↗</Link></nav></header>
    <div className="admin-workspace">
      <aside className="admin-sections"><div><span>ROOM STUDIO</span><button type="button" onClick={() => previewAction("Collection creation is coming next.")}>＋</button></div><nav><button type="button" className={profileMode ? "is-active" : ""} onClick={() => { setProfileMode(true); setNotesMode(false); setAppearanceMode(false); setNotice(""); }}><i>ID</i><span><small>IDENTITY</small><strong>Profile</strong></span><b>◎</b></button><button type="button" className={appearanceMode && !notesMode && !profileMode ? "is-active" : ""} onClick={() => { setProfileMode(false); setNotesMode(false); setAppearanceMode(true); setNotice(""); }}><i>00</i><span><small>ROOM</small><strong>Appearance</strong></span><b>✦</b></button>{sections.map((item) => <button type="button" key={item.id} className={!profileMode && !notesMode && !appearanceMode && sectionId === item.id ? "is-active" : ""} onClick={() => chooseSection(item.id)}><i>{item.number}</i><span><small>{item.group}</small><strong>{item.title}</strong></span><b>{item.source === "AUTOMATED" ? "↻" : String(sampleEntries[item.id]?.length ?? 0).padStart(2, "0")}</b></button>)}</nav><button className={`admin-notes-nav ${notesMode ? "is-active" : ""}`} type="button" onClick={() => { setProfileMode(false); setNotesMode(true); setNotice(""); }}><i>10</i><span><small>INBOX</small><strong>Visitor Notes</strong></span><b>✎</b></button><footer><span>DATABASE</span><strong>CONNECTED</strong><small>TENANT: /{slug}</small></footer></aside>
      {profileMode ? <ProfileStudio initialProfile={initialProfile} ownerName={ownerName} slug={slug} /> : notesMode ? <NotesStudio embedded ownerName={ownerName} slug={slug} /> : <>
      <section className="admin-index">{appearanceMode ? <><header><span>ROOM / 00</span><h1>Templates</h1><p>{ALL_ROOM_TEMPLATES.length} ROOMS · DESKTOP + MOBILE ART</p></header><div className="active-template"><span>LIVE ROOM</span><img src={getRoomTemplate(publishedTemplateId).desktop} alt="" /><strong>{getRoomTemplate(publishedTemplateId).name}</strong><small>CURRENTLY PUBLIC</small></div><div className="template-picker">{ALL_ROOM_TEMPLATES.map((roomTemplate) => <button type="button" key={roomTemplate.id} className={templateId === roomTemplate.id ? "is-active" : ""} onClick={() => setTemplateId(roomTemplate.id)}><img src={roomTemplate.desktop} alt="" /><span><strong>{roomTemplate.name}</strong>{roomTemplate.id === savedTemplateId && hasAppearanceDraft ? <small>SAVED DRAFT</small> : null}</span></button>)}</div></> : jukeboxMode ? <><header><span>JUKEBOX / 09</span><h1>Playlists</h1><p>{playlists.length} PUBLIC SOURCES</p></header><button className="admin-new" type="button" onClick={addPlaylist}>＋ ADD PLAYLIST</button><ol>{playlists.map((playlist, index) => <li key={playlist.id}><button type="button" className="is-active"><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{playlist.title || "Untitled playlist"}</strong><small>{playlist.url.includes("spotify.com") ? "SPOTIFY" : playlist.url.includes("youtube.com") ? "YOUTUBE MUSIC" : "AWAITING URL"}</small></span><b>♫</b></button></li>)}</ol></> : <><header><span>{section.group} / {section.number}</span><h1>{section.title}</h1><p>{section.source} SOURCE</p></header><button className="admin-new" type="button" onClick={() => previewAction("Entry creation is coming next.")}>＋ NEW ENTRY</button><ol>{entries.map((entryTitle, index) => <li key={entryTitle}><button type="button" className={entryIndex === index ? "is-active" : ""} onClick={() => chooseEntry(index)}><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{entryTitle}</strong><small>{hasContentDraft ? "SAVED DRAFT · MONGODB" : "PUBLISHED · MONGODB"}</small></span><b>›</b></button></li>)}</ol></>}</section>
      <section className="admin-editor"><header><div><span>{appearanceMode ? "ROOM DESIGN" : "ENTRY EDITOR"}</span><strong>{appearanceMode ? getRoomTemplate(templateId).name : title}</strong></div><div><button type="button" onClick={() => window.open(`/${slug}`, "_blank")}>PREVIEW</button><button className="admin-save" type="button" onClick={appearanceMode ? saveAppearance : saveContent}>SAVE CHANGES</button><button className="admin-publish" type="button" disabled={appearanceMode ? !hasAppearanceDraft : !hasContentDraft} onClick={() => publishSaved(appearanceMode ? "appearance" : "content")}>PUBLISH</button></div></header>{appearanceMode ? <form className="appearance-form" onSubmit={(event) => event.preventDefault()}><div className={`appearance-preview room-theme-${theme} room-markers-${markerStyle}`}><picture><source media="(max-width: 650px)" srcSet={getRoomTemplate(templateId).mobile} /><img src={getRoomTemplate(templateId).desktop} alt={`${getRoomTemplate(templateId).name} preview`} /></picture><span>{city}</span><i>{getRoomTemplate(templateId).name}</i></div><ContourEditor templateId={templateId} /><label><span>ROOM TITLE</span><input value={roomTitle} maxLength={80} onChange={(event) => setRoomTitle(event.target.value)} /></label><div className="admin-form-row"><label><span>OWNER DISPLAY NAME</span><input value={roomOwner} maxLength={80} onChange={(event) => setRoomOwner(event.target.value)} /></label><label><span>CITY</span><input value={city} maxLength={80} onChange={(event) => setCity(event.target.value)} /></label></div><div className="admin-form-row"><label><span>CITY TIME ZONE</span><select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>{TIME_ZONES.map(([value, label]) => <option key={value} value={value}>{label} · {value}</option>)}</select></label><label><span>DRAFT STATUS</span><input value={hasAppearanceDraft ? "Saved draft waiting to be published" : "Published version is live"} readOnly /></label></div><fieldset className="component-toggles"><legend>ROOM COMPONENTS</legend>{ROOM_COMPONENTS.map((component) => <label key={component}><input type="checkbox" checked={enabledComponents.includes(component)} onChange={() => setEnabledComponents((current) => current.includes(component) ? current.filter((item) => item !== component) : [...current, component])} /><span>{component === "watch" ? "TV" : component === "play" ? "Console" : component === "read" ? "Coffee table" : component[0].toUpperCase() + component.slice(1)}</span><small>{component === "jukebox" ? "PLAYER COMING NEXT" : "PUBLIC HOTSPOT"}</small></label>)}</fieldset><div className="admin-form-row"><label><span>ATMOSPHERE</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="monsoon-walnut">Natural</option><option value="midnight-blue">Midnight</option><option value="amber-evening">Amber evening</option></select></label><label><span>OBJECT MARKERS</span><select value={markerStyle} onChange={(event) => setMarkerStyle(event.target.value)}><option value="ember">Ember red</option><option value="brass">Brass gold</option><option value="quiet">Quiet cream</option></select></label></div><small className="appearance-help">Each room has calibrated desktop and mobile artwork and hotspots. Save creates a private draft; Publish sends the last saved draft to your public room.</small></form> : <form onSubmit={(event) => event.preventDefault()}><label><span>TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="admin-form-row"><label><span>STATUS</span><input value={hasContentDraft ? "Saved draft" : "Published"} readOnly /></label><label><span>ORDER</span><input type="number" value={entryIndex + 1} readOnly /></label></div><label><span>SUMMARY</span><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></label><label><span>LONG-FORM CONTENT</span><textarea className="admin-body-field" rows={10} value={longform} onChange={(event) => setLongform(event.target.value)} placeholder="Write the complete chapter here." /></label><div className="admin-form-row"><label><span>EXTERNAL URL</span><input value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://" /></label><label><span>TAGS</span><input placeholder="personal, favourite" /></label></div></form>}{notice && <div className="admin-notice" role="status">{notice}</div>}</section>
      </>}
    </div>
  </main>;
}
