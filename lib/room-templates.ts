export const ROOM_COMPONENTS = ["library", "watch", "play", "read", "jukebox"] as const;
export type RoomComponent = (typeof ROOM_COMPONENTS)[number];
export type HotspotRect = { height: number; left: number; top: number; width: number };
type TemplateLayout = Record<RoomComponent, HotspotRect>;
export type HotspotPath = { path: string };
export type TemplateContours = { library: HotspotPath[]; watch: HotspotPath; play: HotspotPath; read: HotspotPath; jukebox: HotspotPath };

export type RoomTemplate = {
  desktop: string;
  contours?: { desktop: TemplateContours; mobile: TemplateContours };
  id: string;
  layout: { desktop: TemplateLayout; mobile: TemplateLayout };
  libraryAxis: "x" | "y";
  mobile: string;
  name: string;
};

const rect = (left: number, top: number, width: number, height: number): HotspotRect => ({ left, top, width, height });
const template = (id: string, name: string, desktop: TemplateLayout, mobile: TemplateLayout, libraryAxis: "x" | "y" = "y"): RoomTemplate => ({ id, name, desktop: `/rooms/${id}.webp`, mobile: `/rooms/${id}-mobile.webp`, layout: { desktop, mobile }, libraryAxis });
const path = (value: string): HotspotPath => ({ path: value });

const VERDANT_CONTOURS: { desktop: TemplateContours; mobile: TemplateContours } = {
  desktop: {
    library: [
      path("M13.15 16.2 L25.7 16.8 L25.65 23.15 L13.15 22.65 Z"),
      path("M13.15 26.1 L25.9 26.55 L25.85 32.1 L13.15 31.75 Z"),
      path("M13.15 34.15 L26.15 34.55 L26.1 39.2 L13.15 38.9 Z"),
      path("M13.15 41.15 L26.25 41.5 L26.2 48.95 L13.15 48.75 Z"),
    ],
    watch: path("M36.25 31.55 L48.68 32.95 L48.72 49.15 L36.28 50.15 Z"),
    play: path("M52.75 47.8 L55.65 48.1 L55.8 57.5 L54.7 58.35 L54.3 57.65 L53.2 57.65 L52.8 59.1 L51.55 59 L51.3 57.9 L51.65 56.7 L52.7 56.2 Z"),
    read: path("M39.5 72.75 C40.85 71.5 42.35 70.1 43.8 69.45 C44.75 69.45 45.65 70.25 46.4 71.15 C47.2 70.25 48.1 69.5 49.15 69.65 C51.05 70.65 52.85 71.8 54.45 73.05 L54.6 75.65 C52.8 75.45 51.05 75.25 49.5 75.05 C48.4 75.7 47.4 76.35 46.4 77 C45.5 76.55 44.55 76.15 43.65 75.85 C42.2 76.2 40.85 76.6 39.55 76.9 Z"),
    jukebox: path("M80.1 47 L83 47 L83.35 56 L80 56 Z M92.45 47.2 L96.7 46 L96.8 58.5 L92.5 56.5 Z M78.2 56.2 L98.2 57.6 L98 76 L78.2 75 Z"),
  },
  mobile: {
    library: [
      path("M3.75 29.25 L21.65 29.9 L21.65 34.15 L3.75 33.7 Z"),
      path("M3.75 35.2 L21.65 35.65 L21.65 40.85 L3.75 40.55 Z"),
      path("M3.75 42.15 L21.65 42.45 L21.65 47.75 L3.75 47.55 Z"),
      path("M3.75 49.15 L21.65 49.35 L21.65 54.15 L3.75 54.45 Z"),
    ],
    watch: path("M32.4 37.8 L48.2 39 L48.25 48 L32.45 48.75 Z"),
    play: path("M53.3 49.2 L59.2 49.4 L59.25 54 L57.3 54.7 L56.4 53.9 L55 54 L54.5 55.2 L52 55.1 L51.7 54.2 L52.2 53.4 L53.2 53.1 Z"),
    read: path("M42.4 63.65 C44.7 62.75 47 62 49.15 61.75 C51.05 61.8 52.7 62.35 54.15 63.05 C55.55 62.35 57 61.95 58.45 62.05 C61.2 62.75 63.85 63.55 66.2 64.45 L66.4 66.25 C63.75 66.15 61.2 66 58.85 65.8 C57.2 66.35 55.55 66.85 54 67.2 C52.5 66.85 51 66.5 49.55 66.2 C47.05 66.45 44.65 66.7 42.4 66.85 Z"),
    jukebox: path("M70.8 46.5 L76.2 46.2 L76.2 52.7 L70.8 52.2 Z M89.8 46.8 L96.2 46.6 L96.5 53.8 L90 53.2 Z M68.7 52.5 L98.2 53.8 L98 62.3 L68.7 61.5 Z"),
  },
};

export const ROOM_TEMPLATES: readonly RoomTemplate[] = [
  template("analog-den", "Analog Den", { library: rect(3,10,25,49), watch: rect(31,29,17,22), play: rect(59,65,12,9), read: rect(19,62,34,20), jukebox: rect(53,37,31,23) }, { library: rect(1,24,30,29), watch: rect(34,37,17,15), play: rect(66,57,14,8), read: rect(18,58,43,14), jukebox: rect(53,40,28,15) }),
  template("azure-atelier", "Azure Atelier", { library: rect(0,9,18,59), watch: rect(20,32,18,26), play: rect(16,57,10,17), read: rect(42,66,27,20), jukebox: rect(75,38,23,20) }, { library: rect(0,28,21,34), watch: rect(23,42,18,20), play: rect(16,56,10,13), read: rect(35,64,36,13), jukebox: rect(73,45,25,15) }),
  template("blackwood-archive", "Blackwood Archive", { library: rect(0,7,37,49), watch: rect(57,31,21,23), play: rect(59,55,17,10), read: rect(31,61,37,19), jukebox: rect(82,32,17,30) }, { library: rect(0,24,35,31), watch: rect(51,36,24,18), play: rect(51,53,24,8), read: rect(31,58,43,15), jukebox: rect(81,36,18,21) }),
  template("celestial-durbar", "Celestial Durbar", { library: rect(0,13,24,52), watch: rect(26,39,17,23), play: rect(53,43,9,17), read: rect(31,70,29,16), jukebox: rect(62,39,14,22) }, { library: rect(0,29,22,31), watch: rect(26,43,20,16), play: rect(49,50,10,13), read: rect(25,65,40,13), jukebox: rect(61,44,16,17) }),
  template("greenwood-study", "Greenwood Study", { library: rect(0,8,31,53), watch: rect(33,32,25,24), play: rect(51,40,12,15), read: rect(40,64,32,19), jukebox: rect(85,30,14,31) }, { library: rect(0,22,28,38), watch: rect(30,40,24,18), play: rect(55,44,10,15), read: rect(40,59,39,15), jukebox: rect(86,34,13,25) }),
  template("neon-haven", "Neon Haven", { library: rect(7,15,22,47), watch: rect(30,34,19,21), play: rect(57,49,14,15), read: rect(31,66,33,17), jukebox: rect(77,48,22,23) }, { library: rect(0,30,24,31), watch: rect(26,42,22,18), play: rect(52,50,15,15), read: rect(24,61,41,15), jukebox: rect(72,47,27,18) }),
  template("polar-commons", "Polar Commons", { library: rect(1,10,19,52), watch: rect(21,30,17,25), play: rect(19,53,18,13), read: rect(38,62,34,20), jukebox: rect(84,42,15,23) }, { library: rect(0,28,20,36), watch: rect(22,42,21,20), play: rect(21,58,22,10), read: rect(31,61,40,15), jukebox: rect(83,46,16,17) }),
  template("rainwood-cottage", "Rainwood Cottage", { library: rect(0,12,20,54), watch: rect(20,33,17,23), play: rect(14,54,14,16), read: rect(33,68,31,17), jukebox: rect(86,39,13,25) }, { library: rect(0,31,22,32), watch: rect(21,42,19,18), play: rect(14,56,13,13), read: rect(25,62,43,14), jukebox: rect(87,43,12,18) }),
  template("starward-lounge", "Starward Lounge", { library: rect(3,7,21,49), watch: rect(25,28,18,25), play: rect(59,57,13,10), read: rect(28,61,30,17), jukebox: rect(78,38,20,25) }, { library: rect(1,22,25,35), watch: rect(31,34,23,18), play: rect(63,52,16,9), read: rect(30,56,38,14), jukebox: rect(76,35,23,20) }),
  { ...template("verdant-loft", "Verdant Loft", { library: rect(10,15,18,50), watch: rect(35,31,16,22), play: rect(49,51,13,14), read: rect(25,66,36,18), jukebox: rect(77,45,22,24) }, { library: rect(2,28,22,34), watch: rect(31,40,21,18), play: rect(52,49,15,14), read: rect(25,61,40,15), jukebox: rect(72,44,27,20) }), contours: VERDANT_CONTOURS },
];

export const LEGACY_TEMPLATE: RoomTemplate = {
  id: "monsoon-study", name: "Monsoon Study", desktop: "/rec-room-diorama-desktop.webp", mobile: "/rec-room-diorama-mobile.webp", libraryAxis: "x",
  layout: { desktop: { library: rect(12.5,34.8,16,12.2), watch: rect(63.7,23.8,31.4,34.6), play: rect(74,63,14,8), read: rect(29.5,66.8,30.5,17.5), jukebox: rect(0,0,0,0) }, mobile: { library: rect(1.6,28,21.5,6.5), watch: rect(65,25,34,23), play: rect(77,48,20,7), read: rect(24,55,49,17), jukebox: rect(0,0,0,0) } },
};

export const ALL_ROOM_TEMPLATES = [LEGACY_TEMPLATE, ...ROOM_TEMPLATES] as const;
export const ROOM_TEMPLATE_IDS = ALL_ROOM_TEMPLATES.map((item) => item.id);
export function getRoomTemplate(id?: string) { return ALL_ROOM_TEMPLATES.find((item) => item.id === id) ?? LEGACY_TEMPLATE; }
