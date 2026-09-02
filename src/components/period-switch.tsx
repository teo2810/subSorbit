import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SpendPeriod } from "@/lib/domain";

const EASE = "left 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1)";

type Box = { l: number; w: number };

export function GlowSwitch<T extends string>({
  value,
  onChange,
  options,
  swipe,
  wide,
  compact,
  live = true,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  swipe?: boolean;
  wide?: boolean;
  compact?: boolean;
  live?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<Box | null>(null);
  const [armed, setArmed] = useState(false);

  const measure = (id: T): Box | null => {
    const track = trackRef.current;
    const btn = btnRefs.current[id];
    if (!track || !btn) return null;
    const tr = track.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    if (tr.width < 8 || br.width < 8) return null;
    return { l: br.left - tr.left, w: br.width };
  };

  useLayoutEffect(() => {
    if (!live) {
      setArmed(false);
      return;
    }
    const next = measure(value);
    if (next) setPill(next);
  }, [value, live]);

  useEffect(() => {
    if (!live || !pill || armed) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [live, pill, armed]);

  useEffect(() => {
    if (!live) return;
    const track = trackRef.current;
    if (!track) return;
    const snap = () => {
      const next = measure(value);
      if (next) setPill(next);
    };
    const ro = new ResizeObserver(snap);
    ro.observe(track);
    window.addEventListener("resize", snap);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", snap);
    };
  }, [live, value]);

  return (
    <div
      ref={trackRef}
      data-period-swipe={swipe ? "" : undefined}
      className="relative isolate flex rounded-full bg-white/6 p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-[3px] bottom-[3px] rounded-full bg-cyan"
        style={{
          left: pill?.l ?? 4,
          width: pill?.w ?? 0,
          opacity: pill ? 1 : 0,
          boxShadow: "0 0 12px rgba(56,232,255,0.4)",
          transition: armed ? EASE : "none",
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
              "relative z-10 rounded-full font-display font-medium glow-tap transition-colors duration-200",
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
  live = true,
}: {
  period: SpendPeriod;
  onChange: (p: SpendPeriod) => void;
  live?: boolean;
}) {
  return (
    <GlowSwitch
      value={period}
      onChange={onChange}
      swipe
      live={live}
      options={[
        { id: "month", label: "Mese" },
        { id: "year", label: "Anno" },
      ]}
    />
  );
}
