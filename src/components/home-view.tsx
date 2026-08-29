import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "./orbit-mark";
import { SubCard } from "./sub-card";
import { ChartBackdrop } from "./chart-backdrop";
import { cn } from "@/lib/cn";
import {
  activeMonthlyTotal,
  activePriceStats,
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

  const spend = useMemo(
    () => computePeriodSpend(subscriptions, period),
    [subscriptions, period],
  );
  const stats = useMemo(
    () => activePriceStats(subscriptions),
    [subscriptions],
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

  const pct = Math.round(spend.percent * 100);
  const items = lane === "subs" ? recurring : once;

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-36">
        <ScreenHeader onSettings={onSettings} sticky />

        <div className="px-5">
        <div className="relative mx-auto mt-2 flex h-[320px] w-full max-w-[320px] items-center justify-center">
          <ChartBackdrop />
          <div className="relative h-[236px] w-[236px]">
          <SpendRing percent={spend.percent} active={active} />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-[32px] font-semibold tabular-nums leading-none tracking-tight">
              {formatEuroCompact(spend.due)}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              {period === "month"
                ? "Abbonamenti di questo mese"
                : "Abbonamenti di quest’anno"}
            </p>
            <p className="mt-1.5 text-[11px] text-cyan">
              Pagato {pct}% · resta {formatEuroCompact(spend.remaining)}
            </p>
          </div>
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

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Attivi" value={String(stats.count)} />
          <Stat
            label={period === "month" ? "Spesa annuale" : "Spesa mensile"}
            value={formatEuroCompact(period === "month" ? yearly : monthly)}
          />
          <Stat label="Media" value={formatEuroCompact(stats.mid)} />
        </div>

        <div className="mt-5 flex rounded-full bg-white/6 p-1">
          <Chip wide active={lane === "subs"} onClick={() => setLane("subs")}>
            Abbonamenti
          </Chip>
          <Chip wide active={lane === "once"} onClick={() => setLane("once")}>
            Una tantum
          </Chip>
        </div>

        <div className="mt-3 space-y-2">
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
  useEffect(() => {
    if (!active) {
      setShown(0);
      return;
    }
    setShown(0);
    const t = window.setTimeout(() => setShown(percent), 80);
    return () => window.clearTimeout(t);
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
              "drop-shadow(0 0 4px rgba(165,243,252,0.95)) drop-shadow(0 0 14px rgba(34,211,238,0.7)) drop-shadow(0 0 28px rgba(34,211,238,0.35))",
            transition: "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </g>
    </svg>
  );
}

function Chip({
  active,
  onClick,
  children,
  wide,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 font-display text-xs font-medium glow-tap",
        wide && "flex-1",
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
      <p className="mt-1 font-display text-[13px] font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
