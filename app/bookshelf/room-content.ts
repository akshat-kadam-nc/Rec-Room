import type { RoomHotspot } from "./rec-room-diorama";

export type RoomChapter = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  meta: string;
  href?: string;
  longform?: readonly string[];
};

export type RoomCollection = {
  eyebrow: string;
  title: string;
  chapters: readonly RoomChapter[];
};

export type LibraryVolume = {
  id: string;
  eyebrow: string;
  title: string;
  chapters: readonly RoomChapter[];
};

export const libraryVolumes: readonly LibraryVolume[] = [
  { id: "substack", eyebrow: "VOLUME 01 / LIVE FEED", title: "Substack Writing", chapters: [
    { id: "feed-status", title: "Publishing Feed", eyebrow: "INDEX / SUBSTACK", summary: "Essays, philosophies, and short notes published on Substack appear here automatically as chapters.", meta: "SUBSTACK · DYNAMIC" },
  ]},
  { id: "recommendations", eyebrow: "VOLUME 02 / PERSONAL CANON", title: "Recommendations", chapters: [
    { id: "books-worth-keeping", title: "Books Worth Keeping", eyebrow: "CHAPTER 01 / BOOKS", summary: "Books that remained useful, memorable, or unusually alive after the final page.", meta: "CURATED · EVOLVING" },
    { id: "films-worth-arguing-about", title: "Films Worth Arguing About", eyebrow: "CHAPTER 02 / FILMS", summary: "Films that invite a second viewing, a long conversation, or a spirited disagreement.", meta: "CURATED · EVOLVING" },
    { id: "games-worth-disappearing-into", title: "Games Worth Disappearing Into", eyebrow: "CHAPTER 03 / GAMES", summary: "Worlds, systems, and experiences capable of making an evening vanish completely.", meta: "CURATED · EVOLVING" },
  ]},
  { id: "books-manga", eyebrow: "VOLUME 03 / SHELF NOTES", title: "Books & Manga", chapters: [
    { id: "reading-notes", title: "Reading Notes", eyebrow: "CHAPTER 01 / MARGINALIA", summary: "Dog-eared favourites, marked passages, unfinished thoughts, and works worth revisiting.", meta: "CURATED · REPOSITORY" },
    { id: "manga", title: "Manga", eyebrow: "CHAPTER 02 / VISUAL CANON", summary: "Panels with momentum, characters larger than the page, and the visual cornerstone of this archive.", meta: "CURATED · REPOSITORY" },
    { id: "reading-list", title: "Reading List", eyebrow: "CHAPTER 03 / NEXT UP", summary: "Volumes waiting for the right season, recommendation, or unexpected free weekend.", meta: "QUEUE · EVOLVING" },
  ]},
  { id: "interests", eyebrow: "VOLUME 04 / CURRENT FILE", title: "Interests & Ideas", chapters: [
    { id: "ai-products", title: "AI & Product Systems", eyebrow: "CHAPTER 01 / SYSTEMS", summary: "Tools, interfaces, product mechanics, and questions around useful intelligence.", meta: "ACTIVE RABBIT HOLE" },
    { id: "learning", title: "Education & Learning", eyebrow: "CHAPTER 02 / LEARNING", summary: "How people learn, what makes ideas stick, and where educational systems can improve.", meta: "ACTIVE RABBIT HOLE" },
    { id: "world-building", title: "World-building & Visual Culture", eyebrow: "CHAPTER 03 / WORLDS", summary: "Designed worlds, visual languages, and the details that make fictional places feel inhabited.", meta: "ACTIVE RABBIT HOLE" },
  ]},
] as const;

export const roomCollections: Record<RoomHotspot, RoomCollection> = {
  library: { eyebrow: "THE PERSONAL ARCHIVE", title: "Library", chapters: [] },
  watch: { eyebrow: "THE SCREENING ROOM", title: "Watch", chapters: [
    { id: "films", title: "Films", eyebrow: "CHANNEL 01 / CINEMA", summary: "Rewatches over ratings: a subjective cinema log built from notes rather than scores.", meta: "RECOMMENDATIONS", longform: ["The film collection is structured as individual programme notes. Posters and metadata can be added later without changing the room interface."] },
    { id: "television", title: "Television", eyebrow: "CHANNEL 02 / SERIES", summary: "Shows worth staying with, abandoned seasons, and stories that understood the long form.", meta: "WATCHLIST" },
    { id: "anime", title: "Anime", eyebrow: "CHANNEL 03 / ANIMATION", summary: "A personal animation shelf. Strong opinions expected; algorithmic rankings are not.", meta: "RECOMMENDATIONS" },
    { id: "queue", title: "Watchlist", eyebrow: "CHANNEL 04 / NEXT UP", summary: "The unruly queue of things recommended, discovered, and repeatedly postponed.", meta: "IN PROGRESS" },
  ]},
  play: { eyebrow: "PLAYER ONE", title: "Play", chapters: [
    { id: "played", title: "Played & Remembered", eyebrow: "SAVE FILE 01", summary: "Games with personality, systems worth taking apart, and worlds that stayed after the credits.", meta: "PERSONAL CANON" },
    { id: "wishlist", title: "Wishlist", eyebrow: "SAVE FILE 02", summary: "Games waiting for the right weekend, machine, mood, or unreasonable discount.", meta: "BACKLOG" },
  ]},
  read: { eyebrow: "THE COMMONPLACE BOOK", title: "Read", chapters: [
    { id: "internet", title: "From the Internet", eyebrow: "LEAF 01 / FOUND WRITING", summary: "Articles and essays by other people worth returning to, irrespective of where they were published.", meta: "COLLECTED LINKS", longform: ["The commonplace book stores the link, author, source, and a short note about why each piece is worth keeping. It is intentionally source-agnostic: Substack, Medium, independent blogs, journals, and old web pages all belong together."] },
    { id: "medium", title: "Medium", eyebrow: "LEAF 02 / MEDIUM", summary: "A future reading list for writing discovered on Medium. No automated feed is connected yet.", meta: "NOT CONNECTED" },
    { id: "marginalia", title: "Marginalia", eyebrow: "LEAF 03 / NOTES", summary: "Short annotations explaining why a piece mattered, what it changed, or where it leads next.", meta: "PERSONAL NOTES" },
  ]},
  jukebox: { eyebrow: "NOW PLAYING", title: "Jukebox", chapters: [] },
  notes: { eyebrow: "VISITOR GUESTBOOK", title: "Visitor Notes", chapters: [] },
};
