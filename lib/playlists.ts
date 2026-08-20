export type PlaylistProvider = "spotify" | "youtube";

export type RoomPlaylist = {
  id: string;
  provider: PlaylistProvider;
  title: string;
  url: string;
  embedUrl: string;
};

function spotifyId(url: URL) {
  const match = url.pathname.match(/^\/(?:embed\/)?playlist\/([A-Za-z0-9]+)\/?$/);
  return match?.[1];
}

function youtubeId(url: URL) {
  if (!["music.youtube.com", "www.youtube.com", "youtube.com", "youtu.be"].includes(url.hostname)) return undefined;
  return url.searchParams.get("list") || undefined;
}

export function normalizePlaylist(input: { id?: string; title?: string; url?: string }): RoomPlaylist | null {
  const title = input.title?.trim().slice(0, 100);
  const source = input.url?.trim().slice(0, 500);
  if (!title || !source) return null;
  let parsed: URL;
  try { parsed = new URL(source); } catch { return null; }
  if (parsed.protocol !== "https:") return null;

  const spotify = parsed.hostname === "open.spotify.com" ? spotifyId(parsed) : undefined;
  if (spotify) return { id: input.id || crypto.randomUUID(), provider: "spotify", title, url: `https://open.spotify.com/playlist/${spotify}`, embedUrl: `https://open.spotify.com/embed/playlist/${spotify}?utm_source=generator&theme=0` };

  const youtube = youtubeId(parsed);
  if (youtube && /^[A-Za-z0-9_-]{10,100}$/.test(youtube)) return { id: input.id || crypto.randomUUID(), provider: "youtube", title, url: `https://music.youtube.com/playlist?list=${youtube}`, embedUrl: `https://www.youtube.com/embed/videoseries?list=${youtube}&autoplay=1` };

  return null;
}
