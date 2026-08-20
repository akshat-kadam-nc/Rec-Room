export const ROOM_COMPONENTS = ["library", "watch", "play", "read", "jukebox"] as const;
export type RoomComponent = (typeof ROOM_COMPONENTS)[number];
export type HotspotRect = { height: number; left: number; top: number; width: number };
export type HotspotContour = { labelX: number; labelY: number; path: string };
type RectLayout = Record<RoomComponent, HotspotRect>;
type ContourLayout = { library: HotspotContour[]; watch: HotspotContour; play: HotspotContour; read: HotspotContour; jukebox: HotspotContour };

export type RoomTemplate = {
  desktop: string;
  id: string;
  contours: { desktop: ContourLayout; mobile: ContourLayout };
  mobile: string;
  name: string;
};

const rect = (left: number, top: number, width: number, height: number): HotspotRect => ({ left, top, width, height });
type Point = readonly [number, number];
const pathFrom = (box: HotspotRect, points: readonly Point[]): HotspotContour => ({
  labelX: box.left + box.width / 2,
  labelY: box.top + box.height / 2,
  path: `${points.map(([x, y], index) => `${index ? "L" : "M"}${(box.left + box.width * x / 100).toFixed(2)} ${(box.top + box.height * y / 100).toFixed(2)}`).join(" ")} Z`,
});
const shelfContours = (box: HotspotRect, axis: "x" | "y") => Array.from({ length: 4 }, (_, index) => {
  const shelf = axis === "x"
    ? rect(box.left + box.width * index / 4, box.top, box.width / 4, box.height)
    : rect(box.left, box.top + box.height * index / 4, box.width, box.height / 4);
  return pathFrom(shelf, [[4,3],[96,2],[100,9],[98,93],[93,98],[5,98],[1,91],[0,8]]);
});
const contourLayout = (layout: RectLayout, libraryAxis: "x" | "y"): ContourLayout => ({
  library: shelfContours(layout.library, libraryAxis),
  watch: pathFrom(layout.watch, [[4,3],[94,1],[100,8],[99,87],[94,96],[8,100],[1,92],[0,10]]),
  play: pathFrom(layout.play, [[22,0],[68,2],[76,13],[80,67],[100,77],[96,96],[83,100],[13,98],[0,84],[14,70]]),
  read: pathFrom(layout.read, [[8,16],[62,0],[91,8],[100,25],[94,82],[78,100],[8,90],[0,70],[1,31]]),
  jukebox: pathFrom(layout.jukebox, [[10,29],[15,12],[28,1],[43,10],[55,4],[70,0],[88,12],[95,31],[100,93],[94,100],[6,100],[0,91],[3,34]]),
});
const template = (id: string, name: string, desktop: RectLayout, mobile: RectLayout, libraryAxis: "x" | "y" = "y"): RoomTemplate => ({ id, name, desktop: `/rooms/${id}.webp`, mobile: `/rooms/${id}-mobile.webp`, contours: { desktop: contourLayout(desktop, libraryAxis), mobile: contourLayout(mobile, libraryAxis) } });

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
  template("verdant-loft", "Verdant Loft", { library: rect(10,15,18,50), watch: rect(35,31,16,22), play: rect(49,51,13,14), read: rect(25,66,36,18), jukebox: rect(77,45,22,24) }, { library: rect(2,28,22,34), watch: rect(31,40,21,18), play: rect(52,49,15,14), read: rect(25,61,40,15), jukebox: rect(72,44,27,20) }),
];

export const LEGACY_TEMPLATE: RoomTemplate = {
  id: "monsoon-study", name: "Monsoon Study", desktop: "/rec-room-diorama-desktop.webp", mobile: "/rec-room-diorama-mobile.webp",
  contours: { desktop: contourLayout({ library: rect(12.5,34.8,16,12.2), watch: rect(63.7,23.8,31.4,34.6), play: rect(74,63,14,8), read: rect(29.5,66.8,30.5,17.5), jukebox: rect(0,0,0,0) }, "x"), mobile: contourLayout({ library: rect(1.6,28,21.5,6.5), watch: rect(65,25,34,23), play: rect(77,48,20,7), read: rect(24,55,49,17), jukebox: rect(0,0,0,0) }, "x") },
};

export const ALL_ROOM_TEMPLATES = [LEGACY_TEMPLATE, ...ROOM_TEMPLATES] as const;
export const ROOM_TEMPLATE_IDS = ALL_ROOM_TEMPLATES.map((item) => item.id);
export function getRoomTemplate(id?: string) { return ALL_ROOM_TEMPLATES.find((item) => item.id === id) ?? LEGACY_TEMPLATE; }
