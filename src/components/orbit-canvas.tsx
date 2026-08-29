import { useEffect, useRef } from "react";
import { activeMonthlyTotal, classify, frequencyBand, monthlyEquivalent, orbitUrgency } from "@/lib/domain";
import { formatEuroCompact } from "@/lib/format";
import { drawBrand, getBrand, preloadBrandIcons } from "@/lib/logos";
import type { StatusFilter, Subscription } from "@/lib/types";

interface Props {
  subscriptions: Subscription[];
  filter: StatusFilter;
  speed: number;
  focusId: string | null;
  pinnedId?: string | null;
  onSelect: (id: string | null) => void;
  onFocusDone: () => void;
}

interface Body {
  id: string;
  name: string;
  kind: ReturnType<typeof classify>;
  brandKey: string;
  color: string;
  radius: number;
  angle: number;
  size: number;
  inc: number;
  node: number;
  omega: number;
  px: number;
  py: number;
  pz: number;
  pr: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
}

interface Debris {
  angle: number;
  rJit: number;
  size: number;
  a: number;
}

function visibleForFilter(sub: Subscription, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  return sub.status === filter;
}

function project(
  wx: number,
  wy: number,
  wz: number,
  rot: number,
  tilt: number,
  zoom: number,
  cx: number,
  cy: number,
) {
  const cosY = Math.cos(rot);
  const sinY = Math.sin(rot);
  const x = wx * cosY - wz * sinY;
  const z = wx * sinY + wz * cosY;
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);
  const y2 = wy * cosX - z * sinX;
  const z2 = wy * sinX + z * cosX;
  const f = 780;
  const p = f / (f + z2 + 240);
  return {
    x: cx + x * zoom * p,
    y: cy + y2 * zoom * p,
    p,
    z: z2,
  };
}

function worldOf(radius: number, angle: number, inc: number, node: number) {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const si = Math.sin(inc);
  const ci = Math.cos(inc);
  const y1 = -z * si;
  const z1 = z * ci;
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  return { x: x * cn - z1 * sn, y: y1, z: x * sn + z1 * cn };
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function buildBodies(subs: Subscription[], filter: StatusFilter): Body[] {
  const total = activeMonthlyTotal(subs);
  const shown = subs.filter((s) => visibleForFilter(s, filter));
  const inner = shown.filter((s) => classify(s, total) !== "trash");
  const trash = shown.filter((s) => classify(s, total) === "trash");

  const ranked = [...inner].sort((a, b) => {
    const fa = frequencyBand(a.frequency) - frequencyBand(b.frequency);
    if (fa !== 0) return fa;
    return monthlyEquivalent(b) - monthlyEquivalent(a);
  });

  const drafted = ranked.map((s, i) => {
    const equiv = monthlyEquivalent(s);
    const share = total > 0 ? equiv / Math.max(total, equiv) : 0.08;
    return {
      s,
      size: 7 + Math.pow(share, 0.62) * 54,
      omega: 0.032 + orbitUrgency(s) * 0.08,
      i,
    };
  });

  const innerMin = 108;
  const innerMax = 208;
  let cursor = innerMin;
  const radii: number[] = [];
  drafted.forEach((d, i) => {
    if (i > 0) {
      const prev = drafted[i - 1]!;
      cursor += Math.max(22, (prev.size + d.size) * 0.7 + 14);
    }
    radii.push(cursor);
  });
  const last = radii[radii.length - 1] ?? innerMin;
  const scale = last > innerMax ? (innerMax - innerMin) / Math.max(last - innerMin, 1) : 1;
  const bodies: Body[] = drafted.map((d, i) => {
    const radius = innerMin + (radii[i]! - innerMin) * scale;
    let angle = (i * 2.399 + d.s.frequency.length) % (Math.PI * 2);
    if (i > 0 && Math.abs(d.omega - drafted[i - 1]!.omega) < 0.14) {
      angle = ((i - 1) * 2.399 + Math.PI) % (Math.PI * 2);
    }
    return {
      id: d.s.id,
      name: d.s.name,
      kind: classify(d.s, total),
      brandKey: d.s.brandKey,
      color: getBrand(d.s.brandKey).color,
      radius,
      angle,
      size: d.size,
      inc: (hash(i + 3) - 0.5) * 0.42,
      node: (hash(i + 17) - 0.5) * 0.7,
      omega: d.omega,
      px: 0,
      py: 0,
      pz: 0,
      pr: d.size,
    };
  });

  const trashR = 248;
  trash.forEach((s, i) => {
    const equiv = monthlyEquivalent(s);
    const share = total > 0 ? equiv / Math.max(total, 1) : 0.05;
    bodies.push({
      id: s.id,
      name: s.name,
      kind: "trash",
      brandKey: s.brandKey,
      color: getBrand(s.brandKey).color,
      radius: trashR,
      angle: (i * (Math.PI * 2)) / Math.max(trash.length, 1) + 0.4,
      size: 8 + share * 14,
      inc: 0.14,
      node: 0.22,
      omega: 0.028,
      px: 0,
      py: 0,
      pz: 0,
      pr: 10,
    });
  });
  return bodies;
}

export function trashRadius(bodies: Body[]) {
  const t = bodies.find((b) => b.kind === "trash");
  if (t) return t.radius;
  const max = bodies.reduce((m, b) => Math.max(m, b.radius), 82);
  return max + 40;
}

export function OrbitCanvas({
  subscriptions,
  filter,
  speed,
  focusId,
  pinnedId = null,
  onSelect,
  onFocusDone,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSelectRef = useRef(onSelect);
  const onFocusDoneRef = useRef(onFocusDone);
  const speedRef = useRef(speed);
  onSelectRef.current = onSelect;
  onFocusDoneRef.current = onFocusDone;
  speedRef.current = speed;

  const simRef = useRef({
    rot: 0.55,
    tilt: 0.72,
    zoom: 1,
    targetRot: 0.55,
    targetTilt: 0.72,
    targetZoom: 1,
    cyFactor: 0.42,
    targetCyFactor: 0.42,
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    pointerId: -1,
    pinch: null as null | { dist: number; zoom: number },
    stars: [] as Star[],
    debris: [] as Debris[],
    bodies: [] as Body[],
    focusId: null as string | null,
    followId: null as string | null,
    hoverId: null as string | null,
    last: 0,
    totalLabel: "",
    w: 1,
    h: 1,
    dpr: 1,
    trashR: 240,
  });

  useEffect(() => {
    preloadBrandIcons();
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    sim.bodies = buildBodies(subscriptions, filter);
    sim.totalLabel = formatEuroCompact(activeMonthlyTotal(subscriptions));
    sim.trashR = trashRadius(sim.bodies);
  }, [subscriptions, filter]);

  useEffect(() => {
    const id = pinnedId || focusId;
    const sim = simRef.current;
    if (!id) {
      sim.followId = null;
      sim.focusId = null;
      sim.targetZoom = 1;
      sim.targetCyFactor = 0.42;
      return;
    }
    const body = sim.bodies.find((b) => b.id === id);
    if (!body) {
      onFocusDoneRef.current();
      return;
    }
    sim.focusId = id;
    sim.followId = id;
    sim.targetZoom = pinnedId ? 1.32 : 1.42;
    sim.targetCyFactor = pinnedId ? 0.24 : 0.4;
  }, [focusId, pinnedId]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const sim = simRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seedStars = (w: number, h: number) => {
      sim.stars = Array.from({ length: 90 }, (_, i) => ({
        x: hash(i + 1) * w,
        y: hash(i + 40) * h,
        r: 0.4 + hash(i + 9) * 1.2,
        a: 0.25 + hash(i + 21) * 0.55,
        tw: hash(i + 33) * Math.PI * 2,
      }));
      sim.debris = Array.from({ length: 56 }, (_, i) => ({
        angle: hash(i + 70) * Math.PI * 2,
        rJit: (hash(i + 90) - 0.5) * 22,
        size: 0.7 + hash(i + 50) * 2.4,
        a: 0.16 + hash(i + 12) * 0.4,
      }));
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sim.w = rect.width;
      sim.h = rect.height;
      sim.dpr = dpr;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      seedStars(rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const hitTest = (x: number, y: number): Body | null => {
      let best: Body | null = null;
      let bestD = Infinity;
      for (const b of sim.bodies) {
        const d = Math.hypot(b.px - x, b.py - y);
        if (d < Math.max(18, b.pr + 10) && d < bestD) {
          best = b;
          bestD = d;
        }
      }
      return best;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      sim.dragging = true;
      sim.moved = false;
      sim.lastX = e.clientX;
      sim.lastY = e.clientY;
      sim.pointerId = e.pointerId;
      wrap.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const hovered = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      sim.hoverId = hovered?.id ?? null;
      wrap.style.cursor = hovered ? "pointer" : sim.dragging ? "grabbing" : "grab";
      if (!sim.dragging || e.pointerId !== sim.pointerId) return;
      const dx = e.clientX - sim.lastX;
      const dy = e.clientY - sim.lastY;
      if (Math.hypot(dx, dy) > 4) {
        sim.moved = true;
        sim.followId = null;
      }
      sim.targetRot += dx * 0.006;
      sim.targetTilt = Math.max(0.35, Math.min(1.05, sim.targetTilt + dy * 0.004));
      sim.lastX = e.clientX;
      sim.lastY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== sim.pointerId) return;
      const rect = wrap.getBoundingClientRect();
      if (!sim.moved) {
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        onSelectRef.current(hit ? hit.id : null);
      }
      sim.dragging = false;
      sim.pointerId = -1;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sim.targetZoom = Math.max(
        0.55,
        Math.min(2.4, sim.targetZoom * (e.deltaY > 0 ? 0.92 : 1.08)),
      );
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        sim.pinch = {
          dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          zoom: sim.zoom,
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && sim.pinch) {
        e.preventDefault();
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        sim.targetZoom = Math.max(0.55, Math.min(2.4, sim.pinch.zoom * (d / sim.pinch.dist)));
      }
    };
    const onTouchEnd = () => {
      sim.pinch = null;
    };
    const onDbl = () => {
      sim.followId = null;
      sim.targetZoom = 1;
      sim.targetRot = 0.55;
      sim.targetTilt = 0.72;
      sim.targetCyFactor = 0.42;
    };

    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd);
    wrap.addEventListener("dblclick", onDbl);

    let raf = 0;
    const tick = (now: number) => {
      const spd = speedRef.current;
      const dt = Math.min(0.05, sim.last ? (now - sim.last) / 1000 : 0.016);
      sim.last = now;

      if (sim.followId && !sim.dragging) {
        const tracked = sim.bodies.find((b) => b.id === sim.followId);
        if (tracked) sim.targetRot = -(tracked.angle + tracked.node) + Math.PI * 0.5;
      }

      const ease = 1 - Math.exp(-dt * 5.2);
      sim.rot += (sim.targetRot - sim.rot) * ease;
      sim.tilt += (sim.targetTilt - sim.tilt) * ease;
      sim.zoom += (sim.targetZoom - sim.zoom) * ease;
      sim.cyFactor += (sim.targetCyFactor - sim.cyFactor) * ease;

      const w = sim.w;
      const h = sim.h;
      const cx = w * 0.5;
      const cy = h * sim.cyFactor;
      const fit = Math.min(w / 560, h / 560);
      const zoom = sim.zoom * fit;
      const rot = sim.rot;
      const tilt = sim.tilt;

      ctx.setTransform(sim.dpr, 0, 0, sim.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const s of sim.stars) {
        const tw = 0.55 + 0.45 * Math.sin(now * 0.0018 + s.tw);
        ctx.fillStyle = `rgba(230,240,255,${s.a * tw})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const drawRing = (
        radius: number,
        inc: number,
        node: number,
        color: string,
        width: number,
        dash?: number[],
      ) => {
        const steps = 96;
        const pts: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const wpos = worldOf(radius, a, inc, node);
          const p = project(wpos.x, wpos.y, wpos.z, rot, tilt, zoom, cx, cy);
          pts.push({ x: p.x, y: p.y, z: wpos.z });
        }
        // Profondità di campo "leggera": la metà davanti al sole resta
        // nitida e ben visibile, quella dietro è più sottile e spenta —
        // così le orbite sul retro non creano confusione visiva, senza
        // usare sfocature costose che rallenterebbero l'animazione.
        const drawRun = (isNear: boolean) => {
          ctx.beginPath();
          let started = false;
          for (const pt of pts) {
            const match = isNear ? pt.z >= 0 : pt.z < 0;
            if (match) {
              if (!started) {
                ctx.moveTo(pt.x, pt.y);
                started = true;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            } else {
              started = false;
            }
          }
          ctx.globalAlpha = isNear ? 1 : 0.4;
          ctx.strokeStyle = color;
          ctx.lineWidth = isNear ? width : Math.max(0.6, width * 0.7);
          ctx.setLineDash(dash ?? []);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        };
        drawRun(false);
        drawRun(true);
      };

      const selected = sim.bodies.find((b) => b.id === sim.focusId);

      for (const b of sim.bodies) {
        if (b.kind === "trash") continue;
        const on = selected?.id === b.id;
        drawRing(
          b.radius,
          b.inc,
          b.node,
          on ? `${b.color}` : "rgba(170,220,255,0.22)",
          on ? 1.8 : 0.9,
        );
      }
      drawRing(sim.trashR, 0.14, 0.22, "rgba(180,170,150,0.32)", 1.2, [4, 8]);

      for (const d of sim.debris) {
        d.angle += 0.1 * spd * dt;
        const wpos = worldOf(sim.trashR + d.rJit, d.angle, 0.16, 0.35);
        const p = project(wpos.x, wpos.y, wpos.z, rot, tilt, zoom, cx, cy);
        ctx.fillStyle = `rgba(200,190,170,${d.a * p.p})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, d.size * p.p * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const b of sim.bodies) {
        b.angle += b.omega * spd * dt;
        const wpos = worldOf(b.radius, b.angle, b.inc, b.node);
        const p = project(wpos.x, wpos.y, wpos.z, rot, tilt, zoom, cx, cy);
        b.px = p.x;
        b.py = p.y;
        b.pz = p.z;
        b.pr = b.size * p.p * zoom;
      }

      const sorted = [...sim.bodies].sort((a, b) => a.pz - b.pz);
      for (const b of sorted) {
        const isFar = b.pz < 0;
        ctx.save();
        if (isFar) ctx.globalAlpha = 0.62;
        ctx.translate(b.px, b.py + b.pr * 0.9);
        ctx.scale(1, 0.28);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.arc(0, 0, b.pr * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        if (isFar) ctx.globalAlpha = 0.62;

        if (b.kind === "cancelled") {
          for (let i = 0; i < 6; i++) {
            const ang = now * 0.0006 + i * 1.05;
            ctx.fillStyle = `rgba(6,8,18,${0.32 + (i % 3) * 0.1})`;
            ctx.beginPath();
            ctx.arc(
              b.px + Math.cos(ang) * b.pr * 0.55,
              b.py + Math.sin(ang) * b.pr * 0.32,
              b.pr * (0.75 + (i % 3) * 0.16),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }

        if (sim.focusId === b.id) {
          const halo = ctx.createRadialGradient(
            b.px,
            b.py,
            b.pr * 0.7,
            b.px,
            b.py,
            b.pr * 2.1,
          );
          halo.addColorStop(0, `${b.color}00`);
          halo.addColorStop(0.45, `${b.color}55`);
          halo.addColorStop(1, `${b.color}00`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(b.px, b.py, b.pr * 2.1, 0, Math.PI * 2);
          ctx.fill();
        }

        drawBrand(ctx, b.brandKey, b.px, b.py, b.pr);
        ctx.restore();

        if (sim.hoverId === b.id || sim.focusId === b.id) {
          ctx.font = `600 ${Math.max(10, Math.min(13, b.pr * 0.7))}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "rgba(238,242,255,0.92)";
          ctx.fillText(b.name, b.px, b.py + b.pr + 5);
        }
      }

      const sunP = project(0, 0, 0, rot, tilt, zoom, cx, cy);
      const sunR = 22 * zoom * sunP.p;
      const pulse = 0.88 + Math.sin(now * 0.0018) * 0.12;

      // Corona esterna: bagliore ampio e morbido, respira lentamente.
      const outer = ctx.createRadialGradient(
        sunP.x,
        sunP.y,
        sunR * 0.3,
        sunP.x,
        sunP.y,
        sunR * 5.2 * pulse,
      );
      outer.addColorStop(0, "rgba(103,232,249,0.55)");
      outer.addColorStop(0.4, "rgba(34,211,238,0.28)");
      outer.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(sunP.x, sunP.y, sunR * 5.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Bagliore intenso ravvicinato: molto più acceso, cyan puro.
      const sg = ctx.createRadialGradient(sunP.x, sunP.y, sunR * 0.15, sunP.x, sunP.y, sunR * 3.4);
      sg.addColorStop(0, "rgba(255,255,255,0.98)");
      sg.addColorStop(0.32, "rgba(165,243,252,0.9)");
      sg.addColorStop(0.65, "rgba(34,211,238,0.55)");
      sg.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sunP.x, sunP.y, sunR * 3.4, 0, Math.PI * 2);
      ctx.fill();

      // Nucleo: bianco brillante al centro che sfuma in cyan saturo al bordo.
      const core = ctx.createRadialGradient(
        sunP.x - sunR * 0.25,
        sunP.y - sunR * 0.28,
        sunR * 0.05,
        sunP.x,
        sunP.y,
        sunR,
      );
      core.addColorStop(0, "#ffffff");
      core.addColorStop(0.45, "#e8fdff");
      core.addColorStop(0.75, "#67e8f9");
      core.addColorStop(1, "#0891b2");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sunP.x, sunP.y, sunR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(6,14,28,0.9)";
      ctx.font = `700 ${Math.max(11, sunR * 0.42)}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sim.totalLabel, sunP.x, sunP.y);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("dblclick", onDbl);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 cursor-grab touch-none">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
