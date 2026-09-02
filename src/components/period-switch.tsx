import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SpendPeriod } from "@/lib/domain";

const EASE = "280ms cubic-bezier(0.22, 1, 0.36, 1)";

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
  const readyRef = useRef(false);
  const [pill, setPill] = useState<Box | null>(null);
  const [motion, setMotion] = useState(false);

  const measure = (id: T): Box | null => {
    const track = trackRef.current;
    const btn = btnRefs.current[id];
    if (!track || !btn) return null;
    const tr = track.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    if (tr.width < 8 || br.width < 8) return null;
    return { l: br.left - tr.left, w: br.width };
  };

  const place = (animate: boolean) => {
    const next = measure(value);
    if (!next) return;
    setMotion(animate && readyRef.current);
    setPill(next);
    readyRef.current = true;
  };

  useLayoutEffect(() => {
    if (!live) return;
    place(true);
  }, [value, live]);

  useEffect(() => {
    if (!live) return;
    const track = trackRef.current;
    if (!track) return;
    const snap = () => place(false);
    const ro = new ResizeObserver(snap);
    ro.observe(track);
    const id = requestAnimationFrame(() => requestAnimationFrame(snap));
    window.addEventListener("resize", snap);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
      window.removeEventListener("resize", snap);
    };
  }, [live, value]);

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
          left: pill?.l ?? 4,
          width: pill?.w ?? 0,
          opacity: pill ? 1 : 0,
          boxShadow: "0 0 10px rgba(56,232,255,0.35)",
          transition: motion
            ? `left ${EASE}, width ${EASE}, opacity 160ms ease`
            : "none",
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
