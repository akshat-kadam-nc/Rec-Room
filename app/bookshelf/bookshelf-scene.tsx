"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { libraryVolumes, type LibraryVolume } from "./library-data";

type Props = { cabinet: number; onSelect: (volume: LibraryVolume) => void; selectedId: string | null };
type BookRig = { aura: THREE.Mesh; auraMaterial: THREE.MeshBasicMaterial; mesh: THREE.Mesh; home: THREE.Vector3; volume: LibraryVolume };

const coverColors = ["#c94b35", "#e4aa32", "#35699a", "#47745d", "#9a668e", "#d97848", "#526e9b", "#c96b74", "#8a6742", "#6b8f71", "#ca493d", "#d09b38"];

function coverTexture(volume: LibraryVolume) {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const index = Number(volume.number) - 1;
  context.fillStyle = coverColors[index % coverColors.length];
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(248,241,229,.16)";
  for (let y = 0; y < 1024; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 768; x += 32) context.fillRect(x, y, 2, 2);
  context.strokeStyle = "#17151a"; context.lineWidth = 20; context.strokeRect(24, 24, 720, 976);
  context.fillStyle = "#f8f1e5"; context.fillRect(55, 58, 175, 76);
  context.fillStyle = "#17151a"; context.font = "700 34px monospace"; context.fillText(`VOL. ${volume.number}`, 78, 108);
  context.beginPath(); context.arc(384, 430, 176, 0, Math.PI * 2); context.fillStyle = index % 2 ? "#f4e6c8" : "#17151a"; context.fill();
  context.strokeStyle = index % 2 ? "#17151a" : "#f4e6c8"; context.lineWidth = 16; context.stroke();
  context.fillStyle = index % 2 ? "#17151a" : "#f4e6c8"; context.textAlign = "center"; context.font = "900 118px Georgia"; context.fillText(["私", "遊", "考", "読"][index % 4], 384, 472);
  context.fillStyle = "#f8f1e5"; context.fillRect(48, 680, 672, 210);
  context.fillStyle = "#17151a"; context.textAlign = "left"; context.font = "900 58px Georgia";
  const words = volume.title.toUpperCase().split(" ");
  words.slice(0, 2).forEach((word, wordIndex) => context.fillText(word, 76, 754 + wordIndex * 65));
  context.font = "700 26px monospace"; context.fillText("AKSHAT KADAM / PERSONAL ARCHIVE", 76, 940);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeAuraTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 640;
  const context = canvas.getContext("2d"); if (!context) return null;
  context.strokeStyle = "#ffd258"; context.lineWidth = 22; context.shadowColor = "#ff6b38"; context.shadowBlur = 34;
  context.strokeRect(38, 38, 436, 564); context.shadowBlur = 0;
  context.strokeStyle = "#17151a"; context.lineWidth = 7; context.setLineDash([22, 13]); context.strokeRect(21, 21, 470, 598);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export function BookshelfScene({ cabinet, onSelect, selectedId }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const cabinetRef = useRef(cabinet);
  const selectedRef = useRef(selectedId);
  useEffect(() => { cabinetRef.current = cabinet; }, [cabinet]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b120d);
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .05, 14.4);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setWebglUnavailable(true));
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "library-webgl";
    mount.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffe7bd, 2.8));
    const key = new THREE.DirectionalLight(0xffd39a, 4.2); key.position.set(-4, 7, 8); scene.add(key);
    const warm = new THREE.PointLight(0xff7a32, 26, 20); warm.position.set(4.5, 2, 5); scene.add(warm);
    const cool = new THREE.PointLight(0x4d79bd, 12, 16); cool.position.set(-5, -1, 4); scene.add(cool);

    const world = new THREE.Group(); scene.add(world);
    const wood = new THREE.MeshStandardMaterial({ color: 0x6c351d, roughness: .7, metalness: .04 });
    const woodEdge = new THREE.MeshStandardMaterial({ color: 0x2b160f, roughness: .62 });
    const backingMaterial = new THREE.MeshStandardMaterial({ color: 0x321e16, roughness: .9 });
    const books: BookRig[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [wood, woodEdge, backingMaterial];
    const textures: THREE.Texture[] = [];
    const auraTexture = makeAuraTexture(); if (auraTexture) textures.push(auraTexture);
    const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z = 0) => {
      const geometry = new THREE.BoxGeometry(w, h, d); geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); return mesh;
    };
    for (let cabinetIndex = 0; cabinetIndex < 3; cabinetIndex += 1) {
      const cabinetGroup = new THREE.Group(); cabinetGroup.position.x = cabinetIndex * 9;
      cabinetGroup.add(box(8.3, .32, 1.45, woodEdge, 0, 4.42), box(8.3, .42, 1.55, woodEdge, 0, -4.42), box(.4, 9.1, 1.55, woodEdge, -4.15, 0), box(.4, 9.1, 1.55, woodEdge, 4.15, 0));
      for (let shelf = 0; shelf < 5; shelf += 1) cabinetGroup.add(box(8.02, .2, 1.36, wood, 0, 2.72 - shelf * 1.72));
      const backing = box(7.92, 8.55, .14, backingMaterial, 0, 0, -.69); cabinetGroup.add(backing);
      const active = libraryVolumes.filter((volume) => volume.cabinet === cabinetIndex);
      for (let shelfIndex = 0; shelfIndex < 5; shelfIndex += 1) {
        const volume = active.find((item) => item.shelf === shelfIndex);
        const shelfY = 3.48 - shelfIndex * 1.72;
        for (let slot = 0; slot < 12; slot += 1) {
          const isFeature = Boolean(volume) && (slot === 5 || slot === 6);
          if (isFeature && slot === 6) continue;
          const width = isFeature ? 1.22 : .43 + ((slot * 7 + shelfIndex) % 3) * .08;
          const height = isFeature ? 1.38 : 1.12 + ((slot * 5 + cabinetIndex) % 4) * .07;
          const x = isFeature ? 0 : -3.55 + slot * .65;
          let material: THREE.Material;
          if (isFeature) {
            const texture = coverTexture(volume!); if (texture) textures.push(texture);
            material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture ?? undefined, roughness: .5, emissive: 0x241109, emissiveIntensity: .2 }); materials.push(material);
          } else {
            const palette = [0x2f5f87, 0xc84935, 0xd49a2d, 0x3f6f57, 0x86567c, 0xe0d3b8, 0x9b5f2f, 0x334d77];
            material = new THREE.MeshStandardMaterial({ color: palette[(slot + shelfIndex * 2 + cabinetIndex) % palette.length], roughness: .78 }); materials.push(material);
          }
          const book = box(width, height, isFeature ? .22 : .92, material, x, shelfY - (1.35 - height) / 2, isFeature ? .49 : .02 + (slot % 2) * .04);
          book.rotation.z = isFeature ? 0 : slot === 11 ? -.055 : slot === 0 ? .045 : 0;
          cabinetGroup.add(book);
          if (isFeature && volume) {
            const auraMaterial = new THREE.MeshBasicMaterial({ map: auraTexture ?? undefined, transparent: true, opacity: .48, depthWrite: false, toneMapped: false }); materials.push(auraMaterial);
            const auraGeometry = new THREE.PlaneGeometry(1.58, 1.72); geometries.push(auraGeometry);
            const aura = new THREE.Mesh(auraGeometry, auraMaterial); aura.position.set(x, book.position.y, .36); cabinetGroup.add(aura);
            books.push({ aura, auraMaterial, mesh: book, home: book.position.clone(), volume });
          }
        }
      }
      world.add(cabinetGroup);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredRig: BookRig | undefined;
    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    };
    const click = (event: PointerEvent) => {
      updatePointer(event); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(books.map((book) => book.mesh), false)[0];
      const rig = books.find((book) => book.mesh === hit?.object);
      if (rig) onSelect(rig.volume);
    };
    const move = (event: PointerEvent) => {
      updatePointer(event); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(books.map((book) => book.mesh), false)[0];
      hoveredRig = books.find((book) => book.mesh === hit?.object);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointerdown", click);
    renderer.domElement.addEventListener("pointermove", move);
    const resize = () => { const rect = mount.getBoundingClientRect(); camera.aspect = rect.width / Math.max(rect.height, 1); camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); };
    resize(); window.addEventListener("resize", resize);
    let frame = 0; let disposed = false;
    const render = () => {
      const targetX = -cabinetRef.current * 9;
      world.position.x += (targetX - world.position.x) * (reducedMotion ? 1 : .075);
      books.forEach((book) => {
        const selected = selectedRef.current === book.volume.id;
        const targetZ = selected ? 3.2 : book.home.z;
        const targetXBook = book.home.x + (selected ? .32 : 0);
        const easing = reducedMotion ? 1 : .1;
        book.mesh.position.z += (targetZ - book.mesh.position.z) * easing;
        book.mesh.position.x += (targetXBook - book.mesh.position.x) * easing;
        book.mesh.rotation.y += ((selected ? -.52 : 0) - book.mesh.rotation.y) * (reducedMotion ? 1 : .09);
        book.mesh.rotation.z += ((selected ? -.08 : 0) - book.mesh.rotation.z) * (reducedMotion ? 1 : .09);
        const highlighted = hoveredRig === book || selected;
        const pulse = reducedMotion ? 0 : Math.sin(performance.now() * .004 + Number(book.volume.number)) * .08;
        book.auraMaterial.opacity = highlighted ? .92 : .42 + pulse;
        const auraScale = highlighted ? 1.1 : 1 + pulse * .12;
        book.aura.scale.setScalar(auraScale);
        book.aura.visible = !selected;
      });
      camera.position.x = reducedMotion ? 0 : Math.sin(performance.now() * .00025) * .08;
      camera.lookAt(0, 0, 0); renderer.render(scene, camera);
      if (!disposed) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", click); renderer.domElement.removeEventListener("pointermove", move);
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); textures.forEach((texture) => texture.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, [onSelect]);
  if (webglUnavailable) return <div className="library-scene library-static" aria-label="Illustrated library bookshelf"><span>THE LIBRARY</span>{Array.from({ length: 36 }, (_, index) => <i key={index} style={{ height: `${62 + (index % 5) * 5}%` }} />)}</div>;
  return <div className="library-scene" ref={mountRef} aria-label="Three-dimensional library bookshelf" />;
}
