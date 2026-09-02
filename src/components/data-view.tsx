import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenHeader } from "./orbit-mark";
import { ChartBackdrop } from "./chart-backdrop";
import { PeriodSwitch } from "./period-switch";
import { BrandBadge } from "@/lib/logos";
import { cn } from "@/lib/cn";
import {
  activeMonthlyTotal,
  cashInPeriod,
  spendByCategory,
  yearlyProjection,
  type SpendPeriod,
} from "@/lib/domain";
import { formatEuroCompact } from "@/lib/format";
import type { Subscription } from "@/lib/types";

export function DataView({
  subscriptions,
  onOpen,
  onSettings,
  active = true,
}: {
  subscriptions: Subscription[];
  onOpen: (id: string) => void;
  onSettings: () => void;
  active?: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [period, setPeriod] = useState<SpendPeriod>("month");
  useEffect(() => {
    const onFlip = () => setPeriod((cur) => (cur === "month" ? "year" : "month"));
    window.addEventListener("orbit-flip-period", onFlip);
    return () => window.removeEventListener("orbit-flip-period", onFlip);
  }, []);
  const slices = useMemo(
    () => spendByCategory(subscriptions, period),
    [subscriptions, period],
  );
  const monthly = activeMonthlyTotal(subscriptions);
  const yearly = yearlyProjection(subscriptions);
  const ranked = useMemo(() => {
    const rec = subscriptions
      .filter((s) => s.status === "active" && s.frequency !== "once")
      .map((s) => ({ s, v: cashInPeriod(s, period) }))
      .filter(({ v }) => v > 0)
      .sort((a, b) => b.v - a.v);
    return {
      top: rec.slice(0, 3),
      low: [...rec].reverse().slice(0, 3),
    };
  }, [subscriptions, period]);

  const total = slices.reduce((a, s) => a + s.value, 0);
  const selected = slices.find((x) => x.id === sel);

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-36">
        <ScreenHeader onSettings={onSettings} sticky />
        <div className="px-5">
        <div data-period-swipe className="relative mx-auto mt-2 flex h-[320px] w-full max-w-[320px] items-center justify-center">
          <ChartBackdrop />
          <div className="relative h-[236px] w-[236px]">
          <CategoryRing
            slices={slices}
            selected={sel}
            onSelect={setSel}
            active={active}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-[32px] font-semibold tabular-nums leading-none tracking-tight">
              {formatEuroCompact(selected ? selected.value : total)}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              {selected
                ? selected.label
                : period === "month"
                  ? "Addebiti di questo mese"
                  : "Addebiti di quest’anno"}
            </p>
            <p
              className={cn(
                "mt-1.5 text-[11px] text-cyan",
                !(selected && total > 0) && "invisible",
              )}
            >
              {selected && total > 0
                ? `${Math.round((selected.value / total) * 100)}% della spesa`
                : "\u00A0"}
            </p>
          </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <PeriodSwitch period={period} onChange={setPeriod} />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {slices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSel(sel === s.id ? null : s.id)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[11px] glow-tap pill-in",
                sel === s.id
                  ? "bg-white/12 text-fg"
                  : sel
                    ? "text-faint"
                    : "bg-white/6 text-muted",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{
                  background: s.color,
                  boxShadow: `0 0 8px ${s.color}`,
                  opacity: !sel || sel === s.id ? 1 : 0.3,
                }}
              />
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat
            label={period === "month" ? "Addebiti mese" : "Addebiti anno"}
            value={formatEuroCompact(total)}
          />
          <Stat label="Quota mese" value={formatEuroCompact(monthly)} />
          <Stat label="Quota anno" value={formatEuroCompact(yearly)} />
        </div>
        <p className="mt-2 text-center text-[10px] leading-snug text-muted">
          Addebiti = prelievi veri. Quota = costo spalmato (annuali ÷ 12).
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RankList title="Più costosi" items={ranked.top} onOpen={onOpen} total={total} />
          <RankList title="Più economici" items={ranked.low} onOpen={onOpen} total={total} />
        </div>
        </div>
      </div>
    </div>
  );
}

function easeInOut(p: number) {
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

function fitSal(
  a: { start: number; len: number; color: string },
  track: number,
) {
  if (a.len < 20) {
    return {
      start: Math.max(0, Math.min(track, a.start + a.len / 2)),
      len: 0.01,
      color: a.color,
      on: true as const,
    };
  }
  const len = Math.min(track, a.len);
  const start = Math.max(0, Math.min(Math.max(0, track - len), a.start));
  return { start, len, color: a.color, on: true as const };
}

type Arc = {
  id: string;
  color: string;
  start: number;
  len: number;
  bead: boolean;
};

function layoutArcs(
  slices: { id: string; value: number; color: string }[],
  track: number,
): Arc[] {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const majorVal = slices
    .filter((s) => s.value / total >= 0.055)
    .reduce((a, s) => a + s.value, 0);
  const use = majorVal > 0 ? majorVal : total;
  let acc = 0;
  return slices.map((s) => {
    const bead = majorVal > 0 && s.value / total < 0.055;
    if (bead) return { id: s.id, color: s.color, start: 0, len: 0, bead: true };
    const len = (s.value / use) * track;
    const row = { id: s.id, color: s.color, start: acc, len, bead: false };
    acc += len;
    return row;
  });
}

function CategoryRing({
  slices,
  selected,
  onSelect,
  active,
}: {
  slices: { id: string; value: number; color: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  active: boolean;
}) {
  const size = 236;
  const stroke = 14;
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const track = c * 0.75;
  const cx = size / 2;
  const [reveal, setReveal] = useState(0);
  const [drawn, setDrawn] = useState<Arc[]>([]);
  const drawnNow = useRef(drawn);
  drawnNow.current = drawn;
  const orderRef = useRef<string[]>([]);
  const [sal, setSal] = useState({ start: 0, len: 0, color: "#22d3ee", on: false });
  const salNow = useRef(sal);
  salNow.current = sal;

  const revealNow = useRef(0);
  revealNow.current = reveal;
  useEffect(() => {
    const to = active ? track : 0;
    const from = revealNow.current;
    if (Math.abs(from - to) < 0.5) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1000);
      const e = easeInOut(p);
      setReveal(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, track]);

  useEffect(() => {
    const ids = slices.map((s) => s.id);
    const prev = orderRef.current.filter((id) => ids.includes(id));
    const extra = ids.filter((id) => !prev.includes(id));
    orderRef.current = [...prev, ...extra];
    const ordered = orderRef.current
      .map((id) => slices.find((s) => s.id === id))
      .filter((s): s is (typeof slices)[number] => Boolean(s));
    const target = layoutArcs(ordered, track);
    const fromMap = new Map(drawnNow.current.map((a) => [a.id, a]));
    const from = target.map((a) => fromMap.get(a.id) ?? { ...a, len: 0 });
    if (!drawnNow.current.length) {
      setDrawn(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1000);
      const e = easeInOut(p);
      const lens = target.map((a, i) => {
        const f = from[i] ?? a;
        return f.len + (a.len - f.len) * e;
      });
      let acc = 0;
      setDrawn(
        target.map((a, i) => {
          const len = a.bead ? 0 : (lens[i] ?? 0);
          const row = { ...a, start: acc, len, bead: a.bead };
          if (!a.bead) acc += len;
          return row;
        }),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [slices, track]);

  useEffect(() => {
    if (!selected) return;
    const t = drawn.find((a) => a.id === selected);
    if (t && !t.bead && salNow.current.on) setSal(fitSal(t, track));
  }, [drawn, selected]);

  useEffect(() => {
    const hitArc = selected ? drawnNow.current.find((a) => a.id === selected) : undefined;
    const from = salNow.current;
    const to =
      hitArc && !hitArc.bead && hitArc.len >= 16
        ? fitSal(hitArc, track)
        : { ...from, on: false };
    if (!from.on && hitArc) {
      setSal(to);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 820);
      const e = 1 - (1 - p) ** 3;
      setSal({
        start: from.start + (to.start - from.start) * e,
        len: from.len + (to.len - from.len) * e,
        color: mixHex(from.color, to.color, e),
        on: to.on,
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const beads = drawn.filter((a) => a.bead);
  const beadOff = (i: number) =>
    track + ((c - track) * (i + 1)) / (beads.length + 1);
  const pt = (off: number) => ({
    x: cx + r * Math.cos(off / r),
    y: cx + r * Math.sin(off / r),
  });

  const hit = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / size;
    const lx = (e.clientX - rect.left) / scale;
    const ly = (e.clientY - rect.top) / scale;
    for (let i = 0; i < beads.length; i++) {
      const p = pt(beadOff(i));
      if (Math.hypot(lx - p.x, ly - p.y) <= stroke) {
        onSelect(selected === beads[i].id ? null : beads[i].id);
        return;
      }
    }
    const x = lx - cx;
    const y = ly - cx;
    const dist = Math.hypot(x, y);
    if (Math.abs(dist - r) > 22) return;
    let ang = Math.atan2(y, x);
    if (ang < 0) ang += Math.PI * 2;
    const startA = (135 * Math.PI) / 180;
    let rel = ang - startA;
    if (rel < 0) rel += Math.PI * 2;
    if (rel > (270 * Math.PI) / 180) return;
    const pos = (rel / ((270 * Math.PI) / 180)) * track;
    for (const a of drawn) {
      if (a.bead) continue;
      if (pos >= a.start && pos <= a.start + a.len) {
        onSelect(selected === a.id ? null : a.id);
        return;
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
      onClick={hit}
      className="absolute inset-0 cursor-pointer"
      aria-hidden
    >
      <g transform={`rotate(135 ${cx} ${cx})`}>
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(165,243,252,0.18)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${track} ${c}`}
        />
        {drawn.map((a) => {
          if (a.bead) return null;
          const vis = Math.max(0, Math.min(a.len, reveal - a.start));
          if (vis < 0.8) return null;
          return (
            <circle
              key={`arc-${a.id}`}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${vis} ${c}`}
              strokeDashoffset={-a.start}
              style={{
                opacity: selected ? 0.28 : 1,
                filter: selected ? "none" : glowFilter(a.color),
                transition: "opacity 380ms ease, filter 380ms ease",
              }}
            />
          );
        })}
        {reveal >= 8
          ? (() => {
              const vis = drawn
                .filter((a) => !a.bead)
                .map((a) => ({
                  ...a,
                  vis: Math.max(0, Math.min(a.len, reveal - a.start)),
                }))
                .filter((a) => a.vis >= 16);
              const a0 = vis[0];
              const a1 = vis[vis.length - 1];
              if (!a0 || !a1) return null;
              const pt = (off: number) => ({
                x: cx + r * Math.cos(off / r),
                y: cx + r * Math.sin(off / r),
              });
              const s = pt(a0.start);
              const e = pt(a1.start + a1.vis);
              return (
                <>
                  <circle cx={s.x} cy={s.y} r={stroke / 2} fill={a0.color} opacity={selected ? 0.28 : 1} />
                  <circle cx={e.x} cy={e.y} r={stroke / 2} fill={a1.color} opacity={selected ? 0.28 : 1} />
                </>
              );
            })()
          : null}
        {reveal > track * 0.6
          ? beads.map((a, i) => {
              const p = pt(beadOff(i));
              const on = selected === a.id;
              return (
                <circle
                  key={`bead-${a.id}`}
                  cx={p.x}
                  cy={p.y}
                  r={on ? stroke / 2 + 1.5 : stroke / 2 - 1}
                  fill={a.color}
                  opacity={!selected || on ? 1 : 0.28}
                  style={{
                    filter: !selected || on ? glowFilter(a.color) : "none",
                    transition: "opacity 380ms ease, r 380ms ease",
                  }}
                />
              );
            })
          : null}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={sal.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.01, sal.on ? sal.len : 0)} ${c}`}
          strokeDashoffset={-sal.start}
          style={{
            opacity: sal.on ? 1 : 0,
            filter: sal.on ? glowFilter(sal.color) : "none",
          }}
        />
      </g>
    </svg>
  );
}

function mixHex(a: string, b: string, t: number) {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  if (pa.length !== 6 || pb.length !== 6) return t > 0.5 ? b : a;
  const mix = (i: number) =>
    Math.round(parseInt(pa.slice(i, i + 2), 16) * (1 - t) + parseInt(pb.slice(i, i + 2), 16) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

function glowFilter(hex: string): string {
  return [
    `drop-shadow(0 0 6px ${hexAlpha(hex, "ff")})`,
    `drop-shadow(0 0 16px ${hexAlpha(hex, "cc")})`,
    `drop-shadow(0 0 32px ${hexAlpha(hex, "73")})`,
  ].join(" ");
}

function hexAlpha(hex: string, alphaHex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaHex}` : hex;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-2xl px-2 py-3 text-center">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-1 font-display text-[13px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function RankList({
  title,
  items,
  onOpen,
  total,
}: {
  title: string;
  items: { s: Subscription; v: number }[];
  onOpen: (id: string) => void;
  total: number;
}) {
  return (
    <div className="glass-soft rounded-lg p-3">
      <p className="mb-2 text-[11px] text-muted">{title}</p>
      <ul className="space-y-2">
        {items.map(({ s, v }) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpen(s.id)}
              className="flex w-full items-center gap-2 text-left"
            >
              <BrandBadge brandKey={s.brandKey} name={s.name} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{s.name}</span>
                <span className="text-[10px] text-muted">
                  {total > 0 ? Math.round((v / total) * 100) : 0}%
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
