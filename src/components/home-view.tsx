import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenHeader } from "./orbit-mark";
import { SubCard } from "./sub-card";
import { ChartBackdrop } from "./chart-backdrop";
import { GlowSwitch, PeriodSwitch } from "./period-switch";
import { cn } from "@/lib/cn";
import {
  activeMonthlyTotal,
  computePeriodSpend,
  yearlyProjection,
  type SpendPeriod,
} from "@/lib/domain";
import { formatEuroCompact } from "@/lib/format";
import type { Subscription } from "@/lib/types";

const STATUS_ORDER: Record<Subscription["status"], number> = {
  active: 0,
  paused: 1,
  cancelled: 2,
};

export function HomeView({
  subscriptions,
  onOpen,
  onQuickFocus,
  onSettings,
  active = true,
}: {
  subscriptions: Subscription[];
  onOpen: (id: string) => void;
  onQuickFocus: (id: string) => void;
  onSettings: () => void;
  active?: boolean;
}) {
  const [period, setPeriod] = useState<SpendPeriod>("month");
  const [lane, setLane] = useState<"subs" | "once">("subs");
  const [sort, setSort] = useState<"renewal" | "price" | "name">("renewal");
  const [desc, setDesc] = useState(false);

  const spend = useMemo(
    () => computePeriodSpend(subscriptions, period),
    [subscriptions, period],
  );
  const monthly = activeMonthlyTotal(subscriptions);
  const yearly = yearlyProjection(subscriptions);

  const recurring = useMemo(
    () =>
      subscriptions
        .filter((s) => s.frequency !== "once")
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.price - a.price),
    [subscriptions],
  );
  const once = useMemo(
    () =>
      subscriptions
        .filter((s) => s.frequency === "once")
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.price - a.price),
    [subscriptions],
  );

  useEffect(() => {
    const onFlip = () => setPeriod((cur) => (cur === "month" ? "year" : "month"));
    window.addEventListener("orbit-flip-period", onFlip);
    return () => window.removeEventListener("orbit-flip-period", onFlip);
  }, []);

  const pct = Math.round(spend.percent * 100);
  const items = useMemo(() => {
    const list = (lane === "subs" ? recurring : once).slice();
    const dir = desc ? -1 : 1;
    list.sort((a, b) => {
      const st = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (st) return st;
      if (sort === "renewal") return dir * a.nextRenewal.localeCompare(b.nextRenewal);
      if (sort === "price") return dir * (a.price - b.price);
      return dir * a.name.localeCompare(b.name, "it", { sensitivity: "base" });
    });
    return list;
  }, [lane, recurring, once, sort, desc]);

  const tapSort = (id: typeof sort) => {
    if (sort === id) setDesc((d) => !d);
    else {
      setSort(id);
      setDesc(id === "price");
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-36">
        <ScreenHeader onSettings={onSettings} sticky />

        <div className="px-5">
        <div data-period-swipe className="relative mx-auto mt-2 flex h-[320px] w-full max-w-[320px] items-center justify-center">
          <ChartBackdrop />
          <div className="relative h-[236px] w-[236px]">
          <SpendRing percent={spend.percent} active={active} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-[32px] font-semibold tabular-nums leading-none tracking-tight">
              {formatEuroCompact(spend.paid)}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              {period === "month" ? "Usciti dal conto questo mese" : "Usciti dal conto quest’anno"}
            </p>
            <p className="mt-1.5 text-[11px] tabular-nums text-cyan">
              {formatEuroCompact(spend.due)} in scadenza · {pct}%
            </p>
          </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <PeriodSwitch period={period} onChange={setPeriod} live={active} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat
            label={period === "month" ? "Addebiti mese" : "Addebiti anno"}
            value={formatEuroCompact(spend.due)}
          />
          <Stat label="Quota mese" value={formatEuroCompact(monthly)} />
          <Stat label="Quota anno" value={formatEuroCompact(yearly)} />
        </div>
        <p className="mt-2 text-center text-[10px] leading-snug text-muted">
          Addebiti = prelievi veri. Quota = costo spalmato (annuali ÷ 12).
        </p>

        <div className="mt-5">
          <GlowSwitch
            wide
            live={active}
            value={lane}
            onChange={setLane}
            options={[
              { id: "subs", label: "Abbonamenti" },
              { id: "once", label: "Una tantum" },
            ]}
          />
        </div>

        <div className="mt-2 flex justify-end gap-1">
          {(
            [
              ["renewal", "Rinnovo"],
              ["price", "Prezzo"],
              ["name", "A–Z"],
            ] as const
          ).map(([id, label]) => {
            const on = sort === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => tapSort(id)}
                className={cn(
                  "h-7 rounded-full px-2.5 text-[10px] glow-tap",
                  on ? "bg-white/10 text-fg" : "text-faint",
                )}
              >
                {label}
                {on ? (desc ? " ↓" : " ↑") : ""}
              </button>
            );
          })}
        </div>

        <div className="mt-2 space-y-2">
          {items.length === 0 ? (
            <p className="pt-8 text-center text-sm text-muted">
              {lane === "subs"
                ? "Nessun abbonamento ricorrente."
                : "Nessun pagamento una tantum."}
            </p>
          ) : (
            items.map((s) => (
              <SubCard
                key={s.id}
                sub={s}
                onOpen={() => onOpen(s.id)}
                onQuickFocus={() => onQuickFocus(s.id)}
              />
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function SpendRing({ percent, active }: { percent: number; active: boolean }) {
  const size = 236;
  const stroke = 14;
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const track = c * 0.75;
  const [shown, setShown] = useState(0);
  const shownNow = useRef(0);
  shownNow.current = shown;
  useEffect(() => {
    if (!active) {
      setShown(0);
      return;
    }
    const from = shownNow.current;
    const to = percent;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 820);
      const e = 1 - (1 - p) ** 3;
      setShown(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent, active]);
  const fill = track * Math.min(1, Math.max(0, shown));
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible" aria-hidden>
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
        {fill >= 2 ? (
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${c}`}
          style={{
            filter:
              "drop-shadow(0 0 6px rgba(165,243,252,1)) drop-shadow(0 0 16px rgba(34,211,238,0.85)) drop-shadow(0 0 32px rgba(34,211,238,0.45))",
            transition: "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        ) : null}
      </g>
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-2xl px-2 py-3 text-center">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-1 font-display text-[13px] font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
