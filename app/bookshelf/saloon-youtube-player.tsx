"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RoomPlaylist } from "@/lib/playlists";

type VideoData = { author?: string; title?: string; video_id?: string };
type PlayerEvent = { data: number; target: YouTubePlayer };
type YouTubePlayer = {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData(): VideoData;
  loadPlaylist(options: { list: string; listType: "playlist"; index: number; startSeconds: number }): void;
  nextVideo(): void;
  pauseVideo(): void;
  playVideo(): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
};

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | undefined;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

function playlistId(url: string) {
  try { return new URL(url).searchParams.get("list") ?? ""; } catch { return ""; }
}
function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}

export function SaloonYouTubePlayer({ playlist, onClose }: { playlist: RoomPlaylist; onClose: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [track, setTrack] = useState<VideoData>({ title: playlist.title, author: "YouTube Music" });

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const sync = () => {
      if (!player.current) return;
      setCurrentTime(player.current.getCurrentTime() || 0);
      setDuration(player.current.getDuration() || 0);
      const data = player.current.getVideoData();
      if (data?.title) setTrack(data);
      setPlaying(player.current.getPlayerState() === 1);
    };
    void loadYouTubeApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return;
      player.current = new window.YT.Player(mount.current, {
        height: "200", width: "200",
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: (event: PlayerEvent) => { event.target.loadPlaylist({ list: playlistId(playlist.url), listType: "playlist", index: 0, startSeconds: 0 }); timer = window.setInterval(sync, 500); },
          onStateChange: () => sync(),
        },
      });
    });
    return () => { cancelled = true; window.clearInterval(timer); player.current?.destroy(); player.current = null; };
  }, [playlist]);

  const seek = (value: number) => { setCurrentTime(value); player.current?.seekTo(value, true); };
  const move = (direction: "next" | "previous") => { if (direction === "next") player.current?.nextVideo(); else player.current?.previousVideo(); };
  const toggle = () => { if (playing) player.current?.pauseVideo(); else player.current?.playVideo(); };
  const thumbnail = track.video_id ? `https://i.ytimg.com/vi/${track.video_id}/hqdefault.jpg` : "";

  return <aside className="saloon-real-player" aria-label="YouTube Music player">
    <div className="saloon-youtube-mount" ref={mount} aria-hidden="true" />
    <div className={`saloon-record ${playing ? "is-spinning" : ""}`}>{thumbnail ? <img src={thumbnail} alt="" /> : <span>YT</span>}<i /></div>
    <div className="saloon-real-track"><strong>{track.title || playlist.title}</strong><small>{track.author || "YouTube Music"}</small><input type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(currentTime, Math.max(duration, 1))} aria-label="Seek through track" onChange={(event) => seek(Number(event.target.value))} /><em>{formatTime(currentTime)} / {formatTime(duration)}</em></div>
    <div className="saloon-real-controls"><button type="button" onClick={() => move("previous")} aria-label="Previous track">Ⅰ◀</button><button type="button" className="saloon-real-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button><button type="button" onClick={() => move("next")} aria-label="Next track">▶Ⅰ</button></div>
    <Link href={playlist.url} target="_blank" rel="noreferrer" aria-label="Open source playlist">↗</Link><button type="button" className="saloon-real-close" onClick={onClose} aria-label="Close player">×</button>
  </aside>;
}
