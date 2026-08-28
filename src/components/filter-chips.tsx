import { cn } from "@/lib/cn";
import type { StatusFilter } from "@/lib/types";

const CHIPS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "active", label: "Attivi" },
  { id: "paused", label: "In pausa" },
  { id: "cancelled", label: "Annullati" },
];

export function FilterChips({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1">
      {CHIPS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 font-display text-xs font-medium glow-tap",
              active
                ? "bg-cyan text-void"
                : "bg-white/6 text-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
