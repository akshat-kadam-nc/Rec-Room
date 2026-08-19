export type LibraryVolume = {
  cabinet: number;
  color: "ink" | "paper" | "red" | "gray";
  id: string;
  kicker: string;
  notes: readonly string[];
  number: string;
  shelf: number;
  source: "CMS" | "SUBSTACK";
  title: string;
  type: string;
};

export const libraryVolumes: readonly LibraryVolume[] = [
  { id: "recommendations", number: "01", title: "Recommendations", type: "COLLECTION", source: "CMS", cabinet: 0, shelf: 0, color: "red", kicker: "Things worth passing on", notes: ["Books worth keeping", "Films worth arguing about", "Games worth disappearing into"] },
  { id: "essays", number: "02", title: "Personal Essays", type: "WRITING", source: "SUBSTACK", cabinet: 0, shelf: 1, color: "paper", kicker: "Long-form dispatches", notes: ["Imported from Substack", "Full archive coming next", "Opens as a reading spread"] },
  { id: "philosophies", number: "03", title: "Philosophies", type: "WRITING", source: "SUBSTACK", cabinet: 0, shelf: 2, color: "gray", kicker: "Operating principles", notes: ["Published as Substack posts", "Ideas remain revisable", "Filed here by theme"] },
  { id: "notes", number: "04", title: "Short Notes", type: "WRITING", source: "SUBSTACK", cabinet: 0, shelf: 3, color: "ink", kicker: "Quick dispatches", notes: ["Brief observations", "Fresh from the feed", "No forced grand conclusion"] },
  { id: "interests", number: "05", title: "Interests", type: "INDEX", source: "CMS", cabinet: 1, shelf: 0, color: "paper", kicker: "Current rabbit holes", notes: ["AI and product systems", "Education and learning", "World-building and visual culture"] },
  { id: "games", number: "06", title: "Games", type: "COLLECTION", source: "CMS", cabinet: 1, shelf: 1, color: "red", kicker: "Played, studied, remembered", notes: ["Games with personality", "Game-development experiments", "Systems worth taking apart"] },
  { id: "anime", number: "07", title: "Anime", type: "COLLECTION", source: "CMS", cabinet: 1, shelf: 2, color: "ink", kicker: "The animation shelf", notes: ["Personal list in progress", "Strong opinions expected", "No algorithmic rankings"] },
  { id: "manga", number: "08", title: "Manga", type: "COLLECTION", source: "CMS", cabinet: 1, shelf: 3, color: "paper", kicker: "The obvious cornerstone", notes: ["Panels with momentum", "Characters bigger than the page", "The archive's visual grammar"] },
  { id: "films", number: "09", title: "Films", type: "COLLECTION", source: "CMS", cabinet: 2, shelf: 0, color: "gray", kicker: "A subjective cinema log", notes: ["Rewatches over ratings", "Notes instead of reviews", "The canon stays editable"] },
  { id: "books", number: "10", title: "Books", type: "COLLECTION", source: "CMS", cabinet: 2, shelf: 1, color: "red", kicker: "Read, marked, kept", notes: ["Fiction and non-fiction", "Margin notes welcome", "The reading list keeps moving"] },
  { id: "experiments", number: "11", title: "Experiments", type: "INDEX", source: "CMS", cabinet: 2, shelf: 2, color: "ink", kicker: "Things made after hours", notes: ["Small games", "Vibe-coded tools", "Unfinished but interesting"] },
  { id: "miscellany", number: "12", title: "Miscellany", type: "INDEX", source: "CMS", cabinet: 2, shelf: 3, color: "paper", kicker: "Everything that resists filing", notes: ["Side stories", "Unexpected favourites", "Useful fragments"] },
] as const;

export const cabinetNames = ["WRITING & IDEAS", "PLAY & CULTURE", "BOOKS & OTHER THINGS"] as const;
