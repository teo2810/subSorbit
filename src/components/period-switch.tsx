import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SpendPeriod } from "@/lib/domain";

const EASE = "240ms cubic-bezier(0.22, 1, 0.36, 1)";

type Box = { l: number; w: number; stretch: boolean };

export function GlowSwitch<T extends string>({
  value,
  onChange,
  options,
  swipe,
  wide,
  compact,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  swipe?: boolean;
  wide?: boolean;
  compact?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevRef = useRef(value);
  const [pill, setPill] = useState<Box>({ l: 4, w: 72, stretch: false });

  const measure = (id: T) => {
    const track = trackRef.current;
    const btn = btnRefs.current[id];
    if (!track || !btn) return null;
    const tr = track.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return { l: br.left - tr.left, w: br.width };
  };

  const span = (a: T, b: T) => {
    const pa = measure(a);
    const pb = measure(b);
    if (!pa || !pb) return null;
    const l = Math.min(pa.l, pb.l);
    return { l, w: Math.max(pa.l + pa.w, pb.l + pb.w) - l };
  };

  useLayoutEffect(() => {
    const next = measure(value);
    if (!next) return;
    const from = prevRef.current;
    const jumped = from !== value;
    prevRef.current = value;
    if (!jumped) {
      setPill({ ...next, stretch: false });
      return;
    }
    const mid = span(from, value);
    if (!mid) {
      setPill({ ...next, stretch: false });
      return;
    }
    setPill({ ...mid, stretch: true });
    const t = window.setTimeout(() => setPill({ ...next, stretch: false }), 160);
    return () => window.clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const snap = () => {
      const next = measure(value);
      if (next) setPill({ ...next, stretch: false });
    };
    window.addEventListener("resize", snap);
    return () => window.removeEventListener("resize", snap);
  }, [value]);

  return (
    <div
      ref={trackRef}
      data-period-swipe={swipe ? "" : undefined}
      className="pill-in relative isolate flex rounded-full bg-white/6 p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-[3px] bottom-[3px] rounded-full bg-cyan"
        style={{
          left: pill.l,
          width: pill.w,
          boxShadow: pill.stretch
            ? "0 0 16px rgba(56,232,255,0.55)"
            : "0 0 10px rgba(56,232,255,0.35)",
          transition: `left ${EASE}, width ${EASE}, box-shadow 200ms ease`,
        }}
      />
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              btnRefs.current[opt.id] = el;
            }}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative z-10 rounded-full font-display font-medium glow-tap",
              compact ? "h-8 min-w-10 px-2 text-[11px]" : "h-9 px-4 text-xs",
              wide && "flex-1",
              !wide && !compact && "min-w-[72px]",
              active ? "text-void" : "text-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PeriodSwitch({
  period,
  onChange,
}: {
  period: SpendPeriod;
  onChange: (p: SpendPeriod) => void;
}) {
  return (
    <GlowSwitch
      value={period}
      onChange={onChange}
      swipe
      options={[
        { id: "month", label: "Mese" },
        { id: "year", label: "Anno" },
      ]}
    />
  );
}
