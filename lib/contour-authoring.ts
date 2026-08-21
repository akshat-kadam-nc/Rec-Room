export type ContourPoint = { x: number; y: number };
export type ContourShape = { id: string; points: ContourPoint[]; smoothing: number };
export type ContourTarget = "library-0" | "library-1" | "library-2" | "library-3" | "watch" | "play" | "read" | "jukebox" | "notes";
export type ContourMode = "desktop" | "mobile";
export type ContourDraft = Record<ContourMode, Partial<Record<ContourTarget, ContourShape[]>>>;
export const createEmptyContourDraft = (): ContourDraft => ({ desktop: {}, mobile: {} });

export function sanitizeContourDraft(value: unknown): ContourDraft | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<ContourMode, unknown>>;
  const result = createEmptyContourDraft();
  const allowed = new Set(CONTOUR_TARGETS.map((item) => item.id));
  for (const mode of ["desktop", "mobile"] as const) {
    if (!source[mode] || typeof source[mode] !== "object") return null;
    for (const [target, shapes] of Object.entries(source[mode] as Record<string, unknown>)) {
      if (!allowed.has(target as ContourTarget) || !Array.isArray(shapes) || shapes.length > 20) return null;
      const safeShapes: ContourShape[] = [];
      for (const shape of shapes) {
        if (!shape || typeof shape !== "object") return null;
        const candidate = shape as Partial<ContourShape>;
        if (!Array.isArray(candidate.points) || candidate.points.length < 3 || candidate.points.length > 500 || typeof candidate.smoothing !== "number" || candidate.smoothing < 0 || candidate.smoothing > 1) return null;
        const points: ContourPoint[] = [];
        for (const point of candidate.points) {
          if (!point || typeof point.x !== "number" || typeof point.y !== "number" || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) return null;
          points.push({ x: Number(point.x.toFixed(3)), y: Number(point.y.toFixed(3)) });
        }
        safeShapes.push({ id: typeof candidate.id === "string" ? candidate.id.slice(0, 80) : crypto.randomUUID(), points, smoothing: Number(candidate.smoothing.toFixed(2)) });
      }
      result[mode][target as ContourTarget] = safeShapes;
    }
  }
  return result;
}

export const CONTOUR_TARGETS: Array<{ id: ContourTarget; label: string }> = [
  { id: "library-0", label: "Library · Writing" }, { id: "library-1", label: "Library · Recs" },
  { id: "library-2", label: "Library · Books" }, { id: "library-3", label: "Library · Ideas" },
  { id: "watch", label: "TV" }, { id: "play", label: "Console" }, { id: "read", label: "Coffee-table book" }, { id: "jukebox", label: "Jukebox" }, { id: "notes", label: "Visitor notes" },
];

const distanceToSegment = (point: ContourPoint, start: ContourPoint, end: ContourPoint) => {
  const dx = end.x - start.x; const dy = end.y - start.y;
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
};

export function simplifyPoints(points: ContourPoint[], tolerance = .3): ContourPoint[] {
  if (points.length <= 3) return points;
  let maximum = 0; let index = 0;
  for (let cursor = 1; cursor < points.length - 1; cursor++) {
    const distance = distanceToSegment(points[cursor], points[0], points[points.length - 1]);
    if (distance > maximum) { maximum = distance; index = cursor; }
  }
  if (maximum <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplifyPoints(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplifyPoints(points.slice(index), tolerance)];
}

const n = (value: number) => Number(value.toFixed(3));
export function shapeToPath(shape: ContourShape) {
  const points = shape.points;
  if (points.length < 3) return "";
  if (shape.smoothing <= 0) return `M${points.map((point) => `${n(point.x)} ${n(point.y)}`).join(" L")} Z`;
  const tension = Math.min(1, shape.smoothing) / 6;
  let output = `M${n(points[0].x)} ${n(points[0].y)}`;
  for (let index = 0; index < points.length; index++) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const after = points[(index + 2) % points.length];
    const control1 = { x: current.x + (next.x - previous.x) * tension, y: current.y + (next.y - previous.y) * tension };
    const control2 = { x: next.x - (after.x - current.x) * tension, y: next.y - (after.y - current.y) * tension };
    output += ` C${n(control1.x)} ${n(control1.y)} ${n(control2.x)} ${n(control2.y)} ${n(next.x)} ${n(next.y)}`;
  }
  return `${output} Z`;
}

export function exportContourDraft(draft: ContourDraft) {
  return Object.fromEntries((["desktop", "mobile"] as const).map((mode) => [mode, Object.fromEntries(
    Object.entries(draft[mode]).map(([target, shapes]) => [target, (shapes ?? []).map(shapeToPath).filter(Boolean)]),
  )]));
}
