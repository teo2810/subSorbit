import { useRef } from "react";
import { BrandBadge } from "@/lib/logos";
import { cn } from "@/lib/cn";
import {
  categoryLabel,
  frequencyShort,
  nextOccurrence,
  statusLabel,
} from "@/lib/domain";
import { formatDay, formatEuroCompact } from "@/lib/format";
import type { Subscription } from "@/lib/types";

export function SubCard({
  sub,
  onOpen,
  onQuickFocus,
}: {
  sub: Subscription;
  onOpen: () => void;
  onQuickFocus?: () => void;
}) {
  const timer = useRef<number | null>(null);
  const next = nextOccurrence(sub.nextRenewal, sub.frequency);
  const badge =
    sub.status === "active"
      ? "bg-ok/15 text-ok"
      : sub.status === "paused"
        ? "bg-warn/15 text-warn"
        : "bg-bad/15 text-bad";

  const startPress = () => {
    if (!onQuickFocus) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (navigator.vibrate) navigator.vibrate(18);
      onQuickFocus();
    }, 480);
  };
  const endPress = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "glow-tap relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-[#12182c] py-3 pr-3 pl-3 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
        sub.status !== "active" && "opacity-70",
      )}
    >
      <span
        className="pointer-events-none absolute right-1 top-1/2 max-w-[62%] -translate-y-1/2 truncate text-right font-display text-[34px] font-semibold leading-none text-white"
        style={{ opacity: 0.07, filter: "blur(1.4px)" }}
      >
        {sub.name}
      </span>
      <BrandBadge brandKey={sub.brandKey} name={sub.name} size={42} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-semibold">
            {sub.name}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              badge,
            )}
          >
            {statusLabel(sub.status)}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {categoryLabel(sub.category)} · {frequencyShort(sub.frequency)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-sm font-semibold tabular-nums">
          {formatEuroCompact(sub.price)}
        </span>
        <span className="block text-[11px] text-muted">{formatDay(next)}</span>
      </span>
    </button>
  );
}
