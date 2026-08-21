"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { CONTOUR_TARGETS, createEmptyContourDraft, exportContourDraft, shapeToPath, simplifyPoints, type ContourDraft, type ContourMode, type ContourPoint, type ContourShape, type ContourTarget } from "@/lib/contour-authoring";
import { getRoomTemplate } from "@/lib/room-templates";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const hasContours = (draft?: ContourDraft) => Boolean(draft && (["desktop", "mobile"] as const).some((mode) => Object.values(draft[mode]).some((shapes) => shapes?.length)));

function fallbackPath(template: ReturnType<typeof getRoomTemplate>, mode: ContourMode, target: ContourTarget) {
  const contours = template.contours?.[mode];
  if (target.startsWith("library-")) {
    const index = Number(target.slice(-1));
    if (contours?.library[index]?.path) return contours.library[index].path;
    const source = template.layout[mode].library;
    const bounds = template.libraryAxis === "x" ? { ...source, left: source.left + source.width * index / 4, width: source.width / 4 } : { ...source, top: source.top + source.height * index / 4, height: source.height / 4 };
    return `M${bounds.left} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top + bounds.height} L${bounds.left} ${bounds.top + bounds.height} Z`;
  }
  const component = target as "watch" | "play" | "read" | "jukebox" | "notes";
  const traced = contours?.[component]?.path;
  if (traced) return traced;
  const bounds = template.layout[mode][component];
  return `M${bounds.left} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top} L${bounds.left + bounds.width} ${bounds.top + bounds.height} L${bounds.left} ${bounds.top + bounds.height} Z`;
}

export function ContourEditor({ initialValue, onChange, templateId }: { initialValue?: ContourDraft; onChange?: (value: ContourDraft) => void; templateId: string }) {
  return <ContourEditorWorkspace initialValue={initialValue} key={templateId} onChange={onChange} templateId={templateId} />;
}

function ContourEditorWorkspace({ initialValue, onChange, templateId }: { initialValue?: ContourDraft; onChange?: (value: ContourDraft) => void; templateId: string }) {
  const template = getRoomTemplate(templateId);
  const storageKey = `rec-room:contours:${templateId}:v1`;
  const svg = useRef<SVGSVGElement>(null);
  const drawing = useRef<ContourPoint[] | null>(null);
  const dragging = useRef<{ point: number; shape: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ContourMode>("desktop");
  const [tool, setTool] = useState<"pencil" | "anchors">("pencil");
  const [target, setTarget] = useState<ContourTarget>("read");
  const [draft, setDraft] = useState<ContourDraft>(() => {
    if (hasContours(initialValue)) return clone(initialValue!);
    if (typeof window === "undefined") return createEmptyContourDraft();
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as ContourDraft : createEmptyContourDraft();
  });
  const [history, setHistory] = useState<ContourDraft[]>([]);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [addingPoints, setAddingPoints] = useState(false);
  const [copied, setCopied] = useState(false);
  const shapes = draft[mode][target] ?? [];
  const selected = shapes.find((shape) => shape.id === activeShape) ?? shapes.at(-1);
  const references = CONTOUR_TARGETS.map(({ id }) => ({ id, paths: draft[mode][id]?.length ? draft[mode][id]!.map(shapeToPath) : [fallbackPath(template, mode, id)] }));
  const exportValue = useMemo(() => JSON.stringify(exportContourDraft(draft), null, 2), [draft]);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(draft)); onChange?.(draft); }, [draft, onChange, storageKey]);
  useEffect(() => {
    const slug = location.pathname.split("/")[1];
    fetch(`/api/tenants/${slug}/content`).then((response) => response.ok ? response.json() : null).then((payload) => {
      const appearance = payload?.configuration?.draft ?? payload?.configuration;
      if (appearance?.background?.templateId === templateId && hasContours(appearance.hotspotContours)) setDraft((current) => {
        const saved = appearance.hotspotContours as ContourDraft;
        return { desktop: { ...saved.desktop, ...current.desktop }, mobile: { ...saved.mobile, ...current.mobile } };
      });
    }).catch(() => undefined);
  }, [templateId]);

  const pointFromEvent = (event: PointerEvent<SVGSVGElement | SVGCircleElement>): ContourPoint => {
    const bounds = svg.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)) };
  };
  const commit = (mutate: (next: ContourDraft) => void) => {
    setHistory((items) => [...items.slice(-29), clone(draft)]);
    const next = clone(draft); mutate(next); setDraft(next);
  };
  const replaceShape = (id: string, update: (shape: ContourShape) => void, remember = false) => {
    if (remember) setHistory((items) => [...items.slice(-29), clone(draft)]);
    setDraft((current) => { const next = clone(current); const shape = next[mode][target]?.find((item) => item.id === id); if (shape) update(shape); return next; });
  };
  const finishPencil = () => {
    const raw = drawing.current; drawing.current = null;
    if (!raw || raw.length < 4) return;
    const points = simplifyPoints(raw, .28);
    const shape = { id: crypto.randomUUID(), points, smoothing: .65 };
    commit((next) => { next[mode][target] = [...(next[mode][target] ?? []), shape]; }); setActiveShape(shape.id);
  };
  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (tool === "pencil") { event.currentTarget.setPointerCapture(event.pointerId); drawing.current = [pointFromEvent(event)]; return; }
    if (addingPoints) {
      const point = pointFromEvent(event);
      if (!selected || selected.points.length > 0 && !activeShape) { const shape = { id: crypto.randomUUID(), points: [point], smoothing: 0 }; commit((next) => { next[mode][target] = [...(next[mode][target] ?? []), shape]; }); setActiveShape(shape.id); }
      else replaceShape(selected.id, (shape) => shape.points.push(point), true);
    }
  };
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event);
    if (drawing.current) { const last = drawing.current.at(-1)!; if (Math.hypot(point.x - last.x, point.y - last.y) > .18) drawing.current.push(point); }
    if (dragging.current) replaceShape(dragging.current.shape, (shape) => { shape.points[dragging.current!.point] = point; });
  };
  const undo = () => { const previous = history.at(-1); if (!previous) return; setDraft(previous); setHistory((items) => items.slice(0, -1)); };
  const remove = () => { if (!selected) return; commit((next) => { next[mode][target] = (next[mode][target] ?? []).filter((shape) => shape.id !== selected.id); }); setActiveShape(null); };
  const copyExport = async () => { await navigator.clipboard.writeText(exportValue); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };

  return <section className={`contour-editor ${open ? "is-open" : ""}`}>
    <button className="contour-editor-toggle" type="button" onClick={() => setOpen((value) => !value)}><span>HOTSPOT CONTOUR EDITOR</span><b>{open ? "CLOSE" : "OPEN"}</b></button>
    {open && <div className="contour-editor-body">
      <header><div><span>AUTHORING TOOL</span><strong>{template.name}</strong></div><div className="contour-segment"><button type="button" className={mode === "desktop" ? "is-active" : ""} onClick={() => setMode("desktop")}>DESKTOP</button><button type="button" className={mode === "mobile" ? "is-active" : ""} onClick={() => setMode("mobile")}>MOBILE</button></div></header>
      <div className="contour-toolbar">
        <label><span>OBJECT</span><select value={target} onChange={(event) => { setTarget(event.target.value as ContourTarget); setActiveShape(null); }}>{CONTOUR_TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div><span>TOOL</span><button type="button" className={tool === "pencil" ? "is-active" : ""} onClick={() => { setTool("pencil"); setAddingPoints(false); }}>✎ PENCIL</button><button type="button" className={tool === "anchors" ? "is-active" : ""} onClick={() => setTool("anchors")}>◇ ANCHORS</button></div>
        <div><span>EDIT</span><button type="button" disabled={tool !== "anchors"} className={addingPoints ? "is-active" : ""} onClick={() => { setAddingPoints((value) => !value); if (!addingPoints) setActiveShape(null); }}>＋ POINTS</button><button type="button" disabled={!history.length} onClick={undo}>UNDO</button><button type="button" disabled={!selected} onClick={remove}>DELETE PATH</button></div>
      </div>
      <div className={`contour-canvas contour-canvas-${mode}`}>
        <img src={mode === "desktop" ? template.desktop : template.mobile} alt={`${template.name} ${mode} contour canvas`} draggable={false} />
        <svg ref={svg} viewBox="0 0 100 100" preserveAspectRatio="none" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finishPencil} onPointerCancel={finishPencil}>
          <g className="contour-reference-map" aria-hidden="true">{references.map((reference) => <g className={reference.id === target ? "is-target" : ""} key={reference.id}>{reference.paths.map((path, index) => <path d={path} key={index} />)}</g>)}</g>
          {shapes.map((shape) => <g key={shape.id} className={shape.id === selected?.id ? "is-selected" : ""} onPointerDown={(event) => { if (tool === "anchors") { event.stopPropagation(); setActiveShape(shape.id); } }}><path d={shapeToPath(shape)} />{tool === "anchors" && shape.id === selected?.id && shape.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r=".7" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setHistory((items) => [...items.slice(-29), clone(draft)]); dragging.current = { point: index, shape: shape.id }; }} onPointerUp={() => { dragging.current = null; }} />)}</g>)}
        </svg>
      </div>
      <footer><div><strong>{shapes.length} SUBPATH{shapes.length === 1 ? "" : "S"}</strong><small>Pencil creates a smoothed closed path. Anchors refine it or add precise polygons. Save Changes stores every template draft in MongoDB; Publish makes the saved contours public.</small></div>{selected && <label><span>SMOOTHING {Math.round(selected.smoothing * 100)}%</span><input type="range" min="0" max="1" step=".05" value={selected.smoothing} onChange={(event) => replaceShape(selected.id, (shape) => { shape.smoothing = Number(event.target.value); }, true)} /></label>}<button type="button" onClick={copyExport}>{copied ? "COPIED" : "COPY JSON"}</button></footer>
    </div>}
  </section>;
}
