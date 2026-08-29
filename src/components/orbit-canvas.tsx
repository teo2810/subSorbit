import { useEffect, useRef } from "react";
import { activeMonthlyTotal, classify, monthlyEquivalent, orbitUrgency } from "@/lib/domain";
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
  paused: boolean;
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

const BAND = {
  weekly: { radius: 88, inc: 0.11, node: 0.08 },
  monthly: { radius: 168, inc: 0.2, node: -0.14 },
  yearly: { radius: 248, inc: 0.15, node: 0.24 },
  trash: { radius: 328, inc: 0.13, node: 0.18 },
} as const;

function sizeStep(share: number) {
  if (share >= 0.18) return 18;
  if (share >= 0.08) return 14;
  return 10;
}

function speedStep(s: Subscription) {
  if (s.status === "cancelled") return 0.014;
  const u = orbitUrgency(s);
  if (u >= 0.66) return 0.05;
  if (u >= 0.33) return 0.032;
  return 0.018;
}

function bandOf(s: Subscription, total: number) {
  if (classify(s, total) === "trash") return "trash" as const;
  if (s.frequency === "weekly") return "weekly" as const;
  if (s.frequency === "yearly" || s.frequency === "once") return "yearly" as const;
  return "monthly" as const;
}

function placeOnBands(items: Subscription[], key: keyof typeof BAND, total: number): Body[] {
  if (!items.length) return [];
  const base = BAND[key];
  const cap = 5;
  const rings = Math.ceil(items.length / cap);
  return items.map((s, i) => {
    const ring = Math.floor(i / cap);
    const slot = i - ring * cap;
    const onRing = Math.min(cap, items.length - ring * cap);
    const share = total > 0 ? monthlyEquivalent(s) / Math.max(total, 0.01) : 0.08;
    const size = key === "trash" ? 12 : sizeStep(share);
    return {
      id: s.id,
      name: s.name,
      kind: classify(s, total),
      paused: s.status === "paused",
      brandKey: s.brandKey,
      color: getBrand(s.brandKey).color,
      radius: base.radius + ring * 28,
      angle: (slot / Math.max(onRing, 1)) * Math.PI * 2 + ring * 0.4 + hash(i + 2),
      size,
      inc: base.inc,
      node: base.node,
      omega: speedStep(s),
      px: 0,
      py: 0,
      pz: 0,
      pr: size,
    };
  });
}

function buildBodies(subs: Subscription[], filter: StatusFilter): Body[] {
  const total = activeMonthlyTotal(subs);
  const shown = subs.filter((s) => visibleForFilter(s, filter));
  const groups = {
    weekly: [] as Subscription[],
    monthly: [] as Subscription[],
    yearly: [] as Subscription[],
    trash: [] as Subscription[],
  };
  for (const s of shown) groups[bandOf(s, total)].push(s);
  for (const k of Object.keys(groups) as (keyof typeof groups)[]) {
    groups[k].sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  }
  return [
    ...placeOnBands(groups.weekly, "weekly", total),
    ...placeOnBands(groups.monthly, "monthly", total),
    ...placeOnBands(groups.yearly, "yearly", total),
    ...placeOnBands(groups.trash, "trash", total),
  ];
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
    tilt: 0.68,
    zoom: 1,
    targetRot: 0.55,
    targetTilt: 0.68,
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
    sim.trashR = BAND.trash.radius;
  }, [subscriptions, filter]);

  useEffect(() => {
    const id = pinnedId || focusId;
    const sim = simRef.current;
    if (!id) {
      sim.followId = null;
      sim.focusId = null;
      sim.targetZoom = 1;
      sim.targetTilt = 0.68;
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
    sim.targetZoom = pinnedId ? 1.38 : 1.5;
    sim.targetTilt = pinnedId ? 0.5 : 0.55;
    sim.targetCyFactor = pinnedId ? 0.28 : 0.38;
  }, [focusId, pinnedId]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const sim = simRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seedStars = (w: number, h: number) => {
      sim.stars = Array.from({ length: 140 }, (_, i) => ({
        x: hash(i + 1) * w,
        y: hash(i + 40) * h,
        r: 0.35 + hash(i + 9) * 1.35,
        a: 0.18 + hash(i + 21) * 0.62,
        tw: hash(i + 33) * Math.PI * 2,
      }));
      sim.debris = Array.from({ length: 72 }, (_, i) => ({
        angle: hash(i + 70) * Math.PI * 2,
        rJit: (hash(i + 90) - 0.5) * 16,
        size: 1.1 + hash(i + 50) * 3.2,
        a: 0.35 + hash(i + 12) * 0.5,
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
        if (d < Math.max(18, b.pr + 10) && (b.pz < (best?.pz ?? 999) || d < bestD - 6)) {
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
      sim.targetTilt = 0.68;
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
        if (tracked) {
          const wpos = worldOf(tracked.radius, tracked.angle, tracked.inc, tracked.node);
          sim.targetRot = Math.atan2(wpos.x, wpos.z) + Math.PI;
        }
      }

      const ease = 1 - Math.exp(-dt * 5.2);
      let dRot = sim.targetRot - sim.rot;
      while (dRot > Math.PI) dRot -= Math.PI * 2;
      while (dRot < -Math.PI) dRot += Math.PI * 2;
      sim.rot += dRot * ease;
      sim.tilt += (sim.targetTilt - sim.tilt) * ease;
      sim.zoom += (sim.targetZoom - sim.zoom) * ease;
      sim.cyFactor += (sim.targetCyFactor - sim.cyFactor) * ease;

      const w = sim.w;
      const h = sim.h;
      const cx = w * 0.5;
      const cy = h * sim.cyFactor;
      const fit = Math.min(w / 720, h / 720);
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
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const wpos = worldOf(radius, a, inc, node);
          const p = project(wpos.x, wpos.y, wpos.z, rot, tilt, zoom, cx, cy);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash ?? []);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      const selected = sim.bodies.find((b) => b.id === sim.focusId);
      const ringKeys = new Map<string, Body>();
      for (const b of sim.bodies) {
        const k = `${b.radius.toFixed(1)}:${b.inc}:${b.node}`;
        if (!ringKeys.has(k)) ringKeys.set(k, b);
      }
      for (const b of ringKeys.values()) {
        if (b.kind === "trash") continue;
        const on = selected?.id === b.id || (selected && selected.radius === b.radius && selected.inc === b.inc);
        const faded = Boolean(selected) && !on;
        drawRing(
          b.radius,
          b.inc,
          b.node,
          on ? `${selected?.color ?? b.color}` : faded ? "rgba(170,220,255,0.08)" : "rgba(170,220,255,0.28)",
          on ? 2 : faded ? 0.6 : 0.9,
        );
      }
      drawRing(
        BAND.trash.radius,
        BAND.trash.inc,
        BAND.trash.node,
        selected ? "rgba(210,200,180,0.12)" : "rgba(210,200,180,0.42)",
        selected ? 0.7 : 1.25,
        [5, 9],
      );

      for (const d of sim.debris) {
        d.angle += 0.12 * spd * dt;
        const wpos = worldOf(sim.trashR + d.rJit, d.angle, BAND.trash.inc, BAND.trash.node);
        const p = project(wpos.x, wpos.y, wpos.z, rot, tilt, zoom, cx, cy);
        ctx.fillStyle = `rgba(220,210,190,${Math.min(1, (d.a * p.p + 0.15) * (selected ? 0.25 : 1))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, d.size * p.p * zoom), 0, Math.PI * 2);
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

      const sunP = project(0, 0, 0, rot, tilt, zoom, cx, cy);
      const sunR = 38 * zoom * sunP.p;

      const drawSun = () => {
        const pulse = 0.94 + Math.sin(now * 0.0016) * 0.06;

        const bloom = ctx.createRadialGradient(
          sunP.x,
          sunP.y,
          0,
          sunP.x,
          sunP.y,
          sunR * 6.2 * pulse,
        );
        bloom.addColorStop(0, "rgba(255,255,255,1)");
        bloom.addColorStop(0.08, "rgba(186,247,255,0.95)");
        bloom.addColorStop(0.18, "rgba(34,211,238,0.7)");
        bloom.addColorStop(0.34, "rgba(34,211,238,0.28)");
        bloom.addColorStop(0.55, "rgba(14,165,233,0.1)");
        bloom.addColorStop(1, "rgba(14,165,233,0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(sunP.x, sunP.y, sunR * 6.2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(
          sunP.x - sunR * 0.16,
          sunP.y - sunR * 0.18,
          sunR * 0.05,
          sunP.x,
          sunP.y,
          sunR * 1.15,
        );
        core.addColorStop(0, "#ffffff");
        core.addColorStop(0.28, "#e6fcff");
        core.addColorStop(0.58, "#7dd3fc");
        core.addColorStop(0.82, "rgba(34,211,238,0.55)");
        core.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(sunP.x, sunP.y, sunR * 1.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(8,20,40,0.78)";
        ctx.font = `700 ${Math.max(12, sunR * 0.34)}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sim.totalLabel, sunP.x, sunP.y);
      };

      const drawBody = (b: Body) => {
        const focused = sim.focusId === b.id;
        const isFar = b.pz > 0;
        const distSun = Math.hypot(b.px - sunP.x, b.py - sunP.y);
        if (!focused && isFar && distSun < sunR * 0.92) return;
        ctx.save();
        if (sim.focusId && !focused) ctx.globalAlpha = 0.22;
        else if (isFar) ctx.globalAlpha = distSun < sunR * 1.7 ? 0.35 : 0.88;

        if (b.paused) {
          for (let i = 0; i < 4; i++) {
            const ang = now * 0.0004 + i * 1.6;
            const ox = Math.cos(ang) * b.pr * 0.55;
            const oy = Math.sin(ang * 0.8) * b.pr * 0.35;
            const cloud = ctx.createRadialGradient(
              b.px + ox,
              b.py + oy,
              b.pr * 0.2,
              b.px + ox,
              b.py + oy,
              b.pr * 1.7,
            );
            cloud.addColorStop(0, "rgba(150,158,180,0.38)");
            cloud.addColorStop(0.55, "rgba(90,98,125,0.2)");
            cloud.addColorStop(1, "rgba(90,98,125,0)");
            ctx.fillStyle = cloud;
            ctx.beginPath();
            ctx.arc(b.px + ox, b.py + oy, b.pr * 1.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (sim.focusId === b.id) {
          const beat = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 0.0042));
          const rad = b.pr * (1.55 + beat * 0.7);
          const halo = ctx.createRadialGradient(
            b.px,
            b.py,
            b.pr * 0.7,
            b.px,
            b.py,
            rad,
          );
          halo.addColorStop(0, `${b.color}00`);
          halo.addColorStop(0.45, `${b.color}${Math.round(50 + beat * 40).toString(16).padStart(2, "0")}`);
          halo.addColorStop(1, `${b.color}00`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(b.px, b.py, rad, 0, Math.PI * 2);
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
      };

      const sorted = [...sim.bodies].sort((a, b) => b.pz - a.pz);
      const far = sorted.filter((b) => b.pz > 0);
      const near = sorted.filter((b) => b.pz <= 0);
      for (const b of far) drawBody(b);
      drawSun();
      for (const b of near) drawBody(b);

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
