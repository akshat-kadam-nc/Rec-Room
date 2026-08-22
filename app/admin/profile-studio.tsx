"use client";

import { useState } from "react";
import type { TenantProfile } from "@/lib/profiles";

type EditableProfile = Pick<TenantProfile, "displayName" | "headline" | "bio" | "avatarUrl" | "interests" | "links" | "isPublic" | "discoverable">;

export function ProfileStudio({ initialProfile, ownerName, slug }: { initialProfile?: Partial<EditableProfile>; ownerName: string; slug: string }) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName ?? ownerName);
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "A personal room for the things I keep.");
  const [bio, setBio] = useState(initialProfile?.bio ?? "Welcome to my corner of the internet. Look around, play something, and leave a note before you go.");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? "");
  const [interests, setInterests] = useState((initialProfile?.interests ?? []).join(", "));
  const [links, setLinks] = useState(initialProfile?.links?.length ? initialProfile.links : [{ label: "", url: "" }]);
  const [isPublic, setIsPublic] = useState(initialProfile?.isPublic !== false);
  const [discoverable, setDiscoverable] = useState(initialProfile?.discoverable !== false);
  const [notice, setNotice] = useState("");
  const save = async () => {
    setNotice("SAVING PROFILE…");
    const response = await fetch(`/api/tenants/${encodeURIComponent(slug)}/profile`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, headline, bio, avatarUrl, interests: interests.split(",").map((item) => item.trim()).filter(Boolean), links, isPublic, discoverable }) });
    setNotice(response.ok ? "Profile saved and live." : (await response.json().catch(() => null))?.error ?? "Unable to save profile.");
  };
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <section className="profile-studio-embedded">
    <header><div><span>PUBLIC IDENTITY / @{slug}</span><h1>Your profile.</h1><p>This follows you into discovery while your room remains the main event.</p></div><button type="button" onClick={() => void save()}>SAVE PROFILE</button></header>
    <div className="profile-studio-grid">
      <form onSubmit={(event) => event.preventDefault()}>
        <label><span>DISPLAY NAME</span><input value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} /></label>
        <label><span>HEADLINE</span><input value={headline} maxLength={120} onChange={(event) => setHeadline(event.target.value)} /></label>
        <label><span>BIO</span><textarea rows={6} value={bio} maxLength={600} onChange={(event) => setBio(event.target.value)} /></label>
        <label><span>AVATAR URL · HTTPS</span><input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://" /></label>
        <label><span>INTERESTS · COMMA SEPARATED</span><input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Cinema, manga, product systems" /></label>
        <fieldset><legend>PUBLIC LINKS</legend>{links.map((link, index) => <div key={index}><input aria-label={`Link ${index + 1} label`} value={link.label} maxLength={32} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="LABEL" /><input aria-label={`Link ${index + 1} URL`} value={link.url} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://" /></div>)}{links.length < 5 && <button type="button" onClick={() => setLinks((current) => [...current, { label: "", url: "" }])}>＋ ADD LINK</button>}</fieldset>
        <div className="profile-visibility"><label><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /><span>SHOW PROFILE IN MY ROOM</span></label><label><input type="checkbox" checked={discoverable} disabled={!isPublic} onChange={(event) => setDiscoverable(event.target.checked)} /><span>LIST ME IN DISCOVERY</span></label></div>
      </form>
      <aside><span>LIVE PREVIEW</span><div className="profile-preview-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</div><small>@{slug}</small><h2>{displayName || "Your name"}</h2><strong>{headline || "Your headline"}</strong><p>{bio || "Your profile bio will appear here."}</p><div>{interests.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6).map((interest) => <i key={interest}>{interest}</i>)}</div></aside>
    </div>
    {notice && <div className="admin-notice" role="status">{notice}</div>}
  </section>;
}
