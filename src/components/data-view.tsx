import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "./orbit-mark";
import { ChartBackdrop } from "./chart-backdrop";
import { BrandBadge } from "@/lib/logos";
import { cn } from "@/lib/cn";
import {
  activeMonthlyTotal,
  monthlyCost,
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
  const slices = useMemo(
    () => spendByCategory(subscriptions, period),
    [subscriptions, period],
  );
  const monthly = activeMonthlyTotal(subscriptions);
  const yearly = yearlyProjection(subscriptions);
  const shownTotal = period === "year" ? yearly : monthly;
  const ranked = useMemo(() => {
    const rec = subscriptions
      .filter((s) => s.status === "active" && s.frequency !== "once")
      .map((s) => ({
        s,
        v: monthlyCost(s) * (period === "year" ? 12 : 1),
      }))
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
        <div className="relative mx-auto mt-1 h-[236px] w-[236px]">
          <ChartBackdrop />
          <CategoryRing
            slices={slices}
            selected={sel}
            onSelect={setSel}
            active={active}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-[32px] font-semibold tabular-nums leading-none tracking-tight">
              {formatEuroCompact(selected ? selected.value : shownTotal)}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              {selected
                ? selected.label
                : period === "month"
                  ? "Spesa di questo mese"
                  : "Spesa di quest’anno"}
            </p>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <div className="pill-in flex rounded-full bg-white/6 p-1">
            <Chip active={period === "month"} onClick={() => setPeriod("month")}>
              Mese
            </Chip>
            <Chip active={period === "year"} onClick={() => setPeriod("year")}>
              Anno
            </Chip>
          </div>
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
            label={period === "month" ? "Mensile" : "Annuale"}
            value={formatEuroCompact(shownTotal)}
          />
          <Stat
            label={period === "month" ? "Annuale" : "Mensile"}
            value={formatEuroCompact(period === "month" ? yearly : monthly)}
          />
          <Stat label="Categorie" value={String(slices.length)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RankList title="Più costosi" items={ranked.top} onOpen={onOpen} total={total} />
          <RankList title="Più economici" items={ranked.low} onOpen={onOpen} total={total} />
        </div>
        </div>
      </div>
    </div>
  );
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
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const [grow, setGrow] = useState(0);
  useEffect(() => {
    if (!active) {
      setGrow(0);
      return;
    }
    setGrow(0);
    const t = window.setTimeout(() => setGrow(1), 80);
    return () => window.clearTimeout(t);
  }, [active, slices]);

  const gap = 7;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
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
        {slices.map((s) => {
          const raw = (s.value / total) * track;
          const len = Math.max(0, raw - gap) * grow;
          const dashOff = -offset;
          offset += raw;
          const dim = Boolean(selected && selected !== s.id);
          return (
            <circle
              key={s.id}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={dim ? 8 : stroke + 2}
              strokeLinecap="round"
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={dashOff}
              opacity={dim ? 0.22 : 1}
              style={{
                cursor: "pointer",
                filter: dim
                  ? "none"
                  : `drop-shadow(0 0 6px ${s.color}) drop-shadow(0 0 14px ${s.color}cc)`,
                transition:
                  "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms, stroke-width 200ms",
              }}
              onClick={() => onSelect(selected === s.id ? null : s.id)}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 font-display text-xs font-medium glow-tap",
        active ? "bg-cyan text-void" : "text-muted",
      )}
    >
      {children}
    </button>
  );
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
